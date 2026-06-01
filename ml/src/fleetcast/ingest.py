from __future__ import annotations

import argparse
import csv
import json
import sys
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path
from urllib.request import urlretrieve

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fleetcast.schemas import DemandRecord, ZoneLookup

PROJECT_ROOT = Path(__file__).resolve().parents[3]
RAW_DATA_DIR = PROJECT_ROOT / "data" / "raw"
PROCESSED_DATA_DIR = PROJECT_ROOT / "data" / "processed"
OFFICIAL_TAXI_ZONE_LOOKUP_URL = "https://d37ci6vzurychx.cloudfront.net/misc/taxi_zone_lookup.csv"
YELLOW_TRIPDATA_URL_TEMPLATE = (
    "https://d37ci6vzurychx.cloudfront.net/trip-data/yellow_tripdata_{year:04d}-{month:02d}.parquet"
)


def raw_data_dir() -> Path:
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
    return RAW_DATA_DIR


def processed_data_dir() -> Path:
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    return PROCESSED_DATA_DIR


def yellow_tripdata_url(year: int, month: int) -> str:
    if month < 1 or month > 12:
        raise ValueError("month must be between 1 and 12")
    return YELLOW_TRIPDATA_URL_TEMPLATE.format(year=year, month=month)


def download_file(url: str, destination: Path, overwrite: bool = False) -> Path:
    destination.parent.mkdir(parents=True, exist_ok=True)

    if destination.exists() and not overwrite:
        return destination

    urlretrieve(url, destination)
    return destination


def download_zone_lookup(destination: Path | None = None, overwrite: bool = False) -> Path:
    target = destination or raw_data_dir() / "taxi_zone_lookup.csv"
    return download_file(OFFICIAL_TAXI_ZONE_LOOKUP_URL, target, overwrite=overwrite)


def read_zone_lookup(path: Path) -> dict[int, ZoneLookup]:
    with path.open(newline="", encoding="utf-8-sig") as source:
        rows = csv.DictReader(source)
        zones = {
            int(row["LocationID"]): ZoneLookup(
                zone_id=int(row["LocationID"]),
                borough=row["Borough"],
                zone_name=row["Zone"],
                service_zone=row.get("service_zone", ""),
            )
            for row in rows
            if row.get("LocationID")
        }

    if not zones:
        raise ValueError(f"No zones found in {path}")

    return zones


def parse_trip_datetime(value: str) -> datetime:
    normalized = value.strip().replace("Z", "+00:00")

    if not normalized:
        raise ValueError("pickup datetime is empty")

    try:
        return datetime.fromisoformat(normalized)
    except ValueError:
        return datetime.strptime(normalized, "%Y-%m-%d %H:%M:%S")


def floor_to_bucket(value: datetime, bucket_minutes: int = 15) -> datetime:
    if bucket_minutes <= 0 or 60 % bucket_minutes != 0:
        raise ValueError("bucket_minutes must divide one hour")

    discard = timedelta(
        minutes=value.minute % bucket_minutes,
        seconds=value.second,
        microseconds=value.microsecond,
    )
    return value - discard


def aggregate_trip_csv(
    input_path: Path,
    bucket_minutes: int = 15,
    limit: int | None = None,
    pickup_column: str = "tpep_pickup_datetime",
    zone_column: str = "PULocationID",
) -> list[DemandRecord]:
    counts: Counter[tuple[int, datetime]] = Counter()

    with input_path.open(newline="", encoding="utf-8-sig") as source:
        rows = csv.DictReader(source)

        for index, row in enumerate(rows):
            if limit is not None and index >= limit:
                break

            zone_value = row.get(zone_column, "")
            pickup_value = row.get(pickup_column, "")

            if not zone_value or not pickup_value:
                continue

            zone_id = int(float(zone_value))
            bucket = floor_to_bucket(parse_trip_datetime(pickup_value), bucket_minutes)
            counts[(zone_id, bucket)] += 1

    records = [
        DemandRecord(zone_id=zone_id, bucket_start=bucket, demand=demand)
        for (zone_id, bucket), demand in counts.items()
    ]
    return sorted(records, key=lambda record: (record.bucket_start, record.zone_id))


def write_demand_csv(records: list[DemandRecord], output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with output_path.open("w", newline="", encoding="utf-8") as target:
        writer = csv.DictWriter(target, fieldnames=["zone_id", "bucket_start", "demand"])
        writer.writeheader()

        for record in records:
            writer.writerow(
                {
                    "zone_id": record.zone_id,
                    "bucket_start": record.bucket_start.isoformat(),
                    "demand": record.demand,
                }
            )

    return output_path


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="FleetCast NYC public data ingestion helpers.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    zone_parser = subparsers.add_parser("download-zones", help="Download the official TLC zone lookup CSV.")
    zone_parser.add_argument("--output", type=Path, default=raw_data_dir() / "taxi_zone_lookup.csv")
    zone_parser.add_argument("--overwrite", action="store_true")

    aggregate_parser = subparsers.add_parser(
        "aggregate-csv",
        help="Aggregate TLC-style trip CSV rows into zone-time demand buckets.",
    )
    aggregate_parser.add_argument("input", type=Path)
    aggregate_parser.add_argument("output", type=Path)
    aggregate_parser.add_argument("--bucket-minutes", type=int, default=15)
    aggregate_parser.add_argument("--limit", type=int, default=None)
    aggregate_parser.add_argument("--pickup-column", default="tpep_pickup_datetime")
    aggregate_parser.add_argument("--zone-column", default="PULocationID")

    url_parser = subparsers.add_parser("yellow-url", help="Print an official yellow taxi parquet URL.")
    url_parser.add_argument("year", type=int)
    url_parser.add_argument("month", type=int)

    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)

    if args.command == "download-zones":
        path = download_zone_lookup(args.output, overwrite=args.overwrite)
        zones = read_zone_lookup(path)
        print(json.dumps({"path": str(path), "zone_count": len(zones)}, indent=2))
        return 0

    if args.command == "aggregate-csv":
        records = aggregate_trip_csv(
            args.input,
            bucket_minutes=args.bucket_minutes,
            limit=args.limit,
            pickup_column=args.pickup_column,
            zone_column=args.zone_column,
        )
        output = write_demand_csv(records, args.output)
        print(json.dumps({"path": str(output), "bucket_count": len(records)}, indent=2))
        return 0

    if args.command == "yellow-url":
        print(yellow_tripdata_url(args.year, args.month))
        return 0

    raise ValueError(f"Unknown command: {args.command}")


if __name__ == "__main__":
    raise SystemExit(main())
