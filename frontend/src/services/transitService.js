/**
 * Client Transit & Indoor Navigation Service - Mumbai Central Line
 * Supports all 26 stations from CSMT to Kalyan with local graph fallback.
 */

import {
  CLIENT_CENTRAL_LINE_STATIONS,
  getClientStationLayout,
  calculateClientAStarRoute
} from './clientTransitFallback.js';

const API_BASE = '/api';

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

export async function computeIndoorRoute(startNodeId, destinationNodeId, routeType = 'NORMAL', stationId = 1) {
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
        reply: `${destNode.name} at ${layout.station.name} is ${route.distance} meters away (~${Math.ceil(route.estimatedTime / 60)} minutes walk). Follow the highlighted route on your station map.`,
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
