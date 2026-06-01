# Data Strategy

FleetCast NYC is designed around public-safe data handling.

- Use public NYC TLC trip records.
- Keep raw parquet files in `data/raw/`, which is ignored by Git.
- Commit only tiny sample fixtures and schemas.
- Serve aggregate zone-level features and predictions.
- Do not store rider, driver, or trip-level identifying data in app-facing tables.
- Document source dates, data lag, and completeness limitations in the model card.

Current ingestion helpers:

- `npm run ingest:zones` downloads the official TLC taxi zone lookup CSV into `data/raw/`.
- `npm run ingest:sample` aggregates the committed TLC-style trip fixture into 15-minute zone demand buckets.
- `python ml/src/fleetcast/ingest.py yellow-url 2025 1` prints the official monthly yellow taxi parquet URL for a given year/month.

The next data milestone is adding a DuckDB-backed parquet adapter that reads selected columns from a small TLC monthly slice without committing raw trip files.

Planned app-facing tables:

- `zone`
- `zone_interval_feature`
- `forecast_run`
- `forecast_prediction`
- `reposition_recommendation`
