# CLAUDE.md — Munich Events Scraper

Multi-site async event scraper for Munich. Targets rausgegangen.de, Resident Advisor, and Luma.

## Quick start

```bash
pip install -r requirements-dev.txt
pip install -e .
playwright install chromium

# Unit tests (no browser, no network)
pytest -m unit

# Scrape all three sites → events.db + images/
python samples/scrape_all_and_save.py

# Scrape a single event (any supported URL)
TARGET_URL="https://rausgegangen.de/en/events/mahala-disko-7/" python samples/scrape_event.py
```

## Supported sites

| Site | Scraper | Method |
|---|---|---|
| rausgegangen.de | `RausgegangenScraper` | Browser + ld+json |
| Resident Advisor | `ResidentAdvisorScraper` | httpx GraphQL API (no browser) |
| Luma | `LumaScraper` | Browser + ld+json + DOM |

Use `get_scraper(url, page=page)` to dispatch automatically by URL.

## Entity: Event

Fields: `title`, `description`, `start_date`, `end_date`, `start_time`, `end_time`,
`venue` (Venue sub-model), `categories`, `tags`, `price`, `is_free`, `image_url`,
`organizer`, `source`, `url`.

## Scraper notes

### rausgegangen.de
- Selectors in [scraper/scrapers/rausgegangen.py](scraper/scrapers/rausgegangen.py)
- Primary: ld+json structured data. DOM fallback for categories and tags (`a.text-pill-outline`)
- Update selectors when the site changes; prefer `[class*='...']` partial matches

### Resident Advisor
- No browser required — uses RA's public GraphQL API at `https://ra.co/graphql`
- Listing URL format: `https://ra.co/events/<country_code>/<city_slug>`
- Area ID for Munich = 151 (looked up dynamically via `area(areaUrlName, countryUrlCode)`)
- Fields: `content` → description, `promoters[0].name` → organizer, `artists` → tags

### Luma
- Listing page has an ItemList ld+json — used only to collect event URLs
- Each individual event page has a full Event ld+json (description, dates, image, price)
- DOM scraping supplements ld+json for: venue address (`.content-card` Location section),
  tags (`[class*="category"]`), organizer ("Hosted By" section — skips "Presented by")

## Architecture

- All extraction methods return `None`/`[]` on failure — never raise
- Navigation/auth errors raise typed exceptions from `core/exceptions.py`
- Public API per scraper: `scrape(url)` and `scrape_listing(url, max_events)`
- `get_scraper(url, page)` in `scrapers/factory.py` dispatches by domain
- Session persistence: `BrowserManager(session_file="session.json")`
- DB: SQLite via `core/database.py` — WAL mode, upsert by URL
- Images: downloaded by `core/images.py` to `images/<slug>.ext`
