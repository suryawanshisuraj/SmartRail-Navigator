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
 * High-fidelity fallback that follows Mumbai road corridors (Vashi Bridge / Eastern Freeway / Highways)
 * instead of cutting across the ocean when offline or router timeout.
 */
function generateMumbaiCorridorFallback(startLat, startLng, endLat, endLng, isWalking) {
  const directDist = haversineDistanceMeters(startLat, startLng, endLat, endLng);
  
  if (isWalking || directDist < 2500) {
    const midLat = startLat + (endLat - startLat) * 0.5;
    const coords = [
      [startLng, startLat],
      [startLng, midLat],
      [endLng, midLat],
      [endLng, endLat]
    ];
    const distance = Math.round(directDist * 1.25);
    const duration = Math.round(distance * 0.85);
    const bearing = Math.round(calculateBearing(startLat, startLng, midLat, startLng));
    return {
      success: true,
      distance,
      duration,
      coordinates: coords,
      maneuvers: [
        {
          stepIndex: 1,
          instruction: `Walk along Station Approach Road toward entrance gate (${distance}m)`,
          type: 'ROAD_WALK',
          icon: '🚶',
          distance,
          bearing,
          cardinal: bearingToCardinal(bearing)
        }
      ],
      isRoadRoute: true,
      mode: 'WALK'
    };
  }

  // Regional distance (> 2.5 km)
  let coords = [];
  if (startLng > 72.95 && endLng < 72.86) {
    // Navi Mumbai to South Mumbai corridor via Vashi Bridge & Eastern Freeway
    coords = [
      [startLng, startLat],
      [73.0200, 19.0350], // Palm Beach Marg
      [72.9980, 19.0580], // Sion-Panvel Highway
      [72.9770, 19.0680], // Vashi Bridge over Thane Creek
      [72.9320, 19.0520], // Mankhurd Flyover
      [72.8900, 19.0400], // Eastern Freeway Entry (Chembur)
      [72.8680, 19.0050], // Eastern Freeway Elevated Corridor (Wadala)
      [72.8420, 18.9480], // Eastern Freeway Exit (P. D'Mello Road)
      [endLng, endLat]    // CSMT East Gate
    ];
  } else if (startLat > 19.18 && endLat < 19.05) {
    // Thane / Beyond Thane to Central / South Mumbai via Eastern Express Highway
    coords = [
      [startLng, startLat],
      [72.9750, 19.1850],
      [72.9560, 19.1720],
      [72.9290, 19.1110],
      [72.8850, 19.0650],
      [72.8650, 19.0150],
      [72.8420, 18.9480],
      [endLng, endLat]
    ];
  } else {
    const midLng = (startLng + endLng) / 2;
    const midLat = (startLat + endLat) / 2;
    coords = [
      [startLng, startLat],
      [midLng, startLat],
      [midLng, endLat],
      [endLng, endLat]
    ];
  }

  let totalDist = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    totalDist += haversineDistanceMeters(coords[i][1], coords[i][0], coords[i + 1][1], coords[i + 1][0]);
  }
  totalDist = Math.round(totalDist * 1.15);
  const duration = Math.round(totalDist / 18); // ~65 km/h driving speed

  const startBearing = Math.round(calculateBearing(startLat, startLng, coords[1][1], coords[1][0]));
  const maneuvers = [
    {
      stepIndex: 1,
      instruction: `Head onto arterial road corridor towards highway (${(totalDist / 1000).toFixed(1)} km)`,
      type: 'ROAD_DRIVE',
      icon: '🚗',
      distance: totalDist,
      bearing: startBearing,
      cardinal: bearingToCardinal(startBearing)
    }
  ];

  return {
    success: true,
    distance: totalDist,
    duration,
    coordinates: coords,
    maneuvers,
    isRoadRoute: true,
    mode: 'DRIVE'
  };
}

/**
 * Fetch real street/highway route between GPS coordinate and station gate
 * Uses public OSRM router (walking for < 2.5km, driving for >= 2.5km)
 * with robust high-fidelity Mumbai transit corridor fallback.
 */
