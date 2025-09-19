#!/usr/bin/env npx tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
config();

interface TestQuery {
  id: string;
  category: string;
  query: string;
  expectedBehavior: {
    shouldFindProducts: boolean;
    minProductCount?: number;
    maxProductCount?: number;
    shouldAskClarification?: boolean;
    keyTermsToInclude?: string[];
    keyTermsToAvoid?: string[];
  };
  description: string;
}

interface TestResult {
  queryId: string;
  query: string;
  category: string;
  passed: boolean;
  response: string;
  searchMetadata?: any;
  sources?: any[];
  metrics: {
    foundProducts: boolean;
    productCount: number;
    askedClarification: boolean;
    includedKeyTerms: string[];
    avoidedForbiddenTerms: boolean;
    responseQuality: 'excellent' | 'good' | 'acceptable' | 'poor';
    customerServiceScore: number;
  };
  errors: string[];
}

interface DynamicTestData {
  realSKU: string;
  realProductName: string;
  popularBrand: string;
  productCategory: string;
  productType: string;
  fakeSKU: string;
}

class DynamicAgentAccuracyTester {
  private domain = 'thompsonseparts.co.uk';
  private apiUrl = 'http://localhost:3000/api/chat';
  private testResults: TestResult[] = [];
  private testData: DynamicTestData | null = null;
  private supabase: any;

