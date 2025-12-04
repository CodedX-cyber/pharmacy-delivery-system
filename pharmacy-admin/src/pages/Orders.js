import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getAll(statusFilter !== 'all' ? statusFilter : null);
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const openOrderDetail = async (order) => {
    try {
      const response = await ordersAPI.getById(order.id);
      setSelectedOrder(response.data.order);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Failed to fetch order details');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  if (loading) {
    return (
      <div className="orders-loading">
        <div className="spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="orders">
      <div className="orders-header">
        <h1>Order Management</h1>
        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="refresh-button" onClick={fetchOrders}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Status</th>
              <th>Total</th>
              <th>Items</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <tr 
                  key={order.id}
                  className="order-row"
                  onClick={() => openOrderDetail(order)}
                >
                  <td className="order-id">#{order.id}</td>
                  <td className="customer-name">{order.customer_name}</td>
                  <td className="order-date">{formatDate(order.created_at)}</td>
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
                  <td className="actions">
                    <button
                      className="view-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openOrderDetail(order);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-orders">
                  {statusFilter === 'all' 
                    ? 'No orders found.' 
                    : `No ${statusFilter} orders found.`
                  }
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal order-detail-modal">
            <div className="modal-header">
              <h2>Order Details - #{selectedOrder.id}</h2>
              <button
                className="close-button"
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedOrder(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {/* Customer Information */}
              <div className="detail-section">
                <h3>Customer Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Name:</span>
                    <span className="value">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Email:</span>
                    <span className="value">{selectedOrder.customer_email}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Phone:</span>
                    <span className="value">{selectedOrder.customer_phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="detail-section">
                <h3>Delivery Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Address:</span>
                    <span className="value">{selectedOrder.delivery_address}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Payment Method:</span>
                    <span className="value">
                      {selectedOrder.payment_method === 'cash' ? 'Cash on Delivery' : 'Card'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Current Status:</span>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(selectedOrder.status) }}
                    >
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="detail-section">
                <h3>Order Items</h3>
                <div className="items-table-container">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Drug</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item, index) => (
                        <tr key={index}>
                          <td>{item.drug_name}</td>
                          <td>{item.quantity}</td>
                          <td>${item.price_at_purchase}</td>
                          <td>${(item.quantity * item.price_at_purchase).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Prescription (if available) */}
              {selectedOrder.prescription && (
                <div className="detail-section">
                  <h3>Prescription</h3>
                  <div className="prescription-container">
                    <img
                      src={`http://localhost:3000${selectedOrder.prescription.image_url}`}
                      alt="Prescription"
                      className="prescription-image"
                      onClick={() => window.open(`http://localhost:3000${selectedOrder.prescription.image_url}`, '_blank')}
                    />
                    <p className="prescription-note">Click image to view full size</p>
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div className="detail-section">
                <h3>Update Status</h3>
                <div className="status-update-container">
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusUpdate(selectedOrder.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    className="mark-delivered-button"
                    onClick={() => handleStatusUpdate(selectedOrder.id, 'delivered')}
                    disabled={selectedOrder.status === 'delivered'}
                  >
                    Mark as Delivered
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
