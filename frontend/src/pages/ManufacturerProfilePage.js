import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ManufacturerProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mfr, setMfr] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showMsgBox, setShowMsgBox] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get('/api/auth/manufacturers'),
      axios.get('/api/products')
    ]).then(([mres, pres]) => {
      const found = mres.data.data.find(m => m._id === id);
      setMfr(found);
      setProducts(pres.data.data.filter(p => p.manufacturer?._id === id || p.manufacturer === id));
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" /></div>;
  if (!mfr) return <div className="empty"><h3>Manufacturer not found</h3></div>;

  const profile = mfr.manufacturerProfile || {};

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    setSendingMsg(true);
    try {
      await axios.post('/api/messages', { receiverId: mfr._id, content: msgText });
      toast.success('Message sent!');
      navigate('/messages');
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSendingMsg(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20, fontSize: '0.85rem', color: 'var(--gray-400)' }}>
        <Link to="/catalog" style={{ color: 'var(--gray-400)' }}>Catalog</Link> › {mfr.company}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <h1 style={{ fontSize: '1.375rem', fontWeight: 600, color: 'var(--black)', letterSpacing: '-0.02em' }}>{mfr.company}</h1>
                  {mfr.isVerified && <span className="badge badge-dark">Verified</span>}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--gray-500)' }}>{mfr.country}{profile.state && ` · ${profile.state}`}</div>
              </div>
              {profile.rating > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--black)', fontFamily: 'var(--mono)' }}>{profile.rating}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>{profile.totalReviews} reviews</div>
                </div>
              )}
            </div>
            {profile.description && <p style={{ fontSize: '0.9375rem', color: 'var(--gray-600)', lineHeight: 1.7 }}>{profile.description}</p>}
          </div>

          {/* Products */}
          <div className="card">
            <p className="section-title">Products ({products.length})</p>
            {products.length === 0 ? <div className="empty" style={{ padding: 32 }}><h3>No products listed yet</h3></div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {products.map(p => (
                  <Link to={`/products/${p._id}`} key={p._id}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--gray-900)', marginBottom: 2 }}>{p.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>{p.category}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.875rem', fontWeight: 600 }}>${p.pricing?.basePrice?.toLocaleString()}/{p.pricing?.unit}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <p className="section-title">Company Info</p>
            {profile.establishedYear && <div className="flex-between" style={{ marginBottom: 10 }}><span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Est.</span><span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{profile.establishedYear}</span></div>}
            {profile.annualCapacity && <div className="flex-between" style={{ marginBottom: 10 }}><span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Capacity</span><span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{profile.annualCapacity}</span></div>}
            <div className="flex-between" style={{ marginBottom: 10 }}><span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Cold Chain</span><span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{profile.coldChainAvailable ? 'Available' : 'N/A'}</span></div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <p className="section-title">Certifications</p>
            <div className="tag-list">{profile.certifications?.map(c => <span key={c} className="tag">{c}</span>)}</div>
          </div>

          {profile.exportCountries?.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <p className="section-title">Current Export Markets</p>
              <div className="tag-list">{profile.exportCountries.map(c => <span key={c} className="tag">{c}</span>)}</div>
            </div>
          )}

          {user?.role === 'importer' && (
            <>
              <button className="btn btn-primary btn-full" style={{ marginBottom: 10 }}
                onClick={() => navigate(`/rfq/create/${mfr._id}`)}>
                Send RFQ to {mfr.company}
              </button>
              
              {!showMsgBox ? (
                <button className="btn btn-secondary btn-full" onClick={() => setShowMsgBox(true)}>
                  Send Direct Message
                </button>
              ) : (
                <div className="card" style={{ padding: 16, marginTop: 4 }}>
                  <form onSubmit={handleSendMessage}>
                    <textarea 
                      className="form-textarea" 
                      placeholder="Type your message..." 
                      value={msgText} 
                      onChange={e => setMsgText(e.target.value)} 
                      required
                      style={{ marginBottom: 10 }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={sendingMsg}>
                        {sendingMsg ? 'Sending...' : 'Send'}
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={() => setShowMsgBox(false)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
          {!user && <Link to="/register" className="btn btn-primary btn-full">Register to Contact</Link>}
        </div>
      </div>
    </div>
  );
}
