/**
 * Check if users exist in Supabase Auth
 */
import { createClient } from '@supabase/supabase-js';

async function checkAuthUsers() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
    process.exit(1);
  }

  console.log('🔑 Environment variables loaded');
  console.log('📍 Supabase URL:', supabaseUrl);

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // List all users (requires service role key)
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('❌ Error fetching users:', error.message);
      if (error.message.includes('Invalid API key')) {
        console.log('\n💡 Your SUPABASE_SERVICE_ROLE_KEY appears to be invalid or placeholder.');
        console.log('   Get the real key from: https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/settings/api');
      }
      process.exit(1);
    }

    if (!users || users.length === 0) {
      console.log('\n⚠️  No users found in your Supabase project!');
      console.log('\n📝 To create a user, you have two options:');
      console.log('   1. Sign up via the app: http://localhost:3000/signup');
      console.log('   2. Create via Supabase Dashboard: https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/auth/users');
      return;
    }

    console.log(`\n✅ Found ${users.length} user(s):\n`);
    users.forEach((user, i) => {
      console.log(`${i + 1}. Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Confirmed: ${user.email_confirmed_at ? '✅ Yes' : '❌ No (check email for confirmation link)'}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleDateString()}`);
      console.log('');
    });

    console.log('💡 If you\'re getting 401 errors:');
    console.log('   1. Make sure you\'re using the correct email address');
    console.log('   2. Make sure you\'re using the correct password');
    console.log('   3. If email is not confirmed, check your email for confirmation link');
    console.log('   4. Or reset your password: http://localhost:3000/reset-password');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkAuthUsers();
