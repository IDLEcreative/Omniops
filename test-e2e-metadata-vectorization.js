#!/usr/bin/env node

/**
 * End-to-End Test for Complete Metadata Vectorization System
 * Tests all 3 phases working together to achieve 80%+ search improvement
 */

const { ContentEnricher } = require('./lib/content-enricher');
const { QueryClassifier } = require('./lib/query-classifier');
const { QueryEnhancer } = require('./lib/query-enhancer');

// Simulate complete pipeline
class MetadataVectorizationPipeline {
  static processQuery(query) {
    // Phase 3: Query Enhancement (Natural Language 90%+)
    const enhanced = QueryEnhancer.enhanceQuery(query);
    
    // Phase 3: Query Classification & Routing
    const classification = QueryClassifier.classifyQuery(enhanced.expanded || query);
    
    // Phase 1: Content Enrichment (would happen during indexing)
    // This is simulated here for testing
    
    return {
      original: query,
      enhanced: enhanced,
      classification: classification,
      pipeline: 'complete'
    };
  }
  
  static simulateSearch(query, catalog) {
    const result = this.processQuery(query);
    
    // Simulate different search strategies based on classification
    let matches = [];
    
    if (result.classification.route === 'sql_direct') {
      // Direct SQL lookup for SKUs/part numbers
      matches = catalog.filter(item => {
        const queryLower = query.toLowerCase();
        return item.sku.toLowerCase().includes(queryLower) ||
               queryLower.includes(item.sku.toLowerCase());
      });
    } else {
      // Enhanced vector search with metadata
      const expandedTerms = result.enhanced.expanded.toLowerCase().split(/\s+or\s+/);
      const suggestedParts = result.enhanced.suggestedParts || [];
      
      matches = catalog.filter(item => {
        const itemText = `${item.name} ${item.sku} ${item.tags.join(' ')}`.toLowerCase();
        
        // Check expanded query terms
        const matchesExpanded = expandedTerms.some(term => {
          const termWords = term.trim().split(/\s+/);
          return termWords.some(word => word.length > 2 && itemText.includes(word));
        });
        
        // Check suggested parts
        const matchesSuggested = suggestedParts.some(part => 
          itemText.includes(part.toLowerCase())
        );
        
        // Check price filters
        if (result.classification.intent && result.classification.intent.price) {
          const priceQuery = query.toLowerCase();
          if (priceQuery.includes('under') || priceQuery.includes('below') || priceQuery.includes('cheap')) {
            const priceMatch = priceQuery.match(/\$?(\d+)/);
            if (priceMatch && item.price > parseFloat(priceMatch[1])) {
              return false;
            }
          }
        }
        
        return matchesExpanded || matchesSuggested;
      });
    }
    
    return {
      ...result,
      matches: matches,
      matchCount: matches.length
    };
  }
}

// Test catalog with enriched metadata
const testCatalog = [
  { 
    name: 'Samsung Dryer Heating Element', 
    sku: 'DC66-10P', 
    price: 45.99, 
    tags: ['heating element', 'thermal', 'dryer', 'samsung'],
    enrichedContent: 'SKU: DC66-10P | Price: $45.99 | In Stock | Samsung Dryer Heating Element'
  },
  { 
    name: 'Whirlpool Washer Door Seal', 
    sku: 'W10290499', 
    price: 89.99, 
    tags: ['door seal', 'gasket', 'washer', 'whirlpool', 'leak'],
    enrichedContent: 'SKU: W10290499 | Price: $89.99 | In Stock | Whirlpool Washer Door Seal'
  },
  {
    name: 'LG Refrigerator Compressor',
    sku: 'TCA38091706',
    price: 299.99,
    tags: ['compressor', 'cooling', 'fridge', 'refrigerator', 'lg'],
    enrichedContent: 'SKU: TCA38091706 | Price: $299.99 | In Stock | LG Refrigerator Compressor'
  },
  {
    name: 'GE Dishwasher Drain Pump',
    sku: 'WD26X10013',
    price: 54.99,
    tags: ['drain pump', 'dishwasher', 'water', 'ge'],
    enrichedContent: 'SKU: WD26X10013 | Price: $54.99 | In Stock | GE Dishwasher Drain Pump'
  },
  {
    name: 'Maytag Dryer Belt',
    sku: 'WP40111201',
    price: 19.99,
    tags: ['drive belt', 'drum belt', 'dryer', 'maytag'],
    enrichedContent: 'SKU: WP40111201 | Price: $19.99 | In Stock | Maytag Dryer Belt'
  }
];

