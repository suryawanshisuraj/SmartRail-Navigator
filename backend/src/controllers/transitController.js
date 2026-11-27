import { StationGraph, calculateAStarRoute } from '../engine/router.js';
import { REAL_INDIAN_STATIONS, searchRealStations, getRealStationByIdOrCode } from '../data/realIndianStations.js';
import { fetchStationOSMFeatures } from '../services/osmOverpassService.js';

// All 26 Mumbai Central Line Stations (IDs 1 to 26) from CSMT to Kalyan
export const MUMBAI_CENTRAL_LINE_STATIONS = REAL_INDIAN_STATIONS.filter(s => s.id >= 1 && s.id <= 26).sort((a, b) => a.id - b.id);

/**
 * Generate full graph model (nodes, edges, QR tags, facilities) for any selected Indian railway station.
 * Grounded in real OpenStreetMap geographic coordinates, verified entrances, and platforms.
 */
export function getStationLayout(stationId = 1) {
  const station = getRealStationByIdOrCode(stationId);
  if (!station) {
    return null;
  }

  const numPlatforms = station.id === 1 ? 18 : (station.totalPlatforms || station.platforms?.length || 4);

  const nodes = [];
  const edges = [];
  const qrLocations = [];
  const facilities = [];

  const stnLat = station.latitude || station.lat || 18.9400;
  const stnLng = station.longitude || station.lng || 72.8354;

  // Real verified entrance coordinates if available in station data
  const rawEast = station.entrances?.find(e => e.type === 'EAST' || e.id?.includes('EAST'));
  const rawWest = station.entrances?.find(e => e.type === 'WEST' || e.id?.includes('WEST'));
  const rawNorth = station.entrances?.find(e => e.type === 'NORTH' || e.id?.includes('NORTH'));

  const entryEastLat = rawEast?.lat ?? +(stnLat - 0.0006).toFixed(6);
  const entryEastLng = rawEast?.lng ?? +(stnLng + 0.0004).toFixed(6);
  const entryWestLat = rawWest?.lat ?? +(stnLat - 0.0006).toFixed(6);
  const entryWestLng = rawWest?.lng ?? +(stnLng - 0.0004).toFixed(6);

  // Real Entrances with standard IDs for accessibility and routing
  const entryEast = {
    id: `NODE_${station.code}_ENTRY_EAST`,
    floor_id: 1,
    name: rawEast?.name || `${station.name} - East Entrance`,
    type: 'ENTRANCE',
    x: 200,
    y: 530,
    lat: entryEastLat,
    lng: entryEastLng,
    accessible: true,
    icon: '🚪'
  };

  const entryWest = {
    id: `NODE_${station.code}_ENTRY_WEST`,
    floor_id: 1,
    name: rawWest?.name || `${station.name} - West Entrance`,
    type: 'ENTRANCE',
    x: 600,
    y: 530,
    lat: entryWestLat,
    lng: entryWestLng,
    accessible: true,
    icon: '🚪'
  };
  nodes.push(entryEast, entryWest);

  // Optional North Entrance if present
  let entryNorth = null;
  if (rawNorth) {
    entryNorth = {
      id: `NODE_${station.code}_ENTRY_NORTH`,
      floor_id: 1,
      name: rawNorth.name || `${station.name} - North Gate`,
      type: 'ENTRANCE',
      x: 400,
      y: 100,
      lat: rawNorth.lat,
      lng: rawNorth.lng,
      accessible: rawNorth.accessible ?? true,
      icon: '🚪'
    };
    nodes.push(entryNorth);
  }

  // Outdoor Perimeter Walkway Nodes & Subways connecting East and West gates
  // (Prevents cutting straight lines through buildings when walking between entrances or along station perimeter)
  const walkwayMid1 = {
    id: `NODE_${station.code}_WALKWAY_ST_GEORGE`,
    floor_id: 1,
    name: 'St. George Road / Perimeter Sidewalk',
    type: 'CORRIDOR',
    isOutdoor: true,
    x: 300,
    y: 570,
    lat: +((entryEastLat * 0.6) + (entryWestLat * 0.4) - 0.0001).toFixed(6),
    lng: +((entryEastLng * 0.75) + (entryWestLng * 0.25)).toFixed(6),
    accessible: true,
    icon: '🚶'
  };

  const walkwayMid2 = {
    id: `NODE_${station.code}_WALKWAY_SUBWAY_PLAZA`,
    floor_id: 1,
    name: 'Station Front Plaza / Subway Passage',
    type: 'CORRIDOR',
    isOutdoor: true,
    x: 500,
    y: 570,
    lat: +((entryEastLat * 0.35) + (entryWestLat * 0.65) - 0.0001).toFixed(6),
    lng: +((entryEastLng * 0.3) + (entryWestLng * 0.7)).toFixed(6),
    accessible: true,
    icon: '🚶'
  };
  nodes.push(walkwayMid1, walkwayMid2);

  // Perimeter Walkway edges (following real street perimeter sidewalks)
  edges.push(
    { from_node_id: entryEast.id, to_node_id: walkwayMid1.id, distance: 70, estimated_time: 50, accessible: true, blocked: false },
    { from_node_id: walkwayMid1.id, to_node_id: entryEast.id, distance: 70, estimated_time: 50, accessible: true, blocked: false },
    { from_node_id: walkwayMid1.id, to_node_id: walkwayMid2.id, distance: 80, estimated_time: 55, accessible: true, blocked: false },
    { from_node_id: walkwayMid2.id, to_node_id: walkwayMid1.id, distance: 80, estimated_time: 55, accessible: true, blocked: false },
    { from_node_id: walkwayMid2.id, to_node_id: entryWest.id, distance: 65, estimated_time: 45, accessible: true, blocked: false },
    { from_node_id: entryWest.id, to_node_id: walkwayMid2.id, distance: 65, estimated_time: 45, accessible: true, blocked: false }
  );

  // Concourse & Indoor Station Nodes
  const concourse = { id: `NODE_${station.code}_CONCOURSE`, floor_id: 1, name: `${station.name} Central Concourse`, type: 'CORRIDOR', x: 400, y: 440, lat: +(stnLat - 0.0002).toFixed(6), lng: +stnLng.toFixed(6), accessible: true, icon: '🧭' };
  const ticketOffice = { id: `NODE_${station.code}_TICKET`, floor_id: 1, name: 'UTS / ATVM Ticket Counters', type: 'TICKET_COUNTER', x: 300, y: 490, lat: +(stnLat - 0.0004).toFixed(6), lng: +(stnLng + 0.0002).toFixed(6), accessible: true, icon: '🎫' };
  const restroom = { id: `NODE_${station.code}_RESTROOM`, floor_id: 1, name: 'Accessible Restroom & Water Booth', type: 'RESTROOM', x: 150, y: 440, lat: +(stnLat - 0.0002).toFixed(6), lng: +(stnLng + 0.0003).toFixed(6), accessible: true, icon: '🚻' };
  const foodStall = { id: `NODE_${station.code}_FOOD`, floor_id: 1, name: 'Snacks & Tea Refreshments', type: 'FOOD_COURT', x: 650, y: 440, lat: +(stnLat - 0.0002).toFixed(6), lng: +(stnLng - 0.0003).toFixed(6), accessible: true, icon: '☕' };
  const liftF0 = { id: `NODE_${station.code}_LIFT_F0`, floor_id: 1, name: 'Elevator Lift L-1 (Accessible)', type: 'LIFT', x: 340, y: 350, lat: +(stnLat + 0.0001).toFixed(6), lng: +(stnLng - 0.0001).toFixed(6), accessible: true, icon: '🛗' };
  const stairsF0 = { id: `NODE_${station.code}_STAIRS_F0`, floor_id: 1, name: 'Middle FOB Stairs Bank', type: 'STAIRS', x: 460, y: 350, lat: +(stnLat + 0.0001).toFixed(6), lng: +(stnLng + 0.0001).toFixed(6), accessible: false, icon: '🪜' };

  // Floor 2: Foot Over Bridge (FOB)
  const fobBridge = { id: `NODE_${station.code}_FOB_BRIDGE`, floor_id: 2, name: 'Central Foot Over Bridge (FOB)', type: 'CORRIDOR', x: 400, y: 260, lat: +(stnLat + 0.0002).toFixed(6), lng: +stnLng.toFixed(6), accessible: true, icon: '🌉' };
  const liftF1 = { id: `NODE_${station.code}_LIFT_F1`, floor_id: 2, name: 'Elevator Lift L-1 (FOB Landing)', type: 'LIFT', x: 340, y: 260, lat: +(stnLat + 0.0002).toFixed(6), lng: +(stnLng - 0.0001).toFixed(6), accessible: true, icon: '🛗' };
  const stairsF1 = { id: `NODE_${station.code}_STAIRS_F1`, floor_id: 2, name: 'Middle FOB Stair Landing', type: 'STAIRS', x: 460, y: 260, lat: +(stnLat + 0.0002).toFixed(6), lng: +(stnLng + 0.0001).toFixed(6), accessible: false, icon: '🪜' };

  nodes.push(concourse, ticketOffice, restroom, foodStall, liftF0, stairsF0, fobBridge, liftF1, stairsF1);

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

  // Connect entrances to interior ticket office & concourse
  // Realistic cross-terminal walking distances (CSMT is 250m+ wide across 18 tracks)
  edges.push(
    { from_node_id: entryEast.id, to_node_id: ticketOffice.id, distance: 40, estimated_time: 30, accessible: true, blocked: false },
    { from_node_id: ticketOffice.id, to_node_id: entryEast.id, distance: 40, estimated_time: 30, accessible: true, blocked: false },
    { from_node_id: ticketOffice.id, to_node_id: concourse.id, distance: 120, estimated_time: 90, accessible: true, blocked: false },
    { from_node_id: concourse.id, to_node_id: ticketOffice.id, distance: 120, estimated_time: 90, accessible: true, blocked: false },

    { from_node_id: entryWest.id, to_node_id: concourse.id, distance: 140, estimated_time: 105, accessible: true, blocked: false },
    { from_node_id: concourse.id, to_node_id: entryWest.id, distance: 140, estimated_time: 105, accessible: true, blocked: false }
  );

  if (entryNorth) {
    edges.push(
      { from_node_id: entryNorth.id, to_node_id: fobBridge.id, distance: 40, estimated_time: 30, accessible: true, blocked: false },
      { from_node_id: fobBridge.id, to_node_id: entryNorth.id, distance: 40, estimated_time: 30, accessible: true, blocked: false }
    );
  }

  // Base concourse connections
  edges.push(
    { from_node_id: concourse.id, to_node_id: restroom.id, distance: 25, estimated_time: 18, accessible: true, blocked: false },
    { from_node_id: restroom.id, to_node_id: concourse.id, distance: 25, estimated_time: 18, accessible: true, blocked: false },
    { from_node_id: concourse.id, to_node_id: foodStall.id, distance: 25, estimated_time: 18, accessible: true, blocked: false },
    { from_node_id: foodStall.id, to_node_id: concourse.id, distance: 25, estimated_time: 18, accessible: true, blocked: false },
    { from_node_id: concourse.id, to_node_id: liftF0.id, distance: 15, estimated_time: 12, accessible: true, blocked: false },
    { from_node_id: liftF0.id, to_node_id: concourse.id, distance: 15, estimated_time: 12, accessible: true, blocked: false },
    { from_node_id: concourse.id, to_node_id: stairsF0.id, distance: 15, estimated_time: 12, accessible: false, blocked: false },
    { from_node_id: stairsF0.id, to_node_id: concourse.id, distance: 15, estimated_time: 12, accessible: false, blocked: false },
    { from_node_id: liftF0.id, to_node_id: liftF1.id, distance: 12, estimated_time: 18, accessible: true, blocked: false },
    { from_node_id: liftF1.id, to_node_id: liftF0.id, distance: 12, estimated_time: 18, accessible: true, blocked: false },
    { from_node_id: stairsF0.id, to_node_id: stairsF1.id, distance: 15, estimated_time: 20, accessible: false, blocked: false },
    { from_node_id: stairsF1.id, to_node_id: stairsF0.id, distance: 15, estimated_time: 20, accessible: false, blocked: false },
    { from_node_id: liftF1.id, to_node_id: fobBridge.id, distance: 10, estimated_time: 8, accessible: true, blocked: false },
    { from_node_id: fobBridge.id, to_node_id: liftF1.id, distance: 10, estimated_time: 8, accessible: true, blocked: false },
    { from_node_id: stairsF1.id, to_node_id: fobBridge.id, distance: 10, estimated_time: 8, accessible: false, blocked: false },
    { from_node_id: fobBridge.id, to_node_id: stairsF1.id, distance: 10, estimated_time: 8, accessible: false, blocked: false }
  );

  // Generate All Actual Platforms for this station with realistic non-overlapping coordinates
  const verifiedPlatformsMap = new Map();
  if (Array.isArray(station.platforms)) {
    station.platforms.forEach(p => {
      if (p.number && p.lat && p.lng) {
        verifiedPlatformsMap.set(String(p.number), p);
      }
    });
  }

  const startX = 140;
  const endX = 680;
  const stepX = (endX - startX) / Math.max(1, numPlatforms - 1);

  for (let p = 1; p <= numPlatforms; p++) {
    const pStr = String(p);
    const verified = verifiedPlatformsMap.get(pStr);
    const xPos = Math.round(startX + (p - 1) * stepX);
    const isFloor0 = p <= 3;
    const floorId = isFloor0 ? 1 : 2;

    let serviceTag = 'Slow Local (Up/Down)';
    if (p === 3 || p === 4) serviceTag = 'Fast Local (Towards CSMT / Kalyan)';
    if (p >= 8 && station.id === 1) serviceTag = 'Outstation Mail / Express Trains';

    let pltLat, pltLng;

    if (verified) {
      pltLat = Number(verified.lat);
      pltLng = Number(verified.lng);
    } else if (station.id === 1) {
      // CSMT: Platforms 1-7 are suburban tracks running alongside each other west-to-east
      // Platforms 8-18 are mainline terminal tracks extending northwards
      if (p <= 7) {
        pltLat = +(18.9402 + (p - 1) * 0.00035).toFixed(6);
        pltLng = +(72.8351 + (p - 1) * 0.00008).toFixed(6);
      } else {
        pltLat = +(18.9408 + (p - 8) * 0.00030).toFixed(6);
        pltLng = +(72.8360 + (p - 8) * 0.00010).toFixed(6);
      }
    } else {
      // General stations: distribute along track corridor
      const latOffset = (p - 1) * 0.00035;
      const lngOffset = ((p - 1) % 2 === 0 ? 1 : -1) * 0.00015;
      pltLat = +(stnLat + 0.0003 + latOffset).toFixed(6);
      pltLng = +(stnLng + lngOffset).toFixed(6);
    }

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

    // FOB Overhead Bay Waypoint
    const fobBayNode = {
      id: `NODE_${station.code}_FOB_BAY_${p}`,
      floor_id: 2,
      name: `FOB Overhead Bay - Platform ${p}`,
      type: 'CORRIDOR',
      x: xPos,
      y: 260,
      lat: +(pltLat - 0.00015).toFixed(6),
      lng: pltLng,
      accessible: true,
      icon: '🌉'
    };
    nodes.push(fobBayNode);

    // FOB connections along bridge deck
    const bridgeWalkDist = Math.max(10, Math.round(Math.abs(xPos - 400) * 0.45) + 8);
    const bridgeWalkTime = Math.round(bridgeWalkDist * 0.75);

    edges.push(
      { from_node_id: fobBridge.id, to_node_id: fobBayNode.id, distance: bridgeWalkDist, estimated_time: bridgeWalkTime, accessible: true, blocked: false },
      { from_node_id: fobBayNode.id, to_node_id: fobBridge.id, distance: bridgeWalkDist, estimated_time: bridgeWalkTime, accessible: true, blocked: false }
    );

    // Ramp / stairs down from FOB Bay onto platform boarding deck
    edges.push(
      { from_node_id: fobBayNode.id, to_node_id: pltNode.id, distance: 25, estimated_time: 18, accessible: true, blocked: false },
      { from_node_id: pltNode.id, to_node_id: fobBayNode.id, distance: 25, estimated_time: 18, accessible: true, blocked: false }
    );

    // Terminal head walk-in platforms (Platforms 1 to 3) have direct ground level concourse access
    if (isFloor0) {
      const distToConcourse = 35 + (p - 1) * 15;
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



/**
 * GET /api/stations
 */
/**
 * GET /api/stations
 */
export function getStations(req, res) {
  res.json({
    success: true,
    total: REAL_INDIAN_STATIONS.length,
    data: REAL_INDIAN_STATIONS
  });
}

/**
 * GET /api/stations/search?q=query
 * Real Indian railway station search (exact, partial, case-insensitive)
 */
export function searchStations(req, res) {
  const query = req.query.q || req.query.query;
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ success: false, error: 'Query parameter q is required.' });
  }

  const results = searchRealStations(query);
  return res.json({
    success: true,
    query,
    total: results.length,
    data: results,
    message: results.length === 0 ? 'No matching railway stations found.' : undefined
  });
}

