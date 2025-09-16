import { createClient } from '@supabase/supabase-js';
import { ProductExtractor } from './lib/product-extractor';

// Initialize from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiKey = process.env.OPENAI_API_KEY!;

async function runExtraction() {
  console.log('🚀 Starting Product Extraction\n');
  console.log('=' .repeat(60));
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const extractor = new ProductExtractor(supabaseUrl, supabaseServiceKey, openaiKey);
  
  try {
    // Get a sample of high-confidence product pages
    console.log('📋 Finding product pages to extract...\n');
    
    const { data: productPages, error } = await supabase
      .from('scraped_pages')
      .select('id, url, title')
      .or('url.ilike.%/product/%,url.ilike.%/shop/%')
      .limit(10); // Start with just 10 to test
    
    if (error) {
      console.error('Failed to fetch product pages:', error);
      return;
    }
    
    if (!productPages || productPages.length === 0) {
      console.log('No product pages found');
      return;
    }
    
    console.log(`Found ${productPages.length} product pages to process:\n`);
    productPages.forEach((page, i) => {
      console.log(`${i + 1}. ${page.title || 'Untitled'}`);
      console.log(`   URL: ${page.url}`);
    });
    
    console.log('\n🤖 Starting extraction with GPT-4...\n');
    console.log('(This may take a few minutes)\n');
    
    // Extract products
    const pageIds = productPages.map(p => p.id);
    await extractor.extractBatch(pageIds);
    
    // Check what was extracted
    console.log('\n📊 Checking extraction results...\n');
    
    const { data: extractedProducts, error: checkError } = await supabase
      .from('product_catalog')
      .select('name, sku, price, category, confidence_score')
      .in('page_id', pageIds);
    
    if (extractedProducts && extractedProducts.length > 0) {
      console.log(`✅ Successfully extracted ${extractedProducts.length} products:\n`);
      extractedProducts.forEach((product, i) => {
        console.log(`${i + 1}. ${product.name}`);
        console.log(`   SKU: ${product.sku || 'N/A'}`);
        console.log(`   Price: ${product.price ? `$${product.price}` : 'N/A'}`);
        console.log(`   Category: ${product.category || 'N/A'}`);
        console.log(`   Confidence: ${(product.confidence_score * 100).toFixed(0)}%`);
        console.log('');
      });
    } else {
      console.log('No products were extracted. This might be due to:');
      console.log('- Pages not containing clear product information');
      console.log('- OpenAI API issues');
      console.log('- Extraction errors (check logs)');
    }
    
    console.log('=' .repeat(60));
    console.log('✨ Extraction complete!');
    
  } catch (error) {
    console.error('Extraction failed:', error);
  }
}

// Check for required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || 
    !process.env.SUPABASE_SERVICE_ROLE_KEY || 
    !process.env.OPENAI_API_KEY) {
  console.error('Missing required environment variables!');
  console.error('Please ensure .env.local contains:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.error('- OPENAI_API_KEY');
  process.exit(1);
}

runExtraction();