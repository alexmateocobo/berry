from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Optional

from ..callbacks import ProgressCallback
from ..core.exceptions import PageNotFoundError
from ..models.event import Event, Venue
from .base import BaseScraper

logger = logging.getLogger(__name__)


class LumaScraper(BaseScraper):
    """Scrapes event pages and city listing pages from lu.ma / luma.com."""

    async def scrape(self, url: str) -> Event:
        """Scrape a single Luma event page."""
        await self.callback.on_start(url)
        try:
            await self.navigate_and_wait(url)
            await asyncio.sleep(2)

            sd = await self._get_event_ld_json()
            if sd is None:
                raise PageNotFoundError(f"No Event ld+json found on {url}")

            event = self._event_from_sd(sd, url)
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
        Scrape a Luma city/calendar page.
        Extracts all events directly from the ItemList ld+json — no per-event navigation needed.
        """
        await self.callback.on_start(listing_url)
        try:
            await self.navigate_and_wait(listing_url)
            await asyncio.sleep(2)

            items = await self._get_item_list()
            if max_events:
                items = items[:max_events]

            events: List[Event] = []
            for i, item_sd in enumerate(items):
                await self.callback.on_progress(
                    f"Parsing event {i + 1}/{len(items)}", i + 1, len(items)
                )
                try:
                    url = item_sd.get("url") or item_sd.get("@id", "")
                    event = self._event_from_sd(item_sd, url)
                    events.append(event)
                except Exception as e:
                    logger.warning("Failed to parse Luma listing item: %s", e)

            await self.callback.on_complete(events)
            return events

        except Exception as e:
            await self.callback.on_error(listing_url, e)
            raise

    # ------------------------------------------------------------------ #
    # ld+json helpers
    # ------------------------------------------------------------------ #

    async def _get_event_ld_json(self) -> Optional[Dict[str, Any]]:
        try:
            blocks: List[Any] = await self.page.evaluate(
                """() => [...document.querySelectorAll('script[type="application/ld+json"]')]
                         .map(s => { try { return JSON.parse(s.textContent); } catch { return null; } })
                         .filter(Boolean)"""
            )
            for block in blocks:
                if isinstance(block, dict) and block.get("@type") == "Event":
                    return block
        except Exception as e:
            logger.debug("ld+json parse failed: %s", e)
        return None

    async def _get_item_list(self) -> List[Dict[str, Any]]:
        try:
            blocks: List[Any] = await self.page.evaluate(
                """() => [...document.querySelectorAll('script[type="application/ld+json"]')]
                         .map(s => { try { return JSON.parse(s.textContent); } catch { return null; } })
                         .filter(Boolean)"""
            )
            for block in blocks:
                if isinstance(block, dict) and block.get("@type") == "ItemList":
                    return [
                        el["item"]
                        for el in block.get("itemListElement", [])
                        if isinstance(el.get("item"), dict)
                    ]
        except Exception as e:
            logger.debug("ItemList parse failed: %s", e)
        return []

    # ------------------------------------------------------------------ #
    # Model construction from ld+json
    # ------------------------------------------------------------------ #

    def _event_from_sd(self, sd: Dict[str, Any], url: str) -> Event:
        return Event(
            url=url,
            source="luma",
            title=sd.get("name"),
            description=sd.get("description"),
            start_date=self._sd_date(sd, "startDate"),
            end_date=self._sd_date(sd, "endDate"),
            start_time=self._sd_time(sd, "startDate"),
            end_time=self._sd_time(sd, "endDate"),
            venue=self._sd_venue(sd),
            price=self._sd_price(sd),
            is_free=self._sd_is_free(sd),
            image_url=self._sd_image(sd),
            organizer=self._sd_organizer(sd),
        )

    def _sd_date(self, sd: Dict, field: str) -> Optional[str]:
        raw = sd.get(field, "")
        return raw[:10] if raw else None

    def _sd_time(self, sd: Dict, field: str) -> Optional[str]:
        raw = sd.get(field, "")
        if raw and "T" in raw:
            return raw.split("T")[1][:5]
        return None

    def _sd_venue(self, sd: Dict) -> Optional[Venue]:
        loc = sd.get("location")
        if not isinstance(loc, dict):
            return None
        addr = loc.get("address") or {}
        name = loc.get("name")
        street = addr.get("streetAddress") if isinstance(addr, dict) else None
        city = addr.get("addressLocality") if isinstance(addr, dict) else None
        if name or street:
            return Venue(name=name, address=street, city=city)
        return None

    def _sd_price(self, sd: Dict) -> Optional[str]:
        offers = sd.get("offers")
        # Luma offers is a list; take the first
        if isinstance(offers, list):
            offers = offers[0] if offers else None
        if not isinstance(offers, dict):
            return None
        price = offers.get("price")
        currency = (offers.get("priceCurrency") or "EUR").upper()
        if price is None:
            return None
        try:
            amount = float(price)
            return "Free" if amount == 0 else f"{amount:.2f} {currency}"
        except (ValueError, TypeError):
            return str(price)

    def _sd_is_free(self, sd: Dict) -> Optional[bool]:
        offers = sd.get("offers")
        if isinstance(offers, list):
            offers = offers[0] if offers else None
        if not isinstance(offers, dict):
            return None
        price = offers.get("price")
        if price is None:
            return None
        try:
            return float(price) == 0
        except (ValueError, TypeError):
            return None

    def _sd_image(self, sd: Dict) -> Optional[str]:
        images = sd.get("image")
        if isinstance(images, list) and images:
            return images[0]
        if isinstance(images, str):
            return images
        return None

    def _sd_organizer(self, sd: Dict) -> Optional[str]:
        org = sd.get("organizer")
        if isinstance(org, list) and org:
            org = org[0]
        if isinstance(org, dict):
            return org.get("name")
        if isinstance(org, str):
            return org
        return None
