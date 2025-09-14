#!/bin/bash

# Full Rescrape Script - Domain by Domain
# This script performs a complete rescrape with the new consolidated metadata system

echo "🔄 Full Rescrape with Consolidated Metadata"
echo "=========================================="
echo ""

# Configuration
FORCE_RESCRAPE=true
TURBO=false  # Set to true for faster scraping if needed
LOG_DIR="./logs/rescrape-$(date +%Y%m%d)"
mkdir -p "$LOG_DIR"

# Function to rescrape a domain
rescrape_domain() {
    local domain=$1
    local max_pages=${2:-100}
    
    echo "📦 Rescraping domain: $domain"
    echo "  Max pages: $max_pages"
    echo "  Starting at: $(date)"
    
    # Clean old data first (optional - uncomment if you want to remove old data)
    # echo "  Cleaning old data..."
    # npx tsx lib/database-cleaner.ts clean --domain="$domain"
    
    # Run the rescrape
    FORCE_RESCRAPE=true DOMAIN="$domain" MAX_PAGES="$max_pages" \
        node lib/scraper-worker.js > "$LOG_DIR/${domain}.log" 2>&1
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo "  ✅ Completed successfully at $(date)"
    else
        echo "  ❌ Failed with exit code $exit_code"
    fi
    
    echo ""
    return $exit_code
}

# Function to check domain statistics
check_domain_stats() {
    echo "📊 Checking current domain statistics..."
    node -e "
    const { createClient } = require('@supabase/supabase-js');
    require('dotenv').config({ path: '.env.local' });
    
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    async function getDomainStats() {
        const { data, error } = await supabase
            .from('scraped_pages')
            .select('url')
            .limit(5000);
            
        if (error) {
            console.error('Error:', error);
            return;
        }
        
        const domains = {};
        data.forEach(page => {
            const domain = new URL(page.url).hostname;
            domains[domain] = (domains[domain] || 0) + 1;
        });
        
        console.log('\\nDomains to rescrape:');
        console.log('--------------------');
        Object.entries(domains)
            .sort((a, b) => b[1] - a[1])
            .forEach(([domain, count]) => {
                console.log(\`  • \${domain}: \${count} pages\`);
            });
    }
    
    getDomainStats();
    " 2>/dev/null
    
    echo ""
}

# Main execution
main() {
    # Check current state
    check_domain_stats
    
    echo "🚀 Starting full rescrape process"
    echo "================================="
    echo ""
    
    # Option 1: Rescrape specific domains (recommended)
    # Uncomment and modify the domains you want to rescrape
    
    # High priority domains (e-commerce with products)
    # rescrape_domain "www.thompsonseparts.co.uk" 500
    # rescrape_domain "www.thompson-morgan.com" 300
    
    # Medium priority domains
    # rescrape_domain "example-store.com" 200
    
    # Low priority domains
    # rescrape_domain "blog.example.com" 50
    
    # Option 2: Rescrape everything (use with caution)
    # Uncomment the following line to rescrape ALL domains
    # FORCE_RESCRAPE=true node lib/scraper-worker.js > "$LOG_DIR/full-rescrape.log" 2>&1
    
    echo "📈 Rescrape Summary"
    echo "=================="
    echo "Log files saved in: $LOG_DIR"
    echo ""
    
    # Check new statistics
    echo "📊 New domain statistics:"
    node -e "
    const { createClient } = require('@supabase/supabase-js');
    require('dotenv').config({ path: '.env.local' });
    
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    async function checkMetadata() {
        const { data } = await supabase
            .from('scraped_pages')
            .select('metadata')
            .not('metadata', 'is', null)
            .limit(100);
            
        let consolidated = 0;
        let legacy = 0;
        
        data?.forEach(page => {
            if ('productPrice' in page.metadata || 'productSku' in page.metadata) {
                consolidated++;
            } else if ('price' in page.metadata || 'sku' in page.metadata) {
                legacy++;
            }
        });
        
        console.log('Sample of 100 pages:');
        console.log('  Consolidated fields:', consolidated);
        console.log('  Legacy fields:', legacy);
        console.log('  Success rate:', (consolidated / (consolidated + legacy) * 100).toFixed(1) + '%');
    }
    
    checkMetadata();
    " 2>/dev/null
}

# Run main function
main

echo ""
echo "✅ Full rescrape process complete!"
echo "Next steps:"
echo "  1. Check logs in $LOG_DIR for any errors"
echo "  2. Verify metadata consolidation with: node test-consolidated-metadata.js"
echo "  3. Test search quality improvements"