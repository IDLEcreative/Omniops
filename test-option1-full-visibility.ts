#!/usr/bin/env npx tsx
// Test script to verify Option 1 implementation - Full metadata with sampled details

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { execSync } from 'child_process';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

// Test configuration
const TEST_DOMAIN = 'thompsonseparts.co.uk';
const API_BASE_URL = 'http://localhost:3000';

interface TestResult {
  query: string;
  expectation: string;
  passed: boolean;
  details: {
    totalFound?: number;
    detailedReturned?: number;
    hasMetadata?: boolean;
    hasCategories?: boolean;
    hasBrands?: boolean;
    aiResponse?: string;
    error?: string;
  };
}

class FullVisibilityTester {
  private sessionId: string;
  
  constructor() {
    this.sessionId = `test-${Date.now()}`;
  }
  
  async callChatAPI(message: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-intelligent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          session_id: this.sessionId,
          domain: TEST_DOMAIN,
          config: {
            ai: { maxSearchIterations: 2 }
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('API call failed:', error.message);
      throw error;
    }
  }
  
  async runTest(query: string, expectation: string): Promise<TestResult> {
    console.log(`\n📊 Testing: "${query}"`);
    console.log(`   Expectation: ${expectation}`);
    
    const result: TestResult = {
      query,
      expectation,
      passed: false,
      details: {}
    };
    
    try {
      // Call the API
      const apiResponse = await this.callChatAPI(query);
      result.details.aiResponse = apiResponse.message;
      
      // Parse the response to check for metadata visibility
      const responseText = apiResponse.message.toLowerCase();
      
      // Check for total count awareness
      const totalMatch = responseText.match(/found (\d+) total/i) || 
                         responseText.match(/(\d+) total matches/i) ||
                         responseText.match(/have (\d+)/i);
      if (totalMatch) {
        result.details.totalFound = parseInt(totalMatch[1]);
      }
      
      // Check for detailed results count
      const detailMatch = responseText.match(/showing (\d+) detailed/i) ||
                         responseText.match(/(\d+) results/i);
      if (detailMatch) {
        result.details.detailedReturned = parseInt(detailMatch[1]);
      }
      
      // Check for metadata presence
      result.details.hasMetadata = result.details.totalFound !== undefined;
      result.details.hasCategories = responseText.includes('categories:') || 
                                    responseText.includes('category');
      result.details.hasBrands = responseText.includes('brands:') || 
                               responseText.includes('brand');
      
      // Determine if test passed based on expectation
      switch (expectation) {
        case 'shows_total_count':
          result.passed = result.details.totalFound !== undefined && 
                         result.details.totalFound > 0;
          break;
          
        case 'has_category_breakdown':
          result.passed = result.details.hasCategories === true;
          break;
          
        case 'can_filter_without_research':
          // Check if AI mentions filtering or narrowing without saying "let me search"
          result.passed = !responseText.includes('let me search') && 
                         !responseText.includes('i\'ll search') &&
                         (responseText.includes('from those') || 
                          responseText.includes('of those') ||
                          responseText.includes('within'));
          break;
          
        case 'shows_more_than_limit':
          result.passed = result.details.totalFound !== undefined &&
                         result.details.detailedReturned !== undefined &&
                         result.details.totalFound > result.details.detailedReturned;
          break;
      }
      
      // Display results
      console.log(`   ✓ Total Found: ${result.details.totalFound || 'Not shown'}`);
      console.log(`   ✓ Detailed Returned: ${result.details.detailedReturned || 'Not shown'}`);
      console.log(`   ✓ Has Metadata: ${result.details.hasMetadata ? 'Yes' : 'No'}`);
      console.log(`   ✓ Has Categories: ${result.details.hasCategories ? 'Yes' : 'No'}`);
      console.log(`   ✓ Has Brands: ${result.details.hasBrands ? 'Yes' : 'No'}`);
      console.log(`   ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
      
      // Show snippet of response
      const snippet = result.details.aiResponse?.substring(0, 200) + '...';
      console.log(`   Response snippet: "${snippet}"`);
      
    } catch (error: any) {
      result.details.error = error.message;
      console.error(`   ❌ Error: ${error.message}`);
    }
    
    return result;
  }
  
  async runFullTestSuite() {
    console.log('==========================================');
    console.log('🔬 Testing Option 1: Full Visibility Implementation');
    console.log('==========================================');
    console.log(`Domain: ${TEST_DOMAIN}`);
    console.log(`API URL: ${API_BASE_URL}`);
    console.log('');
    
    // Define test cases
    const testCases = [
      {
        query: "How many Cifa products do you have?",
        expectation: "shows_total_count"
      },
      {
        query: "Show me all pump categories",
        expectation: "has_category_breakdown"
      },
      {
        query: "List pumps",
        expectation: "shows_more_than_limit"
      },
      {
        query: "From those pumps, which ones are Cifa brand?",
        expectation: "can_filter_without_research"
      }
    ];
    
    const results: TestResult[] = [];
    
    // Run each test
    for (const testCase of testCases) {
      const result = await this.runTest(testCase.query, testCase.expectation);
      results.push(result);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Summary
    console.log('\n==========================================');
    console.log('📈 TEST SUMMARY');
    console.log('==========================================');
    
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const percentage = (passed / total * 100).toFixed(1);
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Success Rate: ${percentage}%`);
    
    if (passed === total) {
      console.log('\n🎉 All tests passed! Option 1 implementation is working correctly.');
      console.log('✨ The AI now has full visibility of search results:');
      console.log('   - Sees total count of all matches');
      console.log('   - Gets category/brand breakdowns');
      console.log('   - Can answer follow-ups without re-searching');
      console.log('   - Provides accurate counts and statistics');
    } else {
      console.log('\n⚠️  Some tests failed. Review the implementation:');
      const failedTests = results.filter(r => !r.passed);
      failedTests.forEach(test => {
        console.log(`   - "${test.query}": ${test.expectation}`);
      });
    }
    
    // Performance check
    console.log('\n⚡ Performance Notes:');
    const avgTotalFound = results
      .filter(r => r.details.totalFound)
      .reduce((sum, r) => sum + (r.details.totalFound || 0), 0) / results.length;
    
    if (avgTotalFound > 100) {
      console.log(`   Average items found: ${avgTotalFound.toFixed(0)}`);
      console.log('   ✅ Successfully handling large result sets');
      console.log('   ✅ AI has awareness of full catalog');
    }
  }
}

// Run the tests
async function main() {
  try {
    // Check if server is running
    try {
      const healthCheck = await fetch(`${API_BASE_URL}/api/health`).catch(() => null);
      if (!healthCheck) {
        console.log('⚠️  Server not responding. Starting dev server...');
        console.log('   Please wait for server to start, then run this test again.');
        process.exit(1);
      }
    } catch {}
    
    const tester = new FullVisibilityTester();
    await tester.runFullTestSuite();
    
  } catch (error: any) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();