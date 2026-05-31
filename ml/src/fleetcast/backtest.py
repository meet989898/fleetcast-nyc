from __future__ import annotations

import json
import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fleetcast.artifacts import METRICS_PATH, read_demand_csv, write_demo_artifacts


def write_demo_metrics() -> dict[str, float | str]:
    artifact = write_demo_artifacts(read_demand_csv())
    return artifact["metrics"]


if __name__ == "__main__":
    print(json.dumps(write_demo_metrics(), indent=2))
