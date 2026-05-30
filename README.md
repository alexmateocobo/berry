# berry

Async multi-site event scraper for Munich. Scrapes [rausgegangen.de](https://rausgegangen.de/en/muenchen/), [Resident Advisor](https://ra.co/events/de/munich), and [Luma](https://lu.ma/munich) — downloads images and persists everything to a local SQLite database.

## Supported sites

| Site | Method | Notes |
|---|---|---|
| rausgegangen.de | Browser + ld+json | DOM fallback for tags/categories |
| Resident Advisor | httpx + GraphQL API | No browser required |
| Luma | Browser + ld+json + DOM | DOM for address, tags, organizers |

---

## Setup

**Requirements:** Python 3.8+

```bash
git clone https://github.com/alexmateocobo/berry
cd berry

pip install -r requirements-dev.txt
pip install -e .
playwright install chromium
cp .env.example .env
```

---

## Quick start

### Scrape all three sites → database

```bash
python samples/scrape_all_and_save.py
```

| Variable | Default | Description |
|---|---|---|
| `MAX_EVENTS` | `10` | Events per site per run |
| `DB_PATH` | `events.db` | SQLite database file |
| `IMAGES_DIR` | `images/` | Local image directory |

```bash
MAX_EVENTS=20 python samples/scrape_all_and_save.py
```

### Scrape a single event (any supported URL)

```bash
TARGET_URL="https://rausgegangen.de/en/events/mahala-disko-7/" python samples/scrape_event.py
TARGET_URL="https://ra.co/events/2355312" python samples/scrape_event.py
TARGET_URL="https://lu.ma/ftj7e5ly" python samples/scrape_event.py
```

### Query the database

```bash
sqlite3 events.db "SELECT source, title, start_date, organizer FROM events;"
```

Or open `events.db` in [DB Browser for SQLite](https://sqlitebrowser.org/).

---

## Project structure

```
berry/
├── scraper/
│   ├── __init__.py             # Public API exports
│   ├── callbacks.py            # Silent / Console / JSONLog / Multi
│   ├── core/
│   │   ├── auth.py             # Login, session checks, browser warm-up
│   │   ├── browser.py          # BrowserManager context manager
│   │   ├── database.py         # SQLAlchemy async engine, init_db(), save_event()
│   │   ├── exceptions.py       # Typed exception hierarchy
│   │   ├── images.py           # Async image downloader (httpx)
│   │   └── utils.py            # Retry, scroll, element helpers
│   ├── models/
│   │   └── event.py            # Event + Venue Pydantic models
│   ├── scrapers/
│   │   ├── base.py             # BaseScraper — shared browser operations
│   │   ├── rausgegangen.py     # RausgegangenScraper
│   │   ├── ra.py               # ResidentAdvisorScraper (GraphQL)
│   │   ├── luma.py             # LumaScraper
│   │   └── factory.py          # get_scraper(url) — dispatch by domain
│   └── formatters/
│       └── markdown.py         # Event → Markdown
├── samples/
│   ├── scrape_event.py         # Single event → output.md
│   ├── scrape_multiple.py      # Listing → one .md per event
│   ├── scrape_and_save.py      # Single-site scrape → DB
│   ├── scrape_all_and_save.py  # All three sites → DB
│   └── create_session.py       # Interactive login → session.json
├── tests/
│   ├── conftest.py
│   ├── test_event.py           # rausgegangen + Event model
│   ├── test_ra.py
│   ├── test_luma.py
│   ├── test_factory.py
│   ├── test_auth.py
│   └── test_browser.py
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
| Scrapers | `scrapers/` | Site-specific extraction logic |
| Factory | `scrapers/factory.py` | Dispatch scraper by URL domain |
| Models | `models/event.py` | Pydantic data structures |
| Persistence | `core/database.py`, `core/images.py` | SQLite + image download |
| Output | `formatters/markdown.py` | Serialise events to Markdown |
| Callbacks | `callbacks.py` | Decouple progress reporting |

### Extraction strategy per site

**rausgegangen.de** — ld+json primary (title, dates, venue, price, image, description). DOM for tags and categories (`a.text-pill-outline[href*="/tags/"]`).

**Resident Advisor** — GraphQL API (`https://ra.co/graphql`). No browser needed. `content` → description, `promoters[0].name` → organizer, `artists` → tags. Listing URL parsed for country/city to look up the area ID dynamically.

**Luma** — ld+json for title, dates, price, image, description. DOM supplements: venue address from `.content-card` Location section (ld+json has venue display name in `streetAddress`), tags from `[class*="category"]`, organizers from "Hosted By" section (skips "Presented by" calendar owner).

### Data flow

```
ResidentAdvisorScraper          (no browser)
    └── GraphQL API → List[Event] → save_event() → events.db

BrowserManager
    ├── RausgegangenScraper
    │       └── scrape_listing() → per-event scrape() → List[Event]
    └── LumaScraper
            └── scrape_listing() → ItemList URLs → per-event scrape() → List[Event]

For each event:
    download_image(image_url, slug) → images/<slug>.ext
    save_event(event, image_path)   → events.db (upsert by URL)
```

### Database schema

Single `events` table, flat layout:

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | |
| `url` | TEXT UNIQUE | Deduplication key |
| `source` | TEXT | `rausgegangen`, `ra`, `luma` |
| `title` | TEXT | |
| `description` | TEXT | |
| `start_date` | TEXT | `2026-05-29` |
| `end_date` | TEXT | |
| `start_time` | TEXT | `22:00` |
| `end_time` | TEXT | |
| `venue_name` | TEXT | |
| `venue_address` | TEXT | Full street address |
| `venue_city` | TEXT | |
| `categories` | TEXT | JSON array |
| `tags` | TEXT | JSON array |
| `price` | TEXT | e.g. `13.32 EUR`, `Free`, `27,00 to 51,00 €` |
| `is_free` | INTEGER | 0/1 |
| `spots_remaining` | INTEGER | Luma only — null if unlimited/unknown |
| `registration_required` | INTEGER | Luma only — 1 if host approval needed |
| `image_url` | TEXT | Remote URL |
| `image_path` | TEXT | `images/<slug>.ext` |
| `organizer` | TEXT | |
| `scraped_at` | TEXT | ISO timestamp |

WAL mode enabled — safe concurrent reads during writes.

---

## Running tests

```bash
# Unit tests (no browser, no network)
pytest -m unit

# RA integration tests (network, no browser)
pytest tests/test_ra.py -m integration

# Full integration (browser + network)
pytest tests/test_luma.py tests/test_event.py -m integration
```

---

## Migrating to PostgreSQL

Change one line in `core/database.py`:

```python
# SQLite (current)
url = f"sqlite+aiosqlite:///{db_path}"

# PostgreSQL
url = "postgresql+asyncpg://user:password@localhost/dbname"
```

Install `asyncpg` instead of `aiosqlite` — everything else stays the same.
