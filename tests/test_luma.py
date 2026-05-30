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
def test_sd_venue():
    class FakePage: pass
    s = LS(FakePage())
    sd = {
        "location": {
            "@type": "Place",
            "name": "Terra",
            "address": {"streetAddress": "Maximilianstr. 1", "addressLocality": "München"},
        }
    }
    venue = s._sd_venue(sd)
    assert venue.name == "Terra"
    assert venue.city == "München"


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
def test_sd_organizer_list():
    class FakePage: pass
    s = LS(FakePage())
    sd = {"organizer": [{"@type": "Organization", "name": "Longevity Cities"}]}
    assert s._sd_organizer(sd) == "Longevity Cities"


@pytest.mark.unit
def test_event_from_sd_full():
    class FakePage: pass
    s = LS(FakePage())
    sd = {
        "name": "Longevity Munich Dinner",
        "startDate": "2026-05-30T18:30:00.000+02:00",
        "endDate": "2026-05-30T21:00:00.000+02:00",
        "description": "Health event in Munich.",
        "location": {"name": "Terra", "address": {"streetAddress": "Terra St", "addressLocality": "München"}},
        "image": ["https://images.lumacdn.com/test.png"],
        "offers": [{"price": 0, "priceCurrency": "usd"}],
        "organizer": [{"name": "Longevity Cities"}],
    }
    event = s._event_from_sd(sd, "https://lu.ma/test123")
    assert event.title == "Longevity Munich Dinner"
    assert event.start_date == "2026-05-30"
    assert event.start_time == "18:30"
    assert event.end_time == "21:00"
    assert event.venue.name == "Terra"
    assert event.is_free is True
    assert event.organizer == "Longevity Cities"
    assert event.source == "luma"


# ------------------------------------------------------------------ #
# Integration tests — require live browser
# ------------------------------------------------------------------ #

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


@pytest.mark.integration
@pytest.mark.slow
async def test_scrape_single_event(browser, silent_callback):
    scraper = LumaScraper(browser.page, callback=silent_callback)
    event = await scraper.scrape("https://lu.ma/ftj7e5ly")
    assert event.title is not None
    assert event.start_date is not None
    assert event.source == "luma"
