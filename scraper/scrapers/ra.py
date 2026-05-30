from __future__ import annotations

import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import httpx

from ..callbacks import ProgressCallback, SilentCallback
from ..core.exceptions import PageNotFoundError, ScrapingError
from ..models.event import Event, Venue

logger = logging.getLogger(__name__)

_RA_GRAPHQL = "https://ra.co/graphql"
_RA_BASE = "https://ra.co"
_HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Referer": "https://ra.co/",
    "Origin": "https://ra.co",
}

_EVENT_FIELDS = """
    id title date startTime endTime contentUrl cost content
    images { filename }
    venue { name address country { name } }
    artists { name }
    promoters { name contentUrl }
"""

_LISTINGS_QUERY = """
query GET_EVENT_LISTINGS($filters: FilterInputDtoInput, $pageSize: Int, $page: Int) {
  eventListings(filters: $filters, pageSize: $pageSize, page: $page) {
    data {
      event {""" + _EVENT_FIELDS + """}
    }
    totalResults
  }
}
"""

_EVENT_QUERY = """
query GET_EVENT($id: ID!) {
  event(id: $id) {""" + _EVENT_FIELDS + """}
}
"""

_AREA_QUERY = """
query GET_AREA($areaUrlName: String, $countryUrlCode: String) {
  area(areaUrlName: $areaUrlName, countryUrlCode: $countryUrlCode) { id name urlName }
}
"""


