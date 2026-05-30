# Backward-compatibility shim — use RausgegangenScraper directly for new code
from .rausgegangen import RausgegangenScraper as EventScraper

__all__ = ["EventScraper"]
