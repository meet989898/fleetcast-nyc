from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from fleetcast.artifacts import build_forecast_artifact, read_demand_csv


class ArtifactTests(unittest.TestCase):
    def test_fixture_builds_complete_forecast_artifact(self) -> None:
        artifact = build_forecast_artifact(read_demand_csv())

        self.assertEqual(artifact["modelVersion"], "fixture-v1")
        self.assertEqual(artifact["source"]["recordCount"], 40)
        self.assertEqual(artifact["source"]["zoneCount"], 8)
        self.assertIn("161", artifact["forecasts"])
        self.assertIn("30", artifact["forecasts"]["161"])
        self.assertGreater(artifact["metrics"]["mae"], 0)

    def test_forecast_has_serving_fields(self) -> None:
        forecast = build_forecast_artifact(read_demand_csv())["forecasts"]["230"]["30"]

        for field in [
            "predictedDemand",
            "baselineDemand",
            "confidence",
            "lowerBound",
            "upperBound",
            "recentTrend",
            "weather",
            "topFactors",
        ]:
            self.assertIn(field, forecast)


if __name__ == "__main__":
    unittest.main()
