#!/usr/bin/env node

/**
 * Chat System Response Tester
 * 
 * Tests the chat API with specific user queries from feedback and analyzes responses for:
 * - Response length issues
 * - External links (non-same-domain)
 * - Currency issues (USD vs GBP)
 * - Product presentation issues
 * - Amazon/manufacturer site suggestions
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const TEST_QUERIES = [
  "Need a pump for my Cifa mixer",
  "Teng torque wrenches", 
  "Kinshofer pin & bush kit",
  "DC66-10P",
  "sheet roller bar",
  "Price on a starter charger",
  "Price on Body Filler"
];

const API_URL = 'http://localhost:3001/api/chat';
const TARGET_DOMAIN = 'thompsonseparts.co.uk';

// Analysis patterns
const ANALYSIS_PATTERNS = {
  externalLinks: {
    amazon: /amazon\.(co\.uk|com)/gi,
    manufacturers: /\b(caterpillar|kinshofer|cifa|teng|makita|dewalt|bosch)\.com/gi,
    genericExternal: /https?:\/\/(?!thompsonseparts\.co\.uk)[a-z0-9.-]+\.[a-z]{2,}/gi
  },
  currency: {
    usd: /\$\d+|\$|\bUSD\b/gi,
    gbp: /£\d+|£|\bGBP\b/gi
  },
  problematicPhrases: [
    /check.*amazon/gi,
    /available.*amazon/gi,
    /visit.*manufacturer/gi,
    /manufacturer.*website/gi,
    /official.*website/gi,
    /contact.*manufacturer/gi
  ]
};

class ChatTester {
  constructor() {
    this.results = [];
  }

  async testQuery(query, index) {
    const sessionId = `test-session-${Date.now()}-${index}`;
    
    console.log(`\n🔍 Testing Query ${index + 1}: "${query}"`);
    console.log('━'.repeat(60));
    
    const requestBody = {
      message: query,
      session_id: sessionId,
      domain: TARGET_DOMAIN,
      config: {
        features: {
          woocommerce: { enabled: true },
          websiteScraping: { enabled: true }
        }
      }
    };

    try {
      const startTime = Date.now();
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const message = data.message || '';
      
      console.log(`✅ Response received in ${responseTime}ms`);
      
      // Analyze the response
      const analysis = this.analyzeResponse(message, query);
      
      // Store results
      this.results.push({
        query,
        response: message,
        analysis,
        responseTime,
        sessionId,
        conversationId: data.conversation_id,
        sources: data.sources || []
      });

      // Display analysis
      this.displayAnalysis(analysis, message);
      
      return true;
      
    } catch (error) {
      console.error(`❌ Error testing query: ${error.message}`);
      this.results.push({
        query,
        response: '',
        analysis: { error: error.message },
        responseTime: 0,
        sessionId,
        conversationId: null,
        sources: []
      });
      return false;
    }
  }

  analyzeResponse(message, query) {
    const analysis = {
      wordCount: message.split(/\s+/).length,
      charCount: message.length,
      externalLinks: [],
      currency: { usd: [], gbp: [] },
      productLinks: [],
      problematicPhrases: [],
      showsProducts: false,
      asksQuestionsFirst: false,
      isLengthy: false
    };

    // Count words and characters
    analysis.isLengthy = analysis.wordCount > 150 || analysis.charCount > 800;

    // Check for external links
    Object.entries(ANALYSIS_PATTERNS.externalLinks).forEach(([type, pattern]) => {
      const matches = message.match(pattern);
      if (matches) {
        analysis.externalLinks.push(...matches.map(match => ({ type, url: match })));
      }
    });

    // Check currency mentions
    const usdMatches = message.match(ANALYSIS_PATTERNS.currency.usd);
    const gbpMatches = message.match(ANALYSIS_PATTERNS.currency.gbp);
    
    if (usdMatches) analysis.currency.usd = usdMatches;
    if (gbpMatches) analysis.currency.gbp = gbpMatches;

    // Check for problematic phrases
    ANALYSIS_PATTERNS.problematicPhrases.forEach(pattern => {
      const matches = message.match(pattern);
      if (matches) {
        analysis.problematicPhrases.push(...matches);
      }
    });

    // Check for product links (same-domain links)
    const productLinkPattern = new RegExp(`https?://${TARGET_DOMAIN}[^\\s)\\]]+`, 'gi');
    const productMatches = message.match(productLinkPattern);
    if (productMatches) {
      analysis.productLinks = productMatches;
      analysis.showsProducts = true;
    }

    // Check if response asks questions before showing products
    const questionPatterns = [
      /what type/i,
      /which.*do you need/i,
      /can you.*specific/i,
      /more information.*which/i,
      /clarify.*which/i
    ];
    
    const hasEarlyQuestions = questionPatterns.some(pattern => {
      const match = message.match(pattern);
      if (match) {
        // Check if question appears before any product links
        const questionIndex = message.indexOf(match[0]);
        const firstProductIndex = analysis.productLinks.length > 0 
          ? message.indexOf(analysis.productLinks[0]) 
          : message.length;
        return questionIndex < firstProductIndex;
      }
      return false;
    });

    analysis.asksQuestionsFirst = hasEarlyQuestions;

    return analysis;
  }

  displayAnalysis(analysis, message) {
    // Response length analysis
    console.log(`📏 Length: ${analysis.wordCount} words, ${analysis.charCount} chars ${analysis.isLengthy ? '⚠️  TOO LONG' : '✅'}`);
    
    // External links analysis
    if (analysis.externalLinks.length > 0) {
      console.log(`🔗 External Links Found: ❌`);
      analysis.externalLinks.forEach(link => {
        console.log(`   ${link.type}: ${link.url}`);
      });
    } else {
      console.log(`🔗 External Links: ✅ None found`);
    }

    // Currency analysis
    if (analysis.currency.usd.length > 0) {
      console.log(`💰 Currency Issue: ❌ Found USD references: ${analysis.currency.usd.join(', ')}`);
    }
    if (analysis.currency.gbp.length > 0) {
      console.log(`💰 Currency: ✅ Found GBP: ${analysis.currency.gbp.join(', ')}`);
    }
    if (analysis.currency.usd.length === 0 && analysis.currency.gbp.length === 0) {
      console.log(`💰 Currency: ℹ️  No currency mentioned`);
    }

    // Product presentation analysis
    if (analysis.showsProducts) {
      console.log(`🛒 Products Shown: ✅ ${analysis.productLinks.length} product(s) linked`);
      if (analysis.asksQuestionsFirst) {
        console.log(`❓ Question Pattern: ❌ Asks questions before showing products`);
      } else {
        console.log(`❓ Question Pattern: ✅ Shows products immediately`);
      }
    } else {
      console.log(`🛒 Products Shown: ❌ No products displayed`);
    }

    // Problematic phrases
    if (analysis.problematicPhrases.length > 0) {
      console.log(`⚠️  Problematic Phrases: ❌`);
      analysis.problematicPhrases.forEach(phrase => {
        console.log(`   "${phrase}"`);
      });
    } else {
      console.log(`⚠️  Problematic Phrases: ✅ None found`);
    }

    // Show first 200 chars of response for context
    console.log(`\n📝 Response Preview:`);
    console.log(`"${message.substring(0, 200).replace(/\n/g, ' ')}${message.length > 200 ? '...' : ''}"`);
  }

  async runAllTests() {
    console.log('🚀 Starting Chat Response Analysis');
    console.log(`Testing against: ${API_URL}`);
    console.log(`Target domain: ${TARGET_DOMAIN}`);
    console.log(`Total queries: ${TEST_QUERIES.length}`);
    console.log('═'.repeat(80));

    let successCount = 0;
    
    for (let i = 0; i < TEST_QUERIES.length; i++) {
      const success = await this.testQuery(TEST_QUERIES[i], i);
      if (success) successCount++;
      
      // Add delay between requests to avoid rate limiting
      if (i < TEST_QUERIES.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n' + '═'.repeat(80));
    this.generateSummaryReport(successCount);
  }

  generateSummaryReport(successCount) {
    console.log('📊 SUMMARY REPORT');
    console.log('═'.repeat(80));
    
    console.log(`✅ Successful requests: ${successCount}/${TEST_QUERIES.length}`);
    
    // Aggregate issues
    const issues = {
      externalLinks: 0,
      lengthyResponses: 0,
      usdCurrency: 0,
      noProducts: 0,
      questionsFirst: 0,
      problematicPhrases: 0
    };

    const successfulResults = this.results.filter(r => !r.analysis.error);

    successfulResults.forEach(result => {
      if (result.analysis.externalLinks.length > 0) issues.externalLinks++;
      if (result.analysis.isLengthy) issues.lengthyResponses++;
      if (result.analysis.currency.usd.length > 0) issues.usdCurrency++;
      if (!result.analysis.showsProducts) issues.noProducts++;
      if (result.analysis.asksQuestionsFirst) issues.questionsFirst++;
      if (result.analysis.problematicPhrases.length > 0) issues.problematicPhrases++;
    });

    console.log('\n🚨 ISSUES DETECTED:');
    console.log(`   External Links: ${issues.externalLinks}/${successCount} responses`);
    console.log(`   Lengthy Responses: ${issues.lengthyResponses}/${successCount} responses`);
    console.log(`   USD Currency: ${issues.usdCurrency}/${successCount} responses`);
    console.log(`   No Products Shown: ${issues.noProducts}/${successCount} responses`);
    console.log(`   Questions Before Products: ${issues.questionsFirst}/${successCount} responses`);
    console.log(`   Problematic Phrases: ${issues.problematicPhrases}/${successCount} responses`);

    // Detailed examples of problems
    console.log('\n📋 DETAILED ISSUE EXAMPLES:');
    console.log('─'.repeat(50));

    successfulResults.forEach((result, index) => {
      const hasIssues = result.analysis.externalLinks.length > 0 ||
                       result.analysis.isLengthy ||
                       result.analysis.currency.usd.length > 0 ||
                       !result.analysis.showsProducts ||
                       result.analysis.asksQuestionsFirst ||
                       result.analysis.problematicPhrases.length > 0;

      if (hasIssues) {
        console.log(`\n❌ Query: "${result.query}"`);
        
        if (result.analysis.externalLinks.length > 0) {
          console.log(`   🔗 External links: ${result.analysis.externalLinks.map(l => l.url).join(', ')}`);
        }
        
        if (result.analysis.currency.usd.length > 0) {
          console.log(`   💰 USD found: ${result.analysis.currency.usd.join(', ')}`);
        }
        
        if (!result.analysis.showsProducts) {
          console.log(`   🛒 No products shown`);
        }
        
        if (result.analysis.asksQuestionsFirst) {
          console.log(`   ❓ Asks questions before showing products`);
        }
        
        if (result.analysis.problematicPhrases.length > 0) {
          console.log(`   ⚠️  Problematic: ${result.analysis.problematicPhrases.join(', ')}`);
        }
        
        if (result.analysis.isLengthy) {
          console.log(`   📏 Too long: ${result.analysis.wordCount} words`);
        }

        // Show response snippet
        console.log(`   📝 Response: "${result.response.substring(0, 150).replace(/\n/g, ' ')}..."`);
      }
    });

    // Show successful examples
    const goodResults = successfulResults.filter(result => {
      return result.analysis.externalLinks.length === 0 &&
             !result.analysis.isLengthy &&
             result.analysis.currency.usd.length === 0 &&
             result.analysis.showsProducts &&
             !result.analysis.asksQuestionsFirst &&
             result.analysis.problematicPhrases.length === 0;
    });

    if (goodResults.length > 0) {
      console.log('\n✅ GOOD RESPONSE EXAMPLES:');
      console.log('─'.repeat(50));
      
      goodResults.forEach(result => {
        console.log(`\n✅ Query: "${result.query}"`);
        console.log(`   🛒 Products shown: ${result.analysis.productLinks.length}`);
        console.log(`   📏 Length: ${result.analysis.wordCount} words`);
        console.log(`   📝 Response: "${result.response.substring(0, 150).replace(/\n/g, ' ')}..."`);
      });
    }

    // Performance stats
    if (successfulResults.length > 0) {
      const avgResponseTime = successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length;
      console.log(`\n⚡ Average Response Time: ${Math.round(avgResponseTime)}ms`);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('Test completed at', new Date().toISOString());
  }
}

// Run the tests
async function main() {
  const tester = new ChatTester();
  await tester.runAllTests();
}

main().catch(console.error);