// Test script to verify the setup
const fetch = require('node-fetch');

async function testSetup() {
  console.log('🧪 Testing St. Raguel School Management System Setup...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing server health...');
    const healthResponse = await fetch('http://localhost:5000/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.message);

    // Test 2: Root endpoint
    console.log('\n2. Testing root endpoint...');
    const rootResponse = await fetch('http://localhost:5000/');
    const rootData = await rootResponse.json();
    console.log('✅ Root endpoint:', rootData.message);

    // Test 3: API endpoints (should require auth)
    console.log('\n3. Testing protected endpoints...');
    try {
      const usersResponse = await fetch('http://localhost:5000/api/users');
      const usersData = await usersResponse.json();
      if (usersResponse.status === 401) {
        console.log('✅ Users endpoint properly protected (401)');
      } else {
        console.log('⚠️  Users endpoint response:', usersData);
      }
    } catch (error) {
      console.log('✅ Users endpoint error (expected):', error.message);
    }

    console.log('\n🎉 Basic setup test completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your .env files with real Clerk and Hygraph credentials');
    console.log('2. Start the frontend: npm run dev');
    console.log('3. Test authentication flow');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the server is running: cd server && npm start');
    console.log('2. Check if port 5000 is available');
    console.log('3. Verify .env files are in the correct locations');
  }
}

testSetup();
