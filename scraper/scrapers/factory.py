from __future__ import annotations

from typing import Optional
from urllib.parse import urlparse

from playwright.async_api import Page

from ..callbacks import ProgressCallback
from ..core.exceptions import ScraperException
from .luma import LumaScraper
from .ra import ResidentAdvisorScraper
from .rausgegangen import RausgegangenScraper


def get_scraper(
    url: str,
    page: Optional[Page] = None,
    callback: Optional[ProgressCallback] = None,
):
    """
    Return the right scraper for the given URL.

    Browser-based scrapers (rausgegangen, luma) require a Playwright page.
    API-based scrapers (ra) do not need a page.

    Supported domains:
      rausgegangen.de   → RausgegangenScraper
      ra.co             → ResidentAdvisorScraper
      lu.ma / luma.com  → LumaScraper
    """
    domain = urlparse(url).netloc.lower()

    if "rausgegangen.de" in domain:
        if page is None:
            raise ScraperException("RausgegangenScraper requires a Playwright page")
        return RausgegangenScraper(page, callback)

    if "ra.co" in domain:
        return ResidentAdvisorScraper(callback)

    if "lu.ma" in domain or "luma.com" in domain:
        if page is None:
            raise ScraperException("LumaScraper requires a Playwright page")
        return LumaScraper(page, callback)

    raise ScraperException(
        f"No scraper available for '{domain}'. "
        "Supported: rausgegangen.de, ra.co, lu.ma"
    )
