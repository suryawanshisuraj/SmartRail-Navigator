/**
 * SmartRail Navigator - Express Application Setup
 * Decoupled from server listener for seamless compatibility with
 * standalone Node.js and Vercel Serverless Functions.
 */

import express from 'express';
import cors from 'cors';
import { createTransitRouter } from './routes/transitRoutes.js';

export function createApp(wssInstance = null) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  const transitRouter = createTransitRouter();

  // Mount under both '/api' and '/' so routes match locally and in serverless environments
  app.use('/api', transitRouter);
  app.use('/', transitRouter);

  const healthHandler = (req, res) => {
    res.json({
      status: 'HEALTHY',
      system: 'SmartRail Navigator API',
      dataNotice: 'Mumbai Central Line Suburban Rail Services (CSMT to Kalyan)',
      uptimeSeconds: process.uptime(),
      activeWebSockets: wssInstance ? wssInstance.clients.size : 0
    });
  };

  app.get('/api/health', healthHandler);
  app.get('/health', healthHandler);

  // 404 Fallback for unmatched routes
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: `Cannot ${req.method} ${req.path}. Endpoint not found.`
    });
  });

  // Centralized Express error handler
  app.use((err, req, res, next) => {
    console.error('[Server Error]', err);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
      success: false,
      error: err.message || 'Internal Server Error'
    });
  });

  return app;
}

const defaultApp = createApp();
export default defaultApp;
