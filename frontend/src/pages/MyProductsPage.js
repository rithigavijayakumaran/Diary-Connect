import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const CATEGORIES = ['Ghee','Skimmed Milk Powder','Whole Milk Powder','Butter','Cheese','Paneer','Whey Protein','Casein','UHT Milk','Condensed Milk','Lactose','Cream','Yogurt','Other'];
const CERTS = ['FSSAI','APEDA','ISO_9001','ISO_22000','HALAL','KOSHER','ORGANIC','FDA'];

export function MyProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    axios.get('/api/products/my/listings').then(r => setProducts(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async id => {
    if (!window.confirm('Remove this product?')) return;
    await axios.delete(`/api/products/${id}`);
    toast.success('Product removed');
    load();
  };

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex-between page-header">
        <div>
          <h1>My Products</h1>
          <p>{products.length} listings</p>
        </div>
        <Link to="/products/add" className="btn btn-primary">+ Add Product</Link>
      </div>

      {products.length === 0 ? (
        <div className="card empty">
          <h3>No products yet</h3>
          <p>Add your first product to start receiving inquiries</p>
          <Link to="/products/add" className="btn btn-primary" style={{ marginTop: 16 }}>Add Product</Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>MOQ</th>
                  <th>Views</th>
                  <th>Inquiries</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td><span className="tag">{p.category}</span></td>
                    <td style={{ fontFamily: 'var(--mono)' }}>${p.pricing?.basePrice?.toLocaleString()}/{p.pricing?.unit}</td>
                    <td style={{ fontFamily: 'var(--mono)' }}>{p.pricing?.moq} {p.pricing?.moqUnit}</td>
                    <td style={{ fontFamily: 'var(--mono)', color: 'var(--gray-500)' }}>{p.views}</td>
                    <td style={{ fontFamily: 'var(--mono)', color: 'var(--gray-500)' }}>{p.inquiries}</td>
                    <td><span className={`status ${p.isActive ? 'status-accepted' : 'status-rejected'}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link to={`/products/edit/${p._id}`} className="btn btn-ghost btn-sm">Edit</Link>
                        <button onClick={() => remove(p._id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--gray-400)' }}>Remove</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const BLANK = { name: '', category: '', description: '', specifications: { fatContent: '', moistureContent: '', proteinContent: '', shelfLife: '', storageTemp: '', packagingFormats: '', grade: '' }, pricing: { basePrice: '', currency: 'USD', unit: 'MT', moq: '', moqUnit: 'MT' }, certifications: [], targetMarkets: '', originState: '', coldChainRequired: false };

const G = ({ label, children, hint }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    {children}
    {hint && <p className="form-hint">{hint}</p>}
  </div>
);

export function AddProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(BLANK);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const isEdit = !!id;

  useEffect(() => {
    if (id) {
      axios.get(`/api/products/${id}`).then(r => {
        const p = r.data.data;
        setForm({ ...p, specifications: { ...p.specifications, packagingFormats: p.specifications?.packagingFormats?.join(', ') || '' }, targetMarkets: p.targetMarkets?.join(', ') || '' });
      }).finally(() => setFetching(false));
    }
  }, [id]);

  const set = (path, val) => {
    setForm(prev => {
      const copy = { ...prev };
      if (path.includes('.')) {
        const [a, b] = path.split('.');
        copy[a] = { ...copy[a], [b]: val };
      } else { copy[path] = val; }
      return copy;
    });
  };

  const toggleCert = c => {
    setForm(prev => ({ ...prev, certifications: prev.certifications.includes(c) ? prev.certifications.filter(x => x !== c) : [...prev.certifications, c] }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        specifications: { ...form.specifications, packagingFormats: form.specifications.packagingFormats.split(',').map(s => s.trim()).filter(Boolean) },
        targetMarkets: form.targetMarkets.split(',').map(s => s.trim()).filter(Boolean),
        pricing: { ...form.pricing, basePrice: Number(form.pricing.basePrice), moq: Number(form.pricing.moq) }
      };
      if (isEdit) { await axios.put(`/api/products/${id}`, payload); toast.success('Product updated'); }
      else { await axios.post('/api/products', payload); toast.success('Product listed!'); }
      navigate('/my-products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally { setLoading(false); }
  };

  if (fetching) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
        <p>Fill in product details to create your listing</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <p className="section-title">Basic Information</p>
              <G label="Product Name *">
                <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Pure Cow Ghee - Export Grade" />
              </G>
              <G label="Category *">
                <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)} required>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </G>
              <G label="Description *">
                <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} required placeholder="Describe your product, quality, uses..." style={{ minHeight: 110 }} />
              </G>
              <G label="Origin State">
                <input className="form-input" value={form.originState} onChange={e => set('originState', e.target.value)} placeholder="e.g. Gujarat, Maharashtra" />
              </G>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <p className="section-title">Technical Specifications</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <G label="Fat Content"><input className="form-input" value={form.specifications.fatContent} onChange={e => set('specifications.fatContent', e.target.value)} placeholder="e.g. 99.7% min" /></G>
                <G label="Moisture Content"><input className="form-input" value={form.specifications.moistureContent} onChange={e => set('specifications.moistureContent', e.target.value)} placeholder="e.g. 0.1% max" /></G>
                <G label="Protein Content"><input className="form-input" value={form.specifications.proteinContent} onChange={e => set('specifications.proteinContent', e.target.value)} placeholder="e.g. 34% min" /></G>
                <G label="Shelf Life"><input className="form-input" value={form.specifications.shelfLife} onChange={e => set('specifications.shelfLife', e.target.value)} placeholder="e.g. 24 months" /></G>
                <G label="Storage Temperature"><input className="form-input" value={form.specifications.storageTemp} onChange={e => set('specifications.storageTemp', e.target.value)} placeholder="e.g. -18°C to 4°C" /></G>
                <G label="Grade"><input className="form-input" value={form.specifications.grade} onChange={e => set('specifications.grade', e.target.value)} placeholder="e.g. Export Grade A" /></G>
              </div>
              <G label="Packaging Formats" hint="Comma separated: 25kg bags, 200L drums">
                <input className="form-input" value={form.specifications.packagingFormats} onChange={e => set('specifications.packagingFormats', e.target.value)} placeholder="25kg bags, 200kg drums, 500ml jars" />
              </G>
            </div>

            <div className="card">
              <p className="section-title">Pricing & Trade</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <G label="Base Price (USD) *"><input className="form-input" type="number" value={form.pricing.basePrice} onChange={e => set('pricing.basePrice', e.target.value)} required placeholder="2800" /></G>
                <G label="Price Unit"><select className="form-select" value={form.pricing.unit} onChange={e => set('pricing.unit', e.target.value)}><option>MT</option><option>KG</option><option>Litre</option><option>Piece</option></select></G>
                <G label="Currency"><select className="form-select" value={form.pricing.currency} onChange={e => set('pricing.currency', e.target.value)}><option>USD</option><option>EUR</option><option>INR</option></select></G>
                <G label="Min Order Qty *"><input className="form-input" type="number" value={form.pricing.moq} onChange={e => set('pricing.moq', e.target.value)} required placeholder="5" /></G>
                <G label="MOQ Unit"><select className="form-select" value={form.pricing.moqUnit} onChange={e => set('pricing.moqUnit', e.target.value)}><option>MT</option><option>KG</option><option>Litre</option><option>Units</option></select></G>
              </div>
              <G label="Target Markets" hint="Comma separated: UAE, Saudi Arabia, EU">
                <input className="form-input" value={form.targetMarkets} onChange={e => set('targetMarkets', e.target.value)} placeholder="UAE, Saudi Arabia, Nigeria" />
              </G>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem', color: 'var(--gray-700)' }}>
                  <input type="checkbox" checked={form.coldChainRequired} onChange={e => set('coldChainRequired', e.target.checked)} style={{ accentColor: 'var(--black)', width: 15, height: 15 }} />
                  Cold chain required for this product
                </label>
              </div>
            </div>
          </div>

          {/* Right: Certifications */}
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <p className="section-title">Certifications</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: 12 }}>Select all that apply</p>
              {CERTS.map(c => (
                <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.certifications.includes(c)} onChange={() => toggleCert(c)} style={{ accentColor: 'var(--black)', width: 15, height: 15 }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>{c}</span>
                </label>
              ))}
            </div>

            <div style={{ position: 'sticky', top: 80 }}>
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : isEdit ? 'Update Product' : 'Publish Listing'}
              </button>
              <Link to="/my-products" className="btn btn-secondary btn-full" style={{ marginTop: 8 }}>Cancel</Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default MyProductsPage;
