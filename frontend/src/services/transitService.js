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
import {
  REAL_INDIAN_STATIONS,
  searchRealStations,
  getRealStationByIdOrCode
} from '../data/realIndianStations.js';

export {
  CLIENT_CENTRAL_LINE_STATIONS,
  REAL_INDIAN_STATIONS,
  searchRealStations,
  getRealStationByIdOrCode,
  haversineDistanceMeters,
  findNearestStation,
  calculateBearing,
  bearingToCardinal
};

const API_BASE = '/api';

/**
 * Fetch list of all stations (Real Indian Railway Stations)
 */
export async function fetchStationList() {
  try {
    const res = await fetch(`${API_BASE}/stations`);
    if (!res.ok) throw new Error('API failed');
    const json = await res.json();
    return json.data || json;
  } catch (err) {
    console.warn('[transitService] Backend unavailable, using real Indian stations database:', err);
    return REAL_INDIAN_STATIONS;
  }
}

/**
 * Real Indian railway station search (exact, partial, case-insensitive)
 */
export async function searchStations(query) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return [];
  }
  try {
    const res = await fetch(`${API_BASE}/stations/search?q=${encodeURIComponent(query.trim())}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {
    // Backend unreachable, use client search
  }
  return searchRealStations(query);
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
 * Fetch real pedestrian walking route using real geographic data and walking routing engines
 * (OpenStreetMap Routed-Foot / OSRM Foot Profile).
 * STRICT: Zero synthetic polyline interpolation, zero straight lines across tracks, zero hardcoded geometry.
 * If routing fails or no pedestrian path exists, returns success: false with 'No pedestrian route available.'
 */
export async function fetchRealPedestrianRoute(startLat, startLng, endLat, endLng) {
  if (
    startLat === undefined || startLng === undefined || endLat === undefined || endLng === undefined ||
    isNaN(Number(startLat)) || isNaN(Number(startLng)) || isNaN(Number(endLat)) || isNaN(Number(endLng))
  ) {
    return {
      success: false,
      error: 'Invalid coordinates provided for pedestrian route.',
      coordinates: [],
      maneuvers: [],
      distance: 0,
      duration: 0
    };
  }

  const sLat = Number(startLat);
  const sLng = Number(startLng);
  const dLat = Number(endLat);
  const dLng = Number(endLng);

  const endpoints = [
    `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${sLng},${sLat};${dLng},${dLat}?overview=full&geometries=geojson&steps=true`,
    `https://router.project-osrm.org/route/v1/foot/${sLng},${sLat};${dLng},${dLat}?overview=full&geometries=geojson&steps=true`,
    `https://router.project-osrm.org/route/v1/walking/${sLng},${sLat};${dLng},${dLat}?overview=full&geometries=geojson&steps=true`
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json', 'User-Agent': 'SmartRail-Navigator/1.0' }
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const primary = data.routes[0];
          const rawCoords = primary.geometry?.coordinates || [];
          // Standardize to Leaflet [lat, lng] format
          const coordinates = rawCoords.map(pt => [pt[1], pt[0]]);
          const steps = primary.legs?.[0]?.steps || [];

          const maneuvers = [];
          for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const maneuverType = step.maneuver?.type || 'turn';
            const modifier = step.maneuver?.modifier ? step.maneuver.modifier.replace(/_/g, ' ') : '';
            const roadName = step.name || 'Pedestrian Walkway';
            const distRounded = Math.round(step.distance);
            const distText = distRounded >= 1000 ? `${(distRounded / 1000).toFixed(1)} km` : `${distRounded}m`;

            let instruction = '';
            if (maneuverType === 'depart') {
              instruction = `Depart on ${roadName} toward station entrance (${distText})`;
            } else if (maneuverType === 'arrive') {
              instruction = `Arrive at station entrance / destination`;
            } else if (modifier) {
              instruction = `Turn ${modifier} onto ${roadName} (${distText})`;
            } else {
              instruction = `Continue along ${roadName} (${distText})`;
            }

            const stepBearing = Math.round(step.maneuver?.bearing_after || 0);

            maneuvers.push({
              stepIndex: maneuvers.length + 1,
              instruction,
              type: 'PEDESTRIAN_WALK',
              icon: '🚶',
              distance: distRounded,
              roadName,
              bearing: stepBearing,
              cardinal: bearingToCardinal(stepBearing),
              location: step.maneuver?.location ? [step.maneuver.location[1], step.maneuver.location[0]] : null
            });
          }

          if (maneuvers.length === 0 && steps.length === 0) {
            maneuvers.push({
              stepIndex: 1,
              instruction: `Walk along pedestrian path to station entrance (${Math.round(primary.distance)}m)`,
              type: 'PEDESTRIAN_WALK',
              icon: '🚶',
              distance: Math.round(primary.distance),
              roadName: 'Station Walkway',
              bearing: Math.round(calculateBearing(sLat, sLng, dLat, dLng)),
              cardinal: bearingToCardinal(Math.round(calculateBearing(sLat, sLng, dLat, dLng)))
            });
          }

          const totalDistance = Math.round(primary.distance);
          const totalDuration = Math.round(primary.duration);

          return {
            success: true,
            distance: totalDistance,
            duration: totalDuration,
            distanceKm: +(totalDistance / 1000).toFixed(2),
            durationMinutes: Math.max(1, Math.round(totalDuration / 60)),
            coordinates,
            maneuvers,
            instructions: maneuvers.map(m => m.instruction),
            engine: url.includes('openstreetmap.de') ? 'OpenStreetMap Foot Router' : 'OSRM Foot Engine',
            isPedestrianRoute: true
          };
        }
      }
    } catch (e) {
      // Try next routing endpoint
    }
  }

  // Strictly no straight line fallback!
  return {
    success: false,
    error: 'No pedestrian route available.',
    coordinates: [],
    maneuvers: [],
    instructions: [],
    distance: 0,
    duration: 0
  };
}

