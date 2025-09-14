#!/bin/bash

# Force Rescrape Thompson's eParts with new consolidated metadata

echo "🔄 Force Rescraping Thompson's eParts"
echo "====================================="
echo ""
echo "This will:"
echo "  • Delete and regenerate all embeddings"
echo "  • Apply consolidated metadata extraction"
echo "  • Use ContentEnricher for all pages"
echo "  • Update all product information"
echo ""

# Configuration
URL="https://www.thompsonseparts.co.uk"
MAX_PAGES=100  # Adjust as needed (-1 for all)
JOB_ID="force_rescrape_$(date +%s)"
TURBO="false"  # Set to true for faster scraping

echo "📊 Current Statistics:"
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStats() {
    const { count } = await supabase
        .from('scraped_pages')
        .select('*', { count: 'exact', head: true })
        .like('url', '%thompsonseparts.co.uk%');
        
    console.log('  Thompson\'s eParts pages:', count || 0);
    
    // Check metadata quality
    const { data } = await supabase
        .from('scraped_pages')
        .select('metadata')
        .like('url', '%thompsonseparts.co.uk%')
        .not('metadata', 'is', null)
        .limit(10);
        
    let hasConsolidated = 0;
    data?.forEach(page => {
        if (page.metadata.productPrice || page.metadata.productSku) {
            hasConsolidated++;
        }
    });
    
    console.log('  Pages with consolidated metadata:', hasConsolidated + '/10 sample');
}

checkStats();
" 2>/dev/null

echo ""
echo "🚀 Starting force rescrape..."
echo "  URL: $URL"
echo "  Max pages: $MAX_PAGES"
echo "  Job ID: $JOB_ID"
echo ""

# Run the force rescrape
SCRAPER_FORCE_RESCRAPE_ALL=true node lib/scraper-worker.js \
    "$JOB_ID" \
    "$URL" \
    "$MAX_PAGES" \
    "$TURBO" \
    "default" \
    "false" \
    "[]"

echo ""
echo "✅ Force rescrape complete!"
echo ""
echo "📊 New Statistics:"
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkNewStats() {
    // Check metadata quality after rescrape
    const { data } = await supabase
        .from('scraped_pages')
        .select('metadata, scraped_at')
        .like('url', '%thompsonseparts.co.uk%')
        .order('scraped_at', { ascending: false })
        .limit(10);
        
    let hasConsolidated = 0;
    let hasEnriched = 0;
    
    data?.forEach(page => {
        if (page.metadata?.productPrice || page.metadata?.productSku) {
            hasConsolidated++;
        }
        if (page.metadata?.productBrand || page.metadata?.productCategory) {
            hasEnriched++;
        }
    });
    
    console.log('  Recent pages with consolidated metadata:', hasConsolidated + '/10');
    console.log('  Recent pages with enriched fields:', hasEnriched + '/10');
    
    if (hasConsolidated > 7) {
        console.log('  ✅ SUCCESS: Consolidation working well!');
    } else {
        console.log('  ⚠️ Check logs - consolidation rate lower than expected');
    }
}

setTimeout(() => checkNewStats().catch(console.error), 3000);
" 2>/dev/null

echo ""
echo "Next steps:"
echo "  1. Check scraper logs for any errors"
echo "  2. Run: node test-consolidated-metadata.js"
echo "  3. Test search with product queries"