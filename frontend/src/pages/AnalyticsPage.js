import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const GRAYS = ['#0a0a0a','#404040','#737373','#a3a3a3','#d4d4d4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', padding: '8px 12px', fontSize: '0.8125rem' }}>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: 'var(--gray-600)' }}>{p.name}: <strong>{p.value}</strong></div>)}
    </div>
  );
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [dash, setDash] = useState(null);
  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/analytics/dashboard'),
      axios.get('/api/analytics/market')
    ]).then(([d, m]) => {
      setDash(d.data.data);
      setMarket(m.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" /></div>;

  const isManufacturer = user?.role === 'manufacturer';

  // Prepare chart data
  const monthlyData = dash?.monthlyTrend
    ? Object.entries(dash.monthlyTrend).sort().map(([k, v]) => ({ month: k.slice(5), RFQs: v }))
    : [];

  const categoryData = dash?.categoryBreakdown
    ? Object.entries(dash.categoryBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  const marketDemandData = (market?.categoryDemand || []).slice(0, 8).map(d => ({ name: d._id, count: d.count }));
  const importerCountryData = (market?.importerCountries || []).slice(0, 8).map(d => ({ name: d._id, count: d.count }));
  const stateData = (market?.topManufacturerStates || []).slice(0, 6).map(d => ({ name: d._id || 'Unknown', count: d.count }));

  return (
    <div>
      <div className="page-header">
        <h1>Analytics</h1>
        <p>{isManufacturer ? 'Performance metrics and demand insights' : 'Your sourcing activity and market intelligence'}</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 32 }}>
        {isManufacturer ? <>
          <div className="stat-card"><div className="stat-label">Products</div><div className="stat-value">{dash?.totalProducts ?? 0}</div></div>
          <div className="stat-card"><div className="stat-label">Total Views</div><div className="stat-value">{dash?.totalViews ?? 0}</div></div>
          <div className="stat-card"><div className="stat-label">Inquiries</div><div className="stat-value">{dash?.totalInquiries ?? 0}</div></div>
          <div className="stat-card"><div className="stat-label">RFQs Received</div><div className="stat-value">{dash?.totalRFQs ?? 0}</div></div>
        </> : <>
          <div className="stat-card"><div className="stat-label">Total RFQs</div><div className="stat-value">{dash?.totalRFQs ?? 0}</div></div>
          <div className="stat-card"><div className="stat-label">Pending</div><div className="stat-value">{dash?.pendingRFQs ?? 0}</div></div>
          <div className="stat-card"><div className="stat-label">Quoted</div><div className="stat-value">{dash?.quotedRFQs ?? 0}</div></div>
          <div className="stat-card"><div className="stat-label">Accepted</div><div className="stat-value">{dash?.acceptedRFQs ?? 0}</div></div>
        </>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Monthly trend */}
        {isManufacturer && monthlyData.length > 0 && (
          <div className="card">
            <p className="section-title">RFQ Trend (Last 6 Months)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="RFQs" fill="#0a0a0a" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category breakdown */}
        {categoryData.length > 0 && (
          <div className="card">
            <p className="section-title">{isManufacturer ? 'Products by Category' : 'RFQs by Category'}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={36}>
                    {categoryData.map((_, i) => <Cell key={i} fill={GRAYS[i % GRAYS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {categoryData.slice(0, 5).map((d, i) => (
                  <div key={d.name} className="flex-between" style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: GRAYS[i % GRAYS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', fontWeight: 600 }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top countries (manufacturer) */}
        {isManufacturer && dash?.topCountries?.length > 0 && (
          <div className="card">
            <p className="section-title">Top Inquiry Countries</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dash.topCountries.map(([name, count]) => ({ name, count }))} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#0a0a0a" radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* RFQ status pie (importer) */}
        {!isManufacturer && dash?.statusCounts && (
          <div className="card">
            <p className="section-title">RFQ Status Breakdown</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={Object.entries(dash.statusCounts).map(([name, value]) => ({ name, value }))} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={36}>
                    {Object.keys(dash.statusCounts).map((_, i) => <Cell key={i} fill={GRAYS[i % GRAYS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {Object.entries(dash.statusCounts).map(([s, c], i) => (
                  <div key={s} className="flex-between" style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: GRAYS[i % GRAYS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)', textTransform: 'capitalize' }}>{s}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', fontWeight: 600 }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Market Intelligence - public data */}
      <div style={{ marginTop: 8 }}>
        <div className="section-title" style={{ marginBottom: 20 }}>Market Intelligence</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Global demand by category */}
          {marketDemandData.length > 0 && (
            <div className="card">
              <p className="section-title">Global Demand by Category</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={marketDemandData} margin={{ top: 4, right: 4, left: -20, bottom: 40 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#737373' }} angle={-35} textAnchor="end" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#404040" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top importer countries */}
          {importerCountryData.length > 0 && (
            <div className="card">
              <p className="section-title">Importer Countries</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={importerCountryData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#737373" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Manufacturer states */}
          {stateData.length > 0 && (
            <div className="card">
              <p className="section-title">Manufacturers by Indian State</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stateData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#0a0a0a" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