export const fetchRealRoadRoute = fetchRealPedestrianRoute;

/**
 * Calculate route between start and destination with real GPS support
 */
export async function computeIndoorRoute(startNodeId, destinationNodeId, routeType = 'NORMAL', stationId = 1, customGpsNode = null) {
  // If routing from live GPS node, construct real pedestrian road + verified entrance routing
  if (customGpsNode && customGpsNode.isRealGps) {
    const layout = getClientStationLayout(stationId);
    const stationObj = getRealStationByIdOrCode(stationId) || layout.station;
    const nodesCopy = [...layout.nodes];

    // Find closest verified entrance node to user's real coordinates
    const entranceNodes = nodesCopy.filter(n => n.type === 'ENTRANCE' || n.type === 'CORRIDOR');
    let nearestEntrance = entranceNodes[0] || nodesCopy[0];
    let minDistance = Infinity;

    // Check station.entrances if available
    if (stationObj?.entrances && stationObj.entrances.length > 0) {
      stationObj.entrances.forEach(ent => {
        const dist = haversineDistanceMeters(customGpsNode.lat, customGpsNode.lng, ent.lat, ent.lng);
        if (dist < minDistance) {
          minDistance = dist;
          const matched = nodesCopy.find(n => n.lat === ent.lat && n.lng === ent.lng) ||
                          nodesCopy.find(n => n.type === 'ENTRANCE');
          if (matched) nearestEntrance = matched;
        }
      });
    } else {
      entranceNodes.forEach(n => {
        const dist = haversineDistanceMeters(customGpsNode.lat, customGpsNode.lng, n.lat, n.lng);
        if (dist < minDistance) {
          minDistance = dist;
          nearestEntrance = n;
        }
      });
    }

    // 1. Fetch real pedestrian route from GPS position to station entrance
    const pedRoute = await fetchRealPedestrianRoute(
      customGpsNode.lat,
      customGpsNode.lng,
      nearestEntrance.lat,
      nearestEntrance.lng
    );

    if (!pedRoute || !pedRoute.success) {
      return {
        success: false,
        error: 'No pedestrian route available.',
        distance: 0,
        estimatedTime: 0,
        route: [],
        maneuvers: [],
        instructions: ['No pedestrian route available. Please choose a starting location with safe pedestrian access to the station.']
      };
    }

    // Convert real pedestrian coordinates into route waypoints along actual OSM footpaths/roads
    const coords = pedRoute.coordinates || [];
    const step = coords.length > 60 ? Math.ceil(coords.length / 40) : 1;
    const roadWaypoints = [];

    for (let i = 0; i < coords.length; i += step) {
      const pt = coords[i];
      roadWaypoints.push({
        id: `PED_WAYPOINT_${i}`,
        name: `Pedestrian Path (${i + 1})`,
        floor_id: 1,
        lat: pt[0],
        lng: pt[1],
        accessible: true,
        isPedestrianPath: true
      });
    }

    if (roadWaypoints.length > 0) {
      roadWaypoints[0] = { ...customGpsNode, floor_id: 1 };
    }

    // Check if indoor mapping is available for this station (Level 1 vs Level 2)
    const hasIndoorMap = stationObj?.hasIndoorMap !== false;

    if (!hasIndoorMap) {
      // LEVEL 1: Outdoor geographic navigation only
      const outdoorRouteNodes = [
        ...roadWaypoints,
        nearestEntrance
      ];

      const outdoorManeuvers = [
        ...pedRoute.maneuvers,
        {
          stepIndex: pedRoute.maneuvers.length + 1,
          instruction: `Arrive at verified station entrance: ${nearestEntrance.name}`,
          type: 'ARRIVE',
          icon: '🏁',
          distance: 0,
          bearing: 0,
          cardinal: 'N'
        }
      ];

      return {
        success: true,
        level: 1,
        hasIndoorMap: false,
        indoorNotice: 'Detailed indoor map data is not available for this station. Navigating to verified station entrance.',
        distance: pedRoute.distance,
        estimatedTime: pedRoute.duration,
        route: outdoorRouteNodes,
        instructions: outdoorManeuvers.map(m => m.instruction),
        maneuvers: outdoorManeuvers,
        routeType,
        isPedestrianRoute: true,
        roadDistanceKm: pedRoute.distanceKm,
        roadDurationMinutes: pedRoute.durationMinutes,
        accessibilityStatus: routeType === 'ACCESSIBLE' ? true : outdoorRouteNodes.every(n => n.accessible)
      };
    }

    // LEVEL 2: Indoor navigation linked to entrance
    const indoorRes = calculateClientAStarRoute(layout.graph, nearestEntrance.id, destinationNodeId, routeType);
    const indoorNodes = (indoorRes.route || []).filter(n => n.id !== nearestEntrance.id);
    const combinedRouteNodes = [
      ...roadWaypoints,
      nearestEntrance,
      ...indoorNodes
    ];

    const combinedManeuvers = [
      ...pedRoute.maneuvers,
      {
        stepIndex: pedRoute.maneuvers.length + 1,
        instruction: `Enter station via ${nearestEntrance.name}`,
        type: 'GATE_ENTRY',
        icon: '🚪',
        distance: 20,
        bearing: Math.round(calculateBearing(nearestEntrance.lat, nearestEntrance.lng, (indoorNodes[0]?.lat || nearestEntrance.lat), (indoorNodes[0]?.lng || nearestEntrance.lng))),
        cardinal: bearingToCardinal(Math.round(calculateBearing(nearestEntrance.lat, nearestEntrance.lng, (indoorNodes[0]?.lat || nearestEntrance.lat), (indoorNodes[0]?.lng || nearestEntrance.lng))))
      },
      ...(indoorRes.maneuvers || []).map((m, i) => ({
        ...m,
        stepIndex: pedRoute.maneuvers.length + 2 + i
      }))
    ];

    combinedManeuvers.forEach((m, idx) => {
      m.stepIndex = idx + 1;
    });

    const totalDistance = pedRoute.distance + (indoorRes.distance || 0);
    const totalTime = pedRoute.duration + (indoorRes.estimatedTime || 0);

    return {
      success: true,
      level: 2,
      hasIndoorMap: true,
      distance: totalDistance,
      estimatedTime: totalTime,
      route: combinedRouteNodes,
      instructions: combinedManeuvers.map(m => m.instruction),
      maneuvers: combinedManeuvers,
      routeType,
      isPedestrianRoute: true,
      roadDistanceKm: pedRoute.distanceKm,
      roadDurationMinutes: pedRoute.durationMinutes,
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
