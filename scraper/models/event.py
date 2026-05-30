from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class Venue(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    url: Optional[str] = None

    def __repr__(self) -> str:
        return f"Venue(name={self.name!r}, city={self.city!r})"


class Event(BaseModel):
    url: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    venue: Optional[Venue] = None
    categories: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    price: Optional[str] = None
    is_free: Optional[bool] = None
    image_url: Optional[str] = None
    organizer: Optional[str] = None
    source: Optional[str] = None  # "rausgegangen", "luma", "ra"

    @property
    def display_date(self) -> Optional[str]:
        if self.start_date and self.end_date and self.start_date != self.end_date:
            return f"{self.start_date} – {self.end_date}"
        return self.start_date

    def to_dict(self) -> dict:
        return self.model_dump()

    def to_json(self) -> str:
        return self.model_dump_json()

    def __repr__(self) -> str:
        return f"Event(title={self.title!r}, start_date={self.start_date!r})"
