const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Database = require('../models/Database');

const router = express.Router();
const db = Database;

// POST /api/cart/add - Add item to cart
router.post('/add', [
  body('drug_id').isInt({ min: 1 }),
  body('quantity').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { drug_id, quantity } = req.body;
    const userId = req.user.userId; // From auth middleware

    // Verify drug exists and has sufficient stock
    const drug = await db.get('SELECT id, name, price, stock_quantity, image_url, requires_prescription FROM drugs WHERE id = ?', [drug_id]);
    if (!drug) {
      return res.status(404).json({ error: 'Drug not found' });
    }

    if (drug.stock_quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Check if item already in cart
    const existingItem = await db.get(
      'SELECT id, quantity FROM cart_items WHERE user_id = ? AND drug_id = ?',
      [userId, drug_id]
    );

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      if (drug.stock_quantity < newQuantity) {
        return res.status(400).json({ error: 'Insufficient stock for requested quantity' });
      }

      await db.run(
        'UPDATE cart_items SET quantity = ? WHERE id = ?',
        [newQuantity, existingItem.id]
      );
    } else {
      // Add new item
      await db.run(
        'INSERT INTO cart_items (user_id, drug_id, quantity) VALUES (?, ?, ?)',
        [userId, drug_id, quantity]
      );
    }

    res.json({ message: 'Item added to cart successfully' });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/cart - Get user's cart
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const cartItems = await db.all(`
      SELECT ci.id, ci.quantity, d.id as drug_id, d.name, d.description, d.price, 
             d.image_url, d.requires_prescription, d.stock_quantity
      FROM cart_items ci
      JOIN drugs d ON ci.drug_id = d.id
      WHERE ci.user_id = ?
    `, [userId]);

    // Calculate total
    let total = 0;
    const items = cartItems.map(item => {
      const subtotal = item.price * item.quantity;
      total += subtotal;
      return {
        id: item.id,
        drug_id: item.drug_id,
        name: item.name,
        description: item.description,
        price: item.price,
        image_url: item.image_url,
        requires_prescription: item.requires_prescription,
        stock_quantity: item.stock_quantity,
        quantity: item.quantity,
        subtotal: subtotal
      };
    });

    res.json({
      cart: items,
      total: total.toFixed(2)
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/cart/:id - Update cart item quantity
router.put('/:id', [
  param('id').isInt({ min: 1 }),
  body('quantity').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    // Verify cart item belongs to user
    const cartItem = await db.get(`
      SELECT ci.id, ci.drug_id, d.stock_quantity
      FROM cart_items ci
      JOIN drugs d ON ci.drug_id = d.id
      WHERE ci.id = ? AND ci.user_id = ?
    `, [id, userId]);

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (cartItem.stock_quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    await db.run('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, id]);

    res.json({ message: 'Cart item updated successfully' });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/cart/:id - Remove item from cart
router.delete('/:id', [
  param('id').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.run('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [id, userId]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/cart - Clear entire cart
router.delete('/', async (req, res) => {
  try {
    const userId = req.user.id;

    await db.run('DELETE FROM cart_items WHERE user_id = ?', [userId]);

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
