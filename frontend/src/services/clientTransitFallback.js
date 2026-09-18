/**
 * Client Transit Fallback - Mumbai Central Line
 * Self-contained client-side station catalog, offline graph model, and routing.
 * Ensures the frontend is 100% decoupled from the backend codebase and can run/build independently.
 */

export const CLIENT_CENTRAL_LINE_STATIONS = [
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

export class ClientStationGraph {
  constructor(nodes = [], edges = []) {
    this.nodes = new Map();
    this.adjacencyList = new Map();

    nodes.forEach(node => {
      this.nodes.set(node.id, node);
      this.adjacencyList.set(node.id, []);
    });

    edges.forEach(edge => {
      if (!this.adjacencyList.has(edge.from_node_id)) {
        this.adjacencyList.set(edge.from_node_id, []);
      }
      this.adjacencyList.get(edge.from_node_id).push(edge);
    });
  }

  getNode(id) {
    return this.nodes.get(id);
  }

  getAllNodes() {
    return Array.from(this.nodes.values());
  }

  getOutgoingEdges(nodeId) {
    return this.adjacencyList.get(nodeId) || [];
  }
}

export function getClientStationLayout(stationId = 1) {
  const numericId = Number(stationId);
  const station = CLIENT_CENTRAL_LINE_STATIONS.find(s => s.id === numericId) || CLIENT_CENTRAL_LINE_STATIONS[0];
  const numPlatforms = station.totalPlatforms;

  const nodes = [];
  const edges = [];
  const qrLocations = [];
  const facilities = [];

  const stnLat = station.lat || 18.9400;
  const stnLng = station.lng || 72.8354;

  const entryEast = { id: `NODE_${station.code}_ENTRY_EAST`, floor_id: 1, name: `${station.name} - East Entrance`, type: 'ENTRANCE', x: 200, y: 530, lat: +(stnLat - 0.0006).toFixed(6), lng: +(stnLng + 0.0004).toFixed(6), accessible: true, icon: '🚪' };
  const entryWest = { id: `NODE_${station.code}_ENTRY_WEST`, floor_id: 1, name: `${station.name} - West Entrance`, type: 'ENTRANCE', x: 600, y: 530, lat: +(stnLat - 0.0006).toFixed(6), lng: +(stnLng - 0.0004).toFixed(6), accessible: true, icon: '🚪' };
  const concourse = { id: `NODE_${station.code}_CONCOURSE`, floor_id: 1, name: 'Central Station Concourse', type: 'CORRIDOR', x: 400, y: 440, lat: +(stnLat - 0.0002).toFixed(6), lng: +stnLng.toFixed(6), accessible: true, icon: '🧭' };
  const ticketOffice = { id: `NODE_${station.code}_TICKET`, floor_id: 1, name: 'UTS / ATVM Ticket Counters', type: 'TICKET_COUNTER', x: 300, y: 490, lat: +(stnLat - 0.0004).toFixed(6), lng: +(stnLng + 0.0002).toFixed(6), accessible: true, icon: '🎫' };
  const restroom = { id: `NODE_${station.code}_RESTROOM`, floor_id: 1, name: 'Accessible Restroom & Water Booth', type: 'RESTROOM', x: 150, y: 440, lat: +(stnLat - 0.0002).toFixed(6), lng: +(stnLng + 0.0003).toFixed(6), accessible: true, icon: '🚻' };
  const foodStall = { id: `NODE_${station.code}_FOOD`, floor_id: 1, name: 'Snacks & Tea Refreshments', type: 'FOOD_COURT', x: 650, y: 440, lat: +(stnLat - 0.0002).toFixed(6), lng: +(stnLng - 0.0003).toFixed(6), accessible: true, icon: '☕' };
  const liftF0 = { id: `NODE_${station.code}_LIFT_F0`, floor_id: 1, name: 'Elevator Lift L-1 (Accessible)', type: 'LIFT', x: 340, y: 350, lat: +(stnLat + 0.0001).toFixed(6), lng: +(stnLng - 0.0001).toFixed(6), accessible: true, icon: '🛗' };
  const stairsF0 = { id: `NODE_${station.code}_STAIRS_F0`, floor_id: 1, name: 'Middle FOB Stairs Bank', type: 'STAIRS', x: 460, y: 350, lat: +(stnLat + 0.0001).toFixed(6), lng: +(stnLng + 0.0001).toFixed(6), accessible: false, icon: '🪜' };

  const fobBridge = { id: `NODE_${station.code}_FOB_BRIDGE`, floor_id: 2, name: 'Central Foot Over Bridge (FOB)', type: 'CORRIDOR', x: 400, y: 260, lat: +(stnLat + 0.0002).toFixed(6), lng: +stnLng.toFixed(6), accessible: true, icon: '🌉' };
  const liftF1 = { id: `NODE_${station.code}_LIFT_F1`, floor_id: 2, name: 'Elevator Lift L-1 (FOB Landing)', type: 'LIFT', x: 340, y: 260, lat: +(stnLat + 0.0002).toFixed(6), lng: +(stnLng - 0.0001).toFixed(6), accessible: true, icon: '🛗' };
  const stairsF1 = { id: `NODE_${station.code}_STAIRS_F1`, floor_id: 2, name: 'Middle FOB Stair Landing', type: 'STAIRS', x: 460, y: 260, lat: +(stnLat + 0.0002).toFixed(6), lng: +(stnLng + 0.0001).toFixed(6), accessible: false, icon: '🪜' };

  nodes.push(entryEast, entryWest, concourse, ticketOffice, restroom, foodStall, liftF0, stairsF0, fobBridge, liftF1, stairsF1);

  qrLocations.push(
    { id: 1, code: `QR_${station.code}_EAST`, node_id: entryEast.id, description: `${station.name} - East Booking Office Entrance` },
    { id: 2, code: `QR_${station.code}_WEST`, node_id: entryWest.id, description: `${station.name} - West Main Gate` },
    { id: 3, code: `QR_${station.code}_CONCOURSE`, node_id: concourse.id, description: 'Central Indicator & Timetable Board' },
    { id: 4, code: `QR_${station.code}_RESTROOM`, node_id: restroom.id, description: 'Near Accessible Restroom Complex' }
  );

  facilities.push(
    { id: 1, name: 'UTS / Automatic Ticket Vending Machines', type: 'TICKET_COUNTER', node_id: ticketOffice.id, floor: 0, accessible: true },
    { id: 2, name: 'Accessible Restroom & Drinking Water', type: 'RESTROOM', node_id: restroom.id, floor: 0, accessible: true },
    { id: 3, name: 'Aahar Tea & Snacks Stall', type: 'FOOD_COURT', node_id: foodStall.id, floor: 0, accessible: true }
  );

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
    { from_node_id: liftF0.id, to_node_id: liftF1.id, distance: 12, estimated_time: 18, accessible: true, blocked: false },
    { from_node_id: liftF1.id, to_node_id: liftF0.id, distance: 12, estimated_time: 18, accessible: true, blocked: false },
    { from_node_id: stairsF0.id, to_node_id: stairsF1.id, distance: 15, estimated_time: 20, accessible: false, blocked: false },
    { from_node_id: stairsF1.id, to_node_id: stairsF0.id, distance: 15, estimated_time: 20, accessible: false, blocked: false },
    { from_node_id: liftF1.id, to_node_id: fobBridge.id, distance: 10, estimated_time: 8, accessible: true, blocked: false },
    { from_node_id: fobBridge.id, to_node_id: liftF1.id, distance: 10, estimated_time: 8, accessible: true, blocked: false },
    { from_node_id: stairsF1.id, to_node_id: fobBridge.id, distance: 10, estimated_time: 8, accessible: false, blocked: false },
    { from_node_id: fobBridge.id, to_node_id: stairsF1.id, distance: 10, estimated_time: 8, accessible: false, blocked: false }
  );

  const startX = 140;
  const endX = 680;
  const stepX = (endX - startX) / Math.max(1, numPlatforms - 1);
  const lngSpan = 0.0008;
  const stepLng = numPlatforms > 1 ? lngSpan / (numPlatforms - 1) : 0;

  for (let p = 1; p <= numPlatforms; p++) {
    const xPos = Math.round(startX + (p - 1) * stepX);
    const isFloor0 = p <= Math.ceil(numPlatforms / 2);
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

    if (isFloor0) {
      const distToConcourse = Math.abs(xPos - 400) + 40;
      edges.push(
        { from_node_id: concourse.id, to_node_id: pltNode.id, distance: distToConcourse, estimated_time: Math.round(distToConcourse * 0.8), accessible: true, blocked: false },
        { from_node_id: pltNode.id, to_node_id: concourse.id, distance: distToConcourse, estimated_time: Math.round(distToConcourse * 0.8), accessible: true, blocked: false }
      );
    }
  }

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

  const graph = new ClientStationGraph(nodes, edges);

  return {
    station,
    nodes,
    edges,
    qrLocations,
    facilities,
    graph
  };
}

