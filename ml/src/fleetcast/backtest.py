from __future__ import annotations

import json
from pathlib import Path

METRICS_PATH = Path("ml/evaluation/demo-metrics.json")


def write_demo_metrics() -> dict[str, float | str]:
    metrics: dict[str, float | str] = {
        "model_version": "demo-v0",
        "mae": 5.8,
        "rmse": 7.4,
        "weighted_absolute_error": 6.2,
        "top_k_hotspot_precision": 0.8,
    }

    METRICS_PATH.parent.mkdir(parents=True, exist_ok=True)
    METRICS_PATH.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    return metrics


if __name__ == "__main__":
    print(json.dumps(write_demo_metrics(), indent=2))
