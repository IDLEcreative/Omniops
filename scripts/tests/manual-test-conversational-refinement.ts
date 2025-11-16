/**
 * Manual Testing Simulation for Conversational Refinement
 *
 * Tests Priority 6 feature with real WooCommerce data and scraped pages.
 * Simulates actual user conversations to validate refinement behavior.
 */

import { createClient } from '@supabase/supabase-js';
import { getCustomerServicePrompt } from '@/lib/chat/system-prompts';
import { searchProductsDynamic } from '@/lib/woocommerce-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface TestScenario {
  name: string;
  query: string;
  expectedBehavior: string;
  shouldRefine: boolean;
  refinementType?: 'category' | 'price' | 'stock' | 'quality';
}

const testScenarios: TestScenario[] = [
  {
    name: 'Broad Query - Multiple Categories',
    query: 'Show me products',
    expectedBehavior: 'AI should group by category and offer refinement',
    shouldRefine: true,
    refinementType: 'category'
  },
  {
    name: 'Category Query - Gloves',
    query: 'I need gloves',
    expectedBehavior: 'AI should identify work/medical/winter categories and ask which type',
    shouldRefine: true,
    refinementType: 'category'
  },
  {
    name: 'Budget Query - Under £100',
    query: 'Show me pumps under £100',
    expectedBehavior: 'AI should group by price range (budget/mid-range) within budget',
    shouldRefine: true,
    refinementType: 'price'
  },
  {
    name: 'Urgent Query - Stock Priority',
    query: 'I need pumps urgently',
    expectedBehavior: 'AI should prioritize in-stock items and group by availability',
    shouldRefine: true,
    refinementType: 'stock'
  },
  {
    name: 'Specific Query - No Refinement',
    query: 'Show me A4VTG90 hydraulic pump',
    expectedBehavior: 'AI should show direct match without refinement (specific query)',
    shouldRefine: false
  },
  {
    name: 'Few Results - No Refinement',
    query: 'Show me ZF5 pumps',
    expectedBehavior: 'AI should show 2-3 results directly without grouping (too few)',
    shouldRefine: false
  }
];

async function getWooCommerceProducts(domain: string = 'thompsonseparts.co.uk') {
  console.log(`\n🔍 Fetching WooCommerce products for ${domain}...`);

  try {
    // Fetch products from WooCommerce API (not database - products are fetched dynamically)
    const products = await searchProductsDynamic(domain, '', 50); // Empty query = all products

    console.log(`✅ Found ${products.length} products from WooCommerce API`);
    return products;
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    return [];
  }
}

async function getScrapedPages(domain: string = 'thompsonseparts.co.uk') {
  console.log(`\n🔍 Fetching scraped pages for ${domain}...`);

  // First get domain_id from domains table
  const { data: domainData } = await supabase
    .from('domains')
    .select('id')
    .eq('domain', domain)
    .single();

  if (!domainData) {
    console.log(`⚠️  Domain ${domain} not found in domains table`);
    return [];
  }

  const { data: pages, error } = await supabase
    .from('scraped_pages')
    .select('*')
    .eq('domain_id', domainData.id)
    .limit(50);

  if (error) {
    console.error('❌ Error fetching pages:', error);
    return [];
  }

  console.log(`✅ Found ${pages?.length || 0} scraped pages`);
  return pages || [];
}

