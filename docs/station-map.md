# Station Map & Indoor Wayfinding Specification - SmartRail-Navigator

This document defines the coordinate geometry, vector schemas, node-edge topology, and indoor Points of Interest (POI) standards for SmartRail-Navigator station maps.

---

## 1. Station Coordinate Grid & Multi-Level Layout

Terminal stations are mapped onto a normalized $800 \times 600$ vector coordinate grid across three discrete vertical layers:

```
[Level 0: Ground Concourse]  --> Street access, ticketing, turnstiles, restrooms, waiting lounge
       │ (Elevator / Escalator / Stairs)
[Level -1: Mezzanine Overpass] --> Transfer walkways, customer service, security checkpoints
       │ (Elevator / Escalator / Stairs)
[Level -2: Track & Platforms] --> Platforms 1 through 8, safety screen doors, train boarding spots
```

---

## 2. Wayfinding Graph Schema

### 2.1 Node Definition (`station_nodes.json`)
```json
{
  "nodeId": "NODE_CENTRAL_L0_EL2",
  "stationId": "STN_METRO_CENTRAL",
  "floor": 0,
  "x": 380,
  "y": 240,
  "type": "ELEVATOR",
  "label": "Elevator EL-2 (Accessible)",
  "accessible": true,
  "connectsTo": ["NODE_CENTRAL_L_MINUS_1_EL2", "NODE_CENTRAL_L_MINUS_2_EL2"]
}
```

### 2.2 Edge Definition (`station_edges.json`)
```json
{
  "edgeId": "EDGE_ENTRANCE_TO_GATE_WIDE",
  "fromNode": "NODE_CENTRAL_L0_MAIN_ENTRANCE",
  "toNode": "NODE_CENTRAL_L0_GATE_ACCESSIBLE",
  "distanceMeters": 45,
  "walkingSeconds": 38,
  "isStepFree": true,
  "hasTactilePaving": true
}
```

---

## 3. Points of Interest (POI) Taxonomy

| Category | Type Code | Description | Accessibility Features |
| :--- | :--- | :--- | :--- |
| **Entrance** | `POI_ENTRANCE` | Main North / South street entrances | Automatic sliding doors, ramp access |
| **Fare Control** | `POI_GATE_WIDE` | Ticket barrier with wheelchair clearance | Width $\ge 950\text{mm}$, audio beep confirmation |
| **Ticketing** | `POI_TICKET_OFFICE` | Counter & automated TVMs | Braille keypad, lowered height screen |
| **Vertical Access** | `POI_ELEVATOR` | High-capacity passenger lifts | Voice announcements, emergency intercom |
| **Boarding** | `POI_PLATFORM` | Train platform bays (e.g., 1A, 2, 3, 4) | High-contrast platform edge tactile tiles |
| **Amenities** | `POI_RESTROOM` | Public and family facilities | Accessible stall with grab bars |
| **Assistance** | `POI_HELP_POINT` | Customer assistance intercoms | Direct connection to station master |

---

## 4. SVG Vector Rendering Conventions

1. **Station Base Layer**:
   - Concourse outline: `stroke="var(--border-glass)" fill="rgba(30, 41, 59, 0.6)"`
   - Platform tracks: `stroke="var(--accent-cyan)" stroke-dasharray="6,4"`
2. **Pathfinding Highlight Overlay**:
   - Active walking route: `stroke="var(--accent-amber)" stroke-width="4" stroke-linecap="round"`
   - Accessible route: `stroke="var(--accent-emerald)" stroke-width="4" stroke-dasharray="8,4"` with animated dash offset.
3. **Pointers & Interactive Pins**:
   - Pulse animation on user's current location pin and target platform dock.
