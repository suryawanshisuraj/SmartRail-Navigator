import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import RealStationMap from './components/RealStationMap';
import StationMap2D from './components/StationMap2D';
import NavigationPanel from './components/NavigationPanel';
import AIAssistantDrawer from './components/AIAssistantDrawer';
import QRLocationScanner from './components/QRLocationScanner';
import RouteSearch from './components/RouteSearch';
import LiveTrainTracker from './components/LiveTrainTracker';
import FareCalculator from './components/FareCalculator';
import { Map, Layers } from 'lucide-react';
import {
  fetchStationList,
  fetchStationData,
  computeIndoorRoute,
  getLiveGPSPosition,
  findNearestStation,
  haversineDistanceMeters
} from './services/transitService';

export default function App() {
  const [activeTab, setActiveTab] = useState('WAYFINDING'); // 'WAYFINDING', 'PLANNER', 'TRAINS', 'FARES'
  const [stations, setStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState(1);
  const [stationData, setStationData] = useState(null);
  const [currentLocationNode, setCurrentLocationNode] = useState(null);
  const [selectedDestinationId, setSelectedDestinationId] = useState('');
  const [routeType, setRouteType] = useState('NORMAL');
  const [calculatedRoute, setCalculatedRoute] = useState(null);
  const [activeFloor, setActiveFloor] = useState(0); // 0 = Concourse, 1 = Mezzanine/FOB
  const [accessibleMode, setAccessibleMode] = useState(false);
  const [language, setLanguage] = useState('en');
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [mapViewMode, setMapViewMode] = useState('REAL_MAP'); // 'REAL_MAP' or 'SCHEMATIC'
  const [isLoading, setIsLoading] = useState(true);

  // Real Device GPS State
  const [realGpsPosition, setRealGpsPosition] = useState(null);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsDistanceNotice, setGpsDistanceNotice] = useState(null);

  // Load Station Data
  const loadStation = useCallback(async (stnId, targetDestId = null) => {
    setIsLoading(true);
    try {
      const data = await fetchStationData(stnId);
      setStationData(data);

      const defaultStart = data.nodes.find(n => n.id === 'NODE_MAIN_ENTRANCE' || n.type === 'ENTRANCE') || data.nodes[0];
      setCurrentLocationNode(defaultStart);

      // Default destination: Platform 1 or first platform, or targetDestId if provided
      let destNode = null;
      if (targetDestId) {
        destNode = data.nodes.find(n => n.id === targetDestId);
      }
      if (!destNode) {
        destNode = data.nodes.find(n => n.type === 'PLATFORM' && n.platformNumber === '1')
          || data.nodes.find(n => n.type === 'PLATFORM')
          || data.nodes[1];
      }

      const destId = destNode?.id || (data.nodes[1]?.id || defaultStart.id);
      setSelectedDestinationId(destId);

      // Route computation
      const initialRoute = await computeIndoorRoute(
        defaultStart.id,
        destId,
        accessibleMode ? 'ACCESSIBLE' : routeType,
        stnId
      );
      setCalculatedRoute(initialRoute);
      setActiveFloor(0);
      setAnnouncement(`Loaded ${data.name}. Total ${data.totalPlatforms} platforms ready for navigation.`);
    } catch (err) {
      console.error('Failed to load station layout:', err);
    } finally {
      setIsLoading(false);
    }
  }, [accessibleMode, routeType]);

  // Initial catalog fetch & first station setup
  useEffect(() => {
    async function init() {
      const stnList = await fetchStationList();
      setStations(stnList);
      await loadStation(1);
    }
    init();
  }, [loadStation]);

  // Handle Station Switch from Navbar dropdown
  const handleSelectStation = async (newStationId) => {
    setSelectedStationId(newStationId);
    setIsGpsActive(false);
    await loadStation(newStationId);
  };

  // Recalculate route when start, destination, or accessibility mode changes
  const handleCalculateRoute = async (destId, mode) => {
    if (!currentLocationNode || !stationData) return;
    const activeMode = accessibleMode ? 'ACCESSIBLE' : (mode || routeType);
    const targetDest = destId || selectedDestinationId;

    const res = await computeIndoorRoute(
      currentLocationNode.id,
      targetDest,
      activeMode,
      selectedStationId,
      currentLocationNode.isRealGps ? currentLocationNode : null
    );
    setCalculatedRoute(res);

    // Auto-switch floor view if destination is on the FOB floor
    const destNode = stationData.nodes.find(n => n.id === targetDest);
    if (destNode && destNode.floor_id === 2) {
      setActiveFloor(1);
    } else {
      setActiveFloor(0);
    }

    if (res.success && res.instructions && res.instructions.length > 0) {
      setAnnouncement(`Route updated. ${res.instructions[0]}. Distance is ${res.distance} meters.`);
    }
  };

  // Handle Real Device GPS Geolocation
  const handleDetectRealLocation = async () => {
    setIsGpsLoading(true);
    setAnnouncement('Locating you via device GPS satellites...');
    try {
      const pos = await getLiveGPSPosition();
      setRealGpsPosition(pos);
      setIsGpsActive(true);

      // Find nearest station along Mumbai Central line
      const nearest = findNearestStation(pos.lat, pos.lng);
      const nearestStation = nearest?.station || nearest;
      const nearestId = nearestStation?.id;
      const distanceToNearest = nearest?.distanceMeters || 0;

      let targetStationId = selectedStationId;
      let targetStationData = stationData;

      // If user is within 3km of another station, auto-switch to that station
      if (nearestStation && nearestId && nearestId !== selectedStationId && distanceToNearest < 3000) {
        setAnnouncement(`Live GPS detected you near ${nearestStation.name} (${(distanceToNearest / 1000).toFixed(1)} km away). Switching station...`);
        setSelectedStationId(nearestId);
        targetStationId = nearestId;
        targetStationData = await fetchStationData(nearestId);
        setStationData(targetStationData);
        setGpsDistanceNotice(null);
      } else {
        const distToTarget = haversineDistanceMeters(pos.lat, pos.lng, targetStationData?.lat || 18.94, targetStationData?.lng || 72.835);
        if (distToTarget > 2500 && nearestStation) {
          setGpsDistanceNotice({
            isFar: true,
            distanceKm: +(distToTarget / 1000).toFixed(1),
            nearestStation,
            nearestDistanceKm: +(distanceToNearest / 1000).toFixed(1),
            targetStationName: targetStationData?.name || 'Selected Station'
          });
        } else {
          setGpsDistanceNotice(null);
        }
      }

      // Find closest entrance in target station data
      const entranceNodes = (targetStationData?.nodes || []).filter(n => n.type === 'ENTRANCE' || n.type === 'CORRIDOR');
      const nearestEntrance = entranceNodes[0] || targetStationData?.nodes[0];

      // Construct dynamic Real GPS Node
      const gpsNode = {
        id: 'NODE_USER_REAL_GPS',
        name: 'My Live GPS Location',
        floor_id: 1,
        lat: pos.lat,
        lng: pos.lng,
        x: nearestEntrance?.x !== undefined ? nearestEntrance.x : 80,
        y: nearestEntrance?.y !== undefined ? nearestEntrance.y : 480,
        type: 'ENTRANCE',
        isRealGps: true,
        accuracy: pos.accuracy,
        heading: pos.heading,
        description: `Live GPS: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)} (±${pos.accuracy}m)`
      };

      setCurrentLocationNode(gpsNode);

      // Route destination
      const targetDest = selectedDestinationId || (targetStationData?.nodes.find(n => n.type === 'PLATFORM')?.id) || targetStationData?.nodes[1]?.id;
      setSelectedDestinationId(targetDest);

      const res = await computeIndoorRoute(
        gpsNode.id,
        targetDest,
        accessibleMode ? 'ACCESSIBLE' : routeType,
        targetStationId,
        gpsNode
      );
      setCalculatedRoute(res);

      const destNode = targetStationData?.nodes.find(n => n.id === targetDest);
      const modeLabel = res?.isLongDistance ? 'highway road route' : 'pedestrian wayfinding';
      setAnnouncement(`GPS Locked! Accuracy ±${pos.accuracy}m. Real ${modeLabel} ready to ${destNode?.name || 'Platform'}.`);
    } catch (err) {
      console.error('GPS error:', err);
      setAnnouncement(`Location status: ${err.message || 'Could not obtain device location. Please check browser location permissions.'}`);
      setIsGpsActive(false);
    } finally {
      setIsGpsLoading(false);
    }
  };

  // QR Location detected
  const handleLocationDetected = async (node) => {
    setCurrentLocationNode(node);
    setIsGpsActive(false);
    setActiveFloor(node.floor_id === 2 ? 1 : 0);
    setAnnouncement(`Current location updated to ${node.name}.`);

    // Recalculate route from new location
    const res = await computeIndoorRoute(
      node.id,
      selectedDestinationId,
      accessibleMode ? 'ACCESSIBLE' : routeType,
      selectedStationId
    );
    setCalculatedRoute(res);
  };

  // Apply route from AI assistant
  const handleApplyAIRoute = (destNodeId, route) => {
    setSelectedDestinationId(destNodeId);
    setCalculatedRoute(route);
    const destNode = stationData?.nodes.find(n => n.id === destNodeId);
    if (destNode?.floor_id === 2) {
      setActiveFloor(1);
    } else {
      setActiveFloor(0);
    }
  };

  // Toggle Accessible Mode
  const handleToggleAccessibleMode = (newVal) => {
    setAccessibleMode(newVal);
    handleCalculateRoute(selectedDestinationId, newVal ? 'ACCESSIBLE' : 'NORMAL');
  };

  const destinations = stationData?.nodes.filter(n => n.type !== 'CORRIDOR') || [];
  const destinationNode = stationData?.nodes.find(n => n.id === selectedDestinationId);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
      {/* Screen Reader Accessible Live Region */}
      <div id="station-announcer" className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Main Navbar with Central Line 26-Station Dropdown */}
      <Navbar
        stations={stations}
        selectedStationId={selectedStationId}
        onSelectStation={handleSelectStation}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        currentLocationNode={currentLocationNode}
        accessibleMode={accessibleMode}
        setAccessibleMode={handleToggleAccessibleMode}
        language={language}
        setLanguage={setLanguage}
        onDetectRealLocation={handleDetectRealLocation}
        isGpsActive={isGpsActive}
        isGpsLoading={isGpsLoading}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Dashboard Workspace */}
      <main className="responsive-main-container" style={{
        flex: 1,
        padding: '1.25rem 2rem',
        maxWidth: '1600px',
        width: '100%',
        margin: '0 auto'
      }}>
        {activeTab === 'WAYFINDING' && (
          <div className="main-dashboard-grid">
            {/* Left Column: Real Geographic Station Map & Floorplan Switcher */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* GPS Long-Distance Route Notification Banner */}
              {gpsDistanceNotice && gpsDistanceNotice.isFar && isGpsActive && (
                <div style={{
                  background: 'linear-gradient(90deg, #eff6ff, #f0fdf4)',
                  border: '1.5px solid #93c5fd',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.35rem' }}>📍</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1e3a8a' }}>
                        Real GPS Active &bull; {gpsDistanceNotice.distanceKm} km from {gpsDistanceNotice.targetStationName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.15rem' }}>
                        Displaying real road highway route on map into station gate. Nearest Central Line hub: <strong>{gpsDistanceNotice.nearestStation.name}</strong> ({gpsDistanceNotice.nearestDistanceKm} km).
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      onClick={() => setActiveTab('PLANNER')}
                    >
                      <span>🚆 Plan Train from Nearest Hub</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      onClick={async () => {
                        setSelectedStationId(gpsDistanceNotice.nearestStation.id);
                        const stn = await fetchStationData(gpsDistanceNotice.nearestStation.id);
                        setStationData(stn);
                        setGpsDistanceNotice(null);
                      }}
                    >
                      <span>Switch to {gpsDistanceNotice.nearestStation.code}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Map Mode Tab Switcher */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#ffffff',
                padding: '0.4rem 0.65rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-glass)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  STATION MAP VIEW
                </span>

                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => setMapViewMode('REAL_MAP')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.35rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: mapViewMode === 'REAL_MAP' ? '1.5px solid #1a73e8' : '1px solid transparent',
                      background: mapViewMode === 'REAL_MAP' ? '#e8f0fe' : 'transparent',
                      color: mapViewMode === 'REAL_MAP' ? '#1a73e8' : 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Map size={14} color={mapViewMode === 'REAL_MAP' ? '#1a73e8' : 'currentColor'} />
                    <span>🗺️ Real Road Map (Google Maps Style)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMapViewMode('SCHEMATIC')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.35rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: mapViewMode === 'SCHEMATIC' ? '1.5px solid #1a73e8' : '1px solid transparent',
                      background: mapViewMode === 'SCHEMATIC' ? '#e8f0fe' : 'transparent',
                      color: mapViewMode === 'SCHEMATIC' ? '#1a73e8' : 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Layers size={14} color={mapViewMode === 'SCHEMATIC' ? '#1a73e8' : 'currentColor'} />
                    <span>📐 Indoor Station Blueprint (Concourse / FOB)</span>
                  </button>
                </div>
              </div>

              {/* Active Map View */}
              {mapViewMode === 'REAL_MAP' ? (
                <RealStationMap
                  station={stationData}
                  nodes={stationData?.nodes || []}
                  currentLocationNode={currentLocationNode}
                  destinationNode={destinationNode}
                  calculatedRoute={calculatedRoute}
                  accessibleMode={accessibleMode}
                  realGpsPosition={realGpsPosition}
                  onDetectRealLocation={handleDetectRealLocation}
                  isGpsActive={isGpsActive}
                  isGpsLoading={isGpsLoading}
                  onNodeClick={(node) => {
                    setSelectedDestinationId(node.id);
                    handleCalculateRoute(node.id, routeType);
                  }}
                />
              ) : (
                <StationMap2D
                  station={stationData}
                  nodes={stationData?.nodes || []}
                  currentLocationNode={currentLocationNode}
                  destinationNode={destinationNode}
                  calculatedRoute={calculatedRoute}
                  accessibleMode={accessibleMode}
                  activeFloor={activeFloor}
                  setActiveFloor={setActiveFloor}
                  onNodeClick={(node) => {
                    setSelectedDestinationId(node.id);
                    handleCalculateRoute(node.id, routeType);
                  }}
                />
              )}
            </div>

            {/* Right Column: Navigation Controls & Grounded AI Assistant */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <NavigationPanel
                station={stationData}
                destinations={destinations}
                selectedDestinationId={selectedDestinationId}
                setSelectedDestinationId={setSelectedDestinationId}
                routeType={routeType}
                setRouteType={setRouteType}
                calculatedRoute={calculatedRoute}
                onCalculateRoute={handleCalculateRoute}
                language={language}
                accessibleMode={accessibleMode}
                currentLocationNode={currentLocationNode}
                onDetectRealLocation={handleDetectRealLocation}
                isGpsActive={isGpsActive}
                isGpsLoading={isGpsLoading}
                realGpsPosition={realGpsPosition}
              />

              <AIAssistantDrawer
                station={stationData}
                currentLocationNode={currentLocationNode}
                accessibleMode={accessibleMode}
                onApplyAIRoute={handleApplyAIRoute}
              />
            </div>
          </div>
        )}

        {activeTab === 'PLANNER' && (
          <RouteSearch
            stations={stations}
            accessibleMode={accessibleMode}
            onSelectStationForMap={(stnId) => {
              setSelectedStationId(stnId);
              setActiveTab('WAYFINDING');
            }}
            onSelectLegForFare={(distKm) => {
              setActiveTab('FARES');
            }}
          />
        )}

        {activeTab === 'TRAINS' && (
          <LiveTrainTracker />
        )}

        {activeTab === 'FARES' && (
          <FareCalculator />
        )}
      </main>

      {/* QR Location Scanner Modal */}
      <QRLocationScanner
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onLocationDetected={handleLocationDetected}
        qrLocations={stationData?.qrLocations || []}
        stationId={selectedStationId}
      />

      {/* Footer */}
      <footer style={{
        padding: '0.85rem 2rem',
        borderTop: '1px solid var(--border-glass)',
        textAlign: 'center',
        fontSize: '0.78rem',
        color: '#64748b',
        background: '#ffffff'
      }}>
        SmartRail Navigator &bull; Mumbai Central Suburban Line (CSMT to Kalyan &bull; 26 Stations) &bull; Demo/Simulated Station Data
      </footer>
    </div>
  );
}
