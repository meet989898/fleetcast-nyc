"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CloudRain,
  Database,
  MapPinned,
  Navigation,
  RadioTower,
  Timer,
} from "lucide-react";
import { useState } from "react";

import {
  artifact,
  buildForecast,
  buildHotspots,
  buildRepositionRecommendations,
  horizons,
  zones,
} from "@/lib/demo-data";
import type { Horizon, ZoneForecast } from "@/lib/types";

const confidenceLabel: Record<ZoneForecast["confidence"], string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

const metricFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

export function FleetcastDashboard() {
  const [horizon, setHorizon] = useState<Horizon>(30);
  const [selectedZoneId, setSelectedZoneId] = useState(161);

  const selectedZone = zones.find((zone) => zone.id === selectedZoneId) ?? zones[0];
  const forecast = buildForecast(selectedZone.id, horizon);
  const hotspots = buildHotspots(horizon, 5);
  const recommendations = buildRepositionRecommendations(selectedZone.id, horizon);
  const zoneForecasts = zones.map((zone) => ({
    zone,
    forecast: buildForecast(zone.id, horizon),
  }));
  const maxDemand = Math.max(...zoneForecasts.map((item) => item.forecast?.predictedDemand ?? 0));
  const totalDemand = zoneForecasts.reduce(
    (sum, item) => sum + (item.forecast?.predictedDemand ?? 0),
    0,
  );
  const selectedLift = forecast ? forecast.predictedDemand - forecast.baselineDemand : 0;

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-block">
          <span className="brand-mark">FC</span>
          <div>
            <p className="eyebrow">FleetCast NYC</p>
            <h1>Taxi demand command center</h1>
          </div>
        </div>
        <div className="header-actions" aria-label="Project links and status">
          <span className="status-badge online">
            <RadioTower size={16} aria-hidden="true" />
            Live demo mode
          </span>
          <a href="https://github.com/meet989898/fleetcast-nyc" rel="noreferrer" target="_blank">
            <ArrowUpRight size={16} aria-hidden="true" />
            Repository
          </a>
        </div>
      </header>

      <section className="kpi-row" aria-label="Model and forecast summary">
        <KpiCard icon={<Activity size={18} />} label="Forecast volume" value={totalDemand} suffix="pickups" />
        <KpiCard icon={<BarChart3 size={18} />} label="Fixture MAE" value={artifact.metrics.mae} />
        <KpiCard icon={<Database size={18} />} label="Sample records" value={artifact.source.recordCount} />
        <KpiCard icon={<CheckCircle2 size={18} />} label="Model" value={artifact.modelVersion} />
      </section>

      <section className="operations-grid">
        <aside className="control-panel" aria-label="Forecast controls">
          <div className="panel-title">
            <div>
              <p className="section-label">Control</p>
              <h2>Forecast window</h2>
            </div>
            <Timer size={20} aria-hidden="true" />
          </div>

          <div className="segmented-control" aria-label="Forecast horizon">
            {horizons.map((option) => (
              <button
                className={option === horizon ? "active" : ""}
                key={option}
                onClick={() => setHorizon(option)}
                type="button"
              >
                {option}m
              </button>
            ))}
          </div>

          <div className="zone-selector" aria-label="Taxi zones">
            {zoneForecasts.map(({ zone, forecast: itemForecast }) => (
              <button
                className={zone.id === selectedZone.id ? "active" : ""}
                key={zone.id}
                onClick={() => setSelectedZoneId(zone.id)}
                type="button"
              >
                <span>
                  <strong>{zone.name}</strong>
                  <small>{zone.borough} #{zone.id}</small>
                </span>
                <b>{itemForecast?.predictedDemand ?? "--"}</b>
              </button>
            ))}
          </div>

          <div className="lineage-strip">
            <span>Source</span>
            <strong>{artifact.source.mode.replace("_", " ")}</strong>
            <small>{artifact.generatedAt}</small>
          </div>
        </aside>

        <section className="map-panel" aria-label="NYC taxi zone demand map">
          <div className="map-toolbar">
            <div>
              <p className="section-label">Predicted pickups</p>
              <h2>{horizon}-minute heat layer</h2>
            </div>
            <div className="weather-chip">
              <CloudRain size={17} aria-hidden="true" />
              Light rain, 63F
            </div>
          </div>

          <div className="zone-map">
            <div className="map-grid" aria-hidden="true" />
            <div className="water water-west" aria-hidden="true" />
            <div className="water water-east" aria-hidden="true" />
            <span className="borough-label manhattan">Manhattan</span>
            <span className="borough-label queens">Queens</span>
            {zoneForecasts.map(({ zone, forecast: itemForecast }) => {
              const demand = itemForecast?.predictedDemand ?? 0;
              const heat = Math.max(0.18, demand / maxDemand);
              const style = {
                "--heat": heat,
                "--x": `${zone.centroid.x}%`,
                "--y": `${zone.centroid.y}%`,
              } as CSSProperties;

              return (
                <button
                  aria-label={`${zone.name}, ${demand} predicted pickups`}
                  className={`map-zone ${zone.id === selectedZone.id ? "selected" : ""}`}
                  key={zone.id}
                  onClick={() => setSelectedZoneId(zone.id)}
                  style={style}
                  type="button"
                >
                  <span>{zone.id}</span>
                  <b>{demand}</b>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="intelligence-panel" aria-label="Selected zone intelligence">
          <div className="panel-title">
            <div>
              <p className="section-label">Zone intelligence</p>
              <h2>{selectedZone.name}</h2>
              <span>{selectedZone.borough} taxi zone #{selectedZone.id}</span>
            </div>
            <MapPinned size={22} aria-hidden="true" />
          </div>

          {forecast ? (
            <>
              <div className="forecast-hero">
                <span>Predicted pickups</span>
                <strong>{forecast.predictedDemand}</strong>
                <small>
                  {selectedLift >= 0 ? "+" : ""}
                  {selectedLift} vs baseline
                </small>
              </div>

              <div className="metric-grid">
                <Metric label="Baseline" value={forecast.baselineDemand} />
                <Metric label="Lower" value={forecast.lowerBound} />
                <Metric label="Upper" value={forecast.upperBound} />
              </div>

              <div className={`confidence ${forecast.confidence}`}>
                <span>{confidenceLabel[forecast.confidence]}</span>
                <b>{forecast.lowerBound}-{forecast.upperBound}</b>
              </div>

              <Sparkline values={forecast.recentTrend} />

              <div className="factor-list">
                {forecast.topFactors.map((factor) => (
                  <span key={factor}>{factor}</span>
                ))}
              </div>
            </>
          ) : null}
        </aside>
      </section>

      <section className="bottom-grid">
        <section className="work-panel" aria-label="Hotspot ranking">
          <div className="panel-title compact">
            <div>
              <p className="section-label">Hotspots</p>
              <h2>Top demand lifts</h2>
            </div>
            <ArrowUpRight size={20} aria-hidden="true" />
          </div>
          <ol className="rank-list">
            {hotspots.map((hotspot) => {
              const zone = zones.find((item) => item.id === hotspot.zoneId);

              return (
                <li key={hotspot.zoneId}>
                  <span>{hotspot.rank}</span>
                  <div>
                    <strong>{zone?.name ?? hotspot.zoneId}</strong>
                    <small>Surge score {hotspot.surgeScore}</small>
                  </div>
                  <b>{hotspot.predictedDemand}</b>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="work-panel" aria-label="Reposition recommendations">
          <div className="panel-title compact">
            <div>
              <p className="section-label">Reposition</p>
              <h2>Best next zones</h2>
            </div>
            <Navigation size={20} aria-hidden="true" />
          </div>
          <div className="recommendation-list">
            {recommendations.map((recommendation) => (
              <button
                key={recommendation.targetZoneId}
                onClick={() => setSelectedZoneId(recommendation.targetZoneId)}
                type="button"
              >
                <span>{recommendation.targetName}</span>
                <strong>{recommendation.score}</strong>
                <small>{recommendation.reason}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="work-panel telemetry-panel" aria-label="Model telemetry">
          <div className="panel-title compact">
            <div>
              <p className="section-label">Backtest</p>
              <h2>Fixture metrics</h2>
            </div>
            <Database size={20} aria-hidden="true" />
          </div>
          <div className="telemetry-grid">
            <Metric label="RMSE" value={artifact.metrics.rmse} />
            <Metric label="WAE" value={artifact.metrics.weighted_absolute_error} />
            <Metric label="Top-k" value={artifact.metrics.top_k_hotspot_precision} />
          </div>
        </section>
      </section>
    </main>
  );
}

function KpiCard({
  icon,
  label,
  suffix,
  value,
}: {
  icon: ReactNode;
  label: string;
  suffix?: string;
  value: number | string;
}) {
  return (
    <div className="kpi-card">
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{formatMetric(value)}</strong>
        {suffix ? <em>{suffix}</em> : null}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{formatMetric(value)}</strong>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);
  const points = values
    .map((value, index) => {
      const x = 4 + (index / Math.max(1, values.length - 1)) * 92;
      const y = 54 - ((value - min) / range) * 42;

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="sparkline" aria-label="Recent demand trend">
      <svg viewBox="0 0 100 64" role="img">
        <polyline points={points} />
      </svg>
    </div>
  );
}

function formatMetric(value: number | string) {
  return typeof value === "number" ? metricFormatter.format(value) : value;
}
