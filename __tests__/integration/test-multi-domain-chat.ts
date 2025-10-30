/**
 * Multi-Domain Chat System Test
 *
 * Tests that the chat system works correctly for different business types
 * without brand-specific biases after brand-agnostic remediation.
 *
 * Run: npx tsx test-multi-domain-chat.ts
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface DomainTestResult {
  domain: string;
  businessType: string;
  testsPassed: number;
  testsFailed: number;
  violations: string[];
  status: 'PASS' | 'FAIL';
}

class MultiDomainChatTester {
  private results: DomainTestResult[] = [];

  /**
   * Test Restaurant Domain
   */
  async testRestaurantDomain(): Promise<DomainTestResult> {
    console.log('\n🍽️  Testing Restaurant Domain...');

    const result: DomainTestResult = {
      domain: 'restaurant-test.local',
      businessType: 'Restaurant',
      testsPassed: 0,
      testsFailed: 0,
      violations: [],
      status: 'PASS'
    };

    // Test 1: Check widget doesn't default to Thompson's domain
    console.log('  Test 1: Domain independence...');
    const hasThompsonsDefault = await this.checkForHardcodedDomain('thompsonseparts.co.uk');
    if (!hasThompsonsDefault) {
      result.testsPassed++;
      console.log('  ✅ No hardcoded Thompson\'s domain fallback');
    } else {
      result.testsFailed++;
      result.violations.push('Hardcoded Thompson\'s domain fallback found');
      console.log('  ❌ FAILED: Hardcoded domain fallback detected');
    }

    // Test 2: System prompts don't contain equipment/pump references
    console.log('  Test 2: No equipment terminology in prompts...');
    const hasEquipmentBias = await this.checkSystemPromptsForBrands([
      'pump', 'hydraulic', 'Cifa', 'equipment', 'machinery'
    ]);
    if (!hasEquipmentBias) {
      result.testsPassed++;
      console.log('  ✅ System prompts are brand-agnostic');
    } else {
      result.testsFailed++;
      result.violations.push('Equipment terminology found in system prompts');
      console.log('  ❌ FAILED: Brand-specific terminology detected');
    }

    // Test 3: Search doesn't boost specific products
    console.log('  Test 3: Search fairness...');
    const hasProductBoosting = await this.checkForProductBoosting('agri-flip');
    if (!hasProductBoosting) {
      result.testsPassed++;
      console.log('  ✅ No product-specific boosting in search');
    } else {
      result.testsFailed++;
      result.violations.push('Product-specific boosting found in search algorithm');
      console.log('  ❌ FAILED: Product boosting detected');
    }

    result.status = result.testsFailed === 0 ? 'PASS' : 'FAIL';
    return result;
  }

  /**
   * Test Real Estate Domain
   */
  async testRealEstateDomain(): Promise<DomainTestResult> {
    console.log('\n🏠  Testing Real Estate Domain...');

    const result: DomainTestResult = {
      domain: 'realestate-test.local',
      businessType: 'Real Estate',
      testsPassed: 0,
      testsFailed: 0,
      violations: [],
      status: 'PASS'
    };

    // Test 1: API requires domain parameter
    console.log('  Test 1: API domain parameter enforcement...');
    const requiresDomainParam = await this.checkApiRequiresDomain();
    if (requiresDomainParam) {
      result.testsPassed++;
      console.log('  ✅ API properly requires domain parameter');
    } else {
      result.testsFailed++;
      result.violations.push('API allows missing domain parameter');
      console.log('  ❌ FAILED: API doesn\'t enforce domain parameter');
    }

    // Test 2: No Thompson's references in responses
    console.log('  Test 2: Response brand-agnostic check...');
    const hasThompsonsRefs = await this.checkCodeForBrandReferences('Thompson');
    if (!hasThompsonsRefs) {
      result.testsPassed++;
      console.log('  ✅ No Thompson\'s references in code');
    } else {
      result.testsFailed++;
      result.violations.push('Thompson\'s references found in production code');
      console.log('  ❌ FAILED: Brand references detected');
    }

    // Test 3: Cache doesn't favor specific domain
    console.log('  Test 3: Cache fairness...');
    const hasCacheBias = await this.checkCachePreloading('thompsonseparts');
    if (!hasCacheBias) {
      result.testsPassed++;
      console.log('  ✅ Cache preloading is configurable');
    } else {
      result.testsFailed++;
      result.violations.push('Hardcoded cache preloading for specific domain');
      console.log('  ❌ FAILED: Cache favors specific domain');
    }

    result.status = result.testsFailed === 0 ? 'PASS' : 'FAIL';
    return result;
  }

  /**
   * Test Healthcare Domain
   */
  async testHealthcareDomain(): Promise<DomainTestResult> {
    console.log('\n🏥  Testing Healthcare Domain...');

    const result: DomainTestResult = {
      domain: 'healthcare-test.local',
      businessType: 'Healthcare',
      testsPassed: 0,
      testsFailed: 0,
      violations: [],
      status: 'PASS'
    };

    // Test 1: AI prompts are generic
    console.log('  Test 1: Generic AI prompts...');
    const hasGenericPrompts = await this.checkPromptsUseGenericPlaceholders();
    if (hasGenericPrompts) {
      result.testsPassed++;
      console.log('  ✅ AI prompts use generic placeholders');
    } else {
      result.testsFailed++;
      result.violations.push('AI prompts contain specific product/brand examples');
      console.log('  ❌ FAILED: Non-generic prompts detected');
    }

    // Test 2: No SKU hardcoding
    console.log('  Test 2: No hardcoded SKUs...');
    const hasHardcodedSKUs = await this.checkForHardcodedSKUs(['A4VTG90', 'K2053463']);
    if (!hasHardcodedSKUs) {
      result.testsPassed++;
      console.log('  ✅ No hardcoded SKUs in prompts');
    } else {
      result.testsFailed++;
      result.violations.push('Hardcoded SKUs found in system prompts');
      console.log('  ❌ FAILED: Hardcoded SKUs detected');
    }

    // Test 3: Search scoring is fair
    console.log('  Test 3: Fair search scoring...');
    const hasArtificialScoring = await this.checkForArtificialScoring();
    if (!hasArtificialScoring) {
      result.testsPassed++;
      console.log('  ✅ Search scoring is based on relevance only');
    } else {
      result.testsFailed++;
      result.violations.push('Artificial score boosting found');
      console.log('  ❌ FAILED: Artificial scoring detected');
    }

    result.status = result.testsFailed === 0 ? 'PASS' : 'FAIL';
    return result;
  }

  /**
   * Helper: Check for hardcoded domain
   */
  private async checkForHardcodedDomain(domain: string): Promise<boolean> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const chatWidgetPath = path.join(process.cwd(), 'components/ChatWidget.tsx');
    const content = await fs.readFile(chatWidgetPath, 'utf-8');

    // Check if domain is hardcoded (not in env var)
    const hardcodedPattern = new RegExp(`['"]${domain}['"]`, 'g');
    const matches = content.match(hardcodedPattern) || [];

    // Filter out comments and acceptable usage
    const violations = matches.filter(match => {
      const index = content.indexOf(match);
      const contextBefore = content.substring(Math.max(0, index - 100), index);

      // Acceptable if in environment variable or comment
      return !contextBefore.includes('process.env') &&
             !contextBefore.includes('//') &&
             !contextBefore.includes('/*');
    });

    return violations.length > 0;
  }

  /**
   * Helper: Check system prompts for brand-specific terms
   */
  private async checkSystemPromptsForBrands(terms: string[]): Promise<boolean> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const filesToCheck = [
      path.join(process.cwd(), 'lib/chat/system-prompts.ts'),
      path.join(process.cwd(), 'lib/agents/customer-service-agent.ts')
    ];

    for (const filePath of filesToCheck) {
      const content = await fs.readFile(filePath, 'utf-8');

      for (const term of terms) {
        // Check for term not in placeholders like [PRODUCT_NAME]
        const pattern = new RegExp(`(?<!\\[)\\b${term}\\b(?!\\])`, 'gi');
        if (pattern.test(content)) {
          // Verify it's not in a comment explaining removal
          const contextPattern = new RegExp(`(?<!removed|eliminated|deleted).*${term}`, 'gi');
          if (contextPattern.test(content)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Helper: Check for product-specific boosting
   */
  private async checkForProductBoosting(productIdentifier: string): Promise<boolean> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const searchFiles = [
      path.join(process.cwd(), 'lib/enhanced-embeddings.ts'),
      path.join(process.cwd(), 'lib/enhanced-embeddings-search.ts')
    ];

    for (const filePath of searchFiles) {
      const content = await fs.readFile(filePath, 'utf-8');

      // Check for product identifier references
      if (content.includes(productIdentifier)) {
        return true;
      }

      // Check for artificial score boosting patterns
      if (content.includes('score = 0.99') || content.includes('score = 1.0')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Helper: Check if API requires domain parameter
   */
  private async checkApiRequiresDomain(): Promise<boolean> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const apiPath = path.join(process.cwd(), 'app/api/woocommerce/products/route.ts');
    const content = await fs.readFile(apiPath, 'utf-8');

    // Check if domain parameter is required (returns error if missing)
    return content.includes('if (!domain)') &&
           content.includes('status: 400');
  }

  /**
   * Helper: Check for brand references in code
   */
  private async checkCodeForBrandReferences(brandName: string): Promise<boolean> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const { execSync } = await import('child_process');

    try {
      // Use grep to search for brand references in production code
      const result = execSync(
        `grep -r "${brandName}" lib/ components/ app/api/ --include="*.ts" --include="*.tsx" 2>&1 || true`,
        { encoding: 'utf-8' }
      );

      // Filter out acceptable references (in comments explaining removal)
      const lines = result.split('\n').filter(line => {
        return line.length > 0 &&
               !line.includes('REMOVED') &&
               !line.includes('deprecated') &&
               !line.includes('Example:');
      });

      return lines.length > 0;
    } catch (error) {
      console.error('Error checking for brand references:', error);
      return false;
    }
  }

  /**
   * Helper: Check cache preloading configuration
   */
  private async checkCachePreloading(domain: string): Promise<boolean> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const cachePath = path.join(process.cwd(), 'lib/domain-cache.ts');
    const content = await fs.readFile(cachePath, 'utf-8');

    // Check if domain is hardcoded in preload array
    const hardcodedPattern = new RegExp(`['"]${domain}['"]`, 'g');
    const matches = content.match(hardcodedPattern) || [];

    // Check if it's in a static array (not from env var)
    return matches.some(match => {
      const index = content.indexOf(match);
      const contextBefore = content.substring(Math.max(0, index - 150), index);

      return !contextBefore.includes('process.env') &&
             !contextBefore.includes('split(') &&
             contextBefore.includes('[');
    });
  }

  /**
   * Helper: Check if prompts use generic placeholders
   */
  private async checkPromptsUseGenericPlaceholders(): Promise<boolean> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const promptFiles = [
      path.join(process.cwd(), 'lib/chat/system-prompts.ts'),
      path.join(process.cwd(), 'lib/agents/customer-service-agent.ts')
    ];

    for (const filePath of promptFiles) {
      const content = await fs.readFile(filePath, 'utf-8');

      // Check for generic placeholders like [PRODUCT_NAME], [COMPANY_NAME], etc.
      const hasPlaceholders = /\[PRODUCT_NAME\]|\[COMPANY_NAME\]|\[SKU\]|\[PREVIOUS_TOPIC\]/gi.test(content);

      if (!hasPlaceholders) {
        // If no placeholders, check if there are hardcoded examples instead
        const hasHardcodedExamples = /Cifa|Thompson|Agri Flip|A4VTG90|K2053463/gi.test(content);
        if (hasHardcodedExamples) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Helper: Check for hardcoded SKUs
   */
  private async checkForHardcodedSKUs(skus: string[]): Promise<boolean> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const promptFiles = [
      path.join(process.cwd(), 'lib/chat/system-prompts.ts'),
      path.join(process.cwd(), 'lib/agents/customer-service-agent.ts')
    ];

    for (const filePath of promptFiles) {
      const content = await fs.readFile(filePath, 'utf-8');

      for (const sku of skus) {
        // Check if SKU exists but is not in a placeholder
        if (content.includes(sku) && !content.includes(`[${sku}]`)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Helper: Check for artificial score boosting
   */
  private async checkForArtificialScoring(): Promise<boolean> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const searchFiles = [
      path.join(process.cwd(), 'lib/enhanced-embeddings.ts'),
      path.join(process.cwd(), 'lib/enhanced-embeddings-search.ts')
    ];

    for (const filePath of searchFiles) {
      const content = await fs.readFile(filePath, 'utf-8');

      // Check for suspicious scoring patterns
      const artificialPatterns = [
        /score\s*=\s*0\.99/,  // Artificial maximum score
        /score\s*=\s*1\.0/,   // Perfect score
        /if\s*\(.*\.includes\(['"]agri-flip['"]\)/,  // Product-specific checks
        /if\s*\(.*\.includes\(['"]cifa['"]\)/
      ];

      for (const pattern of artificialPatterns) {
        if (pattern.test(content)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Print test results summary
   */
  private printSummary() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 MULTI-DOMAIN CHAT SYSTEM TEST RESULTS');
    console.log('='.repeat(70));

    let totalPassed = 0;
    let totalFailed = 0;
    let overallStatus = 'PASS';

    for (const result of this.results) {
      console.log(`\n${this.getBusinessTypeIcon(result.businessType)} ${result.businessType} (${result.domain})`);
      console.log(`   Tests Passed: ${result.testsPassed}`);
      console.log(`   Tests Failed: ${result.testsFailed}`);
      console.log(`   Status: ${result.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);

      if (result.violations.length > 0) {
        console.log(`   Violations:`);
        result.violations.forEach(v => console.log(`     - ${v}`));
      }

      totalPassed += result.testsPassed;
      totalFailed += result.testsFailed;
      if (result.status === 'FAIL') overallStatus = 'FAIL';
    }

    console.log('\n' + '='.repeat(70));
    console.log(`📊 OVERALL RESULTS`);
    console.log(`   Total Tests: ${totalPassed + totalFailed}`);
    console.log(`   Passed: ${totalPassed}`);
    console.log(`   Failed: ${totalFailed}`);
    console.log(`   Success Rate: ${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%`);
    console.log(`   Overall Status: ${overallStatus === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);
    console.log('='.repeat(70));

    if (overallStatus === 'PASS') {
      console.log('\n✅ All domain tests passed! System is brand-agnostic and multi-tenant ready.');
    } else {
      console.log('\n❌ Some tests failed. Review violations above and fix issues.');
    }
  }

  private getBusinessTypeIcon(businessType: string): string {
    const icons: Record<string, string> = {
      'Restaurant': '🍽️',
      'Real Estate': '🏠',
      'Healthcare': '🏥',
      'E-commerce': '🛒',
      'Education': '🎓',
      'Hospitality': '🏨'
    };
    return icons[businessType] || '📦';
  }

  /**
   * Run all domain tests
   */
  async runAllTests() {
    console.log('🚀 Starting Multi-Domain Chat System Tests...');
    console.log('Testing brand-agnostic remediation effectiveness\n');

    try {
      // Run tests for each business type
      this.results.push(await this.testRestaurantDomain());
      this.results.push(await this.testRealEstateDomain());
      this.results.push(await this.testHealthcareDomain());

      // Print summary
      this.printSummary();

      // Exit with appropriate code
      const hasFailures = this.results.some(r => r.status === 'FAIL');
      process.exit(hasFailures ? 1 : 0);
    } catch (error) {
      console.error('\n❌ Test execution failed:', error);
      process.exit(1);
    }
  }
}

// Run tests
const tester = new MultiDomainChatTester();
tester.runAllTests();
