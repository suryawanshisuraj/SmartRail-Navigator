import React, { useState, useEffect } from 'react';
import { CreditCard, QrCode, Tag, CheckCircle, Ticket, Users, Percent, ShieldCheck } from 'lucide-react';
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
      const res = await calculateFareTariff(distanceKm, travelClass, isOffPeak, passengerType);
      if (res && res.success) {
        setFareData(res.fareSummary);
      }
    }
    updateFare();
  }, [distanceKm, travelClass, isOffPeak, passengerType]);

  const passengerCategories = [
    { id: 'ADULT', label: 'Adult', desc: 'Standard', discount: '0%' },
    { id: 'SENIOR', label: 'Senior Citizen', desc: 'Age 60+', discount: '30% Off' },
    { id: 'STUDENT', label: 'Student / Youth', desc: 'Valid ID Card', discount: '40% Off' },
    { id: 'CHILD', label: 'Child', desc: 'Under 12 Yrs', discount: '50% Off' }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '1.5rem', alignItems: 'start' }}>
      {/* Fare Configuration Form */}
      <div className="glass-panel" style={{ padding: '2rem', background: '#ffffff' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', color: '#0f172a' }}>
          <CreditCard size={20} color="var(--accent-cyan)" />
          <span>Fare & Dynamic Tariff Calculator</span>
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Distance Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label htmlFor="fare-distance-slider" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                TRAVEL DISTANCE
              </label>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '1rem' }}>
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
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              CABIN CLASS
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }} role="group" aria-label="Select Cabin Class">
              {[
                { id: 'STANDARD', label: 'Standard', desc: '1.0x Base' },
                { id: 'BUSINESS', label: 'Business', desc: '1.6x Base' },
                { id: 'FIRST', label: 'First Class', desc: '2.2x Luxury' }
              ].map(c => {
                const isSelected = travelClass === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setTravelClass(c.id)}
                    aria-pressed={isSelected}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                      background: isSelected ? '#f0f9ff' : '#ffffff',
                      color: isSelected ? '#0369a1' : '#334155',
                      boxShadow: isSelected ? '0 2px 6px rgba(2, 132, 199, 0.15)' : '0 1px 2px rgba(0,0,0,0.02)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{c.label}</div>
                    <div style={{ fontSize: '0.725rem', color: isSelected ? '#0284c7' : '#64748b', marginTop: '0.2rem' }}>{c.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Passenger Category Selection */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <Users size={16} color="var(--accent-cyan)" />
              <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                PASSENGER CONCESSION CATEGORY
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '0.6rem' }} role="group" aria-label="Select Passenger Category">
              {passengerCategories.map(p => {
                const isSelected = passengerType === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPassengerType(p.id)}
                    aria-pressed={isSelected}
                    style={{
                      padding: '0.65rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                      background: isSelected ? '#f0f9ff' : '#ffffff',
                      color: isSelected ? '#0369a1' : '#334155',
                      boxShadow: isSelected ? '0 2px 6px rgba(2, 132, 199, 0.12)' : '0 1px 2px rgba(0,0,0,0.02)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.825rem' }}>{p.label}</span>
                      {p.discount !== '0%' && (
                        <span className="badge badge-emerald" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                          {p.discount}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: isSelected ? '#0284c7' : '#64748b', marginTop: '0.15rem' }}>
                      {p.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Off-Peak and Discount Toggles */}
          <div style={{ display: 'flex', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
            <label htmlFor="fare-offpeak-checkbox" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', color: '#1e293b', fontWeight: 600 }}>
              <input
                id="fare-offpeak-checkbox"
                name="isOffPeak"
                type="checkbox"
                checked={isOffPeak}
                onChange={(e) => setIsOffPeak(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
              />
              <span>Off-Peak Non-Rush Hours (Additional 15% discount)</span>
            </label>
          </div>

          {/* Breakdown Table */}
          {fareData && (
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
              <h4 style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Official Tariff Pricing Breakdown
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Base Terminal Boarding Fee:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0f172a' }}>₹{fareData.basePrice.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Distance Slab Rate ({distanceKm} km):</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0f172a' }}>₹{fareData.distanceCharge.toFixed(2)}</span>
                </div>
                {fareData.discountApplied > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 700 }}>
                    <span>Discounts & Concessions Applied:</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>-₹{fareData.discountApplied.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Taxes & Regional Rail Surcharge (8%):</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0f172a' }}>₹{fareData.tax.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)', borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem', marginTop: '0.4rem' }}>
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

      {/* Generated Digital Boarding Pass Mockup (Clean Light Theme) */}
      <div className="glass-panel" style={{
        padding: '2rem',
        background: 'linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%)',
        border: '1.5px solid #bae6fd',
        boxShadow: '0 8px 24px rgba(2, 132, 199, 0.08)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#0284c7' }}>
            <Ticket size={22} />
            <span style={{ fontWeight: 800, letterSpacing: '0.05em', fontSize: '0.95rem' }}>SMARTRAIL E-PASS</span>
          </div>
          <span className="badge badge-emerald">Valid Suburban Ticket</span>
        </div>

        <div style={{ marginBottom: '1.5rem', background: '#ffffff', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>PNR RESERVATION CODE</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#0f172a', letterSpacing: '0.05em' }}>
            {pnrCode}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
          <div>
            <span style={{ color: '#64748b', fontWeight: 600 }}>CLASS:</span>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>{travelClass}</div>
          </div>
          <div>
            <span style={{ color: '#64748b', fontWeight: 600 }}>CATEGORY:</span>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>{passengerType}</div>
          </div>
          <div>
            <span style={{ color: '#64748b', fontWeight: 600 }}>DISTANCE:</span>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>{distanceKm} km</div>
          </div>
          <div>
            <span style={{ color: '#64748b', fontWeight: 600 }}>COACH / SEAT:</span>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>Coach 3, Seat 18A</div>
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
          marginBottom: '1rem',
          border: '1.5px dashed #cbd5e1'
        }}>
          <QrCode size={130} color="#0f172a" />
          <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            SCAN AT AUTOMATED FARE BARRIER (AFCS)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>
          <ShieldCheck size={14} />
          <span>Cryptographically Signed Offline Token</span>
        </div>
      </div>
    </div>
  );
}
