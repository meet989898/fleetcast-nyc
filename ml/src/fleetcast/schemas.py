from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class DemandRecord:
    zone_id: int
    bucket_start: datetime
    demand: int

    def __post_init__(self) -> None:
        if self.zone_id <= 0:
            raise ValueError("zone_id must be positive")
        if self.demand < 0:
            raise ValueError("demand cannot be negative")


@dataclass(frozen=True)
class ZonePoint:
    zone_id: int
    x: float
    y: float
    neighbors: tuple[int, ...]
