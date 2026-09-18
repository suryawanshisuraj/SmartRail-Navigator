/**
 * SmartRail Navigator - Mumbai Central Line Controller
 * Full support for all 26 suburban stations from CSMT to Kalyan with actual platforms,
 * foot over bridges (FOBs), lifts, QR positioning, and grounded AI assistant.
 */

import { StationGraph, calculateAStarRoute } from '../engine/router.js';

// All 26 Mumbai Central Line Stations with Real GPS Coordinates
export const MUMBAI_CENTRAL_LINE_STATIONS = [
  { id: 1, code: 'CSMT', name: 'Chhatrapati Shivaji Maharaj Terminus (CSMT)', zone: 'South Mumbai', totalPlatforms: 18, lat: 18.9400, lng: 72.8354, hasMetro: false, hasWesternInterchange: false, hasHarbourInterchange: true, isTerminus: true },
  { id: 2, code: 'MSD', name: 'Masjid Bunder', zone: 'South Mumbai', totalPlatforms: 4, lat: 18.9525, lng: 72.8384, hasMetro: false, hasWesternInterchange: false, hasHarbourInterchange: true },
  { id: 3, code: 'SNRD', name: 'Sandhurst Road', zone: 'South Mumbai', totalPlatforms: 4, lat: 18.9610, lng: 72.8398, hasMetro: false, hasWesternInterchange: false, hasHarbourInterchange: true },
  { id: 4, code: 'BY', name: 'Byculla', zone: 'South Mumbai', totalPlatforms: 4, lat: 18.9760, lng: 72.8335, hasMetro: false, hasWesternInterchange: false, hasHarbourInterchange: false },
  { id: 5, code: 'CHG', name: 'Chinchpokli', zone: 'South Mumbai', totalPlatforms: 2, lat: 18.9877, lng: 72.8322, hasMetro: false, hasWesternInterchange: false, hasHarbourInterchange: false },
  { id: 6, code: 'CRD', name: 'Currey Road', zone: 'South Mumbai', totalPlatforms: 2, lat: 18.9950, lng: 72.8315, hasMetro: false, hasWesternInterchange: false, hasHarbourInterchange: false },
  { id: 7, code: 'PR', name: 'Parel (Prabhadevi Connection)', zone: 'Central Mumbai', totalPlatforms: 4, lat: 19.0067, lng: 72.8378, hasMetro: false, hasWesternInterchange: true, hasHarbourInterchange: false },
  { id: 8, code: 'DR', name: 'Dadar Central (Western Line Interchange)', zone: 'Central Mumbai', totalPlatforms: 8, lat: 19.0178, lng: 72.8431, hasMetro: false, hasWesternInterchange: true, hasHarbourInterchange: false, isMajorJunction: true },
  { id: 9, code: 'MTN', name: 'Matunga', zone: 'Central Mumbai', totalPlatforms: 4, lat: 19.0280, lng: 72.8530, hasMetro: false, hasWesternInterchange: false, hasHarbourInterchange: false },
  { id: 10, code: 'SIN', name: 'Sion', zone: 'Central Mumbai', totalPlatforms: 4, lat: 19.0390, lng: 72.8625, hasMetro: false, hasWesternInterchange: false, hasHarbourInterchange: false },
  { id: 11, code: 'CLA', name: 'Kurla Junction (Harbour Line Interchange)', zone: 'Eastern Suburbs', totalPlatforms: 8, lat: 19.0657, lng: 72.8794, hasMetro: false, hasWesternInterchange: false, hasHarbourInterchange: true, isMajorJunction: true },
  { id: 12, code: 'VVH', name: 'Vidyavihar', zone: 'Eastern Suburbs', totalPlatforms: 4, lat: 19.0798, lng: 72.8973, hasMetro: false, hasWesternInterchange: false, hasHarbourInterchange: false },
  { id: 13, code: 'GC', name: 'Ghatkopar (Metro Line 1 Interchange)', zone: 'Eastern Suburbs', totalPlatforms: 4, lat: 19.0864, lng: 72.9081, hasMetro: true, hasWesternInterchange: false, hasHarbourInterchange: false, isMajorJunction: true },
  { id: 14, code: 'VK', name: 'Vikhroli', zone: 'Eastern Suburbs', totalPlatforms: 4, lat: 19.1111, lng: 72.9298, hasMetro: false, hasWesternInterchange: false, hasHarbourInterchange: false },
  { id: 15, code: 'KJRD', name: 'Kanjurmarg', zone: 'Eastern Suburbs', totalPlatforms: 4, lat: 19.1302, lng: 72.9360, hasMetro: false, hasWesternInterchange: false, hasHarbourInterchange: false },
  { id: 16, code: 'BND', name: 'Bhandup', zone: 'Eastern Suburbs', totalPlatforms: 4, lat: 19.1436, lng: 72.9376, hasMetro: false, hasWesternInterchange: false, hasHarbourInterchange: false },
  { id: 17, code: 'NHU', name: 'Nahur', zone: 'Eastern Suburbs', totalPlatforms: 4, lat: 19.1557, lng: 72.9463, hasMetro: false, hasWesternInterchange: false, hasHarbourInterchange: false },
  { id: 18, code: 'MLND', name: 'Mulund', zone: 'Eastern Suburbs', totalPlatforms: 4, lat: 19.1726, lng: 72.9564, hasMetro: false, hasWesternInterchange: false, hasHarbourInterchange: false },
  { id: 19, code: 'TNA', name: 'Thane (Trans-Harbour Interchange)', zone: 'Thane Zone', totalPlatforms: 10, lat: 19.1860, lng: 72.9759, hasMetro: false, hasWesternInterchange: false, hasHarbourInterchange: true, isMajorJunction: true },
  { id: 20, code: 'KLVA', name: 'Kalva', zone: 'Thane Zone', totalPlatforms: 4, lat: 19.1952, lng: 72.9961, hasMetro: false, hasWesternInterchange: false, hasHarbourInterchange: false },
  { id: 21, code: 'MBQ', name: 'Mumbra', zone: 'Thane Zone', totalPlatforms: 4, lat: 19.1878, lng: 73.0232, hasMetro: false, hasWesternInterchange: false, hasHarbourInterchange: false },
  { id: 22, code: 'DIVA', name: 'Diva Junction (Vasai-Roha Corridor)', zone: 'Beyond Thane', totalPlatforms: 8, lat: 19.1889, lng: 73.0425, hasMetro: false, hasWesternInterchange: false, hasHarbourInterchange: false, isMajorJunction: true },
  { id: 23, code: 'KOPR', name: 'Kopar', zone: 'Beyond Thane', totalPlatforms: 4, lat: 19.2088, lng: 73.0805, hasMetro: false, hasWesternInterchange: false, hasHarbourInterchange: false },
  { id: 24, code: 'DI', name: 'Dombivli', zone: 'Beyond Thane', totalPlatforms: 5, lat: 19.2183, lng: 73.0867, hasMetro: false, hasWesternInterchange: false, hasHarbourInterchange: false, isMajorJunction: true },
  { id: 25, code: 'THK', name: 'Thakurli', zone: 'Beyond Thane', totalPlatforms: 2, lat: 19.2255, lng: 73.0970, hasMetro: false, hasWesternInterchange: false, hasHarbourInterchange: false },
  { id: 26, code: 'KYN', name: 'Kalyan Junction (Kasara/Karjat Divergence)', zone: 'Beyond Thane', totalPlatforms: 8, lat: 19.2366, lng: 73.1306, hasMetro: false, hasWesternInterchange: false, hasHarbourInterchange: false, isMajorJunction: true, isTerminus: true }
];

