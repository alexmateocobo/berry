import pytest

from scraper import get_scraper
from scraper.core.exceptions import ScraperException
from scraper.scrapers.luma import LumaScraper
from scraper.scrapers.ra import ResidentAdvisorScraper
from scraper.scrapers.rausgegangen import RausgegangenScraper


class _FakePage:
    pass


@pytest.mark.unit
def test_factory_rausgegangen():
    scraper = get_scraper("https://rausgegangen.de/en/events/test/", page=_FakePage())
    assert isinstance(scraper, RausgegangenScraper)


@pytest.mark.unit
def test_factory_ra_no_page_needed():
    scraper = get_scraper("https://ra.co/events/de/munich")
    assert isinstance(scraper, ResidentAdvisorScraper)


@pytest.mark.unit
def test_factory_luma():
    scraper = get_scraper("https://lu.ma/munich", page=_FakePage())
    assert isinstance(scraper, LumaScraper)


@pytest.mark.unit
def test_factory_luma_com():
    scraper = get_scraper("https://luma.com/abc123", page=_FakePage())
    assert isinstance(scraper, LumaScraper)


@pytest.mark.unit
def test_factory_unsupported_raises():
    with pytest.raises(ScraperException):
        get_scraper("https://feverup.com/en/munich")


@pytest.mark.unit
def test_factory_browser_scraper_requires_page():
    with pytest.raises(ScraperException):
        get_scraper("https://rausgegangen.de/en/events/test/")


@pytest.mark.unit
def test_factory_luma_requires_page():
    with pytest.raises(ScraperException):
        get_scraper("https://lu.ma/munich")
