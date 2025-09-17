#!/usr/bin/env npx tsx
/**
 * End-to-End Test: Complete WooCommerce User Journey via Chat
 * Tests the full customer experience from product search to order inquiry
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

interface ChatResponse {
  message: string;
  sources?: any[];
  searchMetadata?: any;
  tokenUsage?: any;
  requiresVerification?: boolean;
  conversation_id?: string;
}

class WooCommerceE2ETest {
  private sessionId: string;
  private domain = 'thompsonseparts.co.uk';
  private apiUrl = 'http://localhost:3000/api/chat-intelligent';
  
  constructor() {
    this.sessionId = `e2e-test-${Date.now()}`;
  }
  
  private async sendMessage(message: string): Promise<ChatResponse> {
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
      throw new Error(`Chat API error: ${response.status}`);
    }
    
    return await response.json();
  }
  
  private logStep(step: number, description: string) {
    console.log(`\n${colors.cyan}${colors.bright}Step ${step}: ${description}${colors.reset}`);
    console.log('-'.repeat(60));
  }
  
  private logResponse(data: ChatResponse, maxLength = 300) {
    if (data.message) {
      const preview = data.message.substring(0, maxLength);
      console.log(`${colors.bright}Response:${colors.reset} ${preview}${data.message.length > maxLength ? '...' : ''}`);
    }
    
    if (data.searchMetadata) {
      console.log(`${colors.blue}Searches:${colors.reset} ${data.searchMetadata.totalSearches || 0}`);
      if (data.searchMetadata.searchLog) {
        data.searchMetadata.searchLog.forEach((log: any) => {
          console.log(`  - ${log.tool || log.function}: ${log.resultCount || 0} results`);
        });
      }
    }
    
    if (data.sources && data.sources.length > 0) {
      console.log(`${colors.blue}Sources found:${colors.reset} ${data.sources.length}`);
      
      // Check for WooCommerce sources
      const wcSources = data.sources.filter((s: any) => 
        s.metadata?.source === 'woocommerce' || 
        s.url?.includes('woocommerce')
      );
      if (wcSources.length > 0) {
        console.log(`${colors.green}  ✓ WooCommerce sources: ${wcSources.length}${colors.reset}`);
      }
    }
    
    if (data.requiresVerification) {
      console.log(`${colors.yellow}🔐 Verification required${colors.reset}`);
    }
  }
  
  private checkSuccess(condition: boolean, successMsg: string, failMsg: string): boolean {
    if (condition) {
      console.log(`${colors.green}✅ ${successMsg}${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}❌ ${failMsg}${colors.reset}`);
      return false;
    }
  }
  
  async runTest() {
    console.log(`${colors.cyan}${colors.bright}🛒 WooCommerce E2E Chat Test - Complete User Journey${colors.reset}`);
    console.log('=' .repeat(70));
    console.log(`Session ID: ${this.sessionId}`);
    console.log(`Domain: ${this.domain}`);
    console.log('=' .repeat(70));
    
    const results = {
      steps: 0,
      passed: 0,
      failed: 0
    };
    
    try {
      // Step 1: Initial greeting and context
      this.logStep(1, 'Customer Greeting & Initial Query');
      const greeting = await this.sendMessage(
        "Hello! I'm looking for hydraulic pumps for my construction equipment. What options do you have?"
      );
      this.logResponse(greeting);
      
      results.steps++;
      if (this.checkSuccess(
        greeting.message.toLowerCase().includes('pump') || 
        greeting.message.toLowerCase().includes('hydraulic'),
        'Bot understood the pump query',
        'Bot did not understand the query'
      )) {
        results.passed++;
      } else {
        results.failed++;
      }
      
      // Step 2: Specific product search
      this.logStep(2, 'Search for Specific Brand');
      const brandSearch = await this.sendMessage(
        "Do you have any Hyva hydraulic pumps in stock?"
      );
      this.logResponse(brandSearch);
      
      results.steps++;
      const hasHyvaProducts = brandSearch.message.toLowerCase().includes('hyva') &&
                              (brandSearch.sources?.length > 0 || 
                               brandSearch.searchMetadata?.totalSearches > 0);
      
      if (this.checkSuccess(
        hasHyvaProducts,
        'Found Hyva products',
        'No Hyva products found'
      )) {
        results.passed++;
      } else {
        results.failed++;
      }
      
      // Step 3: Check product availability via WooCommerce
      this.logStep(3, 'Check WooCommerce Stock');
      const stockCheck = await this.sendMessage(
        "Can you check if any hydraulic pumps are currently in stock through your online store?"
      );
      this.logResponse(stockCheck);
      
      results.steps++;
      const usedWooCommerce = stockCheck.searchMetadata?.searchLog?.some((log: any) => 
        log.tool === 'woocommerce_agent' || 
        log.function === 'woocommerce_agent' ||
        log.source === 'woocommerce'
      );
      
      if (this.checkSuccess(
        usedWooCommerce || stockCheck.sources?.some((s: any) => s.metadata?.source === 'woocommerce'),
        'WooCommerce agent was used for stock check',
        'WooCommerce agent was not used'
      )) {
        results.passed++;
      } else {
        results.failed++;
      }
      
      // Step 4: Price inquiry
      this.logStep(4, 'Price Information Request');
      const priceQuery = await this.sendMessage(
        "What are the prices for your hydraulic pumps? Can you show me a few options with prices?"
      );
      this.logResponse(priceQuery);
      
      results.steps++;
      const hasPriceInfo = priceQuery.message.includes('£') || 
                          priceQuery.message.toLowerCase().includes('price') ||
                          priceQuery.message.toLowerCase().includes('contact');
      
      if (this.checkSuccess(
        hasPriceInfo,
        'Price information provided or contact for pricing mentioned',
        'No price information provided'
      )) {
        results.passed++;
      } else {
        results.failed++;
      }
      
      // Step 5: Add to cart (WooCommerce operation)
      this.logStep(5, 'Cart Operation');
      const cartAdd = await this.sendMessage(
        "I'd like to add a hydraulic pump to my cart. Can you help me with that?"
      );
      this.logResponse(cartAdd);
      
      results.steps++;
      const cartResponse = cartAdd.message.toLowerCase().includes('cart') ||
                          cartAdd.message.toLowerCase().includes('add') ||
                          cartAdd.message.toLowerCase().includes('shop');
      
      if (this.checkSuccess(
        cartResponse,
        'Cart operation handled',
        'Cart operation not handled'
      )) {
        results.passed++;
      } else {
        results.failed++;
      }
      
      // Step 6: Shipping information
      this.logStep(6, 'Shipping Information');
      const shipping = await this.sendMessage(
        "What are your shipping options and costs?"
      );
      this.logResponse(shipping);
      
      results.steps++;
      const hasShippingInfo = shipping.message.toLowerCase().includes('shipping') ||
                             shipping.message.toLowerCase().includes('delivery');
      
      if (this.checkSuccess(
        hasShippingInfo,
        'Shipping information provided',
        'No shipping information'
      )) {
        results.passed++;
      } else {
        results.failed++;
      }
      
      // Step 7: Order tracking (should require authentication)
      this.logStep(7, 'Order Tracking (Auth Required)');
      const orderTracking = await this.sendMessage(
        "I'd like to check on my order #12345. Where is it?"
      );
      this.logResponse(orderTracking);
      
      results.steps++;
      const requiresAuth = orderTracking.requiresVerification ||
                          orderTracking.message.toLowerCase().includes('verify') ||
                          orderTracking.message.toLowerCase().includes('email') ||
                          orderTracking.message.toLowerCase().includes('security');
      
      if (this.checkSuccess(
        requiresAuth,
        'Security verification properly requested',
        'No security verification (potential security issue)'
      )) {
        results.passed++;
      } else {
        results.failed++;
      }
      
      // Step 8: Customer service contact
      this.logStep(8, 'Customer Service Information');
      const contact = await this.sendMessage(
        "I need to speak with someone about a custom order. How can I contact you?"
      );
      this.logResponse(contact);
      
      results.steps++;
      const hasContactInfo = contact.message.toLowerCase().includes('contact') ||
                            contact.message.toLowerCase().includes('email') ||
                            contact.message.toLowerCase().includes('phone') ||
                            contact.message.toLowerCase().includes('call');
      
      if (this.checkSuccess(
        hasContactInfo,
        'Contact information provided',
        'No contact information'
      )) {
        results.passed++;
      } else {
        results.failed++;
      }
      
      // Step 9: Complex multi-part query
      this.logStep(9, 'Complex Multi-Part Query');
      const complex = await this.sendMessage(
        "I need 3 Hyva pumps, 2 OMFB valves, and want to know if you offer bulk discounts. Also, do you ship to Scotland?"
      );
      this.logResponse(complex);
      
      results.steps++;
      const handledComplex = (complex.message.toLowerCase().includes('hyva') || 
                             complex.message.toLowerCase().includes('omfb')) &&
                            complex.searchMetadata?.totalSearches > 1;
      
      if (this.checkSuccess(
        handledComplex,
        'Complex query handled with multiple searches',
        'Complex query not fully handled'
      )) {
        results.passed++;
      } else {
        results.failed++;
      }
      
      // Step 10: Thank you and closing
      this.logStep(10, 'Conversation Closing');
      const closing = await this.sendMessage(
        "Thank you for your help! I'll place my order online."
      );
      this.logResponse(closing, 200);
      
      results.steps++;
      if (this.checkSuccess(
        closing.message.length > 0,
        'Proper closing response',
        'No closing response'
      )) {
        results.passed++;
      } else {
        results.failed++;
      }
      
    } catch (error: any) {
      console.error(`${colors.red}Test failed with error: ${error.message}${colors.reset}`);
      results.failed = results.steps;
    }
    
    // Final Summary
    console.log(`\n${colors.cyan}${colors.bright}📊 E2E TEST SUMMARY${colors.reset}`);
    console.log('=' .repeat(70));
    
    const successRate = (results.passed / results.steps * 100).toFixed(1);
    const statusColor = results.passed === results.steps ? colors.green :
                       results.passed >= results.steps * 0.8 ? colors.yellow :
                       colors.red;
    
    console.log(`Total Steps: ${results.steps}`);
    console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
    console.log(`${statusColor}Success Rate: ${successRate}%${colors.reset}`);
    
    console.log(`\n${colors.cyan}Key Features Tested:${colors.reset}`);
    console.log('✓ Product search and discovery');
    console.log('✓ WooCommerce integration');
    console.log('✓ Stock checking');
    console.log('✓ Price inquiries');
    console.log('✓ Cart operations');
    console.log('✓ Order tracking (with security)');
    console.log('✓ Shipping information');
    console.log('✓ Customer service');
    console.log('✓ Complex multi-part queries');
    console.log('✓ Natural conversation flow');
    
    if (results.passed === results.steps) {
      console.log(`\n${colors.green}${colors.bright}🎉 PERFECT! All E2E tests passed!${colors.reset}`);
      console.log('The WooCommerce chat integration is working flawlessly!');
    } else if (results.passed >= results.steps * 0.8) {
      console.log(`\n${colors.yellow}${colors.bright}✅ GOOD! Most E2E tests passed.${colors.reset}`);
      console.log('The system is working well with minor issues.');
    } else {
      console.log(`\n${colors.red}${colors.bright}⚠️ NEEDS ATTENTION!${colors.reset}`);
      console.log('Several issues need to be addressed.');
    }
  }
}

// Run the test
const test = new WooCommerceE2ETest();
test.runTest().catch(console.error);