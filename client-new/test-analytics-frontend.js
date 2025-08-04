const axios = require('axios');

// Set base URL
axios.defaults.baseURL = 'http://localhost:5000';

async function testFrontendAPI() {
  try {
    console.log('🔍 Testing Frontend API calls...');
    
    // 1. Login
    console.log('\n1️⃣ Testing login...');
    const loginRes = await axios.post('/api/auth/login', {
      email: 'admin@cdn.com',
      password: 'admin123'
    });
    
    if (!loginRes.data.success) {
      console.log('❌ Login failed:', loginRes.data);
      return;
    }
    
    const token = loginRes.data.data.token;
    console.log('✅ Login successful, token received');
    
    // Set auth header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // 2. Test performance trends
    console.log('\n2️⃣ Testing performance trends...');
    try {
      const trendsRes = await axios.get('/api/analytics/performance-trends?days=7&nodeId=all');
      console.log('✅ Performance trends:', JSON.stringify(trendsRes.data, null, 2));
    } catch (error) {
      console.log('❌ Performance trends error:', error.response?.data || error.message);
    }
    
    // 3. Test node comparison
    console.log('\n3️⃣ Testing node comparison...');
    try {
      const comparisonRes = await axios.get('/api/analytics/node-comparison');
      console.log('✅ Node comparison:', JSON.stringify(comparisonRes.data, null, 2));
    } catch (error) {
      console.log('❌ Node comparison error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ API test error:', error.response?.data || error.message);
  }
}

testFrontendAPI(); 