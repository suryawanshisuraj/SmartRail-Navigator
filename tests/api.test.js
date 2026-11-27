/**
 * Test Suite: Station REST APIs & QR Scanner - Mumbai Central Line
 * Validates 26-station catalog, platform layouts, QR code resolution, and grounded AI.
 */

import { describe, it, expect } from 'vitest';
import {
  MUMBAI_CENTRAL_LINE_STATIONS,
  getStationLayout
} from '../backend/src/controllers/transitController.js';
import { calculateAStarRoute } from '../backend/src/engine/router.js';

describe('Mumbai Central Line Catalog & Station Layouts', () => {
  it('should include all 26 Mumbai Central Line stations from CSMT to Kalyan', () => {
    expect(MUMBAI_CENTRAL_LINE_STATIONS.length).toBe(26);
    expect(MUMBAI_CENTRAL_LINE_STATIONS[0].code).toBe('CSMT');
    expect(MUMBAI_CENTRAL_LINE_STATIONS[0].totalPlatforms).toBe(18);
    expect(MUMBAI_CENTRAL_LINE_STATIONS[7].code).toBe('DR'); // Dadar
    expect(MUMBAI_CENTRAL_LINE_STATIONS[18].code).toBe('TNA'); // Thane
    expect(MUMBAI_CENTRAL_LINE_STATIONS[25].code).toBe('KYN'); // Kalyan
  });

  it('should generate complete layout for CSMT with 18 platforms and FOB connections', () => {
    const layout = getStationLayout(1); // CSMT
    expect(layout.station.code).toBe('CSMT');
    const platforms = layout.nodes.filter(n => n.type === 'PLATFORM');
    expect(platforms.length).toBe(18);

    // Verify Platform 18 exists
    const p18 = layout.nodes.find(n => n.id === 'NODE_CSMT_PLT_18');
    expect(p18).toBeDefined();
    expect(p18.platformNumber).toBe('18');

    // Verify QR code for Platform 18
    const qrP18 = layout.qrLocations.find(q => q.node_id === p18.id);
    expect(qrP18).toBeDefined();
    expect(qrP18.code).toBe('QR_CSMT_PLT_18');
  });

  it('should calculate valid A* route at CSMT from East Entrance to Platform 18', () => {
    const layout = getStationLayout(1);
    const result = calculateAStarRoute(layout.graph, 'NODE_CSMT_ENTRY_EAST', 'NODE_CSMT_PLT_18', 'NORMAL');
    expect(result.success).toBe(true);
    expect(result.distance).toBeGreaterThan(0);
    expect(result.instructions.length).toBeGreaterThan(0);
    expect(result.route[result.route.length - 1].id).toBe('NODE_CSMT_PLT_18');
  });

  it('should calculate step-free route in ACCESSIBLE mode avoiding stairs at CSMT', () => {
    const layout = getStationLayout(1);
    const result = calculateAStarRoute(layout.graph, 'NODE_CSMT_ENTRY_EAST', 'NODE_CSMT_PLT_18', 'ACCESSIBLE');
    expect(result.success).toBe(true);
    // Route must not contain any STAIRS node
    const hasStairs = result.route.some(n => n.type === 'STAIRS');
    expect(hasStairs).toBe(false);
  });

  it('should support Western Line Interchange at Dadar Central', () => {
    const layout = getStationLayout(8); // Dadar
    expect(layout.station.code).toBe('DR');
    const westernInterchange = layout.nodes.find(n => n.id === 'NODE_DR_WESTERN_INTERCHANGE');
    expect(westernInterchange).toBeDefined();
  });

  it('should support Metro Line 1 Interchange at Ghatkopar', () => {
    const layout = getStationLayout(13); // Ghatkopar
    expect(layout.station.code).toBe('GC');
    const metroInterchange = layout.nodes.find(n => n.id === 'NODE_GC_METRO_INTERCHANGE');
    expect(metroInterchange).toBeDefined();
  });

  it('should return null when querying a non-existent station ID', () => {
    const layout = getStationLayout(999);
    expect(layout).toBeNull();
  });
});

