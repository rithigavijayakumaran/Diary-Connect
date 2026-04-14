import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AuthShell = ({ title, subtitle, children }) => (
  <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--gray-50)' }}>
    {/* Left panel */}
    <div style={{ width: 440, flexShrink: 0, background: 'var(--black)', padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, background: 'var(--white)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'var(--black)', fontSize: '0.7rem', fontWeight: 700 }}>DB</span>
        </div>
        <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--white)' }}>DiaryConnect</span>
      </Link>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--white)', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 12 }}>
          India's dairy exports,<br />bridged to the world.
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--gray-500)', lineHeight: 1.7 }}>
          A verified B2B marketplace connecting Indian dairy manufacturers with global importers across 50+ countries.
        </p>
      </div>
    </div>

    {/* Right panel */}
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--black)', letterSpacing: '-0.02em', marginBottom: 6 }}>{title}</h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--gray-500)', marginBottom: 32 }}>{subtitle}</p>
        {children}
      </div>
    </div>
  </div>
);

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <AuthShell title="Sign in" subtitle="Enter your credentials to access your account">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="you@example.com" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" placeholder="••••••••" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })} required />
        </div>
        <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Sign in'}
        </button>
      </form>
      <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
        Don't have an account? <Link to="/register" style={{ color: 'var(--black)', fontWeight: 500 }}>Register</Link>
      </div>
      <div style={{ marginTop: 20, padding: '14px', background: 'var(--gray-100)', borderRadius: 'var(--radius)', fontSize: '0.8rem', color: 'var(--gray-600)' }}>
        <strong style={{ display: 'block', marginBottom: 4 }}>Demo accounts</strong>
        Manufacturer: rajesh@amuldairy.demo<br />
        Importer: ahmed@gulffoods.demo<br />
        Password: <span style={{ fontFamily: 'var(--mono)' }}>password123</span>
      </div>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'importer', company: '', country: '', phone: '' });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <AuthShell title="Create account" subtitle="Join DiaryConnect as a manufacturer or importer">
      <form onSubmit={handleSubmit}>
        {/* Role selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {['importer', 'manufacturer'].map(r => (
            <button key={r} type="button" onClick={() => set('role', r)}
              style={{
                padding: '12px', border: `1.5px solid ${form.role === r ? 'var(--black)' : 'var(--gray-200)'}`,
                borderRadius: 'var(--radius)', background: form.role === r ? 'var(--black)' : 'var(--white)',
                color: form.role === r ? 'var(--white)' : 'var(--gray-600)',
                fontSize: '0.875rem', fontWeight: 500, textTransform: 'capitalize', cursor: 'pointer'
              }}>
              {r}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="Your name" value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Company</label>
            <input className="form-input" placeholder="Company name" value={form.company} onChange={e => set('company', e.target.value)} required />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="you@company.com" value={form.email} onChange={e => set('email', e.target.value)} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Country</label>
            <input className="form-input" placeholder="e.g. UAE, India" value={form.country} onChange={e => set('country', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" placeholder="+91 ..." value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
        </div>

        <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Create Account'}
        </button>
      </form>
      <p style={{ marginTop: 20, textAlign: 'center', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
        Already registered? <Link to="/login" style={{ color: 'var(--black)', fontWeight: 500 }}>Sign in</Link>
      </p>
    </AuthShell>
  );
}

export default LoginPage;
