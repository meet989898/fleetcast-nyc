from __future__ import annotations

import json
import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fleetcast.artifacts import MODEL_PATH, write_demo_artifacts


def train_demo_model() -> dict[str, object]:
    write_demo_artifacts()
    return json.loads(MODEL_PATH.read_text(encoding="utf-8"))


if __name__ == "__main__":
    print(json.dumps(train_demo_model(), indent=2))
