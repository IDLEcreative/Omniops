#!/usr/bin/env npx tsx
/**
 * Test Suite for Query Enhancement System
 * Tests synonym expansion, spelling correction, intent detection, and entity extraction
 */

import { QueryEnhancer } from './lib/query-enhancer';
import { config } from 'dotenv';

// Load environment variables
config();

// Test cases for different query types
const testQueries = [
  // Product queries
  {
    query: "moter for ford 2015",
    expected: {
      intent: 'transactional',
      hasSynonyms: true,
      hasSpellingCorrection: true,
      entities: {
        hasProducts: true,
        hasBrands: true
      }
    }
  },
  {
    query: "cheap replacement engin parts",
    expected: {
      intent: 'transactional',
      hasSynonyms: true,
      hasSpellingCorrection: true,
      entities: {
        hasProducts: true
      }
    }
  },
  // Troubleshooting queries
  {
    query: "motor not working broken help",
    expected: {
      intent: 'troubleshooting',
      hasSynonyms: true,
      entities: {
        hasIssues: true,
        hasProducts: true
      }
    }
  },
  {
    query: "how to fix instalation problem",
    expected: {
      intent: 'troubleshooting',
      hasSpellingCorrection: true,
      entities: {
        hasActions: true,
        hasIssues: true
      }
    }
  },
  // Informational queries
  {
    query: "what is the best motor for heavy duty work",
    expected: {
      intent: 'informational',
      hasSynonyms: true,
      entities: {
        hasProducts: true
      }
    }
  },
  // SKU queries
  {
    query: "BOS-1234 price and waranty",
    expected: {
      intent: 'transactional',
      hasSpellingCorrection: true,
      entities: {
        hasSkus: true
      }
    }
  },
  // Comparison queries
  {
    query: "dewalt vs makita drill comparison",
    expected: {
      intent: 'comparison',
      entities: {
        hasBrands: true
      }
    }
  }
];

