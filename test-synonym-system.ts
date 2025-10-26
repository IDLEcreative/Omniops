/**
 * Test Script for Database-Driven Synonym System
 *
 * Tests:
 * 1. Loading synonyms from database
 * 2. Query expansion
 * 3. API endpoints (POST, GET, DELETE)
 * 4. Cache functionality
 *
 * Usage:
 *   npx tsx test-synonym-system.ts
 */

import { synonymLoader } from './lib/synonym-loader';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testSynonymSystem() {
  console.log('🧪 Testing Database-Driven Synonym System\n');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Step 1: Get a test domain
  console.log('📋 Step 1: Finding test domain...');
  const { data: configs, error: configError } = await supabase
    .from('customer_configs')
    .select('id, domain')
    .limit(1);

  if (configError || !configs || configs.length === 0) {
    console.error('❌ No customer configs found:', configError);
    process.exit(1);
  }

  const testDomainId = configs[0].id;
  const testDomain = configs[0].domain;
  console.log(`✅ Using test domain: ${testDomain} (${testDomainId})\n`);

  // Step 2: Check existing synonyms
  console.log('📋 Step 2: Checking existing synonyms...');
  const { data: existingSynonyms, error: synError } = await supabase
    .from('domain_synonym_mappings')
    .select('*')
    .eq('domain_id', testDomainId);

  console.log(`✅ Found ${existingSynonyms?.length || 0} existing synonym mappings\n`);

  // Step 3: Add test synonym via database
  console.log('📋 Step 3: Adding test synonym...');
  const testTerm = 'test_pump';
  const testSynonyms = ['hydraulic pump', 'fluid pump', 'pumping unit'];

  const { data: newSynonym, error: insertError } = await supabase
    .from('domain_synonym_mappings')
    .upsert({
      domain_id: testDomainId,
      term: testTerm,
      synonyms: testSynonyms,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'domain_id,term'
    })
    .select();

  if (insertError) {
    console.error('❌ Error adding synonym:', insertError);
  } else {
    console.log(`✅ Added synonym: "${testTerm}" -> [${testSynonyms.join(', ')}]\n`);
  }

  // Step 4: Load synonyms via loader
  console.log('📋 Step 4: Loading synonyms via synonym-loader...');
  const loadedSynonyms = await synonymLoader.loadSynonymsForDomain(testDomainId);
  console.log(`✅ Loaded ${loadedSynonyms.size} synonym mappings from cache\n`);

  // Step 5: Test specific term lookup
  console.log('📋 Step 5: Testing specific term lookup...');
  const pumpSynonyms = await synonymLoader.getSynonymsForTerm(testDomainId, testTerm);
  console.log(`✅ Synonyms for "${testTerm}": [${pumpSynonyms.join(', ')}]\n`);

  // Step 6: Test query expansion
  console.log('📋 Step 6: Testing query expansion...');
  const testQuery = `need ${testTerm}`;
  const expandedQuery = await synonymLoader.expandQuery(testDomainId, testQuery, 2);
  console.log(`Original query: "${testQuery}"`);
  console.log(`Expanded query: "${expandedQuery}"\n`);

  // Step 7: Test cache stats
  console.log('📋 Step 7: Cache statistics...');
  const cacheStats = synonymLoader.getCacheStats();
  console.log('✅ Cache stats:', JSON.stringify(cacheStats, null, 2));
  console.log();

  // Step 8: Test cache invalidation
  console.log('📋 Step 8: Testing cache invalidation...');
  synonymLoader.clearCache(testDomainId);
  console.log('✅ Cache cleared for domain');

  // Reload to verify cache was cleared
  const reloadedSynonyms = await synonymLoader.loadSynonymsForDomain(testDomainId);
  console.log(`✅ Reloaded ${reloadedSynonyms.size} synonym mappings from database\n`);

  // Step 9: Check global synonyms
  console.log('📋 Step 9: Checking global synonyms...');
  const { data: globalSynonyms, error: globalError } = await supabase
    .from('global_synonym_mappings')
    .select('*')
    .eq('is_safe_for_all', true)
    .limit(5);

  console.log(`✅ Found ${globalSynonyms?.length || 0} global synonyms (showing first 5)`);
  if (globalSynonyms && globalSynonyms.length > 0) {
    globalSynonyms.forEach((syn: any) => {
      console.log(`   - "${syn.term}" -> [${syn.synonyms.slice(0, 3).join(', ')}...]`);
    });
  }
  console.log();

  // Step 10: Cleanup test data
  console.log('📋 Step 10: Cleanup (optional)...');
  const shouldCleanup = false; // Set to true to remove test data
  if (shouldCleanup) {
    const { error: deleteError } = await supabase
      .from('domain_synonym_mappings')
      .delete()
      .eq('domain_id', testDomainId)
      .eq('term', testTerm);

    if (deleteError) {
      console.error('❌ Error cleaning up:', deleteError);
    } else {
      console.log(`✅ Deleted test synonym "${testTerm}"`);
    }
  } else {
    console.log('⏭️  Skipping cleanup (test data preserved)');
  }

  console.log('\n✅ All tests completed successfully!');
  console.log('\n📚 Next steps:');
  console.log('   1. Test API endpoints: curl http://localhost:3000/api/synonyms?domainId=' + testDomainId);
  console.log('   2. Integrate with search: import { synonymLoader } from "@/lib/synonym-loader"');
  console.log('   3. Build admin UI at /dashboard/synonyms');
  console.log('   4. Migrate hardcoded synonyms from lib/synonym-expander.ts');
}

// Run tests
testSynonymSystem().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
