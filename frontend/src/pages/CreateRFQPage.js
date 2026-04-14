import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const CATEGORIES = ['Ghee','Skimmed Milk Powder','Whole Milk Powder','Butter','Cheese','Paneer','Whey Protein','Casein','UHT Milk','Condensed Milk','Lactose','Cream','Yogurt'];
const CERTS = ['FSSAI','APEDA','ISO_9001','ISO_22000','HALAL','KOSHER','ORGANIC','FDA'];

export default function CreateRFQPage() {
  const { manufacturerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const product = location.state?.product;

  const [mfr, setMfr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: product ? `Inquiry for ${product.name}` : '',
    productCategory: product?.category || '',
    quantity: '', quantityUnit: 'MT',
    targetPrice: '', currency: 'USD',
    deliveryPort: '', paymentTerms: '',
    specialRequirements: '',
    certificationRequired: []
  });

  useEffect(() => {
    axios.get('/api/auth/manufacturers').then(r => {
      setMfr(r.data.data.find(m => m._id === manufacturerId));
    });
  }, [manufacturerId]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleCert = c => set('certificationRequired', form.certificationRequired.includes(c) ? form.certificationRequired.filter(x => x !== c) : [...form.certificationRequired, c]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        manufacturer: manufacturerId,
        product: product?._id,
        quantity: Number(form.quantity),
        targetPrice: form.targetPrice ? Number(form.targetPrice) : undefined
      };
      const res = await axios.post('/api/rfq', payload);
      toast.success('RFQ sent successfully!');
      navigate(`/rfq/${res.data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send RFQ');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ marginBottom: 20, fontSize: '0.85rem', color: 'var(--gray-400)' }}>
        <Link to="/catalog" style={{ color: 'var(--gray-400)' }}>Catalog</Link> › Send RFQ
      </div>

      <div className="page-header">
        <h1>Send Request for Quotation</h1>
        {mfr && <p>To: <span style={{ color: 'var(--gray-800)', fontWeight: 500 }}>{mfr.company}</span> · {mfr.country}</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: 16 }}>
            <p className="section-title">RFQ Details</p>
            <div className="form-group">
              <label className="form-label">RFQ Title *</label>
              <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} required placeholder="e.g. Ghee 20MT Monthly Contract" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Product Category *</label>
                <select className="form-select" value={form.productCategory} onChange={e => set('productCategory', e.target.value)} required>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Quantity Required *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} required placeholder="20" />
                  <select className="form-select" style={{ width: 80 }} value={form.quantityUnit} onChange={e => set('quantityUnit', e.target.value)}>
                    <option>MT</option><option>KG</option><option>Litre</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Target Price (per {form.quantityUnit})</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" type="number" value={form.targetPrice} onChange={e => set('targetPrice', e.target.value)} placeholder="2600" />
                  <select className="form-select" style={{ width: 80 }} value={form.currency} onChange={e => set('currency', e.target.value)}>
                    <option>USD</option><option>EUR</option><option>INR</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Delivery Port</label>
                <input className="form-input" value={form.deliveryPort} onChange={e => set('deliveryPort', e.target.value)} placeholder="e.g. Jebel Ali, Dubai" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Terms</label>
              <select className="form-select" value={form.paymentTerms} onChange={e => set('paymentTerms', e.target.value)}>
                <option value="">Select...</option>
                <option>LC at sight</option>
                <option>LC 30 days</option>
                <option>LC 60 days</option>
                <option>T/T 30 days</option>
                <option>T/T 50% advance</option>
                <option>Open account</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Special Requirements</label>
              <textarea className="form-textarea" value={form.specialRequirements} onChange={e => set('specialRequirements', e.target.value)} placeholder="Any specific labelling, packaging, certification requirements..." />
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <p className="section-title">Certifications Required</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {CERTS.map(c => (
                <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                  <input type="checkbox" checked={form.certificationRequired.includes(c)} onChange={() => toggleCert(c)} style={{ accentColor: 'var(--black)' }} />
                  {c}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Send RFQ'}
          </button>
          <Link to="/catalog" className="btn btn-secondary btn-lg" style={{ marginLeft: 10 }}>Cancel</Link>
        </form>

        {/* Summary */}
        <div>
          {product && (
            <div className="card" style={{ marginBottom: 16 }}>
              <p className="section-title">Product Reference</p>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{product.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: 8 }}>{product.category}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Listed at <span style={{ fontFamily: 'var(--mono)', color: 'var(--black)', fontWeight: 600 }}>${product.pricing?.basePrice?.toLocaleString()}/{product.pricing?.unit}</span></div>
            </div>
          )}
          {mfr && (
            <div className="card">
              <p className="section-title">Sending To</p>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{mfr.company}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: 8 }}>{mfr.country}{mfr.manufacturerProfile?.state && ` · ${mfr.manufacturerProfile.state}`}</div>
              <div className="tag-list">{mfr.manufacturerProfile?.certifications?.map(c => <span key={c} className="tag">{c}</span>)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
