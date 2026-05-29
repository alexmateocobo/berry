"""Interactive login → saves session.json for subsequent runs."""

import asyncio
import os

from dotenv import load_dotenv

from scraper import BrowserManager, warm_up_browser, wait_for_manual_login

load_dotenv()

SESSION_FILE = os.getenv("SESSION_FILE", "session.json")


async def main() -> None:
    async with BrowserManager(headless=False, slow_mo=50) as bm:
        print("Warming up browser…")
        await warm_up_browser(bm.page)

        print("Opening rausgegangen.de — please log in manually in the browser window.")
        await bm.page.goto("https://rausgegangen.de/en/login/", wait_until="domcontentloaded")

        await wait_for_manual_login(bm.page, timeout=300)

        await bm.save_session(SESSION_FILE)
        print(f"Session saved to {SESSION_FILE}")


if __name__ == "__main__":
    asyncio.run(main())
