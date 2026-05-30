import pytest

from scraper import LumaScraper, SilentCallback
from scraper.models.event import Event
from scraper.scrapers.luma import LumaScraper as LS


# ------------------------------------------------------------------ #
# Unit tests — no browser required
# ------------------------------------------------------------------ #

@pytest.mark.unit
def test_sd_date():
    class FakePage: pass
    s = LS(FakePage())
    assert s._sd_date({"startDate": "2026-05-30T18:30:00.000+02:00"}, "startDate") == "2026-05-30"
    assert s._sd_date({}, "startDate") is None


@pytest.mark.unit
def test_sd_time():
    class FakePage: pass
    s = LS(FakePage())
    assert s._sd_time({"startDate": "2026-05-30T18:30:00.000+02:00"}, "startDate") == "18:30"
    assert s._sd_time({}, "startDate") is None


@pytest.mark.unit
def test_sd_image_list():
    class FakePage: pass
    s = LS(FakePage())
    sd = {"image": ["https://images.lumacdn.com/test.png", "https://images.lumacdn.com/other.png"]}
    assert s._sd_image(sd) == "https://images.lumacdn.com/test.png"


@pytest.mark.unit
def test_sd_price_free():
    class FakePage: pass
    s = LS(FakePage())
    sd = {"offers": [{"price": 0, "priceCurrency": "usd"}]}
    assert s._sd_price(sd) == "Free"
    assert s._sd_is_free(sd) is True


@pytest.mark.unit
def test_sd_price_paid():
    class FakePage: pass
    s = LS(FakePage())
    sd = {"offers": [{"price": 15.0, "priceCurrency": "EUR"}]}
    assert s._sd_price(sd) == "15.00 EUR"
    assert s._sd_is_free(sd) is False


@pytest.mark.unit
def test_sd_date_with_offset():
    class FakePage: pass
    s = LS(FakePage())
    # Offset timezone marker should not bleed into the date
    assert s._sd_date({"startDate": "2026-05-30T18:30:00.000+02:00"}, "startDate") == "2026-05-30"


@pytest.mark.unit
def test_sd_price_missing_offers():
    class FakePage: pass
    s = LS(FakePage())
    assert s._sd_price({}) is None
    assert s._sd_is_free({}) is None


# ------------------------------------------------------------------ #
# Integration tests — require live browser
# ------------------------------------------------------------------ #

_MUNICH = {"munich", "münchen"}

@pytest.mark.integration
@pytest.mark.slow
async def test_scrape_listing_munich(browser, silent_callback):
    scraper = LumaScraper(browser.page, callback=silent_callback)
    events = await scraper.scrape_listing("https://lu.ma/munich", max_events=3)
    assert len(events) > 0
    for event in events:
        assert isinstance(event, Event)
        assert event.title is not None
        assert event.source == "luma"
        assert event.url is not None
        if event.venue:
            assert (event.venue.city or "").lower() in _MUNICH, \
                f"Expected Munich city, got {event.venue.city!r} for {event.title!r}"


@pytest.mark.integration
@pytest.mark.slow
async def test_scrape_single_event(browser, silent_callback):
    scraper = LumaScraper(browser.page, callback=silent_callback)
    event = await scraper.scrape("https://lu.ma/ftj7e5ly")
    assert event.title is not None
    assert event.start_date is not None
    assert event.source == "luma"
