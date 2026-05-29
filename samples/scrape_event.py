"""Scrape a single event detail page and write Markdown output."""

import asyncio
import os
import sys

from dotenv import load_dotenv

from scraper import BrowserManager, ConsoleCallback, EventScraper, format_event_to_markdown, warm_up_browser

load_dotenv()

TARGET_URL = os.getenv("TARGET_URL", "https://rausgegangen.de/en/events/mahala-disko-7/")
SESSION_FILE = os.getenv("SESSION_FILE", "session.json")
OUTPUT_FILE = "output.md"


async def main() -> None:
    session = SESSION_FILE if os.path.exists(SESSION_FILE) else None

    async with BrowserManager(headless=False, slow_mo=30, session_file=session) as bm:
        if not session:
            print("No session file found — warming up browser (no auth required for public pages)")
            await warm_up_browser(bm.page)

        scraper = EventScraper(bm.page, callback=ConsoleCallback())
        event = await scraper.scrape(TARGET_URL)

        md = format_event_to_markdown(event)
        print("\n" + "=" * 60)
        print(md)
        print("=" * 60)

        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            f.write(md)
        print(f"\nSaved to {OUTPUT_FILE}")


if __name__ == "__main__":
    asyncio.run(main())
