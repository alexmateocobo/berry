from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

_IMAGES_DIR = Path("images")
_TIMEOUT = 20.0
_MAX_SIZE = 10 * 1024 * 1024  # 10 MB


def _extension_from_url(url: str) -> str:
    path = url.split("?")[0]
    suffix = Path(path).suffix.lower()
    return suffix if suffix in {".jpg", ".jpeg", ".png", ".webp", ".gif"} else ".jpg"


def _safe_slug(slug: str) -> str:
    slug = slug.strip().lower()
    slug = re.sub(r"[^\w-]", "-", slug)
    slug = re.sub(r"-{2,}", "-", slug).strip("-")
    return slug[:80] or "image"


async def download_image(
    url: str,
    slug: str,
    images_dir: Path = _IMAGES_DIR,
) -> Optional[str]:
    """
    Download an image from url and save it to images/<slug><ext>.
    Returns the relative file path on success, None on failure.
    """
    images_dir.mkdir(parents=True, exist_ok=True)

    filename = _safe_slug(slug) + _extension_from_url(url)
    dest = images_dir / filename

    if dest.exists():
        logger.debug("Image already on disk: %s", dest)
        return str(dest)

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT, follow_redirects=True) as client:
            async with client.stream("GET", url) as response:
                response.raise_for_status()

                content_length = response.headers.get("content-length")
                if content_length and int(content_length) > _MAX_SIZE:
                    logger.warning("Image too large (%s bytes), skipping: %s", content_length, url)
                    return None

                data = b""
                async for chunk in response.aiter_bytes(chunk_size=8192):
                    data += chunk
                    if len(data) > _MAX_SIZE:
                        logger.warning("Image exceeded size limit mid-download, skipping: %s", url)
                        return None

        dest.write_bytes(data)
        logger.info("Downloaded image: %s → %s", url, dest)
        return str(dest)

    except httpx.HTTPStatusError as e:
        logger.warning("HTTP %s downloading image %s", e.response.status_code, url)
    except httpx.RequestError as e:
        logger.warning("Network error downloading image %s: %s", url, e)
    except Exception as e:
        logger.warning("Unexpected error downloading image %s: %s", url, e)

    return None
