# CLAUDE.md — rausgegangen.de Scraper

This project follows the architecture documented here. Target: **https://rausgegangen.de/en/muenchen/** (Munich events listing).

## Quick start

```bash
pip install -r requirements-dev.txt
playwright install chromium

# Run unit tests (no browser auth required)
pytest -m unit

# Scrape a single event
python samples/scrape_event.py

# Scrape the full Munich listing (first 20 events)
python samples/scrape_multiple.py
```

## Entity: Event

Fields: `title`, `description`, `start_date`, `end_date`, `start_time`, `end_time`, `venue` (Venue sub-model), `categories`, `tags`, `price`, `is_free`, `image_url`, `organizer`, `url`.

## Selectors

rausgegangen.de uses server-side-rendered HTML with class names that may change. Update selectors in [scraper/scrapers/event.py](scraper/scrapers/event.py) when the site updates. Prefer `[class*='...']` partial matches and `time[datetime]` structured data over exact class names.

## Architecture

See full architecture patterns in the original CLAUDE.md provided at project creation. Key rules:
- All extraction methods return `None`/`[]` on failure — never raise
- Navigation and auth errors raise typed exceptions from `core/exceptions.py`
- Public API: `scrape(url)` and `scrape_listing(url, max_events)`
- Session persistence: `BrowserManager(session_file="session.json")`
