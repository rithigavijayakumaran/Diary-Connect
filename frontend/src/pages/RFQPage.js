import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export function RFQPage() {
  const { user } = useAuth();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    axios.get('/api/rfq/my').then(r => setRfqs(r.data.data)).finally(() => setLoading(false));
  }, []);

  const STATUSES = ['all','pending','viewed','quoted','negotiating','accepted','rejected'];
  const filtered = filter === 'all' ? rfqs : rfqs.filter(r => r.status === filter);

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{user?.role === 'importer' ? 'My RFQs' : 'Inquiries'}</h1>
        <p>{rfqs.length} total requests</p>
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: '0.8125rem', fontWeight: 500,
              border: `1px solid ${filter === s ? 'var(--black)' : 'var(--gray-200)'}`,
              background: filter === s ? 'var(--black)' : 'var(--white)',
              color: filter === s ? 'var(--white)' : 'var(--gray-600)',
              cursor: 'pointer', textTransform: 'capitalize'
            }}>
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card empty">
          <h3>No RFQs {filter !== 'all' ? `with status "${filter}"` : 'yet'}</h3>
          {user?.role === 'importer' && <Link to="/catalog" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Catalog</Link>}
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {filtered.map(rfq => (
            <Link to={`/rfq/${rfq._id}`} key={rfq._id}
              style={{ display: 'block', padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', transition: 'background var(--transition)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div className="flex-between" style={{ marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--black)' }}>{rfq.title}</span>
                <span className={`status status-${rfq.status}`}>{rfq.status}</span>
              </div>
              <div style={{ display: 'flex', gap: 20, fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                <span>{rfq.productCategory}</span>
                <span style={{ fontFamily: 'var(--mono)' }}>{rfq.quantity} {rfq.quantityUnit}</span>
                {rfq.targetPrice && <span style={{ fontFamily: 'var(--mono)' }}>Target: ${rfq.targetPrice?.toLocaleString()}</span>}
                <span>{user?.role === 'importer' ? rfq.manufacturer?.company : rfq.importer?.company}</span>
                <span style={{ marginLeft: 'auto' }}>{new Date(rfq.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function RFQDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [quote, setQuote] = useState({ price: '', validUntil: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [dispute, setDispute] = useState({ category: 'quality', title: '', description: '' });
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  const load = () => axios.get(`/api/rfq/${id}`).then(r => setRfq(r.data.data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  const sendMessage = async e => {
    e.preventDefault();
    if (!msg.trim()) return;
    setSubmitting(true);
    try {
      await axios.post(`/api/rfq/${id}/message`, { content: msg });
      setMsg('');
      load();
      toast.success('Message sent');
    } finally { setSubmitting(false); }
  };

  const submitQuote = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`/api/rfq/${id}/quote`, { ...quote, price: Number(quote.price), currency: 'USD' });
      toast.success('Quotation submitted');
      load();
    } finally { setSubmitting(false); }
  };

  const updateStatus = async status => {
    await axios.put(`/api/rfq/${id}/status`, { status });
    toast.success(`Status updated to ${status}`);
    load();
  };

  const raiseDispute = async e => {
    e.preventDefault();
    if (!dispute.title.trim() || !dispute.description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setDisputeSubmitting(true);
    try {
      const againstUserId = isManufacturer ? rfq.importer?._id : rfq.manufacturer?._id;
      await axios.post(`/api/rfq/${id}/dispute`, {
        category: dispute.category,
        title: dispute.title,
        description: dispute.description,
        againstUserId,
      });
      toast.success('Dispute raised — admin will review it shortly');
      setDisputeOpen(false);
      setDispute({ category: 'quality', title: '', description: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to raise dispute');
    } finally { setDisputeSubmitting(false); }
  };

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" /></div>;
  if (!rfq) return <div className="empty"><h3>RFQ not found</h3></div>;

  const isManufacturer = user?.role === 'manufacturer';

  return (
    <div>
      <div style={{ marginBottom: 16, fontSize: '0.85rem', color: 'var(--gray-400)' }}>
        <Link to="/rfq" style={{ color: 'var(--gray-400)' }}>{isManufacturer ? 'Inquiries' : 'My RFQs'}</Link> › {rfq.title}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        <div>
          {/* Header */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="flex-between" style={{ marginBottom: 12 }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--black)', letterSpacing: '-0.02em' }}>{rfq.title}</h1>
              <span className={`status status-${rfq.status}`}>{rfq.status}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div><div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: 2 }}>Category</div><div style={{ fontWeight: 500 }}>{rfq.productCategory}</div></div>
              <div><div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: 2 }}>Quantity</div><div style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{rfq.quantity} {rfq.quantityUnit}</div></div>
              {rfq.targetPrice && <div><div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: 2 }}>Target Price</div><div style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>${rfq.targetPrice?.toLocaleString()}/{rfq.quantityUnit}</div></div>}
              {rfq.deliveryPort && <div><div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: 2 }}>Delivery Port</div><div style={{ fontWeight: 500 }}>{rfq.deliveryPort}</div></div>}
              {rfq.paymentTerms && <div><div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: 2 }}>Payment Terms</div><div style={{ fontWeight: 500 }}>{rfq.paymentTerms}</div></div>}
            </div>
            {rfq.specialRequirements && (
              <div style={{ marginTop: 14, padding: 12, background: 'var(--gray-50)', borderRadius: 'var(--radius)', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                <span style={{ fontWeight: 500 }}>Special Requirements: </span>{rfq.specialRequirements}
              </div>
            )}
            {rfq.certificationRequired?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginRight: 8 }}>Certifications required:</span>
                {rfq.certificationRequired.map(c => <span key={c} className="tag" style={{ marginRight: 4 }}>{c}</span>)}
              </div>
            )}
          </div>

          {/* Quotations */}
          {rfq.quotations?.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <p className="section-title">Quotations ({rfq.quotations.length})</p>
              {rfq.quotations.map((q, i) => (
                <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--black)' }}>${q.price?.toLocaleString()} / {rfq.quantityUnit}</span>
                    {q.validUntil && <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>Valid until {new Date(q.validUntil).toLocaleDateString()}</span>}
                  </div>
                  {q.notes && <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{q.notes}</p>}
                </div>
              ))}
              {!isManufacturer && rfq.status === 'quoted' && (
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={() => updateStatus('accepted')}>Accept Quote</button>
                  <button className="btn btn-secondary" onClick={() => updateStatus('negotiating')}>Negotiate</button>
                  <button className="btn btn-ghost" style={{ color: 'var(--gray-400)' }} onClick={() => updateStatus('rejected')}>Reject</button>
                </div>
              )}
            </div>
          )}

          {/* Submit Quote (manufacturer) */}
          {isManufacturer && ['pending','viewed','negotiating'].includes(rfq.status) && (
            <div className="card" style={{ marginBottom: 16 }}>
              <p className="section-title">Submit Quotation</p>
              <form onSubmit={submitQuote}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Your Price (USD/{rfq.quantityUnit})</label>
                    <input className="form-input" type="number" value={quote.price} onChange={e => setQuote({...quote, price: e.target.value})} required placeholder="2750" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Valid Until</label>
                    <input className="form-input" type="date" value={quote.validUntil} onChange={e => setQuote({...quote, validUntil: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" value={quote.notes} onChange={e => setQuote({...quote, notes: e.target.value})} placeholder="Delivery timeline, packaging, conditions..." />
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Submit Quotation'}
                </button>
              </form>
            </div>
          )}

          {/* Message thread */}
          <div className="card">
            <p className="section-title">Messages ({rfq.messages?.length || 0})</p>
            {rfq.messages?.length === 0 && <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)', marginBottom: 16 }}>No messages yet. Start the conversation.</p>}
            <div style={{ marginBottom: 16 }}>
              {rfq.messages?.map((m, i) => {
                const currentUserId = user?._id || user?.id;
                const senderId = m.sender?._id || m.sender;
                const mine = String(senderId) === String(currentUserId);
                return (
                  <div key={i} style={{ padding: '10px 14px', marginBottom: 8, background: mine ? 'var(--black)' : 'var(--gray-100)', borderRadius: 'var(--radius)', maxWidth: '80%', marginLeft: mine ? 'auto' : 0 }}>
                    <div style={{ fontSize: '0.75rem', color: mine ? 'var(--gray-400)' : 'var(--gray-500)', marginBottom: 4, fontWeight: 500 }}>
                      {mine ? 'You' : (isManufacturer ? rfq.importer?.company || rfq.importer?.name : rfq.manufacturer?.company || rfq.manufacturer?.name)}
                    </div>
                    <p style={{ fontSize: '0.875rem', color: mine ? 'var(--white)' : 'var(--gray-800)', marginBottom: 2 }}>{m.content}</p>
                    <p style={{ fontSize: '0.75rem', color: mine ? 'var(--gray-400)' : 'var(--gray-500)', textAlign: mine ? 'right' : 'left' }}>
                      {new Date(m.sentAt).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
            {!['closed','rejected'].includes(rfq.status) && (
              <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8 }}>
                <input className="form-input" value={msg} onChange={e => setMsg(e.target.value)} placeholder="Type a message..." required style={{ flex: 1 }} />
                <button type="submit" className="btn btn-primary" disabled={submitting}>Send</button>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <p className="section-title">{isManufacturer ? 'Importer' : 'Manufacturer'}</p>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{isManufacturer ? rfq.importer?.name : rfq.manufacturer?.name}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: 4 }}>{isManufacturer ? rfq.importer?.company : rfq.manufacturer?.company}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-400)' }}>{isManufacturer ? rfq.importer?.country : rfq.manufacturer?.country}</div>
            {!isManufacturer && (
              <Link to={`/manufacturers/${rfq.manufacturer?._id}`} className="btn btn-secondary btn-sm btn-full" style={{ marginTop: 12 }}>View Profile</Link>
            )}
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <p className="section-title">Status</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="flex-between"><span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Current</span><span className={`status status-${rfq.status}`}>{rfq.status}</span></div>
              <div className="flex-between"><span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Submitted</span><span style={{ fontSize: '0.85rem' }}>{new Date(rfq.createdAt).toLocaleDateString()}</span></div>
              {rfq.quotations?.length > 0 && <div className="flex-between"><span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Quotes</span><span style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem' }}>{rfq.quotations.length}</span></div>}
            </div>
            {isManufacturer && rfq.status === 'accepted' && (
              <button className="btn btn-secondary btn-sm btn-full" style={{ marginTop: 12 }} onClick={() => updateStatus('closed')}>Mark as Closed</button>
            )}
          </div>

          {/* Raise Dispute */}
          {['quoted','negotiating','accepted','closed'].includes(rfq.status) && (
            <div className="card" style={{ borderColor: 'var(--gray-200)' }}>
              <p className="section-title">Issues?</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 12, lineHeight: 1.5 }}>
                If you have a problem with this transaction, raise a formal dispute for admin review.
              </p>
              <button
                className="btn btn-secondary btn-sm btn-full"
                style={{ borderColor: 'var(--gray-300)', color: 'var(--gray-700)' }}
                onClick={() => setDisputeOpen(true)}
              >
                ⚑ Raise Dispute
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Raise Dispute Modal ─────────────────────────────── */}
      {disputeOpen && (
        <div className="modal-overlay" onClick={() => setDisputeOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">⚑ Raise a Dispute</h2>
                <p className="modal-sub">Against: <strong>{isManufacturer ? rfq.importer?.company : rfq.manufacturer?.company}</strong> · RFQ: {rfq.title}</p>
              </div>
              <button className="modal-close" onClick={() => setDisputeOpen(false)}>✕</button>
            </div>

            <form onSubmit={raiseDispute}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-select" value={dispute.category}
                    onChange={e => setDispute(p => ({ ...p, category: e.target.value }))}>
                    <option value="payment">Payment Issue</option>
                    <option value="quality">Quality / Specification Mismatch</option>
                    <option value="delivery">Delivery Failure</option>
                    <option value="fraud">Fraud / Misrepresentation</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Dispute Title *</label>
                  <input className="form-input" value={dispute.title}
                    onChange={e => setDispute(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Product quality does not match specification"
                    required />
                </div>

                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea className="form-textarea" rows={5} value={dispute.description}
                    onChange={e => setDispute(p => ({ ...p, description: e.target.value }))}
                    placeholder="Describe the issue in detail — include dates, amounts, what was agreed vs what happened..."
                    required style={{ minHeight: 120 }} />
                </div>

                <div style={{
                  background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
                  borderRadius: 'var(--radius)', padding: '10px 14px',
                  fontSize: '0.8rem', color: 'var(--gray-500)', lineHeight: 1.5
                }}>
                  ℹ️ Your dispute will be reviewed by the DairyBridge admin team within 24–48 hours. Both parties may be contacted for additional information.
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setDisputeOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={disputeSubmitting}>
                  {disputeSubmitting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Submit Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RFQPage;
