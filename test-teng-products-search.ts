import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function searchTengProducts() {
  console.log('🔍 Searching for Teng products in database...\n');

  // Get domain_id first
  const { data: domainData, error: domainError } = await supabase
    .from('domains')
    .select('id')
    .eq('domain', 'thompsonseparts.co.uk')
    .single();

  if (domainError || !domainData) {
    console.error('❌ Could not find domain_id for thompsonseparts.co.uk');
    return;
  }

  const domainId = domainData.id;
  console.log(`Domain ID: ${domainId}\n`);

  // 1. Search for "Teng" in product URLs
  console.log('1️⃣ Searching for Teng in product URLs:');
  const { data: urlResults, error: urlError } = await supabase
    .from('scraped_pages')
    .select('url, title, content')
    .eq('domain_id', domainId)
    .ilike('url', '%/product/%')
    .or('url.ilike.%teng%,title.ilike.%teng%,content.ilike.%teng%')
    .limit(20);

  if (urlError) {
    console.error('Error searching URLs:', urlError);
  } else {
    console.log(`Found ${urlResults?.length || 0} product pages mentioning Teng`);
    if (urlResults && urlResults.length > 0) {
      urlResults.forEach((page, i) => {
        console.log(`\n  ${i + 1}. ${page.title}`);
        console.log(`     URL: ${page.url}`);
        // Extract product info from content
        const priceMatch = page.content?.match(/£[\d,]+\.?\d*/);
        const skuMatch = page.content?.match(/SKU:\s*([^\s]+)/i);
        if (priceMatch) console.log(`     Price: ${priceMatch[0]}`);
        if (skuMatch) console.log(`     SKU: ${skuMatch[1]}`);
      });
    }
  }

  // 2. Search specifically for "torque" AND "teng" products
  console.log('\n2️⃣ Searching for Teng + Torque products:');
  const { data: torqueResults, error: torqueError } = await supabase
    .from('scraped_pages')
    .select('url, title, content')
    .eq('domain_id', domainId)
    .ilike('content', '%teng%')
    .ilike('content', '%torque%')
    .limit(10);

  if (torqueError) {
    console.error('Error searching torque products:', torqueError);
  } else {
    console.log(`Found ${torqueResults?.length || 0} pages with both "Teng" and "torque"`);
    if (torqueResults && torqueResults.length > 0) {
      torqueResults.forEach((page, i) => {
        console.log(`\n  ${i + 1}. ${page.title}`);
        console.log(`     URL: ${page.url}`);
      });
    }
  }

  // 3. Test the search_content_optimized function
  console.log('\n3️⃣ Testing search_content_optimized with "Teng torque":');
  const { data: searchResults, error: searchError } = await supabase.rpc('search_content_optimized', {
    query_text: 'Teng torque',
    query_embedding: null,
    p_domain_id: domainId,
    match_count: 20,
    use_hybrid: true
  });

  if (searchError) {
    console.error('Error with search function:', searchError);
  } else {
    console.log(`Search returned ${searchResults?.length || 0} results`);
    if (searchResults && searchResults.length > 0) {
      console.log('\nTop 10 results:');
      searchResults.slice(0, 10).forEach((result: any, i: number) => {
        console.log(`\n  ${i + 1}. ${result.title || 'Untitled'}`);
        console.log(`     URL: ${result.url}`);
        console.log(`     Similarity: ${result.similarity?.toFixed(3)}`);
        // Check if it's actually a Teng product
        const isTeng = result.title?.toLowerCase().includes('teng') || 
                       result.content?.toLowerCase().includes('teng');
        console.log(`     Is Teng product: ${isTeng ? '✅ YES' : '❌ NO'}`);
      });
    }
  }

  // 4. Check embeddings table
  console.log('\n4️⃣ Checking page_embeddings table for Teng products:');
  const { data: embeddingResults, error: embeddingError } = await supabase
    .from('page_embeddings')
    .select('id, page_id, chunk_text')
    .eq('domain_id', domainId)
    .ilike('chunk_text', '%teng%')
    .limit(10);

  if (embeddingError) {
    console.error('Error searching embeddings:', embeddingError);
  } else {
    console.log(`Found ${embeddingResults?.length || 0} embeddings mentioning Teng`);
    if (embeddingResults && embeddingResults.length > 0) {
      embeddingResults.forEach((emb, i) => {
        console.log(`\n  ${i + 1}. Page ID: ${emb.page_id}`);
        const preview = emb.chunk_text?.substring(0, 150).replace(/\n/g, ' ');
        console.log(`     Preview: ${preview}...`);
      });
    }
  }

  // 5. Direct text search to see what's actually there
  console.log('\n5️⃣ Raw text search for "Teng" in all content:');
  const { data: rawResults, count } = await supabase
    .from('scraped_pages')
    .select('url, title', { count: 'exact' })
    .eq('domain_id', domainId)
    .ilike('content', '%teng%');

  console.log(`Total pages containing "Teng": ${count || 0}`);
  
  // 6. Sample some actual Teng product content
  if (rawResults && rawResults.length > 0) {
    console.log('\n6️⃣ Sampling actual Teng product content:');
    const productPages = rawResults.filter(r => r.url?.includes('/product/'));
    
    if (productPages.length > 0) {
      const sampleUrl = productPages[0].url;
      const { data: samplePage } = await supabase
        .from('scraped_pages')
        .select('content')
        .eq('url', sampleUrl)
        .single();

      if (samplePage) {
        console.log(`\nSample product: ${productPages[0].title}`);
        console.log(`URL: ${sampleUrl}`);
        
        // Extract key info
        const tengMentions = (samplePage.content?.match(/teng/gi) || []).length;
        const torqueMentions = (samplePage.content?.match(/torque/gi) || []).length;
        
        console.log(`Times "Teng" appears: ${tengMentions}`);
        console.log(`Times "torque" appears: ${torqueMentions}`);
        
        // Show context around "Teng"
        const tengIndex = samplePage.content?.toLowerCase().indexOf('teng') || 0;
        if (tengIndex > -1 && samplePage.content) {
          const context = samplePage.content.substring(
            Math.max(0, tengIndex - 100),
            Math.min(samplePage.content.length, tengIndex + 200)
          ).replace(/\s+/g, ' ');
          console.log(`\nContext around "Teng": ...${context}...`);
        }
      }
    }
  }
}

searchTengProducts().catch(console.error);