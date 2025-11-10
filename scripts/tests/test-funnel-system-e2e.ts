/**
 * End-to-End Funnel System Test
 *
 * Simulates complete customer journeys through the conversion funnel:
 * 1. Apply database migrations
 * 2. Create test conversations (chat stage)
 * 3. Simulate cart abandonment (cart stage)
 * 4. Simulate purchases (purchase stage)
 * 5. Verify funnel metrics
 * 6. Configure alerts
 * 7. Trigger alert monitoring
 * 8. View results
 *
 * Usage: npx tsx scripts/tests/test-funnel-system-e2e.ts
 */

import { createClient } from '@supabase/supabase-js';
import { getFunnelMetrics } from '../../lib/analytics/funnel-analytics';
import { createTestCustomers } from './modules/funnel-test-data';
import { simulateCartAbandonment, simulatePurchases } from './modules/funnel-test-scenarios';
import { log, section, colors, displayMetrics, displaySummary } from './modules/funnel-test-display';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TEST_DOMAIN = process.env.TEST_DOMAIN || 'test-funnel.local';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkMigrations(): Promise<boolean> {
  section('STEP 1: Checking Database Migrations');

  try {
    // Check if conversation_funnel table exists
    const { error: funnelError } = await supabase
      .from('conversation_funnel')
      .select('id')
      .limit(1);

    if (funnelError) {
      log(`❌ conversation_funnel table not found`, colors.red);
      log(`   Run migration: supabase/migrations/20250109000001_conversation_funnel_tracking.sql`, colors.yellow);
      return false;
    }

    log(`✅ conversation_funnel table exists`, colors.green);

    // Check if alert tables exist
    const { error: alertsError } = await supabase
      .from('funnel_alert_rules')
      .select('id')
      .limit(1);

    if (alertsError) {
      log(`❌ funnel_alert_rules table not found`, colors.red);
      log(`   Run migration: supabase/migrations/20250109000002_funnel_alerts.sql`, colors.yellow);
      return false;
    }

    log(`✅ funnel_alert_rules table exists`, colors.green);
    log(`✅ All migrations applied successfully`, colors.green);
    return true;
  } catch (error) {
    log(`❌ Migration check failed: ${error}`, colors.red);
    return false;
  }
}

async function verifyFunnelMetrics(): Promise<void> {
  section('STEP 5: Verifying Funnel Metrics');

  const end = new Date();
  const start = new Date();
  start.setHours(start.getHours() - 1); // Last hour

  const metrics = await getFunnelMetrics(TEST_DOMAIN, { start, end });

  displayMetrics(metrics);

  // Verify expected values
  if (metrics.overview.totalChats === 7 &&
      metrics.overview.totalCarts === 5 &&
      metrics.overview.totalPurchases === 3) {
    log(`\n✅ Funnel metrics match expected values!`, colors.green);
  } else {
    log(`\n⚠️  Metrics don't match expected values. Check funnel recording.`, colors.yellow);
  }
}

async function configureTestAlerts(): Promise<void> {
  section('STEP 6: Configuring Test Alerts');

  // Create conversion drop alert
  const { error: convError } = await supabase
    .from('funnel_alert_rules')
    .insert({
      domain: TEST_DOMAIN,
      alert_type: 'conversion_drop',
      threshold_value: 40.0, // Alert if conversion < 40%
      comparison_operator: 'less_than',
      time_window_hours: 24,
      is_enabled: true,
      max_alerts_per_day: 5,
      config: { stage: 'overall', min_chats: 5 },
    })
    .select()
    .single();

  if (!convError) {
    log(`✅ Created conversion drop alert (threshold: 40%)`, colors.green);
  }

  // Create high-value cart alert
  const { error: cartError } = await supabase
    .from('funnel_alert_rules')
    .insert({
      domain: TEST_DOMAIN,
      alert_type: 'high_value_cart',
      threshold_value: 100.0,
      comparison_operator: 'greater_than',
      time_window_hours: 1,
      is_enabled: true,
      notify_immediately: true,
      max_alerts_per_day: 10,
      config: { priority: 'high' },
    })
    .select()
    .single();

  if (!cartError) {
    log(`✅ Created high-value cart alert (threshold: £100)`, colors.green);
  }

  log(`\n✅ Configured 2 test alert rules`, colors.green);
}

