import React, { useState } from 'react';
import { Navigation, Clock, ShieldCheck, Volume2, VolumeX, AlertTriangle, CheckCircle, Train } from 'lucide-react';

export default function NavigationPanel({
  station,
  destinations = [],
  selectedDestinationId,
  setSelectedDestinationId,
  routeType,
  setRouteType,
  calculatedRoute,
  onCalculateRoute,
  language,
  accessibleMode
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Group destinations by Platforms vs Amenities
  const platformDestinations = destinations.filter(d => d.type === 'PLATFORM');
  const facilityDestinations = destinations.filter(d => d.type !== 'PLATFORM');

  const speakInstructions = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!calculatedRoute || !calculatedRoute.instructions) return;

    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    const langCode = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-US';

    let textToSpeak = calculatedRoute.instructions.join('. ');
    if (language === 'mr') {
      textToSpeak = `मार्ग सूचना: ${calculatedRoute.instructions.join('. ')}. एकूण अंतर ${calculatedRoute.distance} मीटर.`;
    } else if (language === 'hi') {
      textToSpeak = `रास्ता निर्देश: ${calculatedRoute.instructions.join('. ')}. कुल दूरी ${calculatedRoute.distance} मीटर.`;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = langCode;
    utterance.rate = 0.92;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      {/* Title & Voice Guidance Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Navigation size={18} color="var(--accent-cyan)" />
          <span>Platform Wayfinding</span>
        </h3>

        {/* Voice Button */}
        <button
          type="button"
          onClick={speakInstructions}
          disabled={!calculatedRoute}
          aria-label={isSpeaking ? 'Stop voice guidance' : 'Start voice guidance'}
          className={`btn ${isSpeaking ? 'badge-rose' : 'btn-secondary'}`}
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: 'var(--radius-full)' }}
        >
          {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
          <span>{isSpeaking ? 'Stop Voice' : `Voice (${language.toUpperCase()})`}</span>
        </button>
      </div>

      {/* Destination Dropdown */}
      <div>
        <label htmlFor="platform-dest-select" style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
          SELECT PLATFORM OR AMENITY
        </label>
        <select
          id="platform-dest-select"
          value={selectedDestinationId}
          onChange={(e) => {
            setSelectedDestinationId(e.target.value);
            onCalculateRoute(e.target.value, routeType);
          }}
          style={{
            width: '100%',
            padding: '0.65rem 0.85rem',
            background: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: 'var(--radius-md)',
            color: '#0f172a',
            fontSize: '0.875rem',
            fontWeight: 600,
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}
        >
          <optgroup label={`Platforms (1 to ${station?.totalPlatforms || 18})`} style={{ background: '#ffffff', color: '#0369a1' }}>
            {platformDestinations.map(p => (
              <option key={p.id} value={p.id} style={{ background: '#ffffff', color: '#0f172a' }}>
                {p.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Station Amenities" style={{ background: '#ffffff', color: '#b45309' }}>
            {facilityDestinations.map(f => (
              <option key={f.id} value={f.id} style={{ background: '#ffffff', color: '#0f172a' }}>
                {f.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Quick Platform Buttons */}
      <div>
        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
          Quick Platform Jump (1 - {station?.totalPlatforms || 18})
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxHeight: '110px', overflowY: 'auto', paddingRight: '0.2rem' }}>
          {platformDestinations.map(p => {
            const isSelected = selectedDestinationId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedDestinationId(p.id);
                  onCalculateRoute(p.id, routeType);
                }}
                style={{
                  padding: '0.28rem 0.58rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isSelected ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                  background: isSelected ? '#0284c7' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#334155',
                  boxShadow: isSelected ? '0 2px 6px rgba(2, 132, 199, 0.3)' : '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease'
                }}
                title={p.name}
              >
                P{p.platformNumber}
              </button>
            );
          })}
        </div>
      </div>

      {/* Route Mode Buttons */}
      <div>
        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
          ROUTE TYPE
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.45rem' }}>
          {[
            { id: 'SHORTEST', label: 'Shortest Distance', desc: 'Minimal steps' },
            { id: 'FASTEST', label: 'Fastest Path', desc: 'Minimal walking time' },
            { id: 'ACCESSIBLE', label: 'Accessible (Lift/Ramp)', desc: 'Avoids stairs ♿' },
            { id: 'EMERGENCY', label: 'Emergency Exit', desc: 'Direct evacuation' }
          ].map(m => {
            const isSelected = routeType === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setRouteType(m.id);
                  onCalculateRoute(selectedDestinationId, m.id);
                }}
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                  background: isSelected ? '#f0f9ff' : '#ffffff',
                  color: isSelected ? '#0369a1' : '#334155',
                  textAlign: 'left',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 2px 6px rgba(2, 132, 199, 0.12)' : '0 1px 2px rgba(0,0,0,0.02)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{m.label}</div>
                <div style={{ fontSize: '0.68rem', color: isSelected ? '#0284c7' : '#64748b' }}>{m.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Calculated Metrics */}
      {calculatedRoute && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
          <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Distance to Platform</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
              {calculatedRoute.distance} <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>meters</span>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Est. Walking Time</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0284c7' }}>
              {Math.ceil(calculatedRoute.estimatedTime / 60)} <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>min ({calculatedRoute.estimatedTime}s)</span>
            </div>
          </div>
        </div>
      )}

      {/* Step-by-Step Directions */}
      {calculatedRoute && calculatedRoute.instructions && (
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem' }}>
          <h4 style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Turn-by-Turn Wayfinding Steps
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
            {calculatedRoute.instructions.map((step, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  color: '#1e293b',
                  padding: '0.4rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9'
                }}
              >
                <span className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: '#e0f2fe', color: '#0369a1' }}>
                  {i + 1}
                </span>
                <span style={{ lineHeight: '1.4' }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
