import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ManufacturerProfilePage from './pages/ManufacturerProfilePage';
import Dashboard from './pages/Dashboard';
import MyProductsPage from './pages/MyProductsPage';
import AddProductPage from './pages/AddProductPage';
import RFQPage from './pages/RFQPage';
import RFQDetailPage from './pages/RFQDetailPage';
import CreateRFQPage from './pages/CreateRFQPage';
import MessagesPage from './pages/MessagesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CompliancePage from './pages/CompliancePage';
import MatchPage from './pages/MatchPage';
import ProfilePage from './pages/ProfilePage';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/" element={<LandingPage />} />
    <Route path="/catalog" element={<Layout><CatalogPage /></Layout>} />
    <Route path="/products/:id" element={<Layout><ProductDetailPage /></Layout>} />
    <Route path="/manufacturers/:id" element={<Layout><ManufacturerProfilePage /></Layout>} />
    <Route path="/compliance" element={<Layout><CompliancePage /></Layout>} />

    {/* Auth */}
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

    {/* Private - all roles */}
    <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
    <Route path="/rfq" element={<PrivateRoute><Layout><RFQPage /></Layout></PrivateRoute>} />
    <Route path="/rfq/:id" element={<PrivateRoute><Layout><RFQDetailPage /></Layout></PrivateRoute>} />
    <Route path="/messages" element={<PrivateRoute><Layout><MessagesPage /></Layout></PrivateRoute>} />
    <Route path="/analytics" element={<PrivateRoute><Layout><AnalyticsPage /></Layout></PrivateRoute>} />
    <Route path="/profile" element={<PrivateRoute><Layout><ProfilePage /></Layout></PrivateRoute>} />

    {/* Importer only */}
    <Route path="/rfq/create/:manufacturerId" element={<PrivateRoute roles={['importer']}><Layout><CreateRFQPage /></Layout></PrivateRoute>} />
    <Route path="/match" element={<PrivateRoute roles={['importer','manufacturer']}><Layout><MatchPage /></Layout></PrivateRoute>} />

    {/* Manufacturer only */}
    <Route path="/my-products" element={<PrivateRoute roles={['manufacturer']}><Layout><MyProductsPage /></Layout></PrivateRoute>} />
    <Route path="/products/add" element={<PrivateRoute roles={['manufacturer']}><Layout><AddProductPage /></Layout></PrivateRoute>} />
    <Route path="/products/edit/:id" element={<PrivateRoute roles={['manufacturer']}><Layout><AddProductPage /></Layout></PrivateRoute>} />

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', borderRadius: '4px', border: '1px solid #e5e5e5', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' },
            success: { iconTheme: { primary: '#0a0a0a', secondary: '#fff' } }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
