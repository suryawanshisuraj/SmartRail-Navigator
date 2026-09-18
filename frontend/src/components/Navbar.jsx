import React from 'react';
import { Compass, QrCode, Accessibility, Globe, Train, LocateFixed } from 'lucide-react';

export default function Navbar({
  stations = [],
  selectedStationId,
  onSelectStation,
  onOpenQRScanner,
  currentLocationNode,
  accessibleMode,
  setAccessibleMode,
  language,
  setLanguage,
  onDetectRealLocation,
  isGpsActive,
  isGpsLoading,
  activeTab = 'WAYFINDING',
  onSelectTab
}) {
  const currentStation = stations.find(s => s.id === Number(selectedStationId)) || stations[0];

  // Group stations by zone
  const zones = ['South Mumbai', 'Central Mumbai', 'Eastern Suburbs', 'Thane Zone', 'Beyond Thane'];

  return (
    <header style={{
      display: 'flex',
      flexDirection: 'column',
      borderBottom: '1px solid var(--border-glass)',
      background: '#ffffff',
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      {/* Central Line Top Ribbon */}
      <div style={{
        background: '#fffbeb',
        borderBottom: '1px solid #fef3c7',
        padding: '0.35rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        color: '#b45309',
        fontWeight: 600
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Train size={14} color="#b45309" />
          <span>Mumbai Suburban Railway &bull; Central Line Corridor (CSMT to Kalyan &bull; 26 Stations)</span>
        </div>
        <span style={{ color: '#78716c' }}>Live GPS Wayfinding Enabled</span>
      </div>

      {/* Main Bar */}
      <div className="navbar-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 2rem',
        gap: '1.25rem',
        flexWrap: 'wrap'
      }}>
        {/* Brand & Central Line Station Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)'
          }}>
            <Compass size={22} color="#ffffff" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'inline' }}>
                SmartRail <span style={{ color: 'var(--accent-cyan)' }}>Navigator</span>
              </h1>
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Central Line</span>
            </div>

            {/* Station Dropdown with accessible label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
              <label htmlFor="station-selector" className="sr-only">Select Central Line Railway Station</label>
              <select
                id="station-selector"
                name="selectedStationId"
                value={selectedStationId}
                onChange={(e) => onSelectStation(Number(e.target.value))}
                aria-label="Select Central Line Railway Station"
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 'var(--radius-sm)',
                  color: '#0f172a',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  padding: '0.3rem 0.65rem',
                  cursor: 'pointer',
                  maxWidth: '320px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
              >
                {zones.map(zone => {
                  const zoneStations = stations.filter(s => s.zone === zone);
                  if (zoneStations.length === 0) return null;
                  return (
                    <optgroup key={zone} label={zone} style={{ background: '#ffffff', color: '#64748b' }}>
                      {zoneStations.map(stn => (
                        <option key={stn.id} value={stn.id} style={{ background: '#ffffff', color: '#0f172a' }}>
                          {stn.name} ({stn.totalPlatforms} Plat)
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Current Location Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: isGpsActive ? '#f0f9ff' : '#f1f5f9',
          border: isGpsActive ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
          padding: '0.45rem 1rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.8rem'
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>{isGpsActive ? '📍 GPS Location:' : 'Station Gate:'}</span>
          <strong style={{ color: isGpsActive ? '#0284c7' : '#0f172a' }}>
            {currentLocationNode?.name || 'Main Entrance'}
          </strong>
        </div>

        {/* Controls & Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Real GPS Button */}
          {onDetectRealLocation && (
            <button
              type="button"
              onClick={onDetectRealLocation}
              disabled={isGpsLoading}
              style={{
                background: isGpsActive ? '#0284c7' : '#ffffff',
                color: isGpsActive ? '#ffffff' : '#0284c7',
                border: '1.5px solid #0284c7',
                borderRadius: 'var(--radius-md)',
                padding: '0.45rem 0.85rem',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: isGpsActive ? '0 2px 6px rgba(2, 132, 199, 0.3)' : '0 1px 2px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease'
              }}
              title="Locate my position using real GPS coordinates"
            >
              <LocateFixed size={15} />
              <span>{isGpsLoading ? 'Locking GPS...' : isGpsActive ? 'Real GPS Active 🟢' : 'Use Real Location'}</span>
            </button>
          )}

          {/* QR Scanner Trigger */}
          <button
            type="button"
            onClick={onOpenQRScanner}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}
            aria-label="Scan Station QR Code to locate yourself"
          >
            <QrCode size={15} />
            <span>Scan Station QR</span>
          </button>

          {/* Accessibility Mode Toggle */}
          <button
            type="button"
            onClick={() => setAccessibleMode(!accessibleMode)}
            className={`btn ${accessibleMode ? 'badge-emerald' : 'btn-secondary'}`}
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.78rem',
              borderRadius: 'var(--radius-md)',
              border: accessibleMode ? '1.5px solid #059669' : '1px solid var(--border-glass)'
            }}
            aria-label={`Toggle Accessibility Mode. Currently ${accessibleMode ? 'Active' : 'Inactive'}`}
          >
            <Accessibility size={15} color={accessibleMode ? '#059669' : '#475569'} />
            <span>{accessibleMode ? 'Step-Free ON ♿' : 'Accessibility'}</span>
          </button>

          {/* Language Selector with label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#f8fafc', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
            <Globe size={14} color="#64748b" />
            <label htmlFor="language-selector" className="sr-only">Select Language</label>
            <select
              id="language-selector"
              name="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Select voice and text navigation language"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="en" style={{ background: '#ffffff', color: '#0f172a' }}>English</option>
              <option value="hi" style={{ background: '#ffffff', color: '#0f172a' }}>हिंदी (Hindi)</option>
              <option value="mr" style={{ background: '#ffffff', color: '#0f172a' }}>मराठी (Marathi)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Bar / App View Mode Switcher */}
      <nav aria-label="Main Navigation" style={{
        background: '#f8fafc',
        borderTop: '1px solid var(--border-glass)',
        padding: '0.35rem 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        overflowX: 'auto'
      }}>
        {[
          { id: 'WAYFINDING', label: '🗺️ Station Map & Wayfinding' },
          { id: 'PLANNER', label: '🧭 Journey Planner' },
          { id: 'TRAINS', label: '🚆 Live Train Fleet' },
          { id: 'FARES', label: '💳 Fare Calculator' }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab && onSelectTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                border: isActive ? '1.5px solid #0284c7' : '1px solid transparent',
                background: isActive ? '#e0f2fe' : 'transparent',
                color: isActive ? '#0284c7' : 'var(--text-secondary)',
                fontSize: '0.82rem',
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
