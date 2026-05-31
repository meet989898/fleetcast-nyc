import { NextRequest, NextResponse } from "next/server";

import { badRequest, notFound } from "@/lib/api";
import { buildRepositionRecommendations, getZone, parseHorizon } from "@/lib/demo-data";

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const horizon = parseHorizon(searchParams.get("horizon"));
  const originZoneId = Number(searchParams.get("originZoneId"));

  if (!Number.isInteger(originZoneId)) {
    return badRequest("originZoneId must be an integer taxi zone id.");
  }

  const origin = getZone(originZoneId);

  if (!origin) {
    return notFound(`No origin zone exists for ${originZoneId}.`);
  }

  return NextResponse.json({
    horizon,
    origin,
    recommendations: buildRepositionRecommendations(originZoneId, horizon),
  });
}
