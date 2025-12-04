import React, { useState, useEffect } from 'react';
import { drugsAPI } from '../services/api';
import './Drugs.css';

const Drugs = () => {
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    requires_prescription: false,
    image_url: '',
  });

  useEffect(() => {
    fetchDrugs();
  }, []);

  const fetchDrugs = async () => {
    try {
      const response = await drugsAPI.getAll();
      setDrugs(response.data || []);
    } catch (error) {
      console.error('Error fetching drugs:', error);
      setDrugs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDrug = async () => {
    try {
      await drugsAPI.create(formData);
      setShowAddModal(false);
      resetForm();
      fetchDrugs();
    } catch (error) {
      console.error('Error adding drug:', error);
      alert('Failed to add drug');
    }
  };

  const handleEditDrug = async () => {
    try {
      await drugsAPI.update(selectedDrug.id, formData);
      setShowEditModal(false);
      resetForm();
      fetchDrugs();
    } catch (error) {
      console.error('Error updating drug:', error);
      alert('Failed to update drug');
    }
  };

  const handleDeleteDrug = async (id) => {
    if (window.confirm('Are you sure you want to delete this drug?')) {
      try {
        await drugsAPI.delete(id);
        fetchDrugs();
      } catch (error) {
        console.error('Error deleting drug:', error);
        alert('Failed to delete drug');
      }
    }
  };

  const openEditModal = (drug) => {
    setSelectedDrug(drug);
    setFormData({
      name: drug.name,
      description: drug.description,
      price: drug.price,
      stock_quantity: drug.stock_quantity,
      requires_prescription: drug.requires_prescription,
      image_url: drug.image_url || '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock_quantity: '',
      requires_prescription: false,
      image_url: '',
    });
    setSelectedDrug(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const filteredDrugs = (drugs || []).filter(drug =>
    drug && drug.name && drug.description &&
    (drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     drug.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="drugs-loading">
        <div className="spinner"></div>
        <p>Loading drugs...</p>
      </div>
    );
  }

  return (
    <div className="drugs">
      <div className="drugs-header">
        <h1>Drug Management</h1>
        <button
          className="add-drug-button"
          onClick={() => setShowAddModal(true)}
        >
          + Add New Drug
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search drugs by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="drugs-table-container">
        <table className="drugs-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Description</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Prescription</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDrugs.length > 0 ? (
              filteredDrugs.map((drug) => (
                <tr key={drug.id}>
                  <td>
                    <img
                      src={drug.image_url || 'https://via.placeholder.com/50x50'}
                      alt={drug.name}
                      className="drug-image"
                    />
                  </td>
                  <td className="drug-name">{drug.name}</td>
                  <td className="drug-description">{drug.description}</td>
                  <td className="drug-price">${drug.price}</td>
                  <td className={`stock ${drug.stock_quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                    {drug.stock_quantity}
                  </td>
                  <td>
                    <span className={`prescription-badge ${drug.requires_prescription ? 'required' : 'not-required'}`}>
                      {drug.requires_prescription ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="actions">
                    <button
                      className="edit-button"
                      onClick={() => openEditModal(drug)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteDrug(drug.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-drugs">
                  {searchTerm ? 'No drugs found matching your search.' : 'No drugs available.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Drug Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Drug</h2>
              <button
                className="close-button"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  required
                />
              </div>
              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Stock Quantity</label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="text"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="requires_prescription"
                    checked={formData.requires_prescription}
                    onChange={handleInputChange}
                  />
                  Requires Prescription
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button
                className="submit-button"
                onClick={handleAddDrug}
              >
                Add Drug
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Drug Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Drug</h2>
              <button
                className="close-button"
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  required
                />
              </div>
              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Stock Quantity</label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="text"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="requires_prescription"
                    checked={formData.requires_prescription}
                    onChange={handleInputChange}
                  />
                  Requires Prescription
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button
                className="submit-button"
                onClick={handleEditDrug}
              >
                Update Drug
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drugs;
