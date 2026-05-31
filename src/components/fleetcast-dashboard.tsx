"use client";

import { Activity, CloudRain, Database, MapPinned, Navigation, Timer } from "lucide-react";
import { useState } from "react";

import {
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

export function FleetcastDashboard() {
  const [horizon, setHorizon] = useState<Horizon>(30);
  const [selectedZoneId, setSelectedZoneId] = useState(161);

  const selectedZone = zones.find((zone) => zone.id === selectedZoneId) ?? zones[0];
  const forecast = buildForecast(selectedZone.id, horizon);
  const hotspots = buildHotspots(horizon, 5);
  const recommendations = buildRepositionRecommendations(selectedZone.id, horizon);
  const maxDemand = Math.max(...zones.map((zone) => buildForecast(zone.id, horizon)?.predictedDemand ?? 0));

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">FleetCast NYC</p>
          <h1>Taxi demand operations console</h1>
        </div>
        <div className="status-strip" aria-label="System status">
          <span>
            <Database size={16} aria-hidden="true" />
            Demo aggregates
          </span>
          <span>
            <Activity size={16} aria-hidden="true" />
            Model demo-v0
          </span>
        </div>
      </header>

      <section className="control-row" aria-label="Forecast controls">
        <div className="segmented-control" aria-label="Forecast horizon">
          {horizons.map((option) => (
            <button
              className={option === horizon ? "active" : ""}
              key={option}
              onClick={() => setHorizon(option)}
              type="button"
            >
              <Timer size={15} aria-hidden="true" />
              {option}m
            </button>
          ))}
        </div>
        <div className="weather-pill">
          <CloudRain size={16} aria-hidden="true" />
          Light rain, 63F
        </div>
      </section>

      <section className="workspace">
        <section className="map-panel" aria-label="NYC taxi zone demand map">
          <div className="map-header">
            <div>
              <p className="section-label">Predicted pickups</p>
              <h2>{horizon}-minute zone forecast</h2>
            </div>
            <span className="map-chip">Zone-level sample</span>
          </div>

          <div className="zone-map">
            <div className="river river-west" aria-hidden="true" />
            <div className="river river-east" aria-hidden="true" />
            {zones.map((zone) => {
              const zoneForecast = buildForecast(zone.id, horizon);
              const demand = zoneForecast?.predictedDemand ?? 0;
              const heat = Math.max(0.22, demand / maxDemand);

              return (
                <button
                  aria-label={`${zone.name}, predicted demand ${demand}`}
                  className={`map-zone ${zone.id === selectedZone.id ? "selected" : ""}`}
                  key={zone.id}
                  onClick={() => setSelectedZoneId(zone.id)}
                  style={{
                    left: `${zone.centroid.x}%`,
                    opacity: 0.56 + heat * 0.44,
                    top: `${zone.centroid.y}%`,
                    transform: `translate(-50%, -50%) scale(${0.84 + heat * 0.28})`,
                  }}
                  type="button"
                >
                  <span>{zone.id}</span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="detail-panel" aria-label="Selected zone forecast details">
          <div className="panel-heading">
            <div>
              <p className="section-label">Selected zone</p>
              <h2>{selectedZone.name}</h2>
              <span>{selectedZone.borough} #{selectedZone.id}</span>
            </div>
            <MapPinned size={22} aria-hidden="true" />
          </div>

          {forecast ? (
            <>
              <div className="metric-grid">
                <div>
                  <span>Forecast</span>
                  <strong>{forecast.predictedDemand}</strong>
                  <small>pickups</small>
                </div>
                <div>
                  <span>Baseline</span>
                  <strong>{forecast.baselineDemand}</strong>
                  <small>expected</small>
                </div>
                <div>
                  <span>Band</span>
                  <strong>
                    {forecast.lowerBound}-{forecast.upperBound}
                  </strong>
                  <small>pickups</small>
                </div>
              </div>

              <div className={`confidence ${forecast.confidence}`}>
                {confidenceLabel[forecast.confidence]}
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

        <section className="rank-panel" aria-label="Hotspot and reposition recommendations">
          <div className="panel-block">
            <div className="panel-heading compact">
              <div>
                <p className="section-label">Hotspots</p>
                <h2>Top demand lifts</h2>
              </div>
              <Activity size={20} aria-hidden="true" />
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
          </div>

          <div className="panel-block">
            <div className="panel-heading compact">
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
          </div>
        </section>
      </section>
    </main>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * 100;
      const y = 46 - ((value - min) / range) * 34;

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="sparkline" aria-label="Recent demand trend">
      <svg viewBox="0 0 100 52" role="img">
        <polyline points={points} />
      </svg>
    </div>
  );
}
