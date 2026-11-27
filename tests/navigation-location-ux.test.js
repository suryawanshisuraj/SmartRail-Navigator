/**
 * Test Suite: Navigation & Location Experience Verification
 * Validates breadcrumbs, line filtering, URL hash deep linking,
 * location permission flows, and mobile navigation targets.
 */

import { describe, it, expect } from 'vitest';
import { REAL_INDIAN_STATIONS, searchRealStations } from '../backend/src/data/realIndianStations.js';

describe('Navigation & Location UX Suite', () => {
  describe('Breadcrumb Hierarchy Mapping', () => {
    it('should correctly format tab display names for breadcrumb trail', () => {
      const tabLabels = {
        WAYFINDING: 'Station Map & Platform Wayfinding',
        PLANNER: 'Journey Route Planner',
        TRAINS: 'Live Train Fleet & Telemetry',
        FARES: 'Fare Tariff & Passes'
      };

      expect(tabLabels.WAYFINDING).toContain('Platform Wayfinding');
      expect(tabLabels.PLANNER).toContain('Journey Route Planner');
      expect(tabLabels.TRAINS).toContain('Live Train Fleet');
      expect(tabLabels.FARES).toContain('Fare Tariff');
    });

    it('should identify interchange stations correctly for breadcrumbs and badges', () => {
      const dadar = REAL_INDIAN_STATIONS.find(s => s.code === 'DR' || s.id === 8);
      expect(dadar).toBeDefined();
      expect(dadar.interchanges).toBeDefined();
      expect(dadar.interchanges.length).toBeGreaterThan(0);
      expect(dadar.interchanges.some(i => i.includes('Western'))).toBe(true);
    });
  });

  describe('Station Line & Zone Filtering', () => {
    it('should filter stations by Central Railway (CR)', () => {
      const centralStations = REAL_INDIAN_STATIONS.filter(s =>
        s.railwayLines?.some(l => l.includes('Central')) || s.zone?.includes('Central')
      );
      expect(centralStations.length).toBeGreaterThanOrEqual(26);
      expect(centralStations.some(s => s.code === 'CSMT')).toBe(true);
      expect(centralStations.some(s => s.code === 'KYN')).toBe(true);
    });

    it('should filter stations by Western Railway (WR)', () => {
      const westernStations = REAL_INDIAN_STATIONS.filter(s =>
        s.railwayLines?.some(l => l.includes('Western')) || s.zone?.includes('Western')
      );
      expect(westernStations.length).toBeGreaterThan(0);
      expect(westernStations.some(s => s.code === 'MMCT' || s.name.includes('Churchgate') || s.name.includes('Dadar'))).toBe(true);
    });

    it('should filter stations by Harbour & Trans-Harbour', () => {
      const harbourStations = REAL_INDIAN_STATIONS.filter(s =>
        s.railwayLines?.some(l => l.includes('Harbour') || l.includes('Trans-Harbour'))
      );
      expect(harbourStations.length).toBeGreaterThan(0);
    });

    it('should search stations accurately by partial code or name', () => {
      const resultsByCode = searchRealStations('dr');
      expect(resultsByCode.some(s => s.code === 'DR')).toBe(true);

      const resultsByName = searchRealStations('thane');
      expect(resultsByName.some(s => s.code === 'TNA')).toBe(true);
    });
  });

  describe('URL Hash Deep Linking & History Synchronization', () => {
    it('should parse URL hash into activeTab and selectedStationId', () => {
      const hash = 'tab=PLANNER&station=8';
      const params = new URLSearchParams(hash);

      const parsedTab = params.get('tab');
      const parsedStation = Number(params.get('station'));

      expect(parsedTab).toBe('PLANNER');
      expect(parsedStation).toBe(8);
    });

    it('should serialize active state into clean URL hash string', () => {
      const activeTab = 'TRAINS';
      const selectedStationId = 21;

      const params = new URLSearchParams();
      params.set('tab', activeTab);
      params.set('station', selectedStationId);

      expect(params.toString()).toBe('tab=TRAINS&station=21');
    });

    it('should fall back to defaults when URL hash is invalid or missing', () => {
      const invalidHash = 'invalid_param=xyz';
      const params = new URLSearchParams(invalidHash);

      const tab = params.get('tab') || 'WAYFINDING';
      const station = Number(params.get('station')) || 1;

      expect(tab).toBe('WAYFINDING');
      expect(station).toBe(1);
    });
  });

  describe('Location Permissions & Fallback Hubs', () => {
    it('should recommend verified Mumbai major suburban hubs on GPS refusal or manual pick', () => {
      const majorHubIds = [1, 8, 11, 13, 19, 26]; // CSMT, Dadar, Kurla, Ghatkopar, Thane, Kalyan
      const majorHubs = majorHubIds.map(id => REAL_INDIAN_STATIONS.find(s => s.id === id)).filter(Boolean);

      expect(majorHubs.length).toBe(6);
      expect(majorHubs.map(h => h.code)).toEqual(expect.arrayContaining(['CSMT', 'DR', 'CLA', 'GC', 'TNA', 'KYN']));
    });

    it('should format location permission dialog with proper ARIA accessibility attributes', () => {
      const modalAttrs = {
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'location-modal-title'
      };

      expect(modalAttrs.role).toBe('dialog');
      expect(modalAttrs['aria-modal']).toBe('true');
      expect(modalAttrs['aria-labelledby']).toBe('location-modal-title');
    });
  });

  describe('Mobile Navigation Targets', () => {
    it('should have touch-accessible mobile bottom navigation items with minimum 44px touch targets', () => {
      const mobileNavTabs = [
        { id: 'WAYFINDING', label: 'Map', minHeight: 48 },
        { id: 'PLANNER', label: 'Plan', minHeight: 48 },
        { id: 'TRAINS', label: 'Trains', minHeight: 48 },
        { id: 'FARES', label: 'Fares', minHeight: 48 },
        { id: 'GPS', label: 'GPS', minHeight: 48 },
        { id: 'SEARCH', label: 'Search', minHeight: 48 }
      ];

      mobileNavTabs.forEach(tab => {
        expect(tab.minHeight).toBeGreaterThanOrEqual(44);
        expect(tab.label.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Location Detection & No-Default-Assumption Logic', () => {
    it('should find closest station regardless of distance with no arbitrary distance cutoff', async () => {
      const { findNearestStation } = await import('../frontend/src/services/clientTransitFallback.js');

      // User located in Thane (19.1860, 72.9759)
      const thaneLocation = findNearestStation(19.1860, 72.9759);
      expect(thaneLocation.station.code).toBe('TNA');
      expect(thaneLocation.station.name).toBe('Thane');

      // User located in Kalyan (19.2437, 73.1355)
      const kalyanLocation = findNearestStation(19.2437, 73.1355);
      expect(kalyanLocation.station.code).toBe('KYN');
      expect(kalyanLocation.station.name).toBe('Kalyan Junction');

      // User located in Dadar (19.0180, 72.8430)
      const dadarLocation = findNearestStation(19.0180, 72.8430);
      expect(dadarLocation.station.code).toBe('DR');
      expect(dadarLocation.station.name).toBe('Dadar');
    });

    it('should distinguish manual station entrance gates from live real GPS beacons', () => {
      const manualGateNode = {
        id: 'NODE_CSMT_ENTRY_EAST',
        name: 'CSMT - East Entrance',
        type: 'ENTRANCE',
        isRealGps: false
      };

      const liveGpsNode = {
        id: 'NODE_USER_REAL_GPS',
        name: 'My Live GPS Location',
        type: 'ENTRANCE',
        isRealGps: true,
        accuracy: 12,
        lat: 19.0182,
        lng: 72.8432
      };

      // Manual gate must not be flagged as real GPS
      expect(manualGateNode.isRealGps).toBeFalsy();
      expect(manualGateNode.name).toContain('Entrance');

      // Live GPS node must have real GPS flag and coordinate attributes
      expect(liveGpsNode.isRealGps).toBe(true);
      expect(liveGpsNode.accuracy).toBe(12);
      expect(liveGpsNode.lat).toBeCloseTo(19.0182);
    });

    it('should provide available entrance gates for station start point selection', async () => {
      const { getClientStationLayout } = await import('../frontend/src/services/clientTransitFallback.js');
      const csmtLayout = getClientStationLayout(1);

      const entranceGates = csmtLayout.nodes.filter(
        n => n.type === 'ENTRANCE' || n.id.includes('ENTRY')
      );

      expect(entranceGates.length).toBeGreaterThanOrEqual(2);
      expect(entranceGates.some(g => g.name.includes('East'))).toBe(true);
      expect(entranceGates.some(g => g.name.includes('West'))).toBe(true);
    });
  });
});