/**
 * Generate full graph model (nodes, edges, QR tags, facilities) for any selected Central Line station.
 */
export function getStationLayout(stationId = 1) {
  const numericId = Number(stationId);
  const station = MUMBAI_CENTRAL_LINE_STATIONS.find(s => s.id === numericId);
  if (!station) {
    return null;
  }
  const numPlatforms = station.totalPlatforms;

  const nodes = [];
  const edges = [];
  const qrLocations = [];
  const facilities = [];

  const stnLat = station.lat || 18.9400;
  const stnLng = station.lng || 72.8354;

  // Floor 0: Ground Concourse & Ticket Halls with real GPS coordinates
  const entryEast = { id: `NODE_${station.code}_ENTRY_EAST`, floor_id: 1, name: `${station.name} - East Entrance`, type: 'ENTRANCE', x: 200, y: 530, lat: +(stnLat - 0.0006).toFixed(6), lng: +(stnLng + 0.0004).toFixed(6), accessible: true, icon: '🚪' };
  const entryWest = { id: `NODE_${station.code}_ENTRY_WEST`, floor_id: 1, name: `${station.name} - West Entrance`, type: 'ENTRANCE', x: 600, y: 530, lat: +(stnLat - 0.0006).toFixed(6), lng: +(stnLng - 0.0004).toFixed(6), accessible: true, icon: '🚪' };
  const concourse = { id: `NODE_${station.code}_CONCOURSE`, floor_id: 1, name: 'Central Station Concourse', type: 'CORRIDOR', x: 400, y: 440, lat: +(stnLat - 0.0002).toFixed(6), lng: +stnLng.toFixed(6), accessible: true, icon: '🧭' };
  const ticketOffice = { id: `NODE_${station.code}_TICKET`, floor_id: 1, name: 'UTS / ATVM Ticket Counters', type: 'TICKET_COUNTER', x: 300, y: 490, lat: +(stnLat - 0.0004).toFixed(6), lng: +(stnLng + 0.0002).toFixed(6), accessible: true, icon: '🎫' };
  const restroom = { id: `NODE_${station.code}_RESTROOM`, floor_id: 1, name: 'Accessible Restroom & Water Booth', type: 'RESTROOM', x: 150, y: 440, lat: +(stnLat - 0.0002).toFixed(6), lng: +(stnLng + 0.0003).toFixed(6), accessible: true, icon: '🚻' };
  const foodStall = { id: `NODE_${station.code}_FOOD`, floor_id: 1, name: 'Snacks & Tea Refreshments', type: 'FOOD_COURT', x: 650, y: 440, lat: +(stnLat - 0.0002).toFixed(6), lng: +(stnLng - 0.0003).toFixed(6), accessible: true, icon: '☕' };
  const liftF0 = { id: `NODE_${station.code}_LIFT_F0`, floor_id: 1, name: 'Elevator Lift L-1 (Accessible)', type: 'LIFT', x: 340, y: 350, lat: +(stnLat + 0.0001).toFixed(6), lng: +(stnLng - 0.0001).toFixed(6), accessible: true, icon: '🛗' };
  const stairsF0 = { id: `NODE_${station.code}_STAIRS_F0`, floor_id: 1, name: 'Middle FOB Stairs Bank', type: 'STAIRS', x: 460, y: 350, lat: +(stnLat + 0.0001).toFixed(6), lng: +(stnLng + 0.0001).toFixed(6), accessible: false, icon: '🪜' };

  // Floor 1: Foot Over Bridge (FOB)
  const fobBridge = { id: `NODE_${station.code}_FOB_BRIDGE`, floor_id: 2, name: 'Central Foot Over Bridge (FOB)', type: 'CORRIDOR', x: 400, y: 260, lat: +(stnLat + 0.0002).toFixed(6), lng: +stnLng.toFixed(6), accessible: true, icon: '🌉' };
  const liftF1 = { id: `NODE_${station.code}_LIFT_F1`, floor_id: 2, name: 'Elevator Lift L-1 (FOB Landing)', type: 'LIFT', x: 340, y: 260, lat: +(stnLat + 0.0002).toFixed(6), lng: +(stnLng - 0.0001).toFixed(6), accessible: true, icon: '🛗' };
  const stairsF1 = { id: `NODE_${station.code}_STAIRS_F1`, floor_id: 2, name: 'Middle FOB Stair Landing', type: 'STAIRS', x: 460, y: 260, lat: +(stnLat + 0.0002).toFixed(6), lng: +(stnLng + 0.0001).toFixed(6), accessible: false, icon: '🪜' };

  nodes.push(entryEast, entryWest, concourse, ticketOffice, restroom, foodStall, liftF0, stairsF0, fobBridge, liftF1, stairsF1);

  // QR Placards
  qrLocations.push(
    { id: 1, code: `QR_${station.code}_EAST`, node_id: entryEast.id, description: `${station.name} - East Booking Office Entrance` },
    { id: 2, code: `QR_${station.code}_WEST`, node_id: entryWest.id, description: `${station.name} - West Main Gate` },
    { id: 3, code: `QR_${station.code}_CONCOURSE`, node_id: concourse.id, description: 'Central Indicator & Timetable Board' },
    { id: 4, code: `QR_${station.code}_RESTROOM`, node_id: restroom.id, description: 'Near Accessible Restroom Complex' }
  );

  // Facilities list
  facilities.push(
    { id: 1, name: 'UTS / Automatic Ticket Vending Machines', type: 'TICKET_COUNTER', node_id: ticketOffice.id, floor: 0, accessible: true },
    { id: 2, name: 'Accessible Restroom & Drinking Water', type: 'RESTROOM', node_id: restroom.id, floor: 0, accessible: true },
    { id: 3, name: 'Aahar Tea & Snacks Stall', type: 'FOOD_COURT', node_id: foodStall.id, floor: 0, accessible: true }
  );

  // Base concourse connections
  edges.push(
    { from_node_id: entryEast.id, to_node_id: ticketOffice.id, distance: 20, estimated_time: 15, accessible: true, blocked: false },
    { from_node_id: ticketOffice.id, to_node_id: entryEast.id, distance: 20, estimated_time: 15, accessible: true, blocked: false },

    { from_node_id: entryEast.id, to_node_id: concourse.id, distance: 30, estimated_time: 22, accessible: true, blocked: false },
    { from_node_id: concourse.id, to_node_id: entryEast.id, distance: 30, estimated_time: 22, accessible: true, blocked: false },

    { from_node_id: entryWest.id, to_node_id: concourse.id, distance: 30, estimated_time: 22, accessible: true, blocked: false },
    { from_node_id: concourse.id, to_node_id: entryWest.id, distance: 30, estimated_time: 22, accessible: true, blocked: false },

    { from_node_id: concourse.id, to_node_id: restroom.id, distance: 25, estimated_time: 18, accessible: true, blocked: false },
    { from_node_id: restroom.id, to_node_id: concourse.id, distance: 25, estimated_time: 18, accessible: true, blocked: false },

    { from_node_id: concourse.id, to_node_id: foodStall.id, distance: 25, estimated_time: 18, accessible: true, blocked: false },
    { from_node_id: foodStall.id, to_node_id: concourse.id, distance: 25, estimated_time: 18, accessible: true, blocked: false },

    { from_node_id: concourse.id, to_node_id: liftF0.id, distance: 15, estimated_time: 12, accessible: true, blocked: false },
    { from_node_id: liftF0.id, to_node_id: concourse.id, distance: 15, estimated_time: 12, accessible: true, blocked: false },

    { from_node_id: concourse.id, to_node_id: stairsF0.id, distance: 15, estimated_time: 12, accessible: false, blocked: false },
    { from_node_id: stairsF0.id, to_node_id: concourse.id, distance: 15, estimated_time: 12, accessible: false, blocked: false },

    // Lift vs Stairs to FOB
    { from_node_id: liftF0.id, to_node_id: liftF1.id, distance: 12, estimated_time: 18, accessible: true, blocked: false },
    { from_node_id: liftF1.id, to_node_id: liftF0.id, distance: 12, estimated_time: 18, accessible: true, blocked: false },

    { from_node_id: stairsF0.id, to_node_id: stairsF1.id, distance: 15, estimated_time: 20, accessible: false, blocked: false },
    { from_node_id: stairsF1.id, to_node_id: stairsF0.id, distance: 15, estimated_time: 20, accessible: false, blocked: false },

    { from_node_id: liftF1.id, to_node_id: fobBridge.id, distance: 10, estimated_time: 8, accessible: true, blocked: false },
    { from_node_id: fobBridge.id, to_node_id: liftF1.id, distance: 10, estimated_time: 8, accessible: true, blocked: false },

    { from_node_id: stairsF1.id, to_node_id: fobBridge.id, distance: 10, estimated_time: 8, accessible: false, blocked: false },
    { from_node_id: fobBridge.id, to_node_id: stairsF1.id, distance: 10, estimated_time: 8, accessible: false, blocked: false }
  );

  // Generate All Actual Platforms for this station with real geospatial coordinates
  // Horizontal layout spacing based on total platforms
  const startX = 140;
  const endX = 680;
  const stepX = (endX - startX) / Math.max(1, numPlatforms - 1);

  const lngSpan = 0.0008; // width of railway yard across platforms
  const stepLng = numPlatforms > 1 ? lngSpan / (numPlatforms - 1) : 0;

  for (let p = 1; p <= numPlatforms; p++) {
    const xPos = Math.round(startX + (p - 1) * stepX);
    const isFloor0 = p <= Math.ceil(numPlatforms / 2); // First half accessible directly or via ground
    const floorId = isFloor0 ? 1 : 2;

    let serviceTag = 'Slow Local (Up/Down)';
    if (p === 3 || p === 4) serviceTag = 'Fast Local (Towards CSMT / Kalyan)';
    if (p >= 8 && station.id === 1) serviceTag = 'Outstation Mail / Express Trains';

    const pltLng = +(stnLng - (lngSpan / 2) + (p - 1) * stepLng).toFixed(6);
    const pltLat = +(stnLat + 0.0004).toFixed(6);

    const pltNode = {
      id: `NODE_${station.code}_PLT_${p}`,
      floor_id: floorId,
      name: `Platform ${p} (${serviceTag})`,
      platformNumber: `${p}`,
      serviceTag,
      type: 'PLATFORM',
      x: xPos,
      y: 120,
      lat: pltLat,
      lng: pltLng,
      accessible: true,
      icon: '🚆'
    };

    nodes.push(pltNode);

    // Platform QR code
    qrLocations.push({
      id: 10 + p,
      code: `QR_${station.code}_PLT_${p}`,
      node_id: pltNode.id,
      description: `${station.name} - Platform ${p} Boarding Deck`
    });

    // FOB Overhead Bay Waypoint aligned horizontally along the bridge at this platform's longitude
    const fobBayNode = {
      id: `NODE_${station.code}_FOB_BAY_${p}`,
      floor_id: 2,
      name: `FOB Overhead Bay - Platform ${p}`,
      type: 'CORRIDOR',
      x: xPos,
      y: 260,
      lat: +(stnLat + 0.0002).toFixed(6),
      lng: pltLng,
      accessible: true,
      icon: '🌉'
    };
    nodes.push(fobBayNode);

    // 1. Walk along the Foot Over Bridge (East-West corridor)
    const bridgeWalkDist = Math.max(10, Math.round(Math.abs(xPos - 400) * 0.45) + 8);
    const bridgeWalkTime = Math.round(bridgeWalkDist * 0.75);

    edges.push(
      { from_node_id: fobBridge.id, to_node_id: fobBayNode.id, distance: bridgeWalkDist, estimated_time: bridgeWalkTime, accessible: true, blocked: false },
      { from_node_id: fobBayNode.id, to_node_id: fobBridge.id, distance: bridgeWalkDist, estimated_time: bridgeWalkTime, accessible: true, blocked: false }
    );

    // 2. Walk down from FOB Bay onto Platform Boarding Deck (North-South staircase / accessible ramp)
    edges.push(
      { from_node_id: fobBayNode.id, to_node_id: pltNode.id, distance: 25, estimated_time: 18, accessible: true, blocked: false },
      { from_node_id: pltNode.id, to_node_id: fobBayNode.id, distance: 25, estimated_time: 18, accessible: true, blocked: false }
    );

    // If platform is on ground floor, also connect directly to main concourse
    if (isFloor0) {
      const distToConcourse = Math.abs(xPos - 400) + 40;
      edges.push(
        { from_node_id: concourse.id, to_node_id: pltNode.id, distance: distToConcourse, estimated_time: Math.round(distToConcourse * 0.8), accessible: true, blocked: false },
        { from_node_id: pltNode.id, to_node_id: concourse.id, distance: distToConcourse, estimated_time: Math.round(distToConcourse * 0.8), accessible: true, blocked: false }
      );
    }
  }

  // Western Line interchange connection for Dadar Central
  if (station.id === 8) {
    const westernBridge = {
      id: 'NODE_DR_WESTERN_INTERCHANGE',
      floor_id: 2,
      name: 'Western Railway Footbridge Connector (To Platforms 1-7 Western)',
      type: 'CORRIDOR',
      x: 720,
      y: 260,
      lat: +(stnLat + 0.0002).toFixed(6),
      lng: +(stnLng - 0.0008).toFixed(6),
      accessible: true,
      icon: '🔄'
    };
    nodes.push(westernBridge);
    edges.push(
      { from_node_id: fobBridge.id, to_node_id: westernBridge.id, distance: 45, estimated_time: 35, accessible: true, blocked: false },
      { from_node_id: westernBridge.id, to_node_id: fobBridge.id, distance: 45, estimated_time: 35, accessible: true, blocked: false }
    );
  }

  // Metro Line 1 interchange connection for Ghatkopar
  if (station.id === 13) {
    const metroBridge = {
      id: 'NODE_GC_METRO_INTERCHANGE',
      floor_id: 2,
      name: 'Mumbai Metro Line 1 Elevated Concourse Link (To Versova)',
      type: 'CORRIDOR',
      x: 720,
      y: 260,
      lat: +(stnLat + 0.0004).toFixed(6),
      lng: +(stnLng - 0.0006).toFixed(6),
      accessible: true,
      icon: '🚇'
    };
    nodes.push(metroBridge);
    edges.push(
      { from_node_id: fobBridge.id, to_node_id: metroBridge.id, distance: 40, estimated_time: 30, accessible: true, blocked: false },
      { from_node_id: metroBridge.id, to_node_id: fobBridge.id, distance: 40, estimated_time: 30, accessible: true, blocked: false }
    );
  }

  const graph = new StationGraph(nodes, edges);

  return {
    station,
    nodes,
    edges,
    qrLocations,
    facilities,
    graph
  };
}

