/**
 * SmartRail Navigator - Backend Server
 * Express REST API + WebSocket Real-Time Station Event Gateway
 * Strictly complies with ARCHITECTURE.md, REAL_TIME_SYSTEM.md, and API_DOCUMENTATION.md.
 */

import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createApp } from './app.js';

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer();

// Initialize WebSocket server
const wss = new WebSocketServer({ server });

// Attach Express app with WebSocket instance
const app = createApp(wss);
server.on('request', app);

function broadcast(message) {
  const payload = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Periodic station real-time broadcast (Mumbai Central Line)
if (!process.env.VERCEL) {
  setInterval(() => {
    broadcast({
      type: 'station_announcement',
      message: 'Mumbai Central Railway Suburban Services running normally across CSMT, Dadar, Thane & Kalyan corridors. Follow indicator displays.',
      timestamp: new Date().toISOString()
    });
  }, 30000);
}

// WebSocket allowed origins (reuse CORS_ORIGIN env var)
const WS_ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5000')
  .split(',')
  .map(o => o.trim());
const MAX_WS_CONNECTIONS = 50;

// Verify origin on WebSocket upgrade
wss.on('headers', (headers, req) => {
  const origin = req.headers.origin;
  if (origin && !WS_ALLOWED_ORIGINS.includes(origin)) {
    console.warn(`[WebSocket] Rejected connection from unauthorized origin: ${origin}`);
  }
});

wss.on('connection', (ws, req) => {
  // Enforce connection limit
  if (wss.clients.size > MAX_WS_CONNECTIONS) {
    ws.close(1013, 'Server at capacity. Try again later.');
    return;
  }

  // Verify origin
  const origin = req.headers.origin;
  if (origin && !WS_ALLOWED_ORIGINS.includes(origin)) {
    ws.close(1008, 'Origin not allowed.');
    return;
  }

  console.log(`[WebSocket] Client connected (${wss.clients.size}/${MAX_WS_CONNECTIONS}).`);

  // Initial welcome event
  ws.send(JSON.stringify({
    type: 'connection_established',
    message: 'Connected to SmartRail Navigator real-time station feed (Mumbai Central Line Suburban Network)'
  }));

  ws.on('message', message => {
    try {
      const parsed = JSON.parse(message);
      if (parsed.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (e) {
      console.error('[WebSocket] Failed to parse client message:', e.message);
    }
  });

  ws.on('close', () => {
    console.log(`[WebSocket] Client disconnected (${wss.clients.size}/${MAX_WS_CONNECTIONS}).`);
  });
});

if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`🚆 SmartRail Navigator API running on http://localhost:${PORT}`);
    console.log(`🛰️ WebSocket real-time gateway active on ws://localhost:${PORT}`);
  });
}

export default app;
