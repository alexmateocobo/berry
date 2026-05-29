"""Scrape all events from a listing page and write one Markdown file per event."""

import asyncio
import os
import re
from pathlib import Path

from dotenv import load_dotenv

from scraper import (
    BrowserManager,
    ConsoleCallback,
    EventScraper,
    Event,
    format_event_to_markdown,
    warm_up_browser,
)

load_dotenv()

LISTING_URL = os.getenv("LISTING_URL", "https://rausgegangen.de/en/muenchen/")
SESSION_FILE = os.getenv("SESSION_FILE", "session.json")
OUTPUT_DIR = Path("output")
MAX_EVENTS = int(os.getenv("MAX_EVENTS", "20"))
MAX_CONCURRENT = 1  # rausgegangen.de; be polite — single page context anyway


def _slug(event: Event) -> str:
    title = event.title or "event"
    slug = re.sub(r"[^\w\s-]", "", title.lower())
    slug = re.sub(r"[\s-]+", "-", slug).strip("-")
    return slug[:60] or "event"


async def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)
    session = SESSION_FILE if os.path.exists(SESSION_FILE) else None

    async with BrowserManager(headless=True, session_file=session) as bm:
        if not session:
            await warm_up_browser(bm.page)

        scraper = EventScraper(bm.page, callback=ConsoleCallback())
        events = await scraper.scrape_listing(LISTING_URL, max_events=MAX_EVENTS)

        for event in events:
            filename = OUTPUT_DIR / f"{_slug(event)}.md"
            filename.write_text(format_event_to_markdown(event), encoding="utf-8")
            print(f"  Saved {filename}")

        print(f"\nDone — {len(events)} events written to {OUTPUT_DIR}/")


if __name__ == "__main__":
    asyncio.run(main())