// Pre-instantiate active station layout (Default: CSMT)
let currentStationLayout = getStationLayout(1);

/**
 * GET /api/stations
 */
export function getStations(req, res) {
  res.json({
    success: true,
    total: MUMBAI_CENTRAL_LINE_STATIONS.length,
    data: MUMBAI_CENTRAL_LINE_STATIONS
  });
}

/**
 * GET /api/stations/:stationId
 */
export function getStationById(req, res) {
  const rawId = req.params.stationId;
  const stationId = Number(rawId);
  if (!rawId || isNaN(stationId) || !Number.isInteger(stationId)) {
    return res.status(400).json({ success: false, error: 'Invalid station ID parameter. An integer is required.' });
  }
  const layout = getStationLayout(stationId);
  if (!layout) {
    return res.status(404).json({ success: false, error: `Station with ID ${stationId} not found in database.` });
  }
  currentStationLayout = layout;

  res.json({
    success: true,
    data: {
      ...layout.station,
      nodes: layout.nodes,
      qrLocations: layout.qrLocations,
      facilities: layout.facilities
    }
  });
}

/**
 * GET /api/stations/:stationId/facilities
 */
export function getFacilities(req, res) {
  const rawId = req.params.stationId;
  const stationId = Number(rawId);
  if (!rawId || isNaN(stationId) || !Number.isInteger(stationId)) {
    return res.status(400).json({ success: false, error: 'Invalid station ID parameter. An integer is required.' });
  }
  const layout = getStationLayout(stationId);
  if (!layout) {
    return res.status(404).json({ success: false, error: `Station with ID ${stationId} not found in database.` });
  }

  res.json({
    success: true,
    data: layout.facilities
  });
}

