"""scraper — async event scraper for rausgegangen.de."""

__version__ = "0.1.0"

from .callbacks import (
    ConsoleCallback,
    JSONLogCallback,
    MultiCallback,
    ProgressCallback,
    SilentCallback,
)
from .core.auth import (
    is_logged_in,
    load_credentials_from_env,
    login_with_credentials,
    wait_for_manual_login,
    warm_up_browser,
)
from .core.browser import BrowserManager
from .core.exceptions import (
    AuthenticationError,
    ElementNotFoundError,
    NetworkError,
    PageNotFoundError,
    RateLimitError,
    ScraperException,
    ScrapingError,
)
from .formatters.markdown import format_event_to_markdown
from .models.event import Event, Venue
from .scrapers.event import EventScraper

__all__ = [
    # Browser
    "BrowserManager",
    # Auth
    "warm_up_browser",
    "login_with_credentials",
    "is_logged_in",
    "wait_for_manual_login",
    "load_credentials_from_env",
    # Exceptions
    "ScraperException",
    "AuthenticationError",
    "RateLimitError",
    "ElementNotFoundError",
    "PageNotFoundError",
    "NetworkError",
    "ScrapingError",
    # Scrapers
    "EventScraper",
    # Models
    "Event",
    "Venue",
    # Callbacks
    "ProgressCallback",
    "SilentCallback",
    "ConsoleCallback",
    "JSONLogCallback",
    "MultiCallback",
    # Formatters
    "format_event_to_markdown",
]
