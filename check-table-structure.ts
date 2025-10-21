#!/usr/bin/env tsx
/**
 * Check Table Structure and Organization Migration Status
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkTableColumns() {
  console.log('=== CHECKING TABLE COLUMNS FOR ORGANIZATION MIGRATION ===\n');

  const tables = [
    { name: 'organizations', expected: ['id', 'name', 'created_at'] },
    { name: 'organization_members', expected: ['organization_id', 'user_id', 'role'] },
    { name: 'customer_configs', expected: ['organization_id', 'domain'] },
    { name: 'domains', expected: ['organization_id', 'domain'] },
    { name: 'scraped_pages', expected: ['domain_id', 'url'] },
    { name: 'page_embeddings', expected: ['domain_id', 'content'] },
    { name: 'conversations', expected: ['customer_id', 'domain'] },
    { name: 'messages', expected: ['conversation_id', 'content'] },
    { name: 'structured_extractions', expected: ['domain', 'extraction_type'] }
  ];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table.name)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ ${table.name}: Error - ${error.message}`);
      continue;
    }

    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      const hasOrgId = columns.includes('organization_id');
      const hasDomainId = columns.includes('domain_id');

      console.log(`✅ ${table.name}:`);
      console.log(`   Columns: ${columns.join(', ')}`);
      console.log(`   Has organization_id: ${hasOrgId ? '✅' : '❌'}`);
      console.log(`   Has domain_id: ${hasDomainId ? '✅ (indirect org link)' : '–'}`);
    } else {
      console.log(`ℹ️  ${table.name}: Empty table`);

      // Try to insert and read schema from error or success
      const { error: insertError } = await supabase
        .from(table.name)
        .insert({})
        .select();

      if (insertError && insertError.message.includes('column')) {
        // Parse column names from error message
        console.log(`   Schema hint from error: ${insertError.message}`);
      }
    }
    console.log('');
  }
}

async function checkOrganizationData() {
  console.log('\n=== ORGANIZATION DATA SUMMARY ===\n');

  // Get organization count
  const { count: orgCount } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true });

  console.log(`Organizations: ${orgCount || 0}`);

  // Get organization members count
  const { count: memberCount } = await supabase
    .from('organization_members')
    .select('*', { count: 'exact', head: true });

  console.log(`Organization Members: ${memberCount || 0}`);

  // Get customer configs with organization
  const { count: configCount } = await supabase
    .from('customer_configs')
    .select('*', { count: 'exact', head: true });

  console.log(`Customer Configs: ${configCount || 0}`);

  // Get domains with organization
  const { count: domainCount } = await supabase
    .from('domains')
    .select('*', { count: 'exact', head: true });

  console.log(`Domains: ${domainCount || 0}`);

  // Sample organization data
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, created_at')
    .limit(5);

  if (orgs && orgs.length > 0) {
    console.log('\nSample Organizations:');
    orgs.forEach(org => {
      console.log(`  - ${org.name} (${org.id})`);
    });
  }
}

async function checkDataRelationships() {
  console.log('\n=== DATA RELATIONSHIP VERIFICATION ===\n');

  // Check customer_configs -> organizations
  const { data: configs } = await supabase
    .from('customer_configs')
    .select('id, organization_id, domain')
    .limit(5);

  if (configs) {
    console.log('Customer Configs Sample:');
    for (const config of configs) {
      if (config.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', config.organization_id)
          .single();

        console.log(`  ✅ ${config.domain} -> Org: ${org?.name || 'NOT FOUND'}`);
      } else {
        console.log(`  ❌ ${config.domain} -> No organization_id`);
      }
    }
  }

  // Check domains -> organizations
  const { data: domains } = await supabase
    .from('domains')
    .select('id, organization_id, domain')
    .limit(5);

  if (domains) {
    console.log('\nDomains Sample:');
    for (const domain of domains) {
      if (domain.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', domain.organization_id)
          .single();

        console.log(`  ✅ ${domain.domain} -> Org: ${org?.name || 'NOT FOUND'}`);
      } else {
        console.log(`  ❌ ${domain.domain} -> No organization_id`);
      }
    }
  }

  // Check scraped_pages -> domains -> organizations
  const { data: pages } = await supabase
    .from('scraped_pages')
    .select('id, domain_id, url')
    .limit(3);

  if (pages) {
    console.log('\nScraped Pages -> Domain -> Organization Chain:');
    for (const page of pages) {
      if (page.domain_id) {
        const { data: domain } = await supabase
          .from('domains')
          .select('domain, organization_id')
          .eq('id', page.domain_id)
          .single();

        if (domain && domain.organization_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', domain.organization_id)
            .single();

          console.log(`  ✅ ${page.url.substring(0, 50)}... -> ${domain.domain} -> ${org?.name || 'NOT FOUND'}`);
        } else {
          console.log(`  ⚠️  ${page.url.substring(0, 50)}... -> Domain missing org_id`);
        }
      } else {
        console.log(`  ❌ ${page.url.substring(0, 50)}... -> No domain_id`);
      }
    }
  }
}

async function main() {
  console.log('🔍 Database Structure and Organization Migration Check\n');
  console.log(`Database: ${SUPABASE_URL}\n`);
  console.log('='.repeat(80) + '\n');

  await checkTableColumns();
  await checkOrganizationData();
  await checkDataRelationships();

  console.log('\n' + '='.repeat(80));
  console.log('✅ Structure check complete\n');
}

main();
