import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const CATEGORIES = ['All','Ghee','Skimmed Milk Powder','Whole Milk Powder','Butter','Cheese','Paneer','Whey Protein','Casein','UHT Milk','Condensed Milk','Yogurt'];
const CERTS = ['FSSAI','APEDA','ISO_9001','ISO_22000','HALAL','KOSHER','ORGANIC','FDA'];

function ProductCard({ product }) {
  return (
    <Link to={`/products/${product._id}`} className="card card-hover" style={{ display: 'block', textDecoration: 'none' }}>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{product.category}</span>
      </div>
      <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--black)', marginBottom: 8, lineHeight: 1.3 }}>{product.name}</h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: 14, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.description}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
        {product.certifications?.slice(0, 3).map(c => <span key={c} className="tag">{c}</span>)}
      </div>

      <div className="divider" style={{ margin: '12px 0' }} />

      <div className="flex-between">
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--black)', fontFamily: 'var(--mono)' }}>
            ${product.pricing?.basePrice?.toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--gray-400)' }}>/{product.pricing?.unit}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: 2 }}>MOQ: {product.pricing?.moq} {product.pricing?.moqUnit}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)', fontWeight: 500 }}>{product.manufacturer?.company}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{product.manufacturer?.country}</div>
        </div>
      </div>
    </Link>
  );
}

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const cert = searchParams.get('cert') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category && category !== 'All') params.set('category', category);
      if (search) params.set('search', search);
      if (cert) params.set('certification', cert);
      params.set('page', page);
      params.set('limit', 12);
      const res = await axios.get(`/api/products?${params}`);
      setProducts(res.data.data);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } finally { setLoading(false); }
  }, [category, search, cert, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const set = (k, v) => {
    const p = new URLSearchParams(searchParams);
    if (v) p.set(k, v); else p.delete(k);
    p.delete('page');
    setSearchParams(p);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Product Catalog</h1>
        <p>{total} products from verified Indian manufacturers</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>
        {/* Filters sidebar */}
        <div>
          <div className="card card-sm" style={{ marginBottom: 16 }}>
            <p className="section-title">Search</p>
            <input className="form-input" placeholder="Keyword..." defaultValue={search}
              onKeyDown={e => e.key === 'Enter' && set('search', e.target.value)} />
          </div>

          <div className="card card-sm" style={{ marginBottom: 16 }}>
            <p className="section-title">Category</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => set('category', c === 'All' ? '' : c)}
                  style={{
                    padding: '7px 10px', border: 'none', borderRadius: 'var(--radius)',
                    background: (category === c || (!category && c === 'All')) ? 'var(--black)' : 'transparent',
                    color: (category === c || (!category && c === 'All')) ? 'var(--white)' : 'var(--gray-600)',
                    fontSize: '0.85rem', textAlign: 'left', cursor: 'pointer'
                  }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="card card-sm">
            <p className="section-title">Certifications</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {CERTS.map(c => (
                <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                  <input type="checkbox" checked={cert.includes(c)}
                    onChange={() => set('cert', cert === c ? '' : c)}
                    style={{ accentColor: 'var(--black)' }} />
                  {c}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Products grid */}
        <div>
          {loading ? (
            <div className="flex-center" style={{ height: 300 }}><div className="spinner" /></div>
          ) : products.length === 0 ? (
            <div className="card empty">
              <h3>No products found</h3>
              <p>Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
                {products.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
              {/* Pagination */}
              {pages > 1 && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => { const sp = new URLSearchParams(searchParams); sp.set('page', p); setSearchParams(sp); }}
                      className={page === p ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
