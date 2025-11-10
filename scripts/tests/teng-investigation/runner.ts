import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from './supabase-client';
import { resolveDomain } from './domain-service';
import { fetchTengPages, countDomainPages, sampleRecentPages, summarizeTengMentions } from './page-audit';
import { testSearchFunction, verifySearchFunctionExists, searchSpecificTengProducts } from './search-audit';
import { checkEmbeddings } from './embedding-audit';

export async function runTengInvestigation() {
  console.log('🔍 Starting Teng Products Investigation for thompsonseparts.co.uk');
  console.log('='.repeat(80));

  const client = createServiceClient();

  try {
    const domain = await resolveDomain(client);
    if (!domain) {
      return;
    }

    const tengPages = await fetchTengPages(client, domain.id);
    const totalPages = await countDomainPages(client, domain.id, domain.domain);
    await sampleRecentPages(client, domain.id);
    await testSearchFunction(client, domain.id);
    await verifySearchFunctionExists(client);
    await searchSpecificTengProducts(client, domain.id);
    await checkEmbeddings(client, tengPages);
    summarizeTengMentions(domain, totalPages, tengPages);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  } finally {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 Investigation Complete');
  }
}
