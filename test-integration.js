const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Test configuration
const testConfig = {
  user: {
    email: 'testuser@example.com',
    password: 'password123',
    name: 'Test User',
    phone: '1234567890',
    address: '123 Test Street, Test City'
  },
  admin: {
    email: 'admin@pharmacy.com',
    password: 'admin123'
  }
};

let userToken = null;
let adminToken = null;
let testUserId = null;
let testOrderId = null;
let testDrugId = null;

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const log = (message, type = 'INFO') => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${type}: ${message}`);
};

const logError = (error, context) => {
  console.error(`ERROR in ${context}:`, error.response?.data || error.message);
};

// Test functions
async function testUserRegistration() {
  log('Testing User Registration...');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, testConfig.user);
    log('✅ User registration successful');
    return true;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
      log('ℹ️ User already exists, proceeding with login');
      return true;
    }
    logError(error, 'User Registration');
    return false;
  }
}

async function testUserLogin() {
  log('Testing User Login...');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testConfig.user.email,
      password: testConfig.user.password
    });
    userToken = response.data.token;
    testUserId = response.data.user.id;
    log('✅ User login successful');
    return true;
  } catch (error) {
    logError(error, 'User Login');
    return false;
  }
}

async function testAdminLogin() {
  log('Testing Admin Login...');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/admin/login`, testConfig.admin);
    adminToken = response.data.token;
    log('✅ Admin login successful');
    return true;
  } catch (error) {
    logError(error, 'Admin Login');
    return false;
  }
}

async function testDrugListing() {
  log('Testing Drug Listing...');
  try {
    const response = await axios.get(`${API_BASE_URL}/drugs`);
    if (response.data.drugs && response.data.drugs.length > 0) {
      testDrugId = response.data.drugs[0].id;
      log(`✅ Found ${response.data.drugs.length} drugs`);
      return true;
    }
    log('❌ No drugs found');
    return false;
  } catch (error) {
    logError(error, 'Drug Listing');
    return false;
  }
}

async function testCartOperations() {
  log('Testing Cart Operations...');
  if (!userToken || !testDrugId) {
    log('❌ Missing user token or drug ID');
    return false;
  }

  try {
    // Add item to cart
    const addResponse = await axios.post(
      `${API_BASE_URL}/cart/add`,
      { drug_id: testDrugId, quantity: 2 },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    log('✅ Item added to cart');

    // Get cart
    const cartResponse = await axios.get(
      `${API_BASE_URL}/cart`,
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    
    if (cartResponse.data.cart && cartResponse.data.cart.length > 0) {
      log(`✅ Cart has ${cartResponse.data.cart.length} items`);
      return true;
    }
    log('❌ Cart is empty');
    return false;
  } catch (error) {
    logError(error, 'Cart Operations');
    return false;
  }
}

async function testOrderCreation() {
  log('Testing Order Creation...');
  if (!userToken) {
    log('❌ Missing user token');
    return false;
  }

  try {
    const orderData = {
      items: [{ drug_id: testDrugId, quantity: 1 }],
      delivery_address: testConfig.user.address,
      payment_method: 'cash'
    };

    const response = await axios.post(
      `${API_BASE_URL}/orders`,
      orderData,
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    
    testOrderId = response.data.order.id;
    log(`✅ Order created with ID: ${testOrderId}`);
    return true;
  } catch (error) {
    logError(error, 'Order Creation');
    return false;
  }
}

async function testOrderRetrieval() {
  log('Testing Order Retrieval...');
  if (!userToken || !testOrderId) {
    log('❌ Missing user token or order ID');
    return false;
  }

  try {
    const response = await axios.get(
      `${API_BASE_URL}/orders/${testOrderId}`,
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    
    if (response.data.order) {
      log(`✅ Order retrieved: Status - ${response.data.order.status}`);
      return true;
    }
    log('❌ Order not found');
    return false;
  } catch (error) {
    logError(error, 'Order Retrieval');
    return false;
  }
}

async function testAdminOrderManagement() {
  log('Testing Admin Order Management...');
  if (!adminToken || !testOrderId) {
    log('❌ Missing admin token or order ID');
    return false;
  }

  try {
    // Get all orders
    const allOrdersResponse = await axios.get(
      `${API_BASE_URL}/admin/orders`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    log(`✅ Admin retrieved ${allOrdersResponse.data.orders.length} orders`);

    // Update order status
    const updateResponse = await axios.put(
      `${API_BASE_URL}/admin/orders/${testOrderId}/status`,
      { status: 'processing' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    log('✅ Order status updated to "processing"');

    return true;
  } catch (error) {
    logError(error, 'Admin Order Management');
    return false;
  }
}

async function testDrugManagement() {
  log('Testing Drug Management...');
  if (!adminToken) {
    log('❌ Missing admin token');
    return false;
  }

  try {
    // Add new drug
    const newDrug = {
      name: 'Test Drug',
      description: 'Test medication for integration testing',
      price: 99.99,
      stock_quantity: 50,
      requires_prescription: false,
      image_url: 'https://via.placeholder.com/200x200/000000/FFFFFF?text=Test'
    };

    const addResponse = await axios.post(
      `${API_BASE_URL}/admin/drugs`,
      newDrug,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    
    const newDrugId = addResponse.data.drug.id;
    log(`✅ New drug created with ID: ${newDrugId}`);

    // Update drug
    const updateResponse = await axios.put(
      `${API_BASE_URL}/admin/drugs/${newDrugId}`,
      { ...newDrug, price: 89.99 },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    log('✅ Drug price updated');

    // Delete drug
    await axios.delete(
      `${API_BASE_URL}/admin/drugs/${newDrugId}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    log('✅ Test drug deleted');

    return true;
  } catch (error) {
    logError(error, 'Drug Management');
    return false;
  }
}

async function runIntegrationTests() {
  log('🚀 Starting Integration Tests...');
  log('================================');

  const tests = [
    { name: 'User Registration', fn: testUserRegistration },
    { name: 'User Login', fn: testUserLogin },
    { name: 'Admin Login', fn: testAdminLogin },
    { name: 'Drug Listing', fn: testDrugListing },
    { name: 'Cart Operations', fn: testCartOperations },
    { name: 'Order Creation', fn: testOrderCreation },
    { name: 'Order Retrieval', fn: testOrderRetrieval },
    { name: 'Admin Order Management', fn: testAdminOrderManagement },
    { name: 'Drug Management', fn: testDrugManagement }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
    }
    await delay(500); // Small delay between tests
  }

  log('================================');
  log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    log('🎉 All integration tests passed!');
  } else {
    log('❌ Some tests failed. Check the logs above.');
  }

  return failed === 0;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runIntegrationTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runIntegrationTests,
  testConfig
};