async function runTests() {
  console.log('🧪 Query Enhancement Test Suite\n');
  console.log('=' .repeat(80));
  
  let passedTests = 0;
  let failedTests = 0;
  const results: any[] = [];

  for (const testCase of testQueries) {
    console.log(`\n📝 Testing: "${testCase.query}"`);
    console.log('-'.repeat(40));
    
    try {
      const enhanced = await QueryEnhancer.enhance(testCase.query);
      
      // Test results
      const tests = {
        intent: enhanced.intent === testCase.expected.intent,
        synonyms: testCase.expected.hasSynonyms ? 
          enhanced.synonyms.size > 0 : true,
        spelling: testCase.expected.hasSpellingCorrection ? 
          enhanced.spelling_corrections.size > 0 : true,
        skus: testCase.expected.entities?.hasSkus ? 
          enhanced.entities.skus.length > 0 : true,
        brands: testCase.expected.entities?.hasBrands ? 
          enhanced.entities.brands.length > 0 : true,
        products: testCase.expected.entities?.hasProducts ? 
          enhanced.entities.products.length > 0 : true,
        issues: testCase.expected.entities?.hasIssues ? 
          enhanced.entities.issues.length > 0 : true,
        actions: testCase.expected.entities?.hasActions ? 
          enhanced.entities.actions.length > 0 : true
      };
      
      const allPassed = Object.values(tests).every(t => t);
      
      if (allPassed) {
        console.log('✅ PASSED');
        passedTests++;
      } else {
        console.log('❌ FAILED');
        failedTests++;
      }
      
      // Show enhancement details
      console.log('\nEnhancement Results:');
      console.log(`  Original: ${enhanced.original}`);
      console.log(`  Normalized: ${enhanced.normalized}`);
      console.log(`  Intent: ${enhanced.intent} ${tests.intent ? '✓' : '✗'}`);
      console.log(`  Confidence: ${(enhanced.confidence_score * 100).toFixed(0)}%`);
      
      if (enhanced.synonyms.size > 0) {
        console.log(`  Synonyms found: ${Array.from(enhanced.synonyms.keys()).join(', ')}`);
      }
      
      if (enhanced.spelling_corrections.size > 0) {
        console.log(`  Spelling corrections:`);
        enhanced.spelling_corrections.forEach((correct, wrong) => {
          console.log(`    "${wrong}" → "${correct}"`);
        });
      }
      
      if (enhanced.expanded_terms.length > 0) {
        console.log(`  Expanded terms: ${enhanced.expanded_terms.slice(0, 5).join(', ')}`);
      }
      
      if (Object.values(enhanced.entities).some(e => e.length > 0)) {
        console.log(`  Entities detected:`);
        if (enhanced.entities.skus.length > 0) {
          console.log(`    SKUs: ${enhanced.entities.skus.join(', ')}`);
        }
        if (enhanced.entities.brands.length > 0) {
          console.log(`    Brands: ${enhanced.entities.brands.join(', ')}`);
        }
        if (enhanced.entities.products.length > 0) {
          console.log(`    Products: ${enhanced.entities.products.join(', ')}`);
        }
        if (enhanced.entities.issues.length > 0) {
          console.log(`    Issues: ${enhanced.entities.issues.join(', ')}`);
        }
        if (enhanced.entities.actions.length > 0) {
          console.log(`    Actions: ${enhanced.entities.actions.join(', ')}`);
        }
      }
      
      if (enhanced.related_queries.length > 0) {
        console.log(`  Related queries: ${enhanced.related_queries.join('; ')}`);
      }
      
      // Apply to search and show configuration
      const searchConfig = QueryEnhancer.applyToSearch(enhanced);
      console.log('\n  Search Configuration:');
      console.log(`    Search terms: ${searchConfig.searchTerms.slice(0, 3).join(', ')}`);
      console.log(`    Boost fields:`, searchConfig.boostFields);
      console.log(`    Filters:`, searchConfig.filters);
      
      results.push({
        query: testCase.query,
        passed: allPassed,
        enhanced,
        tests
      });
      
    } catch (error) {
      console.log('❌ ERROR:', error);
      failedTests++;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 Test Summary\n');
  console.log(`Total tests: ${testQueries.length}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success rate: ${((passedTests / testQueries.length) * 100).toFixed(1)}%`);
  
  // Performance test
  console.log('\n⚡ Performance Test');
  console.log('-'.repeat(40));
  const perfQuery = "how much does a replacement motor cost for toyota camry 2018";
  const startTime = Date.now();
  
  for (let i = 0; i < 100; i++) {
    await QueryEnhancer.enhance(perfQuery);
  }
  
  const endTime = Date.now();
  const avgTime = (endTime - startTime) / 100;
  
  console.log(`Average enhancement time: ${avgTime.toFixed(2)}ms`);
  console.log(`Performance: ${avgTime < 10 ? '✅ Excellent' : avgTime < 50 ? '⚠️ Good' : '❌ Needs optimization'}`);
  
  // Test real-world impact
  console.log('\n🌍 Real-World Impact Examples');
  console.log('-'.repeat(40));
  
  const realWorldQueries = [
    "cheep breaks for my carr",
    "moter instalation guide",
    "BOS1234 vs MAK5678 which is better",
    "my engin is making weird noise help"
  ];
  
  for (const query of realWorldQueries) {
    const enhanced = await QueryEnhancer.enhance(query);
    console.log(`\n"${query}"`);
    console.log(`  → "${enhanced.normalized}"`);
    console.log(`  Intent: ${enhanced.intent}, Confidence: ${(enhanced.confidence_score * 100).toFixed(0)}%`);
    
    if (enhanced.spelling_corrections.size > 0) {
      const corrections = Array.from(enhanced.spelling_corrections.entries())
        .map(([wrong, right]) => `${wrong}→${right}`)
        .join(', ');
      console.log(`  Corrections: ${corrections}`);
    }
  }
  
  console.log('\n✨ Query Enhancement Testing Complete!\n');
}

// Run the tests
runTests().catch(console.error);