class ResidentAdvisorScraper:
    """
    Scrapes Resident Advisor via its public GraphQL API.
    Does not require a browser — uses httpx directly.

    Listing URL format:  https://ra.co/events/<country>/<city>
    Event URL format:    https://ra.co/events/<id>
    """

    def __init__(self, callback: Optional[ProgressCallback] = None) -> None:
        self.callback = callback or SilentCallback()

    async def scrape(self, url: str) -> Event:
        """Scrape a single RA event by URL (https://ra.co/events/<id>)."""
        await self.callback.on_start(url)
        try:
            event_id = self._parse_event_id(url)
            if not event_id:
                raise PageNotFoundError(f"Could not parse event ID from URL: {url}")

            data = await self._gql(_EVENT_QUERY, {"id": event_id})
            raw = data.get("data", {}).get("event")
            if not raw:
                raise PageNotFoundError(f"Event {event_id} not found on RA")

            event = self._event_from_raw(raw)
            await self.callback.on_complete(event)
            return event

        except Exception as e:
            await self.callback.on_error(url, e)
            raise

    async def scrape_listing(
        self,
        listing_url: str,
        max_events: Optional[int] = None,
    ) -> List[Event]:
        """
        Scrape RA events for a city listing page.
        listing_url format: https://ra.co/events/<country_code>/<city_slug>
        Fetches events for the next 7 days.
        """
        await self.callback.on_start(listing_url)
        try:
            country_code, city_slug = self._parse_listing_url(listing_url)
            area_id = await self._lookup_area_id(city_slug, country_code)
            if area_id is None:
                raise ScrapingError(f"Could not find RA area for {city_slug}/{country_code}")

            today = datetime.now(timezone.utc).date()
            end_date = today + timedelta(days=7)

            page_size = min(max_events or 50, 50)
            data = await self._gql(_LISTINGS_QUERY, {
                "filters": {
                    "areas": {"eq": area_id},
                    "listingDate": {
                        "gte": today.isoformat(),
                        "lte": end_date.isoformat(),
                    },
                },
                "pageSize": page_size,
                "page": 1,
            })

            listings = data.get("data", {}).get("eventListings", {}).get("data", [])
            events: List[Event] = []
            total = len(listings)
            for i, listing in enumerate(listings):
                await self.callback.on_progress(
                    f"Parsing event {i + 1}/{total}", i + 1, total
                )
                raw = listing.get("event")
                if raw:
                    try:
                        events.append(self._event_from_raw(raw))
                    except Exception as e:
                        logger.warning("Failed to parse RA event: %s", e)

            await self.callback.on_complete(events)
            return events

        except Exception as e:
            await self.callback.on_error(listing_url, e)
            raise

    # ------------------------------------------------------------------ #
    # GraphQL client
    # ------------------------------------------------------------------ #

    async def _gql(self, query: str, variables: Optional[Dict] = None) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=20, headers=_HEADERS) as client:
            response = await client.post(
                _RA_GRAPHQL,
                json={"query": query, "variables": variables or {}},
            )
            response.raise_for_status()
            data = response.json()
            if "errors" in data:
                logger.warning("RA GraphQL errors: %s", data["errors"])
            return data

    # ------------------------------------------------------------------ #
    # URL parsing
    # ------------------------------------------------------------------ #

    def _parse_event_id(self, url: str) -> Optional[str]:
        match = re.search(r"/events/(\d+)", url)
        return match.group(1) if match else None

    def _parse_listing_url(self, url: str) -> tuple:
        # https://ra.co/events/de/munich → ("de", "munich")
        match = re.search(r"/events/([a-z]{2})/([a-z0-9-]+)", url)
        if match:
            return match.group(1), match.group(2)
        raise ScrapingError(f"Expected URL format: https://ra.co/events/<country>/<city>, got: {url}")

    async def _lookup_area_id(self, city_slug: str, country_code: str) -> Optional[int]:
        data = await self._gql(_AREA_QUERY, {
            "areaUrlName": city_slug,
            "countryUrlCode": country_code,
        })
        area = data.get("data", {}).get("area")
        if area:
            return int(area["id"])
        return None

    # ------------------------------------------------------------------ #
    # Model construction
    # ------------------------------------------------------------------ #

    def _event_from_raw(self, raw: Dict[str, Any]) -> Event:
        event_id = str(raw.get("id", ""))
        url = f"{_RA_BASE}{raw['contentUrl']}" if raw.get("contentUrl") else None

        # Venue: RA address includes city/country in the string
        venue = None
        v = raw.get("venue") or {}
        if v.get("name") or v.get("address"):
            venue = Venue(
                name=v.get("name"),
                address=v.get("address") or None,
                city=v.get("country", {}).get("name"),
            )

        # Artists → tags
        tags = [a["name"] for a in (raw.get("artists") or []) if a.get("name")]

        # Image
        images = raw.get("images") or []
        image_url = images[0]["filename"] if images and images[0].get("filename") else None

        # Price
        cost = raw.get("cost")
        price: Optional[str] = None
        is_free: Optional[bool] = None
        if cost is not None and str(cost).strip():
            price = str(cost).strip()
            is_free = price in ("0", "free", "Free")
        elif cost == "" or cost is None:
            is_free = None

        # Organizer: first promoter name
        promoters = raw.get("promoters") or []
        organizer = promoters[0]["name"] if promoters and promoters[0].get("name") else None

        return Event(
            url=url,
            source="ra",
            title=raw.get("title"),
            description=raw.get("content") or None,
            start_date=self._parse_date(raw.get("date") or raw.get("startTime")),
            end_date=self._parse_date(raw.get("endTime")),
            start_time=self._parse_time(raw.get("startTime")),
            end_time=self._parse_time(raw.get("endTime")),
            venue=venue,
            tags=tags,
            price=price,
            is_free=is_free,
            image_url=image_url,
            organizer=organizer,
        )

    def _parse_date(self, raw: Optional[str]) -> Optional[str]:
        if not raw:
            return None
        return raw[:10]  # "2026-05-30T23:00:00.000" → "2026-05-30"

    def _parse_time(self, raw: Optional[str]) -> Optional[str]:
        if not raw or "T" not in raw:
            return None
        return raw.split("T")[1][:5]  # "2026-05-30T23:00:00.000" → "23:00"
