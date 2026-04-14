import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// ─── API helper ───────────────────────────────────────────────────────────────
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

async function fetchAnalytics(token) {
  const headers = { Authorization: `Bearer ${token}` };
  const [dashRes, marketRes] = await Promise.all([
    fetch(`${API}/analytics/dashboard`, { headers }),
    fetch(`${API}/analytics/market`),
  ]);
  const dash   = await dashRes.json();
  const market = await marketRes.json();
  return { dash: dash.data, market: market.data };
}

// ─── Color palettes ───────────────────────────────────────────────────────────
const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f43f5e', '#14b8a6'];
const HEAT  = ['#e0e7ff', '#c7d2fe', '#818cf8', '#6366f1', '#4338ca', '#312e81'];

function heatColor(value, max) {
  const idx = Math.min(HEAT.length - 1, Math.floor((value / Math.max(max, 1)) * (HEAT.length - 1)));
  return HEAT[idx];
}

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────
function BarChart({ data, xKey, yKey, color = '#5754b6ff', height = 180 }) {
  if (!data?.length) return <div className="chart-empty">No data yet</div>;
  const max = Math.max(...data.map(d => d[yKey]), 1);
  const barW = Math.max(10, Math.floor(520 / data.length) - 8);
  const totalW = data.length * (barW + 8) + 8;

  return (
    <div className="chart-scroll">
      <svg viewBox={`0 0 ${Math.max(totalW, 520)} ${height + 40}`} width="100%" style={{ display:'block' }}>
        {[0.25,0.5,0.75,1].map(f => (
          <line key={f} x1={0} y1={height*(1-f)} x2={Math.max(totalW,520)} y2={height*(1-f)}
            stroke="#e5e5e5" strokeWidth="1" />
        ))}
        {data.map((d, i) => {
          const barH = Math.max(2, (d[yKey]/max)*height);
          const x = i*(barW+8)+4;
          const y = height - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} fill={color} rx="2" opacity="0.88">
                <title>{d[xKey]}: {d[yKey]}</title>
              </rect>
              <text x={x+barW/2} y={height+16} textAnchor="middle" fontSize="10" fill="#737373"
                transform={data.length>7?`rotate(-30,${x+barW/2},${height+16})`:''}>
                {String(d[xKey]).length>11?String(d[xKey]).slice(0,10)+'…':d[xKey]}
              </text>
              {d[yKey]>0&&<text x={x+barW/2} y={y-5} textAnchor="middle" fontSize="10" fill="#262626" fontWeight="600">{d[yKey]}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────
function LineChart({ data, xKey, yKey, height = 160 }) {
  if (!data?.length) return <div className="chart-empty">No data yet</div>;
  const max = Math.max(...data.map(d => d[yKey]), 1);
  const W = 560, pad = 10;
  const step = (W-pad*2)/Math.max(data.length-1,1);
  const pts = data.map((d,i) => ({
    x: pad+i*step,
    y: height-pad-((d[yKey]/max)*(height-pad*2)),
    ...d
  }));
  const poly = pts.map(p=>`${p.x},${p.y}`).join(' ');
  const area = `M${pts[0].x},${height-pad} `+pts.map(p=>`L${p.x},${p.y}`).join(' ')+` L${pts[pts.length-1].x},${height-pad} Z`;

  return (
    <div className="chart-scroll">
      <svg viewBox={`0 0 ${W} ${height+28}`} width="100%" style={{ display:'block' }}>
        <defs>
          <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a0a0a" stopOpacity="0.12"/>
            <stop offset="100%" stopColor="#0a0a0a" stopOpacity="0.01"/>
          </linearGradient>
        </defs>
        {[0.25,0.5,0.75,1].map(f=>(
          <line key={f} x1={pad} y1={pad+(height-pad*2)*(1-f)} x2={W-pad} y2={pad+(height-pad*2)*(1-f)}
            stroke="#e5e5e5" strokeWidth="1"/>
        ))}
        <path d={area} fill="url(#lg1)"/>
        <polyline points={poly} fill="none" stroke="#0a0a0a" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
        {pts.map((p,i)=>(
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#0a0a0a" strokeWidth="2"/>
            {p[yKey]>0&&<text x={p.x} y={p.y-9} textAnchor="middle" fontSize="10" fill="#262626" fontWeight="600">{p[yKey]}</text>}
            <text x={p.x} y={height+20} textAnchor="middle" fontSize="10" fill="#737373">
              {String(p[xKey]).slice(5)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ data, labelKey, valueKey }) {
  if (!data?.length) return <div className="chart-empty">No data yet</div>;
  const total = data.reduce((s,d)=>s+d[valueKey],0);
  if (!total) return <div className="chart-empty">No data yet</div>;
  const size = 160, cx = 80, cy = 80, r = 58, inner = 34;
  let cum = -Math.PI/2;
  const slices = data.map((d,i)=>{
    const ang = (d[valueKey]/total)*Math.PI*2;
    const x1=cx+r*Math.cos(cum), y1=cy+r*Math.sin(cum);
    cum+=ang;
    const x2=cx+r*Math.cos(cum), y2=cy+r*Math.sin(cum);
    const xi1=cx+inner*Math.cos(cum-ang), yi1=cy+inner*Math.sin(cum-ang);
    const xi2=cx+inner*Math.cos(cum), yi2=cy+inner*Math.sin(cum);
    const lg = ang>Math.PI?1:0;
    const path=`M${x1} ${y1} A${r} ${r} 0 ${lg} 1 ${x2} ${y2} L${xi2} ${yi2} A${inner} ${inner} 0 ${lg} 0 ${xi1} ${yi1} Z`;
    return { path, color:CATEGORY_COLORS[i%CATEGORY_COLORS.length], label:d[labelKey], value:d[valueKey] };
  });

  return (
    <div className="donut-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ flexShrink:0 }}>
        {slices.map((s,i)=>(
          <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth="2">
            <title>{s.label}: {s.value}</title>
          </path>
        ))}
        <text x={cx} y={cy-6} textAnchor="middle" fontSize="22" fontWeight="700" fill="#0a0a0a">{total}</text>
        <text x={cx} y={cy+14} textAnchor="middle" fontSize="10" fill="#737373">total</text>
      </svg>
      <div className="donut-legend">
        {slices.map((s,i)=>(
          <div key={i} className="legend-item">
            <span className="legend-dot" style={{ background:s.color }}/>
            <span className="legend-label">{s.label}</span>
            <span className="legend-val">{Math.round((s.value/total)*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Horizontal Bar ───────────────────────────────────────────────────────────
function HBar({ data, labelKey, valueKey, colorFn }) {
  if (!data?.length) return <div className="chart-empty">No data yet</div>;
  const max = Math.max(...data.map(d=>d[valueKey]),1);
  return (
    <div className="hbar-list">
      {data.map((d,i)=>{
        const pct=(d[valueKey]/max)*100;
        const bg=colorFn?colorFn(d[valueKey],max):CATEGORY_COLORS[Math.min(i,CATEGORY_COLORS.length-1)];
        return (
          <div key={i} className="hbar-row">
            <div className="hbar-label">{d[labelKey]}</div>
            <div className="hbar-track"><div className="hbar-fill" style={{ width:`${pct}%`, background:bg }}/></div>
            <div className="hbar-val">{d[valueKey]}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── India State Bubble Map ───────────────────────────────────────────────────
const STATE_POS = [
  ['Gujarat',22,41],['Rajasthan',29,29],['Punjab',27,17],['Haryana',32,22],
  ['Uttar Pradesh',44,28],['Uttarakhand',39,20],['Himachal Pradesh',33,14],
  ['Madhya Pradesh',40,40],['Maharashtra',33,53],['Andhra Pradesh',45,63],
  ['Karnataka',37,68],['Tamil Nadu',42,76],['Kerala',36,80],
  ['West Bengal',61,38],['Bihar',56,30],
];

function IndiaHeatmap({ stateHeatmap }) {
  const [tooltip, setTooltip] = useState(null);
  const lookup = {};
  (stateHeatmap||[]).forEach(s=>{ lookup[s.state]=s; });
  const max = Math.max(...(stateHeatmap||[]).map(s=>s.manufacturerCount||0),1);

  return (
    <div className="india-map-section">
      <div className="india-map-container">
        <svg viewBox="0 0 300 400" width="100%" style={{ maxWidth:300, display:'block' }}>
          {/* Simplified India silhouette */}
          <path d="M75,18 L200,18 L225,55 L235,100 L225,155 L205,185 L225,225 L205,265 L165,305 L145,370 L125,305 L85,265 L62,225 L78,185 L58,145 L58,80 Z"
            fill="#fafafa" stroke="#e5e5e5" strokeWidth="1.5"/>
          {/* Dashed state borders suggestion */}
          <path d="M80,100 L220,100 M80,160 L220,160 M80,220 L210,220"
            stroke="#f0f0f0" strokeWidth="1" strokeDasharray="4,4"/>

          {STATE_POS.map(([state,cx_pct,cy_pct])=>{
            const d = lookup[state];
            const count = d?.manufacturerCount||0;
            const cx=(cx_pct/100)*300, cy=(cy_pct/100)*400;
            const rBase = count ? 7+(count/max)*18 : 5;
            const fill  = count ? heatColor(count,max) : '#ebebeb';
            return (
              <g key={state} style={{ cursor:'pointer' }}
                onMouseEnter={()=>setTooltip({state,cx,cy,...d})}
                onMouseLeave={()=>setTooltip(null)}>
                <circle cx={cx} cy={cy} r={rBase} fill={fill} stroke="#fff" strokeWidth="1.5" opacity="0.92"/>
                {count>0&&(
                  <text x={cx} y={cy+4} textAnchor="middle" fontSize="9"
                    fill={count>max*0.55?'#fff':'#262626'} fontWeight="700">{count}</text>
                )}
                <text x={cx} y={cy+rBase+11} textAnchor="middle" fontSize="8" fill="#525252">
                  {state.split(' ')[0]}
                </text>
              </g>
            );
          })}

          {/* Tooltip */}
          {tooltip&&(()=>{
            const bx = Math.min(tooltip.cx+10, 175);
            const by = Math.max(tooltip.cy-55, 5);
            return (
              <g>
                <rect x={bx} y={by} width={115} height={60} rx="5" fill="#0a0a0a" opacity="0.93"/>
                <text x={bx+58} y={by+16} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700">{tooltip.state}</text>
                <text x={bx+58} y={by+31} textAnchor="middle" fontSize="9" fill="#a3a3a3">Manufacturers: {tooltip.manufacturerCount||0}</text>
                <text x={bx+58} y={by+44} textAnchor="middle" fontSize="9" fill="#a3a3a3">Products: {tooltip.productCount||0}</text>
                <text x={bx+58} y={by+57} textAnchor="middle" fontSize="9" fill="#a3a3a3">Inquiries: {tooltip.totalInquiries||0}</text>
              </g>
            );
          })()}
        </svg>

        {/* Heat legend */}
        <div className="heatmap-legend">
          <span>Low</span>
          <div className="heat-gradient"/>
          <span>High</span>
        </div>
      </div>

      {/* State table */}
      <div className="state-table">
        <div className="section-title" style={{ marginBottom:14 }}>State Breakdown</div>
        {(stateHeatmap||[])
          .sort((a,b)=>(b.manufacturerCount||0)-(a.manufacturerCount||0))
          .slice(0,12)
          .map((s,i)=>(
            <div key={i} className="state-row">
              <div className="state-rank">{i+1}</div>
              <div className="state-name">{s.state}</div>
              <div className="state-bar-wrap">
                <div className="state-bar-fill" style={{
                  width:`${((s.manufacturerCount||0)/max)*100}%`,
                  background: heatColor(s.manufacturerCount||0, max)
                }}/>
              </div>
              <div className="state-nums">
                <span>{s.manufacturerCount||0} <em>mfg</em></span>
                <span>{s.productCount||0} <em>prod</em></span>
              </div>
            </div>
          ))
        }
        {!stateHeatmap?.length && (
          <div className="chart-empty">
            Populate manufacturers with <code>manufacturerProfile.state</code> field to see this heatmap
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const { user, token } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [tab, setTab]         = useState('overview');

  useEffect(() => {
    if (!token) return;
    fetchAnalytics(token)
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [token]);

  if (loading) return (
    <div className="loading-page">
      <div style={{ textAlign:'center' }}>
        <div className="spinner" style={{ width:32, height:32, margin:'0 auto 16px' }}/>
        <p style={{ color:'#737373', fontSize:14 }}>Loading analytics…</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="page"><div className="container">
      <div className="card" style={{ color:'#dc2626' }}>Error: {error}</div>
    </div></div>
  );

  const { dash, market } = data || {};
  const role = user?.role;

  // Prepared datasets
  const categoryDemand = (market?.categoryDemand||[])
    .map(d=>({ name:d._id||'Unknown', count:d.count })).filter(d=>d.name!=='Unknown');
  const importerCountries = (market?.importerCountries||[])
    .map(d=>({ country:d._id||'Unknown', count:d.count })).filter(d=>d.country!=='Unknown');
  const rfqTrend    = market?.rfqMonthlyTrend||[];
  const certDist    = (market?.certDist||[]).map(d=>({ cert:d._id, count:d.count }));
  const rfqStatusMarket = (market?.rfqStatusDist||[]).map(d=>({ status:d._id, count:d.count }));

  const personalMonthly  = dash?.monthlyTrend||[];
  const personalCountries= role==='manufacturer' ? (dash?.topCountries||[]) : (dash?.supplierCountries||[]);
  const personalCatBreak = Object.entries(dash?.categoryBreakdown||{}).map(([name,count])=>({ name, count }));
  const productPerf      = dash?.productPerformance||[];
  const statusCounts     = Object.entries(dash?.statusCounts||{}).map(([status,count])=>({ status,count }));

  const TABS = [
    { id:'overview', label:'🌍 Market Overview' },
    { id:'personal', label:role==='importer'?'📋 My RFQs':'📦 My Products' },
    { id:'map',      label:'🗺 State Heatmap' },
  ];

  return (
    <div className="page analytics-page">
      <div className="container">

        {/* Page header */}
        <div className="analytics-header">
          <div>
            <h1 className="analytics-title">Trade Analytics</h1>
            <p className="analytics-sub">
              {role==='manufacturer' ? 'Product performance · Buyer intelligence · Market trends' :
               role==='importer'     ? 'RFQ activity · Supplier intelligence · Market trends' :
                                       'Platform-wide dairy trade analytics'}
            </p>
          </div>
          <div className="analytics-tabs">
            {TABS.map(t=>(
              <button key={t.id} className={`analytics-tab${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── MARKET OVERVIEW ── */}
        {tab==='overview'&&(
          <>
            <div className="stats-grid">
              <div className="stat-card stat-card-dark">
                <div className="stat-label">Manufacturers</div>
                <div className="stat-value">{market?.summary?.totalManufacturers??'—'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Importers</div>
                <div className="stat-value">{market?.summary?.totalImporters??'—'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Active Products</div>
                <div className="stat-value">{market?.summary?.totalProducts??'—'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total RFQs</div>
                <div className="stat-value">{market?.summary?.totalRFQs??'—'}</div>
              </div>
            </div>

            <div className="analytics-grid">
              <div className="analytics-section analytics-section-span">
                <div className="section-title">Global RFQ Volume — Last 12 Months</div>
                <LineChart data={rfqTrend} xKey="month" yKey="count" height={160}/>
              </div>

              <div className="analytics-section">
                <div className="section-title">Product Category Demand (by RFQ count)</div>
                <BarChart data={categoryDemand} xKey="name" yKey="count" height={180}/>
              </div>

              <div className="analytics-section">
                <div className="section-title">Importer Countries</div>
                <HBar data={importerCountries.slice(0,10)} labelKey="country" valueKey="count"
                  colorFn={(v,m)=>heatColor(v,m)}/>
              </div>

              <div className="analytics-section">
                <div className="section-title">Platform RFQ Status</div>
                <DonutChart data={rfqStatusMarket.filter(d=>d.status)} labelKey="status" valueKey="count"/>
              </div>

              <div className="analytics-section">
                <div className="section-title">Certification Spread (Products)</div>
                <HBar data={certDist} labelKey="cert" valueKey="count"
                  colorFn={(_,m)=>CATEGORY_COLORS[0]}/>
              </div>
            </div>
          </>
        )}

        {/* ── PERSONAL STATS ── */}
        {tab==='personal'&&(
          <>
            {role==='manufacturer'&&(
              <>
                <div className="stats-grid">
                  <div className="stat-card stat-card-dark">
                    <div className="stat-label">My Products</div>
                    <div className="stat-value">{dash?.totalProducts??'—'}</div>
                    <div className="stat-sub">{dash?.activeProducts??0} active</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Total Views</div>
                    <div className="stat-value">{dash?.totalViews??'—'}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Inquiries</div>
                    <div className="stat-value">{dash?.totalInquiries??'—'}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">RFQs Received</div>
                    <div className="stat-value">{dash?.totalRFQs??'—'}</div>
                  </div>
                </div>
                <div className="analytics-grid">
                  <div className="analytics-section analytics-section-span">
                    <div className="section-title">My RFQ Trend — Last 6 Months</div>
                    <LineChart data={personalMonthly} xKey="month" yKey="count" height={140}/>
                  </div>
                  <div className="analytics-section">
                    <div className="section-title">Buyer Countries</div>
                    <HBar data={personalCountries} labelKey="country" valueKey="count"
                      colorFn={(v,m)=>heatColor(v,m)}/>
                  </div>
                  <div className="analytics-section">
                    <div className="section-title">My Product Categories</div>
                    <DonutChart data={personalCatBreak} labelKey="name" valueKey="count"/>
                  </div>
                  <div className="analytics-section">
                    <div className="section-title">RFQ Pipeline</div>
                    <DonutChart data={statusCounts} labelKey="status" valueKey="count"/>
                  </div>
                  <div className="analytics-section analytics-section-span">
                    <div className="section-title">Product Views Performance</div>
                    <HBar data={productPerf} labelKey="name" valueKey="views" colorFn={() => CATEGORY_COLORS[0]} />
                  </div>
                </div>
              </>
            )}

            {role==='importer'&&(
              <>
                <div className="stats-grid">
                  <div className="stat-card stat-card-dark">
                    <div className="stat-label">Total RFQs</div>
                    <div className="stat-value">{dash?.totalRFQs??'—'}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Pending</div>
                    <div className="stat-value">{dash?.pendingRFQs??0}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Quoted</div>
                    <div className="stat-value">{dash?.quotedRFQs??0}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Accepted</div>
                    <div className="stat-value">{dash?.acceptedRFQs??0}</div>
                  </div>
                </div>
                <div className="analytics-grid">
                  <div className="analytics-section analytics-section-span">
                    <div className="section-title">My RFQ Trend — Last 6 Months</div>
                    <LineChart data={personalMonthly} xKey="month" yKey="count" height={140}/>
                  </div>
                  <div className="analytics-section">
                    <div className="section-title">Categories I Source</div>
                    <DonutChart data={personalCatBreak} labelKey="name" valueKey="count"/>
                  </div>
                  <div className="analytics-section">
                    <div className="section-title">Supplier Countries</div>
                    <HBar data={personalCountries} labelKey="country" valueKey="count"
                      colorFn={(v,m)=>heatColor(v,m)}/>
                  </div>
                  <div className="analytics-section">
                    <div className="section-title">My RFQ Status</div>
                    <DonutChart data={statusCounts} labelKey="status" valueKey="count"/>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ── STATE HEATMAP ── */}
        {tab==='map'&&(
          <>
            <div className="card map-info-card">
              <strong>India Dairy Production Heatmap</strong>
              <p className="text-muted" style={{ fontSize:13, marginTop:4 }}>
                Bubble size and shade indicate manufacturer density per state.
                Hover a bubble to see full details. Data sourced from manufacturer registrations.
              </p>
            </div>
            <IndiaHeatmap stateHeatmap={market?.stateHeatmap||[]}/>
            {market?.topManufacturers?.length>0&&(
              <div className="card" style={{ marginTop:24 }}>
                <div className="section-title" style={{ marginBottom:16 }}>Top Verified Manufacturers</div>
                <div className="table-wrap">
                  <table>
                    <thead><tr>
                      <th>Company</th><th>State</th><th>Rating</th><th>Reviews</th><th>Certifications</th>
                    </tr></thead>
                    <tbody>
                      {market.topManufacturers.map((m,i)=>(
                        <tr key={i}>
                          <td><strong>{m.company}</strong></td>
                          <td>{m.manufacturerProfile?.state||'—'}</td>
                          <td>
                            <strong>{m.manufacturerProfile?.rating?.toFixed(1)||'—'}</strong>
                            <span className="text-muted" style={{ fontSize:12 }}>/5</span>
                          </td>
                          <td>{m.manufacturerProfile?.totalReviews||0}</td>
                          <td>
                            <div className="tag-list">
                              {(m.manufacturerProfile?.certifications||[]).map(c=>(
                                <span key={c} className="tag">{c}</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}