import asyncio
import os

import pytest

from scraper import BrowserManager, SilentCallback


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def browser():
    async with BrowserManager(headless=True) as bm:
        yield bm


@pytest.fixture(scope="session")
async def browser_with_session(browser):
    session_file = os.getenv("SESSION_FILE", "session.json")
    if not os.path.exists(session_file):
        pytest.skip("No session file — run samples/create_session.py first")
    await browser.load_session(session_file)
    yield browser


@pytest.fixture
def silent_callback():
    return SilentCallback()


@pytest.fixture
def test_event_urls():
    return [
        "https://rausgegangen.de/en/muenchen/",
    ]
