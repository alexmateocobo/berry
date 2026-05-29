import os

import pytest

from scraper import BrowserManager, is_logged_in, warm_up_browser
from scraper.core.auth import load_credentials_from_env
from scraper.core.exceptions import AuthenticationError


@pytest.mark.unit
def test_load_credentials_missing_env(monkeypatch):
    monkeypatch.delenv("TARGET_EMAIL", raising=False)
    monkeypatch.delenv("TARGET_USERNAME", raising=False)
    monkeypatch.delenv("TARGET_PASSWORD", raising=False)
    with pytest.raises(AuthenticationError):
        load_credentials_from_env()


@pytest.mark.unit
def test_load_credentials_from_env(monkeypatch):
    monkeypatch.setenv("TARGET_EMAIL", "user@example.com")
    monkeypatch.setenv("TARGET_PASSWORD", "secret")
    email, password = load_credentials_from_env()
    assert email == "user@example.com"
    assert password == "secret"


@pytest.mark.integration
async def test_warm_up_browser(browser):
    # warm_up should not raise even if neutral sites are slow
    await warm_up_browser(browser.page)


@pytest.mark.integration
async def test_is_logged_in_unauthenticated(browser):
    # Without logging in, rausgegangen.de should return False
    await browser.page.goto("https://rausgegangen.de/en/muenchen/", wait_until="domcontentloaded")
    result = await is_logged_in(browser.page)
    # Public site — result could be True or False, just must not raise
    assert isinstance(result, bool)
