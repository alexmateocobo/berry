from __future__ import annotations

import asyncio
import functools
import logging
from typing import Any, Callable, List, Optional, Tuple, Type

from playwright.async_api import ElementHandle, Page, TimeoutError as PlaywrightTimeoutError

from .exceptions import ElementNotFoundError, RateLimitError

logger = logging.getLogger(__name__)

_RATE_LIMIT_URL_PATTERNS = ("/checkpoint/", "/captcha/", "/authwall", "/429")
_RATE_LIMIT_TEXT_PATTERNS = ("too many requests", "unusual activity", "rate limit")


def retry_async(
    max_attempts: int = 3,
    backoff: float = 2.0,
    exceptions: Tuple[Type[Exception], ...] = (Exception,),
) -> Callable:
    def decorator(fn: Callable) -> Callable:
        @functools.wraps(fn)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            last_exc: Optional[Exception] = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return await fn(*args, **kwargs)
                except exceptions as e:
                    last_exc = e
                    if attempt < max_attempts:
                        wait = backoff ** attempt
                        logger.debug("Retry %d/%d after %.1fs: %s", attempt, max_attempts, wait, e)
                        await asyncio.sleep(wait)
            raise last_exc  # type: ignore[misc]

        return wrapper

    return decorator


async def detect_rate_limit(page: Page) -> bool:
    url = page.url
    if any(p in url for p in _RATE_LIMIT_URL_PATTERNS):
        return True
    try:
        content = await page.content()
        if any(phrase in content.lower() for phrase in _RATE_LIMIT_TEXT_PATTERNS):
            return True
        if await element_exists(page, "iframe[src*='captcha']", timeout=1000):
            return True
    except Exception:
        pass
    return False


async def wait_for_element_smart(
    page: Page, selector: str, timeout: int = 5000
) -> ElementHandle:
    try:
        el = await page.wait_for_selector(selector, timeout=timeout)
        if el is None:
            raise ElementNotFoundError(f"Selector '{selector}' returned None")
        return el
    except PlaywrightTimeoutError:
        raise ElementNotFoundError(
            f"Selector '{selector}' not found after {timeout}ms — site DOM may have changed"
        )


async def extract_text_safe(page: Page, selector: str, default: str = "") -> str:
    try:
        el = await page.query_selector(selector)
        if el is None:
            return default
        text = await el.text_content()
        return (text or "").strip() or default
    except Exception as e:
        logger.debug("extract_text_safe failed for '%s': %s", selector, e)
        return default


async def get_attribute_safe(
    page: Page, selector: str, attr: str, default: Optional[str] = None
) -> Optional[str]:
    try:
        el = await page.query_selector(selector)
        if el is None:
            return default
        value = await el.get_attribute(attr)
        return value if value is not None else default
    except Exception as e:
        logger.debug("get_attribute_safe failed for '%s'[%s]: %s", selector, attr, e)
        return default


async def element_exists(page: Page, selector: str, timeout: int = 2000) -> bool:
    try:
        el = await page.wait_for_selector(selector, timeout=timeout)
        return el is not None
    except Exception:
        return False


async def scroll_to_bottom(page: Page, pause_ms: int = 500) -> None:
    prev_height = -1
    while True:
        height = await page.evaluate("document.body.scrollHeight")
        if height == prev_height:
            break
        prev_height = height
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await asyncio.sleep(pause_ms / 1000)


async def scroll_to_half(page: Page) -> None:
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
    await asyncio.sleep(0.3)


async def is_page_loaded(page: Page) -> bool:
    state = await page.evaluate("document.readyState")
    return state == "complete"


async def click_see_more_buttons(page: Page, selector: str, max_clicks: int = 10) -> None:
    for _ in range(max_clicks):
        try:
            btn = await page.query_selector(selector)
            if not btn:
                break
            visible = await btn.is_visible()
            if not visible:
                break
            await btn.click()
            await asyncio.sleep(0.5)
        except Exception:
            break


async def handle_modal_close(page: Page) -> None:
    close_selectors = [
        "button[aria-label='Close']",
        "button[aria-label='Schließen']",
        ".modal-close",
        "[data-dismiss='modal']",
    ]
    for sel in close_selectors:
        try:
            btn = await page.query_selector(sel)
            if btn and await btn.is_visible():
                await btn.click()
                await asyncio.sleep(0.3)
                return
        except Exception:
            continue


async def wait_for_navigation_complete(page: Page) -> None:
    try:
        await page.wait_for_load_state("networkidle", timeout=10000)
    except Exception:
        await page.wait_for_load_state("domcontentloaded", timeout=10000)


async def extract_all_text(page: Page, selector: str) -> List[str]:
    try:
        elements = await page.query_selector_all(selector)
        results = []
        for el in elements:
            text = await el.text_content()
            if text and text.strip():
                results.append(text.strip())
        return results
    except Exception:
        return []
