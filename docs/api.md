# SmartRail Navigator - API Reference

The SmartRail Navigator backend exposes RESTful HTTP endpoints and a real-time WebSocket event gateway. All requests and responses use JSON.

Base URL: `http://localhost:5000/api` (or `/api` in deployed environments).

---

## 1. System Health & Diagnostics

### `GET /api/health`
Returns system status, active WebSocket clients, and service metadata.

**Response `200 OK`**:
```json
{
  "status": "HEALTHY",
  "system": "SmartRail Navigator API",
  "dataNotice": "Mumbai Central Line Suburban Rail Services (CSMT to Kalyan)",
  "uptimeSeconds": 142.5,
  "activeWebSockets": 1
}
```

---

## 2. Stations & Search

### `GET /api/stations`
Returns the full catalog of supported Indian railway stations with geographic coordinates, zones, railway lines, and platform counts.

**Response `200 OK`**:
```json
{
  "success": true,
  "count": 26,
  "data": [
    {
      "id": 1,
      "code": "CSMT",
      "name": "Chhatrapati Shivaji Maharaj Terminus",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zone": "Central Railway",
      "latitude": 18.9400,
      "longitude": 72.8354,
      "railwayLines": ["Central Line", "Harbour Line"],
      "totalPlatforms": 18
    }
  ]
}
```

### `GET /api/stations/search?q=:query`
Performs case-insensitive partial and exact search across station names, codes, and cities.

**Query Parameters:**
- `q` (string, required): Search query (e.g. `Dadar`, `DR`, `Thane`).

**Response `200 OK`**:
```json
{
  "success": true,
  "query": "Dadar",
  "results": [
    {
      "id": 8,
      "code": "DR",
      "name": "Dadar",
      "zone": "Central Railway / Western Railway",
      "city": "Mumbai"
    }
  ]
}
```

### `GET /api/stations/:stationId`
Fetches complete graph layout for a specific station, including nodes, edges, QR placards, and facilities.

**Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Chhatrapati Shivaji Maharaj Terminus",
    "totalPlatforms": 18,
    "nodes": [ ... ],
    "edges": [ ... ],
    "qrLocations": [ ... ],
    "facilities": [ ... ]
  }
}
```

### `GET /api/stations/:stationId/facilities`
Lists all station amenities (ticket counters, restrooms, food courts, lifts, water booths).

### `GET /api/stations/:stationId/osm-features`
Fetches verified OpenStreetMap geographic features (platforms, tracks, station building polygons) surrounding the station.

---

## 3. Navigation & Wayfinding

### `POST /api/navigation/route`
Computes an optimal path using the indoor A* navigation engine with accessibility filtering.

**Request Body:**
```json
{
  "stationId": 1,
  "startNodeId": "NODE_CSMT_ENTRY_EAST",
  "destinationNodeId": "NODE_CSMT_PLT_1",
  "routeType": "ACCESSIBLE"
}
```

**Parameters:**
- `stationId` (number): Target station ID.
- `startNodeId` (string): Starting graph node ID.
- `destinationNodeId` (string): Target destination node ID.
- `routeType` (string): `"NORMAL"`, `"ACCESSIBLE"`, or `"FASTEST"`.

**Response `200 OK`**:
```json
{
  "success": true,
  "distance": 85,
  "estimatedTime": 64,
  "route": ["NODE_CSMT_ENTRY_EAST", "NODE_CSMT_CONCOURSE", "NODE_CSMT_PLT_1"],
  "pathNodes": [ ... ],
  "instructions": [
    "Head straight towards Central Concourse",
    "Proceed straight ahead to Platform 1"
  ],
  "accessible": true
}
```

### `POST /api/navigation/qr-scan`
Resolves physical QR code placards to indoor station nodes.

**Request Body:**
```json
{
  "qrCode": "QR_CSMT_EAST",
  "stationId": 1
}
```

**Response `200 OK`**:
```json
{
  "success": true,
  "code": "QR_CSMT_EAST",
  "node": {
    "id": "NODE_CSMT_ENTRY_EAST",
    "name": "Chhatrapati Shivaji Maharaj Terminus - East Entrance",
    "type": "ENTRANCE",
    "floor_id": 1
  }
}
```

### `POST /api/routes/search`
Inter-station train journey route planner between origin and destination stations.

**Request Body:**
```json
{
  "originStationId": 1,
  "destinationStationId": 8
}
```

---

## 4. Fares & Ticketing

### `POST /api/fare/calculate`
Calculates suburban passenger rail fares based on origin, destination, and ticket class.

**Request Body:**
```json
{
  "originStationId": 1,
  "destinationStationId": 18,
  "travelClass": "SECOND_CLASS"
}
```

**Classes supported:** `SECOND_CLASS`, `FIRST_CLASS`, `AC_LOCAL`.

---

## 5. AI Station Assistant

### `POST /api/ai/chat`
Station AI Assistant for natural language wayfinding, platform directions, accessibility questions, and timetable info.

**Request Body:**
```json
{
  "message": "Where is the wheelchair accessible lift for Platform 4?",
  "currentNodeId": "NODE_CSMT_ENTRY_EAST",
  "accessibleMode": true,
  "stationId": 1
}
```

**Response `200 OK`**:
```json
{
  "success": true,
  "reply": "To reach Platform 4 with step-free access: proceed via Central Concourse to Elevator L-1, ascend to Foot Over Bridge, and descend via the Platform 4 lift.",
  "destinationNodeId": "NODE_CSMT_PLT_4",
  "route": { ... }
}
```

---

## 6. Real-Time Telemetry & WebSocket

### `GET /api/station-updates`
Returns current operational alerts, delays, and maintenance notices for the railway corridor.

### `WebSocket Gateway (ws://localhost:5000)`
Real-time full duplex event stream.

**Connection Payload:**
```json
{
  "type": "connection_established",
  "message": "Connected to SmartRail Navigator real-time station feed"
}
```

**Periodic Events:**
- `station_announcement`: Broadcast audio/text announcement every 30 seconds.
- `ping` / `pong`: Connection heartbeat.
