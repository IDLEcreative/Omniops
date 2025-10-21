#!/usr/bin/env tsx
/**
 * Example: Testing Cross-Organization Isolation with User Tokens
 *
 * This script demonstrates HOW to test RLS policies with actual user tokens.
 * You need to create test users first and obtain their JWT tokens.
 *
 * SETUP INSTRUCTIONS:
 * 1. Create two test organizations in Supabase Dashboard
 * 2. Create a test user for each organization
 * 3. Add users as members to their respective organizations
 * 4. Obtain JWT tokens for each user (from Supabase Auth)
 * 5. Replace the placeholder tokens below
 * 6. Run this script
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ========================================
// STEP 1: CREATE TEST USERS
// ========================================
//
// Option A: Via Supabase Dashboard
// 1. Go to Authentication → Users → Add User
// 2. Create user1@test.com for Org A
// 3. Create user2@test.com for Org B
//
// Option B: Via Script
async function createTestUsers() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log('Creating test users...\n');

  // User 1 for Org A
  const { data: user1, error: error1 } = await supabase.auth.signUp({
    email: 'test-org-a@example.com',
    password: 'Test123!@#Password',
  });

  if (error1) {
    console.log('❌ Error creating user 1:', error1.message);
  } else {
    console.log('✅ User 1 created:', user1.user?.id);
    console.log('   Email: test-org-a@example.com');
  }

  // User 2 for Org B
  const { data: user2, error: error2 } = await supabase.auth.signUp({
    email: 'test-org-b@example.com',
    password: 'Test123!@#Password',
  });

  if (error2) {
    console.log('❌ Error creating user 2:', error2.message);
  } else {
    console.log('✅ User 2 created:', user2.user?.id);
    console.log('   Email: test-org-b@example.com');
  }

  console.log('\n⚠️  IMPORTANT: Check your email to confirm accounts!\n');
}

// ========================================
// STEP 2: CREATE TEST ORGANIZATIONS
// ========================================
//
// You need to create these via your API or dashboard
async function createTestOrganizations() {
  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  console.log('Creating test organizations...\n');

  // Org A
  const { data: orgA, error: errorA } = await supabase
    .from('organizations')
    .insert({
      name: 'Test Organization A',
      slug: 'test-org-a',
      plan_type: 'starter',
      seat_limit: 5
    })
    .select()
    .single();

  if (errorA) {
    console.log('❌ Error creating Org A:', errorA.message);
  } else {
    console.log('✅ Org A created:', orgA.id);
    console.log('   Name:', orgA.name);
  }

  // Org B
  const { data: orgB, error: errorB } = await supabase
    .from('organizations')
    .insert({
      name: 'Test Organization B',
      slug: 'test-org-b',
      plan_type: 'starter',
      seat_limit: 5
    })
    .select()
    .single();

  if (errorB) {
    console.log('❌ Error creating Org B:', errorB.message);
  } else {
    console.log('✅ Org B created:', orgB.id);
    console.log('   Name:', orgB.name);
  }

  return { orgA, orgB };
}

// ========================================
// STEP 3: ADD USERS TO ORGANIZATIONS
// ========================================
//
// Link users to their organizations
async function addUsersToOrgs(orgAId: string, orgBId: string, userAId: string, userBId: string) {
  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  console.log('\nAdding users to organizations...\n');

  // Add User A to Org A
  const { error: errorA } = await supabase
    .from('organization_members')
    .insert({
      organization_id: orgAId,
      user_id: userAId,
      role: 'admin'
    });

  if (errorA) {
    console.log('❌ Error adding User A to Org A:', errorA.message);
  } else {
    console.log('✅ User A added to Org A as admin');
  }

  // Add User B to Org B
  const { error: errorB } = await supabase
    .from('organization_members')
    .insert({
      organization_id: orgBId,
      user_id: userBId,
      role: 'admin'
    });

  if (errorB) {
    console.log('❌ Error adding User B to Org B:', errorB.message);
  } else {
    console.log('✅ User B added to Org B as admin');
  }
}

// ========================================
// STEP 4: TEST ISOLATION WITH USER TOKENS
// ========================================
//
// This is the actual test - use real user JWT tokens
async function testIsolation() {
  console.log('\n' + '='.repeat(80));
  console.log('TESTING CROSS-ORGANIZATION ISOLATION');
  console.log('='.repeat(80) + '\n');

  // ⚠️ REPLACE THESE WITH ACTUAL JWT TOKENS FROM YOUR TEST USERS
  const USER_A_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Get from user A session
  const USER_B_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Get from user B session

  // Create clients with user tokens (NOT service role!)
  const clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${USER_A_TOKEN}`
      }
    }
  });

  const clientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${USER_B_TOKEN}`
      }
    }
  });

  console.log('🧪 Test 1: User A queries their organizations');
  const { data: orgsA, error: errorOrgsA } = await clientA
    .from('organizations')
    .select('id, name');

  if (errorOrgsA) {
    console.log('❌ Error:', errorOrgsA.message);
  } else {
    console.log(`✅ User A can see ${orgsA?.length || 0} organization(s):`);
    orgsA?.forEach(org => console.log(`   - ${org.name} (${org.id})`));
  }

  console.log('\n🧪 Test 2: User B queries their organizations');
  const { data: orgsB, error: errorOrgsB } = await clientB
    .from('organizations')
    .select('id, name');

  if (errorOrgsB) {
    console.log('❌ Error:', errorOrgsB.message);
  } else {
    console.log(`✅ User B can see ${orgsB?.length || 0} organization(s):`);
    orgsB?.forEach(org => console.log(`   - ${org.name} (${org.id})`));
  }

  // Check if there's any overlap (there shouldn't be!)
  const orgAIds = new Set(orgsA?.map(o => o.id) || []);
  const orgBIds = new Set(orgsB?.map(o => o.id) || []);
  const overlap = [...orgAIds].filter(id => orgBIds.has(id));

  if (overlap.length > 0) {
    console.log('\n❌ CRITICAL: Users can see each other\'s organizations!');
    console.log('   Overlapping org IDs:', overlap);
  } else {
    console.log('\n✅ PASSED: No overlap between organizations');
  }

  console.log('\n🧪 Test 3: User A queries customer_configs');
  const { data: configsA, error: errorConfigsA } = await clientA
    .from('customer_configs')
    .select('id, domain, organization_id');

  if (errorConfigsA) {
    console.log('❌ Error:', errorConfigsA.message);
  } else {
    console.log(`✅ User A can see ${configsA?.length || 0} config(s):`);
    configsA?.forEach(cfg => console.log(`   - ${cfg.domain} (org: ${cfg.organization_id})`));
  }

  console.log('\n🧪 Test 4: User B queries customer_configs');
  const { data: configsB, error: errorConfigsB } = await clientB
    .from('customer_configs')
    .select('id, domain, organization_id');

  if (errorConfigsB) {
    console.log('❌ Error:', errorConfigsB.message);
  } else {
    console.log(`✅ User B can see ${configsB?.length || 0} config(s):`);
    configsB?.forEach(cfg => console.log(`   - ${cfg.domain} (org: ${cfg.organization_id})`));
  }

  // Check if configs overlap
  const configAIds = new Set(configsA?.map(c => c.id) || []);
  const configBIds = new Set(configsB?.map(c => c.id) || []);
  const configOverlap = [...configAIds].filter(id => configBIds.has(id));

  if (configOverlap.length > 0) {
    console.log('\n❌ CRITICAL: Users can see each other\'s configs!');
    console.log('   Overlapping config IDs:', configOverlap);
  } else {
    console.log('\n✅ PASSED: No overlap between customer configs');
  }

  console.log('\n🧪 Test 5: User A tries to access Org B directly');
  if (orgsB && orgsB.length > 0) {
    const orgBId = orgsB[0].id;
    const { data: hackAttempt, error: hackError } = await clientA
      .from('customer_configs')
      .select('*')
      .eq('organization_id', orgBId);

    if (hackError) {
      console.log('✅ SECURE: User A blocked from accessing Org B');
      console.log('   Error:', hackError.message);
    } else if (!hackAttempt || hackAttempt.length === 0) {
      console.log('✅ SECURE: User A cannot see Org B configs (empty result)');
    } else {
      console.log('❌ CRITICAL SECURITY ISSUE: User A can access Org B data!');
      console.log('   Data leaked:', hackAttempt);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('ISOLATION TEST COMPLETE');
  console.log('='.repeat(80) + '\n');
}

// ========================================
// MAIN FUNCTION
// ========================================

async function main() {
  console.log('🔒 Organization Isolation Test Suite\n');
  console.log('This script helps you test RLS policies with actual user tokens.\n');
  console.log('='.repeat(80) + '\n');

  console.log('OPTIONS:\n');
  console.log('1. Run full setup (create users, orgs, and test)');
  console.log('2. Just test isolation (you already have users/orgs)');
  console.log('3. Show instructions only\n');

  const mode = process.argv[2] || 'instructions';

  switch (mode) {
    case 'setup':
      console.log('🚀 Running full setup...\n');
      await createTestUsers();
      // Note: After creating users, you need to get their IDs and tokens
      console.log('\n⚠️  NEXT STEPS:');
      console.log('1. Check your email and confirm the test user accounts');
      console.log('2. Sign in with each user to get their JWT tokens');
      console.log('3. Update this script with the JWT tokens');
      console.log('4. Run: npx tsx test-user-isolation-example.ts test\n');
      break;

    case 'test':
      console.log('🧪 Testing isolation with user tokens...\n');
      await testIsolation();
      break;

    case 'instructions':
    default:
      console.log('📚 INSTRUCTIONS:\n');
      console.log('To test RLS policies properly, you need actual user JWT tokens.\n');
      console.log('STEP 1: Create test users');
      console.log('  npx tsx test-user-isolation-example.ts setup\n');
      console.log('STEP 2: Get JWT tokens');
      console.log('  - Sign in with test-org-a@example.com');
      console.log('  - In browser console: supabase.auth.getSession()');
      console.log('  - Copy the access_token');
      console.log('  - Repeat for test-org-b@example.com\n');
      console.log('STEP 3: Update tokens in this script');
      console.log('  - Edit USER_A_TOKEN and USER_B_TOKEN in testIsolation()');
      console.log('  - Replace with actual JWT tokens\n');
      console.log('STEP 4: Run isolation tests');
      console.log('  npx tsx test-user-isolation-example.ts test\n');
      console.log('EXPECTED RESULTS:');
      console.log('  ✅ User A can only see Org A data');
      console.log('  ✅ User B can only see Org B data');
      console.log('  ✅ No cross-organization access');
      console.log('  ✅ Direct access attempts are blocked\n');
      break;
  }
}

// Only run if not imported
if (require.main === module) {
  main();
}

export { createTestUsers, createTestOrganizations, addUsersToOrgs, testIsolation };
