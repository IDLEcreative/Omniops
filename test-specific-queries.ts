#!/usr/bin/env npx tsx
/**
 * Test specific queries that were failing
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

const API_URL = 'http://localhost:3000/api/chat';

// Test the specific queries that were failing
const testQueries = [
  "I need to speak to someone",
  "I want to talk to someone",
  "speak to customer service",
  "I want to speak with support"
];

async function testQuery(query: string): Promise<void> {
  console.log(`\nTesting: "${query}"`);
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: query,
      session_id: `test-${Date.now()}`,
      domain: 'thompsonseparts.co.uk',
      config: {
        features: {
          websiteScraping: { enabled: true }
        }
      }
    })
  });

  const data = await response.json();
  const message = data.message || '';
  
  // Check for contact info
  const hasPhone = /\b(?:01254|phone|call)\b/i.test(message);
  const hasEmail = /@|email/i.test(message);
  
  console.log(`Response snippet: ${message.substring(0, 200)}...`);
  console.log(`Has contact info: ${hasPhone || hasEmail ? '✅ YES' : '❌ NO'}`);
}

async function runTests() {
  console.log('Testing improved contact detection...\n');
  
  for (const query of testQueries) {
    await testQuery(query);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

runTests().catch(console.error);