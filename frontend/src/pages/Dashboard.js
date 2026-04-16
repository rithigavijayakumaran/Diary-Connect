import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import CertUploadPanel from './certUploadPanel';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [rfqs, setRfqs]   = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin has nothing to see here — send straight to admin panel
  useEffect(() => {
    if (!user) return; // Wait for user object to be available
    if (user.role === 'admin') { navigate('/admin', { replace: true }); return; }
    
    Promise.all([
      axios.get('/api/analytics/dashboard'),
      axios.get('/api/rfq/my')
    ]).then(([s, r]) => {
      setStats(s.data.data);
      setRfqs(r.data.data.slice(0, 5));
    })
    .catch(err => {
      console.error('Dashboard data fetch error:', err);
    })
    .finally(() => setLoading(false));
  }, [user, navigate]);

  if (!user || user.role === 'admin') return null;
  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" /></div>;

  const isManufacturer = user?.role === 'manufacturer';

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>{isManufacturer ? 'Manage your products and incoming inquiries' : 'Track your sourcing activity and RFQs'}</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {isManufacturer ? <>
          <div className="stat-card">
            <div className="stat-label">Products</div>
            <div className="stat-value">{stats?.totalProducts ?? 0}</div>
            <div className="stat-sub">{stats?.activeProducts} active</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Views</div>
            <div className="stat-value">{stats?.totalViews ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Inquiries</div>
            <div className="stat-value">{stats?.totalInquiries ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total RFQs</div>
            <div className="stat-value">{stats?.totalRFQs ?? 0}</div>
            <div className="stat-sub">{stats?.statusCounts?.pending ?? 0} pending</div>
          </div>
        </> : <>
          <div className="stat-card">
            <div className="stat-label">Total RFQs</div>
            <div className="stat-value">{stats?.totalRFQs ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{stats?.pendingRFQs ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Quoted</div>
            <div className="stat-value">{stats?.quotedRFQs ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Accepted</div>
            <div className="stat-value">{stats?.acceptedRFQs ?? 0}</div>
          </div>
        </>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent RFQs */}
        <div className="card" style={{ padding: 0 }}>
          <div className="flex-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Recent RFQs</span>
            <Link to="/rfq" style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>View all</Link>
          </div>
          {rfqs.length === 0 ? (
            <div className="empty" style={{ padding: 40 }}>
              <h3>No RFQs yet</h3>
              <p>{isManufacturer ? 'Incoming RFQs will appear here' : 'Browse the catalog to send your first RFQ'}</p>
            </div>
          ) : (
            <div>
              {rfqs.map(rfq => (
                <Link to={`/rfq/${rfq._id}`} key={rfq._id} style={{ display: 'block', padding: '14px 20px', borderBottom: '1px solid var(--gray-100)', transition: 'background var(--transition)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div className="flex-between" style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--gray-900)' }}>{rfq.title}</span>
                    <span className={`status status-${rfq.status}`}>{rfq.status}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                    {rfq.quantity} {rfq.quantityUnit} · {rfq.productCategory} · {isManufacturer ? rfq.importer?.company : rfq.manufacturer?.company}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions / info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <p className="section-title">Quick Actions</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isManufacturer ? (
            <>
              <Link to="/products/add" className="btn btn-primary">+ Add New Product</Link>
              <Link to="/my-products" className="btn btn-secondary">Manage Listings</Link>
              <Link to="/analytics" className="btn btn-secondary">View Analytics</Link>
            </>
          ) : (
            <>
              <Link to="/catalog" className="btn btn-primary">Browse Catalog</Link>
              <Link to="/match" className="btn btn-secondary">AI Recommendations</Link>
              <Link to="/compliance" className="btn btn-secondary">Compliance Wizard</Link>
            </>
          )}
            </div>
          </div>

          {isManufacturer && stats?.topCountries?.length > 0 && (
            <div className="card">
              <p className="section-title">Top Inquiry Countries</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stats.topCountries.map(({ country, count }) => (
                  <div key={country} className="flex-between">
                    <span style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>{country}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--mono)' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isManufacturer && stats?.categoryBreakdown && Object.keys(stats.categoryBreakdown).length > 0 && (
            <div className="card">
              <p className="section-title">Your Sourcing Categories</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(stats.categoryBreakdown).map(([cat, cnt]) => (
                  <div key={cat} className="flex-between">
                    <span style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>{cat}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--mono)' }}>{cnt} RFQs</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cert upload for manufacturers */}
      {isManufacturer && <CertUploadPanel />}
    </div>
  );
}
