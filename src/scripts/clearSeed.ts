import { clearTestData } from './seedDatabase';

// Clear all test data
clearTestData()
  .then(() => {
    console.log('🎉 Test data cleared successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to clear test data:', error);
    process.exit(1);
  });