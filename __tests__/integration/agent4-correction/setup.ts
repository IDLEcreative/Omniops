import { createServiceRoleClient } from '@/lib/supabase-server';
import { API_BASE_URL, TEST_DOMAIN } from './constants';

export async function ensureServerAvailable() {
  const healthCheck = await fetch(`${API_BASE_URL}/api/health`).catch(() => null);
  if (!healthCheck || !healthCheck.ok) {
    process.env.SKIP_INTEGRATION_TESTS = 'true';
  }
}

export async function setupTestData() {
  const supabase = await createServiceRoleClient();

  const { data: existingConfig } = await supabase
    .from('customer_configs')
    .select('id')
    .eq('domain', TEST_DOMAIN)
    .single();

  if (!existingConfig) {
    await supabase.from('customer_configs').insert({
      domain: TEST_DOMAIN,
      business_name: 'Agent 4 Correction Test Business',
      industry: 'testing',
      created_at: new Date().toISOString(),
    });
  }

  const { data: config } = await supabase
    .from('customer_configs')
    .select('id')
    .eq('domain', TEST_DOMAIN)
    .single();

  if (!config) {
    return;
  }

  const testProducts = [
    {
      title: 'Premium Hydraulic Pump Model A',
      url: `https://${TEST_DOMAIN}/pump-a`,
      content:
        'Premium Product Model A - High performance item. Price: $299.99. Stock: Available (15 units). Warranty: 2 years.',
      metadata: { price: 299.99, stock: 'available', warranty_years: 2 },
    },
    {
      title: 'Industrial Hydraulic Pump Model B',
      url: `https://${TEST_DOMAIN}/pump-b`,
      content:
        'Industrial Hydraulic Pump Model B - Medium duty pump for general use. Price: $399.99. Stock: Available (8 units). Warranty: 1 year.',
      metadata: { price: 399.99, stock: 'available', warranty_years: 1 },
    },
    {
      title: 'Heavy Duty Hydraulic Pump Model C',
      url: `https://${TEST_DOMAIN}/pump-c`,
      content:
        'Heavy Duty Hydraulic Pump Model C - Professional grade heavy duty pump. Price: $499.99. Stock: Out of stock. Warranty: 3 years.',
      metadata: { price: 499.99, stock: 'out of stock', warranty_years: 3 },
    },
  ];

  for (const product of testProducts) {
    const { data: existing } = await supabase
      .from('scraped_pages')
      .select('id')
      .eq('url', product.url)
      .single();

    if (!existing) {
      await supabase.from('scraped_pages').insert({
        domain_id: config.id,
        url: product.url,
        title: product.title,
        content: product.content,
        metadata: product.metadata,
        last_scraped_at: new Date().toISOString(),
      });
    }
  }
}
