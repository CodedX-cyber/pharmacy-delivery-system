import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrdersToday: 0,
    revenueToday: 0,
    pendingOrders: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Get all orders
      const response = await ordersAPI.getAll();
      const orders = response.data.orders;
      
      // Calculate today's stats
      const today = new Date().toDateString();
      const todayOrders = orders.filter(order => 
        new Date(order.created_at).toDateString() === today
      );
      
      const todayRevenue = todayOrders.reduce((sum, order) => 
        sum + parseFloat(order.total_amount), 0
      );
      
      const pendingOrders = orders.filter(order => 
        order.status === 'pending'
      ).length;
      
      // Get recent orders (last 10)
      const recentOrders = orders
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10);

      setStats({
        totalOrdersToday: todayOrders.length,
        revenueToday: todayRevenue,
        pendingOrders,
        recentOrders,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#ffc107';
      case 'processing':
        return '#007bff';
      case 'out_for_delivery':
        return '#17a2b8';
      case 'delivered':
        return '#28a745';
      case 'cancelled':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome to your pharmacy management dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon orders-icon">
            📦
          </div>
          <div className="stat-content">
            <h3>{stats.totalOrdersToday}</h3>
            <p>Orders Today</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue-icon">
            💰
          </div>
          <div className="stat-content">
            <h3>${stats.revenueToday.toFixed(2)}</h3>
            <p>Revenue Today</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending-icon">
            ⏳
          </div>
          <div className="stat-content">
            <h3>{stats.pendingOrders}</h3>
            <p>Pending Orders</p>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="recent-orders">
        <div className="section-header">
          <h2>Recent Orders</h2>
          <button 
            className="refresh-button"
            onClick={fetchDashboardData}
          >
            🔄 Refresh
          </button>
        </div>

        <div className="table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.customer_name}</td>
                    <td>{formatDate(order.created_at)}</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td>${order.total_amount}</td>
                    <td>
                      <button className="action-button">
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-orders">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
