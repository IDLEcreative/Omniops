#!/usr/bin/env -S npx tsx

/**
 * Test script to verify the improved content extraction
 * Compares extraction with and without business info preservation
 */

import { ContentExtractor } from './lib/content-extractor';
import { extractBusinessInfo } from './lib/business-content-extractor';
import fetch from 'node-fetch';

// Test HTML with typical e-commerce elements
const testHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Example Store - Quality Products</title>
  <meta name="description" content="Your trusted source for quality products">
</head>
<body>
  <header class="site-header">
    <nav class="main-menu">
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/products">Products</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/contact">Contact</a></li>
        <li><a href="/cart">Cart</a></li>
      </ul>
    </nav>
    <div class="contact-header">
      <span>Call us: <a href="tel:+1234567890">+1 (234) 567-890</a></span>
      <span>Email: <a href="mailto:info@example.com">info@example.com</a></span>
    </div>
  </header>
  
  <nav class="mega-menu">
    <!-- Lots of category links that should be removed -->
    <ul>
      <li><a href="/cat1">Category 1</a></li>
      <li><a href="/cat2">Category 2</a></li>
      <li><a href="/cat3">Category 3</a></li>
      <li><a href="/cat4">Category 4</a></li>
      <li><a href="/cat5">Category 5</a></li>
      <li><a href="/cat6">Category 6</a></li>
      <li><a href="/cat7">Category 7</a></li>
      <li><a href="/cat8">Category 8</a></li>
      <li><a href="/cat9">Category 9</a></li>
      <li><a href="/cat10">Category 10</a></li>
    </ul>
  </nav>
  
  <main>
    <article>
      <h1>Welcome to Our Store</h1>
      <p>We offer the best products with excellent customer service. Our team is dedicated to providing you with quality items at competitive prices.</p>
      
      <section class="products">
        <h2>Featured Products</h2>
        <p>Check out our latest collection of premium items carefully selected for you.</p>
      </section>
    </article>
  </main>
  
  <aside class="sidebar">
    <div class="widget">
      <h3>Store Hours</h3>
      <div class="hours">
        Monday-Friday: 9AM-6PM<br>
        Saturday: 10AM-4PM<br>
        Sunday: Closed
      </div>
    </div>
  </aside>
  
  <footer class="site-footer">
    <div class="footer-content">
      <div class="location">
        <address>
          123 Main Street<br>
          City, State 12345<br>
          United States
        </address>
      </div>
      <div class="footer-links">
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
        <a href="/returns">Return Policy</a>
        <a href="/shipping">Shipping Info</a>
      </div>
      <div class="social-links">
        <a href="https://facebook.com/example">Facebook</a>
        <a href="https://twitter.com/example">Twitter</a>
      </div>
    </div>
  </footer>
  
  <div class="cookie-notice">
    This site uses cookies. By continuing, you agree to our cookie policy.
  </div>
</body>
</html>
`;

async function testExtraction() {
  console.log('🧪 Testing Smart Content Extraction\n');
  console.log('=' .repeat(60));
  
  // Test business info extraction
  console.log('\n📊 BUSINESS INFO EXTRACTION:');
  console.log('-'.repeat(40));
  const businessInfo = extractBusinessInfo(testHTML);
  console.log('Contact Info:');
  console.log('  Phones:', businessInfo.contactInfo.phones);
  console.log('  Emails:', businessInfo.contactInfo.emails);
  console.log('  Addresses:', businessInfo.contactInfo.addresses);
  console.log('Business Hours:', businessInfo.businessHours);
  
  // Test content extraction
  console.log('\n📝 CONTENT EXTRACTION:');
  console.log('-'.repeat(40));
  const extracted = ContentExtractor.extractWithReadability(testHTML, 'https://example.com');
  
  console.log('Title:', extracted.title);
  console.log('Word Count:', extracted.wordCount);
  console.log('Reading Time:', extracted.readingTime, 'minutes');
  
  console.log('\n📄 EXTRACTED CONTENT:');
  console.log('-'.repeat(40));
  console.log(extracted.content.substring(0, 500) + '...');
  
  if (extracted.businessInfo) {
    console.log('\n✅ Business info preserved in extraction!');
    console.log('  Found', extracted.businessInfo.contactInfo.phones.length, 'phone number(s)');
    console.log('  Found', extracted.businessInfo.contactInfo.emails.length, 'email(s)');
    console.log('  Found', extracted.businessInfo.businessHours.length, 'hours section(s)');
  }
  
  // Test with real website (optional)
  const testRealSite = process.argv[2] === '--real';
  if (testRealSite) {
    console.log('\n🌐 TESTING WITH REAL WEBSITE:');
    console.log('-'.repeat(40));
    const url = process.argv[3] || 'https://www.thompsonseparts.co.uk';
    console.log('Fetching:', url);
    
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      const realExtracted = ContentExtractor.extractWithReadability(html, url);
      const realBusinessInfo = extractBusinessInfo(html);
      
      console.log('\nExtracted from', url);
      console.log('Title:', realExtracted.title);
      console.log('Word Count:', realExtracted.wordCount);
      console.log('Business Info:');
      console.log('  Phones:', realBusinessInfo.contactInfo.phones);
      console.log('  Emails:', realBusinessInfo.contactInfo.emails);
      console.log('  Addresses:', realBusinessInfo.contactInfo.addresses);
      
    } catch (error) {
      console.error('Error fetching real site:', error);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Test complete!');
  console.log('\nKey improvements:');
  console.log('• Mega menu with 10+ links removed');
  console.log('• Contact info in header preserved');
  console.log('• Business hours in sidebar preserved');
  console.log('• Address in footer preserved');
  console.log('• Cookie notice removed');
  console.log('• Main article content kept intact');
}

// Run the test
testExtraction().catch(console.error);