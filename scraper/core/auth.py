from __future__ import annotations

import asyncio
import logging
import os
from typing import Optional, Tuple

from playwright.async_api import Page

from .exceptions import AuthenticationError

logger = logging.getLogger(__name__)

_WARMUP_URLS = [
    "https://www.google.com",
    "https://www.wikipedia.org",
]


async def warm_up_browser(page: Page) -> None:
    for url in _WARMUP_URLS:
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=15000)
            await asyncio.sleep(1)
            logger.debug("Warmed up: %s", url)
        except Exception as e:
            logger.debug("Warm-up visit failed for %s: %s", url, e)


async def login_with_credentials(page: Page, email: str, password: str) -> None:
    await page.goto("https://rausgegangen.de/en/login/", wait_until="domcontentloaded")

    try:
        await page.fill("input[name='email'], input[type='email']", email)
        await page.fill("input[name='password'], input[type='password']", password)
        await page.click("button[type='submit']")
        await page.wait_for_load_state("networkidle", timeout=15000)
    except Exception as e:
        raise AuthenticationError(f"Login form interaction failed: {e}") from e

    if not await is_logged_in(page):
        raise AuthenticationError("Login failed — credentials may be incorrect")
    logger.info("Logged in with credentials")


async def is_logged_in(page: Page) -> bool:
    # rausgegangen.de shows user avatar / account menu when authenticated
    selectors = [
        "a[href*='/account/']",
        "[data-testid='user-menu']",
        ".user-avatar",
    ]
    for sel in selectors:
        try:
            el = await page.query_selector(sel)
            if el:
                return True
        except Exception:
            continue
    return False


async def wait_for_manual_login(page: Page, timeout: int = 300) -> None:
    logger.info("Waiting for manual login (timeout=%ds)…", timeout)
    elapsed = 0
    while elapsed < timeout:
        if await is_logged_in(page):
            logger.info("Manual login detected")
            return
        await asyncio.sleep(5)
        elapsed += 5
    raise AuthenticationError(f"Manual login not completed within {timeout}s")


def load_credentials_from_env() -> Tuple[str, str]:
    from dotenv import load_dotenv

    load_dotenv()
    email = os.getenv("TARGET_EMAIL") or os.getenv("TARGET_USERNAME")
    password = os.getenv("TARGET_PASSWORD")
    if not email or not password:
        raise AuthenticationError("TARGET_EMAIL and TARGET_PASSWORD must be set in .env")
    return email, password
