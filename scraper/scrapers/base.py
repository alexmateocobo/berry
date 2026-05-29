from __future__ import annotations

import logging
from typing import List, Optional

from playwright.async_api import ElementHandle, Page

from ..callbacks import ProgressCallback, SilentCallback
from ..core.exceptions import RateLimitError
from ..core.utils import (
    click_see_more_buttons,
    detect_rate_limit,
    element_exists,
    extract_all_text,
    extract_text_safe,
    get_attribute_safe,
    handle_modal_close,
    scroll_to_bottom,
    scroll_to_half,
    wait_for_navigation_complete,
)

logger = logging.getLogger(__name__)


class BaseScraper:
    def __init__(self, page: Page, callback: Optional[ProgressCallback] = None) -> None:
        self.page = page
        self.callback = callback or SilentCallback()

    async def navigate_and_wait(self, url: str) -> None:
        await self.page.goto(url, wait_until="domcontentloaded")
        await wait_for_navigation_complete(self.page)
        if await detect_rate_limit(self.page):
            raise RateLimitError(f"Rate limited while loading {url}", suggested_wait_time=300)

    async def safe_click(self, selector: str) -> bool:
        try:
            el = await self.page.query_selector(selector)
            if el and await el.is_visible():
                await el.click()
                return True
        except Exception as e:
            logger.debug("safe_click failed for '%s': %s", selector, e)
        return False

    async def safe_extract_text(self, selector: str, default: str = "") -> str:
        return await extract_text_safe(self.page, selector, default)

    async def get_attribute_safe(
        self, selector: str, attr: str, default: Optional[str] = None
    ) -> Optional[str]:
        return await get_attribute_safe(self.page, selector, attr, default)

    async def element_exists(self, selector: str, timeout: int = 2000) -> bool:
        return await element_exists(self.page, selector, timeout)

    async def count_elements(self, selector: str) -> int:
        try:
            elements = await self.page.query_selector_all(selector)
            return len(elements)
        except Exception:
            return 0

    async def extract_list_items(self, selector: str) -> List[str]:
        return await extract_all_text(self.page, selector)

    async def scroll_page_to_bottom(self) -> None:
        await scroll_to_bottom(self.page)

    async def scroll_page_to_half(self) -> None:
        await scroll_to_half(self.page)

    async def close_modals(self) -> None:
        await handle_modal_close(self.page)

    async def click_all_see_more_buttons(self, selector: str = "button[data-more]") -> None:
        await click_see_more_buttons(self.page, selector)

    async def wait_and_focus(self, selector: str) -> None:
        try:
            el = await self.page.wait_for_selector(selector, timeout=5000)
            if el:
                await el.scroll_into_view_if_needed()
        except Exception as e:
            logger.debug("wait_and_focus failed for '%s': %s", selector, e)
