from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path

MODEL_PATH = Path("ml/models/model-demo.json")


def train_demo_model() -> dict[str, object]:
    model = {
        "model_version": "demo-v0",
        "trained_at": datetime.now(UTC).isoformat(),
        "model_type": "historical_mean_baseline",
        "features": ["zone_id", "hour", "day_of_week", "lag_1", "lag_2", "rolling_mean"],
        "notes": "Placeholder artifact until TLC parquet ingestion is wired.",
    }

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    MODEL_PATH.write_text(json.dumps(model, indent=2), encoding="utf-8")
    return model


if __name__ == "__main__":
    print(json.dumps(train_demo_model(), indent=2))
