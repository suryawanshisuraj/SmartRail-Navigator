import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Compass,
  QrCode,
  Accessibility,
  Globe,
  Train,
  LocateFixed,
  Search,
  X,
  Menu,
  Clock,
  Star,
  MapPin,
  ChevronDown
} from 'lucide-react';
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
  onSelectTab,
  onOpenLocationPermissionModal
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [lineFilter, setLineFilter] = useState('ALL'); // 'ALL', 'CR', 'WR', 'HARBOUR'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Recent Stations from LocalStorage
  const [recentStationIds, setRecentStationIds] = useState(() => {
    try {
      const stored = localStorage.getItem('smartrail_recent_stations');
      return stored ? JSON.parse(stored) : [1, 8, 13, 21, 26];
    } catch {
      return [1, 8, 13, 21, 26];
    }
  });

  const currentStation = stations.find(s => s.id === Number(selectedStationId)) || stations[0];

  // Quick Mumbai Suburban Hubs
  const popularHubIds = [1, 8, 11, 13, 19, 26]; // CSMT, Dadar, Kurla, Ghatkopar, Thane, Kalyan
  const popularHubs = useMemo(() => {
    return popularHubIds
      .map(id => stations.find(s => s.id === id))
      .filter(Boolean);
  }, [stations]);

  // Track station selection and update recent stations
  const handleSelectStationWithHistory = (stnId) => {
    onSelectStation(stnId);
    setSearchQuery('');
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);

    setRecentStationIds(prev => {
      const updated = [stnId, ...prev.filter(id => id !== stnId)].slice(0, 6);
      try {
        localStorage.setItem('smartrail_recent_stations', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Keyboard shortcut: '/' or 'Ctrl+K' focuses the search input
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsMobileMenuOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered search results
  const searchResults = useMemo(() => {
    let listToSearch = stations.length > 0 ? stations : searchRealStations('');

    // Apply Line/Zone filter
    if (lineFilter === 'CR') {
      listToSearch = listToSearch.filter(s => s.railwayLines?.some(l => l.includes('Central')) || s.zone?.includes('Central'));
    } else if (lineFilter === 'WR') {
      listToSearch = listToSearch.filter(s => s.railwayLines?.some(l => l.includes('Western')) || s.zone?.includes('Western'));
    } else if (lineFilter === 'HARBOUR') {
      listToSearch = listToSearch.filter(s => s.railwayLines?.some(l => l.includes('Harbour') || l.includes('Trans-Harbour')));
    }

    if (!searchQuery || !searchQuery.trim()) {
      return listToSearch;
    }

    const q = searchQuery.trim().toLowerCase();
    return listToSearch.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.city && s.city.toLowerCase().includes(q))
    );
  }, [searchQuery, stations, lineFilter]);

  // Recent station objects
  const recentStations = useMemo(() => {
    return recentStationIds
      .map(id => stations.find(s => s.id === id))
      .filter(Boolean);
  }, [recentStationIds, stations]);

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
    const central = stations.filter(s => s.railwayLines?.some(l => l.includes('Central')) || s.zone?.includes('Central'));
    const western = stations.filter(s => s.railwayLines?.some(l => l.includes('Western')) || s.zone?.includes('Western'));
    const harbour = stations.filter(s => s.railwayLines?.some(l => l.includes('Harbour') || l.includes('Trans-Harbour')));
    const others = stations.filter(s => !western.includes(s) && !central.includes(s) && !harbour.includes(s));

    return [
      { name: 'Central Railway (CR) - Main Suburban Corridor', list: central },
      { name: 'Western Railway (WR)', list: western },
      { name: 'Harbour & Trans-Harbour Corridor', list: harbour },
      ...(others.length > 0 ? [{ name: 'Other Indian Railway Hubs', list: others }] : [])
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
      {/* Central Line Top Notice Ribbon */}
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
          <span>Mumbai Central Suburban Line &bull; 26 Stations (CSMT to Kalyan) &bull; Real Road OSM Geolocation</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: currentStation?.hasIndoorMap !== false ? '#059669' : '#b45309', fontWeight: 700 }}>
            {currentStation?.hasIndoorMap !== false ? '● Level 2: Blueprint Mapped' : '○ Level 1: Street Pedestrian'}
          </span>
          <span style={{ color: '#78716c' }}>GPS Wayfinding Active</span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="navbar-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 2rem',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        {/* Brand & Station Search / Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div
            onClick={() => onSelectTab('WAYFINDING')}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)',
              cursor: 'pointer'
            }}
            title="SmartRail Navigator Home"
          >
            <Compass size={24} color="#ffffff" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1
                onClick={() => onSelectTab('WAYFINDING')}
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: 0,
                  display: 'inline',
                  cursor: 'pointer'
                }}
              >
                SmartRail <span style={{ color: 'var(--accent-cyan)' }}>Navigator</span>
              </h1>
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                {currentStation?.zone?.includes('Western') ? 'Western' : 'Central Railway'}
              </span>
            </div>

            {/* Station Search Input & Selector Container */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
              {/* Real Station Search with Quick Hubs & Line Filters */}
              <div ref={searchContainerRef} style={{ position: 'relative' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#f8fafc',
                  border: isSearchOpen ? '1.5px solid #0284c7' : '1.5px solid #cbd5e1',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.3rem 0.65rem',
                  gap: '0.4rem',
                  width: '260px',
                  boxShadow: isSearchOpen ? '0 0 0 3px rgba(2, 132, 199, 0.12)' : 'none',
                  transition: 'all 0.15s ease'
                }}>
                  <Search size={14} color="#0284c7" />
                  <input
                    ref={searchInputRef}
                    id="real-station-search-input"
                    type="search"
                    value={searchQuery}
                    placeholder="Search station or press '/'..."
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
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        searchInputRef.current?.focus();
                      }}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                      aria-label="Clear station search"
                    >
                      <X size={13} color="#94a3b8" />
                    </button>
                  ) : (
                    <kbd style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem', background: '#e2e8f0', borderRadius: '4px', color: '#64748b' }}>
                      /
                    </kbd>
                  )}
                </div>

                {/* Search Autocomplete & Quick Selection Overlay */}
                {isSearchOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '360px',
                    maxHeight: '380px',
                    overflowY: 'auto',
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.18)',
                    zIndex: 100,
                    marginTop: '6px'
                  }}>
                    {/* Line / Zone Filter Pills */}
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: '#f8fafc',
                      borderBottom: '1px solid #e2e8f0',
                      display: 'flex',
                      gap: '0.35rem',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                        Line:
                      </span>
                      {[
                        { id: 'ALL', label: 'All' },
                        { id: 'CR', label: 'Central' },
                        { id: 'WR', label: 'Western' },
                        { id: 'HARBOUR', label: 'Harbour' }
                      ].map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setLineFilter(f.id)}
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            border: lineFilter === f.id ? '1px solid #0284c7' : '1px solid #e2e8f0',
                            background: lineFilter === f.id ? '#0284c7' : '#ffffff',
                            color: lineFilter === f.id ? '#ffffff' : '#475569',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* Quick Major Suburban Hubs */}
                    {!searchQuery && (
                      <div style={{ padding: '0.65rem 0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', fontWeight: 800, color: '#0284c7', marginBottom: '0.4rem' }}>
                          <Star size={12} />
                          <span>MAJOR SUBURBAN HUBS (CENTRAL LINE)</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {popularHubs.map(hub => (
                            <button
                              key={hub.id}
                              type="button"
                              onClick={() => handleSelectStationWithHistory(hub.id)}
                              style={{
                                padding: '0.25rem 0.55rem',
                                borderRadius: 'var(--radius-full)',
                                border: hub.id === Number(selectedStationId) ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                                background: hub.id === Number(selectedStationId) ? '#e0f2fe' : '#ffffff',
                                color: hub.id === Number(selectedStationId) ? '#0284c7' : '#0f172a',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              {hub.name} ({hub.code})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Stations List */}
                    {!searchQuery && recentStations.length > 0 && (
                      <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.35rem' }}>
                          <Clock size={12} />
                          <span>RECENTLY ACCESSED STATIONS</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {recentStations.map(stn => (
                            <button
                              key={stn.id}
                              type="button"
                              onClick={() => handleSelectStationWithHistory(stn.id)}
                              style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                border: '1px solid #e2e8f0',
                                background: '#f8fafc',
                                color: '#334155',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              {stn.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Search Results List */}
                    <div>
                      <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                        <span>MATCHING STATIONS ({searchResults.length})</span>
                        {searchQuery && (
                          <span style={{ cursor: 'pointer', color: '#0284c7' }} onClick={() => setSearchQuery('')}>Clear Query</span>
                        )}
                      </div>

                      {searchResults.length === 0 ? (
                        <div style={{ padding: '1.25rem 1rem', fontSize: '0.825rem', color: '#64748b', textAlign: 'center' }}>
                          <div>No railway stations matching "{searchQuery}"</div>
                          <button
                            type="button"
                            onClick={() => { setSearchQuery(''); setLineFilter('ALL'); }}
                            className="btn btn-secondary"
                            style={{ marginTop: '0.5rem', fontSize: '0.72rem', padding: '0.3rem 0.65rem' }}
                          >
                            Reset Line Filters & Search
                          </button>
                        </div>
                      ) : (
                        searchResults.slice(0, 15).map(stn => (
                          <div
                            key={stn.id}
                            onClick={() => handleSelectStationWithHistory(stn.id)}
                            style={{
                              padding: '0.6rem 0.85rem',
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
                              {stn.hasIndoorMap !== false ? 'Blueprint' : 'Road Only'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Station Dropdown Selector */}
              <label htmlFor="station-selector" className="sr-only">Select Railway Station</label>
              <select
                id="station-selector"
                name="selectedStationId"
                value={selectedStationId}
                onChange={(e) => handleSelectStationWithHistory(Number(e.target.value))}
                aria-label="Select Railway Station"
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 'var(--radius-sm)',
                  color: '#0f172a',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  padding: '0.35rem 0.65rem',
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

        {/* Desktop Controls & Tools Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Current Location Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: isGpsActive ? '#f0f9ff' : '#f1f5f9',
            border: isGpsActive ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.78rem'
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>{isGpsActive ? '📍 GPS Point:' : 'Gate:'}</span>
            <strong style={{ color: isGpsActive ? '#0284c7' : '#0f172a' }}>
              {currentLocationNode?.name || 'Main Entrance'}
            </strong>
          </div>

          {/* Real GPS Location Button (With Modal Trigger) */}
          <button
            type="button"
            onClick={onOpenLocationPermissionModal || onDetectRealLocation}
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
            <span>{isGpsLoading ? 'Locking GPS...' : isGpsActive ? 'GPS Active 🟢' : 'Locate Me'}</span>
          </button>

          {/* QR Scanner Trigger */}
          <button
            type="button"
            onClick={onOpenQRScanner}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}
            aria-label="Scan Station QR Code to locate yourself"
          >
            <QrCode size={15} />
            <span>Scan QR</span>
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

      {/* Primary Navigation Sub-Bar / View Modes */}
      <nav aria-label="Main Navigation Tabs" style={{
        background: '#f8fafc',
        borderTop: '1px solid var(--border-glass)',
        padding: '0.4rem 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        overflowX: 'auto'
      }}>
        {[
          { id: 'WAYFINDING', label: '🗺️ Station Map & Wayfinding' },
          { id: 'PLANNER', label: '🧭 Journey Planner' },
          { id: 'TRAINS', label: '🚆 Live Train Fleet' },
          { id: 'FARES', label: '💳 Fare Calculator & E-Pass' }
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
                padding: '0.45rem 0.95rem',
                borderRadius: 'var(--radius-sm)',
                border: isActive ? '1.5px solid #0284c7' : '1px solid transparent',
                background: isActive ? '#e0f2fe' : 'transparent',
                color: isActive ? '#0284c7' : 'var(--text-secondary)',
                fontSize: '0.825rem',
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
