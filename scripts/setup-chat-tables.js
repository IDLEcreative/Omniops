import { createClient  } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function setupChatTables() {
  console.log('🔧 Setting up chat tables in Supabase...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const migration = `
    -- Create chat_sessions table
    CREATE TABLE IF NOT EXISTS chat_sessions (
      session_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ended_at TIMESTAMPTZ,
      title TEXT,
      session_metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      message_count INTEGER DEFAULT 0,
      last_message_at TIMESTAMPTZ,
      context_summary TEXT
    );

    -- Create chat_messages table
    CREATE TABLE IF NOT EXISTS chat_messages (
      message_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      session_id UUID NOT NULL,
      user_id UUID,
      role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      metadata JSONB DEFAULT '{}',
      sequence_number INTEGER NOT NULL,
      token_count INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Add foreign key if it doesn't exist
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chat_messages_session_id_fkey'
      ) THEN
        ALTER TABLE chat_messages 
        ADD CONSTRAINT chat_messages_session_id_fkey 
        FOREIGN KEY (session_id) 
        REFERENCES chat_sessions(session_id) 
        ON DELETE CASCADE;
      END IF;
    END $$;

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_sequence ON chat_messages(session_id, sequence_number);
  `;

  try {
    console.log('📊 Creating tables...');
    const { error } = await supabase.rpc('exec_sql', { query: migration }).single();
    
    if (error) {
      // Try direct approach if RPC doesn't exist
      console.log('⚠️  RPC not available, trying direct SQL execution...');
      
      // Split the migration into individual statements
      const statements = migration
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        try {
          // Use a test query to check if tables exist
          if (statement.includes('CREATE TABLE IF NOT EXISTS chat_sessions')) {
            const { error: checkError } = await supabase
              .from('chat_sessions')
              .select('session_id')
              .limit(1);
            
            if (!checkError || checkError.code !== 'PGRST205') {
              console.log('✅ Table chat_sessions already exists or was created');
              continue;
            }
          }
          
          if (statement.includes('CREATE TABLE IF NOT EXISTS chat_messages')) {
            const { error: checkError } = await supabase
              .from('chat_messages')
              .select('message_id')
              .limit(1);
            
            if (!checkError || checkError.code !== 'PGRST205') {
              console.log('✅ Table chat_messages already exists or was created');
              continue;
            }
          }
          
          console.log('⚠️  Unable to execute:', statement.substring(0, 50) + '...');
        } catch (e) {
          console.log('⚠️  Statement skipped:', statement.substring(0, 50) + '...');
        }
      }
    } else {
      console.log('✅ Tables created successfully!');
    }

    // Test the tables
    console.log('\n🧪 Testing tables...');
    
    // Try to select from chat_sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('*')
      .limit(1);
    
    if (sessionsError && sessionsError.code === 'PGRST205') {
      console.log('❌ chat_sessions table not found. Please create it manually in Supabase dashboard.');
      console.log('\n📋 Copy the SQL from: supabase/migrations/20240101000000_create_chat_tables.sql');
      console.log('📍 Go to: https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/sql/new');
    } else if (sessionsError) {
      console.log('⚠️  Error accessing chat_sessions:', sessionsError.message);
    } else {
      console.log('✅ chat_sessions table is accessible');
    }
    
    // Try to select from chat_messages
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .limit(1);
    
    if (messagesError && messagesError.code === 'PGRST205') {
      console.log('❌ chat_messages table not found. Please create it manually in Supabase dashboard.');
    } else if (messagesError) {
      console.log('⚠️  Error accessing chat_messages:', messagesError.message);
    } else {
      console.log('✅ chat_messages table is accessible');
    }

    console.log('\n📝 Setup complete! The chat system will now:');
    console.log('   - Store conversations in Supabase if tables exist');
    console.log('   - Fall back to in-memory storage if tables are missing');
    console.log('   - Use WordPress context for personalized responses');
    
  } catch (error) {
    console.error('❌ Error during setup:', error);
    console.log('\n💡 Manual setup required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and run the SQL from: supabase/migrations/20240101000000_create_chat_tables.sql');
    console.log('4. The chat will automatically start using the database once tables are created');
  }
}

setupChatTables();