/**
 * POST /api/navigation/qr-scan
 */
export function postQRScan(req, res) {
  const { code, stationId } = req.body || {};
  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ success: false, error: 'A valid QR code string is required.' });
  }

  let layout = currentStationLayout;
  if (stationId !== undefined) {
    const numericId = Number(stationId);
    if (isNaN(numericId) || !Number.isInteger(numericId)) {
      return res.status(400).json({ success: false, error: 'stationId must be a valid integer.' });
    }
    layout = getStationLayout(numericId);
    if (!layout) {
      return res.status(404).json({ success: false, error: `Station with ID ${stationId} not found.` });
    }
  }

  const cleanCode = code.trim().toUpperCase();
  const qr = layout.qrLocations.find(q => q.code.toUpperCase() === cleanCode);
  if (!qr) {
    return res.status(404).json({ success: false, error: 'QR Code not recognized in station database.' });
  }

  const node = layout.nodes.find(n => n.id === qr.node_id);
  res.json({
    success: true,
    qrCode: qr.code,
    description: qr.description,
    currentNode: node
  });
}

/**
 * POST /api/navigation/route
 */
export function postCalculateRoute(req, res) {
  const { stationId, startNodeId, destinationNodeId, routeType = 'NORMAL' } = req.body || {};
  if (!startNodeId || typeof startNodeId !== 'string' || !startNodeId.trim()) {
    return res.status(400).json({ success: false, error: 'startNodeId is required.' });
  }
  if (!destinationNodeId || typeof destinationNodeId !== 'string' || !destinationNodeId.trim()) {
    return res.status(400).json({ success: false, error: 'destinationNodeId is required.' });
  }

  let layout = currentStationLayout;
  if (stationId !== undefined) {
    const numericId = Number(stationId);
    if (isNaN(numericId) || !Number.isInteger(numericId)) {
      return res.status(400).json({ success: false, error: 'stationId must be a valid integer.' });
    }
    layout = getStationLayout(numericId);
    if (!layout) {
      return res.status(404).json({ success: false, error: `Station with ID ${stationId} not found.` });
    }
  }

  const allowedModes = ['NORMAL', 'FASTEST', 'SHORTEST', 'ACCESSIBLE', 'EMERGENCY'];
  const cleanRouteType = allowedModes.includes(routeType?.toUpperCase()) ? routeType.toUpperCase() : 'NORMAL';

  const result = calculateAStarRoute(layout.graph, startNodeId.trim(), destinationNodeId.trim(), cleanRouteType);

  if (!result.success) {
    return res.status(404).json(result);
  }

  res.json(result);
}

