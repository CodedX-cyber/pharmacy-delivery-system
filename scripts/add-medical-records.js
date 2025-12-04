const Database = require('../models/Database');

async function addMedicalRecordsTables() {
  try {
    await Database.connect();
    console.log('🏥 Adding Medical Records Database Tables...');
    console.log('===========================================');

    // 1. Doctors Table
    await Database.run(`
      CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        specialization TEXT NOT NULL,
        license_number TEXT UNIQUE NOT NULL,
        hospital_clinic TEXT NOT NULL,
        years_experience INTEGER DEFAULT 0,
        consultation_fee DECIMAL(10,2) DEFAULT 0.00,
        available_days TEXT, -- JSON array of available days
        available_time_start TEXT, -- HH:MM format
        available_time_end TEXT, -- HH:MM format
        profile_image TEXT,
        bio TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Doctors table created');

    // 2. Medical Reports Table
    await Database.run(`
      CREATE TABLE IF NOT EXISTS medical_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        report_type TEXT NOT NULL, -- 'consultation', 'lab_result', 'imaging', 'discharge_summary'
        title TEXT NOT NULL,
        description TEXT,
        diagnosis TEXT,
        symptoms TEXT, -- JSON array of symptoms
        treatment_plan TEXT,
        notes TEXT,
        report_date DATE NOT NULL,
        follow_up_date DATE,
        severity_level TEXT DEFAULT 'moderate', -- 'mild', 'moderate', 'severe', 'critical'
        status TEXT DEFAULT 'active', -- 'active', 'resolved', 'chronic'
        attachments TEXT, -- JSON array of file URLs
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Medical reports table created');

    // 3. Prescriptions Table (Enhanced)
    await Database.run(`
      CREATE TABLE IF NOT EXISTS medical_prescriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        medical_report_id INTEGER,
        prescription_number TEXT UNIQUE NOT NULL,
        diagnosis TEXT,
        instructions TEXT,
        notes TEXT,
        prescribed_date DATE NOT NULL,
        expiry_date DATE,
        is_active BOOLEAN DEFAULT 1,
        status TEXT DEFAULT 'active', -- 'active', 'completed', 'expired', 'cancelled'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
        FOREIGN KEY (medical_report_id) REFERENCES medical_reports(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Medical prescriptions table created');

    // 4. Prescription Drugs Table (Link prescriptions to drugs)
    await Database.run(`
      CREATE TABLE IF NOT EXISTS prescription_drugs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prescription_id INTEGER NOT NULL,
        drug_id INTEGER NOT NULL,
        dosage TEXT NOT NULL, -- e.g., "500mg", "10mg"
        frequency TEXT NOT NULL, -- e.g., "twice daily", "once daily"
        duration TEXT NOT NULL, -- e.g., "7 days", "2 weeks"
        instructions TEXT, -- Additional instructions like "take with food"
        quantity INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (prescription_id) REFERENCES medical_prescriptions(id) ON DELETE CASCADE,
        FOREIGN KEY (drug_id) REFERENCES drugs(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Prescription drugs table created');

    // 5. Appointments Table
    await Database.run(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        appointment_type TEXT NOT NULL, -- 'consultation', 'follow_up', 'emergency'
        purpose TEXT NOT NULL,
        appointment_date DATETIME NOT NULL,
        duration_minutes INTEGER DEFAULT 30,
        status TEXT DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'
        consultation_fee DECIMAL(10,2) DEFAULT 0.00,
        payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'refunded'
        notes TEXT,
        symptoms TEXT, -- JSON array of symptoms for pre-visit info
        reminder_sent BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Appointments table created');

    // 6. Allergies Table
    await Database.run(`
      CREATE TABLE IF NOT EXISTS allergies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        allergen TEXT NOT NULL, -- e.g., "Penicillin", "Peanuts", "Dust"
        allergy_type TEXT NOT NULL, -- 'drug', 'food', 'environmental', 'other'
        severity TEXT NOT NULL, -- 'mild', 'moderate', 'severe'
        reaction TEXT, -- Description of allergic reaction
        notes TEXT,
        is_active BOOLEAN DEFAULT 1,
        diagnosed_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Allergies table created');

    // 7. Chronic Conditions Table
    await Database.run(`
      CREATE TABLE IF NOT EXISTS chronic_conditions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        condition_name TEXT NOT NULL,
        icd10_code TEXT, -- International Classification of Diseases code
        diagnosed_date DATE NOT NULL,
        treating_doctor_id INTEGER,
        severity TEXT DEFAULT 'moderate', -- 'mild', 'moderate', 'severe'
        status TEXT DEFAULT 'active', -- 'active', 'controlled', 'resolved'
        medications TEXT, -- JSON array of current medications
        notes TEXT,
        last_checkup_date DATE,
        next_checkup_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (treating_doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Chronic conditions table created');

    // 8. Vital Signs Table
    await Database.run(`
      CREATE TABLE IF NOT EXISTS vital_signs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        recorded_by INTEGER, -- user_id or doctor_id who recorded
        record_type TEXT NOT NULL, -- 'blood_pressure', 'heart_rate', 'temperature', 'weight', 'height', 'blood_sugar'
        value TEXT NOT NULL, -- JSON object with relevant values
        unit TEXT NOT NULL, -- e.g., 'mmHg', 'bpm', '°F', 'kg', 'cm', 'mg/dL'
        recorded_date DATETIME NOT NULL,
        notes TEXT,
        appointment_id INTEGER, -- Link to appointment if recorded during visit
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Vital signs table created');

    // 9. Medical History Summary Table
    await Database.run(`
      CREATE TABLE IF NOT EXISTS medical_history_summary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        blood_type TEXT, -- 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        emergency_contact_relation TEXT,
        primary_doctor_id INTEGER,
        insurance_provider TEXT,
        insurance_policy_number TEXT,
        known_allergies TEXT, -- JSON array for quick access
        chronic_medications TEXT, -- JSON array for quick access
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (primary_doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Medical history summary table created');

    // Create indexes for better performance
    console.log('📊 Creating indexes...');
    
    await Database.run('CREATE INDEX IF NOT EXISTS idx_medical_reports_user ON medical_reports(user_id)');
    await Database.run('CREATE INDEX IF NOT EXISTS idx_medical_reports_doctor ON medical_reports(doctor_id)');
    await Database.run('CREATE INDEX IF NOT EXISTS idx_medical_reports_date ON medical_reports(report_date)');
    
    await Database.run('CREATE INDEX IF NOT EXISTS idx_prescriptions_user ON medical_prescriptions(user_id)');
    await Database.run('CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON medical_prescriptions(doctor_id)');
    await Database.run('CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON medical_prescriptions(prescribed_date)');
    
    await Database.run('CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_id)');
    await Database.run('CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id)');
    await Database.run('CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date)');
    await Database.run('CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status)');
    
    await Database.run('CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization)');
    await Database.run('CREATE INDEX IF NOT EXISTS idx_doctors_active ON doctors(is_active)');
    
    console.log('✅ Indexes created');

    console.log('===========================================');
    console.log('🎉 Medical Records Database Setup Complete!');
    console.log('');
    console.log('📋 Tables Created:');
    console.log('  • doctors - Doctor information and availability');
    console.log('  • medical_reports - Patient medical reports and diagnoses');
    console.log('  • medical_prescriptions - Enhanced prescription tracking');
    console.log('  • prescription_drugs - Detailed prescription medications');
    console.log('  • appointments - Doctor appointment scheduling');
    console.log('  • allergies - Patient allergy tracking');
    console.log('  • chronic_conditions - Long-term health conditions');
    console.log('  • vital_signs - Patient vital measurements');
    console.log('  • medical_history_summary - Quick patient overview');
    console.log('');
    console.log('🔗 Relationships:');
    console.log('  • Users → Medical Reports (1:many)');
    console.log('  • Users → Prescriptions (1:many)');
    console.log('  • Users → Appointments (1:many)');
    console.log('  • Doctors → Medical Reports (1:many)');
    console.log('  • Doctors → Prescriptions (1:many)');
    console.log('  • Doctors → Appointments (1:many)');
    console.log('  • Medical Reports → Prescriptions (1:many)');
    console.log('  • Prescriptions → Prescription Drugs (1:many)');

    await Database.close();
  } catch (error) {
    console.error('Error creating medical records tables:', error);
    process.exit(1);
  }
}

addMedicalRecordsTables();
