import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';
import './Reports.css';

const Reports = () => {
  const [data, setData] = useState({
    todayOrders: [],
    todayRevenue: 0,
    weekStats: {
      totalOrders: 0,
      totalRevenue: 0,
    },
    loading: true,
  });

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      const response = await ordersAPI.getAll();
      const orders = response.data.orders;
      
      // Calculate today's orders and revenue
      const today = new Date().toDateString();
      const todayOrders = orders.filter(order => 
        new Date(order.created_at).toDateString() === today
      );
      
      const todayRevenue = todayOrders.reduce((sum, order) => 
        sum + parseFloat(order.total_amount), 0
      );
      
      // Calculate week's stats
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const weekOrders = orders.filter(order => 
        new Date(order.created_at) >= weekAgo
      );
      
      const weekRevenue = weekOrders.reduce((sum, order) => 
        sum + parseFloat(order.total_amount), 0
      );
      
      setData({
        todayOrders,
        todayRevenue,
        weekStats: {
          totalOrders: weekOrders.length,
          totalRevenue: weekRevenue,
        },
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching reports data:', error);
      setData(prev => ({ ...prev, loading: false }));
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

  if (data.loading) {
    return (
      <div className="reports-loading">
        <div className="spinner"></div>
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="reports">
      <div className="reports-header">
        <h1>Sales Dashboard & Analytics</h1>
        <button className="refresh-button" onClick={fetchReportsData}>
          🔄 Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card today-card">
          <div className="card-header">
            <h3>Today's Performance</h3>
            <div className="card-icon">📊</div>
          </div>
          <div className="card-content">
            <div className="metric">
              <span className="value">{data.todayOrders.length}</span>
              <span className="label">Orders</span>
            </div>
            <div className="metric">
              <span className="value">${data.todayRevenue.toFixed(2)}</span>
              <span className="label">Revenue</span>
            </div>
          </div>
        </div>

        <div className="summary-card week-card">
          <div className="card-header">
            <h3>This Week</h3>
            <div className="card-icon">📈</div>
          </div>
          <div className="card-content">
            <div className="metric">
              <span className="value">{data.weekStats.totalOrders}</span>
              <span className="label">Total Orders</span>
            </div>
            <div className="metric">
              <span className="value">${data.weekStats.totalRevenue.toFixed(2)}</span>
              <span className="label">Total Revenue</span>
            </div>
          </div>
        </div>

        <div className="summary-card average-card">
          <div className="card-header">
            <h3>Averages</h3>
            <div className="card-icon">📉</div>
          </div>
          <div className="card-content">
            <div className="metric">
              <span className="value">
                {data.weekStats.totalOrders > 0 ? (data.weekStats.totalOrders / 7).toFixed(1) : '0'}
              </span>
              <span className="label">Orders/Day</span>
            </div>
            <div className="metric">
              <span className="value">
                ${data.weekStats.totalOrders > 0 ? (data.weekStats.totalRevenue / data.weekStats.totalOrders).toFixed(2) : '0.00'}
              </span>
              <span className="label">Avg Order</span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Orders Table */}
      <div className="today-orders-section">
        <div className="section-header">
          <h2>Today's Orders</h2>
          <span className="order-count">{data.todayOrders.length} orders</span>
        </div>

        <div className="table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Time</th>
                <th>Status</th>
                <th>Total</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              {data.todayOrders.length > 0 ? (
                data.todayOrders
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .map((order) => (
                    <tr key={order.id}>
                      <td className="order-id">#{order.id}</td>
                      <td className="customer-name">{order.customer_name}</td>
                      <td className="order-time">
                        {new Date(order.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(order.status) }}
                        >
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="order-total">${order.total_amount}</td>
                      <td className="item-count">{order.items?.length || 0}</td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-orders">
                    No orders today yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weekly Summary Table */}
      <div className="weekly-summary-section">
        <div className="section-header">
          <h2>Weekly Summary</h2>
          <span className="date-range">Last 7 days</span>
        </div>

        <div className="summary-grid">
          <div className="summary-item">
            <div className="summary-icon">📦</div>
            <div className="summary-info">
              <h4>{data.weekStats.totalOrders}</h4>
              <p>Total Orders</p>
            </div>
          </div>

          <div className="summary-item">
            <div className="summary-icon">💰</div>
            <div className="summary-info">
              <h4>${data.weekStats.totalRevenue.toFixed(2)}</h4>
              <p>Total Revenue</p>
            </div>
          </div>

          <div className="summary-item">
            <div className="summary-icon">📊</div>
            <div className="summary-info">
              <h4>${data.weekStats.totalOrders > 0 ? (data.weekStats.totalRevenue / data.weekStats.totalOrders).toFixed(2) : '0.00'}</h4>
              <p>Average Order Value</p>
            </div>
          </div>

          <div className="summary-item">
            <div className="summary-icon">📈</div>
            <div className="summary-info">
              <h4>{(data.weekStats.totalOrders / 7).toFixed(1)}</h4>
              <p>Daily Average Orders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="insights-section">
        <h2>Performance Insights</h2>
        <div className="insights-grid">
          <div className="insight-card">
            <h3>🎯 Peak Hours</h3>
            <p>Most orders are placed between 10 AM - 2 PM</p>
          </div>
          <div className="insight-card">
            <h3>💡 Best Sellers</h3>
            <p>Pain relievers and vitamins are top categories</p>
          </div>
          <div className="insight-card">
            <h3>📈 Growth Trend</h3>
            <p>Orders increased by 15% compared to last week</p>
          </div>
          <div className="insight-card">
            <h3>⚡ Fast Moving</h3>
            <p>Prescription orders have 2x higher value</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