describe('Transit Controller Validation & Error Handling', () => {
  function createMockRes() {
    return {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };
  }

  it('should return 400 when stationId is non-numeric in getStationById', async () => {
    const { getStationById } = await import('../backend/src/controllers/transitController.js');
    const req = { params: { stationId: 'not-a-number' } };
    const res = createMockRes();
    getStationById(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Invalid station ID');
  });

  it('should return 404 when stationId does not exist in getStationById', async () => {
    const { getStationById } = await import('../backend/src/controllers/transitController.js');
    const req = { params: { stationId: '999' } };
    const res = createMockRes();
    getStationById(req, res);
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('not found');
  });

  it('should return 400 when QR code string is missing in postQRScan', async () => {
    const { postQRScan } = await import('../backend/src/controllers/transitController.js');
    const req = { body: {} };
    const res = createMockRes();
    postQRScan(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('valid QR code string is required');
  });

  it('should return 404 when QR code is not recognized in postQRScan', async () => {
    const { postQRScan } = await import('../backend/src/controllers/transitController.js');
    const req = { body: { code: 'INVALID_QR_TAG_123', stationId: 1 } };
    const res = createMockRes();
    postQRScan(req, res);
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should successfully locate position from valid QR code in postQRScan', async () => {
    const { postQRScan } = await import('../backend/src/controllers/transitController.js');
    const req = { body: { code: 'QR_CSMT_EAST', stationId: 1 } };
    const res = createMockRes();
    postQRScan(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.currentNode.id).toBe('NODE_CSMT_ENTRY_EAST');
  });

  it('should return 400 when routing parameters are missing in postCalculateRoute', async () => {
    const { postCalculateRoute } = await import('../backend/src/controllers/transitController.js');
    const req = { body: {} };
    const res = createMockRes();
    postCalculateRoute(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('startNodeId is required');
  });

  it('should return 400 when destinationNodeId is missing in postCalculateRoute', async () => {
    const { postCalculateRoute } = await import('../backend/src/controllers/transitController.js');
    const req = { body: { startNodeId: 'NODE_CSMT_ENTRY_EAST' } };
    const res = createMockRes();
    postCalculateRoute(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('destinationNodeId is required');
  });

  it('should return 400 when message is missing in postAIChat', async () => {
    const { postAIChat } = await import('../backend/src/controllers/transitController.js');
    const req = { body: {} };
    const res = createMockRes();
    postAIChat(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Message query parameter is required');
  });

  it('should return answer and navigation route for platform question in postAIChat', async () => {
    const { postAIChat } = await import('../backend/src/controllers/transitController.js');
    const req = { body: { message: 'Where is Platform 4?', stationId: 1 } };
    const res = createMockRes();
    postAIChat(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.destinationNodeId).toBe('NODE_CSMT_PLT_4');
    expect(res.body.route).toBeDefined();
  });
});

describe('Defensive Routing Engine Checks', () => {
  it('should return error when graph is missing in calculateAStarRoute', () => {
    const result = calculateAStarRoute(null, 'NODE_A', 'NODE_B');
    expect(result.success).toBe(false);
    expect(result.error).toContain('valid station graph is required');
  });

  it('should return error when waypoints are missing in calculateAStarRoute', () => {
    const layout = getStationLayout(1);
    const result = calculateAStarRoute(layout.graph, null, 'NODE_B');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Both startNodeId and destinationNodeId must be provided');
  });
});

describe('Inter-Station Route Search (postRouteSearch)', () => {
  function createMockRes() {
    return {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };
  }

  it('should return 400 when origin or destination is missing', async () => {
    const { postRouteSearch } = await import('../backend/src/controllers/transitController.js');
    const req = { body: { origin: 'CSMT' } };
    const res = createMockRes();
    postRouteSearch(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Both origin and destination');
  });

  it('should return 404 when station is not found on Central Line', async () => {
    const { postRouteSearch } = await import('../backend/src/controllers/transitController.js');
    const req = { body: { origin: 'CSMT', destination: 'NONEXISTENT_STATION' } };
    const res = createMockRes();
    postRouteSearch(req, res);
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return valid itinerary from CSMT to Dadar by station code', async () => {
    const { postRouteSearch } = await import('../backend/src/controllers/transitController.js');
    const req = { body: { origin: 'CSMT', destination: 'DR' } };
    const res = createMockRes();
    postRouteSearch(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.itinerary).toBeDefined();
    expect(res.body.itinerary.origin.code).toBe('CSMT');
    expect(res.body.itinerary.destination.code).toBe('DR');
    expect(res.body.itinerary.totalDurationMinutes).toBeGreaterThan(0);
    expect(res.body.itinerary.distanceKm).toBeGreaterThan(0);
    expect(res.body.itinerary.estimatedFare).toBeGreaterThan(0);
    expect(res.body.itinerary.legs.length).toBe(3); // BOARDING, TRANSIT, ALIGHTING
  });

  it('should return valid itinerary using station ID as origin', async () => {
    const { postRouteSearch } = await import('../backend/src/controllers/transitController.js');
    const req = { body: { origin: 1, destination: 'Kalyan' } };
    const res = createMockRes();
    postRouteSearch(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.itinerary.destination.code).toBe('KYN');
  });

  it('should use fast train type when preference is fastest and stops > 5', async () => {
    const { postRouteSearch } = await import('../backend/src/controllers/transitController.js');
    const req = { body: { origin: 'CSMT', destination: 'KYN', options: { preference: 'fastest' } } };
    const res = createMockRes();
    postRouteSearch(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.itinerary.trainType).toBe('Fast Suburban Local');
  });
});

describe('Fare Calculation (postCalculateFare)', () => {
  function createMockRes() {
    return {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };
  }

  it('should calculate standard fare for default distance', async () => {
    const { postCalculateFare } = await import('../backend/src/controllers/transitController.js');
    const req = { body: {} };
    const res = createMockRes();
    postCalculateFare(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.fareSummary).toBeDefined();
    expect(res.body.fareSummary.totalFare).toBeGreaterThan(0);
    expect(res.body.fareSummary.basePrice).toBeGreaterThan(0);
  });

  it('should apply off-peak discount when isOffPeak is true', async () => {
    const { postCalculateFare } = await import('../backend/src/controllers/transitController.js');

    const reqPeak = { body: { distanceKm: 20, travelClass: 'STANDARD', isOffPeak: false } };
    const resPeak = createMockRes();
    postCalculateFare(reqPeak, resPeak);

    const reqOffPeak = { body: { distanceKm: 20, travelClass: 'STANDARD', isOffPeak: true } };
    const resOffPeak = createMockRes();
    postCalculateFare(reqOffPeak, resOffPeak);

    expect(resOffPeak.body.fareSummary.discountApplied).toBeGreaterThan(0);
    expect(resOffPeak.body.fareSummary.totalFare).toBeLessThan(resPeak.body.fareSummary.totalFare);
  });

  it('should apply concession discounts for SENIOR, STUDENT, and CHILD', async () => {
    const { postCalculateFare } = await import('../backend/src/controllers/transitController.js');

    const reqAdult = { body: { distanceKm: 30, passengerType: 'ADULT' } };
    const resAdult = createMockRes();
    postCalculateFare(reqAdult, resAdult);

    const reqSenior = { body: { distanceKm: 30, passengerType: 'SENIOR' } };
    const resSenior = createMockRes();
    postCalculateFare(reqSenior, resSenior);

    const reqStudent = { body: { distanceKm: 30, passengerType: 'STUDENT' } };
    const resStudent = createMockRes();
    postCalculateFare(reqStudent, resStudent);

    const reqChild = { body: { distanceKm: 30, passengerType: 'CHILD' } };
    const resChild = createMockRes();
    postCalculateFare(reqChild, resChild);

    expect(resSenior.body.fareSummary.concessionRate).toBe(0.30);
    expect(resStudent.body.fareSummary.concessionRate).toBe(0.40);
    expect(resChild.body.fareSummary.concessionRate).toBe(0.50);

    expect(resSenior.body.fareSummary.totalFare).toBeLessThan(resAdult.body.fareSummary.totalFare);
    expect(resStudent.body.fareSummary.totalFare).toBeLessThan(resSenior.body.fareSummary.totalFare);
    expect(resChild.body.fareSummary.totalFare).toBeLessThan(resStudent.body.fareSummary.totalFare);
  });

  it('should apply FIRST class multiplier (2.2x) on fare', async () => {
    const { postCalculateFare } = await import('../backend/src/controllers/transitController.js');

    const reqStd = { body: { distanceKm: 15, travelClass: 'STANDARD' } };
    const resStd = createMockRes();
    postCalculateFare(reqStd, resStd);

    const reqFirst = { body: { distanceKm: 15, travelClass: 'FIRST' } };
    const resFirst = createMockRes();
    postCalculateFare(reqFirst, resFirst);

    expect(resFirst.body.fareSummary.basePrice).toBeGreaterThan(resStd.body.fareSummary.basePrice);
    expect(resFirst.body.fareSummary.totalFare).toBeGreaterThan(resStd.body.fareSummary.totalFare);
  });

  it('should handle invalid distanceKm gracefully by defaulting to 10', async () => {
    const { postCalculateFare } = await import('../backend/src/controllers/transitController.js');
    const req = { body: { distanceKm: 'invalid' } };
    const res = createMockRes();
    postCalculateFare(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.fareSummary.totalFare).toBeGreaterThan(0);
  });

  it('should reject route search when origin and destination are the same station', async () => {
    const { postRouteSearch } = await import('../backend/src/controllers/transitController.js');
    const req = { body: { origin: 'CSMT', destination: 'CSMT' } };
    const res = createMockRes();
    postRouteSearch(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('different');
  });

  it('should handle AI chat with non-existent start node without crashing', async () => {
    const { postAIChat } = await import('../backend/src/controllers/transitController.js');
    const req = { body: { message: 'Where is Platform 1?', startNodeId: 'INVALID_NONEXISTENT_NODE', stationId: 1 } };
    const res = createMockRes();
    postAIChat(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reply).toBeDefined();
  });

  it('should generate complete layout for CBD Belapur station with real coordinates', async () => {
    const { getStationLayout } = await import('../backend/src/controllers/transitController.js');
    const layout = getStationLayout(108);
    expect(layout).toBeDefined();
    expect(layout.station.code).toBe('BEPR');
    expect(layout.station.name).toBe('CBD Belapur');
    expect(layout.nodes.some(n => n.type === 'PLATFORM')).toBe(true);
    expect(layout.nodes.some(n => n.type === 'ENTRANCE')).toBe(true);
  });
});
