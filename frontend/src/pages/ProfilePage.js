import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CERTS = ['FSSAI','APEDA','ISO_9001','ISO_22000','HALAL','KOSHER','ORGANIC','FDA'];
const CATEGORIES = ['Ghee','Skimmed Milk Powder','Whole Milk Powder','Butter','Cheese','Paneer','Whey Protein','Casein','UHT Milk','Condensed Milk'];
const MARKETS = ['GCC','EU','FDA','ORGANIC','KOSHER'];
const INDIAN_STATES = ['Gujarat','Maharashtra','Punjab','Rajasthan','Uttar Pradesh','Andhra Pradesh','Karnataka','Tamil Nadu','Kerala','Madhya Pradesh','Haryana'];

export default function ProfilePage() {
  const { user, setUser, login } = useAuth();
  const [saving, setSaving] = useState(false);
  const isManufacturer = user?.role === 'manufacturer';

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    company: user?.company || '',
    country: user?.country || '',
    manufacturerProfile: {
      state: user?.manufacturerProfile?.state || '',
      description: user?.manufacturerProfile?.description || '',
      establishedYear: user?.manufacturerProfile?.establishedYear || '',
      annualCapacity: user?.manufacturerProfile?.annualCapacity || '',
      certifications: user?.manufacturerProfile?.certifications || [],
      exportCountries: user?.manufacturerProfile?.exportCountries?.join(', ') || '',
      coldChainAvailable: user?.manufacturerProfile?.coldChainAvailable || false
    },
    importerProfile: {
      preferredCategories: user?.importerProfile?.preferredCategories || [],
      annualImportVolume: user?.importerProfile?.annualImportVolume || '',
      regulatoryMarkets: user?.importerProfile?.regulatoryMarkets || [],
      importRegions: user?.importerProfile?.importRegions?.join(', ') || ''
    }
  });

  const set = (path, val) => {
    const parts = path.split('.');
    setForm(prev => {
      const copy = { ...prev };
      if (parts.length === 1) copy[parts[0]] = val;
      else copy[parts[0]] = { ...copy[parts[0]], [parts[1]]: val };
      return copy;
    });
  };

  const toggleCategory = c => {
    const list = form.importerProfile.preferredCategories;
    set('importerProfile.preferredCategories', list.includes(c) ? list.filter(x => x !== c) : [...list, c]);
  };

  const toggleMarket = m => {
    const list = form.importerProfile.regulatoryMarkets;
    set('importerProfile.regulatoryMarkets', list.includes(m) ? list.filter(x => x !== m) : [...list, m]);
  };

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (isManufacturer) {
        payload.manufacturerProfile = {
          ...form.manufacturerProfile,
          exportCountries: form.manufacturerProfile.exportCountries.split(',').map(s => s.trim()).filter(Boolean)
        };
      } else {
        payload.importerProfile = {
          ...form.importerProfile,
          importRegions: form.importerProfile.importRegions.split(',').map(s => s.trim()).filter(Boolean)
        };
      }
      const res = await axios.put('/api/auth/profile', payload);
      setUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const G = ({ label, children, hint }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
      {hint && <p className="form-hint">{hint}</p>}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1>Profile</h1>
        <p>Manage your account and {isManufacturer ? 'manufacturer' : 'importer'} details</p>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Basic info */}
          <div className="card" style={{ marginBottom: 16 }}>
            <p className="section-title">Account Info</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px', background: 'var(--gray-50)', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'var(--white)', fontWeight: 600, fontSize: '1rem' }}>{user?.name?.[0]?.toUpperCase()}</span>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{user?.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-400)', textTransform: 'capitalize' }}>{user?.role} · {user?.email}</div>
              </div>
              {user?.isVerified && <span className="badge badge-dark" style={{ marginLeft: 'auto' }}>Verified</span>}
            </div>
            <G label="Full Name">
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} />
            </G>
            <G label="Company">
              <input className="form-input" value={form.company} onChange={e => set('company', e.target.value)} />
            </G>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <G label="Country">
                <input className="form-input" value={form.country} onChange={e => set('country', e.target.value)} />
              </G>
              <G label="Phone">
                <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </G>
            </div>
          </div>

          {/* Role-specific */}
          {isManufacturer ? (
            <div>
              <div className="card" style={{ marginBottom: 16 }}>
                <p className="section-title">Manufacturer Details</p>
                <G label="State">
                  <select className="form-select" value={form.manufacturerProfile.state} onChange={e => set('manufacturerProfile.state', e.target.value)}>
                    <option value="">Select state</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </G>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <G label="Established Year">
                    <input className="form-input" type="number" value={form.manufacturerProfile.establishedYear} onChange={e => set('manufacturerProfile.establishedYear', e.target.value)} placeholder="2001" />
                  </G>
                  <G label="Annual Capacity">
                    <input className="form-input" value={form.manufacturerProfile.annualCapacity} onChange={e => set('manufacturerProfile.annualCapacity', e.target.value)} placeholder="5000 MT/year" />
                  </G>
                </div>
                <G label="Export Countries" hint="Comma separated">
                  <input className="form-input" value={form.manufacturerProfile.exportCountries} onChange={e => set('manufacturerProfile.exportCountries', e.target.value)} placeholder="UAE, Saudi Arabia, UK" />
                </G>
                <G label="Company Description">
                  <textarea className="form-textarea" value={form.manufacturerProfile.description} onChange={e => set('manufacturerProfile.description', e.target.value)} placeholder="Describe your company, products and experience..." />
                </G>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                    <input type="checkbox" checked={form.manufacturerProfile.coldChainAvailable} onChange={e => set('manufacturerProfile.coldChainAvailable', e.target.checked)} style={{ accentColor: 'var(--black)', width: 15, height: 15 }} />
                    Cold chain infrastructure available
                  </label>
                </div>
              </div>

              <div className="card">
                <div className="flex-between" style={{ marginBottom: 12 }}>
                  <p className="section-title" style={{ marginBottom: 0 }}>Verified Certifications</p>
                  <Link to="/dashboard" style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--black)', textDecoration: 'underline' }}>Update Certificates →</Link>
                </div>
                
                {user?.manufacturerProfile?.certifications?.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {user.manufacturerProfile.certifications.map(c => (
                      <div key={c} style={{ 
                        padding: '6px 12px', border: '1px solid var(--gray-200)', 
                        borderRadius: 'var(--radius)', fontSize: '0.8125rem', fontWeight: 500,
                        background: 'var(--gray-50)', display: 'flex', alignItems: 'center', gap: 6
                      }}>
                        <span style={{ color: '#059669' }}>✓</span> {c}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '12px', background: 'var(--gray-50)', borderRadius: 'var(--radius)', border: '1px dashed var(--gray-300)', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', margin: 0 }}>No verified certificates yet.</p>
                  </div>
                )}
                
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 16, lineHeight: 1.4 }}>
                  Certifications are verified by our team. To add or update your credentials, please upload documents from your <Link to="/dashboard" style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Inquiry Dashboard</Link>.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="card" style={{ marginBottom: 16 }}>
                <p className="section-title">Importer Details</p>
                <G label="Annual Import Volume">
                  <input className="form-input" value={form.importerProfile.annualImportVolume} onChange={e => set('importerProfile.annualImportVolume', e.target.value)} placeholder="e.g. 2000 MT/year" />
                </G>
                <G label="Import Regions" hint="Comma separated">
                  <input className="form-input" value={form.importerProfile.importRegions} onChange={e => set('importerProfile.importRegions', e.target.value)} placeholder="South Asia, Middle East" />
                </G>
              </div>

              <div className="card" style={{ marginBottom: 16 }}>
                <p className="section-title">Preferred Categories</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {CATEGORIES.map(c => (
                    <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', color: 'var(--gray-700)' }}>
                      <input type="checkbox" checked={form.importerProfile.preferredCategories.includes(c)} onChange={() => toggleCategory(c)} style={{ accentColor: 'var(--black)', width: 15, height: 15 }} />
                      {c}
                    </label>
                  ))}
                </div>
              </div>

              <div className="card">
                <p className="section-title">Regulatory Markets</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: 12 }}>Select the standards your target market requires</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {MARKETS.map(m => (
                    <button key={m} type="button" onClick={() => toggleMarket(m)}
                      style={{
                        padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 500,
                        border: `1px solid ${form.importerProfile.regulatoryMarkets.includes(m) ? 'var(--black)' : 'var(--gray-200)'}`,
                        background: form.importerProfile.regulatoryMarkets.includes(m) ? 'var(--black)' : 'var(--white)',
                        color: form.importerProfile.regulatoryMarkets.includes(m) ? 'var(--white)' : 'var(--gray-600)',
                        cursor: 'pointer'
                      }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