/**
 * GET /api/stations/:stationId/osm-features
 * Real OpenStreetMap geographic features, platforms, and verified amenities
 */
export async function getStationOsmFeatures(req, res) {
  const rawId = req.params.stationId;
  const station = getRealStationByIdOrCode(rawId);
  if (!station) {
    return res.status(404).json({ success: false, error: `Station ${rawId} not found in database.` });
  }

  const osmData = await fetchStationOSMFeatures(station.latitude, station.longitude);
  return res.json({
    success: true,
    stationId: station.id,
    stationName: station.name,
    coordinates: { lat: station.latitude, lng: station.longitude },
    data: osmData
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
    return res.status(404).json({ success: false, error: `Station ${rawId} not found in database.` });
  }
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

  const numericId = Number(stationId || 1);
  if (isNaN(numericId) || !Number.isInteger(numericId)) {
    return res.status(400).json({ success: false, error: 'stationId must be a valid integer.' });
  }
  const layout = getStationLayout(numericId);
  if (!layout) {
    return res.status(404).json({ success: false, error: `Station with ID ${stationId} not found.` });
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

  const numericId = Number(stationId || 1);
  if (isNaN(numericId) || !Number.isInteger(numericId)) {
    return res.status(400).json({ success: false, error: 'stationId must be a valid integer.' });
  }
  const layout = getStationLayout(numericId);
  if (!layout) {
    return res.status(404).json({ success: false, error: `Station with ID ${stationId} not found.` });
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

    if (!route || !route.success) {
      return res.json({
        success: true,
        reply: `${destNode.name} at ${layout.station.name} is on Floor ${destNode.floor_id || 1}. Select a starting entrance on the map to see step-by-step directions.`,
        destinationNodeId: targetNodeId,
        route: null
      });
    }

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

  if (originStn.id === destStn.id) {
    return res.status(400).json({ success: false, error: 'Departure and destination stations must be different.' });
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
  for (let i = originIdx + step; i !== destIdx && i >= 0 && i < MUMBAI_CENTRAL_LINE_STATIONS.length; i += step) {
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
