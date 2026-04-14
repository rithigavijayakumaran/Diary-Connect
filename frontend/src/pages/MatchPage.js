import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function ScoreBar({ score }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: 'var(--gray-200)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: score > 70 ? 'var(--black)' : score > 40 ? 'var(--gray-500)' : 'var(--gray-300)', borderRadius: 2 }} />
      </div>
      <span style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-700)', minWidth: 32 }}>{score}%</span>
    </div>
  );
}

export default function MatchPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = user?.role === 'importer' ? '/api/match/products' : '/api/match/importers';
    axios.get(url).then(r => setMatches(r.data.data)).finally(() => setLoading(false));
  }, [user]);

  const isImporter = user?.role === 'importer';

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>AI Match Engine</h1>
        <p>{isImporter ? 'Products matched to your preferences, certifications and target markets' : 'Importers most likely to be interested in your products'}</p>
      </div>

      <div style={{ padding: '12px 16px', background: 'var(--gray-100)', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)', marginBottom: 24, fontSize: '0.875rem', color: 'var(--gray-600)' }}>
        <strong>How matching works:</strong> Scores are calculated based on category preferences, regulatory market overlap, certifications, manufacturer rating, price range, and cold chain capability. Higher score = stronger fit.
      </div>

      {matches.length === 0 ? (
        <div className="card empty">
          <h3>No matches yet</h3>
          <p>{isImporter ? 'Update your importer profile with preferred categories to get recommendations' : 'Add products to your listing to start getting matched with importers'}</p>
          <Link to="/profile" className="btn btn-primary" style={{ marginTop: 16 }}>Update Profile</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {matches.map((item, idx) => isImporter ? (
            <Link to={`/products/${item._id}`} key={item._id} className="card card-hover" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'center', textDecoration: 'none' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--gray-400)' }}>#{idx + 1}</span>
                  <h3 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--black)' }}>{item.name}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', background: 'var(--gray-100)', padding: '2px 8px', borderRadius: 10 }}>{item.category}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: 10 }}>{item.manufacturer?.company} · {item.manufacturer?.country}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {item.certifications?.slice(0, 4).map(c => <span key={c} className="tag">{c}</span>)}
                </div>
                <ScoreBar score={item.matchScore} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--black)' }}>${item.pricing?.basePrice?.toLocaleString()}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>per {item.pricing?.unit}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: 4 }}>MOQ: {item.pricing?.moq} {item.pricing?.moqUnit}</div>
              </div>
            </Link>
          ) : (
            <div key={item._id} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--gray-400)' }}>#{idx + 1}</span>
                  <h3 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--black)' }}>{item.company}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', background: 'var(--gray-100)', padding: '2px 8px', borderRadius: 10 }}>{item.country}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: 8 }}>
                  {item.importerProfile?.preferredCategories?.join(', ') || 'No categories set'}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {item.importerProfile?.regulatoryMarkets?.map(m => <span key={m} className="tag">{m}</span>)}
                </div>
                <ScoreBar score={item.matchScore} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{item.importerProfile?.annualImportVolume || 'Volume N/A'}</div>
                <Link to={`/rfq/create/${item._id}`} className="btn btn-primary btn-sm" style={{ marginTop: 10 }}>Send RFQ</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
