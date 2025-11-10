async function inferIndexPresence(supabase, label, queryFn) {
  const start = process.hrtime.bigint();
  await queryFn();
  const duration = Number(process.hrtime.bigint() - start) / 1_000_000;

  if (duration < 50) {
    console.log(`  ✅ ${label}: Likely indexed (${duration.toFixed(2)}ms)`);
  } else if (duration < 200) {
    console.log(`  ⚠️  ${label}: Possibly indexed (${duration.toFixed(2)}ms)`);
  } else {
    console.log(`  ❌ ${label}: Likely NOT indexed (${duration.toFixed(2)}ms)`);
  }
}

export async function checkIndexes(supabase) {
  console.log('\n\n📊 CHECKING DATABASE INDEXES\n');
  console.log('='.repeat(60));

  try {
    const { data, error } = await supabase.rpc('get_indexes_info');
    if (error || !data) {
      throw error || new Error('No index data returned');
    }

    console.log('Database indexes found:');
    data.forEach((idx) => console.log(`  - ${idx.tablename}.${idx.indexname}`));
  } catch {
    console.log('⚠️  Cannot query index metadata directly; inferring via query timings...\n');
    await inferIndexPresence(supabase, 'scraped_pages.url', () =>
      supabase.from('scraped_pages').select('id').eq('url', 'test').single(),
    );
    await inferIndexPresence(supabase, 'page_embeddings.page_id', () =>
      supabase.from('page_embeddings').select('id').eq('page_id', 'test-id').limit(1),
    );
  }

  console.log('\n🎯 CRITICAL INDEXES NEEDED:');
  console.log('  1. page_embeddings(page_id) - MOST CRITICAL');
  console.log('  2. scraped_pages(url) - For upsert operations');
  console.log('  3. scraped_pages(domain_id) - For domain filtering');
}
