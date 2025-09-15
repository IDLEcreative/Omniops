#!/usr/bin/env npx tsx

/**
 * Comprehensive WooCommerce Chat Integration Test Suite
 * 
 * Tests all WooCommerce-specific chat agent scenarios including:
 * 1. Product Queries
 * 2. Order Management 
 * 3. Customer Account Operations
 * 4. Cart Operations
 * 5. Integration Features
 * 
 * Evaluates each area on a 1-10 scale with detailed recommendations.
 */

import { promises as fs } from 'fs';
import path from 'path';

interface TestResult {
  scenario: string;
  score: number;
  passed: number;
  failed: number;
  details: string[];
  recommendations: string[];
}

interface ChatResponse {
  message: string;
  conversation_id: string;
  sources?: Array<{ url: string; title: string; relevance: number }>;
}

class WooCommerceChatTester {
  private baseUrl: string;
  private results: TestResult[] = [];
  private conversationId: string | null = null;
  private sessionId: string;

  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.sessionId = `test-session-${Date.now()}`;
  }

  /**
   * Send a message to the chat API
   */
  private async sendChatMessage(message: string, config?: any): Promise<ChatResponse> {
    try {
      const requestBody: any = {
        message,
        session_id: this.sessionId,
        domain: 'thompsonseparts.co.uk', // Use demo domain
        config: {
          features: {
            woocommerce: { enabled: true },
            websiteScraping: { enabled: true },
            ...config?.features
          },
          ...config
        }
      };

      // Only include conversation_id if we have one
      if (this.conversationId) {
        requestBody.conversation_id = this.conversationId;
      }

      console.log(`Sending request: ${message.substring(0, 50)}...`);
      
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error ${response.status}: ${errorText}`);
        throw new Error(`Chat API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      // Store conversation ID for subsequent messages
      if (result.conversation_id && !this.conversationId) {
        this.conversationId = result.conversation_id;
      }

      console.log(`Response received: ${result.message ? result.message.substring(0, 100) : 'No message'}...`);
      return result;
      
    } catch (error) {
      console.error(`Error in sendChatMessage:`, error);
      throw error;
    }
  }

  /**
   * Test Product Queries
   */
  private async testProductQueries(): Promise<TestResult> {
    const testCases = [
      {
        name: 'Basic product availability',
        message: 'Do you have any pumps available?',
        expected: ['pump', 'available', 'product'],
        requiredFeatures: ['product_list', 'availability_info']
      },
      {
        name: 'Product recommendations',
        message: 'I need a hydraulic pump for heavy equipment, what do you recommend?',
        expected: ['hydraulic', 'pump', 'recommend', 'heavy'],
        requiredFeatures: ['recommendations', 'product_details']
      },
      {
        name: 'Product categories',
        message: 'Show me all your pump categories',
        expected: ['categor', 'pump', 'binotto', 'gear'],
        requiredFeatures: ['category_browsing', 'product_organization']
      },
      {
        name: 'Product search functionality',
        message: 'Search for Teng Tools products',
        expected: ['teng', 'tools', 'search'],
        requiredFeatures: ['product_search', 'brand_filtering']
      },
      {
        name: 'Product variations',
        message: 'What sizes are available for hydraulic hoses?',
        expected: ['size', 'variation', 'hydraulic', 'hose'],
        requiredFeatures: ['product_variations', 'size_options']
      },
      {
        name: 'Product specifications',
        message: 'What are the technical specifications for gear pumps?',
        expected: ['specification', 'technical', 'gear', 'pump'],
        requiredFeatures: ['technical_specs', 'product_details']
      },
      {
        name: 'Stock status inquiry',
        message: 'Is the Hyva gear pump in stock?',
        expected: ['hyva', 'gear', 'pump', 'stock'],
        requiredFeatures: ['inventory_status', 'real_time_stock']
      }
    ];

    const results: Array<{passed: boolean, details: string}> = [];
    
    for (const testCase of testCases) {
      try {
        console.log(`Testing: ${testCase.name}`);
        const response = await this.sendChatMessage(testCase.message);
        
        const messageLower = response.message.toLowerCase();
        const hasExpectedTerms = testCase.expected.some(term => 
          messageLower.includes(term.toLowerCase())
        );
        
        const hasProducts = response.message.includes('[') && response.message.includes('](');
        const hasCategories = messageLower.includes('categor') || messageLower.includes('browse');
        const isHelpful = messageLower.length > 50 && !messageLower.includes("i don't");
        
        const passed = hasExpectedTerms && (hasProducts || hasCategories || isHelpful);
        
        results.push({
          passed,
          details: `${testCase.name}: ${passed ? 'PASS' : 'FAIL'} - ${response.message.substring(0, 100)}...`
        });
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        results.push({
          passed: false,
          details: `${testCase.name}: ERROR - ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const score = Math.round((passed / results.length) * 10);

    return {
      scenario: 'Product Queries',
      score,
      passed,
      failed,
      details: results.map(r => r.details),
      recommendations: this.getProductQueryRecommendations(score)
    };
  }

  /**
   * Test Order Management
   */
  private async testOrderManagement(): Promise<TestResult> {
    const testCases = [
      {
        name: 'Order status tracking',
        message: 'My email is test@example.com, show me my recent orders',
        expected: ['order', 'email', 'recent', 'status'],
        requiresEmail: true
      },
      {
        name: 'Order history request',
        message: 'Can you show me my purchase history?',
        expected: ['purchase', 'history', 'order', 'email'],
        requiresVerification: true
      },
      {
        name: 'Specific order inquiry',
        message: 'Check order #12345 status',
        expected: ['order', '12345', 'status', 'check'],
        requiresOrderNumber: true
      },
      {
        name: 'Order modification request',
        message: 'I need to change the shipping address on my recent order',
        expected: ['change', 'shipping', 'address', 'order'],
        requiresVerification: true
      },
      {
        name: 'Refund request',
        message: 'I want to return an item from order #67890',
        expected: ['return', 'refund', 'order', '67890'],
        requiresOrderNumber: true
      },
      {
        name: 'Shipping status',
        message: 'When will my order arrive? My email is customer@test.com',
        expected: ['shipping', 'arrive', 'delivery', 'email'],
        requiresEmail: true
      }
    ];

    const results: Array<{passed: boolean, details: string}> = [];
    
    for (const testCase of testCases) {
      try {
        console.log(`Testing: ${testCase.name}`);
        const response = await this.sendChatMessage(testCase.message);
        
        const messageLower = response.message.toLowerCase();
        
        // Check for appropriate verification prompts
        const hasVerificationPrompt = messageLower.includes('email') || 
                                    messageLower.includes('order number') ||
                                    messageLower.includes('verify');
        
        const providesHelpfulResponse = messageLower.includes('help') ||
                                      messageLower.includes('look') ||
                                      messageLower.includes('find');
        
        // For WooCommerce integration, we expect the agent to handle customer queries appropriately
        const isAppropriateResponse = hasVerificationPrompt && providesHelpfulResponse;
        
        results.push({
          passed: isAppropriateResponse,
          details: `${testCase.name}: ${isAppropriateResponse ? 'PASS' : 'FAIL'} - ${response.message.substring(0, 100)}...`
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        results.push({
          passed: false,
          details: `${testCase.name}: ERROR - ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const score = Math.round((passed / results.length) * 10);

    return {
      scenario: 'Order Management',
      score,
      passed,
      failed,
      details: results.map(r => r.details),
      recommendations: this.getOrderManagementRecommendations(score)
    };
  }

  /**
   * Test Customer Account Operations
   */
  private async testCustomerAccount(): Promise<TestResult> {
    const testCases = [
      {
        name: 'Account details request',
        message: 'Show me my account information',
        expected: ['account', 'information', 'details'],
        requiresAuth: true
      },
      {
        name: 'Purchase history',
        message: 'What have I bought from you before?',
        expected: ['bought', 'purchase', 'history', 'before'],
        requiresAuth: true
      },
      {
        name: 'Loyalty status check',
        message: 'What is my customer loyalty status?',
        expected: ['loyalty', 'status', 'customer'],
        requiresAuth: true
      },
      {
        name: 'Password reset request',
        message: 'I forgot my password, can you help?',
        expected: ['password', 'forgot', 'reset', 'help'],
        supportFunction: true
      },
      {
        name: 'Customer data verification',
        message: 'Verify my account with email john.doe@example.com',
        expected: ['verify', 'account', 'email'],
        requiresEmail: true
      }
    ];

    const results: Array<{passed: boolean, details: string}> = [];
    
    for (const testCase of testCases) {
      try {
        console.log(`Testing: ${testCase.name}`);
        const response = await this.sendChatMessage(testCase.message);
        
        const messageLower = response.message.toLowerCase();
        
        // For customer account operations, expect appropriate security/verification responses
        const hasSecurityAwareness = messageLower.includes('email') ||
                                   messageLower.includes('verify') ||
                                   messageLower.includes('security') ||
                                   messageLower.includes('privacy');
        
        const providesGuidance = messageLower.includes('help') ||
                               messageLower.includes('contact') ||
                               messageLower.includes('support');
        
        const isAppropriate = hasSecurityAwareness && providesGuidance;
        
        results.push({
          passed: isAppropriate,
          details: `${testCase.name}: ${isAppropriate ? 'PASS' : 'FAIL'} - ${response.message.substring(0, 100)}...`
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        results.push({
          passed: false,
          details: `${testCase.name}: ERROR - ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const score = Math.round((passed / results.length) * 10);

    return {
      scenario: 'Customer Account',
      score,
      passed,
      failed,
      details: results.map(r => r.details),
      recommendations: this.getCustomerAccountRecommendations(score)
    };
  }

  /**
   * Test Cart Operations
   */
  private async testCartOperations(): Promise<TestResult> {
    const testCases = [
      {
        name: 'Abandoned cart inquiry',
        message: 'I left some items in my cart yesterday, can you help me find them?',
        expected: ['cart', 'items', 'yesterday', 'find'],
        requiresAuth: true
      },
      {
        name: 'Cart recovery',
        message: 'I want to complete my previous order that I didn\'t finish',
        expected: ['complete', 'previous', 'order', 'finish'],
        requiresAuth: true
      },
      {
        name: 'Add to cart functionality',
        message: 'How do I add the Hyva pump to my cart?',
        expected: ['add', 'cart', 'hyva', 'pump'],
        instructional: true
      },
      {
        name: 'Cart contents check',
        message: 'What\'s currently in my shopping cart?',
        expected: ['cart', 'shopping', 'currently'],
        requiresAuth: true
      },
      {
        name: 'Discount code application',
        message: 'Do you have any discount codes I can use?',
        expected: ['discount', 'code', 'coupon'],
        promotionalQuery: true
      }
    ];

    const results: Array<{passed: boolean, details: string}> = [];
    
    for (const testCase of testCases) {
      try {
        console.log(`Testing: ${testCase.name}`);
        const response = await this.sendChatMessage(testCase.message);
        
        const messageLower = response.message.toLowerCase();
        
        // Check for appropriate cart-related responses
        const hasCartAwareness = messageLower.includes('cart') ||
                               messageLower.includes('shopping') ||
                               messageLower.includes('checkout');
        
        const providesCartHelp = messageLower.includes('help') ||
                               messageLower.includes('find') ||
                               messageLower.includes('recover') ||
                               messageLower.includes('add');
        
        const isHelpful = hasCartAwareness || providesCartHelp || messageLower.length > 50;
        
        results.push({
          passed: isHelpful,
          details: `${testCase.name}: ${isHelpful ? 'PASS' : 'FAIL'} - ${response.message.substring(0, 100)}...`
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        results.push({
          passed: false,
          details: `${testCase.name}: ERROR - ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const score = Math.round((passed / results.length) * 10);

    return {
      scenario: 'Cart Operations',
      score,
      passed,
      failed,
      details: results.map(r => r.details),
      recommendations: this.getCartOperationsRecommendations(score)
    };
  }

  /**
   * Test Integration Features
   */
  private async testIntegrationFeatures(): Promise<TestResult> {
    const testCases = [
      {
        name: 'Real-time inventory sync',
        message: 'Is the Binotto gear pump currently available for immediate shipping?',
        expected: ['binotto', 'gear', 'pump', 'available', 'shipping'],
        realTimeData: true
      },
      {
        name: 'Price updates',
        message: 'What\'s the current price for hydraulic pumps?',
        expected: ['price', 'current', 'hydraulic', 'pump'],
        pricingQuery: true
      },
      {
        name: 'Category browsing',
        message: 'Show me all products in the hydraulic equipment category',
        expected: ['products', 'hydraulic', 'equipment', 'category'],
        categoryBrowsing: true
      },
      {
        name: 'Search filters',
        message: 'Find all pumps under £500 that are in stock',
        expected: ['pump', '£', '500', 'stock'],
        searchFiltering: true
      },
      {
        name: 'Product recommendations based on purchase history',
        message: 'Based on my previous purchases, what would you recommend?',
        expected: ['previous', 'purchase', 'recommend', 'based'],
        personalizedRecs: true
      }
    ];

    const results: Array<{passed: boolean, details: string}> = [];
    
    for (const testCase of testCases) {
      try {
        console.log(`Testing: ${testCase.name}`);
        const response = await this.sendChatMessage(testCase.message);
        
        const messageLower = response.message.toLowerCase();
        
        // Check for integration-related features
        const hasProductInfo = response.message.includes('[') && response.message.includes('](');
        const hasCategoryInfo = messageLower.includes('category') || messageLower.includes('browse');
        const hasFilteredResults = messageLower.includes('price') || messageLower.includes('stock');
        const providesRecommendations = messageLower.includes('recommend') || hasProductInfo;
        
        const showsIntegration = hasProductInfo || hasCategoryInfo || hasFilteredResults || providesRecommendations;
        
        results.push({
          passed: showsIntegration,
          details: `${testCase.name}: ${showsIntegration ? 'PASS' : 'FAIL'} - ${response.message.substring(0, 100)}...`
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        results.push({
          passed: false,
          details: `${testCase.name}: ERROR - ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const score = Math.round((passed / results.length) * 10);

    return {
      scenario: 'Integration Features',
      score,
      passed,
      failed,
      details: results.map(r => r.details),
      recommendations: this.getIntegrationFeaturesRecommendations(score)
    };
  }

  /**
   * Get recommendations for Product Queries
   */
  private getProductQueryRecommendations(score: number): string[] {
    if (score >= 8) {
      return [
        'Excellent product query handling',
        'Consider adding more detailed product specifications',
        'Implement product comparison features'
      ];
    } else if (score >= 6) {
      return [
        'Good basic product query support',
        'Improve product search accuracy',
        'Add more product category organization',
        'Enhance product recommendation engine'
      ];
    } else {
      return [
        'Product query handling needs significant improvement',
        'Implement proper product search functionality',
        'Add comprehensive product catalog integration',
        'Improve product availability information',
        'Add product variation support'
      ];
    }
  }

  /**
   * Get recommendations for Order Management
   */
  private getOrderManagementRecommendations(score: number): string[] {
    if (score >= 8) {
      return [
        'Strong order management capabilities',
        'Consider adding real-time order tracking',
        'Implement order modification workflows'
      ];
    } else if (score >= 6) {
      return [
        'Adequate order management basics',
        'Improve customer verification process',
        'Add more detailed order status information',
        'Implement order modification capabilities'
      ];
    } else {
      return [
        'Order management needs major improvements',
        'Implement proper customer verification',
        'Add comprehensive order lookup functionality',
        'Integrate with shipping tracking systems',
        'Add order modification and refund capabilities'
      ];
    }
  }

  /**
   * Get recommendations for Customer Account
   */
  private getCustomerAccountRecommendations(score: number): string[] {
    if (score >= 8) {
      return [
        'Excellent customer account security',
        'Add loyalty program integration',
        'Implement self-service account management'
      ];
    } else if (score >= 6) {
      return [
        'Good security awareness',
        'Improve customer data access controls',
        'Add more account management features',
        'Implement better verification methods'
      ];
    } else {
      return [
        'Customer account handling needs improvement',
        'Implement proper security protocols',
        'Add customer verification systems',
        'Integrate with customer loyalty programs',
        'Add self-service capabilities'
      ];
    }
  }

  /**
   * Get recommendations for Cart Operations
   */
  private getCartOperationsRecommendations(score: number): string[] {
    if (score >= 8) {
      return [
        'Good cart operation support',
        'Add automated cart recovery campaigns',
        'Implement smart discount suggestions'
      ];
    } else if (score >= 6) {
      return [
        'Basic cart operations working',
        'Improve abandoned cart recovery',
        'Add better cart management features',
        'Implement discount code system'
      ];
    } else {
      return [
        'Cart operations need significant work',
        'Implement abandoned cart tracking',
        'Add cart recovery functionality',
        'Integrate discount code system',
        'Add cart management features'
      ];
    }
  }

  /**
   * Get recommendations for Integration Features
   */
  private getIntegrationFeaturesRecommendations(score: number): string[] {
    if (score >= 8) {
      return [
        'Excellent WooCommerce integration',
        'Add advanced filtering options',
        'Implement personalized recommendations'
      ];
    } else if (score >= 6) {
      return [
        'Good basic integration features',
        'Improve real-time data synchronization',
        'Add more advanced search filters',
        'Enhance recommendation engine'
      ];
    } else {
      return [
        'Integration features need major improvements',
        'Implement real-time inventory sync',
        'Add comprehensive search and filtering',
        'Integrate pricing and availability data',
        'Add personalized recommendation engine'
      ];
    }
  }

  /**
   * Run all tests and generate report
   */
  public async runAllTests(): Promise<void> {
    console.log('🚀 Starting WooCommerce Chat Integration Tests...\n');

    try {
      // Test each scenario
      console.log('📦 Testing Product Queries...');
      this.results.push(await this.testProductQueries());

      console.log('📋 Testing Order Management...');
      this.results.push(await this.testOrderManagement());

      console.log('👤 Testing Customer Account Operations...');
      this.results.push(await this.testCustomerAccount());

      console.log('🛒 Testing Cart Operations...');
      this.results.push(await this.testCartOperations());

      console.log('🔗 Testing Integration Features...');
      this.results.push(await this.testIntegrationFeatures());

      // Generate final report
      await this.generateReport();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive test report
   */
  private async generateReport(): Promise<void> {
    const overallScore = this.results.reduce((sum, result) => sum + result.score, 0) / this.results.length;
    const totalPassed = this.results.reduce((sum, result) => sum + result.passed, 0);
    const totalFailed = this.results.reduce((sum, result) => sum + result.failed, 0);

    const report = `
# WooCommerce Chat Integration Test Report
Generated: ${new Date().toISOString()}

## Executive Summary
- **Overall Score**: ${overallScore.toFixed(1)}/10
- **Total Tests**: ${totalPassed + totalFailed}
- **Passed**: ${totalPassed}
- **Failed**: ${totalFailed}
- **Success Rate**: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%

## Detailed Results

${this.results.map(result => `
### ${result.scenario}
- **Score**: ${result.score}/10
- **Tests Passed**: ${result.passed}
- **Tests Failed**: ${result.failed}

#### Test Details:
${result.details.map(detail => `- ${detail}`).join('\n')}

#### Recommendations:
${result.recommendations.map(rec => `- ${rec}`).join('\n')}
`).join('\n')}

## Overall Recommendations

### High Priority
${overallScore < 6 ? `
- **CRITICAL**: WooCommerce integration needs major improvements
- Implement proper customer verification systems
- Add comprehensive product catalog integration
- Fix order management workflows
` : overallScore < 8 ? `
- Improve real-time data synchronization
- Enhance customer verification processes
- Add advanced search and filtering capabilities
- Implement abandoned cart recovery
` : `
- Fine-tune recommendation algorithms
- Add advanced personalization features
- Implement comprehensive analytics
- Optimize performance and response times
`}

### Technical Improvements
- Implement proper error handling for WooCommerce API calls
- Add comprehensive logging for integration debugging
- Implement caching strategies for better performance
- Add unit tests for WooCommerce integration functions

### User Experience
- Improve response formatting and clarity
- Add interactive elements where appropriate
- Implement proactive suggestions
- Add multilingual support for international customers

---
*Test completed on ${new Date().toLocaleDateString()}*
`;

    // Save report to file
    const reportPath = path.join(process.cwd(), 'woocommerce-chat-test-report.md');
    await fs.writeFile(reportPath, report);
    
    // Print summary to console
    console.log('\n' + '='.repeat(60));
    console.log('🎯 WOOCOMMERCE CHAT INTEGRATION TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`📊 Overall Score: ${overallScore.toFixed(1)}/10`);
    console.log(`✅ Tests Passed: ${totalPassed}`);
    console.log(`❌ Tests Failed: ${totalFailed}`);
    console.log(`📈 Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
    console.log('\n📝 Detailed report saved to:', reportPath);
    
    // Print individual scores
    console.log('\n📋 Individual Scores:');
    this.results.forEach(result => {
      const emoji = result.score >= 8 ? '🟢' : result.score >= 6 ? '🟡' : '🔴';
      console.log(`${emoji} ${result.scenario}: ${result.score}/10`);
    });
    
    console.log('\n🚀 Test completed successfully!');
  }
}

// Main execution
if (require.main === module) {
  const tester = new WooCommerceChatTester();
  tester.runAllTests().catch(console.error);
}

export { WooCommerceChatTester };