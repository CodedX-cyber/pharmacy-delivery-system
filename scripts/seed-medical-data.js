const Database = require('../models/Database');
const bcrypt = require('bcryptjs');

async function seedMedicalData() {
  try {
    await Database.connect();
    console.log('🏥 Seeding Medical Records Demo Data...');
    console.log('===========================================');

    // 1. Create Demo Doctors
    console.log('👨‍⚕️ Creating Demo Doctors...');
    
    const doctors = [
      {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@hospital.com',
        phone: '+12345678901',
        specialization: 'General Practitioner',
        license_number: 'MD123456',
        hospital_clinic: 'City General Hospital',
        years_experience: 12,
        consultation_fee: 150.00,
        available_days: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
        available_time_start: '09:00',
        available_time_end: '17:00',
        profile_image: '/uploads/doctors/dr-sarah.jpg',
        bio: 'Experienced general practitioner with expertise in family medicine and chronic disease management.'
      },
      {
        name: 'Dr. Michael Chen',
        email: 'michael.chen@cardio.com',
        phone: '+12345678902',
        specialization: 'Cardiologist',
        license_number: 'MD789012',
        hospital_clinic: 'Heart Care Center',
        years_experience: 15,
        consultation_fee: 250.00,
        available_days: JSON.stringify(['Monday', 'Wednesday', 'Friday']),
        available_time_start: '08:00',
        available_time_end: '16:00',
        profile_image: '/uploads/doctors/dr-michael.jpg',
        bio: 'Board-certified cardiologist specializing in heart disease prevention and treatment.'
      },
      {
        name: 'Dr. Emily Rodriguez',
        email: 'emily.rodriguez@pediatrics.com',
        phone: '+12345678903',
        specialization: 'Pediatrician',
        license_number: 'MD345678',
        hospital_clinic: 'Children\'s Medical Center',
        years_experience: 8,
        consultation_fee: 120.00,
        available_days: JSON.stringify(['Tuesday', 'Thursday', 'Saturday']),
        available_time_start: '09:00',
        available_time_end: '15:00',
        profile_image: '/uploads/doctors/dr-emily.jpg',
        bio: 'Dedicated pediatrician focused on child health and development from infancy through adolescence.'
      },
      {
        name: 'Dr. James Wilson',
        email: 'james.wilson@ortho.com',
        phone: '+12345678904',
        specialization: 'Orthopedic Surgeon',
        license_number: 'MD901234',
        hospital_clinic: 'Sports Medicine Clinic',
        years_experience: 20,
        consultation_fee: 200.00,
        available_days: JSON.stringify(['Monday', 'Thursday', 'Friday']),
        available_time_start: '10:00',
        available_time_end: '18:00',
        profile_image: '/uploads/doctors/dr-james.jpg',
        bio: 'Orthopedic surgeon specializing in sports injuries and joint replacement surgery.'
      },
      {
        name: 'Dr. Lisa Anderson',
        email: 'lisa.anderson@derma.com',
        phone: '+12345678905',
        specialization: 'Dermatologist',
        license_number: 'MD567890',
        hospital_clinic: 'Skin Health Clinic',
        years_experience: 10,
        consultation_fee: 180.00,
        available_days: JSON.stringify(['Wednesday', 'Thursday', 'Friday']),
        available_time_start: '09:30',
        available_time_end: '17:30',
        profile_image: '/uploads/doctors/dr-lisa.jpg',
        bio: 'Dermatologist with expertise in medical, surgical, and cosmetic dermatology.'
      }
    ];

    for (const doctor of doctors) {
      await Database.run(`
        INSERT OR IGNORE INTO doctors (
          name, email, phone, specialization, license_number, hospital_clinic,
          years_experience, consultation_fee, available_days, available_time_start,
          available_time_end, profile_image, bio, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `, [
        doctor.name, doctor.email, doctor.phone, doctor.specialization,
        doctor.license_number, doctor.hospital_clinic, doctor.years_experience,
        doctor.consultation_fee, doctor.available_days, doctor.available_time_start,
        doctor.available_time_end, doctor.profile_image, doctor.bio
      ]);
    }

    console.log('✅ Demo doctors created');

    // 2. Get users and doctors for relationships
    const users = await Database.all('SELECT id, name FROM users LIMIT 5');
    const doctorRecords = await Database.all('SELECT id, name, specialization FROM doctors');

    // 3. Create Medical Reports
    console.log('📋 Creating Medical Reports...');
    
    const medicalReports = [
      {
        user_id: users[0]?.id || 1,
        doctor_id: doctorRecords[0]?.id || 1,
        report_type: 'consultation',
        title: 'Annual Health Checkup',
        description: 'Complete physical examination including vital signs, cardiovascular assessment, and routine screening.',
        diagnosis: 'Generally good health with mild hypertension',
        symptoms: JSON.stringify(['Occasional headaches', 'Fatigue']),
        treatment_plan: 'Lifestyle modifications including diet and exercise. Monitor blood pressure regularly.',
        notes: 'Patient advised to reduce sodium intake and increase physical activity.',
        report_date: new Date('2024-10-15').toISOString().split('T')[0],
        follow_up_date: new Date('2025-01-15').toISOString().split('T')[0],
        severity_level: 'mild',
        status: 'active'
      },
      {
        user_id: users[0]?.id || 1,
        doctor_id: doctorRecords[1]?.id || 2,
        report_type: 'consultation',
        title: 'Cardiology Evaluation',
        description: 'Comprehensive cardiac evaluation including ECG and stress test.',
        diagnosis: 'Borderline high blood pressure with occasional palpitations',
        symptoms: JSON.stringify(['Chest discomfort', 'Shortness of breath on exertion']),
        treatment_plan: 'Beta-blocker medication prescribed. Regular cardiac monitoring recommended.',
        notes: 'Patient shows good response to initial treatment. Follow up in 3 months.',
        report_date: new Date('2024-09-20').toISOString().split('T')[0],
        follow_up_date: new Date('2024-12-20').toISOString().split('T')[0],
        severity_level: 'moderate',
        status: 'active'
      },
      {
        user_id: users[1]?.id || 2,
        doctor_id: doctorRecords[2]?.id || 3,
        report_type: 'consultation',
        title: 'Pediatric Wellness Visit',
        description: 'Routine pediatric checkup including growth assessment and vaccination review.',
        diagnosis: 'Healthy development with mild seasonal allergies',
        symptoms: JSON.stringify(['Occasional sneezing', 'Watery eyes']),
        treatment_plan: 'Antihistamine as needed for allergy symptoms. Continue regular checkups.',
        notes: 'Child is meeting all developmental milestones. Parents educated on allergy management.',
        report_date: new Date('2024-11-01').toISOString().split('T')[0],
        follow_up_date: new Date('2025-02-01').toISOString().split('T')[0],
        severity_level: 'mild',
        status: 'active'
      },
      {
        user_id: users[2]?.id || 3,
        doctor_id: doctorRecords[3]?.id || 4,
        report_type: 'consultation',
        title: 'Orthopedic Consultation',
        description: 'Evaluation of chronic knee pain with imaging studies.',
        diagnosis: 'Early stage osteoarthritis in right knee',
        symptoms: JSON.stringify(['Knee pain', 'Stiffness in morning', 'Reduced mobility']),
        treatment_plan: 'Physical therapy and pain management. Consider injections if symptoms persist.',
        notes: 'Patient shows good response to conservative treatment. Surgery not indicated at this time.',
        report_date: new Date('2024-08-10').toISOString().split('T')[0],
        follow_up_date: new Date('2024-11-10').toISOString().split('T')[0],
        severity_level: 'moderate',
        status: 'active'
      },
      {
        user_id: users[3]?.id || 4,
        doctor_id: doctorRecords[4]?.id || 5,
        report_type: 'consultation',
        title: 'Dermatological Examination',
        description: 'Full skin examination for mole evaluation and general skin health.',
        diagnosis: 'Mild acne with some sun damage',
        symptoms: JSON.stringify(['Acne breakouts', 'Skin dryness']),
        treatment_plan: 'Topical retinoids and proper skincare routine. Sun protection emphasized.',
        notes: 'Patient educated on skincare and sun protection. Good prognosis with treatment compliance.',
        report_date: new Date('2024-10-05').toISOString().split('T')[0],
        follow_up_date: new Date('2025-01-05').toISOString().split('T')[0],
        severity_level: 'mild',
        status: 'resolved'
      }
    ];

    for (const report of medicalReports) {
      await Database.run(`
        INSERT INTO medical_reports (
          user_id, doctor_id, report_type, title, description, diagnosis,
          symptoms, treatment_plan, notes, report_date, follow_up_date,
          severity_level, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        report.user_id, report.doctor_id, report.report_type, report.title,
        report.description, report.diagnosis, report.symptoms, report.treatment_plan,
        report.notes, report.report_date, report.follow_up_date,
        report.severity_level, report.status
      ]);
    }

    console.log('✅ Medical reports created');

    // 4. Create Medical Prescriptions
    console.log('💊 Creating Medical Prescriptions...');
    
    const prescriptions = [
      {
        user_id: users[0]?.id || 1,
        doctor_id: doctorRecords[0]?.id || 1,
        medical_report_id: 1,
        prescription_number: 'RX2024001',
        diagnosis: 'Hypertension',
        instructions: 'Take once daily with breakfast. Monitor blood pressure weekly.',
        notes: 'Patient to report any side effects immediately.',
        prescribed_date: new Date('2024-10-15').toISOString().split('T')[0],
        expiry_date: new Date('2025-04-15').toISOString().split('T')[0],
        is_active: 1,
        status: 'active'
      },
      {
        user_id: users[0]?.id || 1,
        doctor_id: doctorRecords[1]?.id || 2,
        medical_report_id: 2,
        prescription_number: 'RX2024002',
        diagnosis: 'Cardiac arrhythmia',
        instructions: 'Take twice daily as prescribed. Do not skip doses.',
        notes: 'Regular cardiac monitoring required.',
        prescribed_date: new Date('2024-09-20').toISOString().split('T')[0],
        expiry_date: new Date('2025-03-20').toISOString().split('T')[0],
        is_active: 1,
        status: 'active'
      },
      {
        user_id: users[1]?.id || 2,
        doctor_id: doctorRecords[2]?.id || 3,
        medical_report_id: 3,
        prescription_number: 'RX2024003',
        diagnosis: 'Seasonal allergies',
        instructions: 'Take as needed for allergy symptoms. May cause drowsiness.',
        notes: 'Avoid driving when taking this medication.',
        prescribed_date: new Date('2024-11-01').toISOString().split('T')[0],
        expiry_date: new Date('2025-05-01').toISOString().split('T')[0],
        is_active: 1,
        status: 'active'
      }
    ];

    for (const prescription of prescriptions) {
      await Database.run(`
        INSERT INTO medical_prescriptions (
          user_id, doctor_id, medical_report_id, prescription_number,
          diagnosis, instructions, notes, prescribed_date, expiry_date,
          is_active, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        prescription.user_id, prescription.doctor_id, prescription.medical_report_id,
        prescription.prescription_number, prescription.diagnosis, prescription.instructions,
        prescription.notes, prescription.prescribed_date, prescription.expiry_date,
        prescription.is_active, prescription.status
      ]);
    }

    console.log('✅ Medical prescriptions created');

    // 5. Create Prescription Drugs
    console.log('💊 Creating Prescription Drugs...');
    
    const prescriptionDrugs = [
      // Prescription 1 drugs
      { prescription_id: 1, drug_id: 6, dosage: '10mg', frequency: 'once daily', duration: '6 months', instructions: 'Take with breakfast', quantity: 180 },
      { prescription_id: 1, drug_id: 9, dosage: '81mg', frequency: 'once daily', duration: '6 months', instructions: 'Take with food', quantity: 180 },
      
      // Prescription 2 drugs
      { prescription_id: 2, drug_id: 6, dosage: '5mg', frequency: 'twice daily', duration: '6 months', instructions: 'Take exactly 12 hours apart', quantity: 360 },
      { prescription_id: 2, drug_id: 16, dosage: '25mg', frequency: 'once daily', duration: '6 months', instructions: 'Take at bedtime', quantity: 180 },
      
      // Prescription 3 drugs
      { prescription_id: 3, drug_id: 4, dosage: '10mg', frequency: 'as needed', duration: '3 months', instructions: 'Take when symptoms occur', quantity: 30 }
    ];

    for (const drug of prescriptionDrugs) {
      await Database.run(`
        INSERT INTO prescription_drugs (
          prescription_id, drug_id, dosage, frequency, duration, instructions, quantity
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [drug.prescription_id, drug.drug_id, drug.dosage, drug.frequency, drug.duration, drug.instructions, drug.quantity]);
    }

    console.log('✅ Prescription drugs created');

    // 6. Create Appointments
    console.log('📅 Creating Appointments...');
    
    const appointments = [
      {
        user_id: users[0]?.id || 1,
        doctor_id: doctorRecords[0]?.id || 1,
        appointment_type: 'follow_up',
        purpose: 'Blood pressure monitoring and medication review',
        appointment_date: new Date('2024-12-15T10:00:00').toISOString(),
        duration_minutes: 30,
        status: 'scheduled',
        consultation_fee: 150.00,
        payment_status: 'pending',
        symptoms: JSON.stringify(['Mild headache', 'Occasional dizziness'])
      },
      {
        user_id: users[0]?.id || 1,
        doctor_id: doctorRecords[1]?.id || 2,
        appointment_type: 'consultation',
        purpose: 'Cardiac follow-up and ECG review',
        appointment_date: new Date('2024-12-20T14:30:00').toISOString(),
        duration_minutes: 45,
        status: 'scheduled',
        consultation_fee: 250.00,
        payment_status: 'pending',
        symptoms: JSON.stringify(['Chest discomfort', 'Palpitations'])
      },
      {
        user_id: users[1]?.id || 2,
        doctor_id: doctorRecords[2]?.id || 3,
        appointment_type: 'consultation',
        purpose: 'Routine pediatric checkup and vaccination',
        appointment_date: new Date('2024-12-10T09:00:00').toISOString(),
        duration_minutes: 30,
        status: 'confirmed',
        consultation_fee: 120.00,
        payment_status: 'paid',
        symptoms: JSON.stringify(['Runny nose', 'Mild cough'])
      },
      {
        user_id: users[2]?.id || 3,
        doctor_id: doctorRecords[3]?.id || 4,
        appointment_type: 'follow_up',
        purpose: 'Knee pain evaluation and physical therapy review',
        appointment_date: new Date('2024-11-25T11:00:00').toISOString(),
        duration_minutes: 30,
        status: 'completed',
        consultation_fee: 200.00,
        payment_status: 'paid',
        symptoms: JSON.stringify(['Knee stiffness', 'Pain on walking'])
      }
    ];

    for (const appointment of appointments) {
      await Database.run(`
        INSERT INTO appointments (
          user_id, doctor_id, appointment_type, purpose, appointment_date,
          duration_minutes, status, consultation_fee, payment_status, symptoms
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        appointment.user_id, appointment.doctor_id, appointment.appointment_type,
        appointment.purpose, appointment.appointment_date, appointment.duration_minutes,
        appointment.status, appointment.consultation_fee, appointment.payment_status,
        appointment.symptoms
      ]);
    }

    console.log('✅ Appointments created');

    // 7. Create Allergies
    console.log('🚨 Creating Allergies...');
    
    const allergies = [
      { user_id: users[0]?.id || 1, allergen: 'Penicillin', allergy_type: 'drug', severity: 'severe', reaction: 'Anaphylaxis', notes: 'Carry epinephrine auto-injector', diagnosed_date: '2020-03-15' },
      { user_id: users[0]?.id || 1, allergen: 'Peanuts', allergy_type: 'food', severity: 'severe', reaction: 'Swelling, difficulty breathing', notes: 'Avoid all peanut products', diagnosed_date: '2018-07-22' },
      { user_id: users[1]?.id || 2, allergen: 'Pollen', allergy_type: 'environmental', severity: 'moderate', reaction: 'Sneezing, watery eyes', notes: 'Seasonal - spring and fall', diagnosed_date: '2019-04-10' },
      { user_id: users[2]?.id || 3, allergen: 'Sulfa drugs', allergy_type: 'drug', severity: 'moderate', reaction: 'Skin rash, itching', notes: 'Avoid sulfa-based antibiotics', diagnosed_date: '2021-09-05' },
      { user_id: users[3]?.id || 4, allergen: 'Latex', allergy_type: 'other', severity: 'mild', reaction: 'Skin irritation', notes: 'Use latex-free medical supplies', diagnosed_date: '2020-11-30' }
    ];

    for (const allergy of allergies) {
      await Database.run(`
        INSERT INTO allergies (
          user_id, allergen, allergy_type, severity, reaction, notes, diagnosed_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [allergy.user_id, allergy.allergen, allergy.allergy_type, allergy.severity, allergy.reaction, allergy.notes, allergy.diagnosed_date]);
    }

    console.log('✅ Allergies created');

    // 8. Create Chronic Conditions
    console.log('🏥 Creating Chronic Conditions...');
    
    const chronicConditions = [
      {
        user_id: users[0]?.id || 1,
        condition_name: 'Hypertension',
        icd10_code: 'I10',
        diagnosed_date: '2022-06-15',
        treating_doctor_id: doctorRecords[0]?.id || 1,
        severity: 'moderate',
        status: 'active',
        medications: JSON.stringify(['Lisinopril', 'Aspirin']),
        notes: 'Well controlled with medication',
        last_checkup_date: '2024-10-15',
        next_checkup_date: '2025-01-15'
      },
      {
        user_id: users[0]?.id || 1,
        condition_name: 'Cardiac Arrhythmia',
        icd10_code: 'I49.9',
        diagnosed_date: '2023-03-20',
        treating_doctor_id: doctorRecords[1]?.id || 2,
        severity: 'moderate',
        status: 'active',
        medications: JSON.stringify(['Metoprolol', 'Warfarin']),
        notes: 'Stable with current treatment',
        last_checkup_date: '2024-09-20',
        next_checkup_date: '2024-12-20'
      },
      {
        user_id: users[2]?.id || 3,
        condition_name: 'Osteoarthritis',
        icd10_code: 'M17.9',
        diagnosed_date: '2021-11-10',
        treating_doctor_id: doctorRecords[3]?.id || 4,
        severity: 'moderate',
        status: 'active',
        medications: JSON.stringify(['Ibuprofen', 'Acetaminophen']),
        notes: 'Progressive but manageable with conservative treatment',
        last_checkup_date: '2024-08-10',
        next_checkup_date: '2024-11-10'
      }
    ];

    for (const condition of chronicConditions) {
      await Database.run(`
        INSERT INTO chronic_conditions (
          user_id, condition_name, icd10_code, diagnosed_date, treating_doctor_id,
          severity, status, medications, notes, last_checkup_date, next_checkup_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        condition.user_id, condition.condition_name, condition.icd10_code,
        condition.diagnosed_date, condition.treating_doctor_id, condition.severity,
        condition.status, condition.medications, condition.notes,
        condition.last_checkup_date, condition.next_checkup_date
      ]);
    }

    console.log('✅ Chronic conditions created');

    // 9. Create Medical History Summaries
    console.log('📋 Creating Medical History Summaries...');
    
    const summaries = [
      {
        user_id: users[0]?.id || 1,
        blood_type: 'A+',
        emergency_contact_name: 'Mary Johnson',
        emergency_contact_phone: '+12345678911',
        emergency_contact_relation: 'Spouse',
        primary_doctor_id: doctorRecords[0]?.id || 1,
        insurance_provider: 'HealthPlus Insurance',
        insurance_policy_number: 'HP123456789',
        known_allergies: JSON.stringify(['Penicillin', 'Peanuts']),
        chronic_medications: JSON.stringify(['Lisinopril 10mg', 'Aspirin 81mg', 'Metoprolol 5mg'])
      },
      {
        user_id: users[1]?.id || 2,
        blood_type: 'O+',
        emergency_contact_name: 'Robert Smith',
        emergency_contact_phone: '+12345678912',
        emergency_contact_relation: 'Father',
        primary_doctor_id: doctorRecords[2]?.id || 3,
        insurance_provider: 'FamilyCare Insurance',
        insurance_policy_number: 'FC987654321',
        known_allergies: JSON.stringify(['Pollen']),
        chronic_medications: JSON.stringify(['Cetirizine 10mg'])
      }
    ];

    for (const summary of summaries) {
      await Database.run(`
        INSERT INTO medical_history_summary (
          user_id, blood_type, emergency_contact_name, emergency_contact_phone,
          emergency_contact_relation, primary_doctor_id, insurance_provider,
          insurance_policy_number, known_allergies, chronic_medications
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        summary.user_id, summary.blood_type, summary.emergency_contact_name,
        summary.emergency_contact_phone, summary.emergency_contact_relation,
        summary.primary_doctor_id, summary.insurance_provider,
        summary.insurance_policy_number, summary.known_allergies, summary.chronic_medications
      ]);
    }

    console.log('✅ Medical history summaries created');

    // 10. Create Vital Signs
    console.log('📊 Creating Vital Signs...');
    
    const vitalSigns = [
      { user_id: users[0]?.id || 1, record_type: 'blood_pressure', value: JSON.stringify({ systolic: 128, diastolic: 82, pulse: 72 }), unit: 'mmHg', recorded_date: new Date('2024-10-15T09:30:00').toISOString(), notes: 'Taken during consultation' },
      { user_id: users[0]?.id || 1, record_type: 'heart_rate', value: JSON.stringify({ bpm: 72, rhythm: 'regular' }), unit: 'bpm', recorded_date: new Date('2024-10-15T09:30:00').toISOString(), notes: 'Normal rhythm' },
      { user_id: users[0]?.id || 1, record_type: 'temperature', value: JSON.stringify({ temp: 98.6, method: 'oral' }), unit: '°F', recorded_date: new Date('2024-10-15T09:30:00').toISOString(), notes: 'Normal temperature' },
      { user_id: users[1]?.id || 2, record_type: 'blood_pressure', value: JSON.stringify({ systolic: 110, diastolic: 70, pulse: 68 }), unit: 'mmHg', recorded_date: new Date('2024-11-01T10:15:00').toISOString(), notes: 'Pediatric normal range' },
      { user_id: users[2]?.id || 3, record_type: 'blood_pressure', value: JSON.stringify({ systolic: 135, diastolic: 85, pulse: 75 }), unit: 'mmHg', recorded_date: new Date('2024-08-10T11:00:00').toISOString(), notes: 'Slightly elevated' }
    ];

    for (const vital of vitalSigns) {
      await Database.run(`
        INSERT INTO vital_signs (
          user_id, record_type, value, unit, recorded_date, notes
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [vital.user_id, vital.record_type, vital.value, vital.unit, vital.recorded_date, vital.notes]);
    }

    console.log('✅ Vital signs created');

    console.log('===========================================');
    console.log('🎉 Medical Records Demo Data Created Successfully!');
    console.log('');
    console.log('📊 Demo Data Summary:');
    console.log(`   Doctors: ${doctors.length} created`);
    console.log(`   Medical Reports: ${medicalReports.length} created`);
    console.log(`   Prescriptions: ${prescriptions.length} created`);
    console.log(`   Prescription Drugs: ${prescriptionDrugs.length} created`);
    console.log(`   Appointments: ${appointments.length} created`);
    console.log(`   Allergies: ${allergies.length} created`);
    console.log(`   Chronic Conditions: ${chronicConditions.length} created`);
    console.log(`   Medical Summaries: ${summaries.length} created`);
    console.log(`   Vital Signs: ${vitalSigns.length} created`);
    console.log('');
    console.log('🏥 Medical Records System Ready for Demo!');

    await Database.close();
  } catch (error) {
    console.error('Error seeding medical data:', error);
    process.exit(1);
  }
}

seedMedicalData();
