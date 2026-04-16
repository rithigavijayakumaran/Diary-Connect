import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ─── Contact Importer Modal (for manufacturers) ───────────────────────────────
function ContactModal({ importer, onClose, token }) {
  const [form, setForm] = useState({
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          receiverId: importer._id,
          content: `Subject: ${form.subject}\n\n${form.message}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(`Message sent to ${importer.company}`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Contact Importer</h2>
            <p className="modal-sub">{importer.company} · {importer.country}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="match-importer-summary">
            <div className="mis-row">
              <span className="mis-label">Company</span>
              <span className="mis-val">{importer.company}</span>
            </div>
            <div className="mis-row">
              <span className="mis-label">Location</span>
              <span className="mis-val">{importer.country}</span>
            </div>
            {importer.importerProfile?.preferredCategories?.length > 0 && (
              <div className="mis-row">
                <span className="mis-label">Interested in</span>
                <div className="tag-list">
                  {importer.importerProfile.preferredCategories.map(c => (
                    <span key={c} className="tag">{c}</span>
                  ))}
                </div>
              </div>
            )}
            {importer.importerProfile?.annualImportVolume && (
              <div className="mis-row">
                <span className="mis-label">Import Volume</span>
                <span className="mis-val">{importer.importerProfile.annualImportVolume}</span>
              </div>
            )}
            {importer.importerProfile?.regulatoryMarkets?.length > 0 && (
              <div className="mis-row">
                <span className="mis-label">Markets</span>
                <div className="tag-list">
                  {importer.importerProfile.regulatoryMarkets.map(m => (
                    <span key={m} className="tag">{m}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="divider" />

          <div className="form-group">
            <label className="form-label">Subject</label>
            <input
              className="form-input"
              placeholder="e.g. Ghee export inquiry – 50 MT/month"
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea
              className="form-textarea"
              rows={5}
              placeholder={`Hi ${importer.name || importer.company},\n\nWe are a verified dairy manufacturer from India. We'd like to discuss export opportunities for your market...`}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            />
            <p className="form-hint">Introduce your company and the products you can supply.</p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Sending…</> : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── RFQ Modal (for importers) ────────────────────────────────────────────────
function RFQModal({ product, onClose, token }) {
  const [form, setForm] = useState({
    title: `RFQ – ${product.name}`,
    productCategory: product.category,
    quantity: '',
    quantityUnit: 'MT',
    targetPrice: '',
    currency: 'USD',
    deliveryPort: '',
    paymentTerms: '',
    specialRequirements: '',
    certificationRequired: [],
  });
  const [loading, setLoading] = useState(false);
  const CERTS = ['FSSAI', 'APEDA', 'ISO_9001', 'ISO_22000', 'HALAL', 'KOSHER', 'ORGANIC', 'FDA'];

  const toggleCert = cert => setForm(f => ({
    ...f,
    certificationRequired: f.certificationRequired.includes(cert)
      ? f.certificationRequired.filter(c => c !== cert)
      : [...f.certificationRequired, cert]
  }));

  const handleSubmit = async () => {
    if (!form.quantity) { toast.error('Quantity is required'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/rfq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          manufacturer: product.manufacturer._id,
          product: product._id,
          quantity: Number(form.quantity),
          targetPrice: form.targetPrice ? Number(form.targetPrice) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('RFQ sent successfully!');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to send RFQ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Send RFQ</h2>
            <p className="modal-sub">{product.name} · {product.manufacturer?.company}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="grid-2" style={{ gap: 16 }}>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">RFQ Title</label>
              <input className="form-input" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Quantity <span style={{ color: '#dc2626' }}>*</span></label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="form-input" type="number" placeholder="e.g. 50"
                  value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                <select className="form-select" style={{ width: 90 }}
                  value={form.quantityUnit} onChange={e => setForm(f => ({ ...f, quantityUnit: e.target.value }))}>
                  <option>MT</option><option>KG</option><option>L</option><option>Units</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Target Price (optional)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="form-input" type="number" placeholder="e.g. 3500"
                  value={form.targetPrice} onChange={e => setForm(f => ({ ...f, targetPrice: e.target.value }))} />
                <select className="form-select" style={{ width: 90 }}
                  value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                  <option>USD</option><option>EUR</option><option>GBP</option><option>INR</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Delivery Port</label>
              <input className="form-input" placeholder="e.g. Dubai, Jebel Ali"
                value={form.deliveryPort} onChange={e => setForm(f => ({ ...f, deliveryPort: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Terms</label>
              <select className="form-select" value={form.paymentTerms}
                onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))}>
                <option value="">Select…</option>
                <option>LC at sight</option><option>LC 30 days</option>
                <option>TT in advance</option><option>TT 30 days</option><option>Open account</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Certifications Required</label>
              <div className="cert-toggle-group">
                {CERTS.map(c => (
                  <button key={c}
                    className={`cert-toggle${form.certificationRequired.includes(c) ? ' active' : ''}`}
                    onClick={() => toggleCert(c)}>{c}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Special Requirements</label>
              <textarea className="form-textarea" rows={3}
                placeholder="Packaging, labelling, shelf life, or any other requirements…"
                value={form.specialRequirements}
                onChange={e => setForm(f => ({ ...f, specialRequirements: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Sending…</> : 'Send RFQ'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Match Score Bar ──────────────────────────────────────────────────────────
function ScoreBar({ score }) {
  const shade = score >= 80 ? '#0a0a0a' : score >= 50 ? '#404040' : '#a3a3a3';
  return (
    <div className="match-score-row">
      <div className="match-score-track">
        <div className="match-score-fill" style={{ width: `${score}%`, background: shade }} />
      </div>
      <span className="match-score-pct" style={{ color: shade }}>{score}%</span>
    </div>
  );
}

// ─── Match Card ───────────────────────────────────────────────────────────────
function MatchCard({ item, rank, role, onAction }) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  // For manufacturer: item is an importer user object
  // For importer: item is a product object
  const isManufacturer = role === 'manufacturer';

  const title        = isManufacturer ? item.company        : item.name;
  const subtitle     = isManufacturer ? item.country        : item.manufacturer?.company;
  const countryBadge = isManufacturer ? item.country        : item.manufacturer?.country;

  const tags = isManufacturer
    ? (item.importerProfile?.preferredCategories || [])
    : (item.certifications || []);

  const markets = isManufacturer
    ? (item.importerProfile?.regulatoryMarkets || [])
    : [];

  const volumeOrPrice = isManufacturer
    ? item.importerProfile?.annualImportVolume
    : item.pricing?.basePrice
      ? `$${item.pricing.basePrice.toLocaleString()} / ${item.pricing.unit || 'MT'}`
      : null;

  const actionLabel = isManufacturer ? 'Contact Importer' : 'Send RFQ';

  return (
    <div className="match-card">
      <div className="match-card-top">
        <div className="match-card-meta">
          <span className="match-rank">#{rank}</span>
          <div>
            <div className="match-card-title">
              {title}
              {countryBadge && <span className="match-country-badge">{countryBadge}</span>}
            </div>
            {subtitle && <div className="match-card-sub">{subtitle}</div>}
          </div>
        </div>
        {volumeOrPrice && <div className="match-volume">{volumeOrPrice}</div>}
      </div>

      {tags.length > 0 && (
        <div className="tag-list" style={{ margin: '10px 0 4px' }}>
          {tags.slice(0, 5).map(t => <span key={t} className="tag">{t}</span>)}
          {markets.map(m => <span key={m} className="tag tag-market">{m}</span>)}
        </div>
      )}

      <ScoreBar score={item.matchScore} />

      {/* Breakdown toggle */}
      {item.matchBreakdown?.length > 0 && (
        <div>
          <button className="breakdown-toggle" onClick={() => setShowBreakdown(s => !s)}>
            {showBreakdown ? '▲ Hide' : '▼ Why this match?'}
          </button>
          {showBreakdown && (
            <div className="breakdown-list">
              {item.matchBreakdown.map((b, i) => (
                <div key={i} className="breakdown-item">
                  <span className="breakdown-reason">✓ {b.reason}</span>
                  <span className="breakdown-pts">+{b.pts}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="match-card-footer">
        <button className="btn btn-primary btn-sm" onClick={() => onAction(item)}>
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AIMatch() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [matches, setMatches]     = useState([]);
  const [meta, setMeta]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [selected, setSelected]   = useState(null); // item for modal
  const [showModal, setShowModal] = useState(false);

  const role = user?.role;

  // Manufacturers should NOT be on the importer RFQ side
  // They see matched importers and contact them
  useEffect(() => {
    if (!token || !role) return;
    if (role === 'admin') { navigate('/dashboard'); return; }

    const endpoint = role === 'manufacturer' ? '/match/importers' : '/match/products';

    fetch(`${API}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        if (!d.success) throw new Error(d.message);
        setMatches(d.data || []);
        setMeta(d.meta || null);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [token, role, navigate]);

  const handleAction = (item) => {
    setSelected(item);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setSelected(null); };

  if (loading) return (
    <div className="loading-page">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 16px' }} />
        <p style={{ color: '#737373', fontSize: 14 }}>Running match engine…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="page"><div className="container">
      <div className="card" style={{ color: '#dc2626' }}>Error: {error}</div>
    </div></div>
  );

  const pageTitle    = role === 'manufacturer' ? 'AI Match Engine' : 'Recommended Suppliers';
  const pageSubtitle = role === 'manufacturer'
    ? 'Importers most likely to be interested in your products'
    : 'Products matched to your preferences and sourcing history';

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>{pageTitle}</h1>
          <p>{pageSubtitle}</p>
        </div>

        {/* Maturity banner */}
        {meta && (
          <div className={`match-meta-banner ${meta.profileMaturity}`}>
            <div className="match-meta-left">
              <span className="match-maturity-dot" />
              <span className="match-maturity-label">
                {meta.profileMaturity === 'new'        && 'Getting started'}
                {meta.profileMaturity === 'learning'   && 'Learning your preferences'}
                {meta.profileMaturity === 'calibrated' && 'Fully calibrated'}
              </span>
            </div>
            <p className="match-meta-note">{meta.note}</p>
          </div>
        )}

        {/* How it works note */}
        <div className="match-how-it-works">
          <strong>How matching works: </strong>
          {role === 'manufacturer'
            ? 'Importers are scored based on category interest overlap, regulatory market alignment, import volume, and your shared trade history. Scores improve as you receive and respond to more RFQs.'
            : 'Products are scored based on your category preferences, required certifications, past RFQs, and supplier history. Scores improve the more you use the platform.'
          }
        </div>

        {/* Match list */}
        {matches.length === 0 ? (
          <div className="empty">
            <h3>No matches yet</h3>
            <p>
              {role === 'manufacturer'
                ? 'Add active products to start receiving importer matches.'
                : 'Update your importer profile with preferred categories to see matches.'}
            </p>
          </div>
        ) : (
          <div className="match-list">
            {matches.map((item, i) => (
              <MatchCard
                key={item._id}
                item={item}
                rank={i + 1}
                role={role}
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal — Contact (manufacturer) or RFQ (importer) */}
      {showModal && selected && (
        role === 'manufacturer'
          ? <ContactModal importer={selected} onClose={closeModal} token={token} />
          : <RFQModal product={selected} onClose={closeModal} token={token} />
      )}
    </div>
  );
}