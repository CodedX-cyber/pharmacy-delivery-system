const express = require('express');
const multer = require('multer');
const path = require('path');
const { param, validationResult } = require('express-validator');
const Database = require('../models/Database');

const router = express.Router();
const db = Database;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'prescriptions'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `prescription-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPEG, JPG, PNG, and PDF files are allowed'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter
});

// POST /api/prescriptions/upload - Upload prescription image
router.post('/upload', upload.single('prescription'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Check if order exists
    const order = await db.get('SELECT id FROM orders WHERE id = ?', [order_id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if prescription already exists for this order
    const existingPrescription = await db.get('SELECT id FROM prescriptions WHERE order_id = ?', [order_id]);
    if (existingPrescription) {
      return res.status(400).json({ error: 'Prescription already uploaded for this order' });
    }

    // Create prescription record
    const imageUrl = `/uploads/prescriptions/${req.file.filename}`;
    const result = await db.run(
      'INSERT INTO prescriptions (order_id, image_url) VALUES (?, ?)',
      [order_id, imageUrl]
    );

    res.status(201).json({
      message: 'Prescription uploaded successfully',
      prescription: {
        id: result.id,
        order_id,
        image_url: imageUrl
      }
    });
  } catch (error) {
    console.error('Upload prescription error:', error);
    if (error.message.includes('Only')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/prescriptions/:orderId - Get prescription for an order
router.get('/:orderId', [
  param('orderId').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.params;

    const prescription = await db.get('SELECT * FROM prescriptions WHERE order_id = ?', [orderId]);

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json({
      message: 'Prescription retrieved successfully',
      prescription
    });
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
