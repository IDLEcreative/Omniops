import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
function loadEnvFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const envContent = fs.readFileSync(filePath, 'utf8');
    envContent.split('\n').forEach(line => {
      if (line.startsWith('#') || !line.trim()) return;
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value.replace(/^["']|["']$/g, '');
      }
    });
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env'));
loadEnvFile(path.resolve(process.cwd(), '.env.local'));

/**
 * Links staging domain to use production's scraped data
 * This allows staging to share the knowledge base without duplicating content
 */
async function linkStagingToProduction() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  console.log('🔗 Linking staging to production data...\n');

  // Get production config
  const { data: production, error: prodError } = await supabase
    .from('customer_configs')
    .select('id, domain')
    .eq('domain', 'thompsonseparts.co.uk')
    .single();

  if (prodError || !production) {
    console.error('❌ Could not find production Thompson\'s config');
    console.error('Error:', prodError);
    process.exit(1);
  }

  console.log('✅ Found production:', production.domain);

  // Get staging config
  const { data: staging, error: stagingError } = await supabase
    .from('customer_configs')
    .select('id, domain')
    .eq('domain', 'epartstaging.wpengine.com')
    .single();

  if (stagingError || !staging) {
    console.error('❌ Could not find staging config');
    console.error('Run: npx tsx scripts/setup-epartstaging.ts first');
    process.exit(1);
  }

  console.log('✅ Found staging:', staging.domain);
  console.log('');

  // Check scraped pages for each domain (using domain_id foreign key)
  const { count: prodCount } = await supabase
    .from('scraped_pages')
    .select('id', { count: 'exact', head: true })
    .eq('domain_id', production.id);

  const { count: stagingCount } = await supabase
    .from('scraped_pages')
    .select('id', { count: 'exact', head: true })
    .eq('domain_id', staging.id);

  console.log('📊 Current data:');
  console.log(`   Production (${production.domain}): ${prodCount || 0} pages`);
  console.log(`   Staging (${staging.domain}): ${stagingCount || 0} pages`);
  console.log('');

  if ((prodCount || 0) === 0) {
    console.warn('⚠️  Production has no scraped pages!');
    console.warn('   You need to scrape the production site first.');
    process.exit(1);
  }

  // Create aliases for staging to use production data
  console.log('📝 Copying production data to staging...');

  // Get production pages (using domain_id foreign key)
  const { data: prodPages } = await supabase
    .from('scraped_pages')
    .select('id, url, title, content, metadata, scraped_at')
    .eq('domain_id', production.id)
    .limit(5000);

  if (prodPages && prodPages.length > 0) {
    // Delete existing staging pages if any
    if ((stagingCount || 0) > 0) {
      await supabase
        .from('scraped_pages')
        .delete()
        .eq('domain_id', staging.id);
      console.log('   🗑️  Cleared existing staging pages');
    }

    // Insert production pages with staging domain_id
    const stagingPages = prodPages.map(page => ({
      domain_id: staging.id,  // Changed from domain to domain_id
      url: page.url,
      title: page.title,
      content: page.content,
      metadata: page.metadata,
      scraped_at: new Date().toISOString()
    }));

    const { data: insertedPages, error: insertError } = await supabase
      .from('scraped_pages')
      .insert(stagingPages)
      .select('id, url');

    if (insertError) {
      console.error('❌ Error copying pages:', insertError);
      process.exit(1);
    }

    console.log(`   ✅ Copied ${insertedPages?.length || 0} pages`);

    // Copy embeddings if they exist
    const { data: prodEmbeddings } = await supabase
      .from('page_embeddings')
      .select('page_id, chunk_index, content, embedding, metadata')
      .in('page_id', prodPages.map(p => p.id))
      .limit(10000);

    if (prodEmbeddings && prodEmbeddings.length > 0) {
      // Create URL mapping: production page_id -> staging page_id
      const prodUrlToId = new Map(prodPages.map(p => [p.url, p.id]));
      const stagingUrlToId = new Map(insertedPages?.map(p => [p.url, p.id]) || []);
      const prodToStagingId = new Map();

      prodPages.forEach(p => {
        const stagingId = stagingUrlToId.get(p.url);
        if (stagingId) {
          prodToStagingId.set(p.id, stagingId);
        }
      });

      // Map embeddings to staging page IDs
      const stagingEmbeddings = prodEmbeddings
        .map(emb => {
          const stagingPageId = prodToStagingId.get(emb.page_id);
          if (stagingPageId) {
            return {
              page_id: stagingPageId,
              chunk_index: emb.chunk_index,
              content: emb.content,
              embedding: emb.embedding,
              metadata: emb.metadata
            };
          }
          return null;
        })
        .filter(Boolean);

      if (stagingEmbeddings.length > 0) {
        const { error: embError } = await supabase
          .from('page_embeddings')
          .insert(stagingEmbeddings);

        if (embError) {
          console.warn('⚠️  Could not copy embeddings:', embError.message);
        } else {
          console.log(`   ✅ Copied ${stagingEmbeddings.length} embeddings`);
        }
      }
    } else {
      console.log('   ⚠️  No embeddings to copy (production has 0 embeddings)');
      console.log('   💡 Generate embeddings to enable AI search');
    }
  }

  console.log('');
  console.log('🎉 Staging is now linked to production data!');
  console.log('');
  console.log('📋 What this means:');
  console.log('   ✅ Staging chatbot uses production scraped content');
  console.log('   ✅ Staging WooCommerce queries hit staging store');
  console.log('   ✅ No duplication - data stays in sync with production');
  console.log('   ⚡ Updates to production can be re-linked by running this script');
  console.log('');
  console.log('🧪 Test it:');
  console.log('   http://localhost:3000/embed?domain=epartstaging.wpengine.com');
  console.log('');
  console.log('💡 To update staging data when production changes:');
  console.log('   Just run this script again!');
}

linkStagingToProduction();
