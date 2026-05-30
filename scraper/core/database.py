from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, Integer, Text, event, select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from ..models.event import Event

logger = logging.getLogger(__name__)

_engine = None
_session_factory = None


class Base(DeclarativeBase):
    pass


class EventRow(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    url: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    title: Mapped[Optional[str]] = mapped_column(Text)
    description: Mapped[Optional[str]] = mapped_column(Text)
    start_date: Mapped[Optional[str]] = mapped_column(Text)
    end_date: Mapped[Optional[str]] = mapped_column(Text)
    start_time: Mapped[Optional[str]] = mapped_column(Text)
    end_time: Mapped[Optional[str]] = mapped_column(Text)
    venue_name: Mapped[Optional[str]] = mapped_column(Text)
    venue_address: Mapped[Optional[str]] = mapped_column(Text)
    venue_city: Mapped[Optional[str]] = mapped_column(Text)
    categories: Mapped[Optional[str]] = mapped_column(Text)  # JSON array
    tags: Mapped[Optional[str]] = mapped_column(Text)        # JSON array
    price: Mapped[Optional[str]] = mapped_column(Text)
    is_free: Mapped[Optional[bool]] = mapped_column(Boolean)
    image_url: Mapped[Optional[str]] = mapped_column(Text)
    image_path: Mapped[Optional[str]] = mapped_column(Text)  # set after download
    organizer: Mapped[Optional[str]] = mapped_column(Text)
    scraped_at: Mapped[str] = mapped_column(Text, nullable=False)


def _enable_wal(dbapi_conn, _connection_record):
    dbapi_conn.execute("PRAGMA journal_mode=WAL")


def init_engine(db_path: str = "events.db") -> None:
    global _engine, _session_factory
    url = f"sqlite+aiosqlite:///{db_path}"
    _engine = create_async_engine(url, echo=False)
    # Enable WAL mode on every new connection
    event.listen(_engine.sync_engine, "connect", _enable_wal)
    _session_factory = async_sessionmaker(_engine, expire_on_commit=False)
    logger.debug("Database engine initialised: %s", db_path)


async def init_db(db_path: str = "events.db") -> None:
    """Create tables if they don't exist. Call once at startup."""
    if _engine is None:
        init_engine(db_path)
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database ready: %s", db_path)


async def save_event(event: Event, image_path: Optional[str] = None) -> bool:
    """
    Upsert an event by URL.
    Returns True if a new row was inserted, False if an existing row was updated.
    """
    if _session_factory is None:
        raise RuntimeError("Call init_db() before save_event()")

    scraped_at = datetime.now(timezone.utc).isoformat()

    async with _session_factory() as session:
        async with session.begin():
            existing = await session.scalar(
                select(EventRow).where(EventRow.url == event.url)
            )

            values = dict(
                url=event.url,
                title=event.title,
                description=event.description,
                start_date=event.start_date,
                end_date=event.end_date,
                start_time=event.start_time,
                end_time=event.end_time,
                venue_name=event.venue.name if event.venue else None,
                venue_address=event.venue.address if event.venue else None,
                venue_city=event.venue.city if event.venue else None,
                categories=json.dumps(event.categories),
                tags=json.dumps(event.tags),
                price=event.price,
                is_free=event.is_free,
                image_url=event.image_url,
                image_path=image_path,
                organizer=event.organizer,
                scraped_at=scraped_at,
            )

            if existing is None:
                session.add(EventRow(**values))
                logger.debug("Inserted new event: %s", event.url)
                return True
            else:
                for key, val in values.items():
                    setattr(existing, key, val)
                logger.debug("Updated existing event: %s", event.url)
                return False
