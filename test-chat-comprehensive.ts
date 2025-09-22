#!/usr/bin/env npx tsx
/**
 * Comprehensive Chat System Test Suite
 * Tests all aspects of the improved chat implementation
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  response?: string;
}

class ChatTester {
  private baseUrl = 'http://localhost:3000/api/chat-intelligent';
  private domain = 'thompsonseparts.co.uk';
  private results: TestResult[] = [];

  async makeRequest(message: string, sessionId: string, conversationId?: string): Promise<any> {
    const body = {
      message,
      session_id: sessionId,
      domain: this.domain,
      ...(conversationId && { conversation_id: conversationId })
    };

    try {
      const { stdout } = await execAsync(`
        curl -s -X POST ${this.baseUrl} \
          -H "Content-Type: application/json" \
          -d '${JSON.stringify(body)}'
      `);
      
      return JSON.parse(stdout);
    } catch (error: any) {
      console.error(`Request failed: ${error.message}`);
      return null;
    }
  }

  // Test 1: Product count accuracy
  async testProductCounts() {
    console.log(`\n${colors.cyan}Test 1: Product Count Accuracy${colors.reset}`);
    
    const queries = [
      { query: "How many Cifa products do you have?", expectedPattern: /We have \d+ Cifa products? available/ },
      { query: "Show me all pumps", expectedPattern: /We have \d+ pumps? available/ },
      { query: "List starter chargers", expectedPattern: /We have \d+ starter chargers? available/ }
    ];

    for (const { query, expectedPattern } of queries) {
      const response = await this.makeRequest(query, `test-counts-${Date.now()}`);
      const passed = expectedPattern.test(response?.message || '');
      
      this.results.push({
        name: `Count for: "${query}"`,
        passed,
        message: passed ? 'Shows total count correctly' : 'Missing or incorrect count format',
        response: response?.message?.substring(0, 100)
      });
      
      console.log(`  ${passed ? colors.green + '✓' : colors.red + '✗'} ${query}`);
      if (!passed && response?.message) {
        console.log(`    ${colors.gray}Response: ${response.message.substring(0, 100)}...${colors.reset}`);
      }
    }
  }

  // Test 2: Conversation memory
  async testConversationMemory() {
    console.log(`\n${colors.cyan}Test 2: Conversation Memory & Context${colors.reset}`);
    
    const sessionId = `test-memory-${Date.now()}`;
    
    // First message
    const response1 = await this.makeRequest(
      "Show me Sealey starter chargers",
      sessionId
    );
    const conversationId = response1?.conversation_id;
    
    // Follow-up referencing previous
    const response2 = await this.makeRequest(
      "What's the price of the 660/100A model?",
      sessionId,
      conversationId
    );
    
    const passed = response2?.message?.includes('425') || response2?.message?.includes('660/100A');
    
    this.results.push({
      name: 'Conversation Memory',
      passed,
      message: passed ? 'Correctly references previous context' : 'Failed to recall previous message',
      response: response2?.message?.substring(0, 150)
    });
    
    console.log(`  ${passed ? colors.green + '✓' : colors.red + '✗'} Follow-up question references previous context`);
  }

  // Test 3: No results handling
  async testNoResults() {
    console.log(`\n${colors.cyan}Test 3: No Results Handling${colors.reset}`);
    
    const response = await this.makeRequest(
      "Do you have any XYZ123ABC products?",
      `test-noresults-${Date.now()}`
    );
    
    const hasProperResponse = 
      response?.message?.includes("couldn't find") ||
      response?.message?.includes("no products matching") ||
      response?.message?.includes("don't have");
    
    const doesNotHallucinate = !response?.message?.includes("We have");
    
    const passed = hasProperResponse && doesNotHallucinate;
    
    this.results.push({
      name: 'No Results Handling',
      passed,
      message: passed ? 'Handles no results gracefully' : 'Poor handling of no results',
      response: response?.message?.substring(0, 150)
    });
    
    console.log(`  ${passed ? colors.green + '✓' : colors.red + '✗'} No results message (no hallucination)`);
  }

  // Test 4: Partial results with "more available"
  async testPartialResults() {
    console.log(`\n${colors.cyan}Test 4: Partial Results Display${colors.reset}`);
    
    const response = await this.makeRequest(
      "Show me all products", // Should trigger limit and show "more available"
      `test-partial-${Date.now()}`
    );
    
    const hasMoreAvailable = 
      response?.message?.includes("more") && 
      response?.message?.includes("available");
    
    this.results.push({
      name: 'Partial Results Display',
      passed: hasMoreAvailable,
      message: hasMoreAvailable ? 'Shows "more available" for partial lists' : 'Missing "more available" indicator',
      response: response?.message?.substring(response.message.lastIndexOf('...'), response.message.lastIndexOf('...') + 100)
    });
    
    console.log(`  ${hasMoreAvailable ? colors.green + '✓' : colors.red + '✗'} Shows "more available" message`);
  }

  // Test 5: Stock status display
  async testStockStatus() {
    console.log(`\n${colors.cyan}Test 5: Stock Status Display${colors.reset}`);
    
    const response = await this.makeRequest(
      "Show me pumps with their availability",
      `test-stock-${Date.now()}`
    );
    
    const hasStockIndicators = 
      response?.message?.includes('✓') || 
      response?.message?.includes('✗') ||
      response?.message?.includes('Available') ||
      response?.message?.includes('Out of stock');
    
    this.results.push({
      name: 'Stock Status Display',
      passed: hasStockIndicators,
      message: hasStockIndicators ? 'Shows stock status indicators' : 'Missing stock status',
      response: response?.message?.substring(0, 200)
    });
    
    console.log(`  ${hasStockIndicators ? colors.green + '✓' : colors.red + '✗'} Stock status indicators present`);
  }

  // Test 6: URL hallucination prevention
  async testUrlHallucination() {
    console.log(`\n${colors.cyan}Test 6: URL Hallucination Prevention${colors.reset}`);
    
    const response = await this.makeRequest(
      "Can you show me the hydraulics category page?",
      `test-url-${Date.now()}`
    );
    
    // Check it doesn't make up category URLs
    const hasMadeUpUrl = response?.message?.includes('/product-category/hydraulics');
    const hasProperResponse = 
      response?.message?.includes('search') ||
      response?.message?.includes('help you find') ||
      response?.message?.includes('browse');
    
    const passed = !hasMadeUpUrl && hasProperResponse;
    
    this.results.push({
      name: 'URL Hallucination Prevention',
      passed,
      message: passed ? 'Does not hallucinate URLs' : 'May be hallucinating URLs',
      response: response?.message?.substring(0, 150)
    });
    
    console.log(`  ${passed ? colors.green + '✓' : colors.red + '✗'} No hallucinated category URLs`);
  }

  // Test 7: Multiple product types
  async testMultipleTypes() {
    console.log(`\n${colors.cyan}Test 7: Multiple Product Types${colors.reset}`);
    
    const types = ['Teng tools', 'Bezares products', 'Edbro items'];
    let allPassed = true;
    
    for (const type of types) {
      const response = await this.makeRequest(
        `Show me ${type}`,
        `test-types-${Date.now()}`
      );
      
      const hasCount = /We have \d+/.test(response?.message || '');
      if (!hasCount) allPassed = false;
      
      console.log(`  ${hasCount ? colors.green + '✓' : colors.red + '✗'} ${type}: ${hasCount ? 'Shows count' : 'Missing count'}`);
    }
    
    this.results.push({
      name: 'Multiple Product Types',
      passed: allPassed,
      message: allPassed ? 'All product types show counts' : 'Some types missing counts'
    });
  }

  // Test 8: Response formatting consistency
  async testFormattingConsistency() {
    console.log(`\n${colors.cyan}Test 8: Response Formatting Consistency${colors.reset}`);
    
    const responses = await Promise.all([
      this.makeRequest("Show me 3 products", `test-format-1-${Date.now()}`),
      this.makeRequest("List some items", `test-format-2-${Date.now()}`),
      this.makeRequest("What products do you have?", `test-format-3-${Date.now()}`)
    ]);
    
    let consistentFormatting = true;
    for (const response of responses) {
      if (!response?.message) {
        consistentFormatting = false;
        break;
      }
      
      // Check for numbered list format
      const hasNumberedList = /1\.\s/.test(response.message) || 
                              /We have \d+/.test(response.message);
      
      if (!hasNumberedList) {
        consistentFormatting = false;
      }
    }
    
    this.results.push({
      name: 'Formatting Consistency',
      passed: consistentFormatting,
      message: consistentFormatting ? 'Consistent formatting across queries' : 'Inconsistent formatting'
    });
    
    console.log(`  ${consistentFormatting ? colors.green + '✓' : colors.red + '✗'} Consistent response formatting`);
  }

  // Run all tests
  async runAllTests() {
    console.log(`${colors.blue}${'='.repeat(60)}`);
    console.log(`${colors.blue}Comprehensive Chat System Test Suite${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
    
    await this.testProductCounts();
    await this.testConversationMemory();
    await this.testNoResults();
    await this.testPartialResults();
    await this.testStockStatus();
    await this.testUrlHallucination();
    await this.testMultipleTypes();
    await this.testFormattingConsistency();
    
    // Summary
    console.log(`\n${colors.blue}${'='.repeat(60)}`);
    console.log(`${colors.blue}Test Summary${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const percentage = Math.round((passed / total) * 100);
    
    const summaryColor = percentage >= 80 ? colors.green : 
                        percentage >= 60 ? colors.yellow : 
                        colors.red;
    
    console.log(`${summaryColor}Passed: ${passed}/${total} (${percentage}%)${colors.reset}\n`);
    
    // Detailed results
    console.log(`${colors.cyan}Detailed Results:${colors.reset}`);
    for (const result of this.results) {
      const icon = result.passed ? colors.green + '✓' : colors.red + '✗';
      console.log(`${icon} ${result.name}${colors.reset}`);
      console.log(`  ${colors.gray}${result.message}${colors.reset}`);
      if (!result.passed && result.response) {
        console.log(`  ${colors.gray}Response: "${result.response}..."${colors.reset}`);
      }
    }
    
    // Overall assessment
    console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
    if (percentage >= 90) {
      console.log(`${colors.green}✅ EXCELLENT: System performing very well!${colors.reset}`);
    } else if (percentage >= 75) {
      console.log(`${colors.yellow}⚠️  GOOD: System working but has some issues${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ NEEDS WORK: System has significant issues${colors.reset}`);
    }
    console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
  }
}

// Run tests
const tester = new ChatTester();
tester.runAllTests().catch(console.error);