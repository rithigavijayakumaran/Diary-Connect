import React from 'react';
import { Link } from 'react-router-dom';

const STATS = [
  { value: '#1', label: 'Milk Producer Globally' },
  { value: '22%', label: 'World Dairy Output' },
  { value: '₹1.2L Cr', label: 'India Dairy Industry' },
  { value: '50+', label: 'Export Destinations' },
];

const CATEGORIES = ['Ghee','Skimmed Milk Powder','Butter','Cheese','Whey Protein','Paneer','Casein','Organic WMP'];

const HOW = [
  { step: '01', title: 'Register & Verify', desc: 'Create your profile as a manufacturer or importer. Upload certifications for verification.' },
  { step: '02', title: 'List or Browse', desc: 'Manufacturers list products with full specs. Importers search and filter the catalog.' },
  { step: '03', title: 'Match & Connect', desc: 'Our AI engine recommends the best matches. Send RFQs directly to manufacturers.' },
  { step: '04', title: 'Quote & Close', desc: 'Negotiate through the platform, finalize quotations, and close deals securely.' },
];

export default function LandingPage() {
  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: 'var(--white)' }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--white)', borderBottom: '1px solid var(--gray-200)',
        padding: '0 48px', height: 58,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: 'var(--black)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--white)', fontSize: '0.7rem', fontWeight: 700 }}>DB</span>
          </div>
          <span style={{ fontWeight: 600, fontSize: '1rem', letterSpacing: '-0.02em' }}>DiaryConnect</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to="/catalog" className="btn btn-ghost btn-sm">Catalog</Link>
          <Link to="/compliance" className="btn btn-ghost btn-sm">Compliance</Link>
          <Link to="/login" className="btn btn-secondary btn-sm">Sign in</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '96px 48px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ maxWidth: 680 }}>
          <div style={{ display: 'inline-block', padding: '4px 12px', background: 'var(--gray-100)', borderRadius: 20, fontSize: '0.8rem', color: 'var(--gray-600)', fontWeight: 500, marginBottom: 24, border: '1px solid var(--gray-200)' }}>
            India's Premier Dairy Export Platform
          </div>
          <h1 style={{ fontSize: '3.25rem', fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.04em', color: 'var(--black)', marginBottom: 20 }}>
            Connect Indian dairy<br />manufacturers with the world
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--gray-500)', lineHeight: 1.7, marginBottom: 36, maxWidth: 520 }}>
            A dedicated B2B platform linking verified Indian dairy manufacturers with global importers. Browse products, send RFQs, and close export deals — all in one place.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg">Start as Importer</Link>
            <Link to="/register" className="btn btn-secondary btn-lg">List Your Products</Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: 'var(--black)', padding: '48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.25rem', fontWeight: 600, color: 'var(--white)', letterSpacing: '-0.03em' }}>{s.value}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-400)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: '72px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 40 }}>
          <p className="section-title">Product Categories</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--black)' }}>Everything in Indian dairy exports</h2>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {CATEGORIES.map((c, i) => (
            <Link to={`/catalog?category=${encodeURIComponent(c)}`} key={i}
              style={{
                padding: '10px 20px', border: '1px solid var(--gray-200)',
                borderRadius: 40, fontSize: '0.9rem', color: 'var(--gray-700)',
                fontWeight: 400, background: 'var(--white)',
                transition: 'all var(--transition)'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--black)'; e.currentTarget.style.color = 'var(--white)'; e.currentTarget.style.borderColor = 'var(--black)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.color = 'var(--gray-700)'; e.currentTarget.style.borderColor = 'var(--gray-200)'; }}
            >{c}</Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '72px 48px', background: 'var(--gray-50)', borderTop: '1px solid var(--gray-200)', borderBottom: '1px solid var(--gray-200)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <p className="section-title">How It Works</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--black)' }}>From discovery to deal in 4 steps</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {HOW.map((h, i) => (
              <div key={i} style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '28px 24px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: 16 }}>{h.step}</div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--black)', marginBottom: 10 }}>{h.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--gray-500)', lineHeight: 1.6 }}>{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For who */}
      <section style={{ padding: '72px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ background: 'var(--black)', borderRadius: 12, padding: '40px' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>For Importers</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: 16 }}>Source verified Indian dairy at scale</h3>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 28 }}>
              {['AI-matched product recommendations','Filter by Halal, Kosher, FDA, EU standards','Send RFQs to multiple manufacturers at once','Compliance wizard for your target market'].map((f, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, fontSize: '0.9rem', color: 'var(--gray-400)' }}>
                  <span style={{ color: 'var(--white)', marginTop: 1 }}>—</span>{f}
                </li>
              ))}
            </ul>
            <Link to="/register" className="btn btn-secondary">Register as Importer</Link>
          </div>

          <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 12, padding: '40px' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>For Manufacturers</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--black)', letterSpacing: '-0.02em', marginBottom: 16 }}>Reach global buyers without middlemen</h3>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 28 }}>
              {['Showcase products with full export specs','Receive & manage RFQs from verified importers','Analytics on product views and demand by country','Verification badge for FSSAI, APEDA, ISO certs'].map((f, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, fontSize: '0.9rem', color: 'var(--gray-500)' }}>
                  <span style={{ color: 'var(--black)', marginTop: 1 }}>—</span>{f}
                </li>
              ))}
            </ul>
            <Link to="/register" className="btn btn-primary">Register as Manufacturer</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--gray-200)', padding: '32px 48px', background: 'var(--white)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 22, height: 22, background: 'var(--black)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--white)', fontSize: '0.6rem', fontWeight: 700 }}>DB</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>DiaryConnect</span>
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--gray-400)' }}>S8 Final Year Project · Computer Science & Engineering</p>
        </div>
      </footer>
    </div>
  );
}
