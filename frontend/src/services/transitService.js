/**
 * Client Transit & Indoor Navigation Service - Mumbai Central Line
 * Supports all 26 stations from CSMT to Kalyan with local graph fallback
 * and real-time GPS device location integration.
 */

import {
  CLIENT_CENTRAL_LINE_STATIONS,
  getClientStationLayout,
  calculateClientAStarRoute,
  haversineDistanceMeters,
  findNearestStation,
  calculateBearing,
  bearingToCardinal,
  ClientStationGraph
} from './clientTransitFallback.js';

export {
  CLIENT_CENTRAL_LINE_STATIONS,
  haversineDistanceMeters,
  findNearestStation,
  calculateBearing,
  bearingToCardinal
};

const API_BASE = '/api';

/**
 * Fetch list of all stations
 */
export async function fetchStationList() {
  try {
    const res = await fetch(`${API_BASE}/stations`);
    if (!res.ok) throw new Error('API failed');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.warn('[transitService] Backend unavailable, using local Central Line stations:', err);
    return CLIENT_CENTRAL_LINE_STATIONS;
  }
}

/**
 * Fetch full layout and graph for a station
 */
export async function fetchStationData(stationId = 1) {
  try {
    const res = await fetch(`${API_BASE}/stations/${stationId}`);
    if (!res.ok) throw new Error('API failed');
    const json = await res.json();
    return json.data;
  } catch (err) {
    const layout = getClientStationLayout(stationId);
    return {
      ...layout.station,
      nodes: layout.nodes,
      edges: layout.edges,
      qrLocations: layout.qrLocations,
      facilities: layout.facilities
    };
  }
}

/**
 * Request real GPS position from browser Geolocation API
 * Uses high accuracy first, falling back to network/standard accuracy if GPS times out
 */
export async function getLiveGPSPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    const tryStandardAccuracy = () => {
      navigator.geolocation.getCurrentPosition(
        pos => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy || 25),
            heading: pos.coords.heading || 0,
            speed: pos.coords.speed || 0,
            timestamp: pos.timestamp
          });
        },
        err => {
          let msg = 'Failed to retrieve location.';
          if (err.code === 1) msg = 'Location permission was denied. Please allow location access in your browser settings.';
          else if (err.code === 2) msg = 'Location position unavailable. Please ensure GPS/location services are enabled.';
          else if (err.code === 3) msg = 'Location request timed out. Please try again.';
          reject(new Error(msg));
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
      );
    };

    navigator.geolocation.getCurrentPosition(
      pos => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 10),
          heading: pos.coords.heading || 0,
          speed: pos.coords.speed || 0,
          timestamp: pos.timestamp
        });
      },
      err => {
        if (err.code === 3 || err.code === 2) {
          // High-accuracy GPS hardware timed out; fall back to standard/emulated provider
          tryStandardAccuracy();
        } else {
          let msg = 'Location permission was denied. Please allow location access in your browser settings.';
          reject(new Error(msg));
        }
      },
      { enableHighAccuracy: true, timeout: 3500, maximumAge: 10000 }
    );
  });
}

/**
 * Resolve QR scan code
 */
