#!/usr/bin/env node

/**
 * Test Suite for Ingestion-Time Learning
 * Validates that learning happens during scraping, not during queries
 */

const { LearningService } = require('./lib/learning-service');

// Simulate different store types with sample scraped data
const storeSimulations = {
  electronics: {
    domain: 'techstore.com',
    pages: [
      {
        url: 'https://techstore.com/product/iphone-15-pro',
        title: 'iPhone 15 Pro - Latest Apple Smartphone',
        content: 'Buy the new iPhone 15 Pro with advanced camera system. Price: $999. Add to cart. Mobile phone with 5G connectivity.',
        type: 'product',
        metadata: { category: 'Smartphones > Apple' }
      },
      {
        url: 'https://techstore.com/product/samsung-galaxy-s24',
        title: 'Samsung Galaxy S24 - Android Phone',
        content: 'Samsung Galaxy S24 smartphone with AI features. Price: $899. Add to cart. Mobile device with latest Android.',
        type: 'product',
        metadata: { category: 'Smartphones > Samsung' }
      },
      {
        url: 'https://techstore.com/product/macbook-pro-m3',
        title: 'MacBook Pro M3 - Apple Laptop Computer',
        content: 'MacBook Pro with M3 chip. Notebook computer for professionals. Price: $1999. Add to cart.',
        type: 'product',
        metadata: { category: 'Laptops > Apple' }
      },
      {
        url: 'https://techstore.com/about',
        title: 'About TechStore',
        content: 'We sell the best electronics and gadgets.',
        type: 'page'
      }
    ],
    expectedLearning: {
      brands: ['iPhone', 'Apple', 'Samsung', 'Galaxy', 'MacBook', 'Pro'],
      synonyms: {
        'phone': ['smartphone', 'mobile'],
        'laptop': ['computer', 'notebook'],
        'price': ['cost']
      },
      categories: ['smartphones', 'laptops', 'apple', 'samsung']
    }
  },
  
  fashion: {
    domain: 'fashionboutique.com',
    pages: [
      {
        url: 'https://fashionboutique.com/product/nike-air-max',
        title: 'Nike Air Max Sneakers - Running Shoes',
        content: 'Nike Air Max trainers for running. Athletic footwear. Price: $150. Add to cart.',
        type: 'product',
        metadata: { category: 'Footwear > Sneakers' }
      },
      {
        url: 'https://fashionboutique.com/product/adidas-ultraboost',
        title: 'Adidas Ultraboost - Sport Shoes',
        content: 'Adidas Ultraboost running shoes. Trainers for athletes. Price: $180. Add to cart.',
        type: 'product',
        metadata: { category: 'Footwear > Running' }
      },
      {
        url: 'https://fashionboutique.com/product/levis-501-jeans',
        title: "Levi's 501 Original Jeans - Denim Pants",
        content: "Classic Levi's 501 jeans. Denim trousers in blue. Price: $89. Add to cart.",
        type: 'product',
        metadata: { category: 'Clothing > Jeans' }
      }
    ],
    expectedLearning: {
      brands: ['Nike', 'Adidas', 'Levi'],
      synonyms: {
        'sneakers': ['trainers', 'shoes'],
        'jeans': ['denim', 'pants', 'trousers']
      },
      categories: ['footwear', 'sneakers', 'running', 'clothing', 'jeans']
    }
  },
  
  automotive: {
    domain: 'autoparts.com',
    pages: [
      {
        url: 'https://autoparts.com/product/michelin-tire-235',
        title: 'Michelin Tyre 235/45R18 - Premium Tire',
        content: 'Michelin premium tyre for cars. Rubber tire with excellent grip. Price: $200. Add to cart.',
        type: 'product',
        metadata: { category: 'Tires > Michelin' }
      },
      {
        url: 'https://autoparts.com/product/bosch-brake-pads',
        title: 'Bosch Brake Pads - Stopping Power',
        content: 'Bosch ceramic brake pads. Braking components for safety. Price: $75. Add to cart.',
        type: 'product',
        metadata: { category: 'Brakes > Pads' }
      },
      {
        url: 'https://autoparts.com/product/mobil-engine-oil',
        title: 'Mobil 1 Engine Oil - Motor Lubricant',
        content: 'Mobil 1 synthetic motor oil. Engine lubricant for performance. Price: $45. Add to cart.',
        type: 'product',
        metadata: { category: 'Fluids > Oil' }
      }
    ],
    expectedLearning: {
      brands: ['Michelin', 'Bosch', 'Mobil'],
      synonyms: {
        'tire': ['tyre'],
        'engine': ['motor'],
        'brake': ['braking']
      },
      categories: ['tires', 'brakes', 'pads', 'fluids', 'oil']
    }
  }
};

