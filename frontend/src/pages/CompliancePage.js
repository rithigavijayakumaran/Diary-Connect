import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const CERTS = ['FSSAI','APEDA','ISO_9001','ISO_22000','HALAL','KOSHER','ORGANIC','FDA'];

export default function CompliancePage() {
  const { user } = useAuth();
  const [markets, setMarkets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [certs, setCerts] = useState(user?.manufacturerProfile?.certifications || []);
  const [checkResult, setCheckResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get('/api/compliance/markets').then(r => setMarkets(r.data.data));
  }, []);

  const selectMarket = async (code) => {
    setSelected(code);
    setCheckResult(null);
    const res = await axios.get(`/api/compliance/${code}`);
    setMarketData(res.data.data);
  };

  const checkCompliance = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await axios.post('/api/compliance/check', { market: selected, certifications: certs });
      setCheckResult(res.data.data);
    } finally { setLoading(false); }
  };

  const toggleCert = c => setCerts(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  return (
    <div>
      <div className="page-header">
        <h1>Regulatory Compliance Wizard</h1>
        <p>Check export requirements for any target market before you ship</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
        <div>
          {/* Market selector */}
          <div className="card" style={{ marginBottom: 16 }}>
            <p className="section-title">Select Target Market</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {markets.map(m => (
                <button key={m.code} onClick={() => selectMarket(m.code)}
                  style={{
                    padding: '14px 12px', border: `1.5px solid ${selected === m.code ? 'var(--black)' : 'var(--gray-200)'}`,
                    borderRadius: 'var(--radius-lg)', background: selected === m.code ? 'var(--gray-100)' : 'var(--white)',
                    cursor: 'pointer', textAlign: 'left', transition: 'all var(--transition)'
                  }}>
                  <div style={{ fontSize: '1.1rem', marginBottom: 4 }}>{m.flag}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-800)' }}>{m.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 2 }}>Duty: {m.importDuty}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Market requirements */}
          {marketData && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="flex-between" style={{ marginBottom: 16 }}>
                <div>
                  <p className="section-title">Requirements for {marketData.name}</p>
                  <div style={{ display: 'flex', gap: 20, fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                    <span>Import Duty: <strong style={{ color: 'var(--gray-800)' }}>{marketData.importDuty}</strong></span>
                    <span>Processing: <strong style={{ color: 'var(--gray-800)' }}>{marketData.processingTime}</strong></span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                {marketData.requirements.map((req, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                      background: req.required ? 'var(--black)' : 'var(--gray-200)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '0.65rem', color: req.required ? 'var(--white)' : 'var(--gray-500)', fontWeight: 700 }}>{req.required ? '!' : 'o'}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{req.cert}</span>
                        <span style={{ fontSize: '0.75rem', padding: '1px 8px', borderRadius: 10, background: req.required ? 'var(--gray-900)' : 'var(--gray-100)', color: req.required ? 'var(--white)' : 'var(--gray-500)' }}>
                          {req.required ? 'Required' : 'Optional'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{req.description}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: 2 }}>Authority: {req.authority}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Restrictions */}
              {marketData.restrictions?.length > 0 && (
                <div style={{ padding: '12px 14px', background: 'var(--gray-50)', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-600)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Restrictions</div>
                  {marketData.restrictions.map((r, i) => (
                    <div key={i} style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: 4, display: 'flex', gap: 8 }}>
                      <span style={{ color: 'var(--gray-400)' }}>—</span>{r}
                    </div>
                  ))}
                </div>
              )}

              {marketData.notes && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--white)', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)', fontSize: '0.8125rem', color: 'var(--gray-600)', lineHeight: 1.6 }}>
                  <strong>Market Note:</strong> {marketData.notes}
                </div>
              )}
            </div>
          )}

          {/* Check result */}
          {checkResult && (
            <div className="card" style={{ borderLeft: `3px solid ${checkResult.readyToExport ? 'var(--black)' : 'var(--gray-400)'}` }}>
              <div className="flex-between" style={{ marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>
                    {checkResult.readyToExport ? '✓ Export Ready' : '⚠ Gaps Found'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                    {checkResult.readyToExport ? `You meet all requirements for ${checkResult.market}` : `${checkResult.missingCount} required certification(s) missing`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--black)' }}>{checkResult.score}%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>compliance score</div>
                </div>
              </div>
              <div style={{ height: 6, background: 'var(--gray-100)', borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ height: '100%', width: `${checkResult.score}%`, background: 'var(--black)', borderRadius: 3, transition: 'width 0.6s ease' }} />
              </div>
              <div>
                {checkResult.requirements.map((r, i) => (
                  <div key={i} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--gray-100)', fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: 500 }}>{r.cert}</span>
                    <span style={{
                      padding: '2px 10px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 500,
                      background: r.status === 'met' ? 'var(--black)' : r.status === 'optional' ? 'var(--gray-100)' : 'var(--gray-200)',
                      color: r.status === 'met' ? 'var(--white)' : r.status === 'optional' ? 'var(--gray-500)' : 'var(--gray-600)'
                    }}>
                      {r.status === 'met' ? '✓ Met' : r.status === 'optional' ? 'Optional' : '✗ Missing'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: cert checker */}
        <div>
          <div className="card" style={{ position: 'sticky', top: 80 }}>
            <p className="section-title">Your Certifications</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', marginBottom: 14 }}>
              {user?.role === 'manufacturer' ? 'Select your current certifications to check export readiness.' : 'Tick certifications required from your supplier.'}
            </p>
            <div style={{ marginBottom: 16 }}>
              {CERTS.map(c => (
                <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--gray-100)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={certs.includes(c)} onChange={() => toggleCert(c)}
                    style={{ accentColor: 'var(--black)', width: 15, height: 15 }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>{c}</span>
                </label>
              ))}
            </div>
            <button className="btn btn-primary btn-full" onClick={checkCompliance} disabled={!selected || loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Check Compliance'}
            </button>
            {!selected && <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: 8, textAlign: 'center' }}>Select a market first</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
