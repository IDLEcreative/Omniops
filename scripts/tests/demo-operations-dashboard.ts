#!/usr/bin/env tsx
/**
 * Demo Operations Dashboard
 *
 * Creates sample operations to populate the dashboard for testing.
 * This simulates various operation states and scenarios.
 *
 * Usage:
 *   npx tsx scripts/tests/demo-operations-dashboard.ts
 */

import { createServerClient } from '@/lib/supabase/server';

interface CreateOperationParams {
  organizationId: string;
  userId: string;
  service: 'woocommerce' | 'shopify' | 'bigcommerce' | 'stripe';
  operation: string;
  status: 'pending' | 'queued' | 'active' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  errorMessage?: string;
  result?: any;
  jobId?: string;
  metadata?: any;
}

async function createSampleOperation(params: CreateOperationParams) {
  const supabase = await createServerClient();

  const now = new Date();
  const createdAt = new Date(now.getTime() - Math.random() * 3600000).toISOString(); // Random time in last hour

  const operationData: any = {
    organization_id: params.organizationId,
    user_id: params.userId,
    service: params.service,
    operation: params.operation,
    status: params.status,
    job_id: params.jobId || `job_${Math.random().toString(36).substr(2, 9)}`,
    created_at: createdAt,
    metadata: params.metadata || {},
  };

  if (params.progress !== undefined) {
    operationData.progress = params.progress;
  }

  if (params.status === 'active') {
    operationData.started_at = new Date(now.getTime() - Math.random() * 300000).toISOString(); // Started within last 5 min
  }

  if (params.status === 'completed') {
    operationData.started_at = new Date(now.getTime() - 600000).toISOString();
    operationData.completed_at = new Date(now.getTime() - 300000).toISOString();
    operationData.result = params.result || { success: true };
  }

  if (params.status === 'failed') {
    operationData.started_at = new Date(now.getTime() - 900000).toISOString();
    operationData.completed_at = new Date(now.getTime() - 600000).toISOString();
    operationData.error_message = params.errorMessage || 'Unknown error occurred';
  }

  if (params.status === 'cancelled') {
    operationData.completed_at = new Date(now.getTime() - 450000).toISOString();
    operationData.error_message = 'Cancelled by user';
  }

  const { data, error } = await supabase
    .from('autonomous_operations')
    .insert(operationData)
    .select()
    .single();

  if (error) {
    console.error('Failed to create operation:', error);
    return null;
  }

  return data;
}

