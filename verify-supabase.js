#!/usr/bin/env node

// Direct connection to Supabase to verify data
const { createClient } = require('@supabase/supabase-js');

// Use the correct project from .env
const supabaseUrl = 'https://birugqyuqhiahxvxeyqg.supabase.co';
// Service role key from .env file
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s';

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyData() {
  console.log('🔍 Connecting to correct Supabase project...');
  console.log(`📊 URL: ${supabaseUrl}`);
  console.log();

  // Check what tables exist
  console.log('📋 Checking tables in the database...');
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .in('table_name', ['conversations', 'messages', 'chat_sessions', 'chat_messages']);

  if (tablesError) {
    // Try a simpler query
    console.log('Trying alternate method...');
    
    // Check conversations table
    const { count: convCount, error: convError } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });
    
    if (!convError) {
      console.log('✅ Found "conversations" table');
    } else {
      console.log('❌ "conversations" table not found:', convError.message);
    }

    // Check messages table
    const { count: msgCount, error: msgError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });
    
    if (!msgError) {
      console.log('✅ Found "messages" table');
    } else {
      console.log('❌ "messages" table not found:', msgError.message);
    }
  } else {
    console.log('Tables found:', tables?.map(t => t.table_name).join(', ') || 'none');
  }

  console.log();
  console.log('📊 Checking recent conversations...');
  
  // Get recent conversations
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select(`
      id,
      session_id,
      created_at,
      messages (
        id,
        role,
        content,
        created_at
      )
    `)
    .order('created_at', { ascending: false })
    .limit(3);

  if (convError) {
    console.log('❌ Error fetching conversations:', convError.message);
    console.log('Code:', convError.code);
    console.log('Details:', convError.details);
  } else if (conversations && conversations.length > 0) {
    console.log(`✅ Found ${conversations.length} recent conversations:`);
    console.log();
    
    conversations.forEach((conv, index) => {
      console.log(`Conversation ${index + 1}:`);
      console.log(`  ID: ${conv.id}`);
      console.log(`  Session: ${conv.session_id}`);
      console.log(`  Created: ${new Date(conv.created_at).toLocaleString()}`);
      console.log(`  Messages: ${conv.messages?.length || 0}`);
      
      if (conv.messages && conv.messages.length > 0) {
        const lastMessage = conv.messages[conv.messages.length - 1];
        console.log(`  Last message (${lastMessage.role}): ${lastMessage.content.substring(0, 50)}...`);
      }
      console.log();
    });
  } else {
    console.log('⚠️  No conversations found in the database');
  }

  // Check message count
  const { count, error: countError } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true });

  if (!countError) {
    console.log(`📊 Total messages in database: ${count}`);
  }

  // Get the most recent message
  const { data: recentMsg, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!msgError && recentMsg) {
    console.log(`📝 Most recent message:`);
    console.log(`   Role: ${recentMsg.role}`);
    console.log(`   Content: ${recentMsg.content.substring(0, 100)}...`);
    console.log(`   Created: ${new Date(recentMsg.created_at).toLocaleString()}`);
  }
}

verifyData().catch(console.error);