import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL\!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY\!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
  const tables = ['widget_configs', 'widget_config_history', 'widget_config_variants'];
  
  for (const table of tables) {
    console.log(`\n=== ${table} ===`);
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          policyname,
          cmd,
          roles,
          qual,
          with_check
        FROM pg_policies 
        WHERE tablename = '${table}'
        ORDER BY cmd, policyname;
      `
    });
    
    if (error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

checkPolicies().catch(console.error);
