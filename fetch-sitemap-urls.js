#!/usr/bin/env node

/**
 * Fetch all URLs from Thompson's eParts sitemap
 */

const https = require('https');
const xml2js = require('xml2js');
const fs = require('fs');

async function fetchSitemap(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function parseSitemap(xmlData) {
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(xmlData);
  
  const urls = [];
  
  // Check for sitemap index (multiple sitemaps)
  if (result.sitemapindex) {
    console.log('Found sitemap index with multiple sitemaps');
    const sitemaps = result.sitemapindex.sitemap || [];
    
    for (const sitemap of sitemaps) {
      const sitemapUrl = sitemap.loc[0];
      console.log(`Fetching sitemap: ${sitemapUrl}`);
      const sitemapXml = await fetchSitemap(sitemapUrl);
      const sitemapResult = await parser.parseStringPromise(sitemapXml);
      
      if (sitemapResult.urlset && sitemapResult.urlset.url) {
        const sitemapUrls = sitemapResult.urlset.url.map(u => u.loc[0]);
        urls.push(...sitemapUrls);
        console.log(`  Found ${sitemapUrls.length} URLs`);
      }
    }
  }
  // Regular sitemap
  else if (result.urlset && result.urlset.url) {
    const sitemapUrls = result.urlset.url.map(u => u.loc[0]);
    urls.push(...sitemapUrls);
    console.log(`Found ${sitemapUrls.length} URLs in sitemap`);
  }
  
  return urls;
}

async function main() {
  console.log('🔍 Fetching Thompson\'s eParts sitemap...\n');
  
  try {
    // Try different sitemap locations
    const sitemapUrls = [
      'https://www.thompsonseparts.co.uk/sitemap.xml',
      'https://www.thompsonseparts.co.uk/sitemap_index.xml',
      'https://www.thompsonseparts.co.uk/wp-sitemap.xml'
    ];
    
    let allUrls = [];
    
    for (const sitemapUrl of sitemapUrls) {
      console.log(`Trying: ${sitemapUrl}`);
      try {
        const xml = await fetchSitemap(sitemapUrl);
        if (xml.includes('<?xml')) {
          const urls = await parseSitemap(xml);
          if (urls.length > 0) {
            allUrls = urls;
            console.log(`✅ Success! Found ${urls.length} URLs\n`);
            break;
          }
        }
      } catch (e) {
        console.log(`  ❌ Failed: ${e.message}`);
      }
    }
    
    if (allUrls.length === 0) {
      console.log('\n❌ No sitemap found. Will need to use crawling approach.');
      process.exit(1);
    }
    
    // Filter to only product and category pages
    const productUrls = allUrls.filter(url => 
      url.includes('/product/') || 
      url.includes('/product-category/')
    );
    
    console.log(`📊 URL Statistics:`);
    console.log(`  Total URLs: ${allUrls.length}`);
    console.log(`  Product/Category URLs: ${productUrls.length}`);
    
    // Save to file
    const outputFile = 'thompson-urls.json';
    fs.writeFileSync(outputFile, JSON.stringify({
      total: allUrls.length,
      productCount: productUrls.length,
      urls: allUrls,
      productUrls: productUrls,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    console.log(`\n✅ Saved to ${outputFile}`);
    console.log(`\nUse these URLs with the scraper for complete coverage.`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();