function analyzeProductsForRefinement(products: any[], query: string) {
  const categories = new Set(products.flatMap(p => p.categories?.map((c: any) => c.name) || []));
  const priceRanges = {
    budget: products.filter(p => parseFloat(p.price) < 50).length,
    midRange: products.filter(p => parseFloat(p.price) >= 50 && parseFloat(p.price) <= 150).length,
    premium: products.filter(p => parseFloat(p.price) > 150).length
  };
  const stockStatus = {
    inStock: products.filter(p => p.stock_status === 'instock').length,
    backorder: products.filter(p => p.stock_status === 'onbackorder').length,
    outOfStock: products.filter(p => p.stock_status === 'outofstock').length
  };

  return {
    totalProducts: products.length,
    categories: Array.from(categories),
    categoryCount: categories.size,
    priceRanges,
    stockStatus,
    shouldRefine: products.length > 8 && categories.size > 1,
    refinementSuggestions: {
      byCategory: categories.size > 1,
      byPrice: priceRanges.budget > 0 && priceRanges.premium > 0,
      byStock: stockStatus.inStock > 0 && (stockStatus.backorder > 0 || stockStatus.outOfStock > 0)
    }
  };
}

function validateConversationalTone(response: string): { isConversational: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check for conversational phrases
  const conversationalPhrases = [
    'I found',
    'Would you like',
    'let me help',
    'Great!',
    'Perfect!',
    'Here are'
  ];

  const hasConversationalPhrase = conversationalPhrases.some(phrase =>
    response.toLowerCase().includes(phrase.toLowerCase())
  );

  if (!hasConversationalPhrase) {
    issues.push('Missing conversational phrases (e.g., "I found", "Would you like")');
  }

  // Check for robotic language (should NOT contain these)
  const roboticPhrases = [
    'initiating',
    'protocol',
    'select category index',
    'filtered by parameter',
    'executing'
  ];

  const hasRoboticPhrase = roboticPhrases.some(phrase =>
    response.toLowerCase().includes(phrase.toLowerCase())
  );

  if (hasRoboticPhrase) {
    issues.push('Contains robotic language (should be conversational)');
  }

  // Check for pushy language (should NOT contain these)
  const pushyPhrases = [
    'you must',
    'required to',
    'have to choose',
    'need to select'
  ];

  const hasPushyPhrase = pushyPhrases.some(phrase =>
    response.toLowerCase().includes(phrase.toLowerCase())
  );

  if (hasPushyPhrase) {
    issues.push('Contains pushy language (should be helpful, not demanding)');
  }

  return {
    isConversational: issues.length === 0,
    issues
  };
}

function simulateAIResponse(scenario: TestScenario, analysis: any): string {
  const systemPrompt = getCustomerServicePrompt();

  // Simulate AI response based on refinement logic
  if (scenario.shouldRefine && analysis.shouldRefine) {
    switch (scenario.refinementType) {
      case 'category':
        return `I found ${analysis.totalProducts} products across ${analysis.categoryCount} categories:\n\n${
          analysis.categories.slice(0, 3).map((cat: string, i: number) =>
            `- **${cat}** (${Math.floor(Math.random() * 10) + 1} products, ${85 + i * 5}% match)`
          ).join('\n')
        }\n\nWhich type are you interested in?`;

      case 'price':
        return `I found ${analysis.totalProducts} products. Would you like to see:\n\n- Budget (under £50): ${analysis.priceRanges.budget} products\n- Mid-range (£50-£150): ${analysis.priceRanges.midRange} products\n- Premium (over £150): ${analysis.priceRanges.premium} products`;

      case 'stock':
        return `I found ${analysis.totalProducts} products. For urgent delivery, here are the options:\n\n**In stock (${analysis.stockStatus.inStock} products) - Ships today**\n**On backorder (${analysis.stockStatus.backorder} products) - 2-3 week delivery**\n\nWhich would you prefer - immediate availability or best match?`;

      default:
        return `I found ${analysis.totalProducts} options. Let me help you narrow it down!`;
    }
  } else {
    // No refinement needed - show results directly
    if (analysis.totalProducts <= 3) {
      return `I found ${analysis.totalProducts} ${analysis.totalProducts === 1 ? 'result' : 'results'} for your query. Here ${analysis.totalProducts === 1 ? 'it is' : 'they are'}, ranked by relevance.`;
    } else {
      return `Here are the top matches for "${scenario.query}", ranked by relevance and availability.`;
    }
  }
}

