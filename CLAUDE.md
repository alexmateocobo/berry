# CLAUDE.md — Berry (Munich Event Discovery App + Scraper)

Swipe-based event discovery app for Munich, plus the multi-site async scraper that feeds it.
The scraper targets rausgegangen.de, Resident Advisor, and Luma; images are stored on
Cloudflare R2 and data persists in SQLite. The mobile app (`mobile/`, React Native / Expo)
lets users swipe through events, match with friends, and plan nights out together.

## Quick start

```bash
pip install -r requirements-dev.txt
pip install -e .
playwright install chromium
cp .env.example .env   # then add R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY

# Unit tests (no browser, no network)
pytest -m unit

# Scrape all three sites → events.db, images → R2
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
`venue` (Venue sub-model), `categories`, `tags`, `price`, `is_free`,
`spots_remaining`, `registration_required`, `image_url`, `organizer`, `source`, `url`.

## Image storage

`core/r2.py` uploads images to Cloudflare R2 (bucket: `berry-images`) when
`R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` are set in `.env`.
Falls back to `core/images.py` (local `images/` folder) when credentials are absent.
`image_path` in the DB stores either the R2 public URL or the local file path.

R2 config (hardcoded in `r2.py`):
- Endpoint: `https://903653282238ba2ad8935f2bb358ef7e.r2.cloudflarestorage.com`
- Bucket: `berry-images`
- Public URL: `https://pub-31f12262f1024f31bfb9d383526b482c.r2.dev`

## Scraper notes

### rausgegangen.de
- Selectors in [scraper/scrapers/rausgegangen.py](scraper/scrapers/rausgegangen.py)
- Primary: ld+json structured data. DOM fallback for categories and tags (`a.text-pill-outline`)
- Price: handles both `Offer` (single price) and `AggregateOffer` (price range) ld+json types.
  Falls back to `.event-detail-sidebar` DOM when ld+json prices are null (external ticketing)
- Organizer: no ld+json field; uses venue name from `location.name` as fallback
- Update selectors when the site changes; prefer `[class*='...']` partial matches

### Resident Advisor
- No browser required — uses RA's public GraphQL API at `https://ra.co/graphql`
- Listing URL format: `https://ra.co/events/<country_code>/<city_slug>`
- Area ID for Munich = 151 (looked up dynamically via `area(areaUrlName, countryUrlCode)`)
- Fields: `content` → description, `promoters[0].name` → organizer (fallback: `admin.name`),
  `artists` → tags, `venue.area.name` → city

### Luma
- Listing page has an ItemList ld+json — used only to collect event URLs
- Each individual event page has a full Event ld+json (description, dates, image, price)
- DOM scraping supplements ld+json for: venue address (`.content-card` Location section),
  tags (`[class*="category"]`), organizer ("Hosted By" section — skips "Presented by"),
  `spots_remaining` (text "N Spots Remaining"), `registration_required` (text "Approval Required")
- City: `addressLocality` from ld+json (DOM address card gives region names, not city)

## Docs

- `docs/20260707_Berry_Pitch_Deck.pdf` — pitch deck (`docs/slides/cover.png` is the rendered cover shown in the README)

## Architecture

- All extraction methods return `None`/`[]` on failure — never raise
- Navigation/auth errors raise typed exceptions from `core/exceptions.py`
- Public API per scraper: `scrape(url)` and `scrape_listing(url, max_events)`
- `get_scraper(url, page)` in `scrapers/factory.py` dispatches by domain
- Session persistence: `BrowserManager(session_file="session.json")`
- DB: SQLite via `core/database.py` — WAL mode, upsert by URL
- Images: `core/r2.py` (R2 upload) or `core/images.py` (local fallback)
