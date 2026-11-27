/**
 * SmartRail Navigator - Express Application Setup
 * Decoupled from server listener for seamless compatibility with
 * standalone Node.js and Vercel Serverless Functions.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createTransitRouter } from './routes/transitRoutes.js';

export function createApp(wssInstance = null) {
  const app = express();

  // Security headers (XSS, content-type sniffing, clickjacking, etc.)
  app.use(helmet());

  // Rate limiting: 100 requests per minute per IP
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests. Please try again later.' }
  });
  app.use(limiter);

  // CORS: restrict to known origins (comma-separated in CORS_ORIGIN env var)
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5000')
    .split(',')
    .map(o => o.trim());
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, server-to-server, mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    }
  }));

  app.use(express.json({ limit: '1mb' }));

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
