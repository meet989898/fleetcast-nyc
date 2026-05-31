from __future__ import annotations

import math

from fleetcast.schemas import ZonePoint


def reposition_score(
    origin: ZonePoint,
    target: ZonePoint,
    predicted_demand: float,
    baseline_demand: float,
) -> float:
    if origin.zone_id == target.zone_id:
        return float("-inf")

    demand_lift = predicted_demand - baseline_demand
    distance = math.dist((origin.x, origin.y), (target.x, target.y))
    adjacency_bonus = 4.0 if target.zone_id in origin.neighbors else 0.0

    return round(demand_lift + adjacency_bonus - distance * 0.18, 3)


def rank_reposition_targets(
    origin: ZonePoint,
    candidates: list[ZonePoint],
    forecasts: dict[int, tuple[float, float]],
    limit: int = 3,
) -> list[tuple[int, float]]:
    scored: list[tuple[int, float]] = []

    for candidate in candidates:
        if candidate.zone_id not in forecasts:
            continue

        predicted, baseline = forecasts[candidate.zone_id]
        score = reposition_score(origin, candidate, predicted, baseline)

        if score != float("-inf"):
            scored.append((candidate.zone_id, score))

    return sorted(scored, key=lambda item: item[1], reverse=True)[:limit]
