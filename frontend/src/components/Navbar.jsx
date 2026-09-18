import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Compass, QrCode, Accessibility, Globe, Train, LocateFixed, Search, X } from 'lucide-react';
import { searchRealStations } from '../data/realIndianStations';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef(null);

  const currentStation = stations.find(s => s.id === Number(selectedStationId)) || stations[0];

  // Search results based on live query (case-insensitive, exact & partial)
  const searchResults = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    const listToSearch = stations.length > 0 ? stations : searchRealStations(q);
    return listToSearch.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.city && s.city.toLowerCase().includes(q))
    );
  }, [searchQuery, stations]);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Categorize stations by line/zone
  const categories = useMemo(() => {
    const western = stations.filter(s => s.railwayLines?.some(l => l.includes('Western')) || s.zone?.includes('Western'));
    const central = stations.filter(s => s.railwayLines?.some(l => l.includes('Central')) || s.zone?.includes('Central'));
    const harbour = stations.filter(s => s.railwayLines?.some(l => l.includes('Harbour') || l.includes('Trans-Harbour')));
    const others = stations.filter(s => !western.includes(s) && !central.includes(s) && !harbour.includes(s));

    return [
      { name: 'Western Railway (WR)', list: western },
      { name: 'Central Railway (CR)', list: central },
      { name: 'Harbour & Trans-Harbour', list: harbour },
      ...(others.length > 0 ? [{ name: 'Other Indian Stations', list: others }] : [])
    ];
  }, [stations]);

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
          <span>Indian Railways &bull; Real OpenStreetMap Geographic Navigation &bull; Mumbai Suburban Network</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: currentStation?.hasIndoorMap !== false ? '#059669' : '#b45309', fontWeight: 700 }}>
            {currentStation?.hasIndoorMap !== false ? '● Level 2: Indoor Mapped' : '○ Level 1: Outdoor OSM'}
          </span>
          <span style={{ color: '#78716c' }}>Live GPS Wayfinding Enabled</span>
        </div>
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
        {/* Brand & Real Station Search / Selector */}
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
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                {currentStation?.zone?.includes('Western') ? 'Western Railway' : 'Central Railway'}
              </span>
            </div>

            {/* Station Search Input & Selector Container */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
              {/* Real Station Search Input */}
              <div ref={searchContainerRef} style={{ position: 'relative' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.25rem 0.55rem',
                  gap: '0.35rem',
                  width: '230px'
                }}>
                  <Search size={14} color="#64748b" />
                  <input
                    id="real-station-search-input"
                    type="search"
                    value={searchQuery}
                    placeholder="Search station (e.g. Dadar)..."
                    aria-label="Search real Indian railway stations"
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      outline: 'none',
                      width: '100%',
                      color: '#0f172a'
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setIsSearchOpen(false);
                      }}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                      aria-label="Clear station search"
                    >
                      <X size={13} color="#94a3b8" />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {isSearchOpen && searchQuery.trim().length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '320px',
                    maxHeight: '280px',
                    overflowY: 'auto',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                    zIndex: 100,
                    marginTop: '4px'
                  }}>
                    {searchResults.length === 0 ? (
                      <div style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
                        No matching railway stations found.
                      </div>
                    ) : (
                      <div>
                        <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                          FOUND {searchResults.length} REAL STATION{searchResults.length > 1 ? 'S' : ''}
                        </div>
                        {searchResults.map(stn => (
                          <div
                            key={stn.id}
                            onClick={() => {
                              onSelectStation(stn.id);
                              setSearchQuery('');
                              setIsSearchOpen(false);
                            }}
                            style={{
                              padding: '0.55rem 0.85rem',
                              borderBottom: '1px solid #f1f5f9',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: stn.id === Number(selectedStationId) ? '#f0f9ff' : '#ffffff',
                              transition: 'background 0.15s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.background = stn.id === Number(selectedStationId) ? '#f0f9ff' : '#ffffff'}
                          >
                            <div>
                              <div style={{ fontSize: '0.825rem', fontWeight: 800, color: '#0f172a' }}>
                                {stn.name} <span style={{ color: '#0284c7', fontSize: '0.75rem' }}>({stn.code})</span>
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                {stn.city}, {stn.state} &bull; {stn.railwayLines?.join(', ') || stn.zone || 'Indian Railways'}
                              </div>
                            </div>
                            <span style={{
                              fontSize: '0.65rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: stn.hasIndoorMap !== false ? '#ecfdf5' : '#f1f5f9',
                              color: stn.hasIndoorMap !== false ? '#047857' : '#475569',
                              fontWeight: 700,
                              whiteSpace: 'nowrap'
                            }}>
                              {stn.hasIndoorMap !== false ? 'Indoor' : 'Outdoor'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Station Dropdown */}
              <label htmlFor="station-selector" className="sr-only">Select Railway Station</label>
              <select
                id="station-selector"
                name="selectedStationId"
                value={selectedStationId}
                onChange={(e) => onSelectStation(Number(e.target.value))}
                aria-label="Select Railway Station"
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 'var(--radius-sm)',
                  color: '#0f172a',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  padding: '0.3rem 0.65rem',
                  cursor: 'pointer',
                  maxWidth: '280px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
              >
                {categories.map(cat => {
                  if (cat.list.length === 0) return null;
                  return (
                    <optgroup key={cat.name} label={cat.name} style={{ background: '#ffffff', color: '#64748b' }}>
                      {cat.list.map(stn => (
                        <option key={stn.id} value={stn.id} style={{ background: '#ffffff', color: '#0f172a' }}>
                          {stn.name} ({stn.code})
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
