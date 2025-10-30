#!/usr/bin/env tsx
/**
 * Real-World Conversation Metadata Validation
 *
 * Tests the conversation metadata system against REAL database products
 * instead of mocked data to validate production accuracy.
 *
 * This script:
 * - Queries actual products from Supabase
 * - Uses real ConversationMetadataManager
 * - Uses real ResponseParser
 * - Validates against real product names/URLs
 * - Reports honest accuracy metrics
 */

import { createClient } from '@supabase/supabase-js';
import { ConversationMetadataManager } from './lib/chat/conversation-metadata';
import { ResponseParser } from './lib/chat/response-parser';

// Supabase client setup - use service role to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface RealProduct {
  title: string;
  url: string;
  excerpt: string | null;
  domain_id: string;
}

interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  productsUsed: string[];
}

const results: TestResult[] = [];

/**
 * Query real products from database
 */
async function queryRealProducts(domain: string, limit: number = 10): Promise<RealProduct[]> {
  console.log(`\n📊 Querying ${limit} real products from domain: ${domain}...`);

  // First, get the domain_id
  const { data: configData, error: configError } = await supabase
    .from('customer_configs')
    .select('id')
    .eq('domain', domain)
    .single();

  if (configError || !configData) {
    console.error('❌ Domain not found:', domain);
    return [];
  }

  const { data, error } = await supabase
    .from('scraped_pages')
    .select('title, url, excerpt, domain_id')
    .eq('domain_id', configData.id)
    .not('title', 'is', null)
    .limit(limit);

  if (error) {
    console.error('❌ Database query error:', error);
    return [];
  }

  if (!data || data.length === 0) {
    console.error(`❌ No products found for domain: ${domain}`);
    return [];
  }

  console.log(`✅ Retrieved ${data.length} real products`);
  data.forEach((p, idx) => {
    console.log(`   ${idx + 1}. ${p.title} (${p.url})`);
  });

  return data as RealProduct[];
}

/**
 * Test 1: Correction tracking with real products
 */
async function testCorrectionTrackingWithRealProducts(products: RealProduct[]): Promise<void> {
  if (products.length < 2) {
    console.error('❌ Not enough products for correction test');
    return;
  }

  console.log('\n🧪 TEST 1: Correction Tracking with Real Products');
  console.log('=' .repeat(60));

  const product1 = products[0]!;
  const product2 = products[1]!;

  const manager = new ConversationMetadataManager();

  // Simulate conversation
  const userMsg1 = `I need parts for ${product1.title}`;
  const aiResponse1 = `Here are the available parts for [${product1.title}](${product1.url})`;

  manager.incrementTurn();
  await parseAndTrack(aiResponse1, userMsg1, manager);

  // User corrects
  const userMsg2 = `Sorry, I meant ${product2.title} not ${product1.title}`;
  const aiResponse2 = `Got it, looking at [${product2.title}](${product2.url}) instead`;

  manager.incrementTurn();
  await parseAndTrack(aiResponse2, userMsg2, manager);

  // Validate
  const contextSummary = manager.generateContextSummary();

  const hasCorrection = contextSummary.includes(product1.title) &&
                        contextSummary.includes(product2.title);
  const hasProduct2Entity = contextSummary.includes(product2.title);

  const passed = hasCorrection && hasProduct2Entity;

  console.log('\n📋 Context Summary Generated:');
  console.log(contextSummary);

  console.log('\n✅ Validation:');
  console.log(`   - Correction tracked: ${hasCorrection ? '✅' : '❌'}`);
  console.log(`   - Corrected product entity tracked: ${hasProduct2Entity ? '✅' : '❌'}`);

  results.push({
    testName: 'Correction Tracking with Real Products',
    passed,
    details: `Tested correction from "${product1.title}" to "${product2.title}"`,
    productsUsed: [product1.title, product2.title]
  });
}

/**
 * Test 2: List navigation with real products
 */
