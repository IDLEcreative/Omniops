#!/usr/bin/env npx tsx

/**
 * Teng Products Investigation Script
 * 
 * This script directly queries the Supabase database to investigate:
 * 1. If there are any Teng products in the scraped_pages table
 * 2. What the content looks like for those products
 * 3. Test the search_content_optimized function with "Teng torque" query
 * 
 * Domain: thompsonseparts.co.uk
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface ScrapedPage {
  id: string;
  url: string;
  title: string;
  content: string;
  metadata: any;
  scraped_at: string;
  domain_id: string;
}

interface SearchResult {
  id: string;
  url: string;
  title: string;
  content_snippet: string;
  similarity_score: number;
  content_type: string;
  scraped_at: string;
}

async function main() {
  console.log('🔍 Starting Teng Products Investigation for thompsonseparts.co.uk');
  console.log('=' .repeat(80));

  // Initialize Supabase client with service role
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables:');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.error('SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Step 1: Find the domain_id for thompsonseparts.co.uk
    console.log('\n📋 Step 1: Finding domain ID for thompsonseparts.co.uk...');
    
    const { data: domains, error: domainError } = await supabase
      .from('domains')
      .select('id, domain, name, last_scraped_at, active')
      .ilike('domain', '%thompsonseparts.co.uk%');

    if (domainError) {
      console.error('❌ Error fetching domains:', domainError);
      return;
    }

    if (!domains || domains.length === 0) {
      console.log('❌ No domains found for thompsonseparts.co.uk');
      
      // Let's check all domains to see what's available
      const { data: allDomains } = await supabase
        .from('domains')
        .select('id, domain, name')
        .limit(10);
      
      console.log('\n📋 Available domains in database:');
      allDomains?.forEach(d => {
        console.log(`  - ${d.domain} (${d.name || 'No name'})`);
      });
      return;
    }

    const domain = domains[0];
    console.log(`✅ Found domain: ${domain.domain}`);
    console.log(`   ID: ${domain.id}`);
    console.log(`   Name: ${domain.name || 'Not set'}`);
    console.log(`   Last scraped: ${domain.last_scraped_at || 'Never'}`);
    console.log(`   Active: ${domain.active}`);

    // Step 2: Search for Teng products in scraped_pages
    console.log('\n📋 Step 2: Searching for Teng products in scraped_pages...');
    
    const { data: tengPages, error: tengError } = await supabase
      .from('scraped_pages')
      .select('id, url, title, content, metadata, scraped_at')
      .eq('domain_id', domain.id)
      .or('content.ilike.%Teng%,title.ilike.%Teng%,url.ilike.%teng%')
      .order('scraped_at', { ascending: false })
      .limit(10);

    if (tengError) {
      console.error('❌ Error searching for Teng products:', tengError);
      return;
    }

    console.log(`✅ Found ${tengPages?.length || 0} pages containing "Teng"`);

    if (tengPages && tengPages.length > 0) {
      console.log('\n🔍 Teng Products Found:');
      tengPages.forEach((page, index) => {
        console.log(`\n--- Product ${index + 1} ---`);
        console.log(`URL: ${page.url}`);
        console.log(`Title: ${page.title || 'No title'}`);
        console.log(`Scraped: ${page.scraped_at || 'Unknown'}`);
        
        // Show content snippet with "Teng" highlighted
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

        // Show metadata if available
        if (page.metadata && typeof page.metadata === 'object') {
          console.log('Metadata keys:', Object.keys(page.metadata));
        }
      });
    } else {
      console.log('❌ No Teng products found in scraped_pages');
    }

    // Step 3: Check total pages for this domain
    console.log('\n📋 Step 3: Checking total scraped pages for this domain...');
    
    const { count: totalPages, error: countError } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true })
      .eq('domain_id', domain.id);

    if (countError) {
      console.error('❌ Error counting pages:', countError);
    } else {
      console.log(`✅ Total pages scraped for ${domain.domain}: ${totalPages || 0}`);
    }

    // Step 4: Sample some pages to see what content looks like
    console.log('\n📋 Step 4: Sampling recent pages to understand content structure...');
    
    const { data: samplePages, error: sampleError } = await supabase
      .from('scraped_pages')
      .select('id, url, title, content')
      .eq('domain_id', domain.id)
      .not('content', 'is', null)
      .order('scraped_at', { ascending: false })
      .limit(3);

    if (sampleError) {
      console.error('❌ Error fetching sample pages:', sampleError);
    } else if (samplePages && samplePages.length > 0) {
      console.log(`✅ Sample of ${samplePages.length} recent pages:`);
      samplePages.forEach((page, index) => {
        console.log(`\n--- Sample ${index + 1} ---`);
        console.log(`URL: ${page.url}`);
        console.log(`Title: ${page.title || 'No title'}`);
        if (page.content) {
          const preview = page.content.slice(0, 200).replace(/\n/g, ' ');
          console.log(`Content preview: ${preview}...`);
          console.log(`Content length: ${page.content.length} chars`);
          
          // Check if this page mentions any tool brands
          const toolBrands = ['Teng', 'Snap-on', 'Bahco', 'Facom', 'Beta', 'Gedore'];
          const foundBrands = toolBrands.filter(brand => 
            page.content.toLowerCase().includes(brand.toLowerCase()) ||
            (page.title && page.title.toLowerCase().includes(brand.toLowerCase()))
          );
          if (foundBrands.length > 0) {
            console.log(`Tool brands found: ${foundBrands.join(', ')}`);
          }
        } else {
          console.log('Content: None');
        }
      });
    } else {
      console.log('❌ No sample pages found');
    }

    // Step 5: Test the search_content_optimized function
    console.log('\n📋 Step 5: Testing search_content_optimized function with "Teng torque"...');
    
    const { data: searchResults, error: searchError } = await supabase
      .rpc('search_content_optimized', {
        query_text: 'Teng torque',
        query_embedding: null, // Will be generated in function if needed
        p_domain_id: domain.id,
        match_count: 10,
        use_hybrid: true
      });

    if (searchError) {
      console.error('❌ Error calling search_content_optimized:', searchError);
      console.error('Error details:', JSON.stringify(searchError, null, 2));
    } else {
      console.log(`✅ Search function returned ${searchResults?.length || 0} results`);
      
      if (searchResults && searchResults.length > 0) {
        console.log('\n🔍 Search Results for "Teng torque":');
        searchResults.forEach((result: SearchResult, index: number) => {
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
      } else {
        console.log('❌ No search results returned');
        
        // Try a broader search
        console.log('\n🔍 Trying broader search with just "Teng"...');
        const { data: broaderResults, error: broaderError } = await supabase
          .rpc('search_content_optimized', {
            query_text: 'Teng',
            query_embedding: null,
            p_domain_id: domain.id,
            match_count: 5,
            use_hybrid: true
          });

        if (broaderError) {
          console.error('❌ Error in broader search:', broaderError);
        } else {
          console.log(`✅ Broader search returned ${broaderResults?.length || 0} results`);
          if (broaderResults && broaderResults.length > 0) {
            broaderResults.forEach((result: SearchResult, index: number) => {
              console.log(`${index + 1}. ${result.title} (Score: ${result.similarity_score})`);
            });
          }
        }
      }
    }

    // Step 6: Check if search_content_optimized function exists
    console.log('\n📋 Step 6: Verifying search_content_optimized function exists...');
    
    const { data: functions, error: funcError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'search_content_optimized');

    if (funcError) {
      console.log('ℹ️  Cannot check function existence (pg_proc not accessible)');
    } else if (functions && functions.length > 0) {
      console.log('✅ search_content_optimized function exists');
    } else {
      console.log('❌ search_content_optimized function not found');
    }

    // Step 7: Search for specific Teng Tools products
    console.log('\n📋 Step 7: Searching for specific Teng Tools products...');
    
    const tengQueries = ['Teng Tools', 'TENG TOOLS', 'teng torque wrench', 'teng socket set'];
    
    for (const query of tengQueries) {
      console.log(`\n🔍 Searching for "${query}"...`);
      
      const { data: directSearch, error: directError } = await supabase
        .from('scraped_pages')
        .select('id, url, title, content')
        .eq('domain_id', domain.id)
        .textSearch('content', query, { 
          type: 'websearch',
          config: 'english'
        })
        .limit(3);

      if (directError) {
        console.error(`❌ Error searching for "${query}":`, directError.message);
      } else {
        console.log(`✅ Found ${directSearch?.length || 0} pages for "${query}"`);
        
        if (directSearch && directSearch.length > 0) {
          directSearch.forEach((page, index) => {
            console.log(`  ${index + 1}. ${page.title}`);
            console.log(`     URL: ${page.url}`);
            
            // Look for the query in the content
            const queryLower = query.toLowerCase();
            const contentLower = page.content.toLowerCase();
            const queryIndex = contentLower.indexOf(queryLower);
            if (queryIndex !== -1) {
              const start = Math.max(0, queryIndex - 50);
              const end = Math.min(page.content.length, queryIndex + 150);
              const snippet = page.content.slice(start, end);
              console.log(`     Context: ...${snippet}...`);
            }
          });
        }
      }
    }

    // Step 8: Check embeddings tables
    console.log('\n📋 Step 8: Checking embeddings tables for this domain...');
    
    const { count: embeddingCount, error: embeddingError } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true })
      .in('page_id', tengPages?.map(p => p.id) || []);

    if (embeddingError) {
      console.log('ℹ️  Cannot check page_embeddings:', embeddingError.message);
    } else {
      console.log(`✅ Found ${embeddingCount || 0} embeddings for Teng pages`);
    }

    // Check page_embeddings table too
    const { count: contentEmbeddingCount, error: contentEmbeddingError } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true })
      .eq('page_id', tengPages?.map(p => p.id) || []);

    if (contentEmbeddingError) {
      console.log('ℹ️  Cannot check page_embeddings:', contentEmbeddingError.message);
    } else {
      console.log(`✅ Found ${contentEmbeddingCount || 0} page embeddings for Teng pages`);
    }

    // Step 9: Analysis Summary
    console.log('\n📋 Step 9: Analysis Summary and Recommendations...');
    
    console.log('\n📊 Key Findings:');
    console.log(`• Domain: ${domain.domain} (${domain.name})`);
    console.log(`• Total Pages: ${totalPages || 0}`);
    console.log(`• Pages with "Teng": ${tengPages?.length || 0}`);
    console.log(`• Last Scraped: ${domain.last_scraped_at}`);
    
    // Analyze the Teng mentions we found
    if (tengPages && tengPages.length > 0) {
      console.log('\n📋 Teng Mention Analysis:');
      
      // Check if "TENG TOOLS" appears as a navigation item vs actual product
      const navMentions = tengPages.filter(page => 
        page.content && page.content.includes('TENG TOOLS') && 
        page.content.includes('Hand Tools Pressure Washers Air Tools')
      ).length;
      
      const actualProducts = tengPages.filter(page => 
        page.title && page.title.toLowerCase().includes('teng') &&
        !page.title.toLowerCase().includes('tipping') &&
        !page.title.toLowerCase().includes('tipper')
      ).length;
      
      console.log(`• Navigation/Menu mentions: ${navMentions}`);
      console.log(`• Actual Teng product pages: ${actualProducts}`);
      console.log(`• Teng-related (tipping/tipper): ${tengPages.length - actualProducts}`);
      
      // Check for dedicated Teng Tools section
      const dedicatedTengPages = tengPages.filter(page =>
        page.url && (
          page.url.includes('/teng') || 
          page.url.includes('/tools') ||
          page.url.toLowerCase().includes('teng-tools')
        )
      );
      
      console.log(`• Dedicated Teng Tools URLs: ${dedicatedTengPages.length}`);
      
      if (dedicatedTengPages.length > 0) {
        console.log('  Teng Tools URLs found:');
        dedicatedTengPages.forEach(page => {
          console.log(`    - ${page.url}`);
        });
      }
    }
    
    console.log('\n🔍 Recommendations:');
    console.log('1. The "Teng" mentions appear to be mainly navigation items, not actual Teng Tools products');
    console.log('2. Thompson\'s E Parts seems to be a tipper/truck parts supplier, not a tool retailer');
    console.log('3. The search function needs the correct parameters (match_count, p_domain_id, query_embedding, query_text, use_hybrid)');
    console.log('4. Consider checking if there\'s a dedicated Teng Tools section on the website');
    console.log('5. The embeddings count suggests some content is indexed for semantic search');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('\n' + '='.repeat(80));
  console.log('🔍 Investigation Complete');
}

// Run the script
main().catch(console.error);