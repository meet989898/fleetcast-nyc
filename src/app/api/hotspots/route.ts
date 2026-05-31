import { NextRequest, NextResponse } from "next/server";

import { buildHotspots, parseHorizon } from "@/lib/demo-data";

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const horizon = parseHorizon(searchParams.get("horizon"));
  const requestedLimit = Number(searchParams.get("limit") ?? 5);
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 10)
    : 5;

  return NextResponse.json({
    horizon,
    hotspots: buildHotspots(horizon, limit),
  });
}