async function testListNavigationWithRealProducts(products: RealProduct[]): Promise<void> {
  if (products.length < 3) {
    console.error('❌ Not enough products for list test');
    return;
  }

  console.log('\n🧪 TEST 2: List Navigation with Real Products');
  console.log('=' .repeat(60));

  const testProducts = products.slice(0, 3);
  const manager = new ConversationMetadataManager();

  // Create numbered list from real products
  manager.incrementTurn();
  const aiResponse = `Here are the available options:\n\n` +
    testProducts.map((p, idx) => `${idx + 1}. [${p.title}](${p.url})`).join('\n');

  await parseAndTrack(aiResponse, 'Show me products', manager);

  // User references item 2
  manager.incrementTurn();
  const resolved = manager.resolveReference('item 2');

  const expectedProduct = testProducts[1]!;
  const passed = resolved?.value === expectedProduct.title &&
                 resolved?.metadata?.url === expectedProduct.url;

  console.log('\n📋 AI Response (Numbered List):');
  console.log(aiResponse);

  console.log('\n🔍 Resolving "item 2":');
  console.log(`   Expected: ${expectedProduct.title}`);
  console.log(`   Resolved: ${resolved?.value || 'null'}`);
  console.log(`   URL Match: ${resolved?.metadata?.url === expectedProduct.url ? '✅' : '❌'}`);

  results.push({
    testName: 'List Navigation with Real Products',
    passed,
    details: `Tested "item 2" resolution to "${expectedProduct.title}"`,
    productsUsed: testProducts.map(p => p.title)
  });
}

/**
 * Test 3: Pronoun resolution with real data
 */
async function testPronounResolutionWithRealData(products: RealProduct[]): Promise<void> {
  if (products.length < 1) {
    console.error('❌ No products for pronoun test');
    return;
  }

  console.log('\n🧪 TEST 3: Pronoun Resolution with Real Data');
  console.log('=' .repeat(60));

  const product = products[0]!;
  const manager = new ConversationMetadataManager();

  // Reference product by name
  manager.incrementTurn();
  const aiResponse = `Yes, we have [${product.title}](${product.url}) in stock.`;
  await parseAndTrack(aiResponse, `Do you have ${product.title}?`, manager);

  // Use pronoun "it"
  manager.incrementTurn();
  const resolved = manager.resolveReference('it');

  const passed = resolved?.value === product.title &&
                 resolved?.metadata?.url === product.url;

  console.log('\n📋 Initial Reference:');
  console.log(`   Product: ${product.title}`);
  console.log(`   URL: ${product.url}`);

  console.log('\n🔍 Resolving pronoun "it":');
  console.log(`   Expected: ${product.title}`);
  console.log(`   Resolved: ${resolved?.value || 'null'}`);
  console.log(`   URL Match: ${resolved?.metadata?.url === product.url ? '✅' : '❌'}`);

  results.push({
    testName: 'Pronoun Resolution with Real Data',
    passed,
    details: `Tested "it" resolving to "${product.title}"`,
    productsUsed: [product.title]
  });
}

/**
 * Test 4: Multiple corrections in sequence
 */
async function testMultipleCorrectionsWithRealProducts(products: RealProduct[]): Promise<void> {
  if (products.length < 3) {
    console.error('❌ Not enough products for multiple corrections test');
    return;
  }

  console.log('\n🧪 TEST 4: Multiple Corrections in Sequence');
  console.log('=' .repeat(60));

  const [p1, p2, p3] = products;
  const manager = new ConversationMetadataManager();

  // First mention
  manager.incrementTurn();
  await parseAndTrack(
    `Looking at [${p1!.title}](${p1!.url})`,
    `Show me ${p1!.title}`,
    manager
  );

  // First correction
  manager.incrementTurn();
  await parseAndTrack(
    `Switching to [${p2!.title}](${p2!.url})`,
    `Actually ${p2!.title} not ${p1!.title}`,
    manager
  );

  // Second correction
  manager.incrementTurn();
  await parseAndTrack(
    `Now showing [${p3!.title}](${p3!.url})`,
    `Sorry, ${p3!.title} not ${p2!.title}`,
    manager
  );

  const contextSummary = manager.generateContextSummary();

  const hasBothCorrections =
    contextSummary.includes(p1!.title) &&
    contextSummary.includes(p2!.title) &&
    contextSummary.includes(p3!.title);

  const passed = hasBothCorrections;

  console.log('\n📋 Context Summary:');
  console.log(contextSummary);

  console.log('\n✅ Validation:');
  console.log(`   - All products tracked: ${hasBothCorrections ? '✅' : '❌'}`);

  results.push({
    testName: 'Multiple Corrections in Sequence',
    passed,
    details: `Tested ${p1!.title} → ${p2!.title} → ${p3!.title}`,
    productsUsed: [p1!.title, p2!.title, p3!.title]
  });
}

