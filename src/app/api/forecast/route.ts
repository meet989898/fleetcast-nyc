import { NextRequest, NextResponse } from "next/server";

import { badRequest, notFound } from "@/lib/api";
import { buildForecast, getZone, parseHorizon } from "@/lib/demo-data";

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const horizon = parseHorizon(searchParams.get("horizon"));
  const zoneId = Number(searchParams.get("zoneId"));

  if (!Number.isInteger(zoneId)) {
    return badRequest("zoneId must be an integer taxi zone id.");
  }

  const zone = getZone(zoneId);
  const forecast = buildForecast(zoneId, horizon);

  if (!zone || !forecast) {
    return notFound(`No forecast is available for zone ${zoneId}.`);
  }

  return NextResponse.json({
    zone,
    forecast,
  });
}
