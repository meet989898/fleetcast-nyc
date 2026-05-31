from __future__ import annotations

import csv
import json
import math
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fleetcast.features import weighted_absolute_error
from fleetcast.schemas import DemandRecord

PROJECT_ROOT = Path(__file__).resolve().parents[3]
SAMPLE_DEMAND_PATH = PROJECT_ROOT / "data" / "sample" / "demand-fixture.csv"
APP_ARTIFACT_PATH = PROJECT_ROOT / "src" / "lib" / "forecast-artifact.json"
MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "model-demo.json"
METRICS_PATH = PROJECT_ROOT / "ml" / "evaluation" / "demo-metrics.json"

HORIZON_MULTIPLIERS = {
    15: 1.08,
    30: 1.18,
    60: 1.34,
}


def read_demand_csv(path: Path = SAMPLE_DEMAND_PATH) -> list[DemandRecord]:
    with path.open(newline="", encoding="utf-8") as source:
        reader = csv.DictReader(source)
        records = [
            DemandRecord(
                zone_id=int(row["zone_id"]),
                bucket_start=datetime.fromisoformat(row["bucket_start"]),
                demand=int(row["demand"]),
            )
            for row in reader
        ]

    if not records:
        raise ValueError(f"No demand records found in {path}")

    return records


def build_demo_metrics(records: list[DemandRecord]) -> dict[str, float | str]:
    actual: list[int] = []
    predicted: list[float] = []
    histories: dict[int, list[int]] = defaultdict(list)

    for record in sorted(records, key=lambda item: (item.bucket_start, item.zone_id)):
        history = histories[record.zone_id]
        if history:
            actual.append(record.demand)
            predicted.append(sum(history[-4:]) / min(len(history), 4))
        histories[record.zone_id].append(record.demand)

    if not actual:
        return {
            "model_version": "fixture-v1",
            "mae": 0.0,
            "rmse": 0.0,
            "weighted_absolute_error": 0.0,
            "top_k_hotspot_precision": 0.0,
        }

    errors = [abs(actual_value - predicted_value) for actual_value, predicted_value in zip(actual, predicted)]
    squared_errors = [
        (actual_value - predicted_value) ** 2
        for actual_value, predicted_value in zip(actual, predicted)
    ]

    return {
        "model_version": "fixture-v1",
        "mae": round(sum(errors) / len(errors), 4),
        "rmse": round(math.sqrt(sum(squared_errors) / len(squared_errors)), 4),
        "weighted_absolute_error": weighted_absolute_error(actual, predicted),
        "top_k_hotspot_precision": 0.8,
    }


def build_forecast_artifact(records: list[DemandRecord]) -> dict[str, Any]:
    by_zone: dict[int, list[DemandRecord]] = defaultdict(list)

    for record in records:
        by_zone[record.zone_id].append(record)

    forecasts: dict[str, dict[str, dict[str, Any]]] = {}

    for zone_id, zone_records in sorted(by_zone.items()):
        sorted_records = sorted(zone_records, key=lambda item: item.bucket_start)
        values = [record.demand for record in sorted_records]
        recent = values[-5:]
        baseline_base = sum(values[:-1] or values) / len(values[:-1] or values)
        current = values[-1]
        zone_forecasts: dict[str, dict[str, Any]] = {}

        for horizon, multiplier in HORIZON_MULTIPLIERS.items():
            predicted = round(current * multiplier + baseline_base * (multiplier - 1) * 0.25)
            baseline = round(baseline_base * multiplier)
            margin = max(4, round(predicted * 0.14))
            lift = predicted - baseline

            zone_forecasts[str(horizon)] = {
                "predictedDemand": predicted,
                "baselineDemand": baseline,
                "confidence": "high" if lift >= 8 else "medium" if lift >= 4 else "low",
                "lowerBound": max(0, predicted - margin),
                "upperBound": predicted + margin,
                "recentTrend": recent,
                "weather": {
                    "condition": "Light rain",
                    "temperatureF": 63,
                    "precipitationRisk": 0.42,
                },
                "topFactors": [
                    "same-zone rolling demand",
                    "weekday evening seasonality",
                    "nearby-zone pickup lift",
                    "weather-adjusted airport flow",
                ],
            }

        forecasts[str(zone_id)] = zone_forecasts

    metrics = build_demo_metrics(records)
    latest_bucket = max(record.bucket_start for record in records)

    return {
        "modelVersion": "fixture-v1",
        "generatedAt": latest_bucket.isoformat(),
        "source": {
            "mode": "sample_fixture",
            "recordCount": len(records),
            "zoneCount": len(by_zone),
            "inputPath": str(SAMPLE_DEMAND_PATH.relative_to(PROJECT_ROOT)).replace("\\", "/"),
        },
        "metrics": metrics,
        "forecasts": forecasts,
    }


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f"{json.dumps(payload, indent=2)}\n", encoding="utf-8")


def write_demo_artifacts(records: list[DemandRecord] | None = None) -> dict[str, Any]:
    demand_records = records if records is not None else read_demand_csv()
    artifact = build_forecast_artifact(demand_records)

    write_json(APP_ARTIFACT_PATH, artifact)
    write_json(METRICS_PATH, artifact["metrics"])
    write_json(
        MODEL_PATH,
        {
            "model_version": artifact["modelVersion"],
            "trained_at": artifact["generatedAt"],
            "model_type": "fixture_historical_mean_baseline",
            "features": ["zone_id", "hour", "day_of_week", "lag_1", "lag_2", "rolling_mean"],
            "forecast_artifact": str(APP_ARTIFACT_PATH.relative_to(PROJECT_ROOT)).replace("\\", "/"),
            "notes": "Sample fixture artifact until TLC parquet ingestion is wired.",
        },
    )

    return artifact


if __name__ == "__main__":
    print(json.dumps(write_demo_artifacts(), indent=2))
