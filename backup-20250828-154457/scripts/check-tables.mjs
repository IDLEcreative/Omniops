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

console.log('🔍 Checking table structure in your Supabase project...\n');
console.log(`📍 Project: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkTables() {
  // Check conversations table structure
  console.log('📊 Conversations table:');
  const { data: convData, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .limit(0);
  
  if (convError) {
    console.log('❌ Error:', convError.message);
  } else {
    console.log('✅ Table exists');
    // Try to get one row to see structure
    const { data: sample, error: sampleError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);
    
    if (sample && sample.length > 0) {
      console.log('📋 Columns:', Object.keys(sample[0]));
    }
  }
  
  console.log('\n📊 Messages table:');
  const { data: msgData, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .limit(0);
  
  if (msgError) {
    console.log('❌ Error:', msgError.message);
  } else {
    console.log('✅ Table exists');
    // Try to get one row to see structure
    const { data: sample, error: sampleError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    if (sample && sample.length > 0) {
      console.log('📋 Columns:', Object.keys(sample[0]));
    }
  }
}

checkTables().catch(console.error);