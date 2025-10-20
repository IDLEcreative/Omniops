#!/usr/bin/env tsx
/**
 * Data Migration Script: Convert Single-User to Organizations
 *
 * This script migrates existing customers to the new organization-based structure:
 * 1. Creates a default organization for each customer
 * 2. Sets them as the owner
 * 3. Links their domains and configs to the organization
 *
 * Run with: npx tsx scripts/migrate-to-organizations.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface Customer {
  id: string;
  auth_user_id: string;
  email: string;
  name: string | null;
  company_name: string | null;
}

interface Domain {
  id: string;
  user_id: string;
  domain: string;
}

interface CustomerConfig {
  id: string;
  customer_id: string;
  domain: string;
}

/**
 * Generate a URL-safe slug from a string
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

/**
 * Ensure slug is unique by appending a number if needed
 */
async function ensureUniqueSlug(baseSlug: string, attempt = 0): Promise<string> {
  const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;

  const { data } = await supabase
    .from('organizations')
    .select('slug')
    .eq('slug', slug)
    .maybeSingle();

  if (data) {
    return ensureUniqueSlug(baseSlug, attempt + 1);
  }

  return slug;
}

/**
 * Main migration function
 */
async function migrateToOrganizations() {
  console.log('🚀 Starting migration to organization-based structure...\n');

  try {
    // Step 1: Fetch all customers
    console.log('📋 Fetching customers...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, auth_user_id, email, name, company_name');

    if (customersError) {
      throw new Error(`Failed to fetch customers: ${customersError.message}`);
    }

    if (!customers || customers.length === 0) {
      console.log('✅ No customers found. Migration complete.');
      return;
    }

    console.log(`   Found ${customers.length} customers\n`);

    let successCount = 0;
    let errorCount = 0;

    // Step 2: Process each customer
    for (const customer of customers as Customer[]) {
      try {
        console.log(`👤 Processing customer: ${customer.email}`);

        // Generate organization name
        const orgName = customer.company_name || customer.name || customer.email.split('@')[0];
        const baseSlug = generateSlug(orgName);
        const uniqueSlug = await ensureUniqueSlug(baseSlug);

        console.log(`   Creating organization: "${orgName}" (${uniqueSlug})`);

        // Create organization
        const { data: organization, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: orgName,
            slug: uniqueSlug,
            settings: {},
            plan_type: 'free',
            seat_limit: 5,
          })
          .select()
          .single();

        if (orgError) {
          throw new Error(`Failed to create organization: ${orgError.message}`);
        }

        console.log(`   ✓ Organization created: ${organization.id}`);

        // Add customer as owner
        const { error: memberError } = await supabase
          .from('organization_members')
          .insert({
            organization_id: organization.id,
            user_id: customer.auth_user_id,
            role: 'owner',
          });

        if (memberError) {
          throw new Error(`Failed to add owner: ${memberError.message}`);
        }

        console.log(`   ✓ Added as owner`);

        // Update domains owned by this user
        const { data: domains, error: domainsError } = await supabase
          .from('domains')
          .select('id, domain')
          .eq('user_id', customer.auth_user_id);

        if (domainsError) {
          console.warn(`   ⚠️  Warning: Failed to fetch domains: ${domainsError.message}`);
        } else if (domains && domains.length > 0) {
          const { error: updateDomainsError } = await supabase
            .from('domains')
            .update({ organization_id: organization.id })
            .eq('user_id', customer.auth_user_id);

          if (updateDomainsError) {
            console.warn(`   ⚠️  Warning: Failed to update domains: ${updateDomainsError.message}`);
          } else {
            console.log(`   ✓ Updated ${domains.length} domain(s)`);
          }
        }

        // Update customer configs
        const { data: configs, error: configsError } = await supabase
          .from('customer_configs')
          .select('id, domain')
          .eq('customer_id', customer.id);

        if (configsError) {
          console.warn(`   ⚠️  Warning: Failed to fetch configs: ${configsError.message}`);
        } else if (configs && configs.length > 0) {
          const { error: updateConfigsError } = await supabase
            .from('customer_configs')
            .update({ organization_id: organization.id })
            .eq('customer_id', customer.id);

          if (updateConfigsError) {
            console.warn(`   ⚠️  Warning: Failed to update configs: ${updateConfigsError.message}`);
          } else {
            console.log(`   ✓ Updated ${configs.length} config(s)`);
          }
        }

        console.log(`   ✅ Customer migrated successfully\n`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ Error migrating customer ${customer.email}:`, error);
        errorCount++;
        console.log('');
      }
    }

    // Summary
    console.log('━'.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`   Total customers: ${customers.length}`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log('━'.repeat(50));

    if (errorCount > 0) {
      console.log('\n⚠️  Some customers failed to migrate. Please review the errors above.');
      process.exit(1);
    } else {
      console.log('\n✅ All customers migrated successfully!');
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateToOrganizations();