async function testAlertMonitoring(): Promise<void> {
  section('STEP 7: Testing Alert Monitoring');

  log(`⚙️  Triggering alert monitoring...`, colors.blue);

  // Import and run monitoring
  const { monitorFunnelAlerts } = await import('../../lib/analytics/funnel-alerts');
  const result = await monitorFunnelAlerts();

  log(`\n📊 Monitoring Results:`, colors.bright);
  log(`   Rules Checked: ${result.checked}`, colors.blue);
  log(`   Alerts Triggered: ${result.triggered}`, colors.yellow);

  // Check alert history
  const { data: alertHistory } = await supabase
    .from('funnel_alert_history')
    .select('*')
    .eq('domain', TEST_DOMAIN)
    .order('triggered_at', { ascending: false })
    .limit(10);

  if (alertHistory && alertHistory.length > 0) {
    log(`\n🔔 Recent Alerts:`, colors.bright);
    for (const alert of alertHistory) {
      log(`   ${alert.alert_type}: ${alert.alert_title}`, colors.yellow);
      log(`      ${alert.alert_message}`, colors.blue);
    }
  }

  log(`\n✅ Alert monitoring completed`, colors.green);
}

async function cleanup(): Promise<void> {
  section('Cleanup Test Data');

  const skipCleanup = process.argv.includes('--keep-data');

  if (skipCleanup) {
    log(`⏭️  Skipping cleanup (--keep-data flag)`, colors.yellow);
    return;
  }

  log(`🧹 Cleaning up test data...`, colors.blue);

  // Delete funnel entries
  await supabase
    .from('conversation_funnel')
    .delete()
    .eq('domain', TEST_DOMAIN);

  // Delete alerts
  await supabase
    .from('funnel_alert_rules')
    .delete()
    .eq('domain', TEST_DOMAIN);

  await supabase
    .from('funnel_alert_history')
    .delete()
    .eq('domain', TEST_DOMAIN);

  log(`✅ Test data cleaned up`, colors.green);
  log(`   (Use --keep-data flag to preserve test data for inspection)`, colors.blue);
}

// Main execution
async function main() {
  try {
    log('\n🚀 Starting Funnel System End-to-End Test\n', colors.bright + colors.cyan);

    // Step 1: Check migrations
    const migrationsOk = await checkMigrations();
    if (!migrationsOk) {
      log(`\n❌ Migrations not applied. Please run migrations first.`, colors.red);
      process.exit(1);
    }

    // Step 2-4: Create test data
    section('STEP 2: Creating Test Customers & Conversations');
    const customers = await createTestCustomers(supabase, TEST_DOMAIN);
    log(`\n✅ Created ${customers.length} test customers with chat stages`, colors.green);

    section('STEP 3: Simulating Cart Abandonment');
    await simulateCartAbandonment(customers);
    const cartCount = customers.filter(c => c.scenario.includes('Cart') || c.scenario.includes('Purchase')).length;
    log(`\n✅ Simulated ${cartCount} cart abandonments`, colors.green);

    section('STEP 4: Simulating Purchase Completions');
    await simulatePurchases(customers);
    const purchaseCount = customers.filter(c => c.scenario.includes('Purchase')).length;
    log(`\n✅ Simulated ${purchaseCount} purchases`, colors.green);

    // Step 5: Verify metrics
    await verifyFunnelMetrics();

    // Step 6-7: Test alerts
    await configureTestAlerts();
    await testAlertMonitoring();

    // Step 8: Summary
    section('STEP 8: Test Summary & Next Steps');
    displaySummary(TEST_DOMAIN);

    // Cleanup (unless --keep-data flag)
    await cleanup();

    log(`\n✅ All tests passed successfully! 🎉\n`, colors.green + colors.bright);
    process.exit(0);
  } catch (error) {
    log(`\n❌ Test failed with error:`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

main();
