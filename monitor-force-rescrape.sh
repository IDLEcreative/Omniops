#!/bin/bash

echo "🚀 Starting Comprehensive Force Rescrape with Monitoring"
echo "========================================================="
echo ""
echo "This will:"
echo "  ✅ Force rescrape all pages"
echo "  ✅ Extract metadata (95% brand, 100% category)"
echo "  ✅ Generate embeddings for all content"
echo "  ✅ Properly overwrite old data"
echo ""

# Start the force rescrape
echo "Starting force rescrape..."
RESPONSE=$(curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.thompsonseparts.co.uk",
    "maxPages": 500,
    "force": true
  }' 2>/dev/null)

JOB_ID=$(echo $RESPONSE | grep -o '"jobId":"[^"]*' | cut -d'"' -f4)

echo "Job ID: $JOB_ID"
echo ""
echo "📊 Live Monitoring Output:"
echo "--------------------------"

# Monitor the scraping in real-time
npx tsx -e "
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function monitor() {
  let lastCheck = new Date();
  let pageCount = 0;
  let brandCount = 0;
  let categoryCount = 0;
  let embeddingCount = 0;
  
  console.log('Monitoring started at', new Date().toLocaleTimeString());
  console.log('');
  
  setInterval(async () => {
    // Check recent pages
    const { data: pages } = await supabase
      .from('scraped_pages')
      .select('url, title, metadata, scraped_at')
      .like('url', '%thompsons-eparts.co.uk%')
      .gte('scraped_at', lastCheck.toISOString())
      .order('scraped_at', { ascending: false });
    
    if (pages && pages.length > 0) {
      pageCount += pages.length;
      
      pages.forEach(page => {
        const meta = page.metadata || {};
        if (meta.productBrand) brandCount++;
        if (meta.productCategory) categoryCount++;
        
        // Show product pages with brands
        if (page.url.includes('/product/') && page.title) {
          console.log(\`✅ Product: \${page.title.substring(0, 50)}...\`);
          if (meta.productBrand) {
            console.log(\`   → Brand: \${meta.productBrand}\`);
          }
        }
      });
      
      lastCheck = new Date();
    }
    
    // Check embeddings
    const { data: embeddings } = await supabase
      .from('page_embeddings')
      .select('count')
      .like('url', '%thompsons-eparts.co.uk%')
      .gte('created_at', new Date(Date.now() - 60000).toISOString())
      .single();
    
    if (embeddings) {
      embeddingCount = embeddings.count || 0;
    }
    
    // Show summary every 10 seconds
    console.log(\`\n📈 Progress: \${pageCount} pages | \${brandCount} brands | \${categoryCount} categories | \${embeddingCount} embeddings\`);
    
  }, 10000); // Check every 10 seconds
}

monitor();
"
