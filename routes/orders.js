const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Database = require('../models/Database');

const router = express.Router();
const db = Database;

// POST /api/orders - Create order
router.post('/', [
  body('items').isArray({ min: 1 }),
  body('items.*.drug_id').isInt({ min: 1 }),
  body('items.*.quantity').isInt({ min: 1 }),
  body('delivery_address').trim().isLength({ min: 5 }),
  body('payment_method').isIn(['cash', 'card'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, delivery_address, payment_method } = req.body;
    const user_id = req.user.userId; // Get user_id from auth token

    // Calculate total and check stock
    let total_amount = 0;
    for (const item of items) {
      const drug = await db.get('SELECT price, stock_quantity FROM drugs WHERE id = ?', [item.drug_id]);
      if (!drug) {
        return res.status(404).json({ error: `Drug with ID ${item.drug_id} not found` });
      }
      if (drug.stock_quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for drug ID ${item.drug_id}` });
      }
      total_amount += drug.price * item.quantity;
    }

    // Create order
    const orderResult = await db.run(
      'INSERT INTO orders (user_id, status, total_amount, delivery_address, payment_method) VALUES (?, ?, ?, ?, ?)',
      [user_id, 'pending', total_amount, delivery_address, payment_method]
    );

    // Create order items and update stock
    for (const item of items) {
      const drug = await db.get('SELECT price FROM drugs WHERE id = ?', [item.drug_id]);
      
      // Insert order item
      await db.run(
        'INSERT INTO order_items (order_id, drug_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
        [orderResult.id, item.drug_id, item.quantity, drug.price]
      );

      // Update drug stock
      await db.run(
        'UPDATE drugs SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.drug_id]
      );
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: orderResult.id,
        user_id,
        status: 'pending',
        total_amount,
        delivery_address,
        payment_method,
        items
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:id - Get order by ID
router.get('/:id', [
  param('id').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    const items = await db.all(`
      SELECT oi.*, d.name as drug_name, d.image_url
      FROM order_items oi
      JOIN drugs d ON oi.drug_id = d.id
      WHERE oi.order_id = ?
    `, [id]);

    res.json({
      message: 'Order retrieved successfully',
      order: {
        ...order,
        items
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/user/:userId - Get orders for a specific user
router.get('/user/:userId', [
  param('userId').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;

    const orders = await db.all(`
      SELECT o.*, COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [userId]);

    res.json({
      message: 'User orders retrieved successfully',
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
