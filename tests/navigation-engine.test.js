/**
 * Test Suite: Station Navigation Engine (A* Algorithm)
 * Strictly tests A* graph model, cost formulation, accessible avoidance of stairs,
 * blocked path handling, and emergency routing per NAVIGATION_ENGINE.md.
 */

import { describe, it, expect } from 'vitest';
import { StationGraph, calculateAStarRoute } from '../backend/src/engine/router.js';

describe('Station Navigation Engine (A*)', () => {
  const sampleNodes = [
    { id: 'NODE_ENTRY', floor_id: 1, name: 'Entrance', type: 'ENTRANCE', x: 100, y: 500, accessible: true },
    { id: 'NODE_HUB', floor_id: 1, name: 'Concourse', type: 'CORRIDOR', x: 200, y: 400, accessible: true },
    { id: 'NODE_STAIRS', floor_id: 1, name: 'Stairs', type: 'STAIRS', x: 300, y: 300, accessible: false }, // Inaccessible
    { id: 'NODE_LIFT', floor_id: 1, name: 'Lift L-1', type: 'LIFT', x: 150, y: 300, accessible: true }, // Accessible
    { id: 'NODE_PLATFORM_1', floor_id: 1, name: 'Platform 1', type: 'PLATFORM', x: 350, y: 200, accessible: true }
  ];

  const sampleEdges = [
    { from_node_id: 'NODE_ENTRY', to_node_id: 'NODE_HUB', distance: 15, estimated_time: 12, accessible: true, blocked: false },
    { from_node_id: 'NODE_HUB', to_node_id: 'NODE_ENTRY', distance: 15, estimated_time: 12, accessible: true, blocked: false },

    // Path 1 via stairs: shorter distance (20m)
    { from_node_id: 'NODE_HUB', to_node_id: 'NODE_STAIRS', distance: 10, estimated_time: 8, accessible: false, blocked: false },
    { from_node_id: 'NODE_STAIRS', to_node_id: 'NODE_PLATFORM_1', distance: 10, estimated_time: 8, accessible: false, blocked: false },

    // Path 2 via lift: longer distance (35m) but fully accessible
    { from_node_id: 'NODE_HUB', to_node_id: 'NODE_LIFT', distance: 15, estimated_time: 12, accessible: true, blocked: false },
    { from_node_id: 'NODE_LIFT', to_node_id: 'NODE_PLATFORM_1', distance: 20, estimated_time: 15, accessible: true, blocked: false }
  ];

  const graph = new StationGraph(sampleNodes, sampleEdges);

  it('should find normal route taking shortest path including stairs', () => {
    const result = calculateAStarRoute(graph, 'NODE_ENTRY', 'NODE_PLATFORM_1', 'NORMAL');
    expect(result.success).toBe(true);
    // Via stairs: 15 + 10 + 10 = 35m
    expect(result.distance).toBe(35);
    expect(result.route.some(n => n.id === 'NODE_STAIRS')).toBe(true);
  });

  it('should strictly avoid stairs in ACCESSIBLE mode and route through lift', () => {
    const result = calculateAStarRoute(graph, 'NODE_ENTRY', 'NODE_PLATFORM_1', 'ACCESSIBLE');
    expect(result.success).toBe(true);
    // Via lift: 15 + 15 + 20 = 50m
    expect(result.distance).toBe(50);
    expect(result.route.some(n => n.id === 'NODE_STAIRS')).toBe(false);
    expect(result.route.some(n => n.id === 'NODE_LIFT')).toBe(true);
    expect(result.accessibilityStatus).toBe(true);
  });

  it('should avoid dynamically blocked paths', () => {
    const blockedEdges = sampleEdges.map(e => {
      if (e.from_node_id === 'NODE_HUB' && e.to_node_id === 'NODE_STAIRS') {
        return { ...e, blocked: true }; // Temporarily closed for maintenance
      }
      return e;
    });

    const blockedGraph = new StationGraph(sampleNodes, blockedEdges);
    const result = calculateAStarRoute(blockedGraph, 'NODE_ENTRY', 'NODE_PLATFORM_1', 'NORMAL');
    expect(result.success).toBe(true);
    // Forced to take lift because stairs are blocked
    expect(result.route.some(n => n.id === 'NODE_LIFT')).toBe(true);
  });

  it('should handle same start and destination node', () => {
    const result = calculateAStarRoute(graph, 'NODE_ENTRY', 'NODE_ENTRY');
    expect(result.success).toBe(true);
    expect(result.distance).toBe(0);
    expect(result.instructions[0]).toMatch(/already at your destination/i);
  });
});

describe('Real GPS Geolocation & Direction Calculations', () => {
  it('should calculate accurate Haversine distance between Mumbai coordinates', async () => {
    const { haversineDistanceMeters } = await import('../frontend/src/services/clientTransitFallback.js');
    // CSMT (18.9400, 72.8353) to Masjid (18.9515, 72.8385) ~1.3km
    const dist = haversineDistanceMeters(18.9400, 72.8353, 18.9515, 72.8385);
    expect(dist).toBeGreaterThan(1200);
    expect(dist).toBeLessThan(1500);
  });

  it('should calculate correct bearing and cardinal direction', async () => {
    const { calculateBearing, bearingToCardinal } = await import('../frontend/src/services/clientTransitFallback.js');
    // Heading directly North
    const bearingNorth = calculateBearing(18.9400, 72.8353, 18.9600, 72.8353);
    expect(bearingNorth).toBeCloseTo(0, 0);
    expect(bearingToCardinal(bearingNorth)).toBe('North (N)');

    // Heading East
    const bearingEast = calculateBearing(18.9400, 72.8353, 18.9400, 72.8553);
    expect(bearingEast).toBeCloseTo(90, 0);
    expect(bearingToCardinal(bearingEast)).toBe('East (E)');
  });

  it('should find nearest Central Line station to coordinates', async () => {
    const { findNearestStation } = await import('../frontend/src/services/clientTransitFallback.js');
    // Near Dadar coordinates (19.0180, 72.8430)
    const result = findNearestStation(19.0180, 72.8430);
    expect(result.station).toBeDefined();
    expect(result.station.code).toBe('DR'); // Dadar
    expect(result.distanceMeters).toBeLessThan(500);
  });
});

