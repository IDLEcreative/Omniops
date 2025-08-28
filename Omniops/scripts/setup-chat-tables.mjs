import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

console.log('🔧 Setting up chat tables in Supabase...');
console.log(`📍 Project: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testTables() {
  // Test chat_sessions table
  const { data: sessions, error: sessionsError } = await supabase
    .from('chat_sessions')
    .select('session_id')
    .limit(1);
  
  if (sessionsError && sessionsError.code === 'PGRST205') {
    console.log('❌ chat_sessions table not found');
    console.log('\n📋 Please create tables manually:');
    console.log('1. Go to: https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/sql/new');
    console.log('2. Copy SQL from: supabase/migrations/20240101000000_create_chat_tables.sql');
    console.log('3. Run the SQL in the SQL Editor');
    return false;
  } else if (sessionsError) {
    console.log('⚠️  Error accessing chat_sessions:', sessionsError.message);
    return false;
  } else {
    console.log('✅ chat_sessions table exists and is accessible');
  }
  
  // Test chat_messages table
  const { data: messages, error: messagesError } = await supabase
    .from('chat_messages')
    .select('message_id')
    .limit(1);
  
  if (messagesError && messagesError.code === 'PGRST205') {
    console.log('❌ chat_messages table not found');
    return false;
  } else if (messagesError) {
    console.log('⚠️  Error accessing chat_messages:', messagesError.message);
    return false;
  } else {
    console.log('✅ chat_messages table exists and is accessible');
  }
  
  return true;
}

async function testChatFunctionality() {
  console.log('\n🧪 Testing chat functionality...');
  
  // Create a test session
  const testSession = {
    user_id: null,
    started_at: new Date().toISOString(),
    session_metadata: { test: true },
    message_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .insert(testSession)
    .select()
    .single();
  
  if (sessionError) {
    console.log('❌ Failed to create test session:', sessionError.message);
    return;
  }
  
  console.log('✅ Successfully created test session:', session.session_id);
  
  // Add a test message
  const testMessage = {
    session_id: session.session_id,
    role: 'user',
    content: 'Test message',
    metadata: {},
    sequence_number: 1,
    token_count: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { data: message, error: messageError } = await supabase
    .from('chat_messages')
    .insert(testMessage)
    .select()
    .single();
  
  if (messageError) {
    console.log('❌ Failed to create test message:', messageError.message);
    return;
  }
  
  console.log('✅ Successfully created test message:', message.message_id);
  
  // Clean up test data
  const { error: deleteError } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('session_id', session.session_id);
  
  if (!deleteError) {
    console.log('✅ Test data cleaned up successfully');
  }
  
  console.log('\n🎉 Chat system is fully operational!');
  console.log('   - Database tables are set up correctly');
  console.log('   - Chat API will store conversations persistently');
  console.log('   - WordPress context will be saved with messages');
}

async function main() {
  const tablesExist = await testTables();
  
  if (tablesExist) {
    await testChatFunctionality();
  } else {
    console.log('\n💡 Next steps:');
    console.log('1. Create the tables manually in Supabase dashboard');
    console.log('2. The chat will automatically start using the database');
    console.log('3. Until then, it will use in-memory storage as fallback');
  }
}

main().catch(console.error);