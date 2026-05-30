"""Scrape events from rausgegangen.de, Resident Advisor, and Luma — save all to events.db."""

import asyncio
import logging
import os
import re
from pathlib import Path

from dotenv import load_dotenv

from scraper import (
    BrowserManager,
    ConsoleCallback,
    LumaScraper,
    RausgegangenScraper,
    ResidentAdvisorScraper,
    warm_up_browser,
)
from scraper.core.database import init_db, save_event
from scraper.core.images import download_image

load_dotenv()
logging.basicConfig(level=logging.WARNING)

DB_PATH = os.getenv("DB_PATH", "events.db")
IMAGES_DIR = Path(os.getenv("IMAGES_DIR", "images"))
MAX_EVENTS = int(os.getenv("MAX_EVENTS", "10"))

SOURCES = [
    ("rausgegangen", "https://rausgegangen.de/en/muenchen/",  "browser"),
    ("luma",         "https://lu.ma/munich",                  "browser"),
    ("ra",           "https://ra.co/events/de/munich",        "api"),
]


def _slug(url: str) -> str:
    match = re.search(r"//[^/]+/(?:events?/)?([^/?#]+)", url or "")
    slug = match.group(1) if match else re.sub(r"[^\w-]", "-", url or "")
    return slug[:60] or "event"


async def _persist(events, label):
    inserted = updated = failed = 0
    for event in events:
        img_path = None
        if event.image_url:
            img_path = await download_image(event.image_url, _slug(event.url or ""), IMAGES_DIR)
        try:
            is_new = await save_event(event, image_path=img_path)
            inserted += is_new
            updated += not is_new
        except Exception as e:
            print(f"  [DB error] {event.url}: {e}")
            failed += 1
    print(f"  → {label}: {inserted} inserted, {updated} updated, {failed} failed")
    return inserted + updated


async def main() -> None:
    await init_db(DB_PATH)
    total = 0

    # --- API-based scrapers (no browser) ---
    ra_scraper = ResidentAdvisorScraper(callback=ConsoleCallback())
    _, ra_url, _ = next(s for s in SOURCES if s[0] == "ra")
    ra_events = await ra_scraper.scrape_listing(ra_url, max_events=MAX_EVENTS)
    total += await _persist(ra_events, "Resident Advisor")

    # --- Browser-based scrapers ---
    async with BrowserManager(headless=True) as bm:
        await warm_up_browser(bm.page)

        rg_scraper = RausgegangenScraper(bm.page, callback=ConsoleCallback())
        rg_events = await rg_scraper.scrape_listing(
            "https://rausgegangen.de/en/muenchen/", max_events=MAX_EVENTS
        )
        total += await _persist(rg_events, "rausgegangen.de")

        luma_scraper = LumaScraper(bm.page, callback=ConsoleCallback())
        luma_events = await luma_scraper.scrape_listing(
            "https://lu.ma/munich", max_events=MAX_EVENTS
        )
        total += await _persist(luma_events, "Luma")

    print(f"\nDone — {total} events in {DB_PATH}  |  images → {IMAGES_DIR}/")


if __name__ == "__main__":
    asyncio.run(main())
