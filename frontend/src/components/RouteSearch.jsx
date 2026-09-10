import React, { useState } from 'react';
import { ArrowRightLeft, Clock, Navigation2, ShieldCheck, Footprints, AlertCircle } from 'lucide-react';
import { searchRoute } from '../services/transitService';

export default function RouteSearch({ stations, accessibleMode, onSelectStationForMap, onSelectLegForFare }) {
  const [origin, setOrigin] = useState('STN_METRO_CENTRAL');
  const [destination, setDestination] = useState('STN_NORTH_GATE');
  const [preference, setPreference] = useState('fastest');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [itineraryResult, setItineraryResult] = useState(null);

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await searchRoute(origin, destination, {
        preference,
        accessible: accessibleMode
      });

      if (!res.success) {
        setError(res.error || 'No route found for selected stations.');
        setItineraryResult(null);
      } else {
        setItineraryResult(res.itinerary);
      }
    } catch (err) {
      setError(err.message || 'Error occurred while querying routes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: '2rem', alignItems: 'start' }}>
      {/* Search Controls Panel */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Navigation2 size={20} color="var(--accent-cyan)" />
          <span>Plan Journey</span>
        </h2>

        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Origin */}
          <div>
            <label htmlFor="origin-select" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              DEPARTURE STATION
            </label>
            <select
              id="origin-select"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.925rem'
              }}
            >
              {stations.map(stn => (
                <option key={stn.id} value={stn.id}>
                  {stn.name} ({stn.city}) {stn.isWheelchairAccessible ? '♿' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleSwap}
              aria-label="Swap origin and destination stations"
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-full)' }}
            >
              <ArrowRightLeft size={16} />
              <span style={{ fontSize: '0.75rem' }}>Swap</span>
            </button>
          </div>

          {/* Destination */}
          <div>
            <label htmlFor="dest-select" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              DESTINATION STATION
            </label>
            <select
              id="dest-select"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.925rem'
              }}
            >
              {stations.map(stn => (
                <option key={stn.id} value={stn.id}>
                  {stn.name} ({stn.city}) {stn.isWheelchairAccessible ? '♿' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Routing Preferences */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              ROUTING PREFERENCE
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {[
                { id: 'fastest', label: 'Fastest' },
                { id: 'least_transfers', label: 'Fewest Transfers' },
                { id: 'cheapest', label: 'Cheapest' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPreference(opt.id)}
                  style={{
                    padding: '0.5rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    border: preference === opt.id ? '1px solid var(--accent-cyan)' : '1px solid var(--border-glass)',
                    background: preference === opt.id ? 'var(--accent-cyan-glow)' : 'rgba(255, 255, 255, 0.03)',
                    color: preference === opt.id ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {accessibleMode && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#34d399',
              fontSize: '0.78rem'
            }}>
              <ShieldCheck size={16} />
              <span>Step-free accessibility routing strictly enforced.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }}
          >
            {loading ? 'Finding Best Routes...' : 'Search Train Routes'}
          </button>
        </form>
      </div>

      {/* Itinerary Results Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {error && (
          <div className="glass-panel" style={{ padding: '1.5rem', borderColor: 'rgba(244, 63, 94, 0.4)', background: 'rgba(244, 63, 94, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#fb7185' }}>
              <AlertCircle size={20} />
              <span style={{ fontWeight: 600 }}>{error}</span>
            </div>
          </div>
        )}

        {!itineraryResult && !error && (
          <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <Navigation2 size={42} color="var(--accent-cyan)" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Ready to Navigate</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto', fontSize: '0.875rem' }}>
              Select departure and arrival hubs above to view optimized train schedules, transfer platform numbers, and step-free travel routes.
            </p>
          </div>
        )}

        {itineraryResult && (
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            {/* Header Metrics */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <span className="badge badge-emerald" style={{ marginBottom: '0.4rem' }}>
                  Optimal Transit Solution
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                  {itineraryResult.origin.name} → {itineraryResult.destination.name}
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  ${itineraryResult.estimatedFare.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Fare</div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Duration</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                  <Clock size={16} color="var(--accent-gold)" />
                  {itineraryResult.totalDurationMinutes} mins
                </div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Distance</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                  {itineraryResult.totalDistanceKm} km
                </div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Transfers</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.2rem' }}>
                  {itineraryResult.transferCount === 0 ? 'Direct Ride' : `${itineraryResult.transferCount} Transfer(s)`}
                </div>
              </div>
            </div>

            {/* Leg Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Journey Segments
              </h4>

              {itineraryResult.legs.map((leg, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <span className="badge badge-cyan" style={{ marginBottom: '0.35rem' }}>
                        {leg.lineName}
                      </span>
                      <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                        {leg.fromStationName} → {leg.toStationName}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {leg.durationMinutes} mins
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div>
                      Board at: <strong style={{ color: 'var(--text-primary)' }}>{leg.fromPlatform}</strong>
                    </div>
                    <div>
                      Arrive at: <strong style={{ color: 'var(--text-primary)' }}>{leg.toPlatform}</strong>
                    </div>
                    {leg.isAccessible && (
                      <div style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ShieldCheck size={14} /> Step-Free
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick action bar */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-glass)' }}>
              <button
                type="button"
                onClick={() => onSelectStationForMap(itineraryResult.origin.id)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                <Footprints size={16} />
                <span>Station Concourse Map</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectLegForFare(itineraryResult.totalDistanceKm)}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                <span>Preview Fare & Passes</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
