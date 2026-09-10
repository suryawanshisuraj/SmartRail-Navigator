# System Architecture

## Frontend

Next.js
React
Tailwind CSS
React Three Fiber
Three.js

Responsibilities:

- UI
- Station map
- Navigation interface
- QR scanner
- AI chat
- Voice navigation
- Accessibility
- Admin dashboard

## Backend

Node.js
Express

Responsibilities:

- Authentication
- Station data
- Route calculation
- AI integration
- QR location processing
- Real-time updates
- Admin operations

## Database

PostgreSQL

Stores:

- Users
- Stations
- Floors
- Nodes
- Paths
- Facilities
- QR locations
- Platform information
- Station updates
- Accessibility information

## Communication

Frontend <-> REST API <-> Backend

Real-time updates:

Frontend <-> WebSocket <-> Backend

AI:

Frontend -> Backend -> AI Provider

Navigation:

Frontend -> Backend Navigation Engine

## Security

Never expose API keys in frontend code.

All secret keys must be stored in environment variables.
