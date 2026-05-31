# FleetCast NYC

FleetCast NYC is a public ML product demo for forecasting NYC taxi demand by taxi zone and recommending simple repositioning moves for idle drivers.

The first scaffold ships a working Next.js operations console with typed demo data, API contracts, a Python modeling skeleton, and tests. The next build step is replacing demo aggregates with NYC TLC trip-derived features.

## Current Status

- App shell: built
- Demo forecast APIs: built
- Python ML skeleton: built
- Public data ingestion: next
- Live deployment: next

## Demo Surface

- `GET /api/health`
- `GET /api/forecast?horizon=30&zoneId=161`
- `GET /api/hotspots?horizon=30&limit=5`
- `GET /api/reposition?originZoneId=161&horizon=30`

## Data Sources

- NYC TLC Trip Record Data
- NYC taxi zone lookup and geometry assets
- National Weather Service API

Raw trip data should stay outside Git. The repository should only include small fixtures, aggregate examples, schemas, and generated demo artifacts.

## Local Development

```powershell
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:3000
```

The Codex environment used to create this scaffold had Node available but not `npm` or `npx` on PATH, so verification may use the parent workspace's installed Next.js binary until a normal Node/npm install is available.

## Verification

```powershell
npm run build
npm run test:ml
npm run verify
```

Codex fallback commands from the parent workspace:

```powershell
node ..\node_modules\next\dist\bin\next build
python -m unittest discover -s ml/tests -p "test_*.py"
node scripts/verify-local.mjs
```

## ML Plan

Targets:

- zone-level demand for 15, 30, and 60 minute horizons
- hotspot ranking by predicted demand lift
- reposition score based on expected demand gain and distance penalty

First real model path:

- historical mean baseline
- leakage-safe lag and rolling features
- LightGBM or XGBoost tree model
- time-based backtest

## Deployment Plan

- Frontend/API: Vercel
- Database: Neon Postgres
- Refresh/retraining: GitHub Actions
- Fallback inference: FastAPI on Render, Fly.io, or Railway if the model becomes too heavy for Vercel Functions

## Resume Outcomes

- Built a production-style ML forecasting platform that predicted NYC taxi demand by zone using spatiotemporal features, weather enrichment, and time-based backtesting.
- Shipped a full-stack interactive demo with Next.js, Postgres, and serverless APIs to visualize hotspot forecasts and driver reposition recommendations on a live NYC map.
- Engineered reproducible data pipelines, evaluation workflows, and cross-layer tests for a public-safe ML system deployed to the cloud.
