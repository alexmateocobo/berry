from __future__ import annotations


class ScraperException(Exception):
    pass


class AuthenticationError(ScraperException):
    pass


class RateLimitError(ScraperException):
    def __init__(self, message: str = "Rate limited", suggested_wait_time: int = 300):
        super().__init__(message)
        self.suggested_wait_time = suggested_wait_time


class ElementNotFoundError(ScraperException):
    pass


class PageNotFoundError(ScraperException):
    pass


class NetworkError(ScraperException):
    pass


class ScrapingError(ScraperException):
    pass
