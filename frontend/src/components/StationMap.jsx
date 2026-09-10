import React, { useState } from 'react';
import { MapPin, Layers, Accessibility, ShieldCheck, Compass, Info, ArrowUpRight } from 'lucide-react';

export default function StationMap({ accessibleMode, targetPlatform }) {
  const [activeFloor, setActiveFloor] = useState(0); // 0 = Concourse, -1 = Mezzanine, -2 = Platforms
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [destinationNode, setDestinationNode] = useState(targetPlatform || 'Platform 4');

  const floors = [
    { level: 0, name: 'Level 0: Concourse & Ticketing' },
    { level: -1, name: 'Level -1: Mezzanine Overpass' },
    { level: -2, name: 'Level -2: Train Platforms' }
  ];

  const pois = [
    { id: 'POI_ENTRANCE', label: 'Main North Entrance', x: 400, y: 520, floor: 0, accessible: true, icon: '🚪', desc: 'Street entrance with automatic sliding doors and ramp.' },
    { id: 'POI_TICKET', label: 'Ticket Vending & Help Desk', x: 280, y: 440, floor: 0, accessible: true, icon: '🎫', desc: 'Lowered counter screens, tactile buttons, multilingual support.' },
    { id: 'POI_GATE_WIDE', label: 'Wide Accessible Fare Gates', x: 400, y: 380, floor: 0, accessible: true, icon: '♿', desc: '1.2m clearance barrier, beep verification for visually impaired.' },
    { id: 'POI_RESTROOM', label: 'Accessible Family Restroom', x: 180, y: 350, floor: 0, accessible: true, icon: '🚻', desc: 'Power assisted door, emergency pull cord.' },
    
    // Elevators & Escalators
    { id: 'POI_ELEVATOR_EL2', label: 'Elevator EL-2 (Accessible)', x: 480, y: 320, floor: 0, accessible: true, icon: '🛗', desc: 'Direct access to Level -1 and Level -2 Platforms 3 & 4.' },
    { id: 'POI_STAIRS_A', label: 'Stairwell A', x: 320, y: 320, floor: 0, accessible: false, icon: '🪜', desc: 'Steep steps down to Level -1. Inaccessible.' },

    // Platforms (Level -2)
    { id: 'POI_PLT_1', label: 'Platform 1 (Gold Express)', x: 220, y: 160, floor: -2, accessible: true, icon: '🚆', desc: 'Northbound HSR track. Level boarding doors.' },
    { id: 'POI_PLT_2', label: 'Platform 2 (Regional Line)', x: 340, y: 160, floor: -2, accessible: true, icon: '🚆', desc: 'Commuter regional express.' },
    { id: 'POI_PLT_4', label: 'Platform 4 (Southern Feeder)', x: 580, y: 160, floor: -2, accessible: true, icon: '🚆', desc: 'Dedicated wheelchair boarding bay with conductor ramp.' }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
      {/* SVG Interactive Map Canvas */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Compass size={20} color="var(--accent-cyan)" />
              <span>Indoor Terminal Wayfinding</span>
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Central Grand Terminal (Interactive Floorplan)
            </p>
          </div>

          {/* Floor Switcher */}
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
            {floors.map(f => (
              <button
                key={f.level}
                type="button"
                onClick={() => setActiveFloor(f.level)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: activeFloor === f.level ? 'var(--accent-cyan)' : 'transparent',
                  color: activeFloor === f.level ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                L{f.level}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Canvas */}
        <div style={{
          width: '100%',
          aspectRatio: '4 / 3',
          background: 'rgba(11, 17, 32, 0.9)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-md)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <svg viewBox="0 0 800 600" style={{ width: '100%', height: '100%', display: 'block' }}>
            {/* Grid Pattern */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="800" height="600" fill="url(#grid)" />

            {/* Terminal Concourse Wall Boundaries */}
            <rect x="100" y="80" width="600" height="460" rx="20" fill="rgba(30, 41, 59, 0.4)" stroke="var(--border-glass)" strokeWidth="2" />

            {/* Platform tracks if on floor -2 */}
            {activeFloor === -2 && (
              <g id="tracks">
                <line x1="140" y1="120" x2="660" y2="120" stroke="var(--accent-cyan)" strokeWidth="4" strokeDasharray="8 6" />
                <line x1="140" y1="200" x2="660" y2="200" stroke="var(--accent-cyan)" strokeWidth="4" strokeDasharray="8 6" />
                <text x="140" y="110" fill="var(--text-muted)" fontSize="12" fontFamily="var(--font-mono)">TRACK 1</text>
                <text x="140" y="190" fill="var(--text-muted)" fontSize="12" fontFamily="var(--font-mono)">TRACK 2</text>
              </g>
            )}

            {/* Wayfinding Route Line */}
            {accessibleMode ? (
              // Step-free route via Elevator EL-2
              <path
                d="M 400 520 L 400 380 L 480 380 L 480 320"
                fill="none"
                stroke="var(--accent-emerald)"
                strokeWidth="5"
                strokeDasharray="8 4"
                strokeLinecap="round"
              />
            ) : (
              // Standard route via main stairs
              <path
                d="M 400 520 L 400 380 L 320 380 L 320 320"
                fill="none"
                stroke="var(--accent-cyan)"
                strokeWidth="4"
                strokeLinecap="round"
              />
            )}

            {/* POI Pins */}
            {pois.filter(p => p.floor === activeFloor).map(poi => {
              const isSelected = selectedPOI?.id === poi.id;
              return (
                <g
                  key={poi.id}
                  onClick={() => setSelectedPOI(poi)}
                  style={{ cursor: 'pointer' }}
                  tabIndex={0}
                  role="button"
                  aria-label={poi.label}
                  onKeyDown={(e) => { if (e.key === 'Enter') setSelectedPOI(poi); }}
                >
                  <circle
                    cx={poi.x}
                    cy={poi.y}
                    r={isSelected ? 22 : 16}
                    fill={poi.accessible ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}
                    stroke={poi.accessible ? 'var(--accent-emerald)' : 'var(--accent-rose)'}
                    strokeWidth="2"
                    style={{ transition: 'all 0.2s ease' }}
                  />
                  <text
                    x={poi.x}
                    y={poi.y + 5}
                    textAnchor="middle"
                    fontSize="13"
                    fill="#ffffff"
                  >
                    {poi.icon}
                  </text>
                  <text
                    x={poi.x}
                    y={poi.y + 32}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill="var(--text-primary)"
                  >
                    {poi.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Wayfinding Info & POI Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Navigation Guidance Summary */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} color={accessibleMode ? 'var(--accent-emerald)' : 'var(--accent-cyan)'} />
            <span>{accessibleMode ? 'Step-Free Routing' : 'Standard Walking Route'}</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <span className="badge badge-cyan" style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem' }}>Step 1</span>
              <span>Enter through <strong>Main North Entrance</strong> (Street Level).</span>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <span className="badge badge-cyan" style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem' }}>Step 2</span>
              <span>Pass through <strong>Wide Fare Barrier</strong> (1.2m clearance).</span>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <span className="badge badge-emerald" style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem' }}>Step 3</span>
              <span>Take <strong>Elevator EL-2</strong> down to Level -2 (Platforms).</span>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <span className="badge badge-cyan" style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem' }}>Step 4</span>
              <span>Follow tactile paving directly to <strong>Platform 4</strong>.</span>
            </div>
          </div>
        </div>

        {/* Selected POI Details Card */}
        {selectedPOI && (
          <div className="glass-panel" style={{ padding: '1.5rem', borderColor: 'var(--accent-cyan)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.75rem' }}>{selectedPOI.icon}</span>
              <span className={`badge ${selectedPOI.accessible ? 'badge-emerald' : 'badge-rose'}`}>
                {selectedPOI.accessible ? 'Step-Free Certified' : 'Stairs Only'}
              </span>
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              {selectedPOI.label}
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {selectedPOI.desc}
            </p>
            <button
              type="button"
              onClick={() => setSelectedPOI(null)}
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '0.8rem', padding: '0.45rem' }}
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
