/**
 * Display and Logging Utilities for Funnel System E2E Tests
 */

import type { FunnelMetrics } from '../../../lib/analytics/funnel-analytics';

// ANSI colors for output
export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

export function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

export function section(title: string) {
  console.log('\n' + '='.repeat(80));
  log(`  ${title}`, colors.bright + colors.cyan);
  console.log('='.repeat(80) + '\n');
}

export function displayMetrics(metrics: FunnelMetrics): void {
  log(`📊 Funnel Overview:`, colors.bright);
  log(`   Total Chats: ${metrics.overview.totalChats}`, colors.blue);
  log(`   Total Carts: ${metrics.overview.totalCarts}`, colors.blue);
  log(`   Total Purchases: ${metrics.overview.totalPurchases}`, colors.blue);
  log(`   Total Revenue: £${metrics.overview.totalRevenue.toFixed(2)}`, colors.blue);

  log(`\n📈 Conversion Rates:`, colors.bright);
  log(`   Chat → Cart: ${metrics.conversionRates.chatToCart.toFixed(1)}%`, colors.cyan);
  log(`   Cart → Purchase: ${metrics.conversionRates.cartToPurchase.toFixed(1)}%`, colors.cyan);
  log(`   Overall: ${metrics.conversionRates.overallConversion.toFixed(1)}%`, colors.cyan);

  log(`\n⚠️  Drop-off Analysis:`, colors.bright);
  log(`   Chat Only Rate: ${metrics.dropOffAnalysis.chatOnlyRate.toFixed(1)}%`, colors.yellow);
  log(`   Cart Abandonment Rate: ${metrics.dropOffAnalysis.cartAbandonmentRate.toFixed(1)}%`, colors.yellow);

  log(`\n⏱️  Timing Metrics:`, colors.bright);
  log(`   Avg Time to Cart: ${metrics.timingMetrics.avgTimeToCartMinutes.toFixed(1)} minutes`, colors.blue);
  log(`   Avg Time to Purchase: ${metrics.timingMetrics.avgTimeToPurchaseMinutes.toFixed(1)} minutes`, colors.blue);

  log(`\n💰 Revenue Metrics:`, colors.bright);
  log(`   Total Revenue: £${metrics.revenueMetrics.totalRevenue.toFixed(2)}`, colors.green);
  log(`   Avg Purchase Value: £${metrics.revenueMetrics.avgPurchaseValue.toFixed(2)}`, colors.green);
  log(`   Lost Revenue: £${metrics.revenueMetrics.lostRevenue.toFixed(2)}`, colors.red);

  log(`\n🎯 Cart Priority Breakdown:`, colors.bright);
  log(`   High Priority: ${metrics.cartPriorityBreakdown.high.count} carts, £${metrics.cartPriorityBreakdown.high.value.toFixed(2)}, ${metrics.cartPriorityBreakdown.high.conversionRate.toFixed(1)}% converted`, colors.red);
  log(`   Medium Priority: ${metrics.cartPriorityBreakdown.medium.count} carts, £${metrics.cartPriorityBreakdown.medium.value.toFixed(2)}, ${metrics.cartPriorityBreakdown.medium.conversionRate.toFixed(1)}% converted`, colors.yellow);
  log(`   Low Priority: ${metrics.cartPriorityBreakdown.low.count} carts, £${metrics.cartPriorityBreakdown.low.value.toFixed(2)}, ${metrics.cartPriorityBreakdown.low.conversionRate.toFixed(1)}% converted`, colors.blue);
}

export function displaySummary(testDomain: string): void {
  log(`✅ End-to-End Funnel System Test Complete!`, colors.green + colors.bright);

  log(`\n📋 Test Results:`, colors.bright);
  log(`   ✅ Database migrations verified`, colors.green);
  log(`   ✅ Chat stage tracking functional`, colors.green);
  log(`   ✅ Cart abandonment tracking functional`, colors.green);
  log(`   ✅ Purchase tracking functional`, colors.green);
  log(`   ✅ Funnel metrics calculation accurate`, colors.green);
  log(`   ✅ Alert configuration working`, colors.green);
  log(`   ✅ Alert monitoring operational`, colors.green);

  log(`\n🎯 View Results:`, colors.bright);
  log(`   Dashboard: http://localhost:3000/dashboard/analytics/funnel?domain=${testDomain}`, colors.cyan);
  log(`   API Metrics: GET /api/analytics/funnel?domain=${testDomain}`, colors.cyan);
  log(`   API Alerts: GET /api/analytics/funnel/alerts?domain=${testDomain}`, colors.cyan);

  log(`\n🗄️  Database Queries:`, colors.bright);
  log(`   SELECT * FROM conversation_funnel WHERE domain = '${testDomain}';`, colors.blue);
  log(`   SELECT * FROM funnel_alert_rules WHERE domain = '${testDomain}';`, colors.blue);
  log(`   SELECT * FROM funnel_alert_history WHERE domain = '${testDomain}';`, colors.blue);

  log(`\n🧹 Cleanup (if needed):`, colors.bright);
  log(`   DELETE FROM conversation_funnel WHERE domain = '${testDomain}';`, colors.yellow);
  log(`   DELETE FROM funnel_alert_rules WHERE domain = '${testDomain}';`, colors.yellow);
  log(`   DELETE FROM funnel_alert_history WHERE domain = '${testDomain}';`, colors.yellow);
}
