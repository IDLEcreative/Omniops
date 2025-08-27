#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Hardcode the environment variables for this test
const SUPABASE_URL = 'https://birugqyuqhiahxvxeyqg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

async function storeScrapedData() {
  console.log('🚀 Storing scraped data in Supabase...\n');

  try {
    // Read the scraped data
    const dataPath = path.join(__dirname, '../scraped-data/universal-test/thompsons-enhanced-results.json');
    const rawData = await fs.readFile(dataPath, 'utf8');
    const scrapedData = JSON.parse(rawData);

    // First, create or get the domain
    const domain = 'thompsonseparts.co.uk';
    
    // Try to get existing domain first
    let { data: domainData, error: fetchError } = await supabase
      .from('domains')
      .select()
      .eq('domain', domain)
      .single();

    // If domain doesn't exist, create it
    if (fetchError || !domainData) {
      const { data: newDomain, error: createError } = await supabase
        .from('domains')
        .insert({
          domain: domain,
          name: "Thompson's Eparts",
          description: 'Excavator parts and equipment supplier',
          active: true,
          last_scraped_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating domain:', createError);
        return;
      }
      domainData = newDomain;
    } else {
      // Update last scraped time
      await supabase
        .from('domains')
        .update({ last_scraped_at: new Date().toISOString() })
        .eq('id', domainData.id);
    }

    console.log('✅ Domain registered:', domainData.domain);
    console.log('📊 Processing scraped data entries:', Object.keys(scrapedData));

    // Process each test result
    for (const [testName, testData] of Object.entries(scrapedData)) {
      console.log(`\n🔍 Processing ${testName}...`);
      
      if (!testData) {
        console.log(`   ⚠️  No data found for ${testName}`);
        continue;
      }

      const { url, platform, pageType, products, breadcrumbs, pagination } = testData;
      console.log(`   📍 URL: ${url}`);
      console.log(`   🛍️  Platform: ${platform}`);
      console.log(`   📄 Page Type: ${pageType}`);
      console.log(`   📦 Products found: ${products?.length || 0}`);

      // Store page content
      const { data: pageData, error: pageError } = await supabase
        .from('website_content')
        .upsert({
          domain_id: domainData.id,
          url: url,
          title: `${testName} Page`,
          content: JSON.stringify(testData),
          content_type: pageType,
          metadata: {
            platform,
            pageType,
            extractedAt: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (pageError) {
        console.error(`Error storing ${testName} page:`, pageError);
        continue;
      }

      // Store structured extractions for products
      if (products && products.length > 0) {
        const extractionRecords = products.map(product => ({
          domain_id: domainData.id,
          url: product.link || url,
          extract_type: 'product',
          extracted_data: {
            name: product.name,
            sku: product.sku,
            price: product.price,
            image: product.image,
            availability: product.availability,
            categories: product.categories,
            platform: platform
          },
          confidence_score: 1.0
        }));

        const { data: extractData, error: extractError } = await supabase
          .from('structured_extractions')
          .insert(extractionRecords);

        if (extractError) {
          console.error(`Error storing product extractions:`, extractError);
        } else {
          console.log(`✅ Stored ${products.length} products from ${testName}`);
        }
      }

      // Store FAQs if found (not present in current data but keeping for future)
      if (testData.faqs && testData.faqs.length > 0) {
        const faqRecords = testData.faqs.map(faq => ({
          domain_id: domainData.id,
          url: url,
          extract_type: 'faq',
          extracted_data: faq,
          confidence_score: 1.0
        }));

        const { data: faqData, error: faqError } = await supabase
          .from('structured_extractions')
          .insert(faqRecords);

        if (!faqError) {
          console.log(`✅ Stored ${testData.faqs.length} FAQs from ${testName}`);
        }
      }

      // Store navigation/breadcrumb data
      if (breadcrumbs && breadcrumbs.length > 0) {
        const { error: navError } = await supabase
          .from('structured_extractions')
          .insert({
            domain_id: domainData.id,
            url: url,
            extract_type: 'navigation',
            extracted_data: {
              breadcrumbs: breadcrumbs,
              pagination: pagination
            },
            confidence_score: 1.0
          });

        if (!navError) {
          console.log(`✅ Stored navigation data from ${testName}`);
        }
      }
    }

    // Generate summary statistics
    const { data: productCount } = await supabase
      .from('structured_extractions')
      .select('id', { count: 'exact' })
      .eq('domain_id', domainData.id)
      .eq('extract_type', 'product');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Data Storage Complete!\n');
    console.log(`📦 Total products stored: ${productCount?.length || 0}`);
    console.log(`🌐 Domain: ${domain}`);
    console.log(`📊 Database: ${SUPABASE_URL}`);
    console.log('\n🎯 Your AI agent can now reference:');
    console.log('   • Product names, SKUs, and prices');
    console.log('   • Product categories and availability');
    console.log('   • Navigation breadcrumbs');
    console.log('   • Direct product links');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('Error storing data:', error);
  }
}

// Run the script
storeScrapedData();