async function main() {
  console.log('🎭 Demo Operations Dashboard - Creating Sample Data\n');

  const demoOrgId = 'demo-org-123';
  const demoUserId = 'demo-user-456';

  const scenarios = [
    // Active operations (showing progress)
    {
      service: 'woocommerce' as const,
      operation: 'api_key_generation',
      status: 'active' as const,
      progress: 45,
      metadata: {
        config: { storeUrl: 'https://demo-shop.com' },
        steps: [
          { step: 'Navigating to WooCommerce settings', status: 'completed', timestamp: new Date().toISOString() },
          { step: 'Creating API credentials', status: 'active', timestamp: new Date().toISOString() },
        ],
      },
    },
    {
      service: 'shopify' as const,
      operation: 'api_key_generation',
      status: 'active' as const,
      progress: 75,
      metadata: {
        config: { storeUrl: 'https://demo-store.myshopify.com' },
        steps: [
          { step: 'Navigating to Shopify admin', status: 'completed', timestamp: new Date().toISOString() },
          { step: 'Creating private app', status: 'completed', timestamp: new Date().toISOString() },
          { step: 'Extracting credentials', status: 'active', timestamp: new Date().toISOString() },
        ],
      },
    },

    // Queued operations
    {
      service: 'woocommerce' as const,
      operation: 'webhook_configuration',
      status: 'queued' as const,
      metadata: {
        config: { storeUrl: 'https://another-shop.com' },
        priority: 'normal',
      },
    },
    {
      service: 'bigcommerce' as const,
      operation: 'api_key_generation',
      status: 'queued' as const,
      metadata: {
        config: { storeUrl: 'https://bigcommerce-demo.com' },
        priority: 'high',
      },
    },

    // Completed operations
    {
      service: 'woocommerce' as const,
      operation: 'api_key_generation',
      status: 'completed' as const,
      result: {
        success: true,
        credentials: {
          consumer_key: 'ck_***************',
          consumer_secret: 'cs_***************',
        },
      },
      metadata: {
        config: { storeUrl: 'https://successful-shop.com' },
        steps: [
          { step: 'Navigating to WooCommerce settings', status: 'completed', timestamp: new Date().toISOString() },
          { step: 'Creating API credentials', status: 'completed', timestamp: new Date().toISOString() },
          { step: 'Extracting credentials', status: 'completed', timestamp: new Date().toISOString() },
          { step: 'Storing securely', status: 'completed', timestamp: new Date().toISOString() },
        ],
      },
    },
    {
      service: 'shopify' as const,
      operation: 'api_key_generation',
      status: 'completed' as const,
      result: {
        success: true,
        credentials: {
          admin_api_token: 'shpat_***************',
        },
      },
      metadata: {
        config: { storeUrl: 'https://shopify-success.myshopify.com' },
      },
    },
    {
      service: 'stripe' as const,
      operation: 'oauth_connection',
      status: 'completed' as const,
      result: {
        success: true,
        credentials: {
          access_token: 'sk_***************',
        },
      },
      metadata: {
        config: { accountId: 'acct_***************' },
      },
    },

    // Failed operations
    {
      service: 'woocommerce' as const,
      operation: 'api_key_generation',
      status: 'failed' as const,
      errorMessage: 'Failed to authenticate - invalid WordPress credentials',
      metadata: {
        config: { storeUrl: 'https://failed-shop.com' },
        steps: [
          { step: 'Navigating to WooCommerce settings', status: 'completed', timestamp: new Date().toISOString() },
          { step: 'Authentication', status: 'failed', timestamp: new Date().toISOString() },
        ],
      },
    },
    {
      service: 'shopify' as const,
      operation: 'api_key_generation',
      status: 'failed' as const,
      errorMessage: 'Timeout waiting for page load - store may be experiencing issues',
      metadata: {
        config: { storeUrl: 'https://timeout-store.myshopify.com' },
      },
    },

    // Cancelled operation
    {
      service: 'bigcommerce' as const,
      operation: 'api_key_generation',
      status: 'cancelled' as const,
      metadata: {
        config: { storeUrl: 'https://cancelled-store.com' },
      },
    },

    // Pending operations
    {
      service: 'woocommerce' as const,
      operation: 'credential_rotation',
      status: 'pending' as const,
      metadata: {
        config: { storeUrl: 'https://pending-shop.com' },
        priority: 'low',
      },
    },
  ];

  console.log(`Creating ${scenarios.length} sample operations...\n`);

  let successCount = 0;
  for (const scenario of scenarios) {
    const operation = await createSampleOperation({
      organizationId: demoOrgId,
      userId: demoUserId,
      ...scenario,
    });

    if (operation) {
      successCount++;
      console.log(`✓ Created ${scenario.service} - ${scenario.operation} (${scenario.status})`);
    } else {
      console.log(`✗ Failed to create ${scenario.service} - ${scenario.operation}`);
    }
  }

  console.log(`\n✅ Successfully created ${successCount}/${scenarios.length} operations`);
  console.log('\n📊 Dashboard should now show:');
  console.log('   - 2 active operations (with progress bars)');
  console.log('   - 2 queued operations');
  console.log('   - 3 completed operations');
  console.log('   - 2 failed operations (with error messages)');
  console.log('   - 1 cancelled operation');
  console.log('   - 1 pending operation');
  console.log('\n🌐 View at: http://localhost:3000/dashboard/operations');
}

main().catch(console.error);
