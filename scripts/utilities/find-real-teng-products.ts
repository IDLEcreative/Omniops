import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findRealTengProducts() {
  console.log('🔍 Finding ACTUAL Teng products (not navigation menu mentions)...\n');

  // Get domain_id
  const { data: domainData } = await supabase
    .from('domains')
    .select('id')
    .eq('domain', 'thompsonseparts.co.uk')
    .single();

  if (!domainData) {
    console.error('Could not find domain');
    return;
  }

  const domainId = domainData.id;

  // 1. Look for "Teng" in product TITLES (most reliable)
  console.log('1️⃣ Products with "Teng" in the title:');
  const { data: titleResults } = await supabase
    .from('scraped_pages')
    .select('url, title, content')
    .eq('domain_id', domainId)
    .ilike('title', '%teng%')
    .ilike('url', '%/product/%')
    .limit(50);

  if (titleResults && titleResults.length > 0) {
    console.log(`Found ${titleResults.length} products with "Teng" in title:\n`);
    titleResults.forEach((p, i) => {
      console.log(`${i + 1}. ${p.title}`);
      console.log(`   URL: ${p.url}`);
      
      // Extract price
      const priceMatch = p.content?.match(/£[\d,]+\.?\d*/);
      if (priceMatch) console.log(`   Price: ${priceMatch[0]}`);
      
      // Check if it's a torque wrench
      const isTorque = p.title?.toLowerCase().includes('torque') || 
                       p.content?.toLowerCase().includes('torque');
      if (isTorque) console.log(`   ⚡ TORQUE PRODUCT`);
      console.log();
    });
  } else {
    console.log('No products found with "Teng" in the title.\n');
  }

  // 2. Look for products where "Teng" appears multiple times in content (likely real products)
  console.log('2️⃣ Finding products where "Teng" appears multiple times (not just in nav):');
  const { data: multiMentionResults } = await supabase
    .from('scraped_pages')
    .select('url, title, content')
    .eq('domain_id', domainId)
    .ilike('url', '%/product/%')
    .ilike('content', '%teng%')
    .limit(100);

  if (multiMentionResults) {
    // Count Teng mentions and filter for products with multiple mentions
    const realProducts = multiMentionResults
      .map(p => {
        const tengCount = (p.content?.match(/teng/gi) || []).length;
        const torqueCount = (p.content?.match(/torque/gi) || []).length;
        return { ...p, tengCount, torqueCount };
      })
      .filter(p => p.tengCount > 2) // More than 2 mentions = likely a real Teng product
      .sort((a, b) => b.tengCount - a.tengCount);

    console.log(`Found ${realProducts.length} products with multiple "Teng" mentions:\n`);
    
    realProducts.slice(0, 20).forEach((p, i) => {
      console.log(`${i + 1}. ${p.title}`);
      console.log(`   URL: ${p.url}`);
      console.log(`   Teng mentions: ${p.tengCount}, Torque mentions: ${p.torqueCount}`);
      
      // Extract product description near "Teng"
      const tengIndex = p.content?.toLowerCase().indexOf('teng') || 0;
      if (tengIndex > -1 && p.content) {
        const start = Math.max(0, tengIndex - 50);
        const end = Math.min(p.content.length, tengIndex + 150);
        const context = p.content.substring(start, end).replace(/\s+/g, ' ').trim();
        console.log(`   Context: "...${context}..."`);
      }
      console.log();
    });

    // Special focus on Teng torque products
    const tengTorqueProducts = realProducts.filter(p => p.torqueCount > 0);
    if (tengTorqueProducts.length > 0) {
      console.log('\n⚡ TENG TORQUE PRODUCTS FOUND:');
      tengTorqueProducts.forEach((p, i) => {
        console.log(`${i + 1}. ${p.title}`);
        console.log(`   URL: ${p.url}`);
      });
    }
  }

  // 3. Search for specific Teng product patterns
  console.log('\n3️⃣ Searching for specific Teng product codes/patterns:');
  const tengPatterns = [
    'teng tools',
    'tengtools', 
    'teng torque',
    'teng wrench',
    'teng socket',
    'teng ratchet'
  ];

  for (const pattern of tengPatterns) {
    const { data: patternResults, count } = await supabase
      .from('scraped_pages')
      .select('url, title', { count: 'exact' })
      .eq('domain_id', domainId)
      .ilike('url', '%/product/%')
      .ilike('content', `%${pattern}%`);

    if (count && count > 0) {
      console.log(`\n"${pattern}": ${count} products found`);
      if (patternResults && patternResults.length > 0) {
        patternResults.slice(0, 3).forEach(p => {
          console.log(`  - ${p.title}`);
        });
      }
    }
  }
}

findRealTengProducts().catch(console.error);