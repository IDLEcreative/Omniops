#!/usr/bin/env npx tsx
/**
 * GPT-5-mini Model Validation Test Suite
 * Tests all reported issues with the new model configuration
 */

import fetch from 'node-fetch';
import { createServiceRoleClient } from './lib/supabase-server';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};

interface TestResult {
  query: string;
  passed: boolean;
  issues: string[];
  response: string;
  searchMetadata?: any;
}

class GPT5MiniValidator {
  private baseUrl = 'http://localhost:3000/api/chat';
  private domain = 'thompsonseparts.co.uk';
  private results: TestResult[] = [];

  async makeRequest(message: string, conversationId?: string): Promise<any> {
    const sessionId = `test-gpt5-${Date.now()}-${Math.random()}`;
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          session_id: sessionId,
          domain: this.domain,
          ...(conversationId && { conversation_id: conversationId })
        })
      });

      if (!response.ok) {
        console.error(`HTTP ${response.status}: ${response.statusText}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Request failed:', error);
      return null;
    }
  }

  // Test 1: Cifa pump search - should show category page, not just one pump
  async testCifaPumpSearch() {
    console.log(`\n${colors.cyan}${colors.bold}Test 1: Cifa Mixer Pump Search${colors.reset}`);
    console.log(`${colors.gray}Issue: Only shows one pump instead of full range/category${colors.reset}`);
    
    const response = await this.makeRequest("Need a pump for my Cifa mixer");
    const issues: string[] = [];
    
    if (!response?.message) {
      this.results.push({
        query: "Cifa mixer pump",
        passed: false,
        issues: ['No response received'],
        response: ''
      });
      return;
    }

    const responseText = response.message.toLowerCase();
    
    // Check for category page mention
    const hasCategoryLink = responseText.includes('category') || 
                           responseText.includes('full range') ||
                           responseText.includes('extensive selection') ||
                           responseText.includes('/cifa-hydraulic-parts/');
    
    // Check if it mentions multiple products
    const mentionsMultiple = responseText.includes('range of') ||
                           responseText.includes('various') ||
                           responseText.includes('selection') ||
                           responseText.includes('several');
    
    // Check for external links
    const hasExternalLinks = responseText.includes('amazon') ||
                           responseText.includes('manufacturer website') ||
                           responseText.includes('external site') ||
                           responseText.includes('.com') && !responseText.includes('thompsonseparts');

    if (!hasCategoryLink) issues.push('No category page recommendation');
    if (!mentionsMultiple) issues.push('Doesn\'t mention full range available');
    if (hasExternalLinks) issues.push('Contains external links');
    
    this.results.push({
      query: "Cifa mixer pump",
      passed: issues.length === 0,
      issues,
      response: response.message,
      searchMetadata: response.searchMetadata
    });
    
    console.log(`  ${issues.length === 0 ? colors.green + '✓' : colors.red + '✗'} Category recommendation: ${hasCategoryLink ? 'Yes' : 'No'}`);
    console.log(`  ${mentionsMultiple ? colors.green + '✓' : colors.red + '✗'} Mentions range: ${mentionsMultiple ? 'Yes' : 'No'}`);
    console.log(`  ${!hasExternalLinks ? colors.green + '✓' : colors.red + '✗'} No external links: ${!hasExternalLinks ? 'Yes' : 'No'}`);
  }

  // Test 2: Teng torque wrenches - should go to category, no external sites
  async testTengTorqueWrenches() {
    console.log(`\n${colors.cyan}${colors.bold}Test 2: Teng Torque Wrenches${colors.reset}`);
    console.log(`${colors.gray}Issue: Offers external sites instead of category page${colors.reset}`);
    
    const response = await this.makeRequest("Search for Teng torque wrenches");
    const issues: string[] = [];
    
    if (!response?.message) {
      this.results.push({
        query: "Teng torque wrenches",
        passed: false,
        issues: ['No response received'],
        response: ''
      });
      return;
    }

    const responseText = response.message.toLowerCase();
    
    // Check for category page
    const hasCategoryLink = responseText.includes('/teng-tools/') ||
                           responseText.includes('teng tools category') ||
                           responseText.includes('workshop tools');
    
    // Check for external sites
    const hasExternalSites = responseText.includes('external') ||
                           responseText.includes('amazon') ||
                           responseText.includes('other website') ||
                           responseText.includes('manufacturer site');

    if (!hasCategoryLink) issues.push('No Teng Tools category page mentioned');
    if (hasExternalSites) issues.push('Recommends external websites');
    
    this.results.push({
      query: "Teng torque wrenches",
      passed: issues.length === 0,
      issues,
      response: response.message,
      searchMetadata: response.searchMetadata
    });
    
    console.log(`  ${hasCategoryLink ? colors.green + '✓' : colors.red + '✗'} Category page: ${hasCategoryLink ? 'Yes' : 'No'}`);
    console.log(`  ${!hasExternalSites ? colors.green + '✓' : colors.red + '✗'} No external sites: ${!hasExternalSites ? 'Yes' : 'No'}`);
  }

  // Test 3: Kinshofer pin & bush kit - check response length and external links
  async testKinshoferKit() {
    console.log(`\n${colors.cyan}${colors.bold}Test 3: Kinshofer Pin & Bush Kit${colors.reset}`);
    console.log(`${colors.gray}Issue: Response too long, mentions manufacturer sites/blogs${colors.reset}`);
    
    const response = await this.makeRequest("Kinshofer pin & bush kit");
    const issues: string[] = [];
    
    if (!response?.message) {
      this.results.push({
        query: "Kinshofer kit",
        passed: false,
        issues: ['No response received'],
        response: ''
      });
      return;
    }

    const responseText = response.message;
    const responseLength = responseText.length;
    const wordCount = responseText.split(/\s+/).length;
    
    // Check response length (should be concise)
    const isConcise = wordCount < 200; // Reasonable limit for product info
    
    // Check for external references
    const hasExternalRefs = responseText.toLowerCase().includes('manufacturer') ||
                          responseText.toLowerCase().includes('community') ||
                          responseText.toLowerCase().includes('blog') ||
                          responseText.toLowerCase().includes('forum');

    if (!isConcise) issues.push(`Response too long: ${wordCount} words`);
    if (hasExternalRefs) issues.push('Mentions external sites/blogs');
    
    this.results.push({
      query: "Kinshofer kit",
      passed: issues.length === 0,
      issues,
      response: response.message,
      searchMetadata: response.searchMetadata
    });
    
    console.log(`  ${isConcise ? colors.green + '✓' : colors.red + '✗'} Concise response: ${wordCount} words`);
    console.log(`  ${!hasExternalRefs ? colors.green + '✓' : colors.red + '✗'} No external refs: ${!hasExternalRefs ? 'Yes' : 'No'}`);
  }

  // Test 4: DC66-10P product code recognition
  async testProductCode() {
    console.log(`\n${colors.cyan}${colors.bold}Test 4: DC66-10P Product Code${colors.reset}`);
    console.log(`${colors.gray}Issue: Doesn't recognize best-selling part code${colors.reset}`);
    
    const response = await this.makeRequest("DC66-10P");
    const issues: string[] = [];
    
    if (!response?.message) {
      this.results.push({
        query: "DC66-10P",
        passed: false,
        issues: ['No response received'],
        response: ''
      });
      return;
    }

    const responseText = response.message;
    
    // Check if it found the product
    const foundProduct = !responseText.toLowerCase().includes("couldn't find") &&
                        !responseText.toLowerCase().includes("no results") &&
                        !responseText.toLowerCase().includes("not available");
    
    // Check if it mentions it's a popular/best-selling item
    const mentionsPopular = responseText.toLowerCase().includes('popular') ||
                          responseText.toLowerCase().includes('best') ||
                          responseText.toLowerCase().includes('frequently');

    if (!foundProduct) issues.push('Product not found');
    if (!mentionsPopular) issues.push('Doesn\'t mention it\'s a popular item');
    
    // Check search metadata
    if (response.searchMetadata?.totalSearches === 0) {
      issues.push('No searches performed');
    }
    
    this.results.push({
      query: "DC66-10P",
      passed: issues.length === 0,
      issues,
      response: response.message,
      searchMetadata: response.searchMetadata
    });
    
    console.log(`  ${foundProduct ? colors.green + '✓' : colors.red + '✗'} Product found: ${foundProduct ? 'Yes' : 'No'}`);
    console.log(`  Search iterations: ${response.searchMetadata?.iterations || 0}`);
  }

  // Test 5: General category queries (sheet roller bar, starter charger, body filler)
  async testGeneralCategories() {
    console.log(`\n${colors.cyan}${colors.bold}Test 5: General Category Queries${colors.reset}`);
    console.log(`${colors.gray}Issue: Should link to category pages, not ask many questions${colors.reset}`);
    
    const queries = [
      { 
        query: "sheet roller bar",
        expectedCategory: "tipper-sheet-system"
      },
      { 
        query: "Price on a starter charger",
        expectedCategory: "battery-starters-chargers"
      },
      { 
        query: "Price on Body Filler",
        expectedCategory: "body-fillers"
      }
    ];

    for (const { query, expectedCategory } of queries) {
      console.log(`\n  Testing: "${query}"`);
      const response = await this.makeRequest(query);
      const issues: string[] = [];
      
      if (!response?.message) {
        console.log(`    ${colors.red}✗ No response${colors.reset}`);
        continue;
      }

      const responseText = response.message.toLowerCase();
      
      // Check for category link
      const hasCategoryLink = responseText.includes(expectedCategory) ||
                             responseText.includes('category') ||
                             responseText.includes('section') ||
                             responseText.includes('range');
      
      // Check for excessive questions
      const questionCount = (responseText.match(/\?/g) || []).length;
      const tooManyQuestions = questionCount > 2;
      
      // Check currency (should be GBP/£)
      const hasCorrectCurrency = !responseText.includes('$') || responseText.includes('£');
      
      // Check for external links
      const hasExternalLinks = responseText.includes('amazon') ||
                              responseText.includes('external') ||
                              responseText.includes('.com') && !responseText.includes('thompsonseparts');

      if (!hasCategoryLink) issues.push('No category page link');
      if (tooManyQuestions) issues.push(`Too many questions: ${questionCount}`);
      if (!hasCorrectCurrency && responseText.includes('$')) issues.push('Shows USD instead of GBP');
      if (hasExternalLinks) issues.push('Contains external links');
      
      console.log(`    ${hasCategoryLink ? colors.green + '✓' : colors.red + '✗'} Category link`);
      console.log(`    ${!tooManyQuestions ? colors.green + '✓' : colors.red + '✗'} Concise (${questionCount} questions)`);
      console.log(`    ${hasCorrectCurrency ? colors.green + '✓' : colors.red + '✗'} Currency: ${hasCorrectCurrency ? 'GBP' : 'USD'}`);
      console.log(`    ${!hasExternalLinks ? colors.green + '✓' : colors.red + '✗'} No external links`);
      
      this.results.push({
        query,
        passed: issues.length === 0,
        issues,
        response: response.message,
        searchMetadata: response.searchMetadata
      });
    }
  }

  // Generate summary report
  generateReport() {
    console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.bold}GPT-5-mini VALIDATION REPORT${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const passRate = (passed / this.results.length * 100).toFixed(1);
    
    console.log(`${colors.bold}Overall Results:${colors.reset}`);
    console.log(`  Total Tests: ${this.results.length}`);
    console.log(`  ${colors.green}Passed: ${passed}${colors.reset}`);
    console.log(`  ${colors.red}Failed: ${failed}${colors.reset}`);
    console.log(`  Pass Rate: ${passRate}%`);
    
    if (failed > 0) {
      console.log(`\n${colors.bold}Failed Tests:${colors.reset}`);
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`\n  ${colors.yellow}Query: "${result.query}"${colors.reset}`);
        result.issues.forEach(issue => {
          console.log(`    ${colors.red}✗ ${issue}${colors.reset}`);
        });
      });
    }
    
    // Key insights
    console.log(`\n${colors.bold}Key Findings:${colors.reset}`);
    
    const externalLinkTests = this.results.filter(r => 
      r.issues.some(i => i.toLowerCase().includes('external'))
    );
    const categoryTests = this.results.filter(r => 
      r.issues.some(i => i.toLowerCase().includes('category'))
    );
    const lengthTests = this.results.filter(r => 
      r.issues.some(i => i.toLowerCase().includes('long') || i.includes('questions'))
    );
    
    console.log(`  External Links Issues: ${externalLinkTests.length} tests`);
    console.log(`  Category Page Issues: ${categoryTests.length} tests`);
    console.log(`  Response Length Issues: ${lengthTests.length} tests`);
    
    // Model performance
    console.log(`\n${colors.bold}Model Performance (GPT-5-mini):${colors.reset}`);
    const avgSearches = this.results
      .filter(r => r.searchMetadata)
      .reduce((acc, r) => acc + (r.searchMetadata.totalSearches || 0), 0) / this.results.length;
    
    console.log(`  Average searches per query: ${avgSearches.toFixed(1)}`);
    console.log(`  Model config: low reasoning effort, 2500 max tokens`);
    
    // Recommendations
    console.log(`\n${colors.bold}Recommendations:${colors.reset}`);
    if (externalLinkTests.length > 0) {
      console.log(`  ${colors.yellow}⚠${colors.reset} External link filtering needs strengthening`);
    }
    if (categoryTests.length > 0) {
      console.log(`  ${colors.yellow}⚠${colors.reset} Add category page detection and routing`);
    }
    if (lengthTests.length > 0) {
      console.log(`  ${colors.yellow}⚠${colors.reset} Enforce more concise responses`);
    }
    
    console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
    
    return {
      passed,
      failed,
      passRate: parseFloat(passRate),
      results: this.results
    };
  }

  async runAllTests() {
    console.log(`${colors.bold}Starting GPT-5-mini Validation Tests${colors.reset}`);
    console.log(`Testing against: ${this.baseUrl}`);
    console.log(`Domain: ${this.domain}`);
    console.log(`Model: GPT-5-mini with low reasoning effort\n`);
    
    // Check if server is running
    try {
      const healthCheck = await fetch('http://localhost:3000/api/health').catch(() => null);
      if (!healthCheck || !healthCheck.ok) {
        console.error(`${colors.red}ERROR: Server not responding at localhost:3000${colors.reset}`);
        console.log('Please start the server with: npm run dev');
        process.exit(1);
      }
    } catch {
      console.error(`${colors.red}ERROR: Cannot connect to server${colors.reset}`);
      process.exit(1);
    }
    
    // Run all tests
    await this.testCifaPumpSearch();
    await this.testTengTorqueWrenches();
    await this.testKinshoferKit();
    await this.testProductCode();
    await this.testGeneralCategories();
    
    // Generate report
    const summary = this.generateReport();
    
    // Exit with appropriate code
    process.exit(summary.failed > 0 ? 1 : 0);
  }
}

// Run tests
const validator = new GPT5MiniValidator();
validator.runAllTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});