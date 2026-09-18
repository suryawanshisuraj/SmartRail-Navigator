/**
 * SmartRail Navigator - OpenStreetMap Overpass API Service (Backend)
 * Queries real geographic railway infrastructure, platforms, and verified amenities from OSM.
 * Implements strict caching to prevent overloading public OSM servers.
 */

const memoryCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours TTL

function getCacheKey(lat, lng) {
  return `SR_OSM_${Number(lat).toFixed(4)}_${Number(lng).toFixed(4)}`;
}

export async function fetchStationOSMFeatures(lat, lng, radius = 450) {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return { success: false, elements: [], error: 'Invalid coordinates' };
  }

  const cacheKey = getCacheKey(lat, lng);
  const cached = memoryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return { success: true, fromCache: true, ...cached.data };
  }

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
            name: tags.name || (tags.ref ? `Platform ${tags.ref}` : 'Railway Platform'),
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

      memoryCache.set(cacheKey, { timestamp: Date.now(), data: resultPayload });
      return { success: true, fromCache: false, ...resultPayload };
    }
  } catch (err) {
    console.warn('[OSM Overpass Backend] Query failed or timed out:', err.message);
  }

  return { success: false, elements: [], error: 'OSM Overpass unreachable' };
}
