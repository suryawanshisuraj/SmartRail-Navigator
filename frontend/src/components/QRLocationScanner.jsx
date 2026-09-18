import React, { useState } from 'react';
import { QrCode, X, CheckCircle, MapPin, Camera } from 'lucide-react';
import { scanQRCode } from '../services/transitService';

export default function QRLocationScanner({ isOpen, onClose, onLocationDetected, qrLocations = [], stationId = 1 }) {
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  if (!isOpen) return null;

  const handleScan = async (codeToScan) => {
    setError('');
    const code = codeToScan || inputCode;
    if (!code) return;

    const res = await scanQRCode(code, stationId);
    if (res.success) {
      setSuccessInfo(res);
      setTimeout(() => {
        onLocationDetected(res.currentNode);
        onClose();
        setSuccessInfo(null);
        setInputCode('');
      }, 700);
    } else {
      setError(res.error || 'Unknown station QR code.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1.5rem'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '520px',
        width: '100%',
        padding: '1.75rem',
        position: 'relative',
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        boxShadow: '0 20px 40px rgba(15, 23, 42, 0.12)'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close QR scanner"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <QrCode size={22} color="#0284c7" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Scan Station Location QR</h3>
        </div>

        <p style={{ fontSize: '0.825rem', color: '#475569', marginBottom: '1.25rem' }}>
          Point your device at any physical station QR placard, or tap a simulated QR marker below to locate yourself immediately.
        </p>

        {/* Viewfinder Camera Simulation Graphic */}
        <div style={{
          width: '100%',
          height: '170px',
          background: '#f8fafc',
          border: '2px dashed #0284c7',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          marginBottom: '1.25rem',
          overflow: 'hidden'
        }}>
          <Camera size={34} color="#0284c7" style={{ opacity: 0.8, marginBottom: '0.4rem' }} />
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
            Camera Viewfinder / QR Placard Reader Active
          </span>
          {successInfo && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(5, 150, 105, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <CheckCircle size={38} />
              <strong style={{ marginTop: '0.4rem' }}>Location Acquired!</strong>
              <span style={{ fontSize: '0.8rem' }}>{successInfo.description}</span>
            </div>
          )}
        </div>

        {/* Quick Simulation Clickable QR Tags */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Simulate Station Physical QR Placards:
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '130px', overflowY: 'auto' }}>
            {(qrLocations && qrLocations.length > 0
              ? qrLocations.slice(0, 12).map(q => ({ code: q.code, label: q.description || q.code }))
              : [
                  { code: 'QR_MAIN_ENTRANCE', label: 'Main Entrance' },
                  { code: 'QR_TICKET_COUNTER_1', label: 'Ticket Office' },
                  { code: 'QR_CONCOURSE', label: 'Central Concourse' },
                  { code: 'QR_RESTROOM', label: 'Restrooms' },
                  { code: 'QR_FOOD_COURT', label: 'Food Court' },
                  { code: 'QR_PLATFORM_1', label: 'Platform 1' }
                ]
            ).map(qr => (
              <button
                key={qr.code}
                type="button"
                onClick={() => handleScan(qr.code)}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease'
                }}
              >
                <MapPin size={12} color="#0284c7" />
                {qr.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ color: '#be123c', fontSize: '0.8rem', marginBottom: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* Manual code entry */}
        <form onSubmit={(e) => { e.preventDefault(); handleScan(); }} style={{ display: 'flex', gap: '0.5rem' }}>
          <label htmlFor="qr-manual-code-input" className="sr-only">
            Enter Station QR Code Identifier
          </label>
          <input
            id="qr-manual-code-input"
            name="qrCode"
            aria-label="Enter station QR code identifier"
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="e.g. QR_CSMT_PLT_1"
            style={{
              flex: 1,
              padding: '0.6rem 0.85rem',
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: 'var(--radius-md)',
              color: '#0f172a',
              fontSize: '0.85rem'
            }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.15rem' }}>
            Verify
          </button>
        </form>
      </div>
    </div>
  );
}
