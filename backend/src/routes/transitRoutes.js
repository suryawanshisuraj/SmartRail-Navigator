import express from 'express';
import {
  getStations,
  getStationById,
  getFacilities,
  postQRScan,
  postCalculateRoute,
  postAIChat,
  getStationUpdates
} from '../controllers/transitController.js';

export function createTransitRouter() {
  const router = express.Router();

  // Stations
  router.get('/stations', getStations);
  router.get('/stations/:stationId', getStationById);
  router.get('/stations/:stationId/facilities', getFacilities);

  // QR & Navigation
  router.post('/navigation/qr-scan', postQRScan);
  router.post('/navigation/route', postCalculateRoute);

  // AI Assistant
  router.post('/ai/chat', postAIChat);

  // Station Updates
  router.get('/station-updates', getStationUpdates);

  return router;
}
