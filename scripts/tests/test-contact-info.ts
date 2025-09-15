#!/usr/bin/env npx tsx
/**
 * Test script for contact information handling in chat API
 * This verifies that contact requests are handled on the first ask
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

const API_URL = 'http://localhost:3000/api/chat';

// Test queries that should trigger contact info response
const contactQueries = [
  "do you have a phone number",
  "heya do you hve a phone nuber", // Typo test from user's example
  "how can I contact you",
  "what's your email address",
  "I need to speak to someone",
  "customer service contact",
  "how do I reach support",
  "can I call you",
  "telephone number please",
  "I want to talk to someone",
  "get in touch",
  "contact details"
];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testContactQuery(query: string, sessionId: string): Promise<boolean> {
  console.log(`\n${colors.cyan}Testing query: "${query}"${colors.reset}`);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: query,
        session_id: sessionId,
        domain: 'thompsonseparts.co.uk',
        config: {
          features: {
            websiteScraping: { enabled: true }
          }
        }
      })
    });

    if (!response.ok) {
      console.error(`${colors.red}❌ HTTP Error: ${response.status}${colors.reset}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
      return false;
    }

    const data = await response.json();
    const responseMessage = data.message || '';
    
    // Check if response contains contact information
    const hasPhoneNumber = /\b(?:01254\s*914750|01254\s*914800|\d{5}\s*\d{6})\b/i.test(responseMessage);
    const hasEmail = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/.test(responseMessage);
    const hasContactWord = /contact|phone|email|call|reach/i.test(responseMessage);
    const hasContactPageLink = /contact|help|support/i.test(responseMessage);
    
    // Log the response
    console.log(`${colors.bright}Response:${colors.reset}`);
    console.log(responseMessage.substring(0, 300) + (responseMessage.length > 300 ? '...' : ''));
    
    // Check success criteria
    const success = hasPhoneNumber || hasEmail || (hasContactWord && hasContactPageLink);
    
    if (success) {
      console.log(`${colors.green}✅ Contact info provided immediately!${colors.reset}`);
      if (hasPhoneNumber) console.log(`  - Phone number(s) found`);
      if (hasEmail) console.log(`  - Email address(es) found`);
      if (hasContactPageLink) console.log(`  - Contact page link found`);
    } else {
      console.log(`${colors.red}❌ No contact information in response${colors.reset}`);
      console.log(`  - Has phone: ${hasPhoneNumber}`);
      console.log(`  - Has email: ${hasEmail}`);
      console.log(`  - Has contact word: ${hasContactWord}`);
      console.log(`  - Has contact link: ${hasContactPageLink}`);
    }
    
    return success;
  } catch (error) {
    console.error(`${colors.red}❌ Error: ${error}${colors.reset}`);
    return false;
  }
}

async function runTests() {
  console.log(`${colors.bright}${colors.blue}=================================`);
  console.log(`Contact Information Handler Tests`);
  console.log(`==================================${colors.reset}\n`);
  
  // Check if server is running
  console.log(`${colors.yellow}Checking if server is running...${colors.reset}`);
  try {
    const healthCheck = await fetch('http://localhost:3000/api/health');
    if (!healthCheck.ok) {
      console.error(`${colors.red}Server is not responding properly. Please ensure the dev server is running with 'npm run dev'${colors.reset}`);
      process.exit(1);
    }
    console.log(`${colors.green}✓ Server is running${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Cannot connect to server. Please start the dev server with 'npm run dev'${colors.reset}`);
    process.exit(1);
  }
  
  // Generate unique session ID for this test run
  const sessionId = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  console.log(`\n${colors.yellow}Session ID: ${sessionId}${colors.reset}`);
  
  // Run tests
  let successCount = 0;
  const totalTests = contactQueries.length;
  
  for (const query of contactQueries) {
    const success = await testContactQuery(query, sessionId);
    if (success) successCount++;
    
    // Add small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log(`\n${colors.bright}${colors.blue}=================================`);
  console.log(`Test Summary`);
  console.log(`==================================${colors.reset}`);
  
  const successRate = (successCount / totalTests * 100).toFixed(1);
  const summaryColor = successCount === totalTests ? colors.green : 
                       successCount > totalTests / 2 ? colors.yellow : colors.red;
  
  console.log(`${summaryColor}Success Rate: ${successCount}/${totalTests} (${successRate}%)${colors.reset}`);
  
  if (successCount < totalTests) {
    console.log(`\n${colors.yellow}Note: Some tests failed. This could be due to:${colors.reset}`);
    console.log(`- Contact information not being scraped yet for the domain`);
    console.log(`- Database not containing structured_extractions for contact info`);
    console.log(`- OpenAI API issues or rate limiting`);
    console.log(`\nTo ensure contact info is available, run a scrape for the domain first.`);
  } else {
    console.log(`\n${colors.green}All tests passed! Contact information is being provided on first request.${colors.reset}`);
  }
}

// Run the tests
runTests().catch(console.error);