import React from 'react';
import { Compass, QrCode, Accessibility, Globe, Train } from 'lucide-react';

export default function Navbar({
  stations = [],
  selectedStationId,
  onSelectStation,
  onOpenQRScanner,
  currentLocationNode,
  accessibleMode,
  setAccessibleMode,
  language,
  setLanguage
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
        <span style={{ color: '#78716c' }}>Demo/Simulated Station Data</span>
      </div>

      {/* Main Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.85rem 2rem',
        gap: '1.5rem',
        flexWrap: 'wrap'
      }}>
        {/* Brand & Central Line Station Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '320px' }}>
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
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                SmartRail <span style={{ color: 'var(--accent-cyan)' }}>Navigator</span>
              </span>
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Central Line</span>
            </div>

            {/* Station Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
              <select
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
          background: '#f1f5f9',
          border: '1px solid #e2e8f0',
          padding: '0.45rem 1rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.8rem'
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>Location:</span>
          <strong style={{ color: '#0284c7' }}>
            {currentLocationNode?.name || 'Main Entrance'}
          </strong>
        </div>

        {/* Controls & Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* QR Scanner Trigger */}
          <button
            type="button"
            onClick={onOpenQRScanner}
            className="btn btn-primary"
            style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem' }}
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

          {/* Language Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#f8fafc', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
            <Globe size={14} color="#64748b" />
            <select
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
    </header>
  );
}
