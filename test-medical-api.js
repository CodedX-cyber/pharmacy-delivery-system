const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testMedicalAPI() {
  let userToken = null;
  
  try {
    console.log('🏥 Testing Medical Records API...');
    console.log('=====================================');

    // 1. User Login
    console.log('🔐 Logging in user...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'demo@user.com',
      password: 'password123'
    });
    
    userToken = loginResponse.data.token;
    console.log('✅ User login successful');
    console.log('Token:', userToken.substring(0, 50) + '...');

    const authHeaders = {
      headers: { Authorization: `Bearer ${userToken}` }
    };

    // 2. Test Medical Summary
    console.log('\n📋 Testing Medical Summary...');
    const summaryResponse = await axios.get(`${API_BASE_URL}/medical/summary`, authHeaders);
    console.log('✅ Medical summary retrieved');
    console.log('Blood Type:', summaryResponse.data.summary.blood_type || 'Not set');
    console.log('Statistics:', summaryResponse.data.summary.statistics);

    // 3. Test Doctors List
    console.log('\n👨‍⚕️ Testing Doctors List...');
    const doctorsResponse = await axios.get(`${API_BASE_URL}/medical/doctors`, authHeaders);
    console.log('✅ Doctors retrieved:', doctorsResponse.data.count, 'doctors');
    doctorsResponse.data.doctors.slice(0, 2).forEach(doctor => {
      console.log(`  - Dr. ${doctor.name} (${doctor.specialization})`);
    });

    // 4. Test Medical Reports
    console.log('\n📄 Testing Medical Reports...');
    const reportsResponse = await axios.get(`${API_BASE_URL}/medical/reports`, authHeaders);
    console.log('✅ Medical reports retrieved:', reportsResponse.data.count, 'reports');
    reportsResponse.data.reports.slice(0, 2).forEach(report => {
      console.log(`  - ${report.title} by Dr. ${report.doctor_name}`);
    });

    // 5. Test Prescriptions
    console.log('\n💊 Testing Prescriptions...');
    const prescriptionsResponse = await axios.get(`${API_BASE_URL}/medical/prescriptions`, authHeaders);
    console.log('✅ Prescriptions retrieved:', prescriptionsResponse.data.count, 'prescriptions');
    prescriptionsResponse.data.prescriptions.slice(0, 2).forEach(prescription => {
      console.log(`  - ${prescription.prescription_number} for ${prescription.diagnosis}`);
    });

    // 6. Test Appointments
    console.log('\n📅 Testing Appointments...');
    const appointmentsResponse = await axios.get(`${API_BASE_URL}/medical/appointments`, authHeaders);
    console.log('✅ Appointments retrieved:', appointmentsResponse.data.count, 'appointments');
    appointmentsResponse.data.appointments.slice(0, 2).forEach(appointment => {
      console.log(`  - ${appointment.purpose} with Dr. ${appointment.doctor_name} on ${new Date(appointment.appointment_date).toLocaleDateString()}`);
    });

    // 7. Test Allergies
    console.log('\n🚨 Testing Allergies...');
    const allergiesResponse = await axios.get(`${API_BASE_URL}/medical/allergies`, authHeaders);
    console.log('✅ Allergies retrieved:', allergiesResponse.data.count, 'allergies');
    allergiesResponse.data.allergies.slice(0, 2).forEach(allergy => {
      console.log(`  - ${allergy.allergen} (${allergy.severity})`);
    });

    // 8. Test Prescription Details
    if (prescriptionsResponse.data.prescriptions.length > 0) {
      console.log('\n💊 Testing Prescription Details...');
      const prescriptionId = prescriptionsResponse.data.prescriptions[0].id;
      const prescriptionDetailResponse = await axios.get(`${API_BASE_URL}/medical/prescriptions/${prescriptionId}`, authHeaders);
      console.log('✅ Prescription details retrieved');
      console.log('Prescription:', prescriptionDetailResponse.data.prescription.prescription_number);
      console.log('Drugs:', prescriptionDetailResponse.data.drugs.length, 'medications');
      prescriptionDetailResponse.data.drugs.slice(0, 2).forEach(drug => {
        console.log(`  - ${drug.drug_name} (${drug.dosage}, ${drug.frequency})`);
      });
    }

    console.log('\n=====================================');
    console.log('🎉 All Medical Records API Tests Passed!');
    console.log('\n📊 Test Summary:');
    console.log('  ✅ User Authentication');
    console.log('  ✅ Medical Summary');
    console.log('  ✅ Doctors List');
    console.log('  ✅ Medical Reports');
    console.log('  ✅ Prescriptions');
    console.log('  ✅ Appointments');
    console.log('  ✅ Allergies');
    console.log('  ✅ Prescription Details');
    console.log('\n🏥 Medical Records System is fully functional!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Tip: Make sure demo user exists and credentials are correct');
    } else if (error.response?.status === 404) {
      console.log('💡 Tip: Medical records endpoints may not be properly configured');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Tip: Make sure the server is running on port 3000');
    }
    
    process.exit(1);
  }
}

testMedicalAPI();
