import os

import pytest

from scraper import BrowserManager, SilentCallback


# Function-scoped browser avoids asyncio/subprocess lifecycle issues in Python 3.13
@pytest.fixture
async def browser():
    async with BrowserManager(headless=True) as bm:
        yield bm


@pytest.fixture
async def browser_with_session():
    session_file = os.getenv("SESSION_FILE", "session.json")
    if not os.path.exists(session_file):
        pytest.skip("No session file — run samples/create_session.py first")
    async with BrowserManager(headless=True, session_file=session_file) as bm:
        yield bm


@pytest.fixture
def silent_callback():
    return SilentCallback()


@pytest.fixture
def test_event_urls():
    return ["https://rausgegangen.de/en/muenchen/"]
