import React from 'react';
import { LocateFixed, MapPin, ShieldCheck, X, Compass, Train } from 'lucide-react';

export default function LocationPermissionModal({
  isOpen,
  onClose,
  onConfirmGps,
  onSelectStation,
  popularStations = []
}) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 110,
        padding: '1.25rem'
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '2rem',
          position: 'relative',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1.5px solid #cbd5e1',
          boxShadow: '0 20px 45px rgba(15, 23, 42, 0.15)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close location prompt"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '0.25rem',
            borderRadius: '6px'
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7',
              flexShrink: 0
            }}
          >
            <LocateFixed size={22} />
          </div>
          <div>
            <h3 id="location-modal-title" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Use Real Device Location?
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Precision Station & Platform Wayfinding
            </span>
          </div>
        </div>

        {/* Purpose & Privacy Explanation */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.25rem',
            fontSize: '0.825rem',
            color: '#334155',
            lineHeight: 1.55
          }}
        >
          <p style={{ margin: '0 0 0.5rem 0' }}>
            SmartRail Navigator requests your GPS position solely to:
          </p>
          <ul style={{ paddingLeft: '1.25rem', margin: '0 0 0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <li>Identify your nearest Mumbai suburban railway station.</li>
            <li>Locate your closest verified station entrance gate.</li>
            <li>Provide real-time walking directions to your train platform.</li>
          </ul>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontWeight: 700, fontSize: '0.75rem', marginTop: '0.5rem' }}>
            <ShieldCheck size={15} />
            <span>Privacy Guaranteed: Coordinates remain local in your browser and are never shared.</span>
          </div>
        </div>

        {/* Primary Action Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => {
              onClose();
              onConfirmGps();
            }}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.85rem',
              fontSize: '0.9rem',
              fontWeight: 800,
              gap: '0.5rem'
            }}
          >
            <LocateFixed size={18} />
            <span>Enable Real GPS Location</span>
          </button>

          {/* Alternative: Select from Popular Hubs */}
          <div style={{ marginTop: '0.75rem' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Or choose a major railway hub manually:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
              {popularStations.slice(0, 6).map(stn => (
                <button
                  key={stn.id}
                  type="button"
                  onClick={() => {
                    onSelectStation(stn.id);
                    onClose();
                  }}
                  style={{
                    padding: '0.55rem 0.4rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#0284c7';
                    e.currentTarget.style.background = '#f0f9ff';
                    e.currentTarget.style.color = '#0284c7';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.color = '#0f172a';
                  }}
                >
                  <div>{stn.name}</div>
                  <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>({stn.code})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
