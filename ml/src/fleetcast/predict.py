from __future__ import annotations


def predict_from_features(row: dict[str, float]) -> float:
    baseline = row.get("rolling_mean", 0.0)
    lag_1 = row.get("lag_1", baseline)
    hour = row.get("hour", 12.0)
    evening_boost = 1.12 if 16 <= hour <= 20 else 1.0

    return round((baseline * 0.55 + lag_1 * 0.45) * evening_boost, 2)
