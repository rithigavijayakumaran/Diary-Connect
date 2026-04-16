/**
 * CertUploadPanel.jsx
 * Drop this component into your manufacturer profile or dashboard page.
 * Shows upload status for each cert type, lets manufacturer upload docs.
 *
 * Usage:  <CertUploadPanel />
 */
import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CERT_TYPES = ['FSSAI', 'APEDA', 'ISO_9001', 'ISO_22000', 'HALAL', 'KOSHER', 'ORGANIC', 'FDA'];

const STATUS_CONFIG = {
  approved: { label: '✓ Approved',      cls: 'cert-status-approved' },
  pending:  { label: '⏳ Under Review', cls: 'cert-status-pending'  },
  rejected: { label: '✕ Rejected',      cls: 'cert-status-rejected' },
  none:     { label: 'Not uploaded',    cls: 'cert-status-none'     },
};

export default function CertUploadPanel() {
  const { user, token } = useContext(AuthContext);
  const [docs, setDocs]         = useState([]);
  const [uploading, setUploading] = useState(null); // certType being uploaded
  const fileRefs = useRef({});

  // Load user's cert docs from profile
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.user?.certDocuments) setDocs(d.user.certDocuments); });
  }, [token]);

  const getDocForType = (type) => docs.find(d => d.type === type);

  const handleUpload = async (certType, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return; }
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) { toast.error('Only JPG, PNG or PDF allowed'); return; }

    setUploading(certType);
    const form = new FormData();
    form.append('certFile', file);
    form.append('certType', certType);

    try {
      const res = await fetch(`${API}/certs/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDocs(data.data);
      toast.success(`${certType} submitted for admin review`);
    } catch (e) { toast.error(e.message || 'Upload failed'); }
    finally { setUploading(null); }
  };

  const approvedCount = docs.filter(d => d.status === 'approved').length;

  return (
    <div className="cert-upload-panel">
      <div className="cup-header">
        <div>
          <div className="section-title">Certificate Documents</div>
          <p className="text-sm text-muted" style={{ marginTop: 2 }}>
            Upload your certification documents for admin verification. Verified certs build trust with importers.
          </p>
        </div>
        {approvedCount > 0 && (
          <div className="cup-badge">
            ✓ {approvedCount} cert{approvedCount > 1 ? 's' : ''} verified
          </div>
        )}
      </div>

      <div className="cup-grid">
        {CERT_TYPES.map(type => {
          const doc    = getDocForType(type);
          const status = doc ? doc.status : 'none';
          const cfg    = STATUS_CONFIG[status];
          const isUploading = uploading === type;

          return (
            <div key={type} className={`cup-card${status === 'approved' ? ' cup-card-approved' : ''}`}>
              <div className="cup-card-top">
                <div className="cup-cert-name">{type.replace('_', ' ')}</div>
                <span className={`cup-status ${cfg.cls}`}>{cfg.label}</span>
              </div>

              {doc?.adminNote && status !== 'approved' && (
                <div className={`cup-admin-note${status === 'rejected' ? ' cup-admin-note-rejected' : ''}`}>
                  <strong>Admin: </strong>{doc.adminNote}
                </div>
              )}

              {doc?.fileName && (
                <div className="cup-filename">{doc.fileName}</div>
              )}

              {/* Upload/Re-upload button */}
              {status !== 'approved' && (
                <>
                  <input
                    type="file" accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    ref={el => fileRefs.current[type] = el}
                    onChange={e => handleUpload(type, e.target.files[0])}
                  />
                  <button
                    className="btn btn-secondary btn-sm cup-upload-btn"
                    disabled={isUploading}
                    onClick={() => fileRefs.current[type]?.click()}
                  >
                    {isUploading
                      ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Uploading…</>
                      : status === 'rejected' ? '↺ Re-upload' : '↑ Upload'}
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      <p className="cup-note">
        Accepted formats: PDF, JPG, PNG · Max 5MB per file · Documents are reviewed within 24–48 hours
      </p>
    </div>
  );
}