import type { Horizon, RepositionRecommendation, Zone, ZoneForecast } from "./types";
import forecastArtifact from "./forecast-artifact.json";

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

type ArtifactForecast = Omit<ZoneForecast, "zoneId" | "horizon">;

type ForecastArtifact = {
  modelVersion: string;
  generatedAt: string;
  source: {
    mode: string;
    recordCount: number;
    zoneCount: number;
    inputPath: string;
  };
  metrics: Record<string, number | string>;
  forecasts: Record<string, Record<string, ArtifactForecast>>;
};

export const artifact = forecastArtifact as ForecastArtifact;

export function getZone(zoneId: number) {
  return zones.find((zone) => zone.id === zoneId);
}

export function buildForecast(zoneId: number, horizon: Horizon): ZoneForecast | null {
  const zone = getZone(zoneId);
  if (!zone) {
    return null;
  }

  const artifactForecast = artifact.forecasts[String(zoneId)]?.[String(horizon)];

  if (!artifactForecast) {
    return null;
  }

  return {
    zoneId,
    horizon,
    ...artifactForecast,
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
