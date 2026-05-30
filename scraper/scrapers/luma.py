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
        """Scrape a single Luma event page (full data including description, tags, organizers)."""
        await self.callback.on_start(url)
        try:
            await self.navigate_and_wait(url)
            await asyncio.sleep(2)

            sd = await self._get_event_ld_json()
            if sd is None:
                raise PageNotFoundError(f"No Event ld+json found on {url}")

            event = Event(
                url=url,
                source="luma",
                title=sd.get("name"),
                description=sd.get("description"),
                start_date=self._sd_date(sd, "startDate"),
                end_date=self._sd_date(sd, "endDate"),
                start_time=self._sd_time(sd, "startDate"),
                end_time=self._sd_time(sd, "endDate"),
                venue=await self._get_venue(sd),
                categories=await self._get_tags(),
                tags=await self._get_tags(),
                price=self._sd_price(sd),
                is_free=self._sd_is_free(sd),
                image_url=self._sd_image(sd),
                organizer=await self._get_organizer(),
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
        """
        Scrape a Luma city/calendar page.
        Collects event URLs from the ItemList ld+json, then scrapes each individually
        so that description, tags, and organizers are fully populated.
        """
        await self.callback.on_start(listing_url)
        try:
            await self.navigate_and_wait(listing_url)
            await asyncio.sleep(2)

            urls = await self._get_event_urls_from_listing(max_events)
            logger.info("Found %d event URLs on Luma listing page", len(urls))

            events: List[Event] = []
            for i, url in enumerate(urls):
                await self.callback.on_progress(
                    f"Scraping event {i + 1}/{len(urls)}", i + 1, len(urls)
                )
                try:
                    event = await self.scrape(url)
                    events.append(event)
                except Exception as e:
                    logger.warning("Failed to scrape Luma event %s: %s", url, e)

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

    async def _get_event_urls_from_listing(self, max_events: Optional[int]) -> List[str]:
        """Extract event URLs from the ItemList ld+json on a listing page."""
        try:
            blocks: List[Any] = await self.page.evaluate(
                """() => [...document.querySelectorAll('script[type="application/ld+json"]')]
                         .map(s => { try { return JSON.parse(s.textContent); } catch { return null; } })
                         .filter(Boolean)"""
            )
            for block in blocks:
                if isinstance(block, dict) and block.get("@type") == "ItemList":
                    urls = [
                        el["item"]["url"]
                        for el in block.get("itemListElement", [])
                        if isinstance(el.get("item"), dict) and el["item"].get("url")
                    ]
                    return urls[:max_events] if max_events else urls
        except Exception as e:
            logger.debug("ItemList parse failed: %s", e)
        return []

    # ------------------------------------------------------------------ #
    # DOM scrapers (fields not reliably in ld+json)
    # ------------------------------------------------------------------ #

    async def _get_venue(self, sd: Dict[str, Any]) -> Optional[Venue]:
        """
        Luma's ld+json puts the venue display name in streetAddress instead of the real
        street address. Scrape the actual address from the Location card in the DOM.
        City comes from addressLocality in ld+json — more reliable than DOM parsing.
        """
        loc = sd.get("location") or {}
        venue_name = loc.get("name") if isinstance(loc, dict) else None

        addr_obj = loc.get("address") or {}
        city = addr_obj.get("addressLocality") if isinstance(addr_obj, dict) else None

        address = await self._get_address_from_dom()

        if venue_name or address:
            return Venue(name=venue_name, address=address, city=city)
        return None

    async def _get_address_from_dom(self) -> Optional[str]:
        """
        The Location card shows: Location / <Venue Name> / <Full Address>
        Returns the full address string only — city is taken from ld+json addressLocality.
        """
        try:
            result = await self.page.evaluate("""
                () => {
                    const card = [...document.querySelectorAll('[class*="content-card"]')]
                        .find(el => el.innerText.trim().startsWith('Location'));
                    if (!card) return null;
                    const lines = card.innerText.trim().split('\\n').map(l => l.trim()).filter(Boolean);
                    // lines[0] = "Location", lines[1] = venue name, lines[2] = full address
                    return lines[2] || null;
                }
            """)
            return result or None
        except Exception as e:
            logger.debug("Could not get address from DOM: %s", e)
        return None

    async def _get_tags(self) -> List[str]:
        """Tags/categories are rendered as [class*='category'] pill elements."""
        try:
            tags = await self.page.evaluate("""
                () => [...new Set(
                    [...document.querySelectorAll('[class*="category"]')]
                        .map(el => el.innerText.trim())
                        .filter(t => t.length > 0 && t.length < 50)
                )]
            """)
            return tags or []
        except Exception as e:
            logger.debug("Could not get tags: %s", e)
        return []

    async def _get_organizer(self) -> Optional[str]:
        """
        Luma distinguishes 'Presented by' (calendar owner) from 'Hosted By' (actual hosts).
        We want the 'Hosted By' names, joined with ', '.
        """
        try:
            names = await self.page.evaluate("""
                () => {
                    const hostedByLabel = [...document.querySelectorAll('*')]
                        .find(el => el.children.length === 0 && el.innerText?.trim() === 'Hosted By');
                    if (!hostedByLabel) return [];
                    // Walk up to find the container, then grab host name links
                    let container = hostedByLabel;
                    for (let i = 0; i < 5; i++) {
                        container = container.parentElement;
                        if (!container) break;
                        const links = [...container.querySelectorAll('a[href*="/user/"], a[href*="/calendar/"]')]
                            .map(a => a.innerText.trim()).filter(Boolean);
                        if (links.length > 0) return links;
                    }
                    return [];
                }
            """)
            return ", ".join(names) if names else None
        except Exception as e:
            logger.debug("Could not get organizer: %s", e)
        return None

    # ------------------------------------------------------------------ #
    # ld+json field parsers
    # ------------------------------------------------------------------ #

    def _sd_date(self, sd: Dict, field: str) -> Optional[str]:
        raw = sd.get(field, "")
        return raw[:10] if raw else None

    def _sd_time(self, sd: Dict, field: str) -> Optional[str]:
        raw = sd.get(field, "")
        if raw and "T" in raw:
            return raw.split("T")[1][:5]
        return None

    def _sd_price(self, sd: Dict) -> Optional[str]:
        offers = sd.get("offers")
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
