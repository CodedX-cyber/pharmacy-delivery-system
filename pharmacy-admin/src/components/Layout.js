import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const location = useLocation();
  const { logout, admin } = useAuth();

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
  };

  // Don't show layout on login page
  if (location.pathname === '/login') {
    return children;
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">💊</span>
            <span className="logo-text">Pharmacy Admin</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/dashboard"
            className={`nav-item ${isActivePath('/dashboard') ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </Link>

          <Link
            to="/orders"
            className={`nav-item ${isActivePath('/orders') ? 'active' : ''}`}
          >
            <span className="nav-icon">📦</span>
            <span className="nav-text">Orders</span>
          </Link>

          <Link
            to="/drugs"
            className={`nav-item ${isActivePath('/drugs') ? 'active' : ''}`}
          >
            <span className="nav-icon">💊</span>
            <span className="nav-text">Drugs</span>
          </Link>

          <Link
            to="/reports"
            className={`nav-item ${isActivePath('/reports') ? 'active' : ''}`}
          >
            <span className="nav-icon">📈</span>
            <span className="nav-text">Reports</span>
          </Link>

          {/* Medical Records Section */}
          <div className="nav-section">
            <div className="nav-section-title">Medical Records</div>
            <Link
              to="/medical/doctors"
              className={`nav-item ${isActivePath('/medical/doctors') ? 'active' : ''}`}
            >
              <span className="nav-icon">👨‍⚕️</span>
              <span className="nav-text">Doctors</span>
            </Link>

            <Link
              to="/medical/reports"
              className={`nav-item ${isActivePath('/medical/reports') ? 'active' : ''}`}
            >
              <span className="nav-icon">📋</span>
              <span className="nav-text">Medical Reports</span>
            </Link>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="admin-avatar">
              {admin?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="admin-details">
              <div className="admin-name">{admin?.name || 'Admin'}</div>
              <div className="admin-email">{admin?.email || ''}</div>
            </div>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            <span className="logout-icon">🚪</span>
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="top-header">
          <div className="header-content">
            <h1 className="page-title">
              {getPageTitle(location.pathname)}
            </h1>
            <div className="header-actions">
              <div className="time-display">
                {new Date().toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        </header>

        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
};

const getPageTitle = (pathname) => {
  switch (pathname) {
    case '/dashboard':
      return 'Dashboard';
    case '/orders':
      return 'Order Management';
    case '/drugs':
      return 'Drug Management';
    case '/reports':
      return 'Sales Dashboard';
    case '/medical/doctors':
      return 'Doctors Management';
    case '/medical/reports':
      return 'Medical Reports Management';
    default:
      return 'Pharmacy Admin';
  }
};

export default Layout;
