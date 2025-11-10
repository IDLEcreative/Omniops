/**
 * View Test Funnel Data
 * Quick visualization of test funnel metrics
 */

import { getFunnelMetrics } from '../lib/analytics/funnel-analytics';

async function viewTestFunnel() {
  const domain = 'test-funnel.local';

  console.log('📊 Loading funnel metrics for test domain...\n');

  const end = new Date();
  const start = new Date('2025-01-01'); // Get all test data

  const metrics = await getFunnelMetrics(domain, { start, end });

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🎯 CONVERSION FUNNEL OVERVIEW');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Overview
  console.log('📈 FUNNEL STAGES:');
  console.log(`   Total Chats:      ${metrics.overview.totalChats.toString().padStart(3)} conversations`);
  console.log(`   Added to Cart:    ${metrics.overview.totalCarts.toString().padStart(3)} carts`);
  console.log(`   Purchased:        ${metrics.overview.totalPurchases.toString().padStart(3)} orders`);
  console.log(`   Total Revenue:    £${metrics.overview.totalRevenue.toFixed(2)}\n`);

  // Conversion rates
  console.log('💹 CONVERSION RATES:');
  console.log(`   Chat → Cart:      ${metrics.conversionRates.chatToCart.toFixed(1)}%`);
  console.log(`   Cart → Purchase:  ${metrics.conversionRates.cartToPurchase.toFixed(1)}%`);
  console.log(`   Overall:          ${metrics.conversionRates.overallConversion.toFixed(1)}%\n`);

  // Drop-off
  console.log('⚠️  DROP-OFF ANALYSIS:');
  console.log(`   Chat Only:        ${metrics.dropOffAnalysis.chatOnlyRate.toFixed(1)}% (${metrics.dropOffAnalysis.chatOnly} users)`);
  console.log(`   Cart Abandoned:   ${metrics.dropOffAnalysis.cartAbandonmentRate.toFixed(1)}% (${metrics.dropOffAnalysis.cartAbandoned} carts)\n`);

  // Timing
  console.log('⏱️  TIMING METRICS:');
  console.log(`   Avg Time to Cart:     ${metrics.timingMetrics.avgTimeToCartMinutes.toFixed(0)} min`);
  console.log(`   Avg Cart→Purchase:    ${metrics.timingMetrics.avgCartToPurchaseMinutes.toFixed(0)} min`);
  console.log(`   Avg Total Journey:    ${metrics.timingMetrics.avgTimeToPurchaseMinutes.toFixed(0)} min\n`);

  // Revenue
  console.log('💰 REVENUE METRICS:');
  console.log(`   Total Revenue:        £${metrics.revenueMetrics.totalRevenue.toFixed(2)}`);
  console.log(`   Avg Purchase Value:   £${metrics.revenueMetrics.avgPurchaseValue.toFixed(2)}`);
  console.log(`   Lost Revenue:         £${metrics.revenueMetrics.lostRevenue.toFixed(2)} (abandoned carts)\n`);

  // Priority breakdown
  console.log('🎯 CART PRIORITY BREAKDOWN:');
  console.log('\n   HIGH PRIORITY (>£100):');
  console.log(`      Count:        ${metrics.cartPriorityBreakdown.high.count} carts`);
  console.log(`      Value:        £${metrics.cartPriorityBreakdown.high.value.toFixed(2)}`);
  console.log(`      Converted:    ${metrics.cartPriorityBreakdown.high.conversionRate.toFixed(1)}%`);

  console.log('\n   MEDIUM PRIORITY (£50-100):');
  console.log(`      Count:        ${metrics.cartPriorityBreakdown.medium.count} carts`);
  console.log(`      Value:        £${metrics.cartPriorityBreakdown.medium.value.toFixed(2)}`);
  console.log(`      Converted:    ${metrics.cartPriorityBreakdown.medium.conversionRate.toFixed(1)}%`);

  console.log('\n   LOW PRIORITY (<£50):');
  console.log(`      Count:        ${metrics.cartPriorityBreakdown.low.count} carts`);
  console.log(`      Value:        £${metrics.cartPriorityBreakdown.low.value.toFixed(2)}`);
  console.log(`      Converted:    ${metrics.cartPriorityBreakdown.low.conversionRate.toFixed(1)}%\n`);

  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('🔗 View Dashboard:');
  console.log(`   http://localhost:3000/dashboard/analytics/funnel?domain=${domain}\n`);
}

viewTestFunnel()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