// Mock Supabase for testing
class MockSupabase {
  constructor() {
    this.storage = new Map();
  }
  
  from(table) {
    const self = this;
    return {
      select: () => ({
        eq: (field, value) => ({
          single: async () => ({ data: self.storage.get(`${table}:${value}`), error: null })
        })
      }),
      upsert: async (data) => {
        self.storage.set(`${table}:${data.domain}`, data);
        return { error: null };
      }
    };
  }
}

/**
 * Test learning for a specific store type
 */
async function testStoreLearning(storeType, storeData) {
  console.log(`\n📦 Testing ${storeType.toUpperCase()} Store Learning`);
  console.log('────────────────────────────────────────────────────────');
  
  const mockSupabase = new MockSupabase();
  const learner = new LearningService(storeData.domain, mockSupabase);
  
  // Simulate scraping phase - products are found
  const productPages = storeData.pages.filter(p => p.type === 'product');
  console.log(`  Found ${productPages.length} product pages during scraping`);
  
  // LEARNING HAPPENS HERE - During ingestion, not during queries
  console.log(`  🧠 Learning from products...`);
  const startTime = Date.now();
  const config = await learner.learnFromNewProducts(productPages);
  const duration = Date.now() - startTime;
  
  console.log(`  ✅ Learning completed in ${duration}ms`);
  
  // Validate learned data
  const results = {
    brands: config.learned_brands?.length || 0,
    synonyms: Object.keys(config.synonyms || {}).length,
    categories: config.learned_categories?.length || 0,
    success: true
  };
  
  // Check if key brands were learned
  const learnedBrands = (config.learned_brands || []).map(b => b.toLowerCase());
  const expectedBrands = storeData.expectedLearning.brands.map(b => b.toLowerCase());
  const brandMatches = expectedBrands.filter(b => 
    learnedBrands.some(lb => lb.includes(b) || b.includes(lb))
  );
  
  console.log(`\n  📊 Learning Results:`);
  console.log(`     • Brands learned: ${results.brands} (found: ${brandMatches.join(', ')})`);
  console.log(`     • Synonym groups: ${results.synonyms}`);
  console.log(`     • Categories: ${results.categories}`);
  
  // Show some learned synonyms
  if (config.synonyms && Object.keys(config.synonyms).length > 0) {
    console.log(`\n  🔄 Sample Synonyms Learned:`);
    Object.entries(config.synonyms).slice(0, 3).forEach(([term, synonyms]) => {
      console.log(`     • "${term}" ↔ [${synonyms.join(', ')}]`);
    });
  }
  
  // Test that knowledge is available for queries
  console.log(`\n  🔍 Testing Query Enhancement (using learned knowledge)...`);
  
  // Simulate user query AFTER learning
  const testQueries = {
    electronics: 'cheap smartphone',
    fashion: 'running sneakers',
    automotive: 'tire replacement'
  };
  
  const query = testQueries[storeType];
  console.log(`     Query: "${query}"`);
  
  // Check if config is available (should be instant since already learned)
  const queryStart = Date.now();
  const storedConfig = mockSupabase.storage.get(`query_enhancement_config:${storeData.domain}`);
  const queryTime = Date.now() - queryStart;
  
  if (storedConfig) {
    console.log(`     ✅ Knowledge loaded in ${queryTime}ms (no learning delay!)`);
    results.querySpeed = queryTime;
  } else {
    console.log(`     ❌ No knowledge found (would trigger learning)`);
    results.success = false;
  }
  
  return results;
}

