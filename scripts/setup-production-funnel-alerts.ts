/**
 * Setup Production Funnel Alerts
 *
 * Configures default alert rules for your production domain(s)
 * Run: npx tsx scripts/setup-production-funnel-alerts.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setupAlerts() {
  console.log('🔍 Finding your active domains...\n');

  // Get active domains
  const { data: configs, error: configError } = await supabase
    .from('customer_configs')
    .select('domain, organization_id')
    .not('domain', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10);

  if (configError || !configs || configs.length === 0) {
    console.log('❌ No domains found. Make sure you have customer_configs set up.');
    return;
  }

  console.log(`📊 Found ${configs.length} domain(s):\n`);
  configs.forEach((c, i) => console.log(`   ${i + 1}. ${c.domain}`));

  // For each domain, create default alert rules
  for (const config of configs) {
    console.log(`\n🔔 Setting up alerts for: ${config.domain}`);

    // Check if alerts already exist
    const { data: existing } = await supabase
      .from('funnel_alert_rules')
      .select('id, alert_type')
      .eq('domain', config.domain);

    if (existing && existing.length > 0) {
      console.log(`   ⚠️  ${existing.length} alert(s) already configured`);
      existing.forEach(a => console.log(`      - ${a.alert_type}`));
      continue;
    }

    // Create conversion drop alert (if overall conversion < 10%)
    const { error: convError } = await supabase
      .from('funnel_alert_rules')
      .insert({
        domain: config.domain,
        alert_type: 'conversion_drop',
        threshold_value: 10.0, // 10% threshold
        comparison_operator: 'less_than',
        time_window_hours: 24,
        is_enabled: true,
        notification_email: null, // Set your email here
        config: { stage: 'overall', min_chats: 10 },
      });

    if (!convError) {
      console.log(`   ✅ Conversion drop alert (<10% in 24h)`);
    }

    // Create high-value cart abandonment alert (carts > £100)
    const { error: cartError } = await supabase
      .from('funnel_alert_rules')
      .insert({
        domain: config.domain,
        alert_type: 'high_value_cart',
        threshold_value: 100.0, // £100 threshold
        comparison_operator: 'greater_than',
        time_window_hours: 1, // Check hourly
        is_enabled: true,
        notification_email: null, // Set your email here
        config: { priority: 'high' },
      });

    if (!cartError) {
      console.log(`   ✅ High-value cart alert (>£100)`);
    }

    // Create funnel stage drop alert
    const { error: dropError } = await supabase
      .from('funnel_alert_rules')
      .insert({
        domain: config.domain,
        alert_type: 'funnel_stage_drop',
        threshold_value: 60.0, // Alert if cart abandonment > 60%
        comparison_operator: 'greater_than',
        time_window_hours: 24,
        is_enabled: true,
        notification_email: null,
        config: { stage: 'cart' },
      });

    if (!dropError) {
      console.log(`   ✅ Cart abandonment alert (>60%)`);
    }
  }

  console.log('\n✅ Alert configuration complete!\n');
  console.log('📋 Next Steps:');
  console.log('   1. Update notification emails in funnel_alert_rules table');
  console.log('   2. View dashboard: /dashboard/analytics/funnel?domain=YOUR_DOMAIN');
  console.log('   3. Test alerts: POST /api/analytics/funnel/alerts?action=monitor\n');
}

setupAlerts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