export async function scanQRCode(code, stationId = 1) {
  try {
    const res = await fetch(`${API_BASE}/navigation/qr-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, stationId })
    });
    if (!res.ok) throw new Error('QR scan error');
    return await res.json();
  } catch (err) {
    const layout = getClientStationLayout(stationId);
    const qr = layout.qrLocations.find(q => q.code.toUpperCase() === code.toUpperCase());
    if (qr) {
      const node = layout.nodes.find(n => n.id === qr.node_id);
      return {
        success: true,
        qrCode: qr.code,
        description: qr.description,
        currentNode: node
      };
    }
    return { success: false, error: 'QR Code not found in station database.' };
  }
}

/**
 * Calculate route between start and destination with real GPS support
 */
export async function computeIndoorRoute(startNodeId, destinationNodeId, routeType = 'NORMAL', stationId = 1, customGpsNode = null) {
  // If routing from live GPS node, construct dynamic routing on the client
  if (customGpsNode && customGpsNode.isRealGps) {
    const layout = getClientStationLayout(stationId);
    const nodesCopy = [...layout.nodes];
    const edgesCopy = [...layout.edges];

    // Find closest entrance or concourse node to user's real coordinates
    const entranceNodes = nodesCopy.filter(n => n.type === 'ENTRANCE' || n.type === 'CORRIDOR');
    let nearestNode = entranceNodes[0] || nodesCopy[0];
    let minDistance = Infinity;

    entranceNodes.forEach(n => {
      const dist = haversineDistanceMeters(customGpsNode.lat, customGpsNode.lng, n.lat, n.lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearestNode = n;
      }
    });

    const walkDist = Math.max(15, minDistance);
    const walkTime = Math.round(walkDist * 0.85);

    const resolvedGpsNode = {
      ...customGpsNode,
      x: customGpsNode.x !== undefined ? customGpsNode.x : (nearestNode.x || 80),
      y: customGpsNode.y !== undefined ? customGpsNode.y : (nearestNode.y || 480)
    };

    // Insert live GPS node and connect directly to nearest entrance
    nodesCopy.unshift(resolvedGpsNode);
    edgesCopy.unshift(
      { from_node_id: resolvedGpsNode.id, to_node_id: nearestNode.id, distance: walkDist, estimated_time: walkTime, accessible: true, blocked: false },
      { from_node_id: nearestNode.id, to_node_id: resolvedGpsNode.id, distance: walkDist, estimated_time: walkTime, accessible: true, blocked: false }
    );

    const dynamicGraph = new ClientStationGraph(nodesCopy, edgesCopy);
    return calculateClientAStarRoute(dynamicGraph, resolvedGpsNode.id, destinationNodeId, routeType);
  }

  // Standard backend routing with fallback
  try {
    const res = await fetch(`${API_BASE}/navigation/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stationId, startNodeId, destinationNodeId, routeType })
    });
    if (!res.ok) throw new Error('Routing calculation failed');
    return await res.json();
  } catch (err) {
    const layout = getClientStationLayout(stationId);
    return calculateClientAStarRoute(layout.graph, startNodeId, destinationNodeId, routeType);
  }
}

/**
 * AI Assistant Chat
 */
export async function askAIAssistant(message, startNodeId, accessibleMode = false, stationId = 1) {
  try {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, startNodeId, accessibleMode, stationId })
    });
    if (!res.ok) throw new Error('AI API error');
    return await res.json();
  } catch (err) {
    const layout = getClientStationLayout(stationId);
    const lower = message.toLowerCase();

    const platformMatch = lower.match(/platform\s*([0-9]+)/i);
    let targetNodeId = null;

    if (platformMatch) {
      const platNum = platformMatch[1];
      const targetPlat = layout.nodes.find(n => n.type === 'PLATFORM' && n.platformNumber === platNum);
      if (targetPlat) targetNodeId = targetPlat.id;
    } else if (lower.includes('restroom') || lower.includes('washroom') || lower.includes('toilet')) {
      targetNodeId = layout.nodes.find(n => n.type === 'RESTROOM')?.id;
    } else if (lower.includes('food') || lower.includes('tea') || lower.includes('snacks')) {
      targetNodeId = layout.nodes.find(n => n.type === 'FOOD_COURT')?.id;
    } else if (lower.includes('ticket') || lower.includes('booking')) {
      targetNodeId = layout.nodes.find(n => n.type === 'TICKET_COUNTER')?.id;
    } else if (lower.includes('western') && layout.station.id === 8) {
      targetNodeId = 'NODE_DR_WESTERN_INTERCHANGE';
    } else if (lower.includes('metro') && layout.station.id === 13) {
      targetNodeId = 'NODE_GC_METRO_INTERCHANGE';
    }

    if (targetNodeId) {
      const originId = startNodeId || layout.nodes[0].id;
      const route = calculateClientAStarRoute(layout.graph, originId, targetNodeId, accessibleMode ? 'ACCESSIBLE' : 'NORMAL');
      const destNode = layout.nodes.find(n => n.id === targetNodeId);

      return {
        success: true,
        reply: `${destNode.name} at ${layout.station.name} is ${route.distance} meters away (~${Math.ceil(route.estimatedTime / 60)} minutes walk). ${route.instructions[1] || 'Follow the highlighted route on your station map.'}`,
        destinationNodeId: targetNodeId,
        route
      };
    }

    return {
      success: true,
      reply: `I can help you navigate to any of the ${layout.station.totalPlatforms} platforms, ticket booking office, restrooms, or FOB lifts at ${layout.station.name}. Which platform or facility do you need?`
    };
  }
}
