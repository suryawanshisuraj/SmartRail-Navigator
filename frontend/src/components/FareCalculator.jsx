import React, { useState, useEffect } from 'react';
import { CreditCard, QrCode, Tag, CheckCircle, Ticket } from 'lucide-react';
import { calculateFareTariff } from '../services/transitService';

export default function FareCalculator({ initialDistanceKm = 45 }) {
  const [distanceKm, setDistanceKm] = useState(initialDistanceKm);
  const [travelClass, setTravelClass] = useState('STANDARD');
  const [isOffPeak, setIsOffPeak] = useState(false);
  const [passengerType, setPassengerType] = useState('ADULT');
  const [fareData, setFareData] = useState(null);
  const [pnrCode] = useState('SRN-' + Math.floor(100000 + Math.random() * 900000));

  useEffect(() => {
    async function updateFare() {
      const res = await calculateFareTariff(distanceKm, travelClass, isOffPeak);
      if (res && res.success) {
        setFareData(res.fareSummary);
      }
    }
    updateFare();
  }, [distanceKm, travelClass, isOffPeak, passengerType]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '1.5rem', alignItems: 'start' }}>
      {/* Fare Configuration Form */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <CreditCard size={20} color="var(--accent-cyan)" />
          <span>Fare & Dynamic Tariff Calculator</span>
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Distance Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label htmlFor="fare-distance-slider" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                TRAVEL DISTANCE
              </label>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {distanceKm} km
              </span>
            </div>
            <input
              id="fare-distance-slider"
              name="distanceKm"
              aria-label="Travel distance in kilometers"
              type="range"
              min="5"
              max="250"
              step="5"
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
            />
          </div>

          {/* Travel Class Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              CABIN CLASS
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }} role="group" aria-label="Select Cabin Class">
              {[
                { id: 'STANDARD', label: 'Standard', desc: '1.0x Base' },
                { id: 'BUSINESS', label: 'Business', desc: '1.6x Base' },
                { id: 'FIRST', label: 'First Class', desc: '2.2x Luxury' }
              ].map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setTravelClass(c.id)}
                  aria-pressed={travelClass === c.id}
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: travelClass === c.id ? '1px solid var(--accent-cyan)' : '1px solid var(--border-glass)',
                    background: travelClass === c.id ? 'var(--accent-cyan-glow)' : 'rgba(255, 255, 255, 0.02)',
                    color: travelClass === c.id ? '#ffffff' : 'var(--text-secondary)',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{c.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{c.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Off-Peak and Discount Toggles */}
          <div style={{ display: 'flex', gap: '1rem', background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
            <label htmlFor="fare-offpeak-checkbox" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem' }}>
              <input
                id="fare-offpeak-checkbox"
                name="isOffPeak"
                type="checkbox"
                checked={isOffPeak}
                onChange={(e) => setIsOffPeak(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-emerald)' }}
              />
              <span>Off-Peak Hours (15% discount)</span>
            </label>
          </div>

          {/* Breakdown Table */}
          {fareData && (
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Pricing Breakdown
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Base Boarding Fare:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>₹{fareData.basePrice.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Distance Charge ({distanceKm} km):</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>₹{fareData.distanceCharge.toFixed(2)}</span>
                </div>
                {fareData.discountApplied > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                    <span>Discounts Applied:</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>-₹{fareData.discountApplied.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Taxes & Regional Rail Surcharge (8%):</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>₹{fareData.tax.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', borderTop: '1px solid var(--border-glass)', paddingTop: '0.6rem', marginTop: '0.4rem' }}>
                  <span>Total Payable:</span>
                  <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                    ₹{fareData.totalFare.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generated Digital Boarding Pass Mockup */}
      <div className="glass-panel" style={{ padding: '2rem', background: 'linear-gradient(180deg, rgba(26, 36, 56, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)', border: '1px solid var(--border-active)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)' }}>
            <Ticket size={20} />
            <span style={{ fontWeight: 800, letterSpacing: '0.05em', fontSize: '0.9rem' }}>SMART PASS</span>
          </div>
          <span className="badge badge-emerald">Valid E-Ticket</span>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PNR RESERVATION CODE</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
            {pnrCode}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>CLASS:</span>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{travelClass}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>SEAT ASSIGNMENT:</span>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Coach 3, Seat 18A</div>
          </div>
        </div>

        {/* QR Code Graphic Box */}
        <div style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem'
        }}>
          <QrCode size={130} color="#0b1120" />
          <span style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.5rem', fontFamily: 'var(--font-mono)' }}>
            SCAN AT AUTOMATED FARE BARRIER
          </span>
        </div>

        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Pass is cryptographically signed and stored in local client cache for offline barrier validation.
        </p>
      </div>
    </div>
  );
}
