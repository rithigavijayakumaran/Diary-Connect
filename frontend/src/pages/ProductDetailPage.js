import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Row = ({ label, value }) => value ? (
  <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-100)', padding: '10px 0' }}>
    <span style={{ width: 180, flexShrink: 0, fontSize: '0.875rem', color: 'var(--gray-500)' }}>{label}</span>
    <span style={{ fontSize: '0.875rem', color: 'var(--gray-900)', fontWeight: 400 }}>{value}</span>
  </div>
) : null;

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/products/${id}`).then(res => {
      setProduct(res.data.data);
      return axios.get(`/api/match/similar/${id}`);
    }).then(res => setSimilar(res.data.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" /></div>;
  if (!product) return <div className="empty"><h3>Product not found</h3></div>;

  const specs = product.specifications || {};

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 20, fontSize: '0.85rem', color: 'var(--gray-400)' }}>
        <Link to="/catalog" style={{ color: 'var(--gray-400)' }}>Catalog</Link> › {product.category} › {product.name}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* Main */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{product.category}</span>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--black)', letterSpacing: '-0.02em', marginBottom: 12 }}>{product.name}</h1>
            <p style={{ fontSize: '0.9375rem', color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: 16 }}>{product.description}</p>
            <div className="tag-list">
              {product.certifications?.map(c => <span key={c} className="tag">{c}</span>)}
            </div>
          </div>

          {/* Specifications */}
          <div className="card" style={{ marginBottom: 16 }}>
            <p className="section-title">Technical Specifications</p>
            <Row label="Fat Content" value={specs.fatContent} />
            <Row label="Moisture Content" value={specs.moistureContent} />
            <Row label="Protein Content" value={specs.proteinContent} />
            <Row label="Shelf Life" value={specs.shelfLife} />
            <Row label="Storage Temperature" value={specs.storageTemp} />
            <Row label="Grade" value={specs.grade} />
            {specs.packagingFormats?.length > 0 && (
              <Row label="Packaging Formats" value={specs.packagingFormats.join(', ')} />
            )}
          </div>

          {/* Pricing */}
          <div className="card">
            <p className="section-title">Pricing & Trade Info</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 4 }}>Base Price</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--black)' }}>${product.pricing?.basePrice?.toLocaleString()}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>per {product.pricing?.unit}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 4 }}>Min Order Qty</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--black)' }}>{product.pricing?.moq}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>{product.pricing?.moqUnit}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 4 }}>Cold Chain</div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--black)' }}>{product.coldChainRequired ? 'Required' : 'Not Required'}</div>
              </div>
            </div>
            {product.targetMarkets?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 6 }}>Target Markets</div>
                <div className="tag-list">{product.targetMarkets.map(m => <span key={m} className="tag">{m}</span>)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Manufacturer card */}
          <div className="card" style={{ marginBottom: 16 }}>
            <p className="section-title">Manufacturer</p>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 600, color: 'var(--black)', marginBottom: 4 }}>{product.manufacturer?.company}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{product.manufacturer?.country}</div>
              {product.manufacturer?.manufacturerProfile?.state && (
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{product.manufacturer?.manufacturerProfile?.state}</div>
              )}
            </div>
            {product.manufacturer?.manufacturerProfile?.rating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--black)' }}>{product.manufacturer?.manufacturerProfile?.rating}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>/ 5.0 rating</span>
              </div>
            )}
            <div className="tag-list" style={{ marginBottom: 14 }}>
              {product.manufacturer?.manufacturerProfile?.certifications?.map(c => <span key={c} className="tag">{c}</span>)}
            </div>
            <Link to={`/manufacturers/${product.manufacturer?._id}`} className="btn btn-secondary btn-sm btn-full" style={{ marginBottom: 8 }}>View Profile</Link>
            {user?.role === 'importer' && (
              <button className="btn btn-primary btn-full"
                onClick={() => navigate(`/rfq/create/${product.manufacturer?._id}`, { state: { product } })}>
                Send RFQ
              </button>
            )}
            {!user && (
              <Link to="/register" className="btn btn-primary btn-full">Register to Send RFQ</Link>
            )}
          </div>

          {/* Stats */}
          <div className="card">
            <div className="flex-between" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Views</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.875rem', fontWeight: 600 }}>{product.views}</span>
            </div>
            <div className="flex-between">
              <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Inquiries</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.875rem', fontWeight: 600 }}>{product.inquiries}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Similar products */}
      {similar.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <p className="section-title">Similar Products</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {similar.map(p => (
              <Link to={`/products/${p._id}`} key={p._id} className="card card-hover" style={{ display: 'block' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: 4 }}>{p.category}</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.875rem' }}>${p.pricing?.basePrice?.toLocaleString()} /{p.pricing?.unit}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
