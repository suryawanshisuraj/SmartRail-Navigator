/**
 * SmartRail Navigator - OpenStreetMap Overpass API Service
 * Queries real geographic railway infrastructure, platforms, and verified amenities from OSM.
 * Implements strict caching (in-memory + localStorage) to prevent overloading public OSM servers.
 */

// In-memory runtime cache
const memoryCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours TTL

/**
 * Generate a cache key from coordinates
 */
function getCacheKey(lat, lng) {
  return `SR_OSM_${Number(lat).toFixed(4)}_${Number(lng).toFixed(4)}`;
}

/**
 * Retrieve cached OSM data if available and fresh
 */
function getFromCache(key) {
  // 1. Check memory cache
  const mem = memoryCache.get(key);
  if (mem && (Date.now() - mem.timestamp < CACHE_TTL_MS)) {
    return mem.data;
  }

  // 2. Check localStorage if in browser
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          memoryCache.set(key, parsed);
          return parsed.data;
        }
      }
    } catch (e) {
      // Ignore storage errors
    }
  }

  return null;
}

/**
 * Save data to memory and localStorage cache
 */
function saveToCache(key, data) {
  const record = {
    timestamp: Date.now(),
    data
  };
  memoryCache.set(key, record);

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(key, JSON.stringify(record));
    } catch (e) {
      // Storage quota or disabled, ignore
    }
  }
}

/**
 * Query real OpenStreetMap infrastructure around a station dynamically
 * @param {number} lat - Station latitude
 * @param {number} lng - Station longitude
 * @param {number} radius - Search radius in meters (default: 450m)
 */
export async function fetchStationOSMFeatures(lat, lng, radius = 450) {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return { success: false, elements: [], error: 'Invalid coordinates' };
  }

  const cacheKey = getCacheKey(lat, lng);
  const cached = getFromCache(cacheKey);
  if (cached) {
    return { success: true, fromCache: true, ...cached };
  }

  // Dynamic Overpass QL query strictly bounded by station coordinates
  const query = `[out:json][timeout:10];
(
  node["railway"~"station|platform|subway_entrance|halt"](around:${radius},${lat},${lng});
  way["railway"~"station|platform"](around:${radius},${lat},${lng});
  node["amenity"~"toilets|restaurant|cafe|drinking_water"](around:${radius},${lat},${lng});
  node["highway"~"steps|elevator"](around:${radius},${lat},${lng});
);
out center 30;`;

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SmartRail-Navigator/1.0 (https://smart-rail-navigator-cpik.vercel.app)'
      }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const elements = data.elements || [];

      // Categorize verified real elements
      const platforms = [];
      const amenities = [];
      const entrances = [];

      elements.forEach(el => {
        const itemLat = el.lat || el.center?.lat;
        const itemLng = el.lon || el.center?.lon;
        if (!itemLat || !itemLng) return;

        const tags = el.tags || {};
        if (tags.railway === 'platform') {
          platforms.push({
            id: `OSM_PLAT_${el.id}`,
            name: tags.name || tags.ref ? `Platform ${tags.ref}` : 'Railway Platform',
            ref: tags.ref || null,
            lat: itemLat,
            lng: itemLng,
            osmId: el.id
          });
        } else if (tags.railway === 'subway_entrance' || tags.entrance) {
          entrances.push({
            id: `OSM_ENT_${el.id}`,
            name: tags.name || (tags.ref ? `Gate ${tags.ref}` : 'Station Entrance'),
            lat: itemLat,
            lng: itemLng,
            osmId: el.id
          });
        } else if (tags.amenity) {
          amenities.push({
            id: `OSM_AMEN_${el.id}`,
            type: tags.amenity,
            name: tags.name || (tags.amenity === 'toilets' ? 'Public Restroom' : tags.amenity === 'drinking_water' ? 'Drinking Water' : 'Food Facility'),
            lat: itemLat,
            lng: itemLng,
            osmId: el.id
          });
        }
      });

      const resultPayload = {
        totalElements: elements.length,
        platforms,
        amenities,
        entrances,
        timestamp: new Date().toISOString()
      };

      saveToCache(cacheKey, resultPayload);
      return { success: true, fromCache: false, ...resultPayload };
    } else if (res.status === 429) {
      console.warn('[OSM Overpass] Rate limit encountered, using verified local fallback.');
      return { success: false, rateLimited: true, error: 'OSM Overpass rate limit reached' };
    }
  } catch (err) {
    console.warn('[OSM Overpass] Query failed or timed out:', err.message);
  }

  return { success: false, elements: [], error: 'OSM Overpass unreachable' };
}
