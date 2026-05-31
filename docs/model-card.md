# Model Card

## Model

Current scaffold:

- `demo-v0`
- deterministic demo forecasts
- Python baseline artifact placeholder

Planned first real model:

- historical mean baseline
- gradient-boosted tree model
- time-based backtest

## Target

Forecast pickup demand per NYC taxi zone for 15, 30, and 60 minute horizons.

## Features

- zone id
- hour of day
- day of week
- lagged demand
- rolling demand
- nearby-zone demand
- weather context

## Metrics

Planned:

- MAE
- RMSE
- weighted absolute error
- top-k hotspot precision

## Limitations

- The demo scaffold uses sample data, not a trained TLC model yet.
- Taxi trip records have publication lag.
- Zone-level aggregation cannot describe individual driver or rider behavior.
