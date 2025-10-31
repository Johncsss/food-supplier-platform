// Simple API test script for mobile app
const API_BASE = 'http://192.168.31.161:3000';

async function testAPI() {
  console.log('Testing API endpoints...');
  
  // Test 1: Basic connectivity
  try {
    const response = await fetch(`${API_BASE}/api/test`);
    const data = await response.json();
    console.log('✅ Test endpoint:', data);
  } catch (error) {
    console.error('❌ Test endpoint failed:', error.message);
  }
  
  // Test 2: Points balance endpoint
  try {
    const testUserId = 'test-user-123';
    const response = await fetch(`${API_BASE}/api/purchase-points?userId=${testUserId}`);
    const data = await response.json();
    console.log('✅ Points balance endpoint:', data);
  } catch (error) {
    console.error('❌ Points balance endpoint failed:', error.message);
  }
  
  // Test 3: Deduct points endpoint
  try {
    const response = await fetch(`${API_BASE}/api/deduct-points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'test-user-123',
        amount: 10,
        description: 'Test deduction'
      }),
    });
    const data = await response.json();
    console.log('✅ Deduct points endpoint:', data);
  } catch (error) {
    console.error('❌ Deduct points endpoint failed:', error.message);
  }
}

// Run the test
testAPI();
