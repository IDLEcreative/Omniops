/**
 * Setup Test User for E2E Tests
 *
 * Creates a test user in Supabase for authenticated E2E testing.
 * Run this once before running analytics export tests.
 *
 * Usage:
 *   npx tsx scripts/tests/setup-test-user.ts
 *
 * Environment Variables:
 *   TEST_USER_EMAIL - Email for test user (default: test@omniops.test)
 *   TEST_USER_PASSWORD - Password for test user (default: test_password_123_secure)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.test' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface TestUserConfig {
  email: string;
  password: string;
  metadata?: Record<string, any>;
}

async function setupTestUser(config?: Partial<TestUserConfig>) {
  const testEmail = config?.email || process.env.TEST_USER_EMAIL || 'test@omniops.test';
  const testPassword = config?.password || process.env.TEST_USER_PASSWORD || 'test_password_123_secure';
  const metadata = config?.metadata || {
    full_name: 'Test User',
    role: 'admin',
  };

  console.log('=== Test User Setup ===');
  console.log('📝 Creating test user:', testEmail);

  try {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === testEmail);

    if (existingUser) {
      console.log('⚠️  Test user already exists');
      console.log('   User ID:', existingUser.id);
      console.log('   Email:', existingUser.email);
      console.log('   Created:', existingUser.created_at);

      // Update password to ensure it's correct
      console.log('🔄 Updating password to ensure it matches...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password: testPassword,
      });

      if (updateError) {
        console.error('❌ Failed to update password:', updateError.message);
      } else {
        console.log('✅ Password updated successfully');
      }

      return existingUser;
    }

    // Create new test user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (authError) {
      console.error('❌ Failed to create auth user:', authError.message);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('User creation returned no user data');
    }

    console.log('✅ Test user created successfully');
    console.log('   User ID:', authData.user.id);
    console.log('   Email:', authData.user.email);
    console.log('   Email confirmed:', authData.user.email_confirmed_at ? 'Yes' : 'No');

    // Create customer config for the test user
    console.log('📝 Creating customer configuration...');

    const { error: configError } = await supabase.from('customer_configs').insert({
      user_id: authData.user.id,
      domain: 'test.omniops.local',
      business_name: 'Test Business',
      primary_color: '#3B82F6',
      widget_position: 'bottom-right',
    });

    if (configError) {
      console.log('⚠️  Could not create customer config:', configError.message);
      console.log('   This is optional and tests will still work');
    } else {
      console.log('✅ Customer configuration created');
    }

    return authData.user;
  } catch (err) {
    console.error('❌ Test user setup failed:', err);
    throw err;
  }
}

async function verifyTestUser(email: string) {
  console.log('\n=== Verifying Test User ===');
  console.log('🔍 Checking user:', email);

  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const user = existingUsers?.users?.find((u) => u.email === email);

  if (user) {
    console.log('✅ User exists in database');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Created:', user.created_at);
    console.log('   Email Confirmed:', user.email_confirmed_at ? 'Yes' : 'No');

    // Check customer config
    const { data: configs } = await supabase
      .from('customer_configs')
      .select('*')
      .eq('user_id', user.id);

    if (configs && configs.length > 0) {
      console.log('✅ Customer config found');
      console.log('   Domain:', configs[0].domain);
      console.log('   Business:', configs[0].business_name);
    } else {
      console.log('⚠️  No customer config found (optional)');
    }

    return true;
  } else {
    console.log('❌ User not found in database');
    return false;
  }
}

async function deleteTestUser(email: string) {
  console.log('\n=== Deleting Test User ===');
  console.log('🗑️  Removing user:', email);

  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const user = existingUsers?.users?.find((u) => u.email === email);

  if (!user) {
    console.log('⚠️  User not found');
    return;
  }

  // Delete customer config first
  const { error: configError } = await supabase.from('customer_configs').delete().eq('user_id', user.id);

  if (configError) {
    console.log('⚠️  Could not delete customer config:', configError.message);
  } else {
    console.log('✅ Customer config deleted');
  }

  // Delete user
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error('❌ Failed to delete user:', deleteError.message);
  } else {
    console.log('✅ User deleted successfully');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const testEmail = process.env.TEST_USER_EMAIL || 'test@omniops.test';

  if (command === 'delete') {
    await deleteTestUser(testEmail);
  } else if (command === 'verify') {
    await verifyTestUser(testEmail);
  } else {
    // Default: create/update user
    await setupTestUser();
    await verifyTestUser(testEmail);

    console.log('\n=== Setup Complete ===');
    console.log('You can now run authenticated E2E tests:');
    console.log('  npx playwright test --project=setup');
    console.log('  npx playwright test analytics-exports');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