export function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371e3;
  const rad = Math.PI / 180;
  const phi1 = lat1 * rad;
  const phi2 = lat2 * rad;
  const deltaPhi = (lat2 - lat1) * rad;
  const deltaLambda = (lon2 - lon1) * rad;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function calculateBearing(lat1, lng1, lat2, lng2) {
  if (lat1 === undefined || lng1 === undefined || lat2 === undefined || lng2 === undefined) return 0;
  const rad = Math.PI / 180;
  const phi1 = lat1 * rad;
  const phi2 = lat2 * rad;
  const deltaLambda = (lng2 - lng1) * rad;
  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);
  return ((theta * 180 / Math.PI) + 360) % 360;
}

export function bearingToCardinal(deg) {
  const directions = ['North (N)', 'North-East (NE)', 'East (E)', 'South-East (SE)', 'South (S)', 'South-West (SW)', 'West (W)', 'North-West (NW)'];
  const index = Math.round(((deg % 360) / 45)) % 8;
  return directions[index];
}

export function findNearestStation(userLat, userLng) {
  let nearest = CLIENT_CENTRAL_LINE_STATIONS[0];
  let minDistance = Infinity;

  CLIENT_CENTRAL_LINE_STATIONS.forEach(stn => {
    const dist = haversineDistanceMeters(userLat, userLng, stn.lat, stn.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = stn;
    }
  });

  return {
    ...nearest,
    station: nearest,
    id: nearest.id,
    code: nearest.code,
    name: nearest.name,
    distanceMeters: Math.round(minDistance)
  };
}

