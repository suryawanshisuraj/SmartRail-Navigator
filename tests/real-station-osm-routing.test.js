/**
 * Test Suite: Real Indian Railway Station Map Data & Real Pedestrian Routing
 * Strictly tests all 14 mandatory requirements from user specification:
 * 
 * TEST 1: Search Dadar
 * TEST 2: Open real Dadar station
 * TEST 3: Display real station coordinates
 * TEST 4: Get current GPS
 * TEST 5: Calculate walking route
 * TEST 6: Verify route has real routing geometry
 * TEST 7: Verify route does not use a manually generated straight line
 * TEST 8: Verify distance comes from routing API
 * TEST 9: Verify navigation instructions come from routing data
 * TEST 10: Routing API failure
 * TEST 11: No GPS permission
 * TEST 12: Unknown station
 * TEST 13: Mobile layout
 * TEST 14: Desktop layout
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

import {
  REAL_INDIAN_STATIONS,
  searchRealStations,
  getRealStationByIdOrCode
} from '../backend/src/data/realIndianStations.js';
import {
  fetchRealPedestrianRoute,
  getLiveGPSPosition,
  haversineDistanceMeters
} from '../frontend/src/services/transitService.js';

describe('Real Indian Railway Station Map Data & Real Pedestrian Routing (14 Mandatory Tests)', () => {
  let originalFetch;
  let originalGeolocation;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    if (globalThis.navigator) {
      originalGeolocation = globalThis.navigator.geolocation;
    }
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (globalThis.navigator && originalGeolocation !== undefined) {
      Object.defineProperty(globalThis.navigator, 'geolocation', {
        value: originalGeolocation,
        configurable: true,
        writable: true
      });
    }
    vi.restoreAllMocks();
  });

  // =========================================================================
  // TEST 1: Search Dadar
  // =========================================================================
  it('TEST 1: Search Dadar (exact, partial, case-insensitive)', () => {
    // Exact search
    const exactResults = searchRealStations('Dadar');
    expect(exactResults.length).toBeGreaterThan(0);
    const dadar = exactResults.find(s => s.code === 'DR');
    expect(dadar).toBeDefined();
    expect(dadar.name).toBe('Dadar');

    // Case-insensitive search
    const lowerResults = searchRealStations('dadar');
    expect(lowerResults.some(s => s.code === 'DR')).toBe(true);

    const upperResults = searchRealStations('DADAR');
    expect(upperResults.some(s => s.code === 'DR')).toBe(true);

    // Partial search
    const partialResults = searchRealStations('Dad');
    expect(partialResults.some(s => s.code === 'DR')).toBe(true);
  });

  // =========================================================================
  // TEST 2: Open real Dadar station
  // =========================================================================
  it('TEST 2: Open real Dadar station with real lines, platforms, and verified entrances', () => {
    const dadar = getRealStationByIdOrCode('DR');
    expect(dadar).toBeDefined();
    expect(dadar.name).toBe('Dadar');
    expect(dadar.city).toBe('Mumbai');
    expect(dadar.state).toBe('Maharashtra');

    // Verify lines
    expect(dadar.railwayLines).toContain('Central Line');
    expect(dadar.railwayLines).toContain('Western Line');

    // Verify platforms (Dadar has 15 suburban & mainline platforms)
    expect(dadar.totalPlatforms).toBe(15);
    expect(dadar.platforms.length).toBeGreaterThanOrEqual(8);
    const p1 = dadar.platforms.find(p => p.number === '1');
    expect(p1).toBeDefined();

    // Verify verified real entrances
    expect(dadar.entrances.length).toBeGreaterThan(0);
    const eastEntry = dadar.entrances.find(e => e.type === 'EAST');
    const westEntry = dadar.entrances.find(e => e.type === 'WEST');
    expect(eastEntry).toBeDefined();
    expect(westEntry).toBeDefined();

    // Verify FOBs and accessible infrastructure
    expect(dadar.foot_over_bridges.length).toBeGreaterThan(0);
    expect(dadar.restrooms.length).toBeGreaterThan(0);
    expect(dadar.ticketCounters.length).toBeGreaterThan(0);
  });

  // =========================================================================
  // TEST 3: Display real station coordinates
  // =========================================================================
  it('TEST 3: Display real station coordinates (verified OSM coordinates for major hubs)', () => {
    const dadar = getRealStationByIdOrCode('DR');
    // Real OSM coordinates for Dadar Junction: 19.0182° N, 72.8436° E
    expect(dadar.latitude).toBeCloseTo(19.0182, 3);
    expect(dadar.longitude).toBeCloseTo(72.8436, 3);

    // Test real coordinates across key Mumbai stations
    const stationsToCheck = [
      { code: 'CSMT', lat: 18.9400, lng: 72.8354 },
      { code: 'CCG', lat: 18.9352, lng: 72.8272 }, // Churchgate
      { code: 'MMCT', lat: 18.9696, lng: 72.8193 }, // Mumbai Central
      { code: 'ADH', lat: 19.1197, lng: 72.8464 }, // Andheri
      { code: 'BA', lat: 19.0544, lng: 72.8406 },  // Bandra
      { code: 'BVI', lat: 19.2294, lng: 72.8574 }, // Borivali
      { code: 'CLA', lat: 19.0653, lng: 72.8793 }, // Kurla
      { code: 'TNA', lat: 19.1860, lng: 72.9759 }, // Thane
      { code: 'GC', lat: 19.0860, lng: 72.9080 },  // Ghatkopar
      { code: 'VSH', lat: 19.0628, lng: 72.9989 }, // Vashi
      { code: 'PNVL', lat: 18.9894, lng: 73.1216 } // Panvel
    ];

    for (const item of stationsToCheck) {
      const stn = getRealStationByIdOrCode(item.code);
      expect(stn, `Station ${item.code} should exist in real station database`).toBeDefined();
      expect(stn.latitude, `Station ${item.code} latitude`).toBeCloseTo(item.lat, 2);
      expect(stn.longitude, `Station ${item.code} longitude`).toBeCloseTo(item.lng, 2);

      // Verify not 0,0 and in valid Mumbai bounding box
      expect(stn.latitude).toBeGreaterThan(18.8);
      expect(stn.latitude).toBeLessThan(19.4);
      expect(stn.longitude).toBeGreaterThan(72.7);
      expect(stn.longitude).toBeLessThan(73.3);
    }
  });

  // =========================================================================
  // TEST 4: Get current GPS
  // =========================================================================
  it('TEST 4: Get current GPS via browser Geolocation API', async () => {
    const mockCoords = {
      latitude: 19.0185,
      longitude: 72.8430,
      accuracy: 12,
      heading: 90,
      speed: 1.2
    };

    if (!globalThis.navigator) {
      globalThis.navigator = {};
    }

    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: {
        getCurrentPosition: (success) => {
          success({
            coords: mockCoords,
            timestamp: Date.now()
          });
        }
      },
      configurable: true,
      writable: true
    });

    const pos = await getLiveGPSPosition();
    expect(pos.lat).toBe(19.0185);
    expect(pos.lng).toBe(72.8430);
    expect(pos.accuracy).toBe(12);
    expect(pos.heading).toBe(90);
    expect(pos.timestamp).toBeDefined();
  });

  // =========================================================================
  // TEST 5: Calculate walking route
  // =========================================================================
  it('TEST 5: Calculate walking route using real pedestrian routing provider', async () => {
    // Mock realistic OSRM / OSM Foot API response with intermediate road waypoints
    const mockOsmFootResponse = {
      code: 'Ok',
      routes: [{
        distance: 850.5,
        duration: 654.2,
        geometry: {
          coordinates: [
            [72.8430, 19.0185],
            [72.8440, 19.0182],
            [72.8452, 19.0180],
            [72.8465, 19.0179],
            [72.8478, 19.0178]
          ]
        },
        legs: [{
          steps: [
            { name: 'Senapati Bapat Marg', distance: 180, duration: 140, maneuver: { type: 'depart', modifier: 'straight' } },
            { name: 'Tilak Bridge Pedestrian Walkway', distance: 420, duration: 320, maneuver: { type: 'turn', modifier: 'left' } },
            { name: 'Dadar Station Foot Over Bridge', distance: 250.5, duration: 194.2, maneuver: { type: 'turn', modifier: 'right' } }
          ]
        }]
      }]
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockOsmFootResponse
    });

    const route = await fetchRealPedestrianRoute(19.0185, 72.8430, 19.0178, 72.8478);
    expect(route.success).toBe(true);
    expect(route.distance).toBe(851);
    expect(route.duration).toBe(654);
    expect(route.coordinates.length).toBe(5);
  });

  // =========================================================================
  // TEST 6: Verify route has real routing geometry
  // =========================================================================
  it('TEST 6: Verify route has real routing geometry (multiple road/pedestrian waypoints)', async () => {
    const mockOsmFootResponse = {
      code: 'Ok',
      routes: [{
        distance: 720,
        duration: 540,
        geometry: {
          coordinates: [
            [72.8430, 19.0185],
            [72.8438, 19.0183],
            [72.8446, 19.0181],
            [72.8455, 19.0180],
            [72.8468, 19.0179],
            [72.8478, 19.0178]
          ]
        },
        legs: [{ steps: [] }]
      }]
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockOsmFootResponse
    });

    const route = await fetchRealPedestrianRoute(19.0185, 72.8430, 19.0178, 72.8478);
    expect(route.success).toBe(true);
    // Real pedestrian routes contain multiple coordinates along streets/bridges
    expect(route.coordinates.length).toBeGreaterThanOrEqual(4);
    // Format is [lat, lng] for Leaflet
    expect(route.coordinates[0][0]).toBeCloseTo(19.0185, 4);
    expect(route.coordinates[0][1]).toBeCloseTo(72.8430, 4);
  });

  // =========================================================================
  // TEST 7: Verify route does not use a manually generated straight line
  // =========================================================================
  it('TEST 7: Verify route does NOT use a manually generated straight line (has road curvature & >2 points)', async () => {
    const mockOsmFootResponse = {
      code: 'Ok',
      routes: [{
        distance: 850,
        duration: 650,
        geometry: {
          coordinates: [
            [72.8430, 19.0185],
            [72.8440, 19.0195], // Curves north onto bridge
            [72.8455, 19.0192],
            [72.8470, 19.0183],
            [72.8478, 19.0178]
          ]
        },
        legs: [{ steps: [] }]
      }]
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockOsmFootResponse
    });

    const route = await fetchRealPedestrianRoute(19.0185, 72.8430, 19.0178, 72.8478);
    expect(route.success).toBe(true);

    // Rule 1: A fake straight-line route only has 2 points [start, end]
    expect(route.coordinates.length).toBeGreaterThan(2);

    // Rule 2: Intermediate points must deviate from a pure linear interpolation
    const start = route.coordinates[0];
    const end = route.coordinates[route.coordinates.length - 1];
    const midPoint = route.coordinates[1];

    // Compute expected linear interpolation latitude at midpoint's longitude
    const t = (midPoint[1] - start[1]) / (end[1] - start[1]);
    const linearExpectedLat = start[0] + t * (end[0] - start[0]);

    // Deviation proves real curved road geometry, not synthetic straight line
    const deviation = Math.abs(midPoint[0] - linearExpectedLat);
    expect(deviation).toBeGreaterThan(0.0005);
  });

  // =========================================================================
  // TEST 8: Verify distance comes from routing API
  // =========================================================================
  it('TEST 8: Verify distance comes from routing API (longer than straight-line Haversine)', async () => {
    const startLat = 19.0185;
    const startLng = 72.8430;
    const endLat = 19.0178;
    const endLng = 72.8478;

    // Straight-line Haversine distance
    const haversineDist = haversineDistanceMeters(startLat, startLng, endLat, endLng);
    expect(haversineDist).toBeGreaterThan(450);
    expect(haversineDist).toBeLessThan(550); // Direct line ~510m

    // Real pedestrian network walking distance accounts for bridges, roads, turns
    const mockNetworkDistance = 875;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 'Ok',
        routes: [{
          distance: mockNetworkDistance,
          duration: 680,
          geometry: { coordinates: [[startLng, startLat], [endLng, endLat]] },
          legs: [{ steps: [] }]
        }]
      })
    });

    const route = await fetchRealPedestrianRoute(startLat, startLng, endLat, endLng);
    expect(route.distance).toBe(mockNetworkDistance);
    // Network distance strictly exceeds straight-line distance
    expect(route.distance).toBeGreaterThan(haversineDist);
  });

  // =========================================================================
  // TEST 9: Verify navigation instructions come from routing data
  // =========================================================================
  it('TEST 9: Verify navigation instructions come from routing data (turn maneuvers & roads)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 'Ok',
        routes: [{
          distance: 650,
          duration: 500,
          geometry: { coordinates: [[72.8430, 19.0185], [72.8478, 19.0178]] },
          legs: [{
            steps: [
              { name: 'Senapati Bapat Marg', distance: 150, maneuver: { type: 'depart', modifier: 'straight' } },
              { name: 'Tilak Foot Over Bridge', distance: 350, maneuver: { type: 'turn', modifier: 'left' } },
              { name: 'Dadar Station West Entrance', distance: 150, maneuver: { type: 'arrive', modifier: '' } }
            ]
          }]
        }]
      })
    });

    const route = await fetchRealPedestrianRoute(19.0185, 72.8430, 19.0178, 72.8478);
    expect(route.success).toBe(true);
    expect(route.instructions.length).toBe(3);
    expect(route.instructions[0]).toContain('Senapati Bapat Marg');
    expect(route.instructions[1]).toContain('Tilak Foot Over Bridge');
    expect(route.instructions[2]).toContain('station entrance');
  });

  // =========================================================================
  // TEST 10: Routing API failure
  // =========================================================================
  it('TEST 10: Routing API failure returns clear error and does NOT fallback to a fake straight line', async () => {
    // Simulate routing network failure / 500 error
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network connection failed'));

    const route = await fetchRealPedestrianRoute(19.0185, 72.8430, 19.0178, 72.8478);
    expect(route.success).toBe(false);
    expect(route.error).toBe('No pedestrian route available.');
    // Critical: Must NOT generate fake straight-line polyline
    expect(route.coordinates).toEqual([]);
    expect(route.distance).toBe(0);
  });

  // =========================================================================
  // TEST 11: No GPS permission
  // =========================================================================
  it('TEST 11: No GPS permission handled gracefully without fake coordinates', async () => {
    if (!globalThis.navigator) {
      globalThis.navigator = {};
    }

    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: {
        getCurrentPosition: (success, error) => {
          // PERMISSION_DENIED = 1
          error({ code: 1, message: 'User denied Geolocation' });
        }
      },
      configurable: true,
      writable: true
    });

    await expect(getLiveGPSPosition()).rejects.toThrow(/Location permission was denied/i);
  });

  // =========================================================================
  // TEST 12: Unknown station
  // =========================================================================
  it('TEST 12: Unknown station search returns empty array and does not hallucinate fake station', () => {
    const results = searchRealStations('StationXYZ999Unknown');
    expect(results).toEqual([]);

    const nonExistent = getRealStationByIdOrCode('UNKNOWN_CODE');
    expect(nonExistent).toBeNull();
  });

  // =========================================================================
  // TEST 13: Mobile layout
  // =========================================================================
  it('TEST 13: Mobile layout responsiveness (meta viewport, responsive CSS for 390x844 & 375x667)', () => {
    // Helper to find file across possible test working directories
    const findFile = (relPath) => {
      const candidates = [
        path.resolve(process.cwd(), relPath),
        path.resolve(process.cwd(), '..', relPath),
        path.resolve(__dirname, '..', relPath)
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
      }
      throw new Error(`File not found: ${relPath}`);
    };

    // 1. Check index.html viewport meta tag
    const htmlContent = findFile('frontend/index.html');
    expect(htmlContent).toContain('<meta name="viewport" content="width=device-width, initial-scale=1.0"');

    // 2. Check index.css responsive breakpoint rules
    const cssContent = findFile('frontend/src/index.css');
    expect(cssContent).toContain('@media (max-width: 1024px)');
    expect(cssContent).toContain('grid-template-columns: 1fr !important');
    expect(cssContent).toContain('@media (max-width: 640px)');
  });

  // =========================================================================
  // TEST 14: Desktop layout
  // =========================================================================
  it('TEST 14: Desktop layout support (multi-column dashboard grid and flex map view)', () => {
    const findFile = (relPath) => {
      const candidates = [
        path.resolve(process.cwd(), relPath),
        path.resolve(process.cwd(), '..', relPath),
        path.resolve(__dirname, '..', relPath)
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
      }
      throw new Error(`File not found: ${relPath}`);
    };

    const cssContent = findFile('frontend/src/index.css');
    expect(cssContent).toContain('.main-dashboard-grid');
    expect(cssContent).toContain('grid-template-columns: minmax(0, 1.25fr) minmax(360px, 0.75fr)');
    expect(cssContent).toContain('responsive-main-container');
  });
});
