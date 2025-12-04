const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function debugMedicalAdmin() {
  try {
    console.log('🔍 Debugging Medical Admin Routes...');
    
    // Admin login
    const adminLogin = await axios.post(`${API_BASE_URL}/auth/admin/login`, {
      email: 'admin@pharmacy.com',
      password: 'admin123'
    });
    const adminToken = adminLogin.data.token;
    const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };
    
    console.log('✅ Admin login successful');
    
    // Test debug endpoint without middleware
    console.log('\n📄 Testing medical reports DEBUG endpoint (root level)...');
    
    try {
      const response = await axios.get(`http://localhost:3000/debug/reports`);
      console.log('✅ Debug endpoint works');
      console.log('Response:', response.data);
    } catch (error) {
      console.error('❌ Debug endpoint failed:', error.response?.data);
      console.error('Status:', error.response?.status);
    }
    
    // Test basic medical reports admin endpoint
    console.log('\n📄 Testing medical reports admin endpoint (with middleware)...');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/medical/reports`, adminHeaders);
      console.log('✅ Medical reports admin endpoint works');
      console.log('Response count:', response.data.count);
    } catch (error) {
      console.error('❌ Medical reports admin endpoint failed:', error.response?.data);
      console.error('Status:', error.response?.status);
    }
    
    // Test medical reports test endpoint
    console.log('\n📄 Testing medical reports TEST endpoint...');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/medical/reports-test`, adminHeaders);
      console.log('✅ Medical reports TEST endpoint works');
      console.log('Response:', response.data);
    } catch (error) {
      console.error('❌ Medical reports TEST endpoint failed:', error.response?.data);
      console.error('Status:', error.response?.status);
    }
    
    // Test basic doctors admin endpoint
    console.log('\n👨‍⚕️ Testing doctors admin endpoint...');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/medical/doctors`, adminHeaders);
      console.log('✅ Doctors admin endpoint works');
      console.log('Response count:', response.data.count);
    } catch (error) {
      console.error('❌ Doctors admin endpoint failed:', error.response?.data);
      console.error('Status:', error.response?.status);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugMedicalAdmin();
