import React from 'react';
import { Map, Navigation2, Train, Ticket, LocateFixed, Search } from 'lucide-react';

export default function MobileBottomNav({
  activeTab,
  onSelectTab,
  onOpenSearch,
  onDetectLocation,
  isGpsActive,
  isGpsLoading
}) {
  const tabs = [
    { id: 'WAYFINDING', label: 'Map', icon: Map },
    { id: 'PLANNER', label: 'Plan', icon: Navigation2 },
    { id: 'TRAINS', label: 'Trains', icon: Train },
    { id: 'FARES', label: 'Fares', icon: Ticket }
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0.4rem 0.5rem',
        zIndex: 90,
        boxShadow: '0 -4px 16px rgba(15, 23, 42, 0.08)'
      }}
    >
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              minHeight: '48px',
              padding: '0.25rem 0.2rem',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: isActive ? '#0284c7' : '#64748b',
              fontWeight: isActive ? 800 : 600,
              fontSize: '0.7rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '24px',
                borderRadius: '12px',
                background: isActive ? '#e0f2fe' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.15rem'
              }}
            >
              <Icon size={18} color={isActive ? '#0284c7' : '#64748b'} />
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}

      {/* Floating GPS Action Pill in Mobile Bar */}
      <button
        type="button"
        onClick={onDetectLocation}
        disabled={isGpsLoading}
        aria-label="Find my location via GPS"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          minHeight: '48px',
          padding: '0.25rem 0.2rem',
          background: 'transparent',
          border: 'none',
          color: isGpsActive ? '#059669' : '#0284c7',
          fontWeight: 700,
          fontSize: '0.7rem',
          cursor: 'pointer'
        }}
      >
        <div
          style={{
            width: '32px',
            height: '24px',
            borderRadius: '12px',
            background: isGpsActive ? '#ecfdf5' : '#f0f9ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.15rem'
          }}
        >
          <LocateFixed size={18} color={isGpsActive ? '#059669' : '#0284c7'} />
        </div>
        <span>{isGpsLoading ? '...' : isGpsActive ? 'Locked' : 'GPS'}</span>
      </button>

      {/* Quick Search Button */}
      <button
        type="button"
        onClick={onOpenSearch}
        aria-label="Search station"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          minHeight: '48px',
          padding: '0.25rem 0.2rem',
          background: 'transparent',
          border: 'none',
          color: '#64748b',
          fontWeight: 600,
          fontSize: '0.7rem',
          cursor: 'pointer'
        }}
      >
        <div
          style={{
            width: '32px',
            height: '24px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.15rem'
          }}
        >
          <Search size={18} color="#64748b" />
        </div>
        <span>Search</span>
      </button>
    </nav>
  );
}
