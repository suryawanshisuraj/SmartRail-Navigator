import React, { useState, useEffect } from 'react';
import { Radio, Gauge, MapPin, AlertTriangle, ShieldCheck, RefreshCw, Zap } from 'lucide-react';
import TRAINS_DATA from '../data/trains.json';

export default function LiveTrainTracker({ liveUpdates }) {
  const [trains, setTrains] = useState(TRAINS_DATA);
  const [selectedTrain, setSelectedTrain] = useState(TRAINS_DATA[0].id);

  // Sync real-time updates from WebSocket or periodic tick
  useEffect(() => {
    if (!liveUpdates || liveUpdates.length === 0) return;

    setTrains(prevTrains => {
      return prevTrains.map(train => {
        const update = liveUpdates.find(u => u.trainId === train.id);
        if (update) {
          return {
            ...train,
            speedKmph: update.speedKmph || train.speedKmph,
            delayMinutes: update.delayMinutes !== undefined ? update.delayMinutes : train.delayMinutes,
            progress: update.progress || 0.45,
            status: update.status || train.status,
            coordinates: update.coordinates || train.coordinates
          };
        }
        return train;
      });
    });
  }, [liveUpdates]);

  const active = trains.find(t => t.id === selectedTrain) || trains[0];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.5rem', alignItems: 'start' }}>
      {/* Train Fleet Selector */}
      <div className="glass-panel" style={{ padding: '1.5rem', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#0f172a' }}>
            <Radio size={20} color="var(--accent-cyan)" />
            <span>Active Rail Fleet</span>
          </h2>
          <span className="badge badge-cyan">{trains.length} Online</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} role="group" aria-label="Select Active Train">
          {trains.map(train => {
            const isSelected = train.id === selectedTrain;
            const isDelayed = train.delayMinutes > 0;
            return (
              <button
                key={train.id}
                type="button"
                onClick={() => setSelectedTrain(train.id)}
                aria-pressed={isSelected}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                  background: isSelected ? '#f0f9ff' : '#ffffff',
                  color: '#0f172a',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: isSelected ? '0 2px 8px rgba(2, 132, 199, 0.15)' : '0 1px 2px rgba(0, 0, 0, 0.02)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.2rem', color: isSelected ? '#0369a1' : '#0f172a' }}>
                    {train.serviceName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {train.origin} → {train.destination}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${isDelayed ? 'badge-amber' : 'badge-emerald'}`}>
                    {isDelayed ? `+${train.delayMinutes}m Late` : 'On Time'}
                  </span>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#475569', marginTop: '0.3rem' }}>
                    {train.speedKmph} km/h
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Train Telemetry Dashboard */}
      <div className="glass-panel" style={{ padding: '2rem', background: '#ffffff' }}>
        {/* Header telemetry badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span className="badge" style={{ background: `${active.color}18`, color: active.color, border: `1px solid ${active.color}35`, fontWeight: 800 }}>
                {active.lineName}
              </span>
              <span className="badge badge-cyan">{active.trainType}</span>
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{active.serviceName}</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
              Corridor: {active.origin} to {active.destination}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ecfdf5', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid #a7f3d0' }}>
            <div className="pulse-dot" style={{ background: '#059669', width: '8px', height: '8px', borderRadius: '50%' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#047857' }}>
              GPS Satellite Lock: Active
            </span>
          </div>
        </div>

        {/* Telemetry Metrics Grid (Responsive) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Gauge size={14} color="#0284c7" /> Live Speed
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#0f172a', marginTop: '0.25rem' }}>
              {active.speedKmph} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>km/h</span>
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Schedule Adherence</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.45rem' }}>
              <span className={`badge ${active.delayMinutes > 0 ? 'badge-amber' : 'badge-emerald'}`} style={{ fontSize: '0.85rem' }}>
                {active.delayMinutes > 0 ? `Delayed ${active.delayMinutes}m` : 'Perfect Schedule'}
              </span>
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={14} color="#d97706" /> Next Station Stop
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '0.45rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {active.nextStop}
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Signal Block State</div>
            <div style={{ fontSize: '0.925rem', fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.45rem' }}>
              <Zap size={16} /> Block Green Clear
            </div>
          </div>
        </div>

        {/* Route Progress Bar Simulation */}
        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 800, color: '#0f172a' }}>{active.origin}</span>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Track Progress: {Math.round((active.progress || 0.45) * 100)}%</span>
            <span style={{ fontWeight: 800, color: '#0f172a' }}>{active.destination}</span>
          </div>

          <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: 'var(--radius-full)', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              width: `${(active.progress || 0.45) * 100}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${active.color}, #0284c7)`,
              borderRadius: 'var(--radius-full)',
              transition: 'width 1s linear'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', fontSize: '0.78rem', color: '#64748b', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span>Departed: 13:55</span>
            <span style={{ color: '#0284c7', fontWeight: 700 }}>Approaching Signal Junction 4</span>
            <span>Est. Arrival: 14:48</span>
          </div>
        </div>
      </div>
    </div>
  );
}