/**
 * POST /api/ai/chat
 */
export function postAIChat(req, res) {
  const { message, startNodeId, stationId = 1, accessibleMode = false } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, error: 'Message query parameter is required.' });
  }

  const numericId = Number(stationId);
  const layout = getStationLayout(numericId);
  if (!layout) {
    return res.status(404).json({ success: false, error: `Station with ID ${stationId} not found.` });
  }

  const lower = message.trim().toLowerCase();

  // Search for platform number in query (e.g. "Platform 18", "Platform 4", "Platform 8")
  const platformMatch = lower.match(/platform\s*([0-9]+)/i);
  let targetNodeId = null;

  if (platformMatch) {
    const platNum = platformMatch[1];
    const targetPlat = layout.nodes.find(n => n.type === 'PLATFORM' && n.platformNumber === platNum);
    if (targetPlat) {
      targetNodeId = targetPlat.id;
    }
  } else if (lower.includes('restroom') || lower.includes('washroom') || lower.includes('toilet')) {
    targetNodeId = layout.nodes.find(n => n.type === 'RESTROOM')?.id;
  } else if (lower.includes('food') || lower.includes('tea') || lower.includes('snacks')) {
    targetNodeId = layout.nodes.find(n => n.type === 'FOOD_COURT')?.id;
  } else if (lower.includes('ticket') || lower.includes('booking') || lower.includes('atvm')) {
    targetNodeId = layout.nodes.find(n => n.type === 'TICKET_COUNTER')?.id;
  } else if (lower.includes('western') && layout.station.id === 8) {
    targetNodeId = 'NODE_DR_WESTERN_INTERCHANGE';
  } else if (lower.includes('metro') && layout.station.id === 13) {
    targetNodeId = 'NODE_GC_METRO_INTERCHANGE';
  }

  if (targetNodeId) {
    const originId = startNodeId || layout.nodes[0].id;
    const route = calculateAStarRoute(layout.graph, originId, targetNodeId, accessibleMode ? 'ACCESSIBLE' : 'NORMAL');
    const destNode = layout.nodes.find(n => n.id === targetNodeId);

    return res.json({
      success: true,
      reply: `${destNode.name} at ${layout.station.name} is ${route.distance} meters away (~${Math.ceil(route.estimatedTime / 60)} minutes walk). ${route.instructions[1] || 'Follow the highlighted route on your station map.'}`,
      destinationNodeId: targetNodeId,
      route
    });
  }

  if (lower.includes('hello') || lower.includes('hi')) {
    return res.json({
      success: true,
      reply: `Welcome to ${layout.station.name}! Ask me for any of the ${layout.station.totalPlatforms} platforms, ticket booking office, restrooms, or FOB lifts.`
    });
  }

  res.json({
    success: true,
    reply: `I don't have information about that location at ${layout.station.name}. You can ask me for Platforms 1 to ${layout.station.totalPlatforms}, Ticket Counters, Restrooms, or Food stalls.`
  });
}

