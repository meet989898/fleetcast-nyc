import type { Horizon, RepositionRecommendation, Zone, ZoneForecast } from "./types";

export const horizons: Horizon[] = [15, 30, 60];

export const zones: Zone[] = [
  {
    id: 161,
    name: "Midtown Center",
    borough: "Manhattan",
    centroid: { x: 56, y: 38 },
    neighbors: [230, 162, 170],
  },
  {
    id: 230,
    name: "Times Sq / Theatre",
    borough: "Manhattan",
    centroid: { x: 45, y: 35 },
    neighbors: [161, 48, 186],
  },
  {
    id: 132,
    name: "JFK Airport",
    borough: "Queens",
    centroid: { x: 78, y: 72 },
    neighbors: [138, 10],
  },
  {
    id: 138,
    name: "LaGuardia Airport",
    borough: "Queens",
    centroid: { x: 72, y: 28 },
    neighbors: [7, 132],
  },
  {
    id: 48,
    name: "Clinton East",
    borough: "Manhattan",
    centroid: { x: 38, y: 31 },
    neighbors: [230, 163],
  },
  {
    id: 170,
    name: "Murray Hill",
    borough: "Manhattan",
    centroid: { x: 62, y: 47 },
    neighbors: [161, 162],
  },
  {
    id: 79,
    name: "East Village",
    borough: "Manhattan",
    centroid: { x: 59, y: 62 },
    neighbors: [107, 148],
  },
  {
    id: 7,
    name: "Astoria",
    borough: "Queens",
    centroid: { x: 70, y: 22 },
    neighbors: [138, 146],
  },
];

const demandByZone: Record<number, Record<Horizon, number>> = {
  161: { 15: 44, 30: 61, 60: 93 },
  230: { 15: 39, 30: 58, 60: 88 },
  132: { 15: 31, 30: 55, 60: 102 },
  138: { 15: 24, 30: 42, 60: 73 },
  48: { 15: 27, 30: 39, 60: 61 },
  170: { 15: 25, 30: 37, 60: 58 },
  79: { 15: 21, 30: 34, 60: 56 },
  7: { 15: 18, 30: 28, 60: 46 },
};

const baselineByZone: Record<number, Record<Horizon, number>> = {
  161: { 15: 36, 30: 53, 60: 84 },
  230: { 15: 35, 30: 49, 60: 79 },
  132: { 15: 25, 30: 45, 60: 88 },
  138: { 15: 22, 30: 36, 60: 65 },
  48: { 15: 25, 30: 35, 60: 55 },
  170: { 15: 22, 30: 34, 60: 52 },
  79: { 15: 18, 30: 29, 60: 48 },
  7: { 15: 16, 30: 25, 60: 40 },
};

const trends: Record<number, number[]> = {
  161: [32, 35, 37, 40, 44],
  230: [29, 31, 35, 36, 39],
  132: [20, 22, 26, 29, 31],
  138: [18, 19, 20, 23, 24],
  48: [24, 23, 25, 27, 27],
  170: [18, 21, 22, 24, 25],
  79: [13, 16, 17, 19, 21],
  7: [12, 14, 15, 17, 18],
};

export function getZone(zoneId: number) {
  return zones.find((zone) => zone.id === zoneId);
}

export function buildForecast(zoneId: number, horizon: Horizon): ZoneForecast | null {
  const zone = getZone(zoneId);
  if (!zone) {
    return null;
  }

  const predictedDemand = demandByZone[zoneId]?.[horizon];
  const baselineDemand = baselineByZone[zoneId]?.[horizon];

  if (predictedDemand === undefined || baselineDemand === undefined) {
    return null;
  }

  const margin = Math.max(4, Math.round(predictedDemand * 0.14));
  const lift = predictedDemand - baselineDemand;

  return {
    zoneId,
    horizon,
    predictedDemand,
    baselineDemand,
    confidence: lift >= 8 ? "high" : lift >= 4 ? "medium" : "low",
    lowerBound: Math.max(0, predictedDemand - margin),
    upperBound: predictedDemand + margin,
    recentTrend: trends[zoneId] ?? [],
    weather: {
      condition: "Light rain",
      temperatureF: 63,
      precipitationRisk: 0.42,
    },
    topFactors: [
      "same-zone rolling demand",
      "weekday evening seasonality",
      "nearby-zone pickup lift",
      "weather-adjusted airport flow",
    ],
  };
}

export function buildHotspots(horizon: Horizon, limit = 5) {
  return zones
    .map((zone) => {
      const forecast = buildForecast(zone.id, horizon);
      if (!forecast) {
        return null;
      }

      const lift = forecast.predictedDemand - forecast.baselineDemand;
      const surgeScore = Math.round((forecast.predictedDemand + lift * 1.8) * 10) / 10;

      return {
        ...forecast,
        surgeScore,
      };
    })
    .filter((forecast): forecast is NonNullable<typeof forecast> => forecast !== null)
    .sort((a, b) => b.surgeScore - a.surgeScore)
    .slice(0, limit)
    .map((forecast, index) => ({
      ...forecast,
      rank: index + 1,
    }));
}

export function buildRepositionRecommendations(
  originZoneId: number,
  horizon: Horizon,
): RepositionRecommendation[] {
  const origin = getZone(originZoneId);
  if (!origin) {
    return [];
  }

  const candidateIds = Array.from(new Set([...origin.neighbors, ...zones.map((zone) => zone.id)]));

  return candidateIds
    .filter((zoneId) => zoneId !== originZoneId)
    .map((targetZoneId) => {
      const target = getZone(targetZoneId);
      const forecast = buildForecast(targetZoneId, horizon);

      if (!target || !forecast) {
        return null;
      }

      const dx = target.centroid.x - origin.centroid.x;
      const dy = target.centroid.y - origin.centroid.y;
      const distancePenalty = Math.round(Math.sqrt(dx * dx + dy * dy) * 0.18 * 10) / 10;
      const expectedGain = forecast.predictedDemand - forecast.baselineDemand;
      const adjacencyBonus = origin.neighbors.includes(targetZoneId) ? 4 : 0;
      const score = Math.round((expectedGain + adjacencyBonus - distancePenalty) * 10) / 10;

      return {
        originZoneId,
        targetZoneId,
        targetName: target.name,
        expectedGain,
        distancePenalty,
        score,
        reason:
          score >= 8
            ? "high demand lift with manageable reposition cost"
            : "moderate lift; useful when nearby supply is idle",
      };
    })
    .filter((recommendation): recommendation is RepositionRecommendation => recommendation !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

export function parseHorizon(value: string | null): Horizon {
  const parsed = Number(value);

  if (parsed === 15 || parsed === 30 || parsed === 60) {
    return parsed;
  }

  return 30;
}
