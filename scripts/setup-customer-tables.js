const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Your app's Supabase credentials
const supabaseUrl = 'https://birugqyuqhiahxvxeyqg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupTables() {
  console.log('Setting up customer verification tables...');
  
  // Read the SQL file
  const sqlContent = fs.readFileSync(
    path.join(__dirname, 'create-customer-tables.sql'),
    'utf8'
  );
  
  // Split into individual statements (by semicolon followed by newline)
  const statements = sqlContent
    .split(/;\s*\n/)
    .filter(stmt => stmt.trim().length > 0)
    .map(stmt => stmt.trim() + ';');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const statement of statements) {
    // Skip comments
    if (statement.startsWith('--')) continue;
    
    try {
      // Extract the operation type for logging
      const operationType = statement.match(/^(CREATE|ALTER|GRANT|DROP)/i)?.[1] || 'EXECUTE';
      const objectName = statement.match(/(TABLE|INDEX|FUNCTION|POLICY)\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)/i)?.[2] || '';
      
      console.log(`${operationType} ${objectName}...`);
      
      const { error } = await supabase.rpc('exec_sql', {
        query: statement
      }).catch(async (rpcError) => {
        // If RPC doesn't exist, try direct execution
        return await supabase.from('_sql').insert({ query: statement });
      });
      
      if (error) {
        // Try alternative approach - direct SQL execution
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ query: statement })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
      }
      
      successCount++;
      console.log(`✓ ${operationType} ${objectName} completed`);
    } catch (error) {
      errorCount++;
      console.error(`✗ Failed to execute statement:`, error.message);
      // Continue with next statement
    }
  }
  
  console.log(`\nSetup complete: ${successCount} successful, ${errorCount} errors`);
  
  // Verify tables were created
  console.log('\nVerifying tables...');
  const tables = [
    'conversations',
    'messages', 
    'customer_configs',
    'customer_verifications',
    'customer_access_logs',
    'customer_data_cache'
  ];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`✗ Table ${table}: NOT FOUND`);
      } else {
        console.log(`✓ Table ${table}: EXISTS`);
      }
    } catch (err) {
      console.log(`✗ Table ${table}: ERROR - ${err.message}`);
    }
  }
}

setupTables().catch(console.error);