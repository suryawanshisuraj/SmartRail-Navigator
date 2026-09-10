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
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '2rem', alignItems: 'start' }}>
      {/* Train Fleet Selector */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Radio size={20} color="var(--accent-cyan)" />
            <span>Active Rail Fleet</span>
          </h2>
          <span className="badge badge-cyan">{trains.length} Online</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {trains.map(train => {
            const isSelected = train.id === selectedTrain;
            const isDelayed = train.delayMinutes > 0;
            return (
              <button
                key={train.id}
                type="button"
                onClick={() => setSelectedTrain(train.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-glass)',
                  background: isSelected ? 'var(--accent-cyan-glow)' : 'rgba(255, 255, 255, 0.02)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                    {train.serviceName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {train.origin} → {train.destination}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${isDelayed ? 'badge-amber' : 'badge-emerald'}`}>
                    {isDelayed ? `+${train.delayMinutes}m Late` : 'On Time'}
                  </span>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    {train.speedKmph} km/h
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Train Telemetry Dashboard */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        {/* Header telemetry badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span className="badge" style={{ background: `${active.color}22`, color: active.color, border: `1px solid ${active.color}44` }}>
                {active.lineName}
              </span>
              <span className="badge badge-cyan">{active.trainType}</span>
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{active.serviceName}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Corridor: {active.origin} to {active.destination}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-glass)' }}>
            <div className="pulse-dot" style={{ background: 'var(--accent-emerald)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              GPS Satellite Lock: Active
            </span>
          </div>
        </div>

        {/* Telemetry Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Gauge size={14} color="var(--accent-cyan)" /> Live Speed
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {active.speedKmph} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>km/h</span>
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Schedule Adherence</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '0.45rem' }}>
              <span className={`badge ${active.delayMinutes > 0 ? 'badge-amber' : 'badge-emerald'}`} style={{ fontSize: '0.9rem' }}>
                {active.delayMinutes > 0 ? `Delayed ${active.delayMinutes}m` : 'Perfect Schedule'}
              </span>
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={14} color="var(--accent-gold)" /> Next Station Stop
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.45rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {active.nextStop}
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Signal Block State</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.45rem' }}>
              <Zap size={16} /> Block Green Clear
            </div>
          </div>
        </div>

        {/* Route Progress Bar Simulation */}
        <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 600 }}>{active.origin}</span>
            <span style={{ color: 'var(--text-secondary)' }}>Track Progress: {Math.round((active.progress || 0.45) * 100)}%</span>
            <span style={{ fontWeight: 600 }}>{active.destination}</span>
          </div>

          <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-full)', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              width: `${(active.progress || 0.45) * 100}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${active.color}, var(--accent-cyan))`,
              borderRadius: 'var(--radius-full)',
              transition: 'width 1s linear'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>Departed: 13:55</span>
            <span style={{ color: 'var(--accent-cyan)' }}>Approaching Signal Junction 4</span>
            <span>Est. Arrival: 14:48</span>
          </div>
        </div>
      </div>
    </div>
  );
}