  constructor() {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async discoverTestData(): Promise<DynamicTestData> {
    console.log('\n🔍 Discovering products from database for testing...\n');

    try {
      // Find a real SKU from structured extractions
      const { data: skuData } = await this.supabase
        .from('structured_extractions')
        .select('content')
        .eq('extraction_type', 'product')
        .like('content', '%"sku":%')
        .limit(10);

      let realSKU = 'TEST-SKU-001';
      let realProductName = 'Test Product';
      
      if (skuData && skuData.length > 0) {
        for (const item of skuData) {
          try {
            const parsed = typeof item.content === 'string' ? JSON.parse(item.content) : item.content;
            if (parsed.sku && parsed.name) {
              realSKU = parsed.sku;
              realProductName = parsed.name;
              console.log(`✓ Found real SKU: ${realSKU}`);
              console.log(`✓ Product name: ${realProductName}`);
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }

      // Find a popular brand by counting occurrences
      const { data: brandData } = await this.supabase
        .from('page_embeddings')
        .select('content')
        .limit(100);

      const brandCounts: Record<string, number> = {};
      const brandPatterns = [
        /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:products?|parts?|equipment)\b/g,
        /\bfor\s+([A-Z][a-z]+)\s+(?:mixers?|pumps?|trucks?)\b/g
      ];

      if (brandData) {
        for (const item of brandData) {
          const content = item.content || '';
          for (const pattern of brandPatterns) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
              const brand = match[1];
              if (brand && brand.length > 3 && brand.length < 20) {
                brandCounts[brand] = (brandCounts[brand] || 0) + 1;
              }
            }
          }
        }
      }

      const popularBrand = Object.entries(brandCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Equipment';
      
      console.log(`✓ Popular brand found: ${popularBrand}`);

      // Find product categories
      const { data: categoryData } = await this.supabase
        .from('website_content')
        .select('title, content')
        .or('title.ilike.%pump%,title.ilike.%valve%,title.ilike.%safety%,title.ilike.%hydraulic%,title.ilike.%filter%')
        .limit(50);

      let productCategory = 'equipment';
      let productType = 'parts';

      if (categoryData && categoryData.length > 0) {
        // Extract common product types from titles
        const productTypes = new Set<string>();
        for (const item of categoryData) {
          const title = (item.title || '').toLowerCase();
          if (title.includes('pump')) productTypes.add('pump');
          if (title.includes('valve')) productTypes.add('valve');
          if (title.includes('filter')) productTypes.add('filter');
          if (title.includes('safety')) productTypes.add('safety equipment');
          if (title.includes('hydraulic')) productTypes.add('hydraulic parts');
        }
        
        const types = Array.from(productTypes);
        if (types.length > 0) {
          productType = types[0];
          productCategory = types.length > 1 ? types[1] : types[0];
        }
      }

      console.log(`✓ Product category: ${productCategory}`);
      console.log(`✓ Product type: ${productType}`);

      // Generate a fake SKU that doesn't exist
      const fakeSKU = `FAKE-${Date.now()}-XYZ`;
      console.log(`✓ Generated fake SKU for testing: ${fakeSKU}`);

      this.testData = {
        realSKU,
        realProductName,
        popularBrand,
        productCategory,
        productType,
        fakeSKU
      };

      return this.testData;

    } catch (error) {
      console.error('Error discovering test data:', error);
      // Fallback to generic test data
      this.testData = {
        realSKU: 'GENERIC-001',
        realProductName: 'Generic Product',
        popularBrand: 'Brand',
        productCategory: 'parts',
        productType: 'equipment',
        fakeSKU: `NONEXIST-${Date.now()}`
      };
      return this.testData;
    }
  }

  generateDynamicTestQueries(): TestQuery[] {
    if (!this.testData) {
      throw new Error('Test data not discovered. Run discoverTestData() first.');
    }

    const { realSKU, realProductName, popularBrand, productCategory, productType, fakeSKU } = this.testData;

    return [
      // Single Product Queries
      {
        id: 'single-1',
        category: 'Single Product - Real SKU',
        query: `Do you have ${realSKU}?`,
        expectedBehavior: {
          shouldFindProducts: true,
          minProductCount: 1,
          maxProductCount: 5,
          keyTermsToInclude: [realSKU.split('-')[0]], // Use part of SKU
        },
        description: 'Testing real SKU lookup from database'
      },
      {
        id: 'single-2',
        category: 'Single Product - Real Product Name',
        query: `Tell me about the ${realProductName}`,
        expectedBehavior: {
          shouldFindProducts: true,
          minProductCount: 1,
          maxProductCount: 10,
          keyTermsToInclude: realProductName.split(' ').filter(w => w.length > 3),
        },
        description: 'Testing real product name lookup'
      },
      
      // Brand Queries (if brand found)
      ...(popularBrand !== 'Equipment' ? [{
        id: 'brand-1',
        category: 'Brand Search',
        query: `What ${popularBrand} products do you have?`,
        expectedBehavior: {
          shouldFindProducts: true,
          minProductCount: 1,
          maxProductCount: 20,
          keyTermsToInclude: [popularBrand],
          keyTermsToAvoid: ['all', 'every', 'complete list'],
        },
        description: 'Testing brand-wide product search'
      }] : []),

      // Category Queries
      {
        id: 'category-1',
        category: 'Category Search',
        query: `What ${productCategory} are available?`,
        expectedBehavior: {
          shouldFindProducts: true,
          minProductCount: 1,
          maxProductCount: 20,
          keyTermsToInclude: productCategory.split(' '),
        },
        description: 'Testing category-based search'
      },
      {
        id: 'category-2',
        category: 'Product Type Search',
        query: `Show me your ${productType}`,
        expectedBehavior: {
          shouldFindProducts: true,
          minProductCount: 1,
          maxProductCount: 20,
          keyTermsToInclude: productType.split(' '),
        },
        description: 'Testing product type search'
      },

      // Vague Queries
      {
        id: 'vague-1',
        category: 'Vague Request',
        query: `I need some ${productType.split(' ')[0]} parts`,
        expectedBehavior: {
          shouldFindProducts: true,
          shouldAskClarification: true,
          minProductCount: 1,
          keyTermsToInclude: [productType.split(' ')[0]],
        },
        description: 'Testing vague request handling'
      },
      {
        id: 'vague-2',
        category: 'Very Vague Request',
        query: 'Looking for spare parts',
        expectedBehavior: {
          shouldFindProducts: false,
          shouldAskClarification: true,
          keyTermsToInclude: ['specific', 'help', 'what', 'type'],
        },
        description: 'Testing very vague request'
      },

      // Complex Multi-Product Queries
      {
        id: 'multi-1',
        category: 'Multiple Products',
        query: `I need a ${productType} and some filters`,
        expectedBehavior: {
          shouldFindProducts: true,
          minProductCount: 1,
          keyTermsToInclude: [productType.split(' ')[0]],
        },
        description: 'Testing multiple product request'
      },

      // Edge Cases
      {
        id: 'edge-1',
        category: 'Non-existent Product',
        query: `Do you have the ${fakeSKU} super deluxe model?`,
        expectedBehavior: {
          shouldFindProducts: false,
          keyTermsToInclude: ['sorry', 'not', 'alternative', 'help'],
        },
        description: 'Testing non-existent product handling'
      },
      {
        id: 'edge-2',
        category: 'Typo in Query',
        query: `Looking for ${productType.replace('a', 'e')} items`, // Simple typo
        expectedBehavior: {
          shouldFindProducts: true,
          minProductCount: 1,
          keyTermsToInclude: productType.split(' '),
        },
        description: 'Testing typo correction'
      },

      // Customer Service Quality
      {
        id: 'service-1',
        category: 'Price Inquiry',
        query: `How much does the ${realProductName} cost?`,
        expectedBehavior: {
          shouldFindProducts: true,
          keyTermsToInclude: ['price', '£', 'cost', 'contact'],
        },
        description: 'Testing price inquiry response'
      },
      {
        id: 'service-2',
        category: 'Availability Check',
        query: `Is the ${realProductName} in stock?`,
        expectedBehavior: {
          shouldFindProducts: true,
          keyTermsToInclude: ['stock', 'available', 'contact'],
        },
        description: 'Testing stock availability query'
      },

      // Count Queries
      {
        id: 'count-1',
        category: 'Count Query',
        query: `How many types of ${productCategory} do you have?`,
        expectedBehavior: {
          shouldFindProducts: true,
          minProductCount: 1,
          keyTermsToInclude: ['many', 'types', 'variety', 'range'],
        },
        description: 'Testing count/quantity queries'
      },

      // Search Limit Testing
      {
        id: 'limit-1',
        category: 'Broad Search',
        query: 'Show me all your products',
        expectedBehavior: {
          shouldFindProducts: true,
          minProductCount: 10,
          maxProductCount: 50,
          keyTermsToAvoid: ['all', 'every', 'complete catalog'],
        },
        description: 'Testing how agent handles "all" requests'
      },
    ];
  }

  async testQuery(testQuery: TestQuery): Promise<TestResult> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${testQuery.category}`);
    console.log(`Query: "${testQuery.query}"`);
    console.log(`Description: ${testQuery.description}`);
    console.log(`${'='.repeat(60)}`);

    const startTime = Date.now();
    const errors: string[] = [];
    
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testQuery.query,
          session_id: `test-accuracy-${Date.now()}`,
          domain: this.domain,
          config: {
            features: {
              woocommerce: { enabled: true },
              websiteScraping: { enabled: true }
            }
          }
        })
      });

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      if (data.error) {
        errors.push(`API Error: ${data.error}`);
        return this.createFailedResult(testQuery, errors.join(', '));
      }

      const metrics = this.analyzeResponse(
        data.message,
        data.searchMetadata,
        data.sources,
        testQuery.expectedBehavior
      );

      // Determine if test passed
      const passed = this.evaluateTestSuccess(metrics, testQuery.expectedBehavior, errors);

      const result: TestResult = {
        queryId: testQuery.id,
        query: testQuery.query,
        category: testQuery.category,
        passed,
        response: data.message,
        searchMetadata: data.searchMetadata,
        sources: data.sources,
        metrics,
        errors
      };

      // Log summary
      console.log('\n📊 Test Results:');
      console.log(`   ✓ Response Time: ${responseTime}ms`);
      console.log(`   ✓ Found Products: ${metrics.foundProducts} (${metrics.productCount} items)`);
      console.log(`   ✓ Asked Clarification: ${metrics.askedClarification}`);
      console.log(`   ✓ Response Quality: ${metrics.responseQuality}`);
      console.log(`   ✓ Customer Service Score: ${metrics.customerServiceScore}/100`);
      console.log(`   ${passed ? '✅ PASSED' : '❌ FAILED'}`);
      
      if (errors.length > 0) {
        console.log(`   ⚠️  Issues: ${errors.join(', ')}`);
      }

      return result;

    } catch (error) {
      console.error('Test execution error:', error);
      errors.push(`Execution error: ${error.message}`);
      return this.createFailedResult(testQuery, errors.join(', '));
    }
  }

  private analyzeResponse(
    response: string,
    searchMetadata: any,
    sources: any[],
    expectedBehavior: TestQuery['expectedBehavior']
  ): TestResult['metrics'] {
    const lowerResponse = response.toLowerCase();

    // Check if products were found (improved logic)
    const foundProducts = this.detectProducts(response, sources);
    const productCount = this.countProducts(response, searchMetadata, sources);

    // Check for clarification questions
    const askedClarification = this.detectClarificationQuestions(response);

    // Check key terms
    const includedKeyTerms: string[] = [];
    if (expectedBehavior.keyTermsToInclude) {
      for (const term of expectedBehavior.keyTermsToInclude) {
        if (term && lowerResponse.includes(term.toLowerCase())) {
          includedKeyTerms.push(term);
        }
      }
    }

    // Check forbidden terms
    let avoidedForbiddenTerms = true;
    if (expectedBehavior.keyTermsToAvoid) {
      for (const term of expectedBehavior.keyTermsToAvoid) {
        if (lowerResponse.includes(term.toLowerCase())) {
          avoidedForbiddenTerms = false;
          break;
        }
      }
    }

    // Evaluate response quality
    const responseQuality = this.evaluateResponseQuality(response, foundProducts, productCount);
    
    // Calculate customer service score
    const customerServiceScore = this.calculateCustomerServiceScore(
      response,
      foundProducts,
      askedClarification,
      responseQuality
    );

    return {
      foundProducts,
      productCount,
      askedClarification,
      includedKeyTerms,
      avoidedForbiddenTerms,
      responseQuality,
      customerServiceScore
    };
  }

  private detectProducts(response: string, sources: any[]): boolean {
    // Improved detection that considers context
    const negativeIndicators = [
      /don't have/i,
      /currently don't/i,
      /not available/i,
      /not in.*inventory/i,
      /couldn't find/i,
      /unable to find/i,
      /doesn't exist/i,
      /no results/i
    ];

    // Check for negative language about products
    const hasNegativeContext = negativeIndicators.some(pattern => pattern.test(response));
    
    // If sources exist and response doesn't have negative context, products found
    if (sources && sources.length > 0 && !hasNegativeContext) {
      return true;
    }

    // Check for positive product indicators only if no negative context
    if (!hasNegativeContext) {
      const productIndicators = [
        /\bwe have\b/i,
        /\bavailable\b/i,
        /\bin stock\b/i,
        /\bcarry\b/i,
        /\boffer\b/i,
        /£\d+/g,
      ];

      return productIndicators.some(indicator => indicator.test(response));
    }

    return false;
  }

  private countProducts(response: string, searchMetadata: any, sources: any[]): number {
    // Try to get count from search metadata
    if (searchMetadata?.searchLog) {
      const totalResults = searchMetadata.searchLog.reduce(
        (sum: number, log: any) => sum + (log.resultCount || 0),
        0
      );
      if (totalResults > 0) return totalResults;
    }

    // Fallback to source count
    return sources?.length || 0;
  }

  private detectClarificationQuestions(response: string): boolean {
    const clarificationPatterns = [
      /\bwhich\b.*\?/i,
      /\bwhat\s+(type|kind|model|size)\b.*\?/i,
      /\bcan you\s+(tell|provide|specify)\b/i,
      /\bdo you\s+(know|have)\s+.*\?/i,
      /\bmore\s+(specific|details|information)\b/i,
      /\bhelp\s+you\s+find\b/i,
      /\bnarrow\s+down\b/i,
    ];

    for (const pattern of clarificationPatterns) {
      if (pattern.test(response)) {
        return true;
      }
    }
    return false;
  }

  private evaluateResponseQuality(
    response: string,
    foundProducts: boolean,
    productCount: number
  ): TestResult['metrics']['responseQuality'] {
    const factors = {
      hasGreeting: /\b(hello|hi|thank you|thanks)\b/i.test(response),
      isProfessional: !/\b(dunno|idk|whatever|lol)\b/i.test(response),
      isHelpful: /\b(help|assist|show|provide|offer|available)\b/i.test(response),
      hasStructure: response.includes('\n') || response.includes('•') || response.includes('-'),
      appropriateLength: response.length > 50 && response.length < 2000,
      notOverwhelming: productCount <= 20 || response.includes('popular') || response.includes('selection'),
    };

    const score = Object.values(factors).filter(Boolean).length;
    
    if (score >= 5) return 'excellent';
    if (score >= 4) return 'good';
    if (score >= 2) return 'acceptable';
    return 'poor';
  }

  private calculateCustomerServiceScore(
    response: string,
    foundProducts: boolean,
    askedClarification: boolean,
    responseQuality: string
  ): number {
    let score = 0;

    // Base score from response quality
    const qualityScores = {
      excellent: 40,
      good: 30,
      acceptable: 20,
      poor: 10
    };
    score += qualityScores[responseQuality];

    // Product handling (20 points)
    if (foundProducts) {
      score += 20;
    } else if (askedClarification) {
      score += 15; // Still helpful even without products
    }

    // Professional tone (15 points)
    if (!/\b(all|every|complete|entire)\s+(catalog|inventory|stock)\b/i.test(response)) {
      score += 15; // Avoided overwhelming response
    }

    // Helpfulness indicators (15 points)
    const helpfulPhrases = [
      /\blet me\b/i,
      /\bi can help\b/i,
      /\bhere (are|is)\b/i,
      /\bwe (have|offer|carry)\b/i,
      /\bpopular\b/i,
      /\bselection\b/i,
    ];
    const helpfulCount = helpfulPhrases.filter(p => p.test(response)).length;
    score += Math.min(15, helpfulCount * 5);

    // Natural conversation (10 points)
    if (response.length > 100 && !response.includes('I found exactly')) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  private evaluateTestSuccess(
    metrics: TestResult['metrics'],
    expectedBehavior: TestQuery['expectedBehavior'],
    errors: string[]
  ): boolean {
    // Check product finding expectations
    if (expectedBehavior.shouldFindProducts !== undefined) {
      if (expectedBehavior.shouldFindProducts !== metrics.foundProducts) {
        errors.push(`Expected to ${expectedBehavior.shouldFindProducts ? 'find' : 'not find'} products`);
        return false;
      }
    }

    // Check product count range
    if (expectedBehavior.minProductCount !== undefined && metrics.productCount < expectedBehavior.minProductCount) {
      errors.push(`Found ${metrics.productCount} products, expected at least ${expectedBehavior.minProductCount}`);
      return false;
    }
    if (expectedBehavior.maxProductCount !== undefined && metrics.productCount > expectedBehavior.maxProductCount) {
      errors.push(`Found ${metrics.productCount} products, expected at most ${expectedBehavior.maxProductCount}`);
      return false;
    }

    // Check clarification expectations (warning only)
    if (expectedBehavior.shouldAskClarification === true && !metrics.askedClarification) {
      errors.push('Expected clarification question but none found');
    }

    // Check key terms (flexible matching)
    if (expectedBehavior.keyTermsToInclude) {
      const missingTerms = expectedBehavior.keyTermsToInclude.filter(
        term => term && !metrics.includedKeyTerms.includes(term)
      );
      // Only fail if more than half the terms are missing
      if (missingTerms.length > expectedBehavior.keyTermsToInclude.length / 2) {
        errors.push(`Missing key terms: ${missingTerms.join(', ')}`);
        return false;
      }
    }

    // Check forbidden terms
    if (!metrics.avoidedForbiddenTerms) {
      errors.push('Response contained forbidden terms');
      return false;
    }

    // Check minimum quality standards
    if (metrics.responseQuality === 'poor') {
      errors.push('Response quality is poor');
      return false;
    }

    if (metrics.customerServiceScore < 40) {
      errors.push(`Customer service score too low: ${metrics.customerServiceScore}/100`);
      return false;
    }

    return true;
  }

  private createFailedResult(testQuery: TestQuery, error: string): TestResult {
    return {
      queryId: testQuery.id,
      query: testQuery.query,
      category: testQuery.category,
      passed: false,
      response: '',
      metrics: {
        foundProducts: false,
        productCount: 0,
        askedClarification: false,
        includedKeyTerms: [],
        avoidedForbiddenTerms: false,
        responseQuality: 'poor',
        customerServiceScore: 0
      },
      errors: [error]
    };
  }

  async runAllTests(): Promise<void> {
    console.log('\n🚀 Starting Dynamic Agent Accuracy Testing Suite');
    console.log(`📅 Date: ${new Date().toISOString()}`);
    console.log(`🌐 Domain: ${this.domain}`);
    
    // Discover test data from database
    await this.discoverTestData();
    
    // Generate dynamic test queries
    const testQueries = this.generateDynamicTestQueries();
    
    console.log(`📊 Total Test Cases: ${testQueries.length}`);
    console.log('\n' + '='.repeat(60));

    // Run tests sequentially to avoid rate limiting
    for (const testQuery of testQueries) {
      const result = await this.testQuery(testQuery);
      this.testResults.push(result);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Generate summary report
    this.generateReport();
  }

  private generateReport(): void {
    console.log('\n\n' + '='.repeat(80));
    console.log('📈 DYNAMIC AGENT ACCURACY TEST REPORT');
    console.log('='.repeat(80));

    // Overall statistics
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const passRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log('\n📊 Overall Results:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${passedTests}`);
    console.log(`   ❌ Failed: ${failedTests}`);
    console.log(`   📈 Pass Rate: ${passRate}%`);

    // Test Data Used
    if (this.testData) {
      console.log('\n🔍 Dynamic Test Data Used:');
      console.log(`   Real SKU: ${this.testData.realSKU}`);
      console.log(`   Product: ${this.testData.realProductName}`);
      console.log(`   Brand: ${this.testData.popularBrand}`);
      console.log(`   Category: ${this.testData.productCategory}`);
      console.log(`   Type: ${this.testData.productType}`);
    }

    // Category breakdown
    console.log('\n📂 Results by Category:');
    const categories = [...new Set(this.testResults.map(r => r.category.split(' - ')[0]))];
    
    for (const category of categories) {
      const categoryResults = this.testResults.filter(r => r.category.startsWith(category));
      const categoryPassed = categoryResults.filter(r => r.passed).length;
      const categoryTotal = categoryResults.length;
      const categoryPassRate = ((categoryPassed / categoryTotal) * 100).toFixed(1);
      
      console.log(`\n   ${category}:`);
      console.log(`      Tests: ${categoryTotal}`);
      console.log(`      Passed: ${categoryPassed}/${categoryTotal} (${categoryPassRate}%)`);
      
      // Show failed tests in this category
      const failedInCategory = categoryResults.filter(r => !r.passed);
      if (failedInCategory.length > 0) {
        console.log(`      Failed Tests:`);
        for (const failed of failedInCategory) {
          console.log(`         - ${failed.query.substring(0, 50)}...`);
          if (failed.errors.length > 0) {
            console.log(`           Issues: ${failed.errors.join(', ')}`);
          }
        }
      }
    }

    // Quality metrics
    console.log('\n🎯 Quality Metrics:');
    const avgCustomerScore = this.testResults.reduce((sum, r) => sum + r.metrics.customerServiceScore, 0) / totalTests;
    const qualityDistribution = {
      excellent: this.testResults.filter(r => r.metrics.responseQuality === 'excellent').length,
      good: this.testResults.filter(r => r.metrics.responseQuality === 'good').length,
      acceptable: this.testResults.filter(r => r.metrics.responseQuality === 'acceptable').length,
      poor: this.testResults.filter(r => r.metrics.responseQuality === 'poor').length,
    };

    console.log(`   Average Customer Service Score: ${avgCustomerScore.toFixed(1)}/100`);
    console.log(`   Response Quality Distribution:`);
    console.log(`      Excellent: ${qualityDistribution.excellent} (${((qualityDistribution.excellent/totalTests)*100).toFixed(1)}%)`);
    console.log(`      Good: ${qualityDistribution.good} (${((qualityDistribution.good/totalTests)*100).toFixed(1)}%)`);
    console.log(`      Acceptable: ${qualityDistribution.acceptable} (${((qualityDistribution.acceptable/totalTests)*100).toFixed(1)}%)`);
    console.log(`      Poor: ${qualityDistribution.poor} (${((qualityDistribution.poor/totalTests)*100).toFixed(1)}%)`);

    // Common issues
    console.log('\n⚠️  Common Issues:');
    const allErrors = this.testResults.flatMap(r => r.errors);
    const errorCounts = new Map<string, number>();
    
    for (const error of allErrors) {
      const key = error.split(':')[0]; // Group similar errors
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
    }
    
    const sortedErrors = Array.from(errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    if (sortedErrors.length === 0) {
      console.log('   No common issues found! 🎉');
    } else {
      for (const [error, count] of sortedErrors) {
        console.log(`   - ${error}: ${count} occurrences`);
      }
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (avgCustomerScore < 60) {
      console.log('   ⚠️  Customer service score is low. Consider:');
      console.log('      - Improving response tone and helpfulness');
      console.log('      - Adding more context-aware responses');
    }
    
    if (qualityDistribution.poor > totalTests * 0.2) {
      console.log('   ⚠️  High number of poor quality responses. Consider:');
      console.log('      - Reviewing prompt engineering');
      console.log('      - Improving search result processing');
    }

    const productFindingRate = this.testResults.filter(r => r.metrics.foundProducts).length / totalTests;
    if (productFindingRate < 0.7) {
      console.log('   ⚠️  Low product finding rate. Consider:');
      console.log('      - Improving search algorithms');
      console.log('      - Expanding product database coverage');
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Dynamic Test Report Complete!');
    console.log('='.repeat(80) + '\n');

    // Save detailed results to file
    this.saveDetailedResults();
  }

  private saveDetailedResults(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `dynamic-test-results-${timestamp}.json`;
    
    const detailedReport = {
      timestamp: new Date().toISOString(),
      testData: this.testData,
      summary: {
        totalTests: this.testResults.length,
        passed: this.testResults.filter(r => r.passed).length,
        failed: this.testResults.filter(r => !r.passed).length,
        passRate: ((this.testResults.filter(r => r.passed).length / this.testResults.length) * 100).toFixed(1)
      },
      results: this.testResults
    };

    require('fs').writeFileSync(
      filename,
      JSON.stringify(detailedReport, null, 2)
    );
    
    console.log(`\n📁 Detailed results saved to: ${filename}`);
  }
}

// Run the tests
async function main() {
  const tester = new DynamicAgentAccuracyTester();
  await tester.runAllTests();
}

main().catch(console.error);