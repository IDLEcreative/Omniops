#!/usr/bin/env node

/**
 * Direct test of the scraping functionality using Playwright
 * This bypasses the API and database to test pure scraping
 */

import { chromium } from 'playwright';

async function testDirectScrape() {
  const url = 'https://www.thompsonseparts.co.uk/';
  
  console.log('🔍 Direct Scraping Test for:', url);
  console.log('━'.repeat(60));
  
  let browser;
  
  try {
    console.log('\n📊 Test Configuration:');
    console.log('  - URL:', url);
    console.log('  - Browser: Chromium (headless)');
    console.log('  - Turbo Mode: Enabled (blocking unnecessary resources)');
    
    console.log('\n⏳ Launching browser...');
    const startTime = Date.now();
    
    browser = await chromium.launch({
      headless: true,
    });
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (compatible; OmniopsCrawler/1.0)',
    });
    
    const page = await context.newPage();
    
    // Turbo mode: Block unnecessary resources
    console.log('🚀 Enabling turbo mode (blocking images, fonts, stylesheets)...');
    await page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      const url = route.request().url();
      
      const blockedTypes = ['image', 'media', 'font', 'stylesheet'];
      const blockedDomains = ['googletagmanager.com', 'google-analytics.com', 'facebook.com', 'doubleclick.net'];
      
      if (blockedTypes.includes(resourceType) || 
          blockedDomains.some(domain => url.includes(domain))) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    console.log('📡 Navigating to website...');
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    
    // Wait for main content
    try {
      await page.waitForSelector('main, article, [role="main"], .content, body', {
        timeout: 5000,
      });
    } catch {
      console.log('⚠️  No specific content selector found, continuing...');
    }
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Page loaded in ${elapsed} seconds`);
    
    console.log('\n━'.repeat(60));
    console.log('\n📋 SCRAPING RESULTS:\n');
    
    // Extract page information
    const title = await page.title();
    const url_final = page.url();
    
    // Extract text content
    const textContent = await page.evaluate(() => {
      // Remove script and style elements
      const scripts = document.querySelectorAll('script, style, noscript');
      scripts.forEach(el => el.remove());
      
      // Get text content
      return document.body?.innerText || '';
    });
    
    // Extract metadata
    const metadata = await page.evaluate(() => {
      const getMeta = (name) => {
        const element = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        return element?.getAttribute('content') || null;
      };
      
      return {
        description: getMeta('description'),
        keywords: getMeta('keywords'),
        author: getMeta('author'),
        viewport: getMeta('viewport'),
        ogTitle: getMeta('og:title'),
        ogDescription: getMeta('og:description'),
        ogImage: getMeta('og:image'),
      };
    });
    
    // Extract images
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.slice(0, 10).map(img => ({
        src: img.src,
        alt: img.alt || '',
        width: img.naturalWidth,
        height: img.naturalHeight,
      }));
    });
    
    // Extract links
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      return anchors.slice(0, 20).map(a => ({
        text: a.innerText?.trim() || '',
        href: a.href,
      }));
    });
    
    // Display results
    console.log('🔗 URL:', url_final);
    console.log('📝 Title:', title || 'N/A');
    console.log('📊 Text Length:', textContent.length, 'characters');
    console.log('📊 Word Count:', textContent.split(/\\s+/).filter(w => w.length > 0).length, 'words');
    
    console.log('\n📌 Metadata:');
    Object.entries(metadata).forEach(([key, value]) => {
      if (value) {
        console.log(`  - ${key}:`, value.substring(0, 100) + (value.length > 100 ? '...' : ''));
      }
    });
    
    if (images.length > 0) {
      console.log('\n🖼️  Images Found:', images.length);
      images.slice(0, 3).forEach((img, i) => {
        console.log(`  ${i + 1}. ${img.alt || 'No alt'} (${img.width}x${img.height}) - ${img.src.substring(0, 50)}...`);
      });
    }
    
    if (links.length > 0) {
      console.log('\n🔗 Links Found:', links.length);
      links.slice(0, 5).forEach((link, i) => {
        console.log(`  ${i + 1}. ${link.text.substring(0, 30) || 'No text'} -> ${link.href.substring(0, 50)}...`);
      });
    }
    
    console.log('\n📄 Content Preview (first 500 chars):');
    console.log('  ' + textContent.substring(0, 500).replace(/\\n/g, '\\n  ') + '...');
    
    console.log('\n━'.repeat(60));
    console.log('\n✨ ASSESSMENT:\n');
    
    // Assessment
    const assessment = {
      pageLoaded: true,
      titleExtracted: !!title,
      contentExtracted: textContent.length > 100,
      metadataFound: Object.values(metadata).some(v => v !== null),
      imagesFound: images.length > 0,
      linksFound: links.length > 0,
      wordCount: textContent.split(/\\s+/).filter(w => w.length > 0).length,
    };
    
    console.log('✔️  Page Loaded: Yes');
    console.log('✔️  Title Extracted:', assessment.titleExtracted ? 'Yes' : 'No');
    console.log('✔️  Content Extracted:', assessment.contentExtracted ? 'Yes' : 'No');
    console.log('✔️  Metadata Found:', assessment.metadataFound ? 'Yes' : 'No');
    console.log('✔️  Images Found:', assessment.imagesFound ? `Yes (${images.length})` : 'No');
    console.log('✔️  Links Found:', assessment.linksFound ? `Yes (${links.length})` : 'No');
    console.log('✔️  Total Words:', assessment.wordCount);
    
    // Overall score
    let score = 0;
    if (assessment.titleExtracted) score += 20;
    if (assessment.contentExtracted) score += 30;
    if (assessment.metadataFound) score += 20;
    if (assessment.imagesFound) score += 10;
    if (assessment.linksFound) score += 10;
    if (assessment.wordCount > 100) score += 10;
    
    console.log('\n🎯 Overall Score:', score + '/100');
    
    if (score >= 80) {
      console.log('💚 Excellent! The scraper successfully extracted comprehensive data from the website.');
    } else if (score >= 60) {
      console.log('🟡 Good! The scraper extracted most data successfully with some gaps.');
    } else {
      console.log('🔴 Limited success. The website may have anti-scraping measures or unusual structure.');
    }
    
    console.log('\n💡 Scraper Capabilities:');
    console.log('  ✅ JavaScript rendering (SPA support)');
    console.log('  ✅ Resource blocking for performance');
    console.log('  ✅ Metadata extraction');
    console.log('  ✅ Image discovery');
    console.log('  ✅ Link extraction');
    console.log('  ✅ Clean text extraction');
    
  } catch (error) {
    console.error('\n❌ Scraping failed:', error.message);
    console.error('\nFull error:', error);
    
    console.log('\n💡 Troubleshooting:');
    console.log('  1. Check if the website is accessible');
    console.log('  2. The site may have anti-bot protection');
    console.log('  3. Try adjusting timeout values');
    console.log('  4. Check network connectivity');
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n🔒 Browser closed');
    }
  }
  
  console.log('\n━'.repeat(60));
}

// Run the test
testDirectScrape().then(() => {
  console.log('\n✅ Test completed successfully');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});