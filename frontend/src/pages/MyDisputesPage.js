import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function MyDisputesPage() {
  const { user, token } = useContext(AuthContext);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/rfq/my/disputes/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setDisputes(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const getDisputeStatusLabel = (dispute) => {
    const isRaiser = dispute.raisedBy?._id === user?._id;
    const labels = {
      open: 'Open', under_review: 'Under Review',
      dismissed: 'Dismissed',
      resolved_favour_raiser: isRaiser ? 'Resolved (In your favour)' : 'Resolved (Counterparty favour)',
      resolved_favour_defendant: isRaiser ? 'Resolved (Counterparty favour)' : 'Resolved (In your favour)',
    };
    return labels[dispute.status] || dispute.status;
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1> My Disputes</h1>
        <p>Track disputes raised by you or against your transactions.</p>
      </div>

      {loading ? (
        <div className="flex-center" style={{ padding: 48 }}><div className="spinner" /></div>
      ) : disputes.length === 0 ? (
        <div className="empty">
          <h3>No disputes recorded</h3>
          <p>Disputes will appear here if you raise one on an RFQ or if someone raises one against you.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Related RFQ</th>
                  <th>Counterparty</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {disputes.map(d => (
                  <tr key={d._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{d.title}</div>
                    </td>
                    <td>
                      <Link to={`/rfq/${d.rfq?._id}`} style={{ color: 'var(--black)', textDecoration: 'underline', fontSize: '0.85rem' }}>
                        {d.rfq?.title || 'View RFQ'}
                      </Link>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem' }}>{d.againstUser?.company}</div>
                    </td>
                    <td><span className="tag">{d.category}</span></td>
                    <td>
                      <span className={`status status-${d.status.includes('resolved') ? 'accepted' : d.status === 'dismissed' ? 'rejected' : d.status === 'open' ? 'pending' : 'viewed'}`}>
                        {getDisputeStatusLabel(d)}
                      </span>
                    </td>
                    <td className="text-sm text-muted">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <Link to={`/rfq/${d.rfq?._id}`} className="btn btn-ghost btn-sm">View Details →</Link>
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
