from __future__ import annotations

import sys
import tempfile
import unittest
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from fleetcast.ingest import (
    aggregate_trip_csv,
    floor_to_bucket,
    read_zone_lookup,
    write_demand_csv,
    yellow_tripdata_url,
)


ROOT = Path(__file__).resolve().parents[2]


class IngestTests(unittest.TestCase):
    def test_floor_to_bucket(self) -> None:
        bucket = floor_to_bucket(datetime(2026, 5, 31, 17, 29, 59), bucket_minutes=15)

        self.assertEqual(bucket, datetime(2026, 5, 31, 17, 15))

    def test_read_zone_lookup(self) -> None:
        zones = read_zone_lookup(ROOT / "data" / "sample" / "taxi-zone-lookup-fixture.csv")

        self.assertEqual(zones[161].zone_name, "Midtown Center")
        self.assertEqual(zones[132].service_zone, "Airports")

    def test_aggregate_trip_csv(self) -> None:
        records = aggregate_trip_csv(ROOT / "data" / "sample" / "raw-trips-fixture.csv")
        keyed = {(record.zone_id, record.bucket_start): record.demand for record in records}

        self.assertEqual(keyed[(161, datetime(2026, 5, 31, 17, 0))], 3)
        self.assertEqual(keyed[(161, datetime(2026, 5, 31, 17, 15))], 1)
        self.assertEqual(keyed[(132, datetime(2026, 5, 31, 17, 45))], 2)
        self.assertEqual(keyed[(138, datetime(2026, 5, 31, 18, 0))], 1)

    def test_write_demand_csv(self) -> None:
        records = aggregate_trip_csv(ROOT / "data" / "sample" / "raw-trips-fixture.csv", limit=3)

        with tempfile.TemporaryDirectory() as directory:
            output = write_demand_csv(records, Path(directory) / "demand.csv")

            self.assertTrue(output.exists())
            self.assertIn("zone_id,bucket_start,demand", output.read_text(encoding="utf-8"))

    def test_yellow_tripdata_url(self) -> None:
        self.assertEqual(
            yellow_tripdata_url(2025, 1),
            "https://d37ci6vzurychx.cloudfront.net/trip-data/yellow_tripdata_2025-01.parquet",
        )


if __name__ == "__main__":
    unittest.main()