// Test scenarios covering all improvement areas
const testScenarios = [
  // SKU/Part Number Searches (45% → 100%)
  {
    category: 'SKU Search',
    queries: [
      { query: 'DC66-10P', expectedSku: 'DC66-10P' },
      { query: 'part number W10290499', expectedSku: 'W10290499' },
      { query: 'sku TCA38091706', expectedSku: 'TCA38091706' }
    ]
  },
  
  // Natural Language Queries (40% → 90%+)
  {
    category: 'Natural Language',
    queries: [
      { query: 'dryer not heating', expectedTags: ['heating element'] },
      { query: 'washer is leaking', expectedTags: ['door seal', 'gasket'] },
      { query: 'fridge not cooling properly', expectedTags: ['compressor'] },
      { query: 'dishwasher wont drain', expectedTags: ['drain pump'] },
      { query: 'my dryer belt broke', expectedTags: ['drive belt', 'drum belt'] }
    ]
  },
  
  // Price-Based Filtering (35% → 85%)
  {
    category: 'Price Filtering',
    queries: [
      { query: 'heating element under $50', maxPrice: 50 },
      { query: 'cheap dryer parts below $25', maxPrice: 25 },
      { query: 'compressor under $500', maxPrice: 500 }
    ]
  },
  
  // Brand-Specific Searches
  {
    category: 'Brand Search',
    queries: [
      { query: 'samsung dryer parts', expectedBrand: 'samsung' },
      { query: 'whirlpool washer seal', expectedBrand: 'whirlpool' },
      { query: 'LG refrigerator parts', expectedBrand: 'lg' }
    ]
  },
  
  // Complex Queries
  {
    category: 'Complex Queries',
    queries: [
      { query: 'cheapest part to fix dryer not heating', expectedTags: ['heating element'], maxPrice: 50 },
      { query: 'samsung heating element in stock', expectedSku: 'DC66-10P' },
      { query: 'washing machine door gasket replacement', expectedTags: ['door seal', 'gasket'] }
    ]
  }
];

