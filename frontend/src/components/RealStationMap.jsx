import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  Layers,
  Crosshair,
  MapPin,
  Train,
  Footprints,
  ArrowUpRight,
  Compass,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Navigation,
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  CheckCircle2,
  LocateFixed,
  Play,
  Pause,
  RotateCcw,
  Volume2
} from 'lucide-react';
import { calculateBearing, bearingToCardinal } from '../services/clientTransitFallback';

export default function RealStationMap({
  station,
  nodes = [],
  currentLocationNode,
  destinationNode,
  calculatedRoute,
  accessibleMode,
  onNodeClick,
  realGpsPosition,
  onDetectRealLocation,
  isGpsActive,
  isGpsLoading
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const baseLayersRef = useRef({});
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const arrowsLayerRef = useRef(null);
  const railwayOverlayRef = useRef(null);

  const [activeBaseLayer, setActiveBaseLayer] = useState('roads');
  const [showRailOverlay, setShowRailOverlay] = useState(true);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isSimulatingWalk, setIsSimulatingWalk] = useState(false);

  // Extract or generate structured maneuvers from the calculated route
  const maneuvers = useMemo(() => {
    if (!calculatedRoute || !calculatedRoute.route || calculatedRoute.route.length < 2) {
      return [];
    }
    if (calculatedRoute.maneuvers && calculatedRoute.maneuvers.length > 0) {
      return calculatedRoute.maneuvers;
    }

    const pathNodes = calculatedRoute.route;
    const generated = [];

    for (let i = 0; i < pathNodes.length - 1; i++) {
      const from = pathNodes[i];
      const to = pathNodes[i + 1];
      const bearing = Math.round(calculateBearing(from.lat, from.lng, to.lat, to.lng));
      const cardinal = bearingToCardinal(bearing);

      let type = 'STRAIGHT';
      let icon = '⬆️';
      let instruction = `Head ${cardinal} toward ${to.name}`;

      if (from.isRealGps) {
        type = 'GPS_START';
        icon = '📍';
        instruction = `Start from Real GPS Location: Walk ${cardinal} to ${to.name}`;
      } else if (to.type === 'LIFT') {
        type = 'LIFT';
        icon = '🛗';
        instruction = `Take ${to.name} to change levels`;
      } else if (to.type === 'STAIRS') {
        type = 'STAIRS';
        icon = '🪜';
        instruction = `Take stairs via ${to.name}`;
      } else if (to.type === 'PLATFORM') {
        type = 'PLATFORM';
        icon = '🚆';
        instruction = `Arrive at ${to.name} boarding deck`;
      } else if (i > 0) {
        const prev = pathNodes[i - 1];
        const prevBearing = Math.round(calculateBearing(prev.lat, prev.lng, from.lat, from.lng));
        let diff = bearing - prevBearing;
        while (diff < -180) diff += 360;
        while (diff > 180) diff -= 360;

        if (diff > 25 && diff <= 70) {
          type = 'SLIGHT_RIGHT';
          icon = '↗️';
          instruction = `Bear slightly right toward ${to.name}`;
        } else if (diff > 70 && diff <= 120) {
          type = 'TURN_RIGHT';
          icon = '➡️';
          instruction = `Turn right onto ${to.name}`;
        } else if (diff > 120 && diff < 160) {
          type = 'SHARP_RIGHT';
          icon = '↪️';
          instruction = `Sharp right toward ${to.name}`;
        } else if (diff < -25 && diff >= -70) {
          type = 'SLIGHT_LEFT';
          icon = '↖️';
          instruction = `Bear slightly left toward ${to.name}`;
        } else if (diff < -70 && diff >= -120) {
          type = 'TURN_LEFT';
          icon = '⬅️';
          instruction = `Turn left onto ${to.name}`;
        } else if (diff < -120 && diff > -160) {
          type = 'SHARP_LEFT';
          icon = '↩️';
          instruction = `Sharp left toward ${to.name}`;
        } else if (Math.abs(diff) >= 160) {
          type = 'U_TURN';
          icon = '🔄';
          instruction = `Turn around toward ${to.name}`;
        }
      }

      generated.push({
        stepIndex: i + 1,
        instruction,
        type,
        icon,
        bearing,
        cardinal,
        fromNode: from,
        toNode: to
      });
    }

    const finalNode = pathNodes[pathNodes.length - 1];
    generated.push({
      stepIndex: pathNodes.length,
      instruction: `Arrive at destination: ${finalNode.name}`,
      type: 'ARRIVE',
      icon: '🏁',
      bearing: generated[generated.length - 1]?.bearing || 0,
      cardinal: generated[generated.length - 1]?.cardinal || 'N',
      fromNode: finalNode,
      toNode: finalNode
    });

    return generated;
  }, [calculatedRoute]);

  // Reset active step index when route changes
  useEffect(() => {
    setActiveStepIndex(0);
    setIsSimulatingWalk(false);
  }, [calculatedRoute?.route?.length, destinationNode?.id]);

  // Simulation timer for walk
  useEffect(() => {
    if (!isSimulatingWalk || maneuvers.length <= 1) return;

    const interval = setInterval(() => {
      setActiveStepIndex(prev => {
        if (prev >= maneuvers.length - 1) {
          setIsSimulatingWalk(false);
          return prev;
        }
        const next = prev + 1;
        panToStep(next);
        return next;
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [isSimulatingWalk, maneuvers.length]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = currentLocationNode?.lat || station?.lat || 18.9400;
    const initialLng = currentLocationNode?.lng || station?.lng || 72.8354;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 17,
      minZoom: 12,
      maxZoom: 19,
      zoomControl: false
    });

    // 1. Google Maps style Street & Road tiles (CartoDB Voyager)
    const roadsLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    });

    // 2. Real Aerial Satellite View
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri'
    });

    // 3. OpenStreetMap
    const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    });

    // 4. OpenRailwayMap tracks overlay
    const railOverlay = L.tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', {
      maxZoom: 19,
      opacity: 0.6,
      attribution: 'Map data: &copy; OpenRailwayMap'
    });

    roadsLayer.addTo(map);
    railOverlay.addTo(map);

    baseLayersRef.current = {
      roads: roadsLayer,
      satellite: satelliteLayer,
      osm: osmLayer
    };
    railwayOverlayRef.current = railOverlay;

    routeLayerRef.current = L.layerGroup().addTo(map);
    arrowsLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      if (mapContainerRef.current) {
        mapContainerRef.current._leaflet_id = null;
      }
    };
  }, []);

  // Update map center when station changes
  useEffect(() => {
    if (!mapInstanceRef.current || !station) return;
    const lat = station.lat || 18.9400;
    const lng = station.lng || 72.8354;
    mapInstanceRef.current.flyTo([lat, lng], 17, {
      duration: 1.0,
      easeLinearity: 0.25
    });
  }, [station?.id]);

  // Switch Base Layer
  const handleSwitchBaseLayer = (layerKey) => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    Object.values(baseLayersRef.current).forEach(l => {
      if (map.hasLayer(l)) map.removeLayer(l);
    });

    if (baseLayersRef.current[layerKey]) {
      baseLayersRef.current[layerKey].addTo(map);
    }
    setActiveBaseLayer(layerKey);

    if (showRailOverlay && railwayOverlayRef.current) {
      railwayOverlayRef.current.bringToFront();
    }
  };

  // Toggle Railway tracks overlay
  const handleToggleRailOverlay = () => {
    if (!mapInstanceRef.current || !railwayOverlayRef.current) return;
    const map = mapInstanceRef.current;
    if (showRailOverlay) {
      if (map.hasLayer(railwayOverlayRef.current)) {
        map.removeLayer(railwayOverlayRef.current);
      }
      setShowRailOverlay(false);
    } else {
      if (!map.hasLayer(railwayOverlayRef.current)) {
        railwayOverlayRef.current.addTo(map);
      }
      setShowRailOverlay(true);
    }
  };

  // Render Google Maps style pins, GPS blue dot, and platform markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    // Collect all nodes to render, ensuring dynamic GPS start node is included
    const allRenderNodes = [...nodes];
    if (currentLocationNode && !allRenderNodes.some(n => n.id === currentLocationNode.id)) {
      allRenderNodes.unshift(currentLocationNode);
    }

    // Determine heading angle from current location towards the first step
    let headingAngle = 0;
    if (calculatedRoute?.route && calculatedRoute.route.length > 1) {
      const p1 = calculatedRoute.route[0];
      const p2 = calculatedRoute.route[1];
      if (p1.lat && p1.lng && p2.lat && p2.lng) {
        headingAngle = Math.round(calculateBearing(p1.lat, p1.lng, p2.lat, p2.lng));
      }
    }

    allRenderNodes.forEach(node => {
      if (!node.lat || !node.lng) return;

      const isCurrent = currentLocationNode?.id === node.id;
      const isDest = destinationNode?.id === node.id;

      if (node.type === 'CORRIDOR' && !isCurrent && !isDest && !node.name.includes('Central Station')) {
        return;
      }

      let badgeHtml = '';

      if (isCurrent) {
        // Draw accuracy circle for real GPS
        if (node.isRealGps || isGpsActive) {
          L.circle([node.lat, node.lng], {
            radius: node.accuracy || 25,
            color: '#1a73e8',
            fillColor: '#1a73e8',
            fillOpacity: 0.12,
            weight: 1.5,
            dashArray: '4, 4'
          }).addTo(markersLayerRef.current);
        }

        // Live blue location dot with directional flashlight heading cone
        badgeHtml = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
            <div style="position: absolute; width: 56px; height: 56px; transform: rotate(${headingAngle}deg); pointer-events: none; z-index: 1;">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <path d="M28 28 L14 4 A 28 28 0 0 1 42 4 Z" fill="url(#blueHeadingBeam)" opacity="0.7" />
                <defs>
                  <linearGradient id="blueHeadingBeam" x1="28" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#1a73e8" stop-opacity="0.85" />
                    <stop offset="1" stop-color="#1a73e8" stop-opacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(26, 115, 232, 0.3); animation: gmapPulse 2s infinite; z-index: 2;"></div>
            <div style="width: 20px; height: 20px; border-radius: 50%; background: #1a73e8; border: 3px solid #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.4); z-index: 3;"></div>
            ${node.isRealGps ? `
              <div style="position: absolute; bottom: -18px; background: #0284c7; color: white; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 6px; white-space: nowrap; z-index: 4; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
                LIVE GPS
              </div>
            ` : ''}
          </div>
        `;
      } else if (isDest) {
        badgeHtml = `
          <div style="position: relative; -webkit-transform: translate(-50%, -100%); transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center;">
            <svg width="34" height="44" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));">
              <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26c0-8.837-7.163-16-16-16z" fill="#ea4335"/>
              <circle cx="16" cy="16" r="6.5" fill="#ffffff"/>
            </svg>
            <div style="margin-top: -6px; background: #ea4335; color: white; font-weight: 800; font-size: 11px; padding: 2px 7px; border-radius: 10px; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.25); display: flex; align-items: center; gap: 3px;">
              <span>🏁</span> ${node.name}
            </div>
          </div>
        `;
      } else if (node.type === 'PLATFORM') {
        badgeHtml = `
          <div style="background: #ffffff; border: 2px solid #1a73e8; color: #1a73e8; font-weight: 800; font-size: 11px; padding: 3px 8px; border-radius: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); white-space: nowrap; display: flex; align-items: center; gap: 4px; cursor: pointer;">
            <span>🚆</span> P${node.platformNumber}
          </div>
        `;
      } else if (node.type === 'ENTRANCE') {
        badgeHtml = `
          <div style="background: #ffffff; border: 1.5px solid #475569; color: #1e293b; font-weight: 700; font-size: 10px; padding: 2px 7px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); white-space: nowrap; display: flex; align-items: center; gap: 3px;">
            🚪 ${node.name.includes('East') ? 'East Gate' : 'West Gate'}
          </div>
        `;
      } else if (node.type === 'LIFT') {
        badgeHtml = `
          <div style="background: #ecfdf5; border: 1.5px solid #059669; color: #047857; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); white-space: nowrap;">
            ♿ Lift L-1
          </div>
        `;
      } else {
        badgeHtml = `
          <div style="background: #ffffff; border: 1px solid #cbd5e1; color: #475569; font-weight: 600; font-size: 9px; padding: 2px 6px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); white-space: nowrap;">
            ${node.icon || '📍'} ${node.name}
          </div>
        `;
      }

      const customIcon = L.divIcon({
        className: 'google-maps-pin-wrapper',
        html: badgeHtml,
        iconSize: isCurrent ? [44, 44] : isDest ? [34, 44] : [30, 30],
        iconAnchor: isCurrent ? [22, 22] : isDest ? [17, 44] : [15, 15]
      });

      const marker = L.marker([node.lat, node.lng], { icon: customIcon });

      marker.bindPopup(`
        <div style="font-size: 13px; line-height: 1.4; padding: 3px;">
          <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 3px;">
            <span style="font-size: 15px;">${node.icon || '📍'}</span>
            <strong style="color: #1a73e8; font-size: 13px;">${node.name}</strong>
          </div>
          <div style="color: #64748b; font-size: 11px; margin-bottom: 8px;">
            ${station?.name || 'Mumbai Central Line'}
          </div>
          <button id="popup-nav-${node.id}" style="background: #1a73e8; color: white; border: none; padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 5px rgba(26, 115, 232, 0.3);">
            <span>Directions to Here</span>
          </button>
        </div>
      `);

      marker.on('popupopen', (e) => {
        const popupEl = e.popup?.getElement();
        const btn = popupEl?.querySelector(`#popup-nav-${node.id}`);
        if (btn) {
          btn.onclick = (event) => {
            event.stopPropagation();
            if (onNodeClick) onNodeClick(node);
            marker.closePopup();
          };
        }
      });

      marker.on('click', () => {
        if (onNodeClick) onNodeClick(node);
      });

      marker.addTo(markersLayerRef.current);
    });
  }, [nodes, currentLocationNode?.id, destinationNode?.id, station?.id, calculatedRoute, isGpsActive]);

  // Render Real Walking Navigation Route with Directional Chevrons
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayerRef.current || !arrowsLayerRef.current) return;

    routeLayerRef.current.clearLayers();
    arrowsLayerRef.current.clearLayers();

    if (calculatedRoute && calculatedRoute.route && calculatedRoute.route.length > 1) {
      const validNodes = calculatedRoute.route.filter(n => n.lat && n.lng);
      const latlngs = validNodes.map(n => [n.lat, n.lng]);

      if (latlngs.length > 1) {
        // Casing glow
        const casing = L.polyline(latlngs, {
          color: '#ffffff',
          weight: 10,
          opacity: 0.95,
          lineJoin: 'round',
          lineCap: 'round'
        });

        // Main Route line
        const routeColor = accessibleMode ? '#059669' : '#1a73e8';
        const mainRoute = L.polyline(latlngs, {
          color: routeColor,
          weight: 6,
          opacity: 1,
          dashArray: '3, 9',
          lineJoin: 'round',
          lineCap: 'round'
        });

        casing.addTo(routeLayerRef.current);
        mainRoute.addTo(routeLayerRef.current);

        // Directional Chevrons along each walking segment
        for (let i = 0; i < validNodes.length - 1; i++) {
          const from = validNodes[i];
          const to = validNodes[i + 1];
          const midLat = (from.lat + to.lat) / 2;
          const midLng = (from.lng + to.lng) / 2;
          const bearing = Math.round(calculateBearing(from.lat, from.lng, to.lat, to.lng));

          const arrowIcon = L.divIcon({
            className: 'route-dir-arrow',
            html: `
              <div style="transform: rotate(${bearing}deg); width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; pointer-events: none;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="${routeColor}" stroke="#ffffff" stroke-width="1.5" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
                  <path d="M5 3l14 9-14 9V3z"/>
                </svg>
              </div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });

          L.marker([midLat, midLng], { icon: arrowIcon, interactive: false }).addTo(arrowsLayerRef.current);
        }

        // Waypoint step badges
        validNodes.forEach((n, idx) => {
          if (idx === 0 || idx === validNodes.length - 1) return;
          const isActiveStep = activeStepIndex === idx;

          const stepIcon = L.divIcon({
            className: 'waypoint-step-badge',
            html: `
              <div style="
                width: ${isActiveStep ? '28px' : '22px'};
                height: ${isActiveStep ? '28px' : '22px'};
                border-radius: 50%;
                background: ${isActiveStep ? '#f59e0b' : '#ffffff'};
                border: 2px solid ${isActiveStep ? '#ffffff' : routeColor};
                color: ${isActiveStep ? '#ffffff' : routeColor};
                font-weight: 800;
                font-size: ${isActiveStep ? '11px' : '9px'};
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 6px rgba(0,0,0,0.25);
                cursor: pointer;
                transition: all 0.2s ease;
              ">
                ${idx}
              </div>
            `,
            iconSize: isActiveStep ? [28, 28] : [22, 22],
            iconAnchor: isActiveStep ? [14, 14] : [11, 11]
          });

          const stepMarker = L.marker([n.lat, n.lng], { icon: stepIcon });
          stepMarker.on('click', () => setActiveStepIndex(idx));
          stepMarker.addTo(arrowsLayerRef.current);
        });

        // Fit map bounds
        const bounds = L.latLngBounds(latlngs);
        mapInstanceRef.current.fitBounds(bounds, {
          padding: [75, 75],
          maxZoom: 18,
          animate: true
        });
      }
    }
  }, [calculatedRoute, accessibleMode, activeStepIndex]);

  // Step Navigation Handlers
  const handlePrevStep = () => {
    if (activeStepIndex > 0) {
      const newIdx = activeStepIndex - 1;
      setActiveStepIndex(newIdx);
      panToStep(newIdx);
    }
  };

  const handleNextStep = () => {
    if (activeStepIndex < maneuvers.length - 1) {
      const newIdx = activeStepIndex + 1;
      setActiveStepIndex(newIdx);
      panToStep(newIdx);
    }
  };

  const panToStep = (idx) => {
    if (!mapInstanceRef.current || !calculatedRoute?.route) return;
    const targetNode = calculatedRoute.route[idx];
    if (targetNode?.lat && targetNode?.lng) {
      mapInstanceRef.current.flyTo([targetNode.lat, targetNode.lng], 18, {
        duration: 0.6
      });
    }
  };

  const handleFitFullRoute = () => {
    if (!mapInstanceRef.current || !calculatedRoute?.route) return;
    const latlngs = calculatedRoute.route.filter(n => n.lat && n.lng).map(n => [n.lat, n.lng]);
    if (latlngs.length > 1) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(latlngs), {
        padding: [75, 75],
        maxZoom: 18,
        animate: true
      });
    }
  };

  const handleRecenterStation = () => {
    if (!mapInstanceRef.current) return;
    const targetLat = currentLocationNode?.lat || station?.lat || 18.9400;
    const targetLng = currentLocationNode?.lng || station?.lng || 72.8354;
    mapInstanceRef.current.flyTo([targetLat, targetLng], 17, {
      duration: 0.8
    });
  };

  const activeManeuver = maneuvers[activeStepIndex] || maneuvers[0];

  return (
    <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
      {/* Top Header & Layer Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span className="badge badge-cyan" style={{ background: '#e8f0fe', color: '#1a73e8', border: '1px solid #c2e7ff' }}>
              {station?.code || 'CSMT'}
            </span>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              {station?.name || 'Chhatrapati Shivaji Maharaj Terminus'}
            </h2>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.1rem' }}>
            {isGpsActive ? '📍 Real GPS Mode Active &bull; Turn directions & compass headings synced' : 'Live Google Maps walking navigation showing turn directions and platform tracks'}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          {onDetectRealLocation && (
            <button
              type="button"
              onClick={onDetectRealLocation}
              disabled={isGpsLoading}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: isGpsActive ? '1px solid #0284c7' : '1px solid #cbd5e1',
                background: isGpsActive ? '#f0f9ff' : '#ffffff',
                color: isGpsActive ? '#0284c7' : '#334155',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
              title="Detect real device GPS position"
            >
              <LocateFixed size={13} />
              <span>{isGpsLoading ? 'Locating...' : isGpsActive ? 'GPS Locked 🟢' : 'Locate Me'}</span>
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#f8fafc', padding: '0.2rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={() => handleSwitchBaseLayer('roads')}
              style={{
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: activeBaseLayer === 'roads' ? '1px solid #1a73e8' : '1px solid transparent',
                background: activeBaseLayer === 'roads' ? '#ffffff' : 'transparent',
                color: activeBaseLayer === 'roads' ? '#1a73e8' : '#475569',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🗺️ Roads
            </button>

            <button
              type="button"
              onClick={() => handleSwitchBaseLayer('satellite')}
              style={{
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: activeBaseLayer === 'satellite' ? '1px solid #1a73e8' : '1px solid transparent',
                background: activeBaseLayer === 'satellite' ? '#ffffff' : 'transparent',
                color: activeBaseLayer === 'satellite' ? '#1a73e8' : '#475569',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🛰️ Satellite
            </button>

            <button
              type="button"
              onClick={handleToggleRailOverlay}
              style={{
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: showRailOverlay ? '1px solid #1a73e8' : '1px solid transparent',
                background: showRailOverlay ? '#ffffff' : 'transparent',
                color: showRailOverlay ? '#1a73e8' : '#475569',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}
            >
              <Train size={12} />
              <span>Tracks</span>
            </button>

            <button
              type="button"
              onClick={handleRecenterStation}
              style={{
                padding: '0.3rem 0.55rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid transparent',
                background: 'transparent',
                color: '#1a73e8',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}
              title="Recenter map"
            >
              <Crosshair size={12} />
              <span>Center</span>
            </button>
          </div>
        </div>
      </div>

      {/* Map Container with Floating Google Maps Live Turn-by-Turn HUD */}
      <div style={{ position: 'relative', width: '100%', height: '540px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
        <div
          ref={mapContainerRef}
          style={{ width: '100%', height: '100%', background: '#e5e3df' }}
        />

        {/* Floating Google Maps Live Turn-by-Turn Navigation HUD Card */}
        {calculatedRoute && calculatedRoute.success && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 20,
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(12px)',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.16)',
            maxWidth: '440px',
            width: 'calc(100% - 24px)',
            overflow: 'hidden'
          }}>
            {/* Top Navigation Banner */}
            <div style={{
              background: accessibleMode ? '#047857' : '#1a73e8',
              color: '#ffffff',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0
                }}>
                  {activeManeuver?.icon || '⬆️'}
                </div>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.01em', lineHeight: '1.25' }}>
                    {activeManeuver?.instruction || `Head to ${destinationNode?.name}`}
                  </div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                    <span>🧭 Heading {activeManeuver?.bearing || 0}° {activeManeuver?.cardinal || ''}</span>
                    {activeManeuver?.distance > 0 && (
                      <>
                        <span>&bull;</span>
                        <span>{activeManeuver.distance}m</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFitFullRoute}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  padding: '0.35rem 0.6rem',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  flexShrink: 0
                }}
                title="Fit full route in view"
              >
                <Compass size={13} />
                <span>Overview</span>
              </button>
            </div>

            {/* Bottom Controls & Step Progression Carousel */}
            <div style={{ padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', background: '#ffffff', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Footprints size={15} color="#1a73e8" />
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                  {Math.ceil(calculatedRoute.estimatedTime / 60)} min
                </span>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  ({calculatedRoute.distance} m)
                </span>
              </div>

              {/* Step Navigation & Live Walk Simulator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {maneuvers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setIsSimulatingWalk(!isSimulatingWalk)}
                    style={{
                      padding: '0.25rem 0.55rem',
                      borderRadius: '6px',
                      border: isSimulatingWalk ? '1px solid #16a34a' : '1px solid #cbd5e1',
                      background: isSimulatingWalk ? '#dcfce7' : '#f8fafc',
                      color: isSimulatingWalk ? '#15803d' : '#334155',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                    title={isSimulatingWalk ? 'Pause live walk simulation' : 'Simulate walking along route'}
                  >
                    {isSimulatingWalk ? <Pause size={12} /> : <Play size={12} />}
                    <span>{isSimulatingWalk ? 'Simulating' : 'Start Walk'}</span>
                  </button>
                )}

                {maneuvers.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      disabled={activeStepIndex === 0}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: activeStepIndex === 0 ? '#f1f5f9' : '#ffffff',
                        color: activeStepIndex === 0 ? '#94a3b8' : '#0f172a',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: activeStepIndex === 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <ChevronLeft size={13} />
                    </button>

                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569' }}>
                      {activeStepIndex + 1}/{maneuvers.length}
                    </span>

                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={activeStepIndex === maneuvers.length - 1}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: activeStepIndex === maneuvers.length - 1 ? '#f1f5f9' : '#ffffff',
                        color: activeStepIndex === maneuvers.length - 1 ? '#94a3b8' : '#0f172a',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: activeStepIndex === maneuvers.length - 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <ChevronRight size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Google Maps Style Bottom Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.75rem', color: '#475569', paddingTop: '0.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#1a73e8', border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            <span>Real GPS Position with Direction Beam</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ color: accessibleMode ? '#059669' : '#1a73e8', fontWeight: 900, fontSize: '12px' }}>➤➤</span>
            <span>Compass Turn Path</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{ width: '10px', height: '14px', borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', background: '#ea4335' }} />
            <span>Destination Platform (🏁)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ background: '#f59e0b', color: '#fff', fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '50%' }}>1</span>
            <span>Numbered Turn Waypoints</span>
          </div>
        </div>

        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
          Real Road Walkway Geometry &bull; Mumbai Central Railway
        </div>
      </div>
    </div>
  );
}
