const fs = require('fs');

// Read environment variables from .env.local
let envContent = '';
const envPaths = [
  'Omniops/.env.local',
  'Omniops/.env',
  '.env.local',
  '.env'
];

let envFound = false;
for (const envPath of envPaths) {
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('Using environment file:', envPath);
    envFound = true;
    break;
  } catch (err) {
    // Continue to next path
  }
}

if (!envFound) {
  console.error('Could not find any environment file in:', envPaths);
  process.exit(1);
}

// Parse environment variables
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      process.env[key] = valueParts.join('=');
    }
  }
});

const { createClient } = require('@supabase/supabase-js');

async function queryIndexes() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase environment variables');
    console.error('SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing');
    console.error('SERVICE_ROLE_KEY:', serviceRoleKey ? 'Found' : 'Missing');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Direct SQL query using the .from() method
    const { data, error } = await supabase
      .from('pg_indexes')
      .select('schemaname, tablename, indexname, indexdef')
      .eq('schemaname', 'public')
      .order('tablename')
      .order('indexname');

    if (error) {
      console.error('Error querying indexes:', error);
      // Try alternative approach with raw SQL if available
      console.log('Trying raw SQL approach...');
      
      const { data: rawData, error: rawError } = await supabase
        .rpc('execute_sql', {
          query: `
            SELECT
                schemaname,
                tablename,
                indexname,
                indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
            ORDER BY tablename, indexname;
          `
        });

      if (rawError) {
        console.error('Raw SQL also failed:', rawError);
        return;
      }

      console.log('Database Indexes (Raw SQL):');
      console.log(JSON.stringify(rawData, null, 2));
      return;
    }

    console.log('Database Indexes:');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to query database:', err);
  }
}

queryIndexes();