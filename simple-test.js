const axios = require('axios');

async function simpleTest() {
  try {
    console.log('Testing user login...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'testuser@example.com',
      password: 'password123'
    });
    
    console.log('✅ Login successful');
    console.log('Token:', loginResponse.data.token);
    
    // Test cart with the token
    console.log('Testing cart operations...');
    const cartResponse = await axios.post(
      'http://localhost:3000/api/cart/add',
      { drug_id: 1, quantity: 2 },
      { headers: { Authorization: `Bearer ${loginResponse.data.token}` } }
    );
    
    console.log('✅ Cart operation successful:', cartResponse.data);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

simpleTest();
