"""Scrape events from rausgegangen.de, Resident Advisor, and Luma — save all to events.db.

Images are uploaded to Cloudflare R2 when R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY
are set in .env, otherwise saved locally to the images/ directory.
"""

import asyncio
import logging
import os
import re
from pathlib import Path
from urllib.parse import urlparse

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
from scraper.core.r2 import upload_image, _is_configured as r2_configured

load_dotenv()
logging.basicConfig(level=logging.WARNING)

DB_PATH = os.getenv("DB_PATH", "events.db")
IMAGES_DIR = Path(os.getenv("IMAGES_DIR", "images"))
MAX_EVENTS = int(os.getenv("MAX_EVENTS", "10"))

_USE_R2 = r2_configured()


def _slug(url: str) -> str:
    parts = [p for p in urlparse(url or "").path.split("/") if p]
    raw = parts[-1] if parts else url or "event"
    return re.sub(r"[^\w-]", "-", raw)[:60] or "event"


async def _store_image(image_url: str, slug: str) -> str | None:
    if _USE_R2:
        return await upload_image(image_url, slug)
    return await download_image(image_url, slug, IMAGES_DIR)


async def _persist(events, label):
    inserted = updated = failed = 0
    for event in events:
        img_path = None
        if event.image_url:
            img_path = await _store_image(event.image_url, _slug(event.url or ""))
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
    storage = "Cloudflare R2" if _USE_R2 else f"local ({IMAGES_DIR}/)"
    print(f"Image storage: {storage}\n")
    total = 0

    # --- API-based scrapers (no browser) ---
    ra_scraper = ResidentAdvisorScraper(callback=ConsoleCallback())
    ra_events = await ra_scraper.scrape_listing(
        "https://ra.co/events/de/munich", max_events=MAX_EVENTS
    )
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

    print(f"\nDone — {total} events in {DB_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
