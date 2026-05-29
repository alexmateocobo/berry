import pytest

from scraper import BrowserManager
from scraper.core.browser import BrowserManager as BM


@pytest.mark.unit
def test_browser_manager_requires_start():
    bm = BM()
    with pytest.raises(RuntimeError):
        _ = bm.page


@pytest.mark.integration
async def test_browser_starts_and_closes():
    async with BrowserManager(headless=True) as bm:
        assert bm.page is not None
        assert bm.context is not None
        assert bm.browser is not None


@pytest.mark.integration
async def test_new_page(browser):
    page = await browser.new_page()
    assert page is not None
    await page.close()


@pytest.mark.integration
async def test_navigate(browser):
    await browser.page.goto("https://example.com", wait_until="domcontentloaded")
    assert "example" in browser.page.url
