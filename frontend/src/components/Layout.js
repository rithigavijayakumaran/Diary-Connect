import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV_MANUFACTURER = [
  { path: '/dashboard',   label: 'Dashboard' },
  { path: '/my-products', label: 'My Products' },
  { path: '/rfq',         label: 'Inquiries' },
  { path: '/messages',    label: 'Messages' },
  { path: '/analytics',  label: 'Analytics' },
  { path: '/match',       label: 'AI Match' },
  { path: '/compliance',  label: 'Compliance' },
];

const NAV_IMPORTER = [
  { path: '/dashboard',  label: 'Dashboard' },
  { path: '/catalog',    label: 'Product Catalog' },
  { path: '/rfq',        label: 'My RFQs' },
  { path: '/messages',   label: 'Messages' },
  { path: '/analytics', label: 'Analytics' },
  { path: '/match',      label: 'AI Match' },
  { path: '/compliance', label: 'Compliance' },
];

const NAV_ADMIN = [
  { path: '/admin?tab=overview', label: 'Dashboard' },
  { path: '/admin?tab=certs',    label: 'Cert Review' },
  { path: '/admin?tab=users',    label: 'Users & Plans' },
  { path: '/admin?tab=disputes', label: 'Disputes' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const currentPathWithQuery = location.pathname + location.search;
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = user?.role === 'manufacturer' ? NAV_MANUFACTURER
                 : user?.role === 'admin'        ? NAV_ADMIN
                 : NAV_IMPORTER;

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/');
  };

  const isNavItemActive = (itemPath) => {
    if (user?.role === 'admin') {
      // For admin, query params matter (tab=...)
      return currentPathWithQuery === itemPath || (itemPath === '/admin?tab=overview' && location.pathname === '/admin' && !location.search);
    }
    return location.pathname === itemPath || location.pathname.startsWith(itemPath + '/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0, background: 'var(--white)',
        borderRight: '1px solid var(--gray-200)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
        overflow: 'hidden'
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--gray-100)' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, background: 'var(--black)',
              borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ color: 'var(--white)', fontSize: '0.75rem', fontWeight: 700 }}>DB</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: '1rem', letterSpacing: '-0.02em' }}>DiaryConnect</span>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {navItems.map(item => {
            const active = isNavItemActive(item.path);
            return (
              <Link key={item.path} to={item.path} style={{
                display: 'block', padding: '8px 10px', marginBottom: 2,
                borderRadius: 'var(--radius)',
                fontSize: '0.9rem', fontWeight: active ? 500 : 400,
                color: active ? 'var(--black)' : 'var(--gray-600)',
                background: active ? 'var(--gray-100)' : 'transparent',
                transition: 'all var(--transition)'
              }}
              onMouseEnter={e => { if (!active) e.target.style.background = 'var(--gray-50)'; }}
              onMouseLeave={e => { if (!active) e.target.style.background = 'transparent'; }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User block */}
        {user && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--gray-100)' }}>
            <Link to={user.role === 'admin' ? '/admin' : '/profile'} style={{ display: 'block', marginBottom: 8 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--gray-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ fontSize: '0.8rem', color: user.role === 'admin' ? 'var(--gray-700)' : 'var(--gray-400)', textTransform: 'capitalize', fontWeight: user.role === 'admin' ? 600 : 400 }}>
                {user.role === 'admin' ? 'Administrator' : `${user.role} · ${user.country}`}
              </div>
            </Link>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--gray-500)', fontSize: '0.8125rem' }}>
              Sign out
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0, overflowX: 'hidden' }}>
        {/* Top bar */}
        <div style={{
          height: 54, background: 'var(--white)',
          borderBottom: '1px solid var(--gray-200)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', position: 'sticky', top: 0, zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {location.pathname !== '/' && location.pathname !== '/dashboard' && (
              <button 
                onClick={() => navigate(-1)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
              >
                <span>←</span> Back
              </button>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--gray-400)', textTransform: 'capitalize' }}>
              {(location.pathname === '/dashboard' || location.pathname === '/') && (
                user ? <>Welcome back, <span style={{ color: 'var(--gray-700)', fontWeight: 500 }}>{user.name.split(' ')[0]}</span></> : 'DiaryConnect Platform'
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user?.role === 'manufacturer' && (
              <Link to="/products/add" className="btn btn-primary btn-sm">+ Add Product</Link>
            )}
            {user?.role === 'importer' && (
              <Link to="/catalog" className="btn btn-primary btn-sm">Browse Catalog</Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className="btn btn-primary btn-sm">⚙ Admin Panel</Link>
            )}
          </div>
        </div>

        <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
