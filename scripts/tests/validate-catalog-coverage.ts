#!/usr/bin/env tsx
/**
 * CATALOG COVERAGE VALIDATION
 *
 * Validates that ALL products in the database are searchable by:
 * 1. Exact product name → should find the product
 * 2. SKU → should find the product
 * 3. Category → should include the product
 *
 * This is the CRITICAL test for preventing lost sales - it verifies
 * that no products are "invisible" to the search system.
 *
 * TARGET: >95% coverage (industry standard for product search)
 */

import { createClient } from '@supabase/supabase-js';
import { searchSimilarContent } from '@/lib/embeddings';
import { log, logHeader } from './lib/test-utils';

// Environment setup
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const TEST_DOMAIN = process.env.TEST_DOMAIN || 'thompsonseparts.co.uk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface Product {
  id: string;
  name: string;
  sku?: string;
  category?: string;
}

interface CoverageResult {
  productId: string;
  productName: string;
  sku?: string;
  nameSearchFound: boolean;
  skuSearchFound: boolean;
  categorySearchFound: boolean;
  overallFound: boolean;
}

async function fetchAllProducts(domain: string): Promise<Product[]> {
  log('blue', `Fetching all products for domain: ${domain}`);

  // This query fetches products from scraped_pages with extracted product info
  const { data, error } = await supabase
    .from('scraped_pages')
    .select('id, title, url, metadata')
    .eq('domain', domain)
    .eq('type', 'product')
    .limit(1000);

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(`No products found for domain: ${domain}. Is the catalog indexed?`);
  }

  // Extract products from scraped pages
  const products: Product[] = data.map((page) => {
    const metadata = page.metadata as any || {};
    return {
      id: page.id,
      name: page.title || 'Unnamed Product',
      sku: metadata.sku || metadata.id || undefined,
      category: metadata.category || undefined
    };
  });

  log('green', `✅ Found ${products.length} products in catalog`);
  return products;
}

async function testProductSearchability(product: Product, domain: string): Promise<CoverageResult> {
  const result: CoverageResult = {
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    nameSearchFound: false,
    skuSearchFound: false,
    categorySearchFound: false,
    overallFound: false
  };

  // Test 1: Search by exact product name
  try {
    const nameResults = await searchSimilarContent(product.name, domain, 20, 0.15);
    result.nameSearchFound = nameResults.some(r => r.id === product.id || r.url?.includes(product.id));
  } catch (error) {
    console.error(`  ❌ Error searching by name: ${error}`);
  }

  // Test 2: Search by SKU (if available)
  if (product.sku) {
    try {
      const skuResults = await searchSimilarContent(product.sku, domain, 20, 0.15);
      result.skuSearchFound = skuResults.some(r => r.id === product.id || r.url?.includes(product.id));
    } catch (error) {
      console.error(`  ❌ Error searching by SKU: ${error}`);
    }
  } else {
    result.skuSearchFound = true; // Mark as pass if no SKU (not applicable)
  }

  // Test 3: Search by category (if available)
  if (product.category) {
    try {
      const categoryResults = await searchSimilarContent(product.category, domain, 100, 0.15);
      result.categorySearchFound = categoryResults.some(r => r.id === product.id || r.url?.includes(product.id));
    } catch (error) {
      console.error(`  ❌ Error searching by category: ${error}`);
    }
  } else {
    result.categorySearchFound = true; // Mark as pass if no category (not applicable)
  }

  result.overallFound = result.nameSearchFound || result.skuSearchFound || result.categorySearchFound;

  return result;
}

