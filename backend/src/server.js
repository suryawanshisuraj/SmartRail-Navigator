/**
 * SmartRail Navigator - Backend Server
 * Express REST API + WebSocket Real-Time Station Event Gateway
 * Strictly complies with ARCHITECTURE.md, REAL_TIME_SYSTEM.md, and API_DOCUMENTATION.md.
 */

import http from 'http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createTransitRouter } from './routes/transitRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocketServer({ server });

function broadcast(message) {
  const payload = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Periodic station real-time broadcast (Mumbai Central Line)
setInterval(() => {
  broadcast({
    type: 'station_announcement',
    message: 'Mumbai Central Railway Suburban Services running normally across CSMT, Dadar, Thane & Kalyan corridors. Follow indicator displays.',
    timestamp: new Date().toISOString()
  });
}, 30000);

wss.on('connection', ws => {
  console.log('[WebSocket] Client connected to station real-time event gateway.');

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
      console.error('[WebSocket] Failed to parse client message:', e);
    }
  });

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected.');
  });
});

// Mount Routes
app.use('/api', createTransitRouter());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    system: 'SmartRail Navigator API',
    dataNotice: 'Mumbai Central Line Suburban Rail Services (CSMT to Kalyan)',
    uptimeSeconds: process.uptime(),
    activeWebSockets: wss.clients.size
  });
});

// 404 Not Found fallback for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.path}. Endpoint not found.`
  });
});

// Centralized Express error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

server.listen(PORT, () => {
  console.log(`🚆 SmartRail Navigator API running on http://localhost:${PORT}`);
  console.log(`🛰️ WebSocket real-time gateway active on ws://localhost:${PORT}`);
});
