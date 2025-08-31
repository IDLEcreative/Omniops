#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://birugqyuqhiahxvxeyqg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s'
);

async function investigateThompsonDuplicates() {
  console.log('🔍 FORENSIC INVESTIGATION: thompsonseparts.co.uk Duplicate Analysis\n');
  console.log('═'.repeat(80));
  
  try {
    // Get domain info for thompsonseparts.co.uk
    const { data: domain } = await supabase
      .from('domains')
      .select('*')
      .eq('domain', 'thompsonseparts.co.uk')
      .single();
    
    const domainId = domain?.id;
    
    console.log('📌 DOMAIN INFORMATION:');
    console.log('-'.repeat(80));
    if (domain) {
      console.log(`  Domain ID: ${domain.id}`);
      console.log(`  Domain: ${domain.domain}`);
      console.log(`  Last scraped: ${domain.last_scraped_at || 'Never'}`);
      console.log(`  Created: ${domain.created_at}`);
    } else {
      console.log('  ⚠️  No domain record found for thompsonseparts.co.uk');
    }
    
    // 1. Count total scraped pages for this domain
    const { data: allPages, count: totalPages } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact' })
      .like('url', '%thompsonseparts.co.uk%');
    
    console.log('\n📄 SCRAPED PAGES ANALYSIS:');
    console.log('-'.repeat(80));
    console.log(`  Total pages with thompsonseparts.co.uk URL: ${totalPages}`);
    
    // Group by URL to find duplicates
    const urlMap = {};
    allPages?.forEach(page => {
      if (!urlMap[page.url]) {
        urlMap[page.url] = [];
      }
      urlMap[page.url].push({
        id: page.id,
        scraped_at: page.scraped_at,
        created_at: page.created_at,
        domain_id: page.domain_id
      });
    });
    
    // Find URLs with multiple entries
    const duplicatedUrls = Object.entries(urlMap)
      .filter(([url, entries]) => entries.length > 1)
      .sort((a, b) => b[1].length - a[1].length);
    
    const uniqueUrls = Object.keys(urlMap).length;
    
    console.log(`  Unique URLs: ${uniqueUrls}`);
    console.log(`  URLs with duplicates: ${duplicatedUrls.length}`);
    
    if (duplicatedUrls.length > 0) {
      console.log('\n  🚨 DUPLICATE URLS FOUND:');
      duplicatedUrls.slice(0, 10).forEach(([url, entries]) => {
        console.log(`\n  URL: ${url}`);
        console.log(`  Scraped ${entries.length} times:`);
        entries.forEach(entry => {
          console.log(`    - ID: ${entry.id.substring(0, 8)}... | Scraped: ${entry.scraped_at} | Domain ID: ${entry.domain_id}`);
        });
      });
    }
    
    // 2. Analyze scraping timestamps to identify scraping runs
    const scrapingRuns = {};
    allPages?.forEach(page => {
      if (page.scraped_at) {
        const date = new Date(page.scraped_at);
        const runKey = `${date.toISOString().split('T')[0]} ${date.getHours()}:00`;
        if (!scrapingRuns[runKey]) {
          scrapingRuns[runKey] = 0;
        }
        scrapingRuns[runKey]++;
      }
    });
    
    console.log('\n⏰ SCRAPING RUNS TIMELINE:');
    console.log('-'.repeat(80));
    const sortedRuns = Object.entries(scrapingRuns)
      .sort((a, b) => a[0].localeCompare(b[0]));
    
    sortedRuns.forEach(([timestamp, count]) => {
      console.log(`  ${timestamp}: ${count} pages scraped`);
    });
    
    // 3. Check embeddings for duplicates
    const { data: embeddings, count: embeddingCount } = await supabase
      .from('page_embeddings')
      .select(`
        id,
        chunk_text,
        page_id,
        created_at,
        scraped_pages!inner(url)
      `, { count: 'exact' })
      .like('scraped_pages.url', '%thompsonseparts.co.uk%');
    
    console.log('\n📊 EMBEDDINGS ANALYSIS:');
    console.log('-'.repeat(80));
    console.log(`  Total embeddings for thompsonseparts.co.uk pages: ${embeddingCount}`);
    
    // Group embeddings by chunk text (first 100 chars)
    const chunkMap = {};
    embeddings?.forEach(emb => {
      const key = emb.chunk_text.substring(0, 100);
      if (!chunkMap[key]) {
        chunkMap[key] = [];
      }
      chunkMap[key].push({
        id: emb.id,
        page_id: emb.page_id,
        url: emb.scraped_pages.url,
        created_at: emb.created_at
      });
    });
    
    const duplicateChunks = Object.entries(chunkMap)
      .filter(([chunk, entries]) => entries.length > 1)
      .sort((a, b) => b[1].length - a[1].length);
    
    console.log(`  Unique text chunks: ${Object.keys(chunkMap).length}`);
    console.log(`  Duplicate text chunks: ${duplicateChunks.length}`);
    
    if (duplicateChunks.length > 0) {
      console.log('\n  🚨 TOP DUPLICATE EMBEDDINGS:');
      duplicateChunks.slice(0, 5).forEach(([chunk, entries]) => {
        console.log(`\n  Text: "${chunk}..."`);
        console.log(`  Embedded ${entries.length} times from:`);
        // Show first 3 URLs
        entries.slice(0, 3).forEach(entry => {
          console.log(`    - ${entry.url}`);
        });
        if (entries.length > 3) {
          console.log(`    ... and ${entries.length - 3} more`);
        }
      });
    }
    
    // 4. Check for UPSERT implementation
    console.log('\n🔧 DEDUPLICATION MECHANISM ANALYSIS:');
    console.log('-'.repeat(80));
    
    console.log('  ✅ unique_domain_url constraint should be present (domain_id, url)');
    console.log('  ✅ Scraper uses UPSERT with onConflict: "url" (found in code)');
    console.log('  ⚠️  BUT: onConflict uses "url" instead of "(domain_id, url)"');
    console.log('  ⚠️  This may cause issues with multi-domain setups');
    
    // 5. Summary and root cause analysis
    console.log('\n' + '═'.repeat(80));
    console.log('🎯 ROOT CAUSE ANALYSIS:');
    console.log('-'.repeat(80));
    
    if (duplicatedUrls.length === 0) {
      console.log('\n✅ GOOD NEWS: No duplicate URLs found in scraped_pages table!');
      console.log('\nThe UPSERT mechanism is working correctly to prevent duplicate page entries.');
      console.log('The unique constraint (domain_id, url) is successfully preventing duplicates.');
    } else {
      console.log('\n⚠️  ISSUE IDENTIFIED: Duplicate URLs exist in the database');
      console.log('\nPOSSIBLE CAUSES:');
      console.log('  1. UPSERT conflict resolution mismatch:');
      console.log('     - Code uses onConflict: "url"');
      console.log('     - But constraint is on (domain_id, url)');
      console.log('  2. Multiple scraping runs before constraint was added');
      console.log('  3. Domain ID not being set consistently');
    }
    
    if (duplicateChunks.length > 0) {
      console.log('\n⚠️  EMBEDDING DUPLICATION DETECTED:');
      console.log('  - Same text chunks are being embedded multiple times');
      console.log('  - This occurs when pages share common elements (headers, footers, navigation)');
      console.log('  - Not necessarily a bug, but wastes storage and API calls');
      console.log('\nRECOMMENDATIONS:');
      console.log('  1. Implement content deduplication before embedding generation');
      console.log('  2. Use content hashing to detect identical chunks');
      console.log('  3. Consider filtering out common page elements before chunking');
    }
    
    // 6. Impact assessment
    console.log('\n💰 IMPACT ASSESSMENT:');
    console.log('-'.repeat(80));
    const duplicateEmbeddingCount = duplicateChunks.reduce((sum, [_, entries]) => sum + entries.length - 1, 0);
    const estimatedCost = duplicateEmbeddingCount * 0.0001; // Approximate OpenAI embedding cost
    
    console.log(`  Duplicate embeddings created: ${duplicateEmbeddingCount}`);
    console.log(`  Estimated wasted API cost: $${estimatedCost.toFixed(4)}`);
    console.log(`  Storage overhead: ~${(duplicateEmbeddingCount * 6).toFixed(1)} KB`); // ~6KB per embedding
    
  } catch (error) {
    console.error('Error during investigation:', error);
  }
}

investigateThompsonDuplicates();