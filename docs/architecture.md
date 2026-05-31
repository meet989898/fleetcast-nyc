# Architecture

FleetCast NYC has four layers:

1. Data ingestion pulls public NYC TLC trip records and zone assets outside Git.
2. Feature generation aggregates pickups into zone-by-15-minute buckets and adds lag, rolling, seasonality, neighbor, and weather features.
3. Forecast serving exposes typed forecast, hotspot, health, and reposition endpoints.
4. The frontend presents a map-first operations console with horizon controls, zone details, hotspots, and reposition recommendations.

Initial implementation uses deterministic demo data so the product surface can be built before the heavier TLC ingestion work lands.