export async function fetchRealRoadRoute(startLat, startLng, endLat, endLng) {
  const distDirect = haversineDistanceMeters(startLat, startLng, endLat, endLng);
  const isWalking = distDirect < 2500;
  const profile = isWalking ? 'walking' : 'driving';
  const url = `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&steps=true&overview=full`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const primary = data.routes[0];
        const coordinates = primary.geometry.coordinates; // Array of [lng, lat]
        const steps = primary.legs[0]?.steps || [];

        const maneuvers = [];
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          if (step.distance > 8) {
            const maneuverType = step.maneuver?.type || 'turn';
            const modifier = step.maneuver?.modifier || '';
            const roadName = step.name || (isWalking ? 'Walkway' : 'Road Corridor');
            const icon = isWalking ? '🚶' : '🚗';
            const distRounded = Math.round(step.distance);
            const distText = distRounded >= 1000 ? `${(distRounded / 1000).toFixed(1)} km` : `${distRounded}m`;
            
            let instruction = '';
            if (maneuverType === 'depart') {
              instruction = `Depart on ${roadName} towards station (${distText})`;
            } else if (maneuverType === 'arrive') {
              instruction = `Arrive at station entrance gate`;
            } else {
              const action = modifier ? `Turn ${modifier} onto ${roadName}` : `Continue on ${roadName}`;
              instruction = `${action} (${distText})`;
            }

            maneuvers.push({
              stepIndex: maneuvers.length + 1,
              instruction,
              type: isWalking ? 'ROAD_WALK' : 'ROAD_DRIVE',
              icon,
              distance: distRounded,
              roadName,
              bearing: Math.round(step.maneuver?.bearing_after || 0),
              cardinal: bearingToCardinal(Math.round(step.maneuver?.bearing_after || 0))
            });
          }
        }

        if (maneuvers.length === 0) {
          maneuvers.push({
            stepIndex: 1,
            instruction: `Head on road toward station gate (${(primary.distance / 1000).toFixed(1)} km)`,
            type: isWalking ? 'ROAD_WALK' : 'ROAD_DRIVE',
            icon: isWalking ? '🚶' : '🚗',
            distance: Math.round(primary.distance),
            bearing: Math.round(calculateBearing(startLat, startLng, endLat, endLng)),
            cardinal: bearingToCardinal(Math.round(calculateBearing(startLat, startLng, endLat, endLng)))
          });
        }

        return {
          success: true,
          distance: Math.round(primary.distance),
          duration: Math.round(primary.duration),
          coordinates,
          maneuvers,
          isRoadRoute: true,
          mode: isWalking ? 'WALK' : 'DRIVE'
        };
      }
    }
  } catch (e) {
    console.warn('[Transit] OSRM query timed out or unreachable, using corridor fallback:', e);
  }

  return generateMumbaiCorridorFallback(startLat, startLng, endLat, endLng, isWalking);
}

/**
 * Calculate route between start and destination with real GPS support
 */
