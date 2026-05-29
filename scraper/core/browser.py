from __future__ import annotations

import json
import logging
from typing import Optional

from playwright.async_api import (
    Browser,
    BrowserContext,
    Page,
    async_playwright,
)

logger = logging.getLogger(__name__)


class BrowserManager:
    def __init__(
        self,
        headless: bool = True,
        slow_mo: int = 0,
        viewport: Optional[dict] = None,
        user_agent: Optional[str] = None,
        session_file: Optional[str] = None,
    ) -> None:
        self._headless = headless
        self._slow_mo = slow_mo
        self._viewport = viewport or {"width": 1920, "height": 1080}
        self._user_agent = user_agent
        self._session_file = session_file
        self._playwright = None
        self._browser: Optional[Browser] = None
        self._context: Optional[BrowserContext] = None
        self._page: Optional[Page] = None

    async def __aenter__(self) -> "BrowserManager":
        await self.start()
        return self

    async def __aexit__(self, *args: object) -> None:
        await self.close()

    async def start(self) -> None:
        self._playwright = await async_playwright().start()
        self._browser = await self._playwright.chromium.launch(
            headless=self._headless,
            slow_mo=self._slow_mo,
        )

        context_kwargs: dict = {"viewport": self._viewport}
        if self._user_agent:
            context_kwargs["user_agent"] = self._user_agent
        if self._session_file:
            try:
                context_kwargs["storage_state"] = self._session_file
                logger.info("Loaded session from %s", self._session_file)
            except Exception as e:
                logger.warning("Could not load session file: %s", e)

        self._context = await self._browser.new_context(**context_kwargs)
        self._page = await self._context.new_page()
        logger.debug("Browser started (headless=%s)", self._headless)

    async def close(self) -> None:
        if self._context:
            await self._context.close()
        if self._browser:
            await self._browser.close()
        if self._playwright:
            await self._playwright.stop()
        logger.debug("Browser closed")

    @property
    def page(self) -> Page:
        if self._page is None:
            raise RuntimeError("Browser not started — use async with BrowserManager()")
        return self._page

    @property
    def context(self) -> BrowserContext:
        if self._context is None:
            raise RuntimeError("Browser not started — use async with BrowserManager()")
        return self._context

    @property
    def browser(self) -> Browser:
        if self._browser is None:
            raise RuntimeError("Browser not started — use async with BrowserManager()")
        return self._browser

    async def new_page(self) -> Page:
        return await self.context.new_page()

    async def save_session(self, filepath: str) -> None:
        state = await self.context.storage_state()
        with open(filepath, "w") as f:
            json.dump(state, f)
        logger.info("Session saved to %s", filepath)

    async def load_session(self, filepath: str) -> None:
        # Recreate context with saved storage state
        await self._context.close()
        self._context = await self._browser.new_context(
            storage_state=filepath,
            viewport=self._viewport,
        )
        self._page = await self._context.new_page()
        logger.info("Session loaded from %s", filepath)

    async def set_cookie(self, name: str, value: str, domain: str) -> None:
        await self.context.add_cookies([{"name": name, "value": value, "domain": domain, "path": "/"}])
