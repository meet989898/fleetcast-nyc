import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const requiredFiles = [
  "src/app/page.tsx",
  "src/app/api/forecast/route.ts",
  "src/app/api/hotspots/route.ts",
  "src/app/api/reposition/route.ts",
  "src/components/fleetcast-dashboard.tsx",
  "src/lib/forecast-artifact.json",
  "ml/src/fleetcast/features.py",
  "ml/src/fleetcast/artifacts.py",
  "ml/src/fleetcast/ingest.py",
  "ml/src/fleetcast/reposition.py",
  "data/sample/raw-trips-fixture.csv",
  "data/sample/taxi-zone-lookup-fixture.csv",
  "docs/deployment.md",
  "docs/model-card.md",
  "public/favicon.svg",
  "public/screenshots/fleetcast-desktop.png",
  "public/screenshots/fleetcast-mobile.png",
];

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

if (missing.length > 0) {
  console.error(`Missing required files: ${missing.join(", ")}`);
  process.exit(1);
}

const page = readFileSync(join(root, "src/components/fleetcast-dashboard.tsx"), "utf8");

for (const token of ["FleetCast NYC", "buildHotspots", "buildRepositionRecommendations"]) {
  if (!page.includes(token)) {
    console.error(`Dashboard is missing expected token: ${token}`);
    process.exit(1);
  }
}

const artifact = JSON.parse(readFileSync(join(root, "src/lib/forecast-artifact.json"), "utf8"));

if (artifact.modelVersion !== "fixture-v1") {
  console.error(`Unexpected artifact model version: ${artifact.modelVersion}`);
  process.exit(1);
}

if (artifact.source.zoneCount !== 8 || artifact.source.recordCount !== 40) {
  console.error("Forecast artifact does not contain the expected fixture coverage.");
  process.exit(1);
}

console.log("FleetCast local scaffold verification passed.");
