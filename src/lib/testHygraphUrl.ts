/**
 * Test script to verify Hygraph URL parsing
 * Run this to test if asset ID extraction works correctly
 */

import { extractHygraphAssetId, isHygraphUrl } from './hygraphUpload';

// Test URLs - replace these with actual URLs from your system
const testUrls = [
  'https://media.graphassets.com/abc123def456',
  'https://media.graphassets.com/abc123def456/document.pdf',
  'https://us-west-2.graphassets.com/cxyz789/abc123def456',
  'https://hygraph.com/asset/abc123def456',
  'https://example.com/not-hygraph.pdf',
  // Add more test URLs here based on what you see in your database
];

console.log('Testing Hygraph URL parsing:\n');

testUrls.forEach(url => {
  console.log(`URL: ${url}`);
  console.log(`  Is Hygraph URL: ${isHygraphUrl(url)}`);
  const assetId = extractHygraphAssetId(url);
  console.log(`  Extracted Asset ID: ${assetId || 'FAILED TO EXTRACT'}`);
  console.log('');
});

// To run this test:
// 1. Find an actual Hygraph URL from your database
// 2. Add it to the testUrls array above
// 3. Run: npx ts-node src/lib/testHygraphUrl.ts