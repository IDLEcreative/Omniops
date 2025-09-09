import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { searchSimilarContent } from './lib/embeddings';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testExactProductMatch() {
  const productName = "TENG 3/4″ Torque Wrench 140 – 700Nm";
  const productUrl = "https://www.thompsonseparts.co.uk/product/teng-3-4-torque-wrench-140-700nm/";
  const domain = 'thompsonseparts.co.uk';
  
  console.log('🔍 Testing why exact product name search fails\n');
  console.log(`Product: ${productName}`);
  console.log(`Expected URL: ${productUrl}\n`);

  // Get domain ID
  const { data: domainData } = await supabase
    .from('domains')
    .select('id')
    .eq('domain', domain)
    .single();

  if (!domainData) {
    console.error('Domain not found');
    return;
  }

  const domainId = domainData.id;

  // 1. Check if the product page exists in scraped_pages
  console.log('1️⃣ Checking if product page was scraped:');
  const { data: pageData } = await supabase
    .from('scraped_pages')
    .select('url, title, content')
    .eq('domain_id', domainId)
    .eq('url', productUrl)
    .single();

  if (pageData) {
    console.log('✅ Page found in database!');
    console.log(`Title: ${pageData.title}`);
    console.log(`Content length: ${pageData.content?.length || 0} characters`);
    
    // Check what's in the content
    const hasSKU = pageData.content?.includes('3492AG-E1');
    const hasProductName = pageData.content?.toLowerCase().includes('teng 3/4');
    const hasTorque = pageData.content?.toLowerCase().includes('torque');
    const hasSpecs = pageData.content?.includes('140 – 700Nm') || pageData.content?.includes('140-700');
    
    console.log(`Contains SKU: ${hasSKU ? '✅' : '❌'}`);
    console.log(`Contains "teng 3/4": ${hasProductName ? '✅' : '❌'}`);
    console.log(`Contains "torque": ${hasTorque ? '✅' : '❌'}`);
    console.log(`Contains specs: ${hasSpecs ? '✅' : '❌'}`);
  } else {
    console.log('❌ Page NOT found in database!');
    console.log('The page may not have been scraped or URL mismatch');
  }

  // 2. Check embeddings for this page
  console.log('\n2️⃣ Checking embeddings for this page:');
  const { data: embeddings } = await supabase
    .from('page_embeddings')
    .select('id, page_id, chunk_text')
    .eq('domain_id', domainId)
    .ilike('chunk_text', '%3492AG-E1%')
    .limit(5);

  if (embeddings && embeddings.length > 0) {
    console.log(`Found ${embeddings.length} embeddings containing SKU`);
    embeddings.forEach((e, i) => {
      console.log(`\nEmbedding ${i + 1}:`);
      const preview = e.chunk_text?.substring(0, 200).replace(/\s+/g, ' ');
      console.log(`Preview: ${preview}...`);
    });
  } else {
    console.log('❌ No embeddings found with this SKU');
  }

  // 3. Test exact title search
  console.log('\n3️⃣ Testing exact title search in scraped_pages:');
  const { data: titleSearch } = await supabase
    .from('scraped_pages')
    .select('url, title')
    .eq('domain_id', domainId)
    .ilike('title', `%${productName}%`)
    .limit(5);

  if (titleSearch && titleSearch.length > 0) {
    console.log(`Found ${titleSearch.length} pages with matching title`);
    titleSearch.forEach(p => {
      console.log(`- ${p.title}`);
      console.log(`  URL: ${p.url}`);
    });
  } else {
    console.log('❌ No pages found with this exact title');
    
    // Try partial match
    const { data: partialSearch } = await supabase
      .from('scraped_pages')
      .select('url, title')
      .eq('domain_id', domainId)
      .ilike('title', '%teng%3/4%torque%')
      .limit(5);
    
    if (partialSearch && partialSearch.length > 0) {
      console.log(`\nFound ${partialSearch.length} pages with partial title match:`);
      partialSearch.forEach(p => {
        console.log(`- ${p.title}`);
      });
    }
  }

  // 4. Test RPC search with exact product name
  console.log('\n4️⃣ Testing search_content_optimized with exact product name:');
  const { data: searchResults, error } = await supabase.rpc('search_content_optimized', {
    query_text: productName,
    query_embedding: null,
    p_domain_id: domainId,
    match_count: 10,
    use_hybrid: true
  });

  if (!error && searchResults) {
    console.log(`Found ${searchResults.length} results`);
    
    const found = searchResults.find((r: any) => 
      r.url === productUrl || 
      r.title?.includes('TENG 3/4') ||
      r.content?.includes('3492AG-E1')
    );
    
    if (found) {
      console.log('✅ FOUND THE PRODUCT!');
      console.log(`Title: ${found.title}`);
      console.log(`URL: ${found.url}`);
      console.log(`Similarity: ${found.similarity}`);
    } else {
      console.log('❌ Product NOT in search results');
      console.log('\nTop 3 results instead:');
      searchResults.slice(0, 3).forEach((r: any, i: number) => {
        console.log(`${i + 1}. ${r.title}`);
        console.log(`   URL: ${r.url}`);
        console.log(`   Similarity: ${r.similarity}`);
      });
    }
  }

  // 5. Test embeddings search
  console.log('\n5️⃣ Testing searchSimilarContent (embeddings):');
  const embeddingResults = await searchSimilarContent(
    productName,
    domain,
    10,
    0.1 // Very low threshold
  );

  const foundInEmbeddings = embeddingResults.find(r => 
    r.url === productUrl || 
    r.title?.includes('TENG 3/4')
  );

  if (foundInEmbeddings) {
    console.log('✅ Found via embeddings!');
    console.log(`Title: ${foundInEmbeddings.title}`);
    console.log(`Similarity: ${foundInEmbeddings.similarity}`);
  } else {
    console.log('❌ Not found via embeddings');
    console.log(`Instead got ${embeddingResults.length} other results`);
  }

  // 6. Check why it's not matching
  console.log('\n6️⃣ Diagnosing the problem:');
  
  // Check if nav menu pollution is affecting this specific page
  if (pageData) {
    const navMenuCount = (pageData.content?.match(/TENG TOOLS/gi) || []).length;
    const productMentions = (pageData.content?.match(/TENG 3\/4/gi) || []).length;
    
    console.log(`"TENG TOOLS" (nav menu) appears: ${navMenuCount} times`);
    console.log(`"TENG 3/4" (product) appears: ${productMentions} times`);
    
    if (navMenuCount > productMentions) {
      console.log('⚠️ Navigation menu text dominates the content!');
    }
    
    // Check content structure
    const contentSample = pageData.content?.substring(0, 500);
    const navMenuPosition = contentSample?.indexOf('TENG TOOLS') || -1;
    const productPosition = contentSample?.indexOf('TENG 3/4') || -1;
    
    if (navMenuPosition > -1 && navMenuPosition < productPosition) {
      console.log('⚠️ Navigation appears before product content in scraped text');
    }
  }
}

testExactProductMatch().catch(console.error);