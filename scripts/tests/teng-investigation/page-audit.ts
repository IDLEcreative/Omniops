import type { SupabaseClient } from '@supabase/supabase-js';
import type { DomainInfo, ScrapedPage } from './types';

export async function fetchTengPages(client: SupabaseClient, domainId: string): Promise<ScrapedPage[]> {
  console.log('\n📋 Step 2: Searching for Teng products in scraped_pages...');

  const { data, error } = await client
    .from('scraped_pages')
    .select('id, url, title, content, metadata, scraped_at')
    .eq('domain_id', domainId)
    .or('content.ilike.%Teng%,title.ilike.%Teng%,url.ilike.%teng%')
    .order('scraped_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error searching for Teng products:', error);
    return [];
  }

  const pages = (data as ScrapedPage[]) || [];
  console.log(`✅ Found ${pages.length} pages containing "Teng"`);

  if (pages.length === 0) {
    console.log('❌ No Teng products found in scraped_pages');
    return [];
  }

  console.log('\n🔍 Teng Products Found:');
  pages.forEach((page, index) => logPageDetails(page, index));
  return pages;
}

export async function countDomainPages(client: SupabaseClient, domainId: string, domainName: string) {
  console.log('\n📋 Step 3: Checking total scraped pages for this domain...');

  const { count, error } = await client
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .eq('domain_id', domainId);

  if (error) {
    console.error('❌ Error counting pages:', error);
    return null;
  }

  console.log(`✅ Total pages scraped for ${domainName}: ${count || 0}`);
  return count;
}

export async function sampleRecentPages(client: SupabaseClient, domainId: string) {
  console.log('\n📋 Step 4: Sampling recent pages to understand content structure...');

  const { data, error } = await client
    .from('scraped_pages')
    .select('id, url, title, content')
    .eq('domain_id', domainId)
    .not('content', 'is', null)
    .order('scraped_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('❌ Error fetching sample pages:', error);
    return;
  }

  const pages = data as ScrapedPage[] | null;
  if (!pages || pages.length === 0) {
    console.log('❌ No sample pages found');
    return;
  }

  console.log(`✅ Sample of ${pages.length} recent pages:`);
  pages.forEach((page, index) => logSampleDetails(page, index));
}

export function summarizeTengMentions(domain: DomainInfo, totalPages: number | null, tengPages: ScrapedPage[]) {
  console.log('\n📋 Step 9: Analysis Summary and Recommendations...');

  console.log('\n📊 Key Findings:');
  console.log(`• Domain: ${domain.domain} (${domain.name})`);
  console.log(`• Total Pages: ${totalPages || 0}`);
  console.log(`• Pages with "Teng": ${tengPages.length}`);
  console.log(`• Last Scraped: ${domain.last_scraped_at}`);

  if (tengPages.length === 0) {
    return;
  }

  console.log('\n📋 Teng Mention Analysis:');

  const navMentions = tengPages.filter(page =>
    page.content?.includes('TENG TOOLS') &&
    page.content.includes('Hand Tools Pressure Washers Air Tools')
  ).length;

  const actualProducts = tengPages.filter(page =>
    page.title?.toLowerCase().includes('teng') &&
    !page.title.toLowerCase().includes('tipping') &&
    !page.title.toLowerCase().includes('tipper')
  ).length;

  console.log(`• Navigation/Menu mentions: ${navMentions}`);
  console.log(`• Actual Teng product pages: ${actualProducts}`);
  console.log(`• Teng-related (tipping/tipper): ${tengPages.length - actualProducts}`);

  const dedicatedTengPages = tengPages.filter(page =>
    page.url?.includes('/teng') ||
    page.url?.includes('/tools') ||
    page.url?.toLowerCase().includes('teng-tools')
  );

  console.log(`• Dedicated Teng Tools URLs: ${dedicatedTengPages.length}`);
  dedicatedTengPages.forEach(page => {
    console.log(`    - ${page.url}`);
  });

  console.log('\n🔍 Recommendations:');
  console.log('1. The "Teng" mentions appear to be mainly navigation items, not actual Teng Tools products');
  console.log('2. Thompson\'s E Parts seems to be a tipper/truck parts supplier, not a tool retailer');
  console.log('3. Ensure search function calls include match_count, p_domain_id, query_embedding, query_text, use_hybrid');
  console.log('4. Investigate whether a dedicated Teng Tools section exists on the website');
  console.log('5. Embedding counts suggest some content is indexed for semantic search');
}

function logPageDetails(page: ScrapedPage, index: number) {
  console.log(`\n--- Product ${index + 1} ---`);
  console.log(`URL: ${page.url}`);
  console.log(`Title: ${page.title || 'No title'}`);
  console.log(`Scraped: ${page.scraped_at || 'Unknown'}`);

  if (page.content) {
    const tengIndex = page.content.toLowerCase().indexOf('teng');
    if (tengIndex !== -1) {
      const start = Math.max(0, tengIndex - 100);
      const end = Math.min(page.content.length, tengIndex + 200);
      const snippet = page.content.slice(start, end);
      console.log(`Content snippet: ...${snippet}...`);
    } else {
      console.log(`Content length: ${page.content.length} chars (no "teng" found in content)`);
    }
  } else {
    console.log('Content: No content');
  }

  if (page.metadata && typeof page.metadata === 'object') {
    console.log('Metadata keys:', Object.keys(page.metadata));
  }
}

function logSampleDetails(page: ScrapedPage, index: number) {
  console.log(`\n--- Sample ${index + 1} ---`);
  console.log(`URL: ${page.url}`);
  console.log(`Title: ${page.title || 'No title'}`);

  if (!page.content) {
    console.log('Content: None');
    return;
  }

  const preview = page.content.slice(0, 200).replace(/\n/g, ' ');
  console.log(`Content preview: ${preview}...`);
  console.log(`Content length: ${page.content.length} chars`);

  const toolBrands = ['Teng', 'Snap-on', 'Bahco', 'Facom', 'Beta', 'Gedore'];
  const foundBrands = toolBrands.filter(brand =>
    page.content?.toLowerCase().includes(brand.toLowerCase()) ||
    page.title?.toLowerCase().includes(brand.toLowerCase())
  );

  if (foundBrands.length > 0) {
    console.log(`Tool brands found: ${foundBrands.join(', ')}`);
  }
}