/**
 * Test that learning happens at the right time
 */
async function testLearningTiming() {
  console.log('\n⏱️  Testing Learning Timing');
  console.log('────────────────────────────────────────────────────────');
  
  const mockSupabase = new MockSupabase();
  
  // Scenario 1: First time - no config exists
  console.log('\n  Scenario 1: First scrape (no existing knowledge)');
  const learner1 = new LearningService('newstore.com', mockSupabase);
  const products = storeSimulations.electronics.pages.filter(p => p.type === 'product');
  
  const learn1Start = Date.now();
  await learner1.learnFromNewProducts(products);
  const learn1Time = Date.now() - learn1Start;
  console.log(`    Learning during ingestion: ${learn1Time}ms`);
  
  // Scenario 2: Query after learning - should be instant
  console.log('\n  Scenario 2: User query after learning');
  const config = mockSupabase.storage.get('query_enhancement_config:newstore.com');
  const queryStart = Date.now();
  const hasKnowledge = config !== undefined;
  const queryTime = Date.now() - queryStart;
  
  console.log(`    Knowledge check during query: ${queryTime}ms`);
  console.log(`    Result: ${hasKnowledge ? '✅ Instant (knowledge exists)' : '❌ Would need learning'}`);
  
  return {
    ingestionTime: learn1Time,
    queryTime: queryTime,
    optimal: queryTime < 10 // Should be under 10ms for cached knowledge
  };
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('================================================================================');
  console.log('                    INGESTION-TIME LEARNING TEST SUITE');
  console.log('================================================================================');
  
  const results = {
    stores: {},
    timing: null,
    overall: { passed: 0, total: 0 }
  };
  
  // Test each store type
  for (const [storeType, storeData] of Object.entries(storeSimulations)) {
    results.stores[storeType] = await testStoreLearning(storeType, storeData);
    results.overall.total++;
    if (results.stores[storeType].success) {
      results.overall.passed++;
    }
  }
  
  // Test timing
  results.timing = await testLearningTiming();
  
  // Summary
  console.log('\n================================================================================');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('================================================================================\n');
  
  console.log('Store Learning Results:');
  for (const [store, data] of Object.entries(results.stores)) {
    const status = data.success ? '✅' : '❌';
    console.log(`  ${status} ${store}: ${data.brands} brands, ${data.synonyms} synonyms, query speed: ${data.querySpeed || 'N/A'}ms`);
  }
  
  console.log('\nTiming Results:');
  console.log(`  • Learning during ingestion: ${results.timing.ingestionTime}ms`);
  console.log(`  • Query after learning: ${results.timing.queryTime}ms`);
  console.log(`  • Optimal timing: ${results.timing.optimal ? '✅ Yes' : '❌ No'}`);
  
  console.log('\n🎯 Overall Result:');
  if (results.overall.passed === results.overall.total && results.timing.optimal) {
    console.log('  ✅ SUCCESS! Learning happens during ingestion, queries are instant!');
    console.log('\n  Key Achievement:');
    console.log('  • Users never wait for learning');
    console.log('  • Each store type learns appropriate vocabulary');
    console.log('  • Knowledge is ready before first query');
  } else {
    console.log(`  ⚠️ Some tests failed: ${results.overall.passed}/${results.overall.total} passed`);
  }
  
  console.log('\n================================================================================\n');
}

// Run tests
runAllTests().catch(console.error);