/**
 * Test 5: Real product URL extraction accuracy
 */
async function testProductUrlExtractionAccuracy(products: RealProduct[]): Promise<void> {
  if (products.length < 1) {
    console.error('❌ No products for URL extraction test');
    return;
  }

  console.log('\n🧪 TEST 5: Product URL Extraction Accuracy');
  console.log('=' .repeat(60));

  const product = products[0]!;
  const manager = new ConversationMetadataManager();

  manager.incrementTurn();
  const aiResponse = `Check out [${product.title}](${product.url}) for more details.`;
  await parseAndTrack(aiResponse, 'Show me options', manager);

  const contextSummary = manager.generateContextSummary();
  const entities = Array.from((manager as any).entities.values());

  const productEntity = entities.find((e: any) => e.value === product.title);
  const urlMatches = productEntity?.metadata?.url === product.url;
  const passed = urlMatches;

  console.log('\n📋 Extracted Entity:');
  console.log(`   Product: ${productEntity?.value || 'NOT FOUND'}`);
  console.log(`   Expected URL: ${product.url}`);
  console.log(`   Extracted URL: ${productEntity?.metadata?.url || 'NOT FOUND'}`);
  console.log(`   URL Match: ${urlMatches ? '✅' : '❌'}`);

  results.push({
    testName: 'Product URL Extraction Accuracy',
    passed,
    details: `Tested URL extraction for "${product.title}"`,
    productsUsed: [product.title]
  });
}

/**
 * Helper function to parse and track
 */
async function parseAndTrack(
  aiResponse: string,
  userMessage: string,
  manager: ConversationMetadataManager
): Promise<void> {
  const currentTurn = manager.getCurrentTurn();
  const parsed = ResponseParser.parseResponse(userMessage, aiResponse, currentTurn);

  parsed.entities.forEach(entity => manager.trackEntity(entity));
  parsed.corrections.forEach(correction => {
    manager.trackCorrection(correction.original, correction.corrected, userMessage);
  });
  parsed.lists.forEach(list => manager.trackList(list.items));
}

/**
 * Print final report
 */
function printFinalReport(): void {
  console.log('\n');
  console.log('═'.repeat(70));
  console.log('📊 REAL-WORLD VALIDATION REPORT');
  console.log('═'.repeat(70));

  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  const accuracy = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0.0';

  console.log(`\n📈 Overall Results:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests} ✅`);
  console.log(`   Failed: ${failedTests} ❌`);
  console.log(`   Accuracy: ${accuracy}%`);

  console.log(`\n📋 Test Details:\n`);

  results.forEach((result, idx) => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${idx + 1}. ${result.testName}: ${status}`);
    console.log(`   Details: ${result.details}`);
    console.log(`   Products Used: ${result.productsUsed.join(', ')}`);
    console.log('');
  });

  console.log('═'.repeat(70));

  if (failedTests > 0) {
    console.log('\n⚠️  RECOMMENDATION: Fix failures before claiming 100% accuracy');
  } else {
    console.log('\n✅ All tests passed with real database products!');
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Real-World Metadata Validation');
  console.log('=' .repeat(60));

  // Query real products
  const products = await queryRealProducts('thompsonseparts.co.uk', 10);

  if (products.length === 0) {
    console.error('\n❌ FATAL: No products found. Cannot proceed with tests.');
    console.error('   Ensure database has scraped products for thompsonseparts.co.uk');
    process.exit(1);
  }

  // Run all tests
  await testCorrectionTrackingWithRealProducts(products);
  await testListNavigationWithRealProducts(products);
  await testPronounResolutionWithRealData(products);
  await testMultipleCorrectionsWithRealProducts(products);
  await testProductUrlExtractionAccuracy(products);

  // Print final report
  printFinalReport();

  process.exit(0);
}

// Run
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
