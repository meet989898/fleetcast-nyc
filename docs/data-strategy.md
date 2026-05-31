# Data Strategy

FleetCast NYC is designed around public-safe data handling.

- Use public NYC TLC trip records.
- Keep raw parquet files in `data/raw/`, which is ignored by Git.
- Commit only tiny sample fixtures and schemas.
- Serve aggregate zone-level features and predictions.
- Do not store rider, driver, or trip-level identifying data in app-facing tables.
- Document source dates, data lag, and completeness limitations in the model card.

Planned app-facing tables:

- `zone`
- `zone_interval_feature`
- `forecast_run`
- `forecast_prediction`
- `reposition_recommendation`
