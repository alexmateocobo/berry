import pytest

from scraper import ResidentAdvisorScraper, SilentCallback
from scraper.models.event import Event
from scraper.scrapers.ra import ResidentAdvisorScraper as RAScraper


# ------------------------------------------------------------------ #
# Unit tests — no network required
# ------------------------------------------------------------------ #

@pytest.mark.unit
def test_parse_event_id():
    s = RAScraper()
    assert s._parse_event_id("https://ra.co/events/2355312") == "2355312"
    assert s._parse_event_id("https://ra.co/events/de/munich") is None


@pytest.mark.unit
def test_parse_listing_url():
    s = RAScraper()
    country, city = s._parse_listing_url("https://ra.co/events/de/munich")
    assert country == "de"
    assert city == "munich"


@pytest.mark.unit
def test_parse_listing_url_invalid():
    s = RAScraper()
    from scraper.core.exceptions import ScrapingError
    with pytest.raises(ScrapingError):
        s._parse_listing_url("https://ra.co/events")


@pytest.mark.unit
def test_event_from_raw_basic():
    s = RAScraper()
    raw = {
        "id": "2355312",
        "title": "Solomun [live] in Munich",
        "date": "2026-05-30T00:00:00.000",
        "startTime": "2026-05-30T23:00:00.000",
        "endTime": "2026-05-31T06:00:00.000",
        "contentUrl": "/events/2355312",
        "cost": "55",
        "images": [{"filename": "https://images.ra.co/test.jpg"}],
        "venue": {"name": "BLITZ", "address": "Museumsinsel 1, München", "area": {"name": "Munich"}, "country": {"name": "Germany"}},
        "artists": [{"name": "Solomun"}, {"name": "Fedele"}],
    }
    event = s._event_from_raw(raw)
    assert event.title == "Solomun [live] in Munich"
    assert event.start_date == "2026-05-30"
    assert event.start_time == "23:00"
    assert event.end_time == "06:00"
    assert event.venue.name == "BLITZ"
    assert event.venue.city == "Munich"
    assert "Solomun" in event.tags
    assert event.price == "55"
    assert event.image_url == "https://images.ra.co/test.jpg"
    assert event.source == "ra"
    assert event.url == "https://ra.co/events/2355312"


@pytest.mark.unit
def test_event_from_raw_free():
    s = RAScraper()
    raw = {
        "id": "1", "title": "Free Party", "date": "2026-06-01T00:00:00.000",
        "startTime": "2026-06-01T22:00:00.000", "endTime": "2026-06-02T04:00:00.000",
        "contentUrl": "/events/1", "cost": "0",
        "images": [], "venue": None, "artists": [],
    }
    event = s._event_from_raw(raw)
    assert event.is_free is True


@pytest.mark.unit
def test_event_from_raw_no_cost():
    s = RAScraper()
    raw = {
        "id": "2", "title": "TBA", "date": "2026-06-01T00:00:00.000",
        "startTime": "2026-06-01T22:00:00.000", "endTime": "2026-06-02T04:00:00.000",
        "contentUrl": "/events/2", "cost": "",
        "images": [], "venue": None, "artists": [],
    }
    event = s._event_from_raw(raw)
    assert event.price is None
    assert event.is_free is None


# ------------------------------------------------------------------ #
# Integration tests — require live network
# ------------------------------------------------------------------ #

@pytest.mark.integration
async def test_lookup_area_id_munich():
    s = RAScraper()
    area_id = await s._lookup_area_id("munich", "de")
    assert area_id == 151


_MUNICH = {"munich", "münchen"}

@pytest.mark.integration
async def test_scrape_listing_munich():
    s = RAScraper(callback=SilentCallback())
    events = await s.scrape_listing("https://ra.co/events/de/munich", max_events=3)
    assert len(events) > 0
    for event in events:
        assert isinstance(event, Event)
        assert event.title is not None
        assert event.source == "ra"
        assert event.url is not None and "ra.co" in event.url
        assert event.venue is not None
        assert (event.venue.city or "").lower() in _MUNICH, \
            f"Expected Munich city, got {event.venue.city!r} for {event.title!r}"


@pytest.mark.integration
async def test_scrape_single_event():
    s = RAScraper(callback=SilentCallback())
    event = await s.scrape("https://ra.co/events/2355312")
    assert event.title is not None
    assert event.start_date is not None
    assert event.source == "ra"
