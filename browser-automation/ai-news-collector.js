const ClaudeFastBrowser = require('./claude-fast-browser');

async function collectAINews() {
  const browser = new ClaudeFastBrowser();
  await browser.init();
  
  console.log('\n🤖 AI News Collection Mission\n');
  console.log('Task: Find 5 AI news articles and extract summaries\n');
  
  // Step 1: Go to Google
  console.log('Step 1: Navigate to Google...');
  await browser.go('https://www.google.com');
  await browser.wait();
  
  // Step 2: Search for AI news
  console.log('\nStep 2: Search for recent AI news...');
  await browser.fill('Search', 'AI news today 2024');
  await browser.key('Enter');
  await browser.wait();
  
  // Step 3: Click on News tab to get news results
  console.log('\nStep 3: Switch to News tab...');
  await browser.click('News');
  await browser.wait();
  
  // Take screenshot to see results
  await browser.screenshot(50);
  
  // Step 4: Scan for news articles
  console.log('\nStep 4: Scanning for news articles...');
  const elements = await browser.scan();
  
  // Find article links (they usually have specific patterns)
  const articleLinks = elements.filter(el => 
    el.tag === 'a' && 
    el.text && 
    el.text.length > 20 &&
    !el.text.includes('Google') &&
    !el.text.includes('Sign in') &&
    !el.text.includes('ago')
  ).slice(0, 5);
  
  console.log(`\nFound ${articleLinks.length} potential articles:`);
  articleLinks.forEach((link, i) => {
    console.log(`${i + 1}. ${link.text}`);
  });
  
  // Step 5: Visit each article and extract content
  const articles = [];
  
  for (let i = 0; i < Math.min(5, articleLinks.length); i++) {
    console.log(`\n📰 Visiting article ${i + 1}...`);
    
    try {
      // Click on the article
      await browser.clickIndex(articleLinks[i].index);
      await browser.wait();
      
      // Get page info
      const title = await browser.page.title();
      const url = browser.page.url();
      
      // Extract main content (simplified)
      const content = await browser.page.evaluate(() => {
        // Try to find article content
        const contentSelectors = [
          'article', 
          '[role="main"]', 
          '.article-content',
          '.entry-content',
          '.post-content',
          'main'
        ];
        
        for (const selector of contentSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            const text = element.innerText || element.textContent;
            if (text && text.length > 100) {
              return text.substring(0, 500) + '...';
            }
          }
        }
        
        // Fallback: get first few paragraphs
        const paragraphs = Array.from(document.querySelectorAll('p'))
          .map(p => p.innerText)
          .filter(text => text && text.length > 50)
          .slice(0, 3)
          .join(' ');
        
        return paragraphs.substring(0, 500) + '...';
      });
      
      articles.push({
        number: i + 1,
        title: title.substring(0, 100),
        url: url,
        preview: content
      });
      
      console.log(`✅ Extracted: ${title.substring(0, 60)}...`);
      
      // Go back to search results
      await browser.page.goBack();
      await browser.wait();
      
    } catch (error) {
      console.log(`❌ Error extracting article ${i + 1}: ${error.message}`);
    }
  }
  
  return articles;
}

// Run the collection
collectAINews().then(articles => {
  console.log('\n\n📊 AI NEWS SUMMARY REPORT');
  console.log('========================\n');
  
  articles.forEach(article => {
    console.log(`📰 Article ${article.number}: ${article.title}`);
    console.log(`🔗 URL: ${article.url}`);
    console.log(`📝 Preview: ${article.preview.substring(0, 200)}...`);
    console.log('\n---\n');
  });
  
  console.log('✅ News collection complete!');
}).catch(console.error);