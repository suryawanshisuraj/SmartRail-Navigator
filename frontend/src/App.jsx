import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import RealStationMap from './components/RealStationMap';
import StationMap2D from './components/StationMap2D';
import NavigationPanel from './components/NavigationPanel';
import AIAssistantDrawer from './components/AIAssistantDrawer';
import QRLocationScanner from './components/QRLocationScanner';
import { Map, Layers } from 'lucide-react';
import {
  fetchStationList,
  fetchStationData,
  computeIndoorRoute
} from './services/transitService';

export default function App() {
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
      selectedStationId
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

  // QR Location detected
  const handleLocationDetected = async (node) => {
    setCurrentLocationNode(node);
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
      />

      {/* Main Dashboard Workspace */}
      <main style={{
        flex: 1,
        padding: '1.25rem 2rem',
        maxWidth: '1600px',
        width: '100%',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'minmax(520px, 1.25fr) minmax(380px, 0.75fr)',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        {/* Left Column: Real Geographic Station Map & Floorplan Switcher */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
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
          />

          <AIAssistantDrawer
            station={stationData}
            currentLocationNode={currentLocationNode}
            accessibleMode={accessibleMode}
            onApplyAIRoute={handleApplyAIRoute}
          />
        </div>
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
