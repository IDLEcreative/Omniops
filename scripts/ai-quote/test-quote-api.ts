#!/usr/bin/env npx tsx

/**
 * AI Quote API Testing Script
 * Tests the /api/ai-quote/analyze endpoint with real domains
 * Usage: npx tsx scripts/ai-quote/test-quote-api.ts
 */

import { collectBusinessIntelligence, analyzeBusiness, getTierDisplayName } from '@/lib/ai-quote';

async function testQuoteSystem() {
  // Test domains with different characteristics
  const testDomains = [
    'github.com',      // Large tech platform
    'wordpress.com',   // Large content platform
  ];

  console.log('🚀 AI Quote System Test\n');
  console.log('=' .repeat(80));

  for (const domain of testDomains) {
    try {
      console.log(`\n📊 Analyzing: ${domain}`);
      console.log('-'.repeat(80));

      const startTime = Date.now();

      // Collect intelligence
      console.log('Collecting business intelligence...');
      const intel = await collectBusinessIntelligence(domain);

      console.log(`✅ Intelligence collected:`);
      console.log(`   Traffic: ${intel.traffic.monthlyVisitors.toLocaleString()} visitors`);
      console.log(`   Website: ${intel.website.totalPages} pages, ${intel.website.productCount} products`);
      console.log(`   Company: ${intel.company.name} (${intel.company.companyStatus})`);
      console.log(`   Domain Age: ${intel.domainInfo.domainAge} years`);

      // Analyze
      console.log('\nAnalyzing with GPT-4o-mini...');
      const recommendation = await analyzeBusiness(intel);

      const analysisTime = (Date.now() - startTime) / 1000;

      console.log(`✅ Analysis complete:`);
      console.log(`   Tier: ${getTierDisplayName(recommendation.tier)}`);
      console.log(`   Price: £${recommendation.monthlyPrice}/month`);
      console.log(`   Confidence: ${recommendation.confidence}%`);
      console.log(`   Est. Completions: ${recommendation.estimatedCompletions}/month`);
      console.log(`   Time: ${analysisTime.toFixed(2)}s`);

      console.log(`\n📝 Reasoning:`);
      recommendation.reasoning.forEach((reason, i) => {
        console.log(`   ${i + 1}. ${reason}`);
      });

      console.log(`\n🎯 Signals:`);
      const signals = recommendation.signals;
      console.log(`   Traffic: ${signals.trafficSignal}`);
      console.log(`   Employees: ${signals.employeeSignal}`);
      console.log(`   Revenue: ${signals.revenueSignal}`);
      console.log(`   Content: ${signals.contentSignal}`);
      console.log(`   Domain Age: ${signals.domainAgeSignal}`);
    } catch (error) {
      console.error(`❌ Error analyzing ${domain}:`);
      console.error(error instanceof Error ? error.message : String(error));
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Test complete\n');
}

testQuoteSystem().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
