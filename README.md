# berry

Async multi-site event scraper for Munich. Scrapes [rausgegangen.de](https://rausgegangen.de/en/muenchen/), [Resident Advisor](https://ra.co/events/de/munich), and [Luma](https://lu.ma/munich) — downloads images to Cloudflare R2 and persists everything to a local SQLite database.

## Supported sites

| Site | Method | Notes |
|---|---|---|
| rausgegangen.de | Browser + ld+json | DOM fallback for tags/categories/price |
| Resident Advisor | httpx + GraphQL API | No browser required |
| Luma | Browser + ld+json + DOM | DOM for address, tags, organizers, availability |

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

Edit `.env` and add your Cloudflare R2 credentials (see [Image storage](#image-storage) below).

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
| `IMAGES_DIR` | `images/` | Local fallback directory (used when R2 is not configured) |

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

## Image storage

Images are uploaded to **Cloudflare R2** when credentials are present in `.env`, and saved locally to `images/` otherwise.

### Setting up R2

1. Create a free [Cloudflare](https://cloudflare.com) account
2. Go to **R2 Object Storage** → **Create bucket** (e.g. `berry-images`)
3. Enable **Public Access** on the bucket to get a public URL
4. Go to **Manage R2 API Tokens** → **Create API Token** → **Object Read & Write**
5. Add to `.env`:

```
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
```

When configured, `image_path` in the DB contains a public URL:
```
https://pub-xxxx.r2.dev/mahala-disko-7.jpg
```

When not configured, `image_path` contains a local path:
```
images/mahala-disko-7.jpg
```

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
│   │   ├── images.py           # Async image downloader — local fallback
│   │   ├── r2.py               # Cloudflare R2 uploader (boto3)
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
│   ├── scrape_all_and_save.py  # All three sites → DB + R2
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
| Persistence | `core/database.py` | SQLite storage, upsert by URL |
| Images | `core/images.py`, `core/r2.py` | Local download or R2 upload |
| Output | `formatters/markdown.py` | Serialise events to Markdown |
| Callbacks | `callbacks.py` | Decouple progress reporting |

### Extraction strategy per site

**rausgegangen.de** — ld+json primary (title, dates, venue, price, image, description). Handles both `Offer` and `AggregateOffer` price types; falls back to `.event-detail-sidebar` DOM when ld+json prices are null. DOM for tags (`a.text-pill-outline[href*="/tags/"]`) and categories.

**Resident Advisor** — GraphQL API (`https://ra.co/graphql`). No browser needed. `content` → description, `promoters[0].name` → organizer (falls back to `admin.name`), `artists` → tags, `venue.area.name` → city. Listing URL parsed for country/city to look up the area ID dynamically.

**Luma** — ld+json for title, dates, price, image, description, `addressLocality` → city. DOM supplements: venue address from `.content-card` Location section, tags from `[class*="category"]`, organizers from "Hosted By" section (skips "Presented by"), `spots_remaining` from "N Spots Remaining" text, `registration_required` from "Approval Required" text.

### Data flow

```
ResidentAdvisorScraper          (no browser)
    └── GraphQL API → List[Event]

BrowserManager
    ├── RausgegangenScraper
    │       └── scrape_listing() → per-event scrape() → List[Event]
    └── LumaScraper
            └── scrape_listing() → ItemList URLs → per-event scrape() → List[Event]

For each event:
    R2 configured?
        yes → upload_image(url, slug) → R2 public URL → image_path
        no  → download_image(url, slug) → images/<slug>.ext → image_path
    save_event(event, image_path) → events.db (upsert by URL)
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
| `venue_address` | TEXT | Full street address with postal code |
| `venue_city` | TEXT | |
| `categories` | TEXT | JSON array |
| `tags` | TEXT | JSON array |
| `price` | TEXT | e.g. `13.32 EUR`, `Free`, `27,00 to 51,00 €` |
| `is_free` | INTEGER | 0/1 |
| `spots_remaining` | INTEGER | Luma only — null if unlimited/unknown |
| `registration_required` | INTEGER | Luma only — 1 if host approval needed |
| `image_url` | TEXT | Original remote URL |
| `image_path` | TEXT | R2 public URL or local `images/<slug>.ext` |
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

## Known Limitations

### Coverage
- **Supported sites are fixed** — only rausgegangen.de, Resident Advisor, and Luma. [Fever](https://feverup.com) is hard-blocked by their anti-bot system and cannot be scraped.
- **Tested for Munich only** — listing URLs, RA area lookups, and city assertions all target Munich. Other cities require changing the listing URLs and verifying selectors still hold.
- **RA listing window is 7 days ahead** — hardcoded in `ResidentAdvisorScraper.scrape_listing()`; extend the `timedelta` to query further into the future.

### Data quality
- **Organizer is a name string only** — no URL or profile link to the organizer's page.
- **Price format is not normalised** — rausgegangen returns raw sidebar text (`27,00 to 51,00 €`), RA returns formatted decimal (`13.32 EUR`). No single format across sources.
- **No cross-source deduplication** — the same real-world event appearing on both rausgegangen and RA will be stored as two separate rows.
- **`spots_remaining` and `registration_required` are Luma-only** — rausgegangen and RA do not expose this information in a scrapeable form.

### Performance
- **Browser-based scrapers are sequential** — Luma and rausgegangen visit each event page one at a time in a single browser context. Parallelism would require multiple browser instances.
- **No incremental scraping** — every run re-scrapes the full listing from the top. There is no mechanism to fetch only events added since the last run.

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