export async function computeIndoorRoute(startNodeId, destinationNodeId, routeType = 'NORMAL', stationId = 1, customGpsNode = null) {
  // If routing from live GPS node, construct real road + indoor routing
  if (customGpsNode && customGpsNode.isRealGps) {
    const layout = getClientStationLayout(stationId);
    const nodesCopy = [...layout.nodes];

    // Find closest entrance or concourse node to user's real coordinates
    const entranceNodes = nodesCopy.filter(n => n.type === 'ENTRANCE' || n.type === 'CORRIDOR');
    let nearestEntrance = entranceNodes[0] || nodesCopy[0];
    let minDistance = Infinity;

    entranceNodes.forEach(n => {
      const dist = haversineDistanceMeters(customGpsNode.lat, customGpsNode.lng, n.lat, n.lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearestEntrance = n;
      }
    });

    // 1. Fetch real road route from GPS position to station entrance
    const roadRoute = await fetchRealRoadRoute(
      customGpsNode.lat,
      customGpsNode.lng,
      nearestEntrance.lat,
      nearestEntrance.lng
    );

    // 2. Compute indoor route from entrance to destination platform/amenity
    const indoorRes = calculateClientAStarRoute(layout.graph, nearestEntrance.id, destinationNodeId, routeType);

    // 3. Build synthetic road waypoint nodes along the real road path
    const coords = roadRoute.coordinates || [];
    const step = coords.length > 80 ? Math.ceil(coords.length / 50) : 1;
    const roadWaypoints = [];
    
    for (let i = 0; i < coords.length; i += step) {
      const pt = coords[i];
      roadWaypoints.push({
        id: `ROAD_WAYPOINT_${i}`,
        name: `Road Corridor Waypoint (${i + 1})`,
        floor_id: 1,
        lat: pt[1],
        lng: pt[0],
        accessible: true,
        isRoad: true
      });
    }

    if (roadWaypoints.length > 0) {
      roadWaypoints[0] = { ...customGpsNode, floor_id: 1 };
    }

    // Connect indoor route nodes (skip duplicate entrance if present)
    const indoorNodes = (indoorRes.route || []).filter(n => n.id !== nearestEntrance.id);
    const combinedRouteNodes = [
      ...roadWaypoints,
      nearestEntrance,
      ...indoorNodes
    ];

    // Combine maneuvers
    const combinedManeuvers = [
      ...roadRoute.maneuvers,
      {
        stepIndex: roadRoute.maneuvers.length + 1,
        instruction: `Enter station via ${nearestEntrance.name}`,
        type: 'GATE_ENTRY',
        icon: '🚪',
        distance: 20,
        bearing: Math.round(calculateBearing(nearestEntrance.lat, nearestEntrance.lng, (indoorNodes[0]?.lat || nearestEntrance.lat), (indoorNodes[0]?.lng || nearestEntrance.lng))),
        cardinal: bearingToCardinal(Math.round(calculateBearing(nearestEntrance.lat, nearestEntrance.lng, (indoorNodes[0]?.lat || nearestEntrance.lat), (indoorNodes[0]?.lng || nearestEntrance.lng))))
      },
      ...(indoorRes.maneuvers || []).map((m, i) => ({
        ...m,
        stepIndex: roadRoute.maneuvers.length + 2 + i
      }))
    ];

    combinedManeuvers.forEach((m, idx) => {
      m.stepIndex = idx + 1;
    });

    const totalDistance = roadRoute.distance + (indoorRes.distance || 0);
    const totalTime = roadRoute.duration + (indoorRes.estimatedTime || 0);

    return {
      success: true,
      distance: totalDistance,
      estimatedTime: totalTime,
      route: combinedRouteNodes,
      instructions: combinedManeuvers.map(m => m.instruction),
      maneuvers: combinedManeuvers,
      routeType,
      isRoadRoute: true,
      isLongDistance: roadRoute.distance > 2500,
      roadDistanceKm: +(roadRoute.distance / 1000).toFixed(1),
      roadDurationMinutes: Math.round(roadRoute.duration / 60),
      accessibilityStatus: routeType === 'ACCESSIBLE' ? true : combinedRouteNodes.every(n => n.accessible)
    };
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

/**
 * Plan journey routes between departure and destination stations
 */
export async function searchRoute(origin, destination, options = {}) {
  try {
    const res = await fetch(`${API_BASE}/routes/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, options })
    });
    if (!res.ok) throw new Error('API search failed');
    return await res.json();
  } catch (err) {
    // Client fallback using Mumbai Central Line stations
    const originStn = CLIENT_CENTRAL_LINE_STATIONS.find(s =>
      s.id === Number(origin) || s.code === String(origin).toUpperCase() || s.name.toLowerCase().includes(String(origin).toLowerCase())
    ) || CLIENT_CENTRAL_LINE_STATIONS[0];

    const destStn = CLIENT_CENTRAL_LINE_STATIONS.find(s =>
      s.id === Number(destination) || s.code === String(destination).toUpperCase() || s.name.toLowerCase().includes(String(destination).toLowerCase())
    ) || CLIENT_CENTRAL_LINE_STATIONS[CLIENT_CENTRAL_LINE_STATIONS.length - 1];

    if (originStn.id === destStn.id) {
      return { success: false, error: 'Departure and destination stations must be different.' };
    }

    const originIdx = CLIENT_CENTRAL_LINE_STATIONS.findIndex(s => s.id === originStn.id);
    const destIdx = CLIENT_CENTRAL_LINE_STATIONS.findIndex(s => s.id === destStn.id);
    const numStops = Math.abs(destIdx - originIdx);
    const distanceKm = Math.max(2, numStops * 2.3);
    const isFast = options.preference === 'fastest' && numStops > 5;
    const durationMinutes = Math.round(isFast ? numStops * 1.8 + 4 : numStops * 2.6 + 2);

    const direction = destIdx > originIdx ? 'Down (towards Kalyan)' : 'Up (towards CSMT)';
    const trainType = isFast ? 'Fast Suburban Local' : 'All-Stops Slow Local';

    let estimatedFare = 5.0;
    if (distanceKm > 10 && distanceKm <= 20) estimatedFare = 10.0;
    else if (distanceKm > 20 && distanceKm <= 35) estimatedFare = 15.0;
    else if (distanceKm > 35 && distanceKm <= 50) estimatedFare = 20.0;
    else if (distanceKm > 50) estimatedFare = 25.0;

    const intermediateStations = [];
    const step = destIdx > originIdx ? 1 : -1;
    for (let i = originIdx + step; i !== destIdx; i += step) {
      intermediateStations.push(CLIENT_CENTRAL_LINE_STATIONS[i]);
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

    return {
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
    };
  }
}

/**
 * Dynamic Fare Tariff Calculator
 */
export async function calculateFareTariff(distanceKm = 10, travelClass = 'STANDARD', isOffPeak = false) {
  try {
    const res = await fetch(`${API_BASE}/fare/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distanceKm, travelClass, isOffPeak })
    });
    if (!res.ok) throw new Error('API fare failed');
    return await res.json();
  } catch (err) {
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

    return {
      success: true,
      fareSummary: {
        basePrice,
        distanceCharge,
        discountApplied,
        tax,
        totalFare
      }
    };
  }
}
