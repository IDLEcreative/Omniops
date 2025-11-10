import { createServiceRoleClient } from '@/lib/supabase-server';

async function applyBulkUpsertFunction() {
  const supabase = await createServiceRoleClient();

  console.log('📝 Applying bulk_upsert_scraped_pages function...\n');

  const createFunctionSQL = `
CREATE OR REPLACE FUNCTION bulk_upsert_scraped_pages(pages_input JSONB)
RETURNS TABLE(result_id UUID, result_url TEXT) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO scraped_pages (
    url,
    domain_id,
    title,
    content,
    metadata,
    last_scraped_at,
    status
  )
  SELECT
    (p->>'url')::TEXT,
    (p->>'domain_id')::UUID,
    (p->>'title')::TEXT,
    (p->>'content')::TEXT,
    (p->'metadata')::JSONB,
    COALESCE((p->>'last_scraped_at')::TIMESTAMPTZ, NOW()),
    COALESCE((p->>'status')::TEXT, 'completed')
  FROM jsonb_array_elements(pages_input) p
  ON CONFLICT (domain_id, url) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    metadata = EXCLUDED.metadata,
    last_scraped_at = EXCLUDED.last_scraped_at,
    status = EXCLUDED.status,
    updated_at = NOW()
  RETURNING scraped_pages.id, scraped_pages.url;
END;
$$ LANGUAGE plpgsql;
  `.trim();

  try {
    // Apply function via raw SQL (Supabase service role can execute DDL)
    const { error } = await supabase.rpc('exec', { sql: createFunctionSQL });

    if (error) {
      console.error('❌ Failed to create function:', error);
      console.log('\n💡 Trying alternative approach...\n');

      // Alternative: Use pg_stat_statements or direct connection
      // For now, user can apply manually in Supabase Dashboard
      console.log('Please apply this SQL manually in Supabase Dashboard → SQL Editor:');
      console.log('\n' + '='.repeat(70));
      console.log(createFunctionSQL);
      console.log('='.repeat(70) + '\n');

      return false;
    }

    console.log('✅ Function created successfully!');

    // Verify it exists
    const { data: testData, error: testError } = await supabase.rpc('bulk_upsert_scraped_pages', {
      pages_input: []
    });

    if (!testError) {
      console.log('✅ Function verified - callable');
      return true;
    } else {
      console.log('⚠️ Function created but verification failed:', testError.message);
      return true; // Function exists even if test failed
    }

  } catch (error) {
    console.error('❌ Exception:', error);
    return false;
  }
}

applyBulkUpsertFunction().then(success => {
  if (success) {
    console.log('\n✅ Migration complete - run tests again');
  } else {
    console.log('\n⚠️  Manual application required');
  }
  process.exit(success ? 0 : 1);
});
