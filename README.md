# SmartRail Navigator 🚆🧭

> **Intelligent Railway Station Indoor Wayfinding & Telemetry System**

SmartRail Navigator is an indoor navigation and wayfinding platform designed specifically for large, complex railway stations. It solves the passenger orientation challenge across multi-platform terminals by combining **QR-based positioning, A* graph pathfinding, multi-level interactive station floor plans, OpenStreetMap railway infrastructure integration, multi-language voice guidance (English, Hindi, Marathi), and a strictly grounded AI travel assistant**.

---

## 🎯 The Core Flow

```
              SMART RAIL NAVIGATOR
                       │
                       ▼
                Select Station
                       │
                       ▼
                 Scan QR Code / Live GPS
                       │
                       ▼
               Current Location Detected
                       │
                       ▼
            "Where do you want to go?"
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Platform     Restroom     Food Court
          │            │            │
          └────────────┼────────────┘
                       ▼
                Route Selection
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
      Shortest      Fastest      Accessible (Step-Free)
                       │
                       ▼
                  A* Algorithm
                       │
                       ▼
                Interactive Map (Leaflet / 2D Schematic)
                       │
                       ▼
              Turn-by-Turn Guide
                       │
                       ▼
                Voice Navigation (EN / HI / MR)
```

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite 5 + Vanilla CSS Tokens | Ultra-fast SPA with dark-mode glassmorphism and high-contrast accessibility |
| **Mapping & GIS** | Leaflet + OpenStreetMap + SVG Floorplans | Real geographic coordinates, OSM Overpass platform extraction, and 2D schematic layouts |
| **Backend** | Node.js + Express (ES Modules) | RESTful API, route computation engine, and AI natural language assistant |
| **Navigation** | A* Graph Algorithm + Dijkstra Fallback | Euclidean heuristic $f(n) = g(n) + h(n)$ with dynamic accessibility pruning |
| **Real-Time Gateway** | WebSocket (`ws`) | Live delay broadcasts, audio/text station announcements |
| **Positioning** | QR Placard Scanning & HTML5 Geolocation | Instant indoor checkpoint resolution and live device GPS matching |
| **Voice Navigation** | Web Speech Synthesis API | Spoken turn-by-turn guidance in English, Hindi, and Marathi |
| **Database** | PostgreSQL Schema (12 Tables) + In-Memory Fallback | Fully relational DDL with built-in in-memory fallback for 50+ Mumbai stations |

---

## 📁 Project Architecture

```text
SmartRail-Navigator/
│
├── README.md                 # Project overview and quick start guide
├── .env.example              # Environment variables template
├── .gitignore                # Production git exclusion rules
├── package.json              # Monorepo management scripts
├── build.js                  # Automated multi-tier production builder
├── vercel.json               # Serverless deployment configuration
│
├── docs/                     # Technical specifications and architecture guides
│   ├── accessibility.md      # Wheelchair, senior, and visually impaired modes
│   ├── ai-assistant.md       # Grounded AI Copilot rules and prompt boundaries
│   ├── api.md                # Comprehensive REST API and WebSocket reference
│   ├── architecture.md       # System architecture, tiers, and data flows
│   ├── database.md           # 12-table indoor station relational schema
│   ├── deployment.md         # Production deployment guide (Vercel, Node, Docker)
│   ├── features.md           # P0, P1, P2, P3 feature matrix
│   ├── navigation-engine.md  # Graph model, A* algorithm cost function, heuristics
│   ├── real-time-system.md   # WebSocket events and telemetry guidelines
│   ├── requirements.md       # Problem statement, requirements, user personas
│   ├── security.md           # Security best practices and data protection
│   ├── station-map.md        # Station indoor layout specifications
│   ├── testing.md            # Automated testing guide
│   └── user-flow.md          # Visual passenger user journeys
│
├── frontend/                 # Interactive React + Vite Station Navigation Client
│   ├── src/
│   │   ├── components/       # UI components (Leaflet Map, 2D Schematic, Nav Panel, AI Drawer)
│   │   ├── services/         # Transit API service, OSM Overpass, and client graph fallback
│   │   ├── data/             # Real Indian station datasets and train schedules
│   │   ├── App.jsx           # Main application view with tab orchestration
│   │   └── index.css         # Design system tokens and styles
│   └── vite.config.js
│
├── backend/                  # Express REST API & Real-Time WebSocket Server
│   ├── src/
│   │   ├── controllers/      # Transit and navigation request handlers
│   │   ├── engine/           # A* indoor navigation graph engine
│   │   ├── routes/           # Express API route declarations
│   │   ├── services/         # OSM Overpass API proxy with memory caching
│   │   ├── data/             # Indian railway stations and network topology
│   │   ├── app.js            # Express application factory
│   │   └── server.js         # HTTP + WebSocket server listener
│   └── package.json
│
├── database/                 # Relational PostgreSQL DDL schema & seed datasets
│   ├── schema.sql            # 12-table PostgreSQL schema
│   ├── seeds.sql             # Demo station and platform seeds
│   └── README.md             # Migration and database instructions
│
└── tests/                    # Automated Vitest test suites
    ├── a11y.test.js          # Accessibility and wheelchair routing tests
    ├── api.test.js           # REST endpoint and route calculation tests
    ├── navigation-engine.test.js # A* pathfinding and priority queue tests
    └── real-station-osm-routing.test.js # Real OSM coordinate routing tests
```

---

## 🚀 Quick Start

### 1. Run the Entire Project (From Root)
```bash
# Install dependencies
npm install
npm install --prefix backend
npm install --prefix frontend

# Start the Backend Server (http://localhost:5000)
npm run dev:backend

# Start the Frontend App (http://localhost:5173)
npm run dev:frontend
```

### 2. Run Automated Test Suites
```bash
npm test
```

### 3. Production Build
```bash
npm run build
```

---

## 📚 Technical Documentation

Explore the complete system documentation in [`docs/`](docs/):
- **[System Architecture](docs/architecture.md)** — Architectural design, client-server data flows, and tech stack details.
- **[API Documentation](docs/api.md)** — Complete specification of all REST endpoints and WebSocket events.
- **[Navigation Engine](docs/navigation-engine.md)** — Graph structure, A* heuristic calculation, and multi-floor routing.
- **[Accessibility Specification](docs/accessibility.md)** — Wheelchair pathfinding, senior mode, and screen-reader standards.
- **[Database Schema](docs/database.md)** — PostgreSQL 12-table relational design.
- **[User Flows](docs/user-flow.md)** — Visual step-by-step passenger navigation journeys.
