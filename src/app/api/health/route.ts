import { NextResponse } from "next/server";

import { artifact } from "@/lib/demo-data";

export function GET() {
  return NextResponse.json({
    status: "ok",
    app: "fleetcast-nyc",
    modelVersion: process.env.MODEL_VERSION ?? artifact.modelVersion,
    dataMode: process.env.DEMO_DATA_MODE === "false" ? "database" : "demo",
    latestForecastBucket: artifact.generatedAt,
    metrics: artifact.metrics,
  });
}
