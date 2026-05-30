# berry

Async event scraper for [rausgegangen.de](https://rausgegangen.de/en/muenchen/) — scrapes Munich event listings, downloads images, and persists everything to a local SQLite database.

## Features

- Scrapes event detail pages: title, description, dates, times, venue, price, tags, categories, image
- Extracts data from `ld+json` structured data (reliable, survives CSS class changes)
- Downloads and caches event images locally
- Persists to SQLite with upsert-by-URL deduplication
- Async throughout (Playwright + SQLAlchemy async + httpx)
- Markdown output formatter
- Callback system for progress reporting (silent / console / JSON log)

---

## Setup

**Requirements:** Python 3.8+

```bash
git clone https://github.com/alexmateocobo/berry
cd berry

pip install -r requirements-dev.txt
playwright install chromium
pip install -e .
```

Copy the environment template:

```bash
cp .env.example .env
```

---

## Quick start

### Scrape a single event

```bash
python samples/scrape_event.py
```

Override the target URL:

```bash
TARGET_URL="https://rausgegangen.de/en/events/mahala-disko-7/" python samples/scrape_event.py
```

### Scrape the Munich listing and save to database

```bash
python samples/scrape_and_save.py
```

Options via environment variables:

| Variable | Default | Description |
|---|---|---|
| `LISTING_URL` | Munich listing | Listing page to scrape |
| `MAX_EVENTS` | `20` | Max events to scrape per run |
| `DB_PATH` | `events.db` | SQLite database file path |
| `IMAGES_DIR` | `images/` | Directory for downloaded images |

```bash
MAX_EVENTS=50 DB_PATH=my_events.db python samples/scrape_and_save.py
```

### Query the database

```bash
sqlite3 events.db "SELECT title, start_date, price FROM events;"
```

Or open `events.db` in [DB Browser for SQLite](https://sqlitebrowser.org/) for a visual interface.

---

## Project structure

```
berry/
├── scraper/                    # Importable package
│   ├── __init__.py             # Public API exports
│   ├── callbacks.py            # Progress reporting (Silent / Console / JSONLog / Multi)
│   ├── core/
│   │   ├── auth.py             # Login, session checks, warm-up browser
│   │   ├── browser.py          # BrowserManager context manager
│   │   ├── database.py         # SQLAlchemy async engine, init_db(), save_event()
│   │   ├── exceptions.py       # Typed exception hierarchy
│   │   ├── images.py           # Async image downloader (httpx)
│   │   └── utils.py            # Retry, scroll, element helpers
│   ├── models/
│   │   └── event.py            # Event + Venue Pydantic models
│   ├── scrapers/
│   │   ├── base.py             # BaseScraper with shared browser operations
│   │   └── event.py            # EventScraper: scrape() and scrape_listing()
│   └── formatters/
│       └── markdown.py         # Event → Markdown formatter
├── samples/
│   ├── create_session.py       # Interactive login → saves session.json
│   ├── scrape_event.py         # Scrape a single event → output.md
│   ├── scrape_multiple.py      # Scrape listing → one .md file per event
│   └── scrape_and_save.py      # Scrape listing → download images → save to DB
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_browser.py
│   └── test_event.py
├── .env.example
├── pyproject.toml
└── requirements.txt
```

---

## Architecture

### Layers

| Layer | Files | Responsibility |
|---|---|---|
| Browser | `core/browser.py` | Playwright lifecycle, session persistence |
| Auth | `core/auth.py` | Login, session checks, browser warm-up |
| Utilities | `core/utils.py` | Retry decorator, scrolling, element helpers |
| Scraper | `scrapers/base.py`, `scrapers/event.py` | Page navigation and data extraction |
| Models | `models/event.py` | Pydantic data structures |
| Persistence | `core/database.py`, `core/images.py` | SQLite storage and image download |
| Output | `formatters/markdown.py` | Serialise events to Markdown |
| Callbacks | `callbacks.py` | Decouple progress reporting from scraping |

### Extraction strategy

Event data is extracted in two passes:

1. **`ld+json` structured data** (primary) — rausgegangen.de embeds a `schema.org/Event` block on every event page. This provides title, description, ISO dates, venue, price, and image URL in a stable machine-readable format that survives CSS changes.

2. **DOM selectors** (fallback / supplement) — tags and categories are read from `.text-pill-outline` pill links, which are not included in the structured data.

### Data flow

```
BrowserManager
    └── EventScraper.scrape_listing(url)
            ├── scroll listing until stable
            ├── collect /en/events/<slug>/ links
            └── for each URL:
                    EventScraper.scrape(url)
                        ├── parse ld+json → title, dates, venue, price, image_url
                        └── DOM → tags, categories
                    download_image(image_url, slug) → images/<slug>.jpg
                    save_event(event, image_path)   → events.db
```

### Database schema

Single `events` table, flat layout (no joins):

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `url` | TEXT UNIQUE | Deduplication key |
| `title` | TEXT | |
| `description` | TEXT | |
| `start_date` | TEXT | ISO date: `2026-05-29` |
| `end_date` | TEXT | |
| `start_time` | TEXT | `22:00` |
| `end_time` | TEXT | |
| `venue_name` | TEXT | Flattened from Venue |
| `venue_address` | TEXT | |
| `venue_city` | TEXT | |
| `categories` | TEXT | JSON array |
| `tags` | TEXT | JSON array |
| `price` | TEXT | e.g. `13.32 EUR` or `Free` |
| `is_free` | INTEGER | Boolean (0/1) |
| `image_url` | TEXT | Original remote URL |
| `image_path` | TEXT | Local path (`images/<slug>.jpg`) |
| `organizer` | TEXT | |
| `scraped_at` | TEXT | ISO timestamp |

WAL mode is enabled on every connection for safe concurrent reads alongside writes.

---

## Running tests

```bash
# Unit tests only (no browser required)
pytest -m unit

# All tests (requires live network)
pytest -m "unit or integration"
```

---

## Migrating to PostgreSQL

The database layer uses SQLAlchemy async. To switch, change one line in `core/database.py`:

```python
# SQLite (current)
url = f"sqlite+aiosqlite:///{db_path}"

# PostgreSQL
url = "postgresql+asyncpg://user:password@localhost/dbname"
```

Install `asyncpg` instead of `aiosqlite` and the rest of the code is unchanged.
