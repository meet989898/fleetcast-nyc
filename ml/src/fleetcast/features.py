from __future__ import annotations

from collections import defaultdict, deque

from fleetcast.schemas import DemandRecord


def add_lag_features(records: list[DemandRecord], lag_count: int = 2) -> list[dict[str, object]]:
    """Create leakage-safe lag features from chronological demand records."""
    if lag_count <= 0:
        raise ValueError("lag_count must be positive")

    histories: dict[int, deque[int]] = defaultdict(lambda: deque(maxlen=lag_count))
    rows: list[dict[str, object]] = []

    for record in sorted(records, key=lambda item: (item.bucket_start, item.zone_id)):
        history = list(histories[record.zone_id])
        row: dict[str, object] = {
            "zone_id": record.zone_id,
            "bucket_start": record.bucket_start.isoformat(),
            "demand": record.demand,
            "hour": record.bucket_start.hour,
            "day_of_week": record.bucket_start.weekday(),
        }

        for lag_index in range(lag_count):
            row[f"lag_{lag_index + 1}"] = history[-lag_index - 1] if len(history) > lag_index else 0

        row["rolling_mean"] = round(sum(history) / len(history), 3) if history else 0
        rows.append(row)
        histories[record.zone_id].append(record.demand)

    return rows


def weighted_absolute_error(actual: list[int], predicted: list[float]) -> float:
    if len(actual) != len(predicted):
        raise ValueError("actual and predicted must have equal length")
    if not actual:
        return 0.0

    total_weight = sum(max(value, 1) for value in actual)
    weighted_error = sum(
        abs(actual_value - predicted_value) * max(actual_value, 1)
        for actual_value, predicted_value in zip(actual, predicted, strict=True)
    )

    return round(weighted_error / total_weight, 4)
