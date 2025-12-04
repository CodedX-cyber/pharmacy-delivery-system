const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Database = require('../models/Database');
const multer = require('multer');
const path = require('path');

const router = express.Router();
const db = Database;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/medical/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image, PDF, and document files are allowed'));
    }
  }
});

// Middleware to check if user is doctor or patient
const checkMedicalAccess = (req, res, next) => {
  const userId = req.user.userId;
  // Allow access to user's own records
  req.accessUserId = userId;
  next();
};

// GET /api/medical/doctors - Get all doctors
router.get('/doctors', [
  query('specialization').optional().isString(),
  query('available').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { specialization, available } = req.query;
    let query = 'SELECT * FROM doctors WHERE is_active = 1';
    const params = [];

    if (specialization) {
      query += ' AND specialization = ?';
      params.push(specialization);
    }

    if (available === 'true') {
      query += ' AND available_days IS NOT NULL';
    }

    query += ' ORDER BY name';

    const doctors = await db.all(query, params);
    res.json({
      message: 'Doctors retrieved successfully',
      count: doctors.length,
      doctors
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/medical/doctors/:id - Get doctor details
router.get('/doctors/:id', [
  param('id').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const doctor = await db.get('SELECT * FROM doctors WHERE id = ? AND is_active = 1', [id]);

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({
      message: 'Doctor retrieved successfully',
      doctor
    });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/medical/reports - Get user medical reports
router.get('/reports', checkMedicalAccess, [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('report_type').optional().isString(),
  query('status').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.accessUserId;
    const { limit = 20, offset = 0, report_type, status } = req.query;

    let query = `
      SELECT mr.*, d.name as doctor_name, d.specialization 
      FROM medical_reports mr
      LEFT JOIN doctors d ON mr.doctor_id = d.id
      WHERE mr.user_id = ?
    `;
    const params = [userId];

    if (report_type) {
      query += ' AND mr.report_type = ?';
      params.push(report_type);
    }

    if (status) {
      query += ' AND mr.status = ?';
      params.push(status);
    }

    query += ' ORDER BY mr.report_date DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const reports = await db.all(query, params);

    // Parse JSON fields
    const parsedReports = reports.map(report => ({
      ...report,
      symptoms: report.symptoms ? JSON.parse(report.symptoms) : [],
      attachments: report.attachments ? JSON.parse(report.attachments) : []
    }));

    res.json({
      message: 'Medical reports retrieved successfully',
      count: parsedReports.length,
      reports: parsedReports
    });
  } catch (error) {
    console.error('Error fetching medical reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/medical/reports - Create medical report
router.post('/reports', checkMedicalAccess, [
  body('doctor_id').isInt({ min: 1 }),
  body('report_type').isIn(['consultation', 'lab_result', 'imaging', 'discharge_summary']),
  body('title').trim().isLength({ min: 2, max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('diagnosis').optional().trim().isLength({ max: 500 }),
  body('symptoms').optional().isArray(),
  body('treatment_plan').optional().trim().isLength({ max: 1000 }),
  body('notes').optional().trim().isLength({ max: 1000 }),
  body('report_date').isISO8601().toDate(),
  body('follow_up_date').optional().isISO8601().toDate(),
  body('severity_level').isIn(['mild', 'moderate', 'severe', 'critical']),
  body('status').isIn(['active', 'resolved', 'chronic'])
], upload.array('attachments', 5), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.accessUserId;
    const {
      doctor_id, report_type, title, description, diagnosis, symptoms,
      treatment_plan, notes, report_date, follow_up_date, severity_level, status
    } = req.body;

    // Handle file attachments
    const attachments = req.files ? req.files.map(file => `/uploads/medical/${file.filename}`) : [];

    const result = await db.run(`
      INSERT INTO medical_reports (
        user_id, doctor_id, report_type, title, description, diagnosis, symptoms,
        treatment_plan, notes, report_date, follow_up_date, severity_level, status, attachments
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId, doctor_id, report_type, title, description, diagnosis,
      symptoms ? JSON.stringify(symptoms) : null, treatment_plan, notes,
      report_date, follow_up_date, severity_level, status,
      attachments.length > 0 ? JSON.stringify(attachments) : null
    ]);

    res.status(201).json({
      message: 'Medical report created successfully',
      report_id: result.id
    });
  } catch (error) {
    console.error('Error creating medical report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/medical/prescriptions - Get user prescriptions
router.get('/prescriptions', checkMedicalAccess, [
  query('status').optional().isIn(['active', 'completed', 'expired', 'cancelled']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.accessUserId;
    const { status, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT mp.*, d.name as doctor_name, d.specialization,
             COUNT(pd.id) as drug_count
      FROM medical_prescriptions mp
      LEFT JOIN doctors d ON mp.doctor_id = d.id
      LEFT JOIN prescription_drugs pd ON mp.id = pd.prescription_id
      WHERE mp.user_id = ?
    `;
    const params = [userId];

    if (status) {
      query += ' AND mp.status = ?';
      params.push(status);
    }

    query += ' GROUP BY mp.id ORDER BY mp.prescribed_date DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const prescriptions = await db.all(query, params);

    res.json({
      message: 'Prescriptions retrieved successfully',
      count: prescriptions.length,
      prescriptions
    });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/medical/prescriptions/:id - Get prescription details with drugs
router.get('/prescriptions/:id', checkMedicalAccess, [
  param('id').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const userId = req.accessUserId;

    // Get prescription details
    const prescription = await db.get(`
      SELECT mp.*, d.name as doctor_name, d.specialization
      FROM medical_prescriptions mp
      LEFT JOIN doctors d ON mp.doctor_id = d.id
      WHERE mp.id = ? AND mp.user_id = ?
    `, [id, userId]);

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Get prescription drugs
    const drugs = await db.all(`
      SELECT pd.*, d.name as drug_name, d.description as drug_description
      FROM prescription_drugs pd
      LEFT JOIN drugs d ON pd.drug_id = d.id
      WHERE pd.prescription_id = ?
    `, [id]);

    res.json({
      message: 'Prescription retrieved successfully',
      prescription,
      drugs
    });
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/medical/appointments - Get user appointments
router.get('/appointments', checkMedicalAccess, [
  query('status').optional().isIn(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']),
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.accessUserId;
    const { status, start_date, end_date, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT a.*, d.name as doctor_name, d.specialization, d.consultation_fee
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.user_id = ?
    `;
    const params = [userId];

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (start_date) {
      query += ' AND a.appointment_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND a.appointment_date <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY a.appointment_date DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const appointments = await db.all(query, params);

    // Parse JSON fields
    const parsedAppointments = appointments.map(apt => ({
      ...apt,
      symptoms: apt.symptoms ? JSON.parse(apt.symptoms) : []
    }));

    res.json({
      message: 'Appointments retrieved successfully',
      count: parsedAppointments.length,
      appointments: parsedAppointments
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/medical/appointments - Book appointment
router.post('/appointments', checkMedicalAccess, [
  body('doctor_id').isInt({ min: 1 }),
  body('appointment_type').isIn(['consultation', 'follow_up', 'emergency']),
  body('purpose').trim().isLength({ min: 5, max: 500 }),
  body('appointment_date').isISO8601().toDate(),
  body('duration_minutes').optional().isInt({ min: 15, max: 180 }),
  body('symptoms').optional().isArray(),
  body('notes').optional().trim().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.accessUserId;
    const {
      doctor_id, appointment_type, purpose, appointment_date,
      duration_minutes = 30, symptoms, notes
    } = req.body;

    // Check if doctor is available
    const doctor = await db.get('SELECT * FROM doctors WHERE id = ? AND is_active = 1', [doctor_id]);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found or inactive' });
    }

    // Check for conflicting appointments
    const conflict = await db.get(`
      SELECT id FROM appointments 
      WHERE doctor_id = ? AND appointment_date = ? AND status NOT IN ('cancelled', 'no_show')
    `, [doctor_id, appointment_date]);

    if (conflict) {
      return res.status(409).json({ error: 'Doctor not available at this time' });
    }

    const result = await db.run(`
      INSERT INTO appointments (
        user_id, doctor_id, appointment_type, purpose, appointment_date,
        duration_minutes, consultation_fee, symptoms, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId, doctor_id, appointment_type, purpose, appointment_date,
      duration_minutes, doctor.consultation_fee,
      symptoms ? JSON.stringify(symptoms) : null, notes
    ]);

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment_id: result.id
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/medical/summary - Get user medical history summary
router.get('/summary', checkMedicalAccess, async (req, res) => {
  try {
    const userId = req.accessUserId;

    // Get or create medical history summary
    let summary = await db.get('SELECT * FROM medical_history_summary WHERE user_id = ?', [userId]);

    if (!summary) {
      // Create empty summary
      await db.run('INSERT INTO medical_history_summary (user_id) VALUES (?)', [userId]);
      summary = await db.get('SELECT * FROM medical_history_summary WHERE user_id = ?', [userId]);
    }

    // Get additional summary data
    const [reportCount, activePrescriptions, upcomingAppointments, allergiesCount] = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM medical_reports WHERE user_id = ?', [userId]),
      db.get('SELECT COUNT(*) as count FROM medical_prescriptions WHERE user_id = ? AND status = "active"', [userId]),
      db.get('SELECT COUNT(*) as count FROM appointments WHERE user_id = ? AND appointment_date > datetime("now") AND status IN ("scheduled", "confirmed")', [userId]),
      db.get('SELECT COUNT(*) as count FROM allergies WHERE user_id = ? AND is_active = 1', [userId])
    ]);

    // Parse JSON fields
    const parsedSummary = {
      ...summary,
      known_allergies: summary.known_allergies ? JSON.parse(summary.known_allergies) : [],
      chronic_medications: summary.chronic_medications ? JSON.parse(summary.chronic_medications) : [],
      statistics: {
        total_reports: reportCount.count,
        active_prescriptions: activePrescriptions.count,
        upcoming_appointments: upcomingAppointments.count,
        active_allergies: allergiesCount.count
      }
    };

    res.json({
      message: 'Medical summary retrieved successfully',
      summary: parsedSummary
    });
  } catch (error) {
    console.error('Error fetching medical summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/medical/summary - Update medical history summary
router.put('/summary', checkMedicalAccess, [
  body('blood_type').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  body('emergency_contact_name').optional().trim().isLength({ min: 2, max: 100 }),
  body('emergency_contact_phone').optional().trim().isLength({ min: 10, max: 20 }),
  body('emergency_contact_relation').optional().trim().isLength({ min: 2, max: 50 }),
  body('primary_doctor_id').optional().isInt({ min: 1 }),
  body('insurance_provider').optional().trim().isLength({ max: 100 }),
  body('insurance_policy_number').optional().trim().isLength({ max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.accessUserId;
    const updates = req.body;

    // Build dynamic update query
    const updateFields = [];
    const params = [];

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        params.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(userId); // Add user_id for WHERE clause
    updateFields.push('last_updated = CURRENT_TIMESTAMP');

    await db.run(`
      UPDATE medical_history_summary 
      SET ${updateFields.join(', ')}
      WHERE user_id = ?
    `, params);

    res.json({ message: 'Medical summary updated successfully' });
  } catch (error) {
    console.error('Error updating medical summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/medical/allergies - Get user allergies
router.get('/allergies', checkMedicalAccess, async (req, res) => {
  try {
    const userId = req.accessUserId;

    const allergies = await db.all(
      'SELECT * FROM allergies WHERE user_id = ? AND is_active = 1 ORDER BY allergen',
      [userId]
    );

    res.json({
      message: 'Allergies retrieved successfully',
      count: allergies.length,
      allergies
    });
  } catch (error) {
    console.error('Error fetching allergies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/medical/allergies - Add allergy
router.post('/allergies', checkMedicalAccess, [
  body('allergen').trim().isLength({ min: 2, max: 100 }),
  body('allergy_type').isIn(['drug', 'food', 'environmental', 'other']),
  body('severity').isIn(['mild', 'moderate', 'severe']),
  body('reaction').optional().trim().isLength({ max: 500 }),
  body('notes').optional().trim().isLength({ max: 1000 }),
  body('diagnosed_date').optional().isISO8601().toDate()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.accessUserId;
    const { allergen, allergy_type, severity, reaction, notes, diagnosed_date } = req.body;

    // Check for duplicate allergy
    const existing = await db.get(
      'SELECT id FROM allergies WHERE user_id = ? AND allergen = ? AND is_active = 1',
      [userId, allergen]
    );

    if (existing) {
      return res.status(409).json({ error: 'Allergy already recorded' });
    }

    const result = await db.run(`
      INSERT INTO allergies (user_id, allergen, allergy_type, severity, reaction, notes, diagnosed_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, allergen, allergy_type, severity, reaction, notes, diagnosed_date]);

    res.status(201).json({
      message: 'Allergy added successfully',
      allergy_id: result.id
    });
  } catch (error) {
    console.error('Error adding allergy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== ADMIN ROUTES ====================

// Admin middleware
const checkAdminAccess = (req, res, next) => {
  // This would normally check if user is admin
  // For now, we'll assume admin access is handled by middleware
  next();
};

// GET /api/admin/medical/doctors - Get all doctors (Admin)
router.get('/doctors', checkAdminAccess, async (req, res) => {
  try {
    const doctors = await db.all(`
      SELECT d.*, COUNT(a.id) as appointment_count
      FROM doctors d
      LEFT JOIN appointments a ON d.id = a.doctor_id
      GROUP BY d.id
      ORDER BY d.name
    `);
    
    res.json({
      success: true,
      doctors: doctors
    });
  } catch (error) {
    console.error('Error getting doctors (admin):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/medical/doctors - Add new doctor (Admin)
router.post('/doctors', checkAdminAccess, [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('specialization').notEmpty().withMessage('Specialization is required'),
  body('license_number').notEmpty().withMessage('License number is required'),
  body('hospital_clinic').notEmpty().withMessage('Hospital/Clinic is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name, email, phone, specialization, license_number,
      hospital_clinic, years_experience, consultation_fee,
      available_days, available_time_start, available_time_end, bio, is_active
    } = req.body;

    const result = await db.run(`
      INSERT INTO doctors (
        name, email, phone, specialization, license_number,
        hospital_clinic, years_experience, consultation_fee,
        available_days, available_time_start, available_time_end, bio, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, email, phone, specialization, license_number,
      hospital_clinic, years_experience, consultation_fee,
      available_days, available_time_start, available_time_end, bio, is_active ? 1 : 0
    ]);

    res.status(201).json({
      success: true,
      message: 'Doctor added successfully',
      doctor: { id: result.id, ...req.body }
    });
  } catch (error) {
    console.error('Error adding doctor (admin):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/medical/doctors/:id - Update doctor (Admin)
router.put('/doctors/:id', checkAdminAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];

    Object.keys(updates).forEach(key => {
      if (key !== 'id') {
        updateFields.push(`${key} = ?`);
        updateValues.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);

    const result = await db.run(`
      UPDATE doctors 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({
      success: true,
      message: 'Doctor updated successfully'
    });
  } catch (error) {
    console.error('Error updating doctor (admin):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/medical/doctors/:id - Delete doctor (Admin)
router.delete('/doctors/:id', checkAdminAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.run('DELETE FROM doctors WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({
      success: true,
      message: 'Doctor deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting doctor (admin):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/medical/reports - Get all medical reports (Admin)
router.get('/reports', async (req, res) => {
  try {
    console.log('🔍 MEDICAL REPORTS ADMIN ROUTE CALLED');
    
    const reports = await db.all(`
      SELECT mr.*, u.name as user_name, u.email as user_email,
             d.name as doctor_name, d.specialization
      FROM medical_reports mr
      LEFT JOIN users u ON mr.user_id = u.id
      LEFT JOIN doctors d ON mr.doctor_id = d.id
      ORDER BY mr.report_date DESC
    `);
    
    console.log(`✅ Retrieved ${reports.length} medical reports`);
    
    res.json({
      success: true,
      reports: reports,
      count: reports.length
    });
  } catch (error) {
    console.error('Error getting medical reports (admin):', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/admin/medical/reports-test - Test route
router.get('/reports-test', async (req, res) => {
  try {
    console.log('🔍 TEST ROUTE CALLED');
    
    const reports = await db.all(`
      SELECT id, title, user_id, doctor_id, report_date
      FROM medical_reports 
      ORDER BY report_date DESC 
      LIMIT 3
    `);
    
    res.json({
      success: true,
      message: 'Test route working',
      reports: reports,
      count: reports.length
    });
  } catch (error) {
    console.error('TEST Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/medical/reports-debug - Public debug endpoint
router.get('/reports-debug', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Testing medical_reports without middleware...');
    
    // Simple query
    const reports = await db.all(`
      SELECT id, title, user_id, doctor_id, report_date 
      FROM medical_reports 
      ORDER BY report_date DESC 
      LIMIT 3
    `);
    
    console.log(`✅ DEBUG: Retrieved ${reports.length} medical reports`);
    
    res.json({
      success: true,
      message: 'Debug endpoint working',
      reports: reports,
      count: reports.length
    });
  } catch (error) {
    console.error('DEBUG Error:', error);
    console.error('DEBUG Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/admin/medical/reports - Add medical report (Admin)
router.post('/reports', checkAdminAccess, [
  body('user_id').isInt().withMessage('Valid user ID is required'),
  body('doctor_id').isInt().withMessage('Valid doctor ID is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('report_type').isIn(['consultation', 'lab_result', 'imaging', 'discharge_summary']).withMessage('Invalid report type'),
  body('severity_level').isIn(['mild', 'moderate', 'severe', 'critical']).withMessage('Invalid severity level'),
  body('status').isIn(['active', 'resolved', 'chronic']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      user_id, doctor_id, report_type, title, description, diagnosis,
      symptoms, treatment_plan, notes, report_date, follow_up_date,
      severity_level, status
    } = req.body;

    const result = await db.run(`
      INSERT INTO medical_reports (
        user_id, doctor_id, report_type, title, description, diagnosis,
        symptoms, treatment_plan, notes, report_date, follow_up_date,
        severity_level, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user_id, doctor_id, report_type, title, description, diagnosis,
      symptoms, treatment_plan, notes, report_date, follow_up_date,
      severity_level, status
    ]);

    res.status(201).json({
      success: true,
      message: 'Medical report added successfully',
      report: { id: result.id, ...req.body }
    });
  } catch (error) {
    console.error('Error adding medical report (admin):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/medical/reports/:id - Update medical report (Admin)
router.put('/reports/:id', checkAdminAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updateFields = [];
    const updateValues = [];

    Object.keys(updates).forEach(key => {
      if (key !== 'id') {
        updateFields.push(`${key} = ?`);
        updateValues.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);

    const result = await db.run(`
      UPDATE medical_reports 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Medical report not found' });
    }

    res.json({
      success: true,
      message: 'Medical report updated successfully'
    });
  } catch (error) {
    console.error('Error updating medical report (admin):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/medical/reports/:id - Delete medical report (Admin)
router.delete('/reports/:id', checkAdminAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.run('DELETE FROM medical_reports WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Medical report not found' });
    }

    res.json({
      success: true,
      message: 'Medical report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting medical report (admin):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
