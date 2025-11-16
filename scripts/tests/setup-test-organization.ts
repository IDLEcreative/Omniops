import { createServiceRoleClient } from '@/lib/supabase-server';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function setupTestOrganization() {
  console.log('🏢 Setting up test organization for E2E tests...');

  const supabase = await createServiceRoleClient();
  if (!supabase) {
    console.error('❌ Failed to create Supabase client');
    process.exit(1);
  }

  const testUserId = '5deae20e-04c3-48ee-805a-66cdda177c1e';
  const testEmail = 'test@omniops.test';

  console.log(`📍 Test User ID: ${testUserId}`);
  console.log(`📍 Test Email: ${testEmail}`);

  // Check if organization already exists by finding user's membership
  const { data: existingMembership } = await supabase
    .from('organization_members')
    .select('organization_id, organizations(*)')
    .eq('user_id', testUserId)
    .single();

  const existingOrg = existingMembership?.organizations as any;

  if (existingOrg) {
    console.log('✅ Test organization already exists:', existingOrg.name);
    console.log('   Organization ID:', existingOrg.id);

    // Check if user is member
    const { data: membership } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', existingOrg.id)
      .eq('user_id', testUserId)
      .single();

    if (membership) {
      console.log('✅ User is already a member with role:', membership.role);
    } else {
      console.log('⚠️  User not a member - adding membership...');
      await createMembership(supabase, existingOrg.id, testUserId);
    }

    return;
  }

  // Create new test organization
  console.log('📍 Creating new test organization...');

  const { data: newOrg, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: 'Test Organization (E2E)',
      slug: 'test-org-e2e'
    })
    .select()
    .single();

  if (orgError) {
    console.error('❌ Failed to create organization:', orgError.message);
    process.exit(1);
  }

  console.log('✅ Organization created:', newOrg.name);
  console.log('   Organization ID:', newOrg.id);

  // Add user as owner/member
  await createMembership(supabase, newOrg.id, testUserId);

  console.log('\n✅ Test organization setup complete!');
  console.log('   User can now access /dashboard after login');
}

async function createMembership(supabase: any, orgId: string, userId: string) {
  const { data: membership, error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: orgId,
      user_id: userId,
      role: 'owner',
      invited_by: userId
    })
    .select()
    .single();

  if (memberError) {
    console.error('❌ Failed to create membership:', memberError.message);
    process.exit(1);
  }

  console.log('✅ User added as organization owner');
  console.log('   Membership ID:', membership.id);
}

setupTestOrganization();
