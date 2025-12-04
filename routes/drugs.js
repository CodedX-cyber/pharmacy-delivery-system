const express = require('express');
const { query, param, validationResult } = require('express-validator');
const Database = require('../models/Database');

const router = express.Router();
const db = Database;

// GET /api/drugs - List all drugs with optional search
router.get('/', [
  query('search').optional().trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { search } = req.query;
    let sql = 'SELECT * FROM drugs';
    let params = [];

    if (search) {
      sql += ' WHERE name LIKE ? OR description LIKE ?';
      params = [`%${search}%`, `%${search}%`];
    }

    sql += ' ORDER BY name';

    const drugs = await db.all(sql, params);

    res.json({
      message: 'Drugs retrieved successfully',
      count: drugs.length,
      drugs
    });
  } catch (error) {
    console.error('Get drugs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/drugs/:id - Get drug by ID
router.get('/:id', [
  param('id').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const drug = await db.get('SELECT * FROM drugs WHERE id = ?', [id]);

    if (!drug) {
      return res.status(404).json({ error: 'Drug not found' });
    }

    res.json({
      message: 'Drug retrieved successfully',
      drug
    });
  } catch (error) {
    console.error('Get drug error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
