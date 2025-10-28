import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkViewSecurity() {
  console.log('Checking view security settings...\n');

  const { data, error } = await supabase.rpc('execute_sql', {
    query: `
      SELECT
        c.relname AS view_name,
        CASE
          WHEN c.reloptions IS NULL THEN 'SECURITY DEFINER (default)'
          WHEN 'security_invoker=true' = ANY(c.reloptions) THEN 'SECURITY INVOKER'
          WHEN 'security_invoker=false' = ANY(c.reloptions) THEN 'SECURITY DEFINER'
          ELSE 'SECURITY DEFINER (default)'
        END AS security_mode,
        c.reloptions
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname IN (
        'chat_telemetry_domain_costs',
        'chat_telemetry_hourly_costs',
        'chat_telemetry_metrics',
        'chat_telemetry_cost_analytics'
      )
      AND c.relkind = 'v'
      AND n.nspname = 'public'
      ORDER BY c.relname;
    `
  });

  if (error) {
    console.error('Error executing query:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No views found - trying direct query...');

    const { data: directData, error: directError } = await supabase
      .from('information_schema.views')
      .select('*')
      .in('table_name', [
        'chat_telemetry_domain_costs',
        'chat_telemetry_hourly_costs',
        'chat_telemetry_metrics',
        'chat_telemetry_cost_analytics'
      ]);

    if (directError) {
      console.error('Direct query error:', directError);
    } else {
      console.log('Views found:', directData);
    }
    return;
  }

  console.log('View Security Analysis:');
  console.log('========================\n');

  data.forEach((view: any) => {
    const isSecure = view.security_mode.includes('INVOKER');
    const icon = isSecure ? '✅' : '❌';
    console.log(`${icon} ${view.view_name}`);
    console.log(`   Security Mode: ${view.security_mode}`);
    console.log(`   Options: ${view.reloptions || 'None'}\n`);
  });

  const allSecure = data.every((view: any) => view.security_mode.includes('INVOKER'));

  console.log('\n========================');
  if (allSecure) {
    console.log('✅ All views are using SECURITY INVOKER - Security issue resolved!');
  } else {
    console.log('❌ Some views still using SECURITY DEFINER - Migration needed!');
  }
}

checkViewSecurity().catch(console.error);
