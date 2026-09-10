# SmartRail Navigator 🚆🧭

> **AI-Powered Railway Station Indoor Navigation System**

SmartRail Navigator is an intelligent indoor navigation and wayfinding platform designed specifically for large railway stations. It solves the passenger orientation challenge across complex multi-platform terminals by combining **QR-based positioning, A* graph pathfinding, 2D interactive station floor plans, multi-language voice guidance (English, Hindi, Marathi), and a strictly grounded AI travel assistant**.

---

## 🎯 The Core Flow

```
              SMART RAIL NAVIGATOR
                       │
                       ▼
                Select Station
                       │
                       ▼
                 Scan QR Code
                       │
                       ▼
               Current Location
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
      Shortest      Fastest      Accessible
                       │
                       ▼
                  A* Algorithm
                       │
                       ▼
                Interactive Map
                       │
                       ▼
              Turn-by-Turn Guide
                       │
                       ▼
                Voice Navigation
```

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React / Next.js + Modern Tailwind CSS / CSS Tokens | Responsive, clean, accessible interface |
| **Map & Wayfinding** | Interactive 2D Vector Station Map (SVG / Canvas) | Multi-floor level selector, node-edge visualization |
| **Backend** | Node.js + Express | REST API, A* navigation engine, AI orchestrator |
| **Database** | PostgreSQL | 12 tables storing stations, floors, nodes, edges, facilities |
| **Navigation** | A* Algorithm + Dijkstra Fallback | Euclidean distance heuristic + accessibility constraints |
| **Positioning** | QR Code Scanning & Simulation | Instant location resolution at known station points |
| **Voice Navigation**| Web Speech Synthesis API | Turn-by-turn spoken guidance in English, Hindi, and Marathi |
| **AI Assistant** | Grounded Station AI Copilot | Answers navigation queries using station database only |

---

## 📁 Project Architecture

```text
SmartRail-Navigator/
│
├── README.md                 # Project overview and quick start guide
├── PROJECT_REQUIREMENTS.md   # Problem statement, requirements, user personas
├── FEATURES.md               # P0 (Must Have), P1, P2, P3 feature matrix
├── ARCHITECTURE.md           # System architecture, communication, and security
├── DATABASE.md               # 12-table indoor station relational schema
├── API_DOCUMENTATION.md      # REST endpoints for stations, QR, A* navigation, AI
├── NAVIGATION_ENGINE.md      # Graph model, A* algorithm cost f(n)=g(n)+h(n), route modes
├── AI_ASSISTANT.md           # Strict AI grounding rules (no hallucinations)
├── ACCESSIBILITY.md          # Wheelchair mode, Senior mode, Visually Impaired mode
├── REAL_TIME_SYSTEM.md       # WebSocket events, path blocking, demo data guidelines
├── TESTING.md                # Test suites across navigation, QR, AI, accessibility
├── SECURITY.md               # JWT, password hashing, RBAC, input validation
├── DEVELOPMENT_PLAN.md       # 14-phase incremental roadmap
├── CODING_RULES.md           # 20 core software engineering principles
├── AI_AGENT_RULES.md         # Source of truth and operational rules for AI agents
├── .env.example              # Environment variables template
├── .gitignore                # Workspace git exclusion rules
│
├── frontend/                 # Interactive Station Navigation Client
├── backend/                  # A* Navigation Engine & REST API Service
├── database/                 # PostgreSQL schema and demo station seeds
├── tests/                    # Automated unit, integration, and a11y tests
└── docs/                     # Visual user flow, station map, and deployment docs
```

---

## 🚀 Quick Start (Phase 1 Prototype)

### 1. Start the Backend API & Navigation Engine
```bash
cd backend
npm install
npm run dev
# Backend runs on http://localhost:5000
```

### 2. Launch the Station Navigator Frontend
```bash
cd ../frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

---

## ⚠️ Important Note on Demonstration Data
All station layouts, platforms, train tracks, and facilities in this prototype represent **Demo/Simulated Station Data** designed to demonstrate technical capabilities for evaluation and presentation.
