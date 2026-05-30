"""Scrape events from a listing page, download images, and persist to SQLite."""

import asyncio
import logging
import os
import re
from pathlib import Path

from dotenv import load_dotenv

from scraper import BrowserManager, ConsoleCallback, EventScraper, warm_up_browser
from scraper.core.database import init_db, save_event
from scraper.core.images import download_image

load_dotenv()
logging.basicConfig(level=logging.WARNING)

LISTING_URL = os.getenv("LISTING_URL", "https://rausgegangen.de/en/muenchen/")
SESSION_FILE = os.getenv("SESSION_FILE", "session.json")
DB_PATH = os.getenv("DB_PATH", "events.db")
IMAGES_DIR = Path(os.getenv("IMAGES_DIR", "images"))
MAX_EVENTS = int(os.getenv("MAX_EVENTS", "20"))


def _slug_from_url(url: str) -> str:
    match = re.search(r"/events/([^/?#]+)", url)
    return match.group(1) if match else re.sub(r"[^\w-]", "-", url)[-60:]


async def main() -> None:
    await init_db(DB_PATH)

    session = SESSION_FILE if os.path.exists(SESSION_FILE) else None
    async with BrowserManager(headless=True, session_file=session) as bm:
        if not session:
            await warm_up_browser(bm.page)

        scraper = EventScraper(bm.page, callback=ConsoleCallback())
        events = await scraper.scrape_listing(LISTING_URL, max_events=MAX_EVENTS)

    inserted = updated = failed = 0
    for event in events:
        image_path = None
        if event.image_url:
            image_path = await download_image(event.image_url, _slug_from_url(event.url), IMAGES_DIR)

        try:
            is_new = await save_event(event, image_path=image_path)
            if is_new:
                inserted += 1
            else:
                updated += 1
        except Exception as e:
            print(f"  [DB error] {event.url}: {e}")
            failed += 1

    print(f"\nDone — {inserted} inserted, {updated} updated, {failed} failed")
    print(f"Database: {DB_PATH}")
    print(f"Images:   {IMAGES_DIR}/")


if __name__ == "__main__":
    asyncio.run(main())
