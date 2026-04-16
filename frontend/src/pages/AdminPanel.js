import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiFetch = (url, token, opts = {}) =>
  fetch(`${API}${url}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  }).then(r => r.json());

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, dark, alert }) {
  return (
    <div className={`stat-card${dark ? ' stat-card-dark' : ''}${alert && value > 0 ? ' stat-card-alert' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value ?? '—'}</div>
    </div>
  );
}

// ─── Badge helpers ────────────────────────────────────────────────────────────
const CERT_STATUS_CLASS = { pending: 'status-pending', approved: 'status-accepted', rejected: 'status-rejected' };
const DISPUTE_STATUS_LABEL = {
  open: 'Open', under_review: 'Under Review',
  resolved_favour_raiser: 'Resolved (Raiser)', resolved_favour_defendant: 'Resolved (Defendant)', dismissed: 'Dismissed',
};
const PLAN_COLORS = { free: '#a3a3a3', basic: '#525252', premium: '#262626', enterprise: '#0a0a0a' };

// ════════════════════════════════════════════════════════════════
// SECTION 1 — OVERVIEW
// ════════════════════════════════════════════════════════════════
function OverviewSection({ token }) {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    apiFetch('/admin/stats', token).then(d => d.success && setStats(d.data));
  }, [token]);

  if (!stats) return <div className="flex-center" style={{ padding: 48 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', marginBottom: 28 }}>
        <StatCard label="Total Users"         value={stats.users.total} dark />
        <StatCard label="Manufacturers"       value={stats.users.manufacturers} />
        <StatCard label="Importers"           value={stats.users.importers} />
        <StatCard label="Active Products"     value={stats.products.active} />
        <StatCard label="Total RFQs"          value={stats.rfqs.total} />
        <StatCard label="Pending Cert Reviews" value={stats.pendingCertReviews} alert />
        <StatCard label="Open Disputes"       value={stats.openDisputes} alert />
        <StatCard label="Unverified Mfg"      value={stats.users.unverifiedManufacturers} alert />
      </div>

      {stats.subscriptions?.length > 0 && (
        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>Subscription Breakdown</div>
          <div className="hbar-list">
            {stats.subscriptions.map(s => (
              <div key={s._id} className="hbar-row">
                <div className="hbar-label" style={{ textTransform: 'capitalize' }}>{s._id || 'free'}</div>
                <div className="hbar-track">
                  <div className="hbar-fill" style={{
                    width: `${Math.min((s.count / stats.users.manufacturers) * 100, 100)}%`,
                    background: PLAN_COLORS[s._id] || '#a3a3a3'
                  }} />
                </div>
                <div className="hbar-val">{s.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SECTION 2 — CERTIFICATE VERIFICATION
// ════════════════════════════════════════════════════════════════
function CertSection({ token }) {
  const [pending, setPending]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null); // { userId, certId }
  const [actionType, setActionType] = useState(null); // 'approve' | 'reject'
  const [note, setNote]             = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch('/admin/certs/pending', token)
      .then(d => { if (d.success) setPending(d.data); setLoading(false); });
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async () => {
    if (actionType === 'reject' && !note.trim()) { toast.error('Rejection reason required'); return; }
    setSubmitting(true);
    try {
      const endpoint = `/admin/certs/${selected.userId}/${selected.certId}/${actionType}`;
      const d = await apiFetch(endpoint, token, { method: 'PUT', body: { adminNote: note || undefined } });
      if (!d.success) throw new Error(d.message);
      toast.success(actionType === 'approve' ? 'Certificate approved ✓' : 'Certificate rejected');
      setSelected(null); setActionType(null); setNote('');
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex-center" style={{ padding: 48 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Certificate Review Queue</h2>
        <p className="text-muted text-sm">{pending.length} certificate{pending.length !== 1 ? 's' : ''} awaiting review</p>
      </div>

      {pending.length === 0 ? (
        <div className="empty"><h3>All caught up</h3><p>No certificates pending review.</p></div>
      ) : (
        <div className="cert-review-list">
          {pending.map((item, i) => (
            <div key={i} className="cert-review-card card card-hover">
              <div className="cert-card-header">
                <div>
                  <div className="flex flex-gap-3" style={{ alignItems: 'center' }}>
                    <span className="cert-type-badge">{item.cert.type}</span>
                    {item.userVerified && <span className="badge badge-dark">✓ Verified</span>}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 15, fontWeight: 600, color: 'var(--black)' }}>
                    {item.userCompany}
                  </div>
                  <div className="text-sm text-muted" style={{ marginTop: 2 }}>
                    {item.userName} · {item.userCountry}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="text-xs text-muted">Uploaded</div>
                  <div className="text-sm" style={{ marginTop: 2 }}>
                    {new Date(item.cert.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  {item.cert.fileName && (
                    <div className="text-xs text-muted" style={{ marginTop: 2 }}>{item.cert.fileName}</div>
                  )}
                </div>
              </div>

              <div className="cert-card-actions">
                <a
                  href={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${item.cert.fileUrl}`}
                  target="_blank" rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  View Document ↗
                </a>
                <button className="btn btn-primary btn-sm" onClick={() => {
                  setSelected({ userId: item.userId, certId: item.cert._id });
                  setActionType('approve'); setNote('Verified and approved.');
                }}>
                  Approve
                </button>
                <button className="btn btn-secondary btn-sm" style={{ borderColor: 'var(--gray-400)' }} onClick={() => {
                  setSelected({ userId: item.userId, certId: item.cert._id });
                  setActionType('reject'); setNote('');
                }}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve/Reject Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => { setSelected(null); setNote(''); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">
                  {actionType === 'approve' ? '✓ Approve Certificate' : '✕ Reject Certificate'}
                </h2>
                <p className="modal-sub">This note will be visible to the manufacturer.</p>
              </div>
              <button className="modal-close" onClick={() => { setSelected(null); setNote(''); }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">
                  {actionType === 'approve' ? 'Approval Note (optional)' : 'Rejection Reason *'}
                </label>
                <textarea className="form-textarea" rows={4} value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder={actionType === 'approve'
                    ? 'e.g. Certificate verified against FSSAI registry'
                    : 'e.g. Document is expired / illegible / incorrect type'
                  }
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setSelected(null); setNote(''); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAction} disabled={submitting}>
                {submitting ? <span className="spinner" style={{ width: 14, height: 14 }} /> :
                  actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SECTION 3 — USER MANAGEMENT + SUBSCRIPTIONS
// ════════════════════════════════════════════════════════════════
function UsersSection({ token }) {
  const [users, setUsers]         = useState([]);
  const [total, setTotal]         = useState(0);
  const [roleFilter, setRoleFilter] = useState('manufacturer');
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [subModal, setSubModal]   = useState(null); // user
  const [subPlan, setSubPlan]     = useState('basic');
  const [subDays, setSubDays]     = useState(30);
  const [submitting, setSubmitting] = useState(false);

  const PLANS = ['free', 'basic', 'premium', 'enterprise'];
  const PLAN_FEATURES = {
    free:       '3 products · 5 RFQs/mo · No featured',
    basic:      '20 products · 50 RFQs/mo · 2 featured',
    premium:    '100 products · 200 RFQs/mo · 10 featured · Premium leads',
    enterprise: 'Unlimited · Priority support · 50 featured',
  };

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ role: roleFilter, ...(search && { search }) });
    apiFetch(`/admin/users?${params}`, token)
      .then(d => { if (d.success) { setUsers(d.data); setTotal(d.total); } setLoading(false); });
  }, [token, roleFilter, search]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (userId, action) => {
    const d = await apiFetch(`/admin/users/${userId}/${action}`, token, { method: 'PUT' });
    if (d.success) { toast.success('Updated'); load(); } else toast.error(d.message);
  };

  const assignPlan = async () => {
    setSubmitting(true);
    const d = await apiFetch(`/admin/users/${subModal._id}/subscription`, token, {
      method: 'PUT', body: { plan: subPlan, durationDays: Number(subDays) }
    });
    if (d.success) { toast.success(`Plan set to ${subPlan}`); setSubModal(null); load(); }
    else toast.error(d.message);
    setSubmitting(false);
  };

  const assignPremiumLeads = async (userId) => {
    const d = await apiFetch(`/admin/users/${userId}/premium-leads`, token, {
      method: 'PUT', body: { durationDays: 30 }
    });
    if (d.success) { toast.success('Premium leads activated for 30 days'); load(); }
    else toast.error(d.message);
  };

  return (
    <div>
      <div className="admin-toolbar">
        <div className="admin-role-tabs">
          {['manufacturer', 'importer'].map(r => (
            <button key={r} className={`analytics-tab${roleFilter === r ? ' active' : ''}`}
              onClick={() => setRoleFilter(r)}>
              {r === 'manufacturer' ? 'Manufacturers' : 'Importers'}
            </button>
          ))}
        </div>
        <input className="form-input" style={{ maxWidth: 240 }}
          placeholder="Search name, company, email…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="text-sm text-muted" style={{ margin: '8px 0 16px' }}>{total} users</div>

      {loading ? <div className="flex-center" style={{ padding: 48 }}><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Company</th>
                <th>Country</th>
                <th>Verified</th>
                <th>Status</th>
                {roleFilter === 'manufacturer' && <th>Subscription</th>}
                {roleFilter === 'importer'     && <th>Premium Leads</th>}
                <th>Joined</th>
                <th>Actions</th>
              </tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--black)' }}>{u.company}</div>
                      <div className="text-xs text-muted">{u.name} · {u.email}</div>
                    </td>
                    <td>{u.country}</td>
                    <td>
                      <span className={`status ${u.isVerified ? 'status-accepted' : 'status-pending'}`}>
                        {u.isVerified ? '✓ Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td>
                      <span className={`status ${u.isActive ? 'status-viewed' : 'status-rejected'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {roleFilter === 'manufacturer' && (
                      <td>
                        <span className="sub-plan-badge" style={{ background: PLAN_COLORS[u.subscription?.plan || 'free'] }}>
                          {u.subscription?.plan || 'free'}
                        </span>
                      </td>
                    )}
                    {roleFilter === 'importer' && (
                      <td>
                        <span className={`status ${u.premiumLeads?.isActive ? 'status-accepted' : 'status-pending'}`}>
                          {u.premiumLeads?.isActive ? '★ Premium' : 'Standard'}
                        </span>
                      </td>
                    )}
                    <td className="text-sm text-muted">
                      {new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td>
                      <div className="flex flex-gap-2">
                        {roleFilter === 'manufacturer' && (
                          <>
                            <button className="btn btn-ghost btn-sm"
                              onClick={() => toggle(u._id, u.isVerified ? 'unverify' : 'verify')}>
                              {u.isVerified ? 'Unverify' : 'Verify'}
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setSubModal(u); setSubPlan(u.subscription?.plan || 'basic'); }}>
                              Plan
                            </button>
                          </>
                        )}
                        {roleFilter === 'importer' && !u.premiumLeads?.isActive && (
                          <button className="btn btn-ghost btn-sm" onClick={() => assignPremiumLeads(u._id)}>
                            Give Premium
                          </button>
                        )}
                        <button className="btn btn-ghost btn-sm"
                          onClick={() => toggle(u._id, u.isActive ? 'deactivate' : 'activate')}>
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={8} className="empty" style={{ padding: 40 }}>No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {subModal && (
        <div className="modal-overlay" onClick={() => setSubModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Assign Subscription</h2>
                <p className="modal-sub">{subModal.company}</p>
              </div>
              <button className="modal-close" onClick={() => setSubModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Plan</label>
                <div className="plan-selector">
                  {PLANS.map(p => (
                    <div key={p}
                      className={`plan-option${subPlan === p ? ' active' : ''}`}
                      onClick={() => setSubPlan(p)}
                    >
                      <div className="plan-option-name" style={{ color: PLAN_COLORS[p] }}>{p}</div>
                      <div className="plan-option-desc">{PLAN_FEATURES[p]}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Duration (days)</label>
                <div className="flex flex-gap-2">
                  {[30, 90, 180, 365].map(d => (
                    <button key={d} className={`btn btn-sm ${subDays === d ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setSubDays(d)}>{d}d</button>
                  ))}
                  <input type="number" className="form-input" style={{ width: 90 }}
                    value={subDays} onChange={e => setSubDays(Number(e.target.value))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSubModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={assignPlan} disabled={submitting}>
                {submitting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Assign Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SECTION 4 — DISPUTE RESOLUTION
// ════════════════════════════════════════════════════════════════
function DisputesSection({ token }) {
  const [disputes, setDisputes]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [detail, setDetail]       = useState(null);
  const [note, setNote]           = useState('');
  const [resolution, setResolution] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : '';
    apiFetch(`/admin/disputes${params}`, token)
      .then(d => { if (d.success) setDisputes(d.data); setLoading(false); });
  }, [token, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (d) => {
    setSelected(d);
    const full = await apiFetch(`/admin/disputes/${d._id}`, token);
    if (full.success) setDetail(full.data);
  };

  const addNote = async () => {
    if (!note.trim()) return;
    setSubmitting(true);
    const d = await apiFetch(`/admin/disputes/${selected._id}/note`, token, { method: 'PUT', body: { note } });
    if (d.success) { toast.success('Note added'); setNote(''); setDetail(d.data); } else toast.error(d.message);
    setSubmitting(false);
  };

  const resolve = async () => {
    if (!resolution) { toast.error('Select a resolution'); return; }
    if (!resolutionText.trim()) { toast.error('Add resolution summary'); return; }
    setSubmitting(true);
    const d = await apiFetch(`/admin/disputes/${selected._id}/resolve`, token, {
      method: 'PUT', body: { status: resolution, resolution: resolutionText }
    });
    if (d.success) { toast.success('Dispute resolved'); setSelected(null); setDetail(null); load(); }
    else toast.error(d.message);
    setSubmitting(false);
  };

  const STATUS_FILTERS = ['', 'open', 'under_review', 'resolved_favour_raiser', 'resolved_favour_defendant', 'dismissed'];

  return (
    <div>
      <div className="admin-toolbar" style={{ marginBottom: 16 }}>
        <div className="analytics-tabs">
          {STATUS_FILTERS.map(s => (
            <button key={s} className={`analytics-tab${statusFilter === s ? ' active' : ''}`}
              onClick={() => setStatusFilter(s)}>
              {s ? DISPUTE_STATUS_LABEL[s] : 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="flex-center" style={{ padding: 48 }}><div className="spinner" /></div> : (
        disputes.length === 0
          ? <div className="empty"><h3>No disputes</h3><p>No disputes match this filter.</p></div>
          : (
            <div className="card" style={{ padding: 0 }}>
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>Title</th><th>Raised By</th><th>Against</th><th>Category</th><th>Status</th><th>Date</th><th></th>
                  </tr></thead>
                  <tbody>
                    {disputes.map(d => (
                      <tr key={d._id}>
                        <td><div style={{ fontWeight: 600, maxWidth: 200 }}>{d.title}</div></td>
                        <td>
                          <div style={{ fontSize: 13 }}>{d.raisedBy?.company}</div>
                          <div className="text-xs text-muted">{d.raisedBy?.role}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: 13 }}>{d.againstUser?.company}</div>
                          <div className="text-xs text-muted">{d.againstUser?.role}</div>
                        </td>
                        <td><span className="tag">{d.category}</span></td>
                        <td><span className={`status status-${d.status.includes('resolved') ? 'accepted' : d.status === 'dismissed' ? 'rejected' : d.status === 'open' ? 'pending' : 'viewed'}`}>
                          {DISPUTE_STATUS_LABEL[d.status]}
                        </span></td>
                        <td className="text-sm text-muted">
                          {new Date(d.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => openDetail(d)}>Review →</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
      )}

      {/* Dispute Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => { setSelected(null); setDetail(null); }}>
          <div className="modal-box modal-box-lg" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Dispute Review</h2>
                <p className="modal-sub">{selected.title}</p>
              </div>
              <button className="modal-close" onClick={() => { setSelected(null); setDetail(null); }}>✕</button>
            </div>

            <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              {!detail ? <div className="flex-center" style={{ padding: 32 }}><div className="spinner" /></div> : (
                <>
                  {/* Parties */}
                  <div className="grid-2" style={{ gap: 12, marginBottom: 16 }}>
                    <div className="dispute-party">
                      <div className="section-title">Raised By</div>
                      <div style={{ fontWeight: 600 }}>{detail.raisedBy?.company}</div>
                      <div className="text-sm text-muted">{detail.raisedBy?.name} · {detail.raisedBy?.country}</div>
                      <div className="text-sm text-muted">{detail.raisedBy?.email}</div>
                    </div>
                    <div className="dispute-party">
                      <div className="section-title">Against</div>
                      <div style={{ fontWeight: 600 }}>{detail.againstUser?.company}</div>
                      <div className="text-sm text-muted">{detail.againstUser?.name} · {detail.againstUser?.country}</div>
                      <div className="text-sm text-muted">{detail.againstUser?.email}</div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="dispute-desc">
                    <div className="section-title">Description</div>
                    <p className="text-sm" style={{ color: 'var(--gray-700)', lineHeight: 1.7 }}>{detail.description}</p>
                  </div>

                  {/* Admin notes thread */}
                  {detail.adminNotes?.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div className="section-title">Admin Notes</div>
                      {detail.adminNotes.map((n, i) => (
                        <div key={i} className="admin-note-item">
                          <div className="text-xs text-muted">{n.admin?.name} · {new Date(n.addedAt).toLocaleString()}</div>
                          <p className="text-sm" style={{ marginTop: 4, color: 'var(--gray-700)' }}>{n.note}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="divider" />

                  {/* Add note */}
                  {!detail.resolvedAt && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Add Admin Note</label>
                        <textarea className="form-textarea" rows={3} value={note}
                          onChange={e => setNote(e.target.value)}
                          placeholder="Internal note or communication to parties…" />
                        <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }}
                          onClick={addNote} disabled={submitting || !note.trim()}>
                          Add Note
                        </button>
                      </div>

                      <div className="divider" />

                      {/* Resolve */}
                      <div className="form-group">
                        <label className="form-label">Resolve Dispute</label>
                        <div className="resolution-options">
                          {[
                            { val: 'resolved_favour_raiser',    label: 'Resolve — Favour Raiser' },
                            { val: 'resolved_favour_defendant', label: 'Resolve — Favour Defendant' },
                            { val: 'dismissed',                 label: 'Dismiss (no merit)' },
                          ].map(opt => (
                            <label key={opt.val} className={`resolution-option${resolution === opt.val ? ' active' : ''}`}>
                              <input type="radio" name="resolution" value={opt.val}
                                checked={resolution === opt.val} onChange={() => setResolution(opt.val)} />
                              {opt.label}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Resolution Summary</label>
                        <textarea className="form-textarea" rows={3} value={resolutionText}
                          onChange={e => setResolutionText(e.target.value)}
                          placeholder="Brief summary of the decision and any actions taken…" />
                      </div>
                    </>
                  )}

                  {detail.resolvedAt && (
                    <div className="resolution-summary">
                      <div className="section-title">Resolution</div>
                      <p className="text-sm" style={{ color: 'var(--gray-700)' }}>{detail.resolution}</p>
                      <div className="text-xs text-muted" style={{ marginTop: 6 }}>
                        Resolved {new Date(detail.resolvedAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {!detail?.resolvedAt && (
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => { setSelected(null); setDetail(null); }}>Close</button>
                <button className="btn btn-primary" onClick={resolve} disabled={submitting || !resolution}>
                  {submitting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Submit Resolution'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN ADMIN PANEL
// ════════════════════════════════════════════════════════════════
const TABS = [
  { id: 'overview',  label: 'Dashboard' },
  { id: 'certs',     label: 'Cert Review' },
  { id: 'users',     label: 'Users & Plans' },
  { id: 'disputes',  label: 'Disputes' },
];

export default function AdminPanel() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/dashboard');
    
    // Sync tab state with URL query ?tab=...
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && TABS.some(t => t.id === tabParam)) {
      setTab(tabParam);
    } else {
      setTab('overview');
    }
  }, [user, navigate, location.search]);

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="page">
      <div className="container">
        <div className="analytics-header" style={{ marginBottom: 24 }}>
          <div>
            <h1 className="analytics-title">
              {TABS.find(t => t.id === tab)?.label || 'Admin Panel'}
            </h1>
            <p className="analytics-sub">Platform management · {TABS.find(t => t.id === tab)?.id === 'overview' ? 'Stats at a glance' : TABS.find(t => t.id === tab)?.label}</p>
          </div>
        </div>

        {/* Internal tabs removed as they are now in the sidebar */}

        {tab === 'overview'  && <OverviewSection  token={token} />}
        {tab === 'certs'     && <CertSection      token={token} />}
        {tab === 'users'     && <UsersSection     token={token} />}
        {tab === 'disputes'  && <DisputesSection  token={token} />}
      </div>
    </div>
  );
}