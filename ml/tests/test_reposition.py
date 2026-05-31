from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from fleetcast.reposition import rank_reposition_targets, reposition_score
from fleetcast.schemas import ZonePoint


class RepositionTests(unittest.TestCase):
    def test_adjacent_target_scores_higher_when_demand_lift_matches(self) -> None:
        origin = ZonePoint(161, 50, 50, (230,))
        adjacent = ZonePoint(230, 55, 52, ())
        distant = ZonePoint(132, 90, 90, ())

        adjacent_score = reposition_score(origin, adjacent, 40, 30)
        distant_score = reposition_score(origin, distant, 40, 30)

        self.assertGreater(adjacent_score, distant_score)

    def test_rank_targets(self) -> None:
        origin = ZonePoint(161, 50, 50, (230,))
        candidates = [
            ZonePoint(230, 55, 52, ()),
            ZonePoint(132, 90, 90, ()),
        ]
        forecasts = {
            230: (42, 31),
            132: (55, 50),
        }

        ranked = rank_reposition_targets(origin, candidates, forecasts)

        self.assertEqual(ranked[0][0], 230)


if __name__ == "__main__":
    unittest.main()
