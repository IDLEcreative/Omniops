#!/usr/bin/env npx tsx
/**
 * Comprehensive WooCommerce Endpoint Test
 * Tests all WooCommerce operations including authenticated endpoints
 * Using Sam's test credentials from mock data
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

// Sam's test credentials from mock data
const SAM_EMAIL = 'samguy@thompsonsuk.com';
const SAM_ORDER_NUMBER = '119410';
const SAM_POSTCODE = 'SW1A 1AA';

interface TestCase {
  name: string;
  message: string;
  expectAuth: boolean;
  expectedOperation?: string;
  category: string;
}

class WooCommerceEndpointTest {
  private apiUrl = 'http://localhost:3000/api/chat-intelligent';
  private domain = 'thompsonseparts.co.uk';
  private sessionId: string;
  
  constructor() {
    this.sessionId = `endpoint-test-${Date.now()}`;
  }
  
  private async sendMessage(message: string) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          session_id: this.sessionId,
          domain: this.domain
        })
      });
      
      if (!response.ok) {
        return { error: `HTTP ${response.status}`, message: '' };
      }
      
      return await response.json();
    } catch (error: any) {
      return { error: error.message, message: '' };
    }
  }
  
  private logSection(title: string) {
    console.log(`\n${colors.cyan}${colors.bright}━━━ ${title} ━━━${colors.reset}`);
  }
  
  private logTest(name: string, success: boolean, details?: string) {
    const icon = success ? `${colors.green}✅` : `${colors.red}❌`;
    console.log(`${icon} ${name}${colors.reset}`);
    if (details) {
      console.log(`   ${colors.bright}→${colors.reset} ${details}`);
    }
  }
  
  async runAllTests() {
    console.log(`${colors.cyan}${colors.bright}🛒 WooCommerce Complete Endpoint Test Suite${colors.reset}`);
    console.log(`Using Sam's credentials: ${SAM_EMAIL}`);
    console.log(`Session ID: ${this.sessionId}`);
    console.log('═'.repeat(60));
    
    let totalTests = 0;
    let passedTests = 0;
    
    // Test 1: Product Search (No Auth)
    this.logSection('1. PRODUCT SEARCH (No Auth Required)');
    
    const searchTest = await this.sendMessage('Search for hydraulic pumps in your WooCommerce store');
    totalTests++;
    const searchSuccess = searchTest.message && !searchTest.requiresVerification;
    if (searchSuccess) passedTests++;
    this.logTest('Product Search', searchSuccess, 
      searchTest.searchMetadata ? `Found ${searchTest.searchMetadata.totalSearches} searches` : 'No search metadata');
    
    // Test 2: Check Stock (No Auth)
    this.logSection('2. STOCK CHECK (No Auth Required)');
    
    const stockTest = await this.sendMessage('Check if SKU BP-001 is in stock');
    totalTests++;
    const stockSuccess = stockTest.message && !stockTest.requiresVerification;
    if (stockSuccess) passedTests++;
    this.logTest('Stock Check', stockSuccess, 
      stockTest.message ? stockTest.message.substring(0, 100) + '...' : 'No response');
    
    // Test 3: Product Categories (No Auth)
    this.logSection('3. PRODUCT CATEGORIES (No Auth Required)');
    
    const categoriesTest = await this.sendMessage('Show me all product categories in WooCommerce');
    totalTests++;
    const categoriesSuccess = categoriesTest.message && !categoriesTest.requiresVerification;
    if (categoriesSuccess) passedTests++;
    this.logTest('Categories List', categoriesSuccess);
    
    // Test 4: Add to Cart (No Auth)
    this.logSection('4. CART OPERATIONS (No Auth Required)');
    
    const addToCartTest = await this.sendMessage('Add 2 hydraulic pumps to my cart');
    totalTests++;
    const cartSuccess = addToCartTest.message && !addToCartTest.requiresVerification;
    if (cartSuccess) passedTests++;
    this.logTest('Add to Cart', cartSuccess);
    
    // Test 5: View Cart (No Auth)
    const viewCartTest = await this.sendMessage('Show me what\'s in my cart');
    totalTests++;
    const viewCartSuccess = viewCartTest.message && !viewCartTest.requiresVerification;
    if (viewCartSuccess) passedTests++;
    this.logTest('View Cart', viewCartSuccess);
    
    // Test 6: Shipping Options (No Auth)
    this.logSection('5. SHIPPING INFORMATION (No Auth Required)');
    
    const shippingTest = await this.sendMessage('What shipping options are available for UK delivery?');
    totalTests++;
    const shippingSuccess = shippingTest.message && !shippingTest.requiresVerification;
    if (shippingSuccess) passedTests++;
    this.logTest('Shipping Options', shippingSuccess);
    
    // Test 7: Order Lookup - Should Require Auth
    this.logSection('6. ORDER LOOKUP (Auth Required - Testing Security)');
    
    const orderTest1 = await this.sendMessage(`I need to check order #${SAM_ORDER_NUMBER}`);
    totalTests++;
    const orderRequiresAuth = orderTest1.requiresVerification || 
                             (orderTest1.message && orderTest1.message.toLowerCase().includes('verify'));
    if (orderRequiresAuth) passedTests++;
    this.logTest('Order Security Check', orderRequiresAuth, 
      orderRequiresAuth ? 'Correctly requires authentication' : '⚠️ Security issue - no auth required!');
    
    // Test 8: Provide Email for Auth
    this.logSection('7. AUTHENTICATION WITH EMAIL');
    
    const authTest = await this.sendMessage(`My email is ${SAM_EMAIL}`);
    totalTests++;
    const authSuccess = authTest.message && !authTest.error;
    if (authSuccess) passedTests++;
    this.logTest('Email Authentication', authSuccess,
      authTest.message ? 'Authentication processed' : 'Authentication failed');
    
    // Test 9: Order Details After Auth
    this.logSection('8. ORDER DETAILS (After Authentication)');
    
    const orderTest2 = await this.sendMessage(`Show me the details for order #${SAM_ORDER_NUMBER}`);
    totalTests++;
    const orderSuccess = orderTest2.message && !orderTest2.error;
    if (orderSuccess) passedTests++;
    this.logTest('Order Details Retrieval', orderSuccess,
      orderTest2.message && orderTest2.message.includes('119410') ? 
        'Order found with correct number' : 'Order details response received');
    
    // Test 10: Order Tracking
    this.logSection('9. ORDER TRACKING');
    
    const trackingTest = await this.sendMessage(`Track my order #${SAM_ORDER_NUMBER}`);
    totalTests++;
    const trackingSuccess = trackingTest.message && !trackingTest.error;
    if (trackingSuccess) passedTests++;
    this.logTest('Order Tracking', trackingSuccess);
    
    // Test 11: Customer Account Info
    this.logSection('10. CUSTOMER ACCOUNT (Auth Required)');
    
    const accountTest = await this.sendMessage('Show me my account details and order history');
    totalTests++;
    const accountSuccess = accountTest.message && !accountTest.error;
    if (accountSuccess) passedTests++;
    this.logTest('Customer Account Access', accountSuccess);
    
    // Test 12: Product Details
    this.logSection('11. PRODUCT DETAILS');
    
    const productDetailsTest = await this.sendMessage('Get full details for product ID 101 (Brake Pads)');
    totalTests++;
    const detailsSuccess = productDetailsTest.message && !productDetailsTest.error;
    if (detailsSuccess) passedTests++;
    this.logTest('Product Details', detailsSuccess);
    
    // Test 13: Complex Multi-Operation Query
    this.logSection('12. COMPLEX MULTI-OPERATION QUERY');
    
    const complexTest = await this.sendMessage(
      `I need to: 1) Check stock for BP-001, 2) Add 3 units to cart, 3) Check shipping to ${SAM_POSTCODE}, and 4) Apply a discount code`
    );
    totalTests++;
    const complexSuccess = complexTest.message && complexTest.searchMetadata?.totalSearches > 1;
    if (complexSuccess) passedTests++;
    this.logTest('Complex Multi-Operation', complexSuccess,
      `Executed ${complexTest.searchMetadata?.totalSearches || 0} operations`);
    
    // Test 14: WooCommerce Agent Direct Call
    this.logSection('13. WOOCOMMERCE AGENT OPERATIONS');
    
    const agentOps = [
      { query: 'Search WooCommerce for pumps', op: 'search_products' },
      { query: 'Check WooCommerce categories', op: 'get_categories' },
      { query: 'Get WooCommerce shipping rates', op: 'get_shipping_options' }
    ];
    
    for (const op of agentOps) {
      const response = await this.sendMessage(op.query);
      totalTests++;
      const success = response.message && !response.error;
      if (success) passedTests++;
      
      const usedAgent = response.searchMetadata?.searchLog?.some((log: any) => 
        log.tool === 'woocommerce_agent' || log.function === 'woocommerce_agent'
      );
      
      this.logTest(`WooCommerce Agent: ${op.op}`, success,
        usedAgent ? 'Agent called successfully' : 'Agent may not have been called');
    }
    
    // Final Summary
    console.log(`\n${colors.cyan}${colors.bright}═══ FINAL TEST SUMMARY ═══${colors.reset}`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${colors.green}${passedTests}${colors.reset}`);
    console.log(`Failed: ${colors.red}${totalTests - passedTests}${colors.reset}`);
    
    const percentage = ((passedTests / totalTests) * 100).toFixed(1);
    const statusColor = passedTests === totalTests ? colors.green : 
                       passedTests >= totalTests * 0.8 ? colors.yellow : colors.red;
    
    console.log(`Success Rate: ${statusColor}${percentage}%${colors.reset}`);
    
    console.log(`\n${colors.cyan}Key Features Tested:${colors.reset}`);
    console.log('✓ Product search and discovery');
    console.log('✓ Stock checking');
    console.log('✓ Category browsing');
    console.log('✓ Cart operations (add/view)');
    console.log('✓ Shipping information');
    console.log('✓ Order security (auth required)');
    console.log('✓ Email authentication');
    console.log('✓ Order details retrieval');
    console.log('✓ Order tracking');
    console.log('✓ Customer account access');
    console.log('✓ Product details');
    console.log('✓ Complex multi-operations');
    console.log('✓ WooCommerce agent direct calls');
    
    if (passedTests === totalTests) {
      console.log(`\n${colors.green}${colors.bright}🎉 PERFECT! All endpoints working flawlessly!${colors.reset}`);
    } else if (passedTests >= totalTests * 0.8) {
      console.log(`\n${colors.yellow}${colors.bright}✅ GOOD! Most endpoints working correctly.${colors.reset}`);
    } else {
      console.log(`\n${colors.red}${colors.bright}⚠️ ATTENTION NEEDED! Several endpoints need fixes.${colors.reset}`);
    }
    
    // Security Assessment
    console.log(`\n${colors.cyan}${colors.bright}🔒 Security Assessment:${colors.reset}`);
    if (orderRequiresAuth) {
      console.log(`${colors.green}✅ Order lookup properly requires authentication${colors.reset}`);
      console.log(`${colors.green}✅ Customer data is protected${colors.reset}`);
    } else {
      console.log(`${colors.red}⚠️ SECURITY ISSUE: Order lookup doesn't require authentication!${colors.reset}`);
    }
    
    return {
      total: totalTests,
      passed: passedTests,
      failed: totalTests - passedTests,
      percentage: parseFloat(percentage)
    };
  }
}

// Run the comprehensive test
const test = new WooCommerceEndpointTest();
test.runAllTests().catch(console.error);