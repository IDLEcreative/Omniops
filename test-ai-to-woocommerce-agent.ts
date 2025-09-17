#!/usr/bin/env npx tsx
/**
 * Test AI -> WooCommerce Agent Relationship
 * Verifies the Customer Service AI properly calls the WooCommerce Agent
 * for all different operations (not just direct endpoint testing)
 */

import 'dotenv/config';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

interface AgentCall {
  query: string;
  expectedOperation: string;
  description: string;
  requiresAuth?: boolean;
}

class AIAgentRelationshipTest {
  private sessionId: string;
  private apiUrl = 'http://localhost:3000/api/chat-intelligent';
  private domain = 'thompsonseparts.co.uk';
  
  constructor() {
    this.sessionId = `ai-agent-test-${Date.now()}`;
  }
  
  private async sendMessage(message: string) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        session_id: this.sessionId,
        domain: this.domain
      })
    });
    
    return await response.json();
  }
  
  private checkAgentCall(response: any, expectedOp: string): {
    called: boolean;
    operation?: string;
    details: string;
  } {
    // Check if WooCommerce agent was called
    const searchLog = response.searchMetadata?.searchLog || [];
    const agentCalls = searchLog.filter((log: any) => 
      log.tool === 'woocommerce_agent' || 
      log.function === 'woocommerce_agent' ||
      log.source === 'woocommerce'
    );
    
    if (agentCalls.length === 0) {
      return { 
        called: false, 
        details: 'WooCommerce agent was NOT called' 
      };
    }
    
    // Try to extract operation from the call
    // This might be in the query or parameters
    const operation = agentCalls[0].query || agentCalls[0].operation || 'unknown';
    
    return {
      called: true,
      operation,
      details: `Agent called ${agentCalls.length} time(s), operation: ${operation}`
    };
  }
  
  async runTest() {
    console.log(`${colors.cyan}${colors.bright}🤖 Testing AI → WooCommerce Agent Relationship${colors.reset}`);
    console.log('Verifying the Customer Service AI properly delegates to WooCommerce Agent');
    console.log('Session:', this.sessionId);
    console.log('═'.repeat(70));
    
    const testCases: AgentCall[] = [
      {
        query: "Search your online store for hydraulic pumps",
        expectedOperation: "search_products",
        description: "Product Search"
      },
      {
        query: "What categories of products do you have in WooCommerce?",
        expectedOperation: "get_categories",
        description: "Category Listing"
      },
      {
        query: "Check if SKU PUMP-001 is in stock in your store",
        expectedOperation: "check_stock",
        description: "Stock Check"
      },
      {
        query: "Get full details for product ID 12345 from WooCommerce",
        expectedOperation: "get_product_details",
        description: "Product Details"
      },
      {
        query: "I want to add product 101 to my shopping cart",
        expectedOperation: "add_to_cart",
        description: "Add to Cart"
      },
      {
        query: "Show me what's currently in my cart",
        expectedOperation: "view_cart",
        description: "View Cart"
      },
      {
        query: "What shipping options are available for UK delivery?",
        expectedOperation: "get_shipping_options",
        description: "Shipping Options"
      },
      {
        query: "I need to check my order number 119410",
        expectedOperation: "view_order",
        description: "Order View (Auth Required)",
        requiresAuth: true
      },
      {
        query: "Track the shipping status of order 119410",
        expectedOperation: "track_order",
        description: "Order Tracking (Auth Required)",
        requiresAuth: true
      }
    ];
    
    let totalTests = 0;
    let agentCalled = 0;
    let correctOperations = 0;
    
    console.log(`\n${colors.blue}Testing ${testCases.length} different WooCommerce operations:${colors.reset}\n`);
    
    for (const test of testCases) {
      totalTests++;
      console.log(`${colors.cyan}Test ${totalTests}: ${test.description}${colors.reset}`);
      console.log(`Query: "${test.query}"`);
      console.log(`Expected: AI should call WooCommerce Agent with '${test.expectedOperation}'`);
      
      const response = await this.sendMessage(test.query);
      const agentCheck = this.checkAgentCall(response, test.expectedOperation);
      
      if (agentCheck.called) {
        agentCalled++;
        console.log(`${colors.green}✅ AI called WooCommerce Agent${colors.reset}`);
        console.log(`   Details: ${agentCheck.details}`);
        
        // Check if it's the right operation (fuzzy match)
        if (agentCheck.operation?.includes(test.expectedOperation) || 
            test.expectedOperation.includes(agentCheck.operation || '')) {
          correctOperations++;
          console.log(`   ${colors.green}✓ Correct operation${colors.reset}`);
        } else {
          console.log(`   ${colors.yellow}⚠ Operation mismatch${colors.reset}`);
        }
      } else {
        console.log(`${colors.red}❌ AI did NOT call WooCommerce Agent${colors.reset}`);
        console.log(`   ${colors.yellow}AI might have used a different tool or handled directly${colors.reset}`);
        
        // Check what the AI actually did
        if (response.searchMetadata?.searchLog?.length > 0) {
          const tools = response.searchMetadata.searchLog.map((l: any) => l.tool || l.function).join(', ');
          console.log(`   Tools used instead: ${tools}`);
        }
      }
      
      // Check authentication requirement
      if (test.requiresAuth) {
        if (response.requiresVerification || response.message?.includes('verify')) {
          console.log(`   ${colors.green}✓ Correctly requires authentication${colors.reset}`);
        } else {
          console.log(`   ${colors.red}⚠ Should require authentication${colors.reset}`);
        }
      }
      
      console.log('');
    }
    
    // Summary
    console.log(`${colors.cyan}${colors.bright}═══ RELATIONSHIP TEST SUMMARY ═══${colors.reset}`);
    console.log(`Total Operations Tested: ${totalTests}`);
    console.log(`WooCommerce Agent Called: ${colors.green}${agentCalled}/${totalTests}${colors.reset}`);
    console.log(`Correct Operations: ${colors.green}${correctOperations}/${totalTests}${colors.reset}`);
    
    const percentage = ((agentCalled / totalTests) * 100).toFixed(1);
    
    if (agentCalled === totalTests) {
      console.log(`\n${colors.green}${colors.bright}✅ PERFECT! AI properly delegates ALL operations to WooCommerce Agent${colors.reset}`);
    } else if (agentCalled >= totalTests * 0.7) {
      console.log(`\n${colors.yellow}${colors.bright}⚠ MOSTLY WORKING: AI delegates ${percentage}% of operations${colors.reset}`);
      console.log('Some operations might be handled differently or need adjustment');
    } else {
      console.log(`\n${colors.red}${colors.bright}❌ ISSUE: AI only delegates ${percentage}% to WooCommerce Agent${colors.reset}`);
      console.log('The AI might not be recognizing when to use the WooCommerce Agent');
    }
    
    // Detailed Analysis
    console.log(`\n${colors.cyan}Analysis:${colors.reset}`);
    if (agentCalled < totalTests) {
      console.log('The AI is not always recognizing when to use the WooCommerce Agent.');
      console.log('This could mean:');
      console.log('1. The AI is using other tools (search_products, etc.) instead');
      console.log('2. The tool descriptions might need to be clearer');
      console.log('3. The system prompt might need adjustment');
    } else {
      console.log('✅ The AI correctly identifies all WooCommerce operations');
      console.log('✅ Proper delegation pattern is working');
      console.log('✅ Agent relationship is functioning as designed');
    }
    
    return {
      total: totalTests,
      agentCalled,
      correctOperations,
      percentage: parseFloat(percentage)
    };
  }
}

// Run the test
const test = new AIAgentRelationshipTest();
test.runTest().catch(console.error);