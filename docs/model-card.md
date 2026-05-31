# Model Card

## Model

Current scaffold:

- `fixture-v1`
- fixture-derived forecasts generated from `data/sample/demand-fixture.csv`
- historical-mean baseline artifact written by `npm run train:demo`

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

Current fixture metrics:

- MAE: 3.5443
- RMSE: 3.9257
- weighted absolute error: 3.8687
- top-k hotspot precision: 0.8

## Limitations

- The demo scaffold uses a small committed sample fixture, not a trained TLC model yet.
- Taxi trip records have publication lag.
- Zone-level aggregation cannot describe individual driver or rider behavior.