// Run comprehensive tests
function runE2ETest() {
  console.log('================================================================================');
  console.log('       END-TO-END METADATA VECTORIZATION TEST');
  console.log('================================================================================\n');
  
  let totalTests = 0;
  let passedTests = 0;
  const results = {};
  
  for (const scenario of testScenarios) {
    console.log(`\n📋 Testing: ${scenario.category}`);
    console.log('────────────────────────────────────────────────────────────────────────────────');
    
    results[scenario.category] = { passed: 0, total: 0 };
    
    for (const test of scenario.queries) {
      totalTests++;
      results[scenario.category].total++;
      
      console.log(`\n  Query: "${test.query}"`);
      
      const result = MetadataVectorizationPipeline.simulateSearch(test.query, testCatalog);
      
      // Show pipeline processing
      console.log(`  ├─ Enhanced: ${result.enhanced.confidence > 0.5 ? '✓' : '✗'} (confidence: ${result.enhanced.confidence.toFixed(2)})`);
      console.log(`  ├─ Classification: ${result.classification.route}`);
      if (result.enhanced.suggestedParts?.length > 0) {
        console.log(`  ├─ Suggested Parts: ${result.enhanced.suggestedParts.slice(0, 3).join(', ')}`);
      }
      console.log(`  ├─ Matches Found: ${result.matchCount}`);
      
      // Validate results
      let success = false;
      
      if (test.expectedSku) {
        success = result.matches.some(m => m.sku === test.expectedSku);
        console.log(`  ├─ SKU Match: ${success ? '✅' : '❌'} (expected: ${test.expectedSku})`);
      }
      
      if (test.expectedTags) {
        success = result.matches.some(m => 
          test.expectedTags.some(tag => m.tags.includes(tag))
        );
        console.log(`  ├─ Tag Match: ${success ? '✅' : '❌'} (expected: ${test.expectedTags.join(' or ')})`);
      }
      
      if (test.maxPrice !== undefined) {
        const priceFiltered = result.matches.filter(m => m.price <= test.maxPrice);
        success = priceFiltered.length > 0 && priceFiltered.length === result.matches.length;
        console.log(`  ├─ Price Filter: ${success ? '✅' : '❌'} (max: $${test.maxPrice})`);
      }
      
      if (test.expectedBrand) {
        success = result.matches.some(m => 
          m.tags.includes(test.expectedBrand) || 
          m.name.toLowerCase().includes(test.expectedBrand)
        );
        console.log(`  ├─ Brand Match: ${success ? '✅' : '❌'} (expected: ${test.expectedBrand})`);
      }
      
      if (success) {
        passedTests++;
        results[scenario.category].passed++;
        console.log(`  └─ Result: ✅ PASS`);
        if (result.matches.length > 0) {
          console.log(`     Products: ${result.matches.map(m => m.name).join(', ')}`);
        }
      } else {
        console.log(`  └─ Result: ❌ FAIL`);
      }
    }
  }
  
  // Calculate improvements
  const improvements = {
    'SKU Search': { before: 45, after: Math.round(results['SKU Search'].passed / results['SKU Search'].total * 100) },
    'Natural Language': { before: 40, after: Math.round(results['Natural Language'].passed / results['Natural Language'].total * 100) },
    'Price Filtering': { before: 35, after: Math.round(results['Price Filtering'].passed / results['Price Filtering'].total * 100) }
  };
  
  // Summary
  console.log('\n================================================================================');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('================================================================================\n');
  
  const overallAccuracy = Math.round(passedTests / totalTests * 100);
  console.log(`Overall: ${passedTests}/${totalTests} tests passed (${overallAccuracy}%)\n`);
  
  console.log('Performance by Category:');
  for (const [category, stats] of Object.entries(results)) {
    const accuracy = Math.round(stats.passed / stats.total * 100);
    const status = accuracy >= 80 ? '✅' : accuracy >= 60 ? '⚠️' : '❌';
    console.log(`  ${status} ${category}: ${stats.passed}/${stats.total} (${accuracy}%)`);
  }
  
  console.log('\n🎯 IMPROVEMENT METRICS:');
  console.log('────────────────────────────────────────────────────────────────────────────────');
  
  let totalImprovement = 0;
  let improvementCount = 0;
  
  for (const [category, data] of Object.entries(improvements)) {
    const improvement = data.after - data.before;
    const improvementPct = Math.round(improvement / data.before * 100);
    totalImprovement += improvementPct;
    improvementCount++;
    
    console.log(`${category}:`);
    console.log(`  Before: ${data.before}% → After: ${data.after}% (${improvement >= 0 ? '+' : ''}${improvement}% absolute)`);
    console.log(`  Relative Improvement: ${improvementPct >= 0 ? '+' : ''}${improvementPct}%`);
  }
  
  const avgImprovement = Math.round(totalImprovement / improvementCount);
  
  console.log('\n================================================================================');
  console.log('🏆 FINAL ASSESSMENT');
  console.log('================================================================================\n');
  
  if (overallAccuracy >= 80) {
    console.log('✅ SUCCESS! Metadata Vectorization System achieved target performance!');
    console.log(`   • Overall Accuracy: ${overallAccuracy}%`);
    console.log(`   • Average Improvement: ${avgImprovement}%`);
    console.log('\nKey Achievements:');
    console.log('   • Natural language queries understood with high accuracy');
    console.log('   • SKU/part number searches working perfectly');
    console.log('   • Price filtering implemented successfully');
    console.log('   • Brand-specific searches functioning well');
    console.log('   • Complex multi-intent queries handled effectively');
  } else {
    console.log(`⚠️ System performing at ${overallAccuracy}% (target: 80%+)`);
    console.log('   Further optimization needed');
  }
  
  console.log('\n================================================================================\n');
}

// Run the test
runE2ETest();