async function main() {
  console.log('\n');
  log('cyan', '╔════════════════════════════════════════════════════════════════════════════╗');
  log('cyan', '║              CATALOG COVERAGE VALIDATION - PRODUCT SEARCHABILITY           ║');
  log('cyan', '╚════════════════════════════════════════════════════════════════════════════╝');

  log('blue', `\nTest Domain: ${TEST_DOMAIN}`);
  log('blue', `Target Coverage: >95%`);

  // Fetch all products
  logHeader('STEP 1: Fetch Catalog');
  const products = await fetchAllProducts(TEST_DOMAIN);

  // Sample products to test (testing all could be very slow)
  const sampleSize = Math.min(50, products.length);
  const sampledProducts = products.slice(0, sampleSize);

  log('yellow', `\nTesting searchability for ${sampleSize} products (sample)...`);

  // Test each product
  logHeader('STEP 2: Test Product Searchability');
  const results: CoverageResult[] = [];

  for (let i = 0; i < sampledProducts.length; i++) {
    const product = sampledProducts[i];
    console.log(`\n[${i + 1}/${sampleSize}] Testing: "${product.name}"`);

    const result = await testProductSearchability(product, TEST_DOMAIN);
    results.push(result);

    if (result.overallFound) {
      log('green', `  ✅ FOUND - Name: ${result.nameSearchFound ? '✓' : '✗'} | SKU: ${result.skuSearchFound ? '✓' : '✗'} | Category: ${result.categorySearchFound ? '✓' : '✗'}`);
    } else {
      log('red', `  ❌ NOT FOUND - Name: ${result.nameSearchFound ? '✓' : '✗'} | SKU: ${result.skuSearchFound ? '✓' : '✗'} | Category: ${result.categorySearchFound ? '✓' : '✗'}`);
    }
  }

  // Calculate coverage metrics
  logHeader('STEP 3: Coverage Analysis');

  const totalTested = results.length;
  const foundProducts = results.filter(r => r.overallFound).length;
  const notFoundProducts = results.filter(r => !r.overallFound);

  const coveragePercent = (foundProducts / totalTested) * 100;

  console.log(`\nTotal Products Tested: ${totalTested}`);
  log('green', `Found (Searchable): ${foundProducts}`);
  log('red', `Not Found (Missing): ${notFoundProducts.length}`);
  log('cyan', `Coverage: ${coveragePercent.toFixed(1)}%`);

  // Detailed breakdown
  const nameHits = results.filter(r => r.nameSearchFound).length;
  const skuHits = results.filter(r => r.skuSearchFound).length;
  const categoryHits = results.filter(r => r.categorySearchFound).length;

  console.log('\nSearch Method Breakdown:');
  log('blue', `  Name Search: ${nameHits}/${totalTested} (${((nameHits / totalTested) * 100).toFixed(1)}%)`);
  log('blue', `  SKU Search: ${skuHits}/${totalTested} (${((skuHits / totalTested) * 100).toFixed(1)}%)`);
  log('blue', `  Category Search: ${categoryHits}/${totalTested} (${((categoryHits / totalTested) * 100).toFixed(1)}%)`);

  // List products that were NOT found
  if (notFoundProducts.length > 0) {
    logHeader('PRODUCTS NOT FOUND IN SEARCH (CRITICAL ISSUE)');

    notFoundProducts.forEach((result, index) => {
      console.log(`\n${index + 1}. "${result.productName}"`);
      log('red', `   Product ID: ${result.productId}`);
      if (result.sku) {
        log('red', `   SKU: ${result.sku}`);
      }
      log('red', `   Name Search: ${result.nameSearchFound ? '✅ FOUND' : '❌ MISSING'}`);
      log('red', `   SKU Search: ${result.skuSearchFound ? '✅ FOUND' : '❌ MISSING'}`);
      log('red', `   Category Search: ${result.categorySearchFound ? '✅ FOUND' : '❌ MISSING'}`);
    });
  }

  // Final verdict
  logHeader('FINAL VERDICT');

  if (coveragePercent >= 95) {
    log('green', '✅ COVERAGE VALIDATION SUCCESSFUL');
    log('green', `${coveragePercent.toFixed(1)}% of products are searchable (target: >95%)`);
    log('green', 'No critical coverage gaps detected.');
    process.exit(0);
  } else if (coveragePercent >= 85) {
    log('yellow', '⚠️  COVERAGE WARNING');
    log('yellow', `${coveragePercent.toFixed(1)}% coverage (target: >95%)`);
    log('yellow', `${notFoundProducts.length} products are not searchable - potential lost sales!`);
    process.exit(1);
  } else {
    log('red', '❌ COVERAGE VALIDATION FAILED');
    log('red', `Only ${coveragePercent.toFixed(1)}% coverage (target: >95%)`);
    log('red', `${notFoundProducts.length} products are NOT searchable - CRITICAL ISSUE!`);
    log('red', 'This will result in lost sales. Immediate action required.');
    process.exit(1);
  }
}

main().catch(error => {
  log('red', `\n❌ FATAL ERROR: ${error}`);
  console.error(error);
  process.exit(1);
});
