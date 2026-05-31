export type Horizon = 15 | 30 | 60;

export type Zone = {
  id: number;
  name: string;
  borough: string;
  centroid: {
    x: number;
    y: number;
  };
  neighbors: number[];
};

export type ZoneForecast = {
  zoneId: number;
  horizon: Horizon;
  predictedDemand: number;
  baselineDemand: number;
  confidence: "high" | "medium" | "low";
  lowerBound: number;
  upperBound: number;
  recentTrend: number[];
  weather: {
    condition: string;
    temperatureF: number;
    precipitationRisk: number;
  };
  topFactors: string[];
};

export type Hotspot = ZoneForecast & {
  rank: number;
  surgeScore: number;
};

export type RepositionRecommendation = {
  originZoneId: number;
  targetZoneId: number;
  targetName: string;
  expectedGain: number;
  distancePenalty: number;
  score: number;
  reason: string;
};
