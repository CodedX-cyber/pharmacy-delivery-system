require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const Database = require('./models/Database');

// Import routes
const authRoutes = require('./routes/auth');
const drugsRoutes = require('./routes/drugs');
const ordersRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const prescriptionRoutes = require('./routes/prescriptions');
const cartRoutes = require('./routes/cart');
const medicalRoutes = require('./routes/medical');

// Import middleware
const { authenticateUser, authenticateAdmin } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet());
app.use(limiter);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database
async function initializeDatabase() {
  try {
    await Database.connect();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Public debug routes (add before other routes to avoid middleware conflicts)
app.get('/debug/reports', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Testing medical_reports without middleware...');
    
    const Database = require('./models/Database');
    const db = Database;
    
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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/drugs', drugsRoutes);
app.use('/api/orders', authenticateUser, ordersRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/cart', authenticateUser, cartRoutes);
app.use('/api/medical', authenticateUser, medicalRoutes);

// Admin routes (protected)
app.use('/api/admin', authenticateAdmin, adminRoutes);
app.use('/api/admin/medical', authenticateAdmin, medicalRoutes);

// Public debug routes
app.get('/api/medical/reports-debug', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Testing medical_reports without middleware...');
    
    const Database = require('./models/Database');
    const db = Database;
    
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large' });
  }
  
  if (err.message.includes('Only')) {
    return res.status(400).json({ error: err.message });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 Pharmacy API Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV}`);
    console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
  });
}

startServer().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await Database.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await Database.close();
  process.exit(0);
});
