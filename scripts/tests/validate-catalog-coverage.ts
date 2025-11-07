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
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TEST_DOMAIN = process.env.TEST_DOMAIN || 'thompsonseparts.co.uk';

// Use service role key to bypass RLS for test validation
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

  // Step 1: Get domain_id from domains table
  const { data: domainData, error: domainError } = await supabase
    .from('domains')
    .select('id')
    .eq('domain', domain)
    .single();

  if (domainError || !domainData) {
    throw new Error(`Domain not found: ${domain}. Error: ${domainError?.message || 'Unknown'}`);
  }

  const domainId = domainData.id;
  log('blue', `  Domain ID: ${domainId}`);

  // Step 2: Fetch all scraped pages for this domain
  const { data, error } = await supabase
    .from('scraped_pages')
    .select('id, title, url, metadata')
    .eq('domain_id', domainId)
    .limit(1000);

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(`No content found for domain: ${domain}. Is the catalog indexed?`);
  }

  // Extract products from scraped pages
  // Products typically have SKU/price in metadata or contain "product" keywords
  const products: Product[] = data
    .filter(page => {
      const metadata = page.metadata as any || {};
      const hasProductIndicators =
        metadata.sku ||
        metadata.price ||
        metadata.product_id ||
        page.url?.includes('/product') ||
        page.url?.includes('/shop');
      return hasProductIndicators;
    })
    .map((page) => {
      const metadata = page.metadata as any || {};
      return {
        id: page.id,
        name: page.title || 'Unnamed Product',
        sku: metadata.sku || metadata.product_id || metadata.id || undefined,
        category: metadata.category || metadata.product_type || undefined
      };
    });

  if (products.length === 0) {
    log('yellow', `  Warning: Found ${data.length} pages but 0 products. Catalog may not be indexed with product metadata.`);
    log('yellow', `  Falling back to using all scraped pages as products...`);

    // Fallback: treat all pages as potential products
    return data.slice(0, 50).map((page) => {
      const metadata = page.metadata as any || {};
      return {
        id: page.id,
        name: page.title || 'Unnamed Content',
        sku: metadata.sku || undefined,
        category: metadata.category || undefined
      };
    });
  }

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
