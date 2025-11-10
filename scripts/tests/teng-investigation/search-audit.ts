import type { SupabaseClient } from '@supabase/supabase-js';
import type { SearchResult } from './types';

export async function testSearchFunction(client: SupabaseClient, domainId: string) {
  console.log('\n📋 Step 5: Testing search_content_optimized function with "Teng torque"...');

  const { data, error } = await client.rpc('search_content_optimized', {
    query_text: 'Teng torque',
    query_embedding: null,
    p_domain_id: domainId,
    match_count: 10,
    use_hybrid: true
  });

  if (error) {
    console.error('❌ Error calling search_content_optimized:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return [];
  }

  const results = (data as SearchResult[]) || [];
  console.log(`✅ Search function returned ${results.length} results`);

  if (results.length === 0) {
    await tryBroaderSearch(client, domainId);
  } else {
    logSearchResults(results);
  }

  return results;
}

export async function verifySearchFunctionExists(client: SupabaseClient) {
  console.log('\n📋 Step 6: Verifying search_content_optimized function exists...');

  const { data, error } = await client
    .from('pg_proc')
    .select('proname')
    .eq('proname', 'search_content_optimized');

  if (error) {
    console.log('ℹ️  Cannot check function existence (pg_proc not accessible)');
    return;
  }

  if (data && data.length > 0) {
    console.log('✅ search_content_optimized function exists');
  } else {
    console.log('❌ search_content_optimized function not found');
  }
}

export async function searchSpecificTengProducts(client: SupabaseClient, domainId: string) {
  console.log('\n📋 Step 7: Searching for specific Teng Tools products...');

  const queries = ['Teng Tools', 'TENG TOOLS', 'teng torque wrench', 'teng socket set'];

  for (const query of queries) {
    console.log(`\n🔍 Searching for "${query}"...`);

    const { data, error } = await client
      .from('scraped_pages')
      .select('id, url, title, content')
      .eq('domain_id', domainId)
      .textSearch('content', query, {
        type: 'websearch',
        config: 'english'
      })
      .limit(3);

    if (error) {
      console.error(`❌ Error searching for "${query}":`, error.message);
      continue;
    }

    const pages = data || [];
    console.log(`✅ Found ${pages.length} pages for "${query}"`);
    pages.forEach((page, index) => logDirectSearchResult(page, index, query));
  }
}

async function tryBroaderSearch(client: SupabaseClient, domainId: string) {
  console.log('❌ No search results returned');
  console.log('\n🔍 Trying broader search with just "Teng"...');

  const { data, error } = await client.rpc('search_content_optimized', {
    query_text: 'Teng',
    query_embedding: null,
    p_domain_id: domainId,
    match_count: 5,
    use_hybrid: true
  });

  if (error) {
    console.error('❌ Error in broader search:', error);
    return;
  }

  const results = data as SearchResult[] | null;
  console.log(`✅ Broader search returned ${results?.length || 0} results`);
  results?.forEach((result, index) => {
    console.log(`${index + 1}. ${result.title} (Score: ${result.similarity_score})`);
  });
}

function logSearchResults(results: SearchResult[]) {
  console.log('\n🔍 Search Results for "Teng torque":');
  results.forEach((result, index) => {
    console.log(`\n--- Result ${index + 1} ---`);
    console.log(`URL: ${result.url}`);
    console.log(`Title: ${result.title || 'No title'}`);
    console.log(`Similarity Score: ${result.similarity_score}`);
    console.log(`Content Type: ${result.content_type || 'Unknown'}`);
    console.log(`Scraped: ${result.scraped_at || 'Unknown'}`);
    if (result.content_snippet) {
      console.log(`Content: ${result.content_snippet.slice(0, 200)}...`);
    }
  });
}

function logDirectSearchResult(page: any, index: number, query: string) {
  console.log(`  ${index + 1}. ${page.title}`);
  console.log(`     URL: ${page.url}`);

  if (!page.content) {
    return;
  }

  const queryLower = query.toLowerCase();
  const contentLower = page.content.toLowerCase();
  const queryIndex = contentLower.indexOf(queryLower);

  if (queryIndex === -1) {
    return;
  }

  const start = Math.max(0, queryIndex - 50);
  const end = Math.min(page.content.length, queryIndex + 150);
  const snippet = page.content.slice(start, end);
  console.log(`     Context: ...${snippet}...`);
}
