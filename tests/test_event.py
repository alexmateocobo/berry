import pytest

from scraper import RausgegangenScraper, SilentCallback
from scraper.models.event import Event, Venue


# ------------------------------------------------------------------ #
# Unit tests — no browser required
# ------------------------------------------------------------------ #

@pytest.mark.unit
def test_event_model_defaults():
    event = Event()
    assert event.title is None
    assert event.categories == []
    assert event.tags == []


@pytest.mark.unit
def test_event_display_date_single():
    event = Event(start_date="2024-06-01", end_date="2024-06-01")
    assert event.display_date == "2024-06-01"


@pytest.mark.unit
def test_event_display_date_range():
    event = Event(start_date="2024-06-01", end_date="2024-06-03")
    assert event.display_date == "2024-06-01 – 2024-06-03"


@pytest.mark.unit
def test_event_to_dict():
    event = Event(title="Jazz Night", start_date="2024-06-01")
    d = event.to_dict()
    assert d["title"] == "Jazz Night"
    assert d["start_date"] == "2024-06-01"


@pytest.mark.unit
def test_event_url_any_domain():
    # URL validator removed — any URL is valid
    event = Event(url="https://ra.co/events/12345")
    assert event.url == "https://ra.co/events/12345"
    event2 = Event(url="https://lu.ma/abc123")
    assert event2.url == "https://lu.ma/abc123"


@pytest.mark.unit
def test_event_source_field():
    event = Event(title="Test", source="ra")
    assert event.source == "ra"


@pytest.mark.unit
def test_venue_model():
    venue = Venue(name="Muffatwerk", city="München")
    assert venue.name == "Muffatwerk"
    assert "Muffatwerk" in repr(venue)


@pytest.mark.unit
def test_event_repr():
    event = Event(title="Test", start_date="2024-01-01")
    assert "Test" in repr(event)


# ------------------------------------------------------------------ #
# Integration tests — require live browser
# ------------------------------------------------------------------ #

@pytest.mark.integration
@pytest.mark.slow
async def test_scrape_listing_page(browser, silent_callback):
    scraper = RausgegangenScraper(browser.page, callback=silent_callback)
    events = await scraper.scrape_listing(
        "https://rausgegangen.de/en/muenchen/",
        max_events=3,
    )
    assert len(events) > 0
    for event in events:
        assert isinstance(event, Event)
        assert event.url is not None
        assert event.source == "rausgegangen"
