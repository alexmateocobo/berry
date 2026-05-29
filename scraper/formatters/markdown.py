from __future__ import annotations

from typing import List

from ..models.event import Event


def format_event_to_markdown(event: Event) -> str:
    lines: List[str] = []

    title = event.title or "Untitled Event"
    lines.append(f"# {title}")
    lines.append("")

    # Frontmatter-style metadata block
    if event.url:
        lines.append(f"**URL:** {event.url}")
    if event.display_date:
        time_part = _build_time_string(event)
        lines.append(f"**Date:** {event.display_date}" + (f" · {time_part}" if time_part else ""))
    if event.venue:
        venue_str = event.venue.name or ""
        if event.venue.address:
            venue_str += f", {event.venue.address}"
        if event.venue.city:
            venue_str += f", {event.venue.city}"
        if venue_str.strip():
            lines.append(f"**Venue:** {venue_str.strip(', ')}")
    if event.price is not None:
        free_label = " (free)" if event.is_free else ""
        lines.append(f"**Price:** {event.price}{free_label}")
    elif event.is_free is True:
        lines.append("**Price:** Free")
    if event.organizer:
        lines.append(f"**Organizer:** {event.organizer}")

    lines.append("")

    if event.categories:
        lines.append(f"**Categories:** {', '.join(event.categories)}")
        lines.append("")

    if event.tags:
        tag_str = " ".join(f"#{_slugify(t)}" for t in event.tags)
        lines.append(f"**Tags:** {tag_str}")
        lines.append("")

    if event.description:
        lines.append("## Description")
        lines.append("")
        lines.append(event.description)
        lines.append("")

    if event.image_url:
        lines.append(f"![{title}]({event.image_url})")
        lines.append("")

    return "\n".join(lines)


def _build_time_string(event: Event) -> str:
    if event.start_time and event.end_time:
        return f"{event.start_time}–{event.end_time}"
    if event.start_time:
        return event.start_time
    return ""


def _slugify(text: str) -> str:
    import re
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s-]+", "_", slug)
    return slug
