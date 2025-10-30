/**
 * Creates a test customer config for widget customization testing
 */
import { createServerClient } from '@/lib/supabase/server';

async function createTestConfig() {
  const supabase = await createServerClient();

  // Check if test config already exists
  const { data: existing } = await supabase
    .from('customer_configs')
    .select('id, domain')
    .eq('domain', 'test-widget-preview.local')
    .single();

  if (existing) {
    console.log('✅ Test config already exists!');
    console.log(`Domain: ${existing.domain}`);
    console.log(`ID: ${existing.id}`);
    console.log(`\n📋 Test URL:\nhttp://localhost:3000/dashboard/customize?customerConfigId=${existing.id}`);
    return;
  }

  // Create new test config
  const { data, error } = await supabase
    .from('customer_configs')
    .insert({
      domain: 'test-widget-preview.local',
      display_name: 'Widget Preview Test',
      scraping_enabled: false,
      max_pages: 0,
      scrape_depth: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating config:', error);
    process.exit(1);
  }

  console.log('✅ Created test config!');
  console.log(`Domain: ${data.domain}`);
  console.log(`ID: ${data.id}`);
  console.log(`\n📋 Test URL:\nhttp://localhost:3000/dashboard/customize?customerConfigId=${data.id}`);
}

createTestConfig();
