#!/usr/bin/env npx tsx
/**
 * Test script for intelligent category mapping
 */

import { createClient } from '@supabase/supabase-js';
import { CategoryMapper } from './lib/category-mapper';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCategoryMapping() {
  console.log('🔍 Testing Intelligent Category Mapping System\n');
  
  const mapper = new CategoryMapper(supabase);
  
  // Test 1: Build category mappings from existing data
  console.log('Test 1: Building category mappings from scraped data...');
  const startTime = Date.now();
  const mappings = await mapper.buildCategoryMappings();
  const buildTime = Date.now() - startTime;
  
  console.log(`✅ Built ${mappings.size} category mappings in ${buildTime}ms`);
  
  // Display top categories
  console.log('\n📊 Top Categories Found:');
  const sortedCategories = Array.from(mappings.entries())
    .sort((a, b) => b[1].product_count - a[1].product_count)
    .slice(0, 10);
  
  for (const [name, mapping] of sortedCategories) {
    console.log(`  - ${name}: ${mapping.product_count} products (confidence: ${(mapping.confidence * 100).toFixed(1)}%)`);
  }
  
  // Test 2: Test category detection for specific queries
  console.log('\n\nTest 2: Testing category detection for queries...');
  
  const testQueries = [
    'Cifa mixer pump',
    'Teng torque wrenches', 
    'Kinshofer pin & bush kit',
    'pump parts',
    'mixer equipment'
  ];
  
  for (const query of testQueries) {
    console.log(`\n🔎 Query: "${query}"`);
    
    // Simulate search results (in real usage, these come from searchSimilarContent)
    const { data: searchResults } = await supabase
      .from('scraped_pages')
      .select('url, title, content')
      .or(`title.ilike.%${query.split(' ').join('%')}%,content.ilike.%${query.split(' ').join('%')}%`)
      .limit(10);
    
    if (searchResults && searchResults.length > 0) {
      const categoryInfo = await mapper.findCategoryForQuery(query, searchResults);
      
      if (categoryInfo) {
        console.log(`  ✅ Suggested category: "${categoryInfo.category}"`);
        console.log(`     Confidence: ${(categoryInfo.confidence * 100).toFixed(1)}%`);
        if (categoryInfo.url) {
          console.log(`     Category URL: ${categoryInfo.url}`);
        }
      } else {
        console.log(`  ❌ No category detected`);
      }
      
      console.log(`     Found ${searchResults.length} matching products`);
    } else {
      console.log(`  ⚠️ No search results found`);
    }
  }
  
  // Test 3: Persist mappings
  console.log('\n\nTest 3: Persisting mappings to database...');
  await mapper.persistMappings(mappings);
  console.log('✅ Mappings persisted to structured_extractions table');
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📈 Category Mapping Test Summary:');
  console.log(`  - Total categories discovered: ${mappings.size}`);
  console.log(`  - Build time: ${buildTime}ms`);
  console.log(`  - Average products per category: ${
    Math.round(Array.from(mappings.values()).reduce((sum, m) => sum + m.product_count, 0) / mappings.size)
  }`);
  console.log('='.repeat(50));
}

// Run tests
testCategoryMapping()
  .then(() => {
    console.log('\n✅ All tests completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });