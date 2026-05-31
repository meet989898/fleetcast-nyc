from __future__ import annotations

import sys
import unittest
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from fleetcast.features import add_lag_features, weighted_absolute_error
from fleetcast.schemas import DemandRecord


class FeatureTests(unittest.TestCase):
    def test_lag_features_do_not_include_current_demand(self) -> None:
        records = [
            DemandRecord(161, datetime(2026, 5, 31, 18, 0), 10),
            DemandRecord(161, datetime(2026, 5, 31, 18, 15), 14),
            DemandRecord(161, datetime(2026, 5, 31, 18, 30), 19),
        ]

        rows = add_lag_features(records, lag_count=2)

        self.assertEqual(rows[0]["lag_1"], 0)
        self.assertEqual(rows[1]["lag_1"], 10)
        self.assertEqual(rows[2]["lag_1"], 14)
        self.assertEqual(rows[2]["lag_2"], 10)
        self.assertEqual(rows[2]["rolling_mean"], 12)

    def test_weighted_absolute_error(self) -> None:
        score = weighted_absolute_error([10, 20], [8, 23])

        self.assertEqual(score, 2.6667)


if __name__ == "__main__":
    unittest.main()
