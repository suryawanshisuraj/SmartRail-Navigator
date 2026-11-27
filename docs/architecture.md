# System Architecture

SmartRail Navigator is architected as a decoupled, modern transit wayfinding and telemetry platform optimized for high responsiveness, real-time interactivity, and offline resilience.

## High-Level Overview

```
┌────────────────────────────────────────────────────────┐
│                   Frontend Client                      │
│   (Vite + React 18 + Leaflet + Lucide + Vanilla CSS)   │
└───────────────▲────────────────────────▲───────────────┘
                │                        │
         REST API (HTTP/JSON)       WebSockets (ws://)
                │                        │
┌───────────────▼────────────────────────▼───────────────┐
│                   Backend Service                      │
│        (Node.js + Express + WS Server)                 │
├────────────────────────────────────────────────────────┤
│  • A* & Dijkstra Indoor Navigation Graph Engine        │
│  • Grounded Station AI Assistant & NLP Matcher         │
│  • OSM Overpass Real-Time Geographic Amenities Proxy   │
│  • Telemetry & Periodic Live Announcements Gateway     │
└───────────────▲────────────────────────────────────────┘
                │
┌───────────────▼────────────────────────────────────────┐
│                   Data Tier                            │
│  • Real Indian Stations Database (50+ Mumbai Stations) │
│  • PostgreSQL Relational Schema (12 Tables)            │
│  • In-Memory Fast Graph Fallback Engine                │
└────────────────────────────────────────────────────────┘
```

---

## 1. Frontend Architecture

- **Core Framework**: React 18 (SPA) bundled with Vite 5 for fast HMR and optimized production bundles.
- **Styling**: Vanilla CSS Design Tokens (`index.css`) with glassmorphism, responsive grid layouts, and accessibility styling.
- **Mapping & Wayfinding**:
  - `RealStationMap.jsx`: Leaflet OpenStreetMap integration rendering accurate geographic footprints, platforms, tracks, and pedestrian walking paths.
  - `StationMap2D.jsx`: Interactive SVG schematic floorplan supporting multi-level navigation (Concourse vs. Foot Over Bridge / Mezzanine).
- **Voice Guidance**: Web Speech Synthesis API providing turn-by-turn guidance in English, Hindi, and Marathi.
- **Hardware Integration**:
  - QR Code Scanning (camera stream or manual simulation).
  - HTML5 Geolocation API with Haversine nearest-station matching.

---

## 2. Backend Architecture

- **Runtime**: Node.js (ES Modules).
- **Web Framework**: Express 4 with modular route handlers.
- **Routing Engine**:
  - `StationGraph`: In-memory graph model maintaining station nodes and directional edges.
  - `calculateAStarRoute`: Weighted Euclidean heuristic $f(n) = g(n) + h(n)$ with accessibility constraints (pruning stairs/escalators in wheelchair mode).
- **Real-Time Telemetry**: WebSocket gateway (`ws`) broadcasting periodic live announcements and station alerts.
- **OSM Integration**: Overpass API proxy with memory and cache layers to enrich stations with live public railway amenities.

---

## 3. Data Storage & Relational Model

- **PostgreSQL Schema (`database/schema.sql`)**: 12 normalized tables:
  1. `users`: Authentication & role-based access.
  2. `stations`: Railway stations catalog.
  3. `floors`: Multi-level floor definitions.
  4. `navigation_nodes`: Graph vertices (entrances, platforms, stairs, lifts, amenities).
  5. `navigation_edges`: Graph edges (walkways, escalators, ramps) with distance and accessibility flags.
  6. `facilities`: Station amenities (ticket counters, restrooms, food courts).
  7. `qr_locations`: Physical QR placards mapped to node IDs.
  8. `platforms`: Platform metadata, tracks, and train assignments.
  9. `trains`: Train schedules and route metadata.
  10. `schedules`: Arrival/departure platform timetables.
  11. `station_updates`: Live delay alerts and maintenance announcements.
  12. `accessibility_features`: Tactile paving, ramps, audio beacons, wheelchair assistance.
- **Embedded In-Memory Fallback (`realIndianStations.js`)**: Production-ready station topology for 50+ stations along the Mumbai Central Line (CSMT to Kalyan) and Western Line, enabling instant out-of-the-box operation without requiring an external database connection during development.

---

## 4. Communication Protocols

| Channel | Protocol | Usage |
| :--- | :--- | :--- |
| **REST API** | HTTP/1.1 (JSON) | Station catalog, A* routing, fare calculation, station search, AI queries |
| **Live Telemetry** | WebSocket (`ws://`) | Live service alerts, delay updates, and broadcast announcements |
| **External OSM** | HTTPS (Overpass API) | Dynamic platform and railway feature enrichment with caching |

---

## 5. Security & Reliability

- Input sanitization on all route and search queries.
- No plain-text secrets or hardcoded API keys in frontend code.
- Strict CORS configuration and graceful offline/service worker fallbacks.
