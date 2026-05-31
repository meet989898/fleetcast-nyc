import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    app: "fleetcast-nyc",
    modelVersion: process.env.MODEL_VERSION ?? "demo-v0",
    dataMode: process.env.DEMO_DATA_MODE === "false" ? "database" : "demo",
    latestForecastBucket: "2026-05-31T18:00:00-04:00",
  });
}
