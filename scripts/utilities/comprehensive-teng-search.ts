import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function comprehensiveTengSearch() {
  console.log('🔍 COMPREHENSIVE SEARCH FOR TENG TORQUE PRODUCTS IN ALL VECTORS\n');
  
  const { data: domain } = await supabase
    .from('domains')
    .select('id')
    .eq('domain', 'thompsonseparts.co.uk')
    .single();
    
  if (!domain) {
    console.error('Domain not found');
    return;
  }
  
  const domainId = domain.id;
  
  // 1. Search scraped_pages for ANY mention of "teng" AND "torque"
  console.log('1️⃣ Searching scraped_pages for "teng" AND "torque":');
  const { data: tengTorquePages, count: tengTorqueCount } = await supabase
    .from('scraped_pages')
    .select('url, title, content', { count: 'exact' })
    .eq('domain_id', domainId)
    .ilike('content', '%teng%')
    .ilike('content', '%torque%')
    .limit(20);
  
  console.log(`Found ${tengTorqueCount || 0} pages with both "teng" and "torque"\n`);
  
  if (tengTorquePages && tengTorquePages.length > 0) {
    // Analyze each page to see if it's actually a Teng torque product
    let realTengProducts = 0;
    
    tengTorquePages.forEach((page, i) => {
      // Count occurrences
      const tengCount = (page.content?.match(/teng/gi) || []).length;
      const torqueCount = (page.content?.match(/torque/gi) || []).length;
      
      // Check for specific Teng torque product indicators
      const hasPrice = page.content?.includes('£') && page.content?.includes('Add to basket');
      const hasSKU = /SKU:|Product code:/i.test(page.content || '');
      const hasTengInTitle = /teng/i.test(page.title || '');
      
      // Look for specific Teng torque product mentions
      const tengTorqueMatch = page.content?.match(/teng[^.]*torque[^.]*wrench/gi) || 
                              page.content?.match(/teng[^.]*3\/4/gi) ||
                              page.content?.match(/teng[^.]*\d+\s*-?\s*\d+\s*nm/gi);
      
      const isLikelyProduct = hasPrice && (hasTengInTitle || tengTorqueMatch);
      
      if (isLikelyProduct) {
        realTengProducts++;
        console.log(`✅ LIKELY TENG PRODUCT #${realTengProducts}:`);
      } else {
        console.log(`${i + 1}. Page (probably nav menu pollution):`);
      }
      
      console.log(`   Title: ${page.title}`);
      console.log(`   URL: ${page.url}`);
      console.log(`   Teng mentions: ${tengCount}, Torque mentions: ${torqueCount}`);
      
      if (tengTorqueMatch) {
        console.log(`   Match found: "${tengTorqueMatch[0]}"`);
      }
      
      // Show context around "teng" and "torque"
      if (page.content) {
        const tengIndex = page.content.toLowerCase().indexOf('teng');
        const torqueIndex = page.content.toLowerCase().indexOf('torque');
        
        // Get context around first "teng" mention that's NOT in nav menu
        let contextStart = tengIndex;
        let attempts = 0;
        while (contextStart > -1 && attempts < 5) {
          const context = page.content.substring(
            Math.max(0, contextStart - 50),
            Math.min(page.content.length, contextStart + 150)
          );
          
          // Skip if this is navigation menu
          if (!context.includes('TENG TOOLS Workshop')) {
            console.log(`   Context: "...${context.replace(/\s+/g, ' ')}..."`);
            break;
          }
          
          // Find next occurrence
          contextStart = page.content.toLowerCase().indexOf('teng', contextStart + 1);
          attempts++;
        }
      }
      
      console.log();
    });
    
    console.log(`\n📊 Summary: ${realTengProducts} likely Teng torque products out of ${tengTorquePages.length} pages\n`);
  }
  
  // 2. Search page_embeddings chunks
  console.log('2️⃣ Searching page_embeddings for Teng torque chunks:');
  const { data: embeddings, count: embCount } = await supabase
    .from('page_embeddings')
    .select('chunk_text, page_id', { count: 'exact' })
    .eq('domain_id', domainId)
    .ilike('chunk_text', '%teng%')
    .ilike('chunk_text', '%torque%')
    .limit(10);
  
  console.log(`Found ${embCount || 0} embedding chunks with both "teng" and "torque"\n`);
  
  if (embeddings && embeddings.length > 0) {
    embeddings.forEach((emb, i) => {
      const preview = emb.chunk_text?.substring(0, 300).replace(/\s+/g, ' ');
      console.log(`Chunk ${i + 1}:`);
      console.log(`Preview: ${preview}...`);
      
      // Check if it's a real product
      const hasProductInfo = /price|sku|add to basket|stock|£\d/i.test(emb.chunk_text || '');
      if (hasProductInfo) {
        console.log('⚡ Contains product information!\n');
      } else {
        console.log('❌ Likely navigation/generic content\n');
      }
    });
  }
  
  // 3. Search for specific Teng torque wrench models
  console.log('3️⃣ Searching for specific Teng torque wrench patterns:');
  const tengPatterns = [
    'teng 1/2',
    'teng 3/4', 
    'teng 1/4',
    'teng 3/8',
    '3492AG',  // Teng torque wrench series
    '3892AG',  // Another Teng series
    'teng.*\\d+\\s*-\\s*\\d+\\s*nm',  // Teng with Nm range
  ];
  
  for (const pattern of tengPatterns) {
    const { count } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true })
      .eq('domain_id', domainId)
      .or(`content.ilike.%${pattern}%,title.ilike.%${pattern}%`);
    
    if (count && count > 0) {
      console.log(`✅ Pattern "${pattern}": ${count} pages found`);
      
      // Get a sample
      const { data: sample } = await supabase
        .from('scraped_pages')
        .select('url, title')
        .eq('domain_id', domainId)
        .or(`content.ilike.%${pattern}%,title.ilike.%${pattern}%`)
        .limit(2);
      
      sample?.forEach(s => {
        console.log(`   - ${s.title}`);
        console.log(`     ${s.url}`);
      });
    } else {
      console.log(`❌ Pattern "${pattern}": 0 pages`);
    }
  }
  
  // 4. Final check: Get ANY page with "3492AG-E1" (the SKU we know exists)
  console.log('\n4️⃣ Final check for SKU 3492AG-E1 (we know this exists):');
  const { data: skuSearch, count: skuCount } = await supabase
    .from('scraped_pages')
    .select('url, title', { count: 'exact' })
    .eq('domain_id', domainId)
    .or('content.ilike.%3492AG-E1%,content.ilike.%3492AG%');
  
  console.log(`Pages containing SKU "3492AG-E1": ${skuCount || 0}`);
  
  if (skuCount === 0) {
    console.log('\n⚠️ CONCLUSION: The Teng torque products were NOT scraped!');
    console.log('Even though they exist in WooCommerce, they are not in your vector database.');
  }
}

comprehensiveTengSearch().catch(console.error);