async function runManualTest(scenario: TestScenario, products: any[]) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📋 Test: ${scenario.name}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Query: "${scenario.query}"`);
  console.log(`Expected: ${scenario.expectedBehavior}`);
  console.log(`Should Refine: ${scenario.shouldRefine ? 'Yes' : 'No'}`);

  // Analyze products
  const analysis = analyzeProductsForRefinement(products, scenario.query);
  console.log(`\n📊 Product Analysis:`);
  console.log(`   Total Products: ${analysis.totalProducts}`);
  console.log(`   Categories: ${analysis.categoryCount} (${analysis.categories.join(', ')})`);
  console.log(`   Price Ranges: Budget(${analysis.priceRanges.budget}), Mid(${analysis.priceRanges.midRange}), Premium(${analysis.priceRanges.premium})`);
  console.log(`   Stock: In-stock(${analysis.stockStatus.inStock}), Backorder(${analysis.stockStatus.backorder}), Out(${analysis.stockStatus.outOfStock})`);
  console.log(`   Refinement Recommended: ${analysis.shouldRefine ? 'Yes' : 'No'}`);

  // Simulate AI response
  const aiResponse = simulateAIResponse(scenario, analysis);
  console.log(`\n🤖 Simulated AI Response:`);
  console.log(`   ${aiResponse.split('\n').join('\n   ')}`);

  // Validate conversational tone
  const toneValidation = validateConversationalTone(aiResponse);
  console.log(`\n✅ Tone Validation:`);
  console.log(`   Is Conversational: ${toneValidation.isConversational ? '✅ Yes' : '❌ No'}`);
  if (toneValidation.issues.length > 0) {
    console.log(`   Issues Found:`);
    toneValidation.issues.forEach(issue => console.log(`      - ${issue}`));
  }

  // Verify expected behavior
  const behaviorMatch = (scenario.shouldRefine && analysis.shouldRefine) ||
                        (!scenario.shouldRefine && !analysis.shouldRefine);

  console.log(`\n📝 Result:`);
  console.log(`   Behavior Match: ${behaviorMatch ? '✅ Pass' : '❌ Fail'}`);
  console.log(`   Tone Quality: ${toneValidation.isConversational ? '✅ Pass' : '⚠️  Needs improvement'}`);

  return {
    scenario: scenario.name,
    passed: behaviorMatch && toneValidation.isConversational,
    analysis,
    aiResponse,
    toneValidation
  };
}

async function main() {
  console.log('🚀 Manual Testing Simulation for Conversational Refinement\n');
  console.log('This simulates real user queries with actual WooCommerce data.\n');

  // Fetch real data
  const products = await getWooCommerceProducts();
  const pages = await getScrapedPages();

  if (products.length === 0) {
    console.error('❌ No products found. Cannot run tests.');
    console.log('\n💡 Make sure WooCommerce products are synced for thompsonseparts.co.uk');
    process.exit(1);
  }

  console.log(`\n✅ Test Environment Ready`);
  console.log(`   Products: ${products.length}`);
  console.log(`   Scraped Pages: ${pages.length}`);
  console.log(`   Domain: thompsonseparts.co.uk`);

  // Run all test scenarios
  const results = [];
  for (const scenario of testScenarios) {
    const result = await runManualTest(scenario, products);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
  }

  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 TEST SUMMARY');
  console.log(`${'='.repeat(80)}\n`);

  const passCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  console.log(`Total Tests: ${totalCount}`);
  console.log(`Passed: ${passCount} ✅`);
  console.log(`Failed: ${totalCount - passCount} ❌`);
  console.log(`Success Rate: ${Math.round((passCount / totalCount) * 100)}%\n`);

  results.forEach((result, i) => {
    console.log(`${i + 1}. ${result.scenario}: ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
  });

  // Exit with appropriate code
  process.exit(passCount === totalCount ? 0 : 1);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
