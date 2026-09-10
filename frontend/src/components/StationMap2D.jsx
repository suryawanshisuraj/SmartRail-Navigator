import React, { useState } from 'react';
import { Layers, MapPin, ShieldCheck, Footprints, Train } from 'lucide-react';

export default function StationMap2D({
  station,
  nodes = [],
  currentLocationNode,
  destinationNode,
  calculatedRoute,
  accessibleMode,
  activeFloor,
  setActiveFloor,
  onNodeClick
}) {
  const [hoveredNode, setHoveredNode] = useState(null);

  const routeNodes = calculatedRoute?.route || [];
  const routeNodeIds = new Set(routeNodes.map(n => n.id));
  const currentFloorId = activeFloor === 0 ? 1 : 2;

  // All platforms are always interactive along the track level, non-platform nodes filter by active floor
  const floorNodes = nodes.filter(n => n.type === 'PLATFORM' || n.floor_id === currentFloorId);
  const platforms = nodes.filter(n => n.type === 'PLATFORM');

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Map Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-amber">{station?.code || 'CSMT'}</span>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {station?.name || 'Chhatrapati Shivaji Maharaj Terminus (CSMT)'}
            </h2>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
            {activeFloor === 0 ? 'Floor 0: Ground Concourse, Booking Halls & Track Decks' : 'Floor 1: Foot Over Bridge (FOB) Overhead Concourse'}
          </p>
        </div>

        {/* Floor Level Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
            {station?.totalPlatforms || 18} Platforms
          </span>

          <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
            {[
              { id: 0, label: 'Floor 0 (Concourse)' },
              { id: 1, label: 'Floor 1 (FOB Overpass)' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFloor(f.id)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: activeFloor === f.id ? '#0284c7' : 'transparent',
                  color: activeFloor === f.id ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Interactive Canvas (Clean Light Blueprint) */}
      <div style={{
        width: '100%',
        aspectRatio: '16 / 10',
        background: '#ffffff',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-md)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
      }}>
        <svg viewBox="0 0 800 580" style={{ width: '100%', height: '100%', display: 'block' }}>
          <defs>
            <pattern id="stationGridLight" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#f1f5f9" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="800" height="580" fill="url(#stationGridLight)" />

          {/* Station Outer Wall Boundaries */}
          <rect x="60" y="50" width="680" height="490" rx="16" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />

          {/* Platform Rail Tracks Header Strip */}
          <rect x="90" y="90" width="620" height="55" rx="8" fill="#f1f5f9" stroke="#e2e8f0" />
          <text x="110" y="110" fill="#0284c7" fontSize="10" fontWeight="800" letterSpacing="0.04em">
            TRACK LEVEL &bull; ALL PLATFORMS (1 TO {station?.totalPlatforms || 18})
          </text>
          <text x="110" y="132" fill="#64748b" fontSize="9">
            Slow Suburban Locals, Fast Line Through-Services & Outstation Express Bays
          </text>

          {/* Foot Over Bridge (FOB) Walkway Band */}
          <rect
            x="90"
            y="240"
            width="620"
            height="40"
            rx="6"
            fill={activeFloor === 1 ? '#e0f2fe' : '#ffffff'}
            stroke={activeFloor === 1 ? '#0284c7' : '#cbd5e1'}
            strokeWidth="1.5"
          />
          <text x="400" y="264" textAnchor="middle" fill={activeFloor === 1 ? '#0369a1' : '#475569'} fontSize="11" fontWeight="800">
            CENTRAL FOOT OVER BRIDGE (FOB) &bull; OVERPASS TO ALL PLATFORMS
          </text>

          {/* A* Route Path Line */}
          {routeNodes.length > 1 && (
            <path
              d={routeNodes.reduce((acc, curr, idx) => {
                const prefix = idx === 0 ? 'M' : 'L';
                return `${acc} ${prefix} ${curr.x} ${curr.y}`;
              }, '')}
              fill="none"
              stroke={accessibleMode ? '#059669' : '#0284c7'}
              strokeWidth={accessibleMode ? 6 : 5}
              strokeDasharray={accessibleMode ? '8 4' : 'none'}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(2, 132, 199, 0.4))' }}
            />
          )}

          {/* Render Active Floor Nodes */}
          {floorNodes.map(node => {
            const isCurrent = currentLocationNode?.id === node.id;
            const isDest = destinationNode?.id === node.id;
            const isInRoute = routeNodeIds.has(node.id);

            let pinBg = '#ffffff';
            let strokeColor = '#cbd5e1';

            if (isCurrent) {
              pinBg = '#0284c7';
              strokeColor = '#ffffff';
            } else if (isDest) {
              pinBg = '#d97706';
              strokeColor = '#ffffff';
            } else if (node.type === 'LIFT') {
              pinBg = '#ecfdf5';
              strokeColor = '#059669';
            } else if (node.type === 'STAIRS') {
              pinBg = '#fff1f2';
              strokeColor = '#e11d48';
            } else if (node.type === 'PLATFORM') {
              pinBg = '#f0f9ff';
              strokeColor = '#0284c7';
            } else if (isInRoute) {
              pinBg = '#e0f2fe';
              strokeColor = '#0284c7';
            }

            return (
              <g
                key={node.id}
                onClick={() => onNodeClick && onNodeClick(node)}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer' }}
              >
                {isCurrent && (
                  <circle cx={node.x} cy={node.y} r={24} fill="none" stroke="#0284c7" strokeWidth={2} opacity={0.6}>
                    <animate attributeName="r" values="16;28;16" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isCurrent || isDest ? 16 : 13}
                  fill={pinBg}
                  stroke={strokeColor}
                  strokeWidth={2}
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.08))"
                />

                <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize={10} fill={isCurrent || isDest ? '#ffffff' : '#0f172a'}>
                  {node.icon || '📍'}
                </text>

                <text
                  x={node.x}
                  y={node.y + (node.type === 'PLATFORM' ? -18 : 24)}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={700}
                  fill={isInRoute || isCurrent || isDest ? '#0284c7' : '#334155'}
                >
                  {node.type === 'PLATFORM' ? `P${node.platformNumber}` : node.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Map Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0284c7' }} />
          <span>Current Location (📍)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#d97706' }} />
          <span>Destination Platform (⭐)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#059669' }} />
          <span>Elevator Lift L-1 (♿ Accessible)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#e11d48' }} />
          <span>FOB Stairs Bank</span>
        </div>
      </div>
    </div>
  );
}
