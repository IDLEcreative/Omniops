#!/usr/bin/env node

require('dotenv').config();
const { PlaywrightCrawler } = require('@crawlee/playwright');
const { createClient } = require('@supabase/supabase-js');
const { EcommerceExtractor } = require('./lib/ecommerce-extractor');
const { ContentEnricher } = require('./lib/content-enricher');
const OpenAI = require('openai');
const crypto = require('crypto');

// Initialize clients
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper function to generate hash for chunk deduplication
function generateChunkHash(text) {
  const normalized = text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
  
  return crypto.createHash('sha256')
    .update(normalized)
    .digest('hex');
}

// Helper function to split text into chunks with deduplication
function splitIntoChunks(text, maxChunkSize = 1000) {
  const sentences = text.split(/[.!?]+/);
  const chunks = [];
  let currentChunk = '';
  const chunkHashCache = new Map();
  let duplicatesSkipped = 0;

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
      const trimmedChunk = currentChunk.trim();
      const chunkHash = generateChunkHash(trimmedChunk);
      
      if (!chunkHashCache.has(chunkHash)) {
        chunks.push(trimmedChunk);
        chunkHashCache.set(chunkHash, true);
      } else {
        duplicatesSkipped++;
      }
      
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }

  if (currentChunk) {
    const trimmedChunk = currentChunk.trim();
    const chunkHash = generateChunkHash(trimmedChunk);
    
    if (!chunkHashCache.has(chunkHash)) {
      chunks.push(trimmedChunk);
      chunkHashCache.set(chunkHash, true);
    } else {
      duplicatesSkipped++;
    }
  }

  console.log(`Generated ${chunks.length} unique chunks (${duplicatesSkipped} duplicates skipped)`);
  return chunks;
}

// Generate embeddings
async function generateEmbeddings(chunks) {
  const embeddings = [];
  
  const batchSize = 20;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    console.log(`Processing embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    });
    
    embeddings.push(...response.data.map(d => d.embedding));
  }
  
  return embeddings;
}

async function testDirectScrape() {
  const url = 'https://www.thompsonseparts.co.uk/categories/';
  console.log('Testing direct scrape for:', url);

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 1,
    requestHandlerTimeoutSecs: 30,
    navigationTimeoutSecs: 20,
    
    launchContext: {
      launchOptions: {
        headless: true,
      },
    },

    preNavigationHooks: [
      async ({ page }) => {
        console.log('Setting up page...');
        await page.setViewportSize({ width: 1280, height: 720 });
        
        // Turbo mode: block unnecessary resources
        await page.route('**/*', (route) => {
          const resourceType = route.request().resourceType();
          const blockedTypes = ['image', 'media', 'font', 'stylesheet'];
          
          if (blockedTypes.includes(resourceType)) {
            route.abort();
          } else {
            route.continue();
          }
        });
      },
    ],
    
    requestHandler: async ({ page, request }) => {
      console.log('Processing page:', request.url);
      
      // Wait for content to load
      await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
      
      // Get HTML
      const html = await page.content();
      console.log('Page HTML length:', html.length);
      
      // Extract using e-commerce extractor
      console.log('Running e-commerce extraction...');
      const extracted = await EcommerceExtractor.extractEcommerce(html, request.url);
      
      console.log('Extraction result:');
      console.log('- Title:', extracted.title);
      console.log('- Content length:', extracted.content?.length || 0);
      console.log('- Word count:', extracted.wordCount);
      console.log('- Platform:', extracted.platform);
      console.log('- Page type:', extracted.pageType);
      console.log('- Products count:', extracted.products?.length || 0);
      
      if (extracted.products?.[0]) {
        const product = extracted.products[0];
        console.log('- First product:');
        console.log('  - SKU:', product.sku);
        console.log('  - Name:', product.name);
        console.log('  - Price:', JSON.stringify(product.price));
        console.log('  - Availability:', JSON.stringify(product.availability));
        console.log('  - Categories:', product.categories);
        console.log('  - Attributes keys:', product.attributes ? Object.keys(product.attributes) : 'none');
      }
      
      if (!extracted.content) {
        console.log('❌ No content extracted, skipping save');
        return;
      }
      
      // Test content enrichment
      console.log('\nTesting ContentEnricher...');
      const originalContent = extracted.content;
      const enrichedContent = ContentEnricher.enrichContent(
        originalContent,
        extracted.metadata,
        request.url,
        extracted.title
      );
      
      console.log('Content enrichment:');
      console.log('- Original length:', originalContent.length);
      console.log('- Enriched length:', enrichedContent.length);
      console.log('- Enrichment added:', enrichedContent.length - originalContent.length, 'characters');
      
      // Show enrichment preview
      const enrichmentLines = enrichedContent.split('\n\n')[0];
      console.log('- Enrichment preview:', enrichmentLines);
      
      // Calculate enrichment quality
      const quality = ContentEnricher.calculateEnrichmentQuality(enrichedContent);
      console.log('- Enrichment quality score:', quality.enrichmentScore + '%');
      console.log('- Has product data:', quality.hasProductData);
      console.log('- Has SKU:', quality.hasSKU);
      console.log('- Has price:', quality.hasPrice);
      console.log('- Has availability:', quality.hasAvailability);
      
      // Save to database
      console.log('\nSaving to database...');
      const { data: savedPage, error: pageError } = await supabase
        .from('scraped_pages')
        .upsert({
          url: request.url,
          title: extracted.title,
          content: extracted.content,
          metadata: extracted.metadata,
          last_scraped_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (pageError) {
        console.error('Error saving page:', pageError);
        return;
      }

      console.log('✅ Page saved with ID:', savedPage.id);
      
      // Generate and save embeddings with enriched content
      console.log('\nGenerating embeddings with enriched content...');
      const chunks = splitIntoChunks(enrichedContent);
      
      if (chunks.length > 0) {
        const embeddings = await generateEmbeddings(chunks);

        // Save embeddings
        const embeddingRecords = chunks.map((chunk, index) => ({
          page_id: savedPage.id,
          chunk_text: chunk,
          embedding: embeddings[index],
          metadata: { chunk_index: index },
        }));

        const { error: embError } = await supabase
          .from('page_embeddings')
          .insert(embeddingRecords);

        if (embError) {
          console.error('Error saving embeddings:', embError);
        } else {
          console.log('✅ Saved', embeddingRecords.length, 'enriched embeddings');
        }
      }
      
      console.log('\n=== Test Complete ===');
    },
  });

  try {
    await crawler.run([url]);
    console.log('✅ Scrape completed successfully');
  } catch (error) {
    console.error('❌ Scrape failed:', error);
  }
}

testDirectScrape().catch(console.error);