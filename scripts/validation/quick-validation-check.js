#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const Redis = require('ioredis');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

async function quickValidation() {
  console.log('🔍 THOMPSON\'S E PARTS SCRAPE VALIDATION');
  console.log('==========================================');
  
  const domain = 'thompsons';
  
  try {
    // 1. Check scraped pages
    console.log('\n📄 1. SCRAPED PAGES CHECK');
    const { data: pages, error: pagesError } = await supabase
      .from('scraped_pages')
      .select('url, title, scraped_at, content')
      .ilike('url', `%${domain}%`)
      .order('scraped_at', { ascending: false })
      .limit(5);

    if (pagesError) {
      console.error('❌ Pages error:', pagesError);
    } else {
      console.log(`✅ Found ${pages?.length || 0} scraped pages`);
      if (pages && pages.length > 0) {
        pages.forEach((page, i) => {
          console.log(`   ${i + 1}. ${page.url}`);
          console.log(`      Title: ${page.title}`);
          console.log(`      Content length: ${page.content?.length || 0} chars`);
          console.log(`      Scraped: ${page.scraped_at}`);
        });
      }
    }

    // 2. Check page embeddings - get Thompson's pages first, then their embeddings
    console.log('\n🧠 2. PAGE EMBEDDINGS CHECK');
    
    // First get Thompson's page IDs
    const { data: thompsonPages, error: pageError } = await supabase
      .from('scraped_pages')
      .select('id, url, title')
      .ilike('url', `%${domain}%`)
      .limit(10);

    if (pageError) {
      console.error('❌ Page lookup error:', pageError);
    } else if (!thompsonPages || thompsonPages.length === 0) {
      console.log('❌ No Thompson pages found for embeddings check');
    } else {
      // Get embeddings for these pages
      const pageIds = thompsonPages.map(p => p.id);
      const { data: embeddings, error: embeddingsError } = await supabase
        .from('page_embeddings')
        .select('id, chunk_text, metadata, created_at, page_id')
        .in('page_id', pageIds)
        .order('created_at', { ascending: false })
        .limit(10);

      if (embeddingsError) {
        console.error('❌ Embeddings error:', embeddingsError);
      } else {
        console.log(`✅ Found ${embeddings?.length || 0} embeddings for Thompson's pages`);
        if (embeddings && embeddings.length > 0) {
          embeddings.forEach((emb, i) => {
            const page = thompsonPages.find(p => p.id === emb.page_id);
            console.log(`   ${i + 1}. ${page?.url || 'Unknown URL'}`);
            console.log(`      Chunk: "${emb.chunk_text?.substring(0, 100)}..."`);
            console.log(`      Created: ${emb.created_at}`);
            
            // Check metadata
            if (emb.metadata) {
              try {
                const meta = typeof emb.metadata === 'string' ? JSON.parse(emb.metadata) : emb.metadata;
                console.log(`      Metadata: content_type=${meta.content_type}, keywords=${meta.keywords?.length || 0}, entities=${meta.entities ? 'YES' : 'NO'}`);
                if (meta.semantic_density !== undefined) {
                  console.log(`      Semantic density: ${meta.semantic_density}`);
                }
                if (meta.price_range) {
                  console.log(`      Price range: ${meta.price_range}`);
                }
                if (meta.readability_score) {
                  console.log(`      Readability: ${meta.readability_score}`);
                }
              } catch (e) {
                console.log(`      Metadata: Invalid JSON`);
              }
            } else {
              console.log(`      Metadata: NONE`);
            }
          });
        }
      }
    }

    // 3. Check Redis for deduplication
    console.log('\n🔄 3. REDIS DEDUPLICATION CHECK');
    try {
      const dedupeKeys = await redis.keys(`dedup:${domain}*`);
      const cacheKeys = await redis.keys(`embedding_cache:*`);
      console.log(`✅ Found ${dedupeKeys.length} deduplication keys`);
      console.log(`✅ Found ${cacheKeys.length} embedding cache keys`);
      
      if (dedupeKeys.length > 0) {
        console.log('   Sample dedup keys:');
        for (let i = 0; i < Math.min(3, dedupeKeys.length); i++) {
          const key = dedupeKeys[i];
          const value = await redis.get(key);
          console.log(`   - ${key}: ${value}`);
        }
      }
    } catch (redisError) {
      console.error('❌ Redis error:', redisError.message);
    }

    // 4. Check overall stats
    console.log('\n📊 4. OVERALL STATISTICS');
    const pagesCountResult = await supabase
      .from('scraped_pages')
      .select('id', { count: 'exact' })
      .ilike('url', `%${domain}%`);
    
    // Get all Thompson page IDs for embeddings calculations
    const { data: allThompsonPages } = await supabase
      .from('scraped_pages')
      .select('id')
      .ilike('url', `%${domain}%`);
    
    // For embeddings, we need to join with scraped_pages or get all Thompson page IDs first
    let embeddingsCount = 0;
    if (allThompsonPages && allThompsonPages.length > 0) {
      const allPageIds = allThompsonPages.map(p => p.id);
      const embeddingsResult = await supabase
        .from('page_embeddings')
        .select('id', { count: 'exact' })
        .in('page_id', allPageIds);
      embeddingsCount = embeddingsResult.count || 0;
    }

    console.log(`✅ Total pages scraped: ${pagesCountResult.count || 0}`);
    console.log(`✅ Total embeddings: ${embeddingsCount || 0}`);
    console.log(`✅ Embedding generation rate: ${pagesCountResult.count > 0 ? Math.round((embeddingsCount / pagesCountResult.count) * 100) : 0}%`);

    // 5. Check recent activity (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentPagesResult = await supabase
      .from('scraped_pages')
      .select('id', { count: 'exact' })
      .ilike('url', `%${domain}%`)
      .gt('scraped_at', oneHourAgo);
    
    // For recent embeddings, get recent Thompson page IDs then check embeddings
    let recentEmbeddingsCount = 0;
    if (allThompsonPages && allThompsonPages.length > 0) {
      const allPageIds = allThompsonPages.map(p => p.id);
      const recentEmbeddingsResult = await supabase
        .from('page_embeddings')
        .select('id', { count: 'exact' })
        .in('page_id', allPageIds)
        .gt('created_at', oneHourAgo);
      recentEmbeddingsCount = recentEmbeddingsResult.count || 0;
    }

    console.log(`⚡ Pages scraped in last hour: ${recentPagesResult.count || 0}`);
    console.log(`⚡ Embeddings created in last hour: ${recentEmbeddingsCount}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await redis.quit();
    process.exit(0);
  }
}

quickValidation();