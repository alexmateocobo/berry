from __future__ import annotations

import json
import logging
from abc import ABC, abstractmethod
from typing import Any

logger = logging.getLogger(__name__)


class ProgressCallback(ABC):
    @abstractmethod
    async def on_start(self, url: str) -> None: ...

    @abstractmethod
    async def on_progress(self, message: str, current: int, total: int) -> None: ...

    @abstractmethod
    async def on_complete(self, result: Any) -> None: ...

    @abstractmethod
    async def on_error(self, url: str, error: Exception) -> None: ...


class SilentCallback(ProgressCallback):
    async def on_start(self, url: str) -> None:
        pass

    async def on_progress(self, message: str, current: int, total: int) -> None:
        pass

    async def on_complete(self, result: Any) -> None:
        pass

    async def on_error(self, url: str, error: Exception) -> None:
        pass


class ConsoleCallback(ProgressCallback):
    async def on_start(self, url: str) -> None:
        print(f"[>] Scraping: {url}")

    async def on_progress(self, message: str, current: int, total: int) -> None:
        pct = int(current / total * 100) if total else 0
        bar = "#" * (pct // 5) + "-" * (20 - pct // 5)
        print(f"  [{bar}] {pct}% — {message}")

    async def on_complete(self, result: Any) -> None:
        name = getattr(result, "title", None) or getattr(result, "name", None) or "done"
        print(f"[✓] Complete: {name}")

    async def on_error(self, url: str, error: Exception) -> None:
        print(f"[✗] Error on {url}: {error}")


class JSONLogCallback(ProgressCallback):
    def __init__(self, filepath: str) -> None:
        self._filepath = filepath

    def _write(self, event: dict) -> None:
        with open(self._filepath, "a") as f:
            f.write(json.dumps(event) + "\n")

    async def on_start(self, url: str) -> None:
        self._write({"event": "start", "url": url})

    async def on_progress(self, message: str, current: int, total: int) -> None:
        self._write({"event": "progress", "message": message, "current": current, "total": total})

    async def on_complete(self, result: Any) -> None:
        name = getattr(result, "title", None) or getattr(result, "name", None)
        self._write({"event": "complete", "name": name})

    async def on_error(self, url: str, error: Exception) -> None:
        self._write({"event": "error", "url": url, "error": str(error)})


class MultiCallback(ProgressCallback):
    def __init__(self, *callbacks: ProgressCallback) -> None:
        self._callbacks = callbacks

    async def on_start(self, url: str) -> None:
        for cb in self._callbacks:
            await cb.on_start(url)

    async def on_progress(self, message: str, current: int, total: int) -> None:
        for cb in self._callbacks:
            await cb.on_progress(message, current, total)

    async def on_complete(self, result: Any) -> None:
        for cb in self._callbacks:
            await cb.on_complete(result)

    async def on_error(self, url: str, error: Exception) -> None:
        for cb in self._callbacks:
            await cb.on_error(url, error)
