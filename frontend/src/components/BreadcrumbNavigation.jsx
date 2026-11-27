import React from 'react';
import { ChevronRight, Home, Train, MapPin, Navigation, Clock, CreditCard, Layers } from 'lucide-react';

export default function BreadcrumbNavigation({
  station,
  activeTab,
  onSelectTab,
  onOpenStationSearch,
  mapViewMode,
  setMapViewMode
}) {
  const getTabLabel = (tab) => {
    switch (tab) {
      case 'WAYFINDING':
        return 'Station Map & Platform Wayfinding';
      case 'PLANNER':
        return 'Journey Route Planner';
      case 'TRAINS':
        return 'Live Train Fleet & Telemetry';
      case 'FARES':
        return 'Fare Tariff & Passes';
      default:
        return 'Navigation';
    }
  };

  const getTabIcon = (tab) => {
    switch (tab) {
      case 'WAYFINDING':
        return <Navigation size={13} color="#0284c7" />;
      case 'PLANNER':
        return <Clock size={13} color="#d97706" />;
      case 'TRAINS':
        return <Train size={13} color="#059669" />;
      case 'FARES':
        return <CreditCard size={13} color="#7c3aed" />;
      default:
        return <Home size={13} />;
    }
  };

  const isInterchange = station?.interchanges && station.interchanges.length > 0;

  return (
    <nav
      aria-label="Breadcrumbs"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.65rem',
        padding: '0.5rem 2rem',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        fontSize: '0.78rem',
        color: '#64748b'
      }}
    >
      {/* Breadcrumb Trail */}
      <ol style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', listStyle: 'none', margin: 0, padding: 0 }}>
        {/* Level 1: Network */}
        <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            type="button"
            onClick={() => onSelectTab('WAYFINDING')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#0284c7',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.2rem 0.35rem',
              borderRadius: '4px'
            }}
          >
            <Home size={13} />
            <span>SmartRail</span>
          </button>
          <ChevronRight size={13} color="#94a3b8" />
        </li>

        {/* Level 2: Line / Region */}
        <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontWeight: 600, color: '#475569' }}>
            {station?.zone?.includes('Western') ? 'Western Railway' : 'Central Railway (Mumbai)'}
          </span>
          <ChevronRight size={13} color="#94a3b8" />
        </li>

        {/* Level 3: Current Station */}
        <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            type="button"
            onClick={onOpenStationSearch}
            title="Click to switch railway station"
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.2rem 0.55rem',
              borderRadius: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Train size={12} color="#0284c7" />
            <span>{station?.name || 'CSMT'}</span>
            <span style={{ color: '#0284c7', fontSize: '0.7rem' }}>({station?.code || 'CSMT'})</span>
          </button>
          <ChevronRight size={13} color="#94a3b8" />
        </li>

        {/* Level 4: Active View / Feature */}
        <li style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 800, color: '#0f172a' }} aria-current="page">
          {getTabIcon(activeTab)}
          <span>{getTabLabel(activeTab)}</span>
        </li>
      </ol>

      {/* Quick Context Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {isInterchange && (
          <span
            className="badge"
            style={{
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fde68a',
              fontSize: '0.7rem',
              padding: '0.15rem 0.5rem'
            }}
            title={station.interchanges.join(', ')}
          >
            ⇄ Interchange Hub: {station.interchanges[0]}
          </span>
        )}

        <span
          className="badge badge-cyan"
          style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}
        >
          {station?.totalPlatforms || 18} Platforms
        </span>
      </div>
    </nav>
  );
}