/**
 * GET /api/station-updates
 */
export function getStationUpdates(req, res) {
  res.json({
    success: true,
    data: [
      { id: 1, type: 'ANNOUNCEMENT', message: 'Central Railway Local Train Services running normally across all 26 stations (CSMT to Kalyan).', status: 'ACTIVE' },
      { id: 2, type: 'LIFT_MAINTENANCE', message: 'Elevator lifts are operational on Foot Over Bridges at CSMT, Dadar, Kurla, and Thane.', status: 'ACTIVE' }
    ]
  });
}

/**
 * POST /api/routes/search
 */
export function postRouteSearch(req, res) {
  const { origin, destination, options = {} } = req.body || {};
  if (!origin || !destination) {
    return res.status(400).json({ success: false, error: 'Both origin and destination stations are required.' });
  }

  const originStn = MUMBAI_CENTRAL_LINE_STATIONS.find(s => s.id === Number(origin) || s.code === String(origin).toUpperCase() || s.name.toLowerCase().includes(String(origin).toLowerCase()));
  const destStn = MUMBAI_CENTRAL_LINE_STATIONS.find(s => s.id === Number(destination) || s.code === String(destination).toUpperCase() || s.name.toLowerCase().includes(String(destination).toLowerCase()));

  if (!originStn || !destStn) {
    return res.status(404).json({ success: false, error: 'Origin or destination station not found on Mumbai Central Line.' });
  }

  const originIdx = MUMBAI_CENTRAL_LINE_STATIONS.findIndex(s => s.id === originStn.id);
  const destIdx = MUMBAI_CENTRAL_LINE_STATIONS.findIndex(s => s.id === destStn.id);
  const numStops = Math.abs(destIdx - originIdx);
  const distanceKm = Math.max(2, numStops * 2.3);
  const isFast = options.preference === 'fastest' && numStops > 5;
  const durationMinutes = Math.round(isFast ? numStops * 1.8 + 4 : numStops * 2.6 + 2);

  const direction = destIdx > originIdx ? 'Down (towards Kalyan)' : 'Up (towards CSMT)';
  const trainType = isFast ? 'Fast Suburban Local' : 'All-Stops Slow Local';

  // Calculate realistic Mumbai suburban fare
  let estimatedFare = 5.0;
  if (distanceKm > 10 && distanceKm <= 20) estimatedFare = 10.0;
  else if (distanceKm > 20 && distanceKm <= 35) estimatedFare = 15.0;
  else if (distanceKm > 35 && distanceKm <= 50) estimatedFare = 20.0;
  else if (distanceKm > 50) estimatedFare = 25.0;

  const intermediateStations = [];
  const step = destIdx > originIdx ? 1 : -1;
  for (let i = originIdx + step; i !== destIdx; i += step) {
    intermediateStations.push(MUMBAI_CENTRAL_LINE_STATIONS[i]);
  }

  const legs = [
    {
      type: 'BOARDING',
      station: originStn,
      instruction: `Board ${trainType} ${direction} from Platform 1/2.`,
      scheduledDeparture: '3 mins'
    },
    {
      type: 'TRANSIT',
      trainType,
      direction,
      stopsCount: numStops,
      intermediateStations: intermediateStations.map(s => s.name),
      durationMinutes
    },
    {
      type: 'ALIGHTING',
      station: destStn,
      instruction: `Arrive at ${destStn.name} Platform 1/2. Total journey distance: ${distanceKm.toFixed(1)} km.`
    }
  ];

  res.json({
    success: true,
    itinerary: {
      origin: originStn,
      destination: destStn,
      totalDurationMinutes: durationMinutes,
      distanceKm: +distanceKm.toFixed(1),
      estimatedFare,
      trainType,
      direction,
      legs,
      departures: [
        { time: 'In 3 mins', type: trainType, platform: 'Platform 1' },
        { time: 'In 7 mins', type: 'Slow Local', platform: 'Platform 2' },
        { time: 'In 12 mins', type: 'Fast Local', platform: 'Platform 1' }
      ]
    }
  });
}

/**
 * POST /api/fare/calculate
 */
export function postCalculateFare(req, res) {
  const { distanceKm = 10, travelClass = 'STANDARD', isOffPeak = false } = req.body || {};
  const dist = Math.max(1, Number(distanceKm) || 10);
  const multipliers = { STANDARD: 1.0, BUSINESS: 1.6, FIRST: 2.2 };
  const mult = multipliers[travelClass?.toUpperCase()] || 1.0;

  const basePrice = +(2.50 * mult).toFixed(2);
  const distanceCharge = +(dist * 0.12 * mult).toFixed(2);
  const subtotal = +(basePrice + distanceCharge).toFixed(2);
  const discountApplied = isOffPeak ? +(subtotal * 0.15).toFixed(2) : 0;
  const taxable = subtotal - discountApplied;
  const tax = +(taxable * 0.08).toFixed(2);
  const totalFare = +(taxable + tax).toFixed(2);

  res.json({
    success: true,
    fareSummary: {
      basePrice,
      distanceCharge,
      discountApplied,
      tax,
      totalFare
    }
  });
}
