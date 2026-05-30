from __future__ import annotations

import logging
import os
import re
from pathlib import Path
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

_R2_ENDPOINT = "https://903653282238ba2ad8935f2bb358ef7e.r2.cloudflarestorage.com"
_R2_BUCKET = "berry-images"
_R2_PUBLIC_URL = "https://pub-31f12262f1024f31bfb9d383526b482c.r2.dev"

_TIMEOUT = 20.0
_MAX_SIZE = 10 * 1024 * 1024  # 10 MB


def _is_configured() -> bool:
    return bool(os.getenv("R2_ACCESS_KEY_ID") and os.getenv("R2_SECRET_ACCESS_KEY"))


def _extension_from_url(url: str) -> str:
    path = url.split("?")[0]
    suffix = Path(path).suffix.lower()
    return suffix if suffix in {".jpg", ".jpeg", ".png", ".webp", ".gif"} else ".jpg"


def _safe_slug(slug: str) -> str:
    slug = slug.strip().lower()
    slug = re.sub(r"[^\w-]", "-", slug)
    slug = re.sub(r"-{2,}", "-", slug).strip("-")
    return slug[:80] or "image"


async def upload_image(
    url: str,
    slug: str,
) -> Optional[str]:
    """
    Download image from url and upload to Cloudflare R2.
    Returns the public URL on success, None on failure.
    Skips upload if the object already exists in the bucket.
    Requires R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in environment.
    """
    if not _is_configured():
        logger.warning("R2 credentials not set — falling back to local storage")
        return None

    import boto3
    from botocore.exceptions import ClientError

    key = _safe_slug(slug) + _extension_from_url(url)
    public_url = f"{_R2_PUBLIC_URL}/{key}"

    # Check if already uploaded
    s3 = boto3.client(
        "s3",
        endpoint_url=_R2_ENDPOINT,
        aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
        region_name="auto",
    )
    try:
        s3.head_object(Bucket=_R2_BUCKET, Key=key)
        logger.debug("R2: already exists: %s", key)
        return public_url
    except ClientError as e:
        if e.response["Error"]["Code"] != "404":
            logger.warning("R2 head_object error: %s", e)
            return None

    # Download image
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT, follow_redirects=True) as client:
            async with client.stream("GET", url) as response:
                response.raise_for_status()
                content_length = response.headers.get("content-length")
                if content_length and int(content_length) > _MAX_SIZE:
                    logger.warning("R2: image too large (%s bytes), skipping: %s", content_length, url)
                    return None
                data = b""
                async for chunk in response.aiter_bytes(8192):
                    data += chunk
                    if len(data) > _MAX_SIZE:
                        logger.warning("R2: image exceeded size limit, skipping: %s", url)
                        return None
    except Exception as e:
        logger.warning("R2: download failed for %s: %s", url, e)
        return None

    # Upload to R2
    try:
        content_type = _content_type(key)
        s3.put_object(
            Bucket=_R2_BUCKET,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        logger.info("R2: uploaded %s → %s", url, public_url)
        return public_url
    except Exception as e:
        logger.warning("R2: upload failed for %s: %s", key, e)
        return None


def _content_type(key: str) -> str:
    ext = Path(key).suffix.lower()
    return {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
    }.get(ext, "image/jpeg")