function clientHeuristic(nodeA, nodeB) {
  if (!nodeA || !nodeB) return 0;
  const dx = (nodeA.x || 0) - (nodeB.x || 0);
  const dy = (nodeA.y || 0) - (nodeB.y || 0);
  const horizontalDist = Math.sqrt(dx * dx + dy * dy);
  const floorDiff = Math.abs((nodeA.floor_id || 1) - (nodeB.floor_id || 1));
  return horizontalDist + floorDiff * 60;
}

export function calculateClientAStarRoute(graph, startNodeId, destinationNodeId, routeType = 'NORMAL') {
  if (!graph || !startNodeId || !destinationNodeId) {
    return { success: false, error: 'Start and destination nodes are required.' };
  }

  if (startNodeId === destinationNodeId) {
    const node = graph.getNode(startNodeId);
    return {
      success: true,
      distance: 0,
      estimatedTime: 0,
      route: [node],
      instructions: ['You are already at your destination.'],
      maneuvers: [{
        stepIndex: 1,
        instruction: 'You have arrived at your destination.',
        type: 'ARRIVE',
        icon: '🏁',
        distance: 0,
        estimatedTime: 0,
        bearing: 0,
        fromNode: node,
        toNode: node
      }],
      routeType,
      accessibilityStatus: true
    };
  }

  const startNode = graph.getNode(startNodeId);
  const destNode = graph.getNode(destinationNodeId);

  if (!startNode || !destNode) {
    return { success: false, error: 'Invalid start or destination waypoint specified.' };
  }

  const queue = [{ item: startNodeId, priority: 0 }];
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();

  graph.getAllNodes().forEach(n => {
    gScore.set(n.id, Infinity);
    fScore.set(n.id, Infinity);
  });

  gScore.set(startNodeId, 0);
  fScore.set(startNodeId, clientHeuristic(startNode, destNode));

  const visited = new Set();

  while (queue.length > 0) {
    queue.sort((a, b) => a.priority - b.priority);
    const currentId = queue.shift().item;

    if (currentId === destinationNodeId) {
      const pathNodes = [];
      const pathEdges = [];
      let curr = currentId;
      while (cameFrom.has(curr)) {
        const step = cameFrom.get(curr);
        pathNodes.unshift(graph.getNode(curr));
        pathEdges.unshift(step.edge);
        curr = step.from;
      }
      pathNodes.unshift(graph.getNode(curr));

      let totalDist = 0;
      let totalTime = 0;
      pathEdges.forEach(e => {
        totalDist += e.distance;
        totalTime += e.estimated_time;
      });

      // Generate structured maneuvers with directional bearings
      const maneuvers = [];
      const instructions = [];

      for (let i = 0; i < pathEdges.length; i++) {
        const fromNode = pathNodes[i];
        const toNode = pathNodes[i + 1];
        const edge = pathEdges[i];

        const bearing = Math.round(calculateBearing(fromNode.lat, fromNode.lng, toNode.lat, toNode.lng));
        const cardinal = bearingToCardinal(bearing);

        let type = 'STRAIGHT';
        let icon = '⬆️';
        let turnText = `Head ${cardinal} for ${edge.distance}m toward ${toNode.name}`;

        if (fromNode.isRealGps) {
          type = 'GPS_START';
          icon = '📍';
          turnText = `Start from your Live GPS Location: Walk ${edge.distance}m ${cardinal} to ${toNode.name}`;
        } else if (toNode.type === 'LIFT') {
          type = 'LIFT';
          icon = '🛗';
          turnText = `Take ${toNode.name} to change levels (${edge.distance}m)`;
        } else if (toNode.type === 'STAIRS') {
          type = 'STAIRS';
          icon = '🪜';
          turnText = `Take stairs via ${toNode.name} (${edge.distance}m)`;
        } else if (toNode.type === 'PLATFORM') {
          type = 'PLATFORM';
          icon = '🚆';
          turnText = `Boarding Deck: Arrive at ${toNode.name} (${edge.distance}m)`;
        } else if (i > 0) {
          const prevNode = pathNodes[i - 1];
          const prevBearing = Math.round(calculateBearing(prevNode.lat, prevNode.lng, fromNode.lat, fromNode.lng));
          let diff = bearing - prevBearing;
          while (diff < -180) diff += 360;
          while (diff > 180) diff -= 360;

          if (diff > 25 && diff <= 70) {
            type = 'SLIGHT_RIGHT';
            icon = '↗️';
            turnText = `Bear slightly right toward ${toNode.name} (${edge.distance}m)`;
          } else if (diff > 70 && diff <= 120) {
            type = 'TURN_RIGHT';
            icon = '➡️';
            turnText = `Turn right onto ${toNode.name} (${edge.distance}m)`;
          } else if (diff > 120 && diff < 160) {
            type = 'SHARP_RIGHT';
            icon = '↪️';
            turnText = `Sharp right toward ${toNode.name} (${edge.distance}m)`;
          } else if (diff < -25 && diff >= -70) {
            type = 'SLIGHT_LEFT';
            icon = '↖️';
            turnText = `Bear slightly left toward ${toNode.name} (${edge.distance}m)`;
          } else if (diff < -70 && diff >= -120) {
            type = 'TURN_LEFT';
            icon = '⬅️';
            turnText = `Turn left onto ${toNode.name} (${edge.distance}m)`;
          } else if (diff < -120 && diff > -160) {
            type = 'SHARP_LEFT';
            icon = '↩️';
            turnText = `Sharp left toward ${toNode.name} (${edge.distance}m)`;
          } else if (Math.abs(diff) >= 160) {
            type = 'U_TURN';
            icon = '🔄';
            turnText = `Turn around toward ${toNode.name} (${edge.distance}m)`;
          } else {
            type = 'STRAIGHT';
            icon = '⬆️';
            turnText = `Walk straight ${edge.distance}m toward ${toNode.name}`;
          }
        }

        maneuvers.push({
          stepIndex: i + 1,
          instruction: turnText,
          type,
          icon,
          distance: edge.distance,
          estimatedTime: edge.estimated_time,
          bearing,
          cardinal,
          fromNode,
          toNode
        });

        instructions.push(turnText);
      }

      // Final destination arrival
      const finalNode = pathNodes[pathNodes.length - 1];
      maneuvers.push({
        stepIndex: maneuvers.length + 1,
        instruction: `Arrive at destination: ${finalNode.name}.`,
        type: 'ARRIVE',
        icon: '🏁',
        distance: 0,
        estimatedTime: 0,
        bearing: maneuvers[maneuvers.length - 1]?.bearing || 0,
        cardinal: maneuvers[maneuvers.length - 1]?.cardinal || 'N',
        fromNode: finalNode,
        toNode: finalNode
      });
      instructions.push(`Arrive at destination: ${finalNode.name}.`);

      return {
        success: true,
        distance: totalDist,
        estimatedTime: totalTime,
        route: pathNodes,
        instructions,
        maneuvers,
        routeType,
        accessibilityStatus: routeType === 'ACCESSIBLE' ? true : pathNodes.every(n => n.accessible)
      };
    }

    visited.add(currentId);

    for (const edge of graph.getOutgoingEdges(currentId)) {
      if (edge.blocked) continue;
      if (routeType === 'ACCESSIBLE' && (!edge.accessible || !graph.getNode(edge.to_node_id)?.accessible)) {
        continue;
      }

      let cost = routeType === 'FASTEST' ? edge.estimated_time : edge.distance;
      const neighbor = graph.getNode(edge.to_node_id);
      if (routeType === 'ACCESSIBLE' && neighbor?.type === 'LIFT') {
        cost *= 0.7;
      }

      const tentativeG = gScore.get(currentId) + cost;
      if (tentativeG < gScore.get(edge.to_node_id)) {
        cameFrom.set(edge.to_node_id, { from: currentId, edge });
        gScore.set(edge.to_node_id, tentativeG);
        const h = clientHeuristic(neighbor, destNode);
        fScore.set(edge.to_node_id, tentativeG + h);

        if (!visited.has(edge.to_node_id)) {
          queue.push({ item: edge.to_node_id, priority: tentativeG + h });
        }
      }
    }
  }

  return { success: false, error: 'No available route found.' };
}
