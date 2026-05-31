import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const requiredFiles = [
  "src/app/page.tsx",
  "src/app/api/forecast/route.ts",
  "src/app/api/hotspots/route.ts",
  "src/app/api/reposition/route.ts",
  "src/components/fleetcast-dashboard.tsx",
  "ml/src/fleetcast/features.py",
  "ml/src/fleetcast/reposition.py",
  "docs/model-card.md",
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

console.log("FleetCast local scaffold verification passed.");
