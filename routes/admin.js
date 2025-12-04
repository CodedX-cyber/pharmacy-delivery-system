const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Database = require('../models/Database');

const router = express.Router();
const db = Database;

// POST /api/admin/drugs - Add new drug
router.post('/drugs', [
  body('name').trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('price').isFloat({ min: 0 }),
  body('stock_quantity').isInt({ min: 0 }),
  body('image_url').optional().isURL(),
  body('requires_prescription').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, stock_quantity, image_url, requires_prescription } = req.body;

    const result = await db.run(
      'INSERT INTO drugs (name, description, price, stock_quantity, image_url, requires_prescription) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, price, stock_quantity, image_url, requires_prescription || 0]
    );

    res.status(201).json({
      message: 'Drug created successfully',
      drug: {
        id: result.id,
        name,
        description,
        price,
        stock_quantity,
        image_url,
        requires_prescription: requires_prescription || 0
      }
    });
  } catch (error) {
    console.error('Create drug error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/drugs/:id - Update drug
router.put('/drugs/:id', [
  param('id').isInt({ min: 1 }),
  body('name').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('price').optional().isFloat({ min: 0 }),
  body('stock_quantity').optional().isInt({ min: 0 }),
  body('image_url').optional().isURL(),
  body('requires_prescription').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if drug exists
    const existingDrug = await db.get('SELECT id FROM drugs WHERE id = ?', [id]);
    if (!existingDrug) {
      return res.status(404).json({ error: 'Drug not found' });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];

    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(updates.name);
    }
    if (updates.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(updates.description);
    }
    if (updates.price !== undefined) {
      updateFields.push('price = ?');
      updateValues.push(updates.price);
    }
    if (updates.stock_quantity !== undefined) {
      updateFields.push('stock_quantity = ?');
      updateValues.push(updates.stock_quantity);
    }
    if (updates.image_url !== undefined) {
      updateFields.push('image_url = ?');
      updateValues.push(updates.image_url);
    }
    if (updates.requires_prescription !== undefined) {
      updateFields.push('requires_prescription = ?');
      updateValues.push(updates.requires_prescription);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateValues.push(id);
    const updateQuery = `UPDATE drugs SET ${updateFields.join(', ')} WHERE id = ?`;

    await db.run(updateQuery, updateValues);

    const updatedDrug = await db.get('SELECT * FROM drugs WHERE id = ?', [id]);

    res.json({
      message: 'Drug updated successfully',
      drug: updatedDrug
    });
  } catch (error) {
    console.error('Update drug error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/drugs/:id - Delete drug
router.delete('/drugs/:id', [
  param('id').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    // Check if drug exists
    const existingDrug = await db.get('SELECT id FROM drugs WHERE id = ?', [id]);
    if (!existingDrug) {
      return res.status(404).json({ error: 'Drug not found' });
    }

    // Check if drug is in any order
    const orderItem = await db.get('SELECT id FROM order_items WHERE drug_id = ?', [id]);
    if (orderItem) {
      return res.status(400).json({ error: 'Cannot delete drug that is in orders' });
    }

    await db.run('DELETE FROM drugs WHERE id = ?', [id]);

    res.json({
      message: 'Drug deleted successfully'
    });
  } catch (error) {
    console.error('Delete drug error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/orders - Get all orders with optional status filter
router.get('/orders', [
  query('status').optional().isIn(['pending', 'processing', 'out_for_delivery', 'delivered', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.query;
    let sql = `
      SELECT o.*, u.name as customer_name, u.email as customer_email, COUNT(oi.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;
    let params = [];

    if (status) {
      sql += ' WHERE o.status = ?';
      params.push(status);
    }

    sql += ' GROUP BY o.id ORDER BY o.created_at DESC';

    const orders = await db.all(sql, params);

    res.json({
      message: 'Orders retrieved successfully',
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('Get admin orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/orders/:id/status - Update order status
router.put('/orders/:id/status', [
  param('id').isInt({ min: 1 }),
  body('status').isIn(['pending', 'processing', 'out_for_delivery', 'delivered', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Check if order exists
    const existingOrder = await db.get('SELECT id FROM orders WHERE id = ?', [id]);
    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await db.run(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    const updatedOrder = await db.get('SELECT * FROM orders WHERE id = ?', [id]);

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
