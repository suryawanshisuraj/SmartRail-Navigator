# API Documentation

## Authentication

POST /api/auth/register

POST /api/auth/login

POST /api/auth/logout

## Stations

GET /api/stations

GET /api/stations/:stationId

## Facilities

GET /api/stations/:stationId/facilities

GET /api/facilities/:facilityId

## QR

POST /api/navigation/qr-scan

## Navigation

POST /api/navigation/route

Request:

{
  "stationId": 1,
  "startNodeId": "NODE_001",
  "destinationNodeId": "NODE_020",
  "routeType": "ACCESSIBLE"
}

Response:

{
  "distance": 120,
  "estimatedTime": 90,
  "route": [],
  "instructions": []
}

## AI

POST /api/ai/chat

## Updates

GET /api/station-updates

## Emergency

GET /api/emergency-locations/:stationId

## Admin

POST /api/admin/facilities

PUT /api/admin/facilities/:id

DELETE /api/admin/facilities/:id

POST /api/admin/updates

PUT /api/admin/updates/:id
