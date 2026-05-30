from __future__ import annotations

import asyncio
import logging
import re
from typing import Any, Dict, List, Optional

from ..callbacks import ProgressCallback
from ..core.exceptions import PageNotFoundError
from ..models.event import Event, Venue
from .base import BaseScraper

logger = logging.getLogger(__name__)

_MIN_STABLE_SCROLL_PASSES = 5


class RausgegangenScraper(BaseScraper):
    """Scrapes event detail pages and listing pages from rausgegangen.de."""

    async def scrape(self, url: str) -> Event:
        """Scrape a single event detail page."""
        await self.callback.on_start(url)
        try:
            await self.navigate_and_wait(url)
            await self.close_modals()

            # Primary source: ld+json structured data
            sd = await self._get_structured_data()

            if sd is None and not await self.element_exists(".event-detail-intro", timeout=3000):
                raise PageNotFoundError(f"Event page not found: {url}")

            event = Event(
                url=url,
                source="rausgegangen",
                title=self._sd_title(sd) or await self._get_title_dom(),
                description=self._sd_description(sd),
                start_date=self._sd_date(sd, "startDate"),
                end_date=self._sd_date(sd, "endDate"),
                start_time=self._sd_time(sd, "startDate"),
                end_time=self._sd_time(sd, "endDate"),
                venue=self._sd_venue(sd),
                categories=await self._get_categories(),
                tags=await self._get_tags(),
                price=self._sd_price(sd),
                is_free=self._sd_is_free(sd),
                image_url=self._sd_image(sd),
                organizer=await self._get_organizer(
                    fallback=self._sd_venue(sd).name if self._sd_venue(sd) else None
                ),
            )

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
        """Scrape event links from a listing/overview page, then scrape each."""
        await self.callback.on_start(listing_url)
        try:
            await self.navigate_and_wait(listing_url)
            await self.close_modals()

            urls = await self._collect_event_urls(max_events)
            logger.info("Found %d event URLs on listing page", len(urls))

            events: List[Event] = []
            for i, url in enumerate(urls):
                await self.callback.on_progress(
                    f"Scraping event {i + 1}/{len(urls)}", i + 1, len(urls)
                )
                try:
                    event = await self.scrape(url)
                    events.append(event)
                except Exception as e:
                    logger.warning("Failed to scrape %s: %s", url, e)

            await self.callback.on_complete(events)
            return events

        except Exception as e:
            await self.callback.on_error(listing_url, e)
            raise

    # ------------------------------------------------------------------ #
    # Listing helpers
    # ------------------------------------------------------------------ #

    async def _collect_event_urls(self, max_events: Optional[int]) -> List[str]:
        """Scroll listing until stable, collect all /en/events/<slug>/ links."""
        stable_passes = 0
        last_count = 0

        while stable_passes < _MIN_STABLE_SCROLL_PASSES:
            await self.scroll_page_to_bottom()
            await asyncio.sleep(0.8)
            count = await self.page.evaluate(
                "() => document.querySelectorAll('a[href*=\"/en/events/\"]').length"
            )
            if count == last_count:
                stable_passes += 1
            else:
                stable_passes = 0
                last_count = count

        hrefs: List[str] = await self.page.evaluate(
            r"""() => {
                const links = new Set();
                document.querySelectorAll('a[href]').forEach(a => {
                    if (/\/en\/events\/[^/?#]+\/$/.test(a.href)) links.add(a.href);
                });
                return Array.from(links);
            }"""
        )

        urls: List[str] = []
        seen: set = set()
        for href in hrefs:
            if href not in seen:
                seen.add(href)
                urls.append(href)
            if max_events and len(urls) >= max_events:
                break

        return urls

    # ------------------------------------------------------------------ #
    # ld+json structured data (primary extraction layer)
    # ------------------------------------------------------------------ #

    async def _get_structured_data(self) -> Optional[Dict[str, Any]]:
        try:
            blocks: List[Any] = await self.page.evaluate(
                """() => [...document.querySelectorAll('script[type="application/ld+json"]')]
                         .map(s => { try { return JSON.parse(s.textContent); } catch(e) { return null; } })
                         .filter(Boolean)"""
            )
            for block in blocks:
                if isinstance(block, dict) and block.get("@type") == "Event":
                    return block
        except Exception as e:
            logger.debug("ld+json parse failed: %s", e)
        return None

    def _sd_title(self, sd: Optional[Dict]) -> Optional[str]:
        return sd.get("name") if sd else None

    def _sd_description(self, sd: Optional[Dict]) -> Optional[str]:
        return sd.get("description") if sd else None

    def _sd_date(self, sd: Optional[Dict], field: str) -> Optional[str]:
        if not sd:
            return None
        raw = sd.get(field, "")
        return raw[:10] if raw else None  # "2026-05-29T22:00+0200" → "2026-05-29"

    def _sd_time(self, sd: Optional[Dict], field: str) -> Optional[str]:
        if not sd:
            return None
        raw = sd.get(field, "")
        if raw and "T" in raw:
            return raw.split("T")[1][:5]  # "22:00"
        return None

    def _sd_venue(self, sd: Optional[Dict]) -> Optional[Venue]:
        if not sd:
            return None
        loc = sd.get("location")
        if not isinstance(loc, dict):
            return None
        addr = loc.get("address") or {}
        name = loc.get("name")
        street = addr.get("streetAddress") if isinstance(addr, dict) else None
        postal = addr.get("postalCode") if isinstance(addr, dict) else None
        city = addr.get("addressLocality") if isinstance(addr, dict) else None
        # Build full address: "Kleinhesselohe 3, 80802 München"
        if street and postal and city:
            full_address = f"{street}, {postal} {city}"
        elif street and city:
            full_address = f"{street}, {city}"
        else:
            full_address = street or None
        if name or full_address:
            return Venue(name=name, address=full_address, city=city)
        return None

    def _sd_price(self, sd: Optional[Dict]) -> Optional[str]:
        if not sd:
            return None
        offers = sd.get("offers")
        if not isinstance(offers, dict):
            return None
        price = offers.get("price")
        currency = offers.get("priceCurrency", "EUR")
        if price is None:
            return None
        try:
            amount = float(price)
            if amount == 0:
                return "Free"
            return f"{amount:.2f} {currency}"
        except (ValueError, TypeError):
            return str(price)

    def _sd_is_free(self, sd: Optional[Dict]) -> Optional[bool]:
        if not sd:
            return None
        offers = sd.get("offers")
        if not isinstance(offers, dict):
            return None
        price = offers.get("price")
        if price is None:
            return None
        try:
            return float(price) == 0
        except (ValueError, TypeError):
            lower = str(price).lower()
            return "free" in lower or "kostenlos" in lower

    def _sd_image(self, sd: Optional[Dict]) -> Optional[str]:
        if not sd:
            return None
        images = sd.get("image")
        if isinstance(images, list) and images:
            return images[0]
        if isinstance(images, str):
            return images
        return None

    # ------------------------------------------------------------------ #
    # DOM fallbacks (for fields not in ld+json)
    # ------------------------------------------------------------------ #

    async def _get_title_dom(self) -> Optional[str]:
        # Title is h1 inside .event-detail-intro-header; skip "Your tickets" widget h1
        for sel in (".event-detail-intro-header h1", ".event-detail-intro h1"):
            text = await self.safe_extract_text(sel)
            if text:
                return text
        # Last resort: first h1 that is NOT "Your tickets"
        try:
            h1s = await self.page.query_selector_all("h1")
            for el in h1s:
                text = (await el.text_content() or "").strip()
                if text and text.lower() != "your tickets":
                    return text
        except Exception:
            pass
        return None

    async def _get_categories(self) -> List[str]:
        # Category pills: links to /category/ paths inside .event-detail-intro
        try:
            return await self.extract_list_items(
                ".event-detail-intro a.text-pill-outline[href*='/category/']"
            )
        except Exception:
            return []

    async def _get_tags(self) -> List[str]:
        # Tag pills: links to /tags/ paths inside .event-detail-intro
        try:
            tags = await self.extract_list_items(
                ".event-detail-intro a.text-pill-outline[href*='/tags/']"
            )
            return list(dict.fromkeys(tags))
        except Exception:
            return []

    async def _get_organizer(self, fallback: Optional[str] = None) -> Optional[str]:
        # rausgegangen.de has no organizer in ld+json and DOM links point to
        # rausgegangen's own brand pages, not the event organizer.
        # The venue name is the reliable source.
        return fallback
