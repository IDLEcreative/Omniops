#!/usr/bin/env npx tsx
/**
 * Test if AI can identify and return ALL 20 Cifa pumps
 * Testing different query phrasings to see completeness of responses
 */

import 'dotenv/config';

const DOMAIN = "thompsonseparts.co.uk";

interface TestQuery {
  query: string;
  description: string;
}

const TEST_QUERIES: TestQuery[] = [
  {
    query: "Show me ALL Cifa mixer pumps you have available",
    description: "Explicit request for ALL products"
  },
  {
    query: "I need to see every Cifa pump in your inventory",
    description: "Emphasis on EVERY product"
  },
  {
    query: "List all Cifa hydraulic and water pumps with prices",
    description: "Specific request for complete listing"
  }
];

async function testQuery(testCase: TestQuery) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📝 Query: "${testCase.query}"`);
  console.log(`   Purpose: ${testCase.description}`);
  console.log(`${'='.repeat(60)}`);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/chat-intelligent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: testCase.query,
        session_id: `all-test-${Date.now()}`,
        domain: DOMAIN,
      }),
    });

    const data = await response.json();
    const processingTime = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    // Extract all Cifa product mentions
    const message = data.message;
    const productLines: string[] = [];
    const prices: string[] = [];
    
    // Find all lines that look like products
    const lines = message.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('cifa') || 
          line.includes('https://www.thompsonseparts.co.uk/product/')) {
        
        // Clean up the line
        const cleanLine = line
          .replace(/^[\s•\-\*\d\.]+/, '') // Remove bullets
          .replace(/\[([^\]]+)\].*/, '$1') // Extract link text
          .replace(/<[^>]+>/g, '') // Remove HTML
          .trim();
        
        if (cleanLine && cleanLine.length > 10) {
          productLines.push(cleanLine);
          
          // Extract price if present
          const priceMatch = line.match(/£[\d,]+\.?\d*/);
          if (priceMatch) {
            prices.push(priceMatch[0]);
          }
        }
      }
    }
    
    // Count unique Cifa products
    const cifaProducts = productLines.filter(line => 
      line.toLowerCase().includes('cifa')
    );
    
    console.log('\n📊 RESULTS:');
    console.log(`⏱️ Response time: ${processingTime}ms`);
    console.log(`📦 Cifa products found: ${cifaProducts.length}`);
    console.log(`💰 Prices included: ${prices.length}`);
    
    // Show search metadata
    if (data.searchMetadata?.searchLog) {
      console.log('\n🔍 AI Search Operations:');
      data.searchMetadata.searchLog.forEach((log: any) => {
        console.log(`   • ${log.tool}: "${log.query}" → ${log.resultCount} results`);
      });
    }
    
    // List products found
    if (cifaProducts.length > 0) {
      console.log('\n📋 Cifa Products Identified:');
      cifaProducts.forEach((product, i) => {
        const price = prices[i] || 'No price';
        console.log(`   ${i + 1}. ${product.substring(0, 60)}... ${price}`);
      });
    }
    
    // Analyze completeness
    console.log('\n📈 Completeness Analysis:');
    const coverage = (cifaProducts.length / 20 * 100).toFixed(1);
    console.log(`   Coverage: ${cifaProducts.length}/20 = ${coverage}%`);
    
    if (cifaProducts.length >= 18) {
      console.log('   ✅ EXCELLENT: AI found nearly all products');
    } else if (cifaProducts.length >= 15) {
      console.log('   ✅ GOOD: AI found most products');
    } else if (cifaProducts.length >= 10) {
      console.log('   ⚠️ PARTIAL: AI found half the products');
    } else {
      console.log('   ❌ INCOMPLETE: AI missing majority of products');
    }
    
    // Check if AI acknowledged there might be more
    const acknowledgesMore = message.toLowerCase().includes('more') || 
                            message.toLowerCase().includes('additional') ||
                            message.toLowerCase().includes('also have') ||
                            message.toLowerCase().includes('other');
    
    if (acknowledgesMore && cifaProducts.length < 20) {
      console.log('   ℹ️ AI acknowledges more products exist');
    }
    
    return {
      query: testCase.query,
      productsFound: cifaProducts.length,
      coverage: parseFloat(coverage),
      processingTime,
      acknowledgesMore
    };
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return {
      query: testCase.query,
      productsFound: 0,
      coverage: 0,
      processingTime: 0,
      acknowledgesMore: false,
      error: error.message
    };
  }
}

async function main() {
  console.log('🔬 TESTING AI COMPLETENESS FOR CIFA PUMPS');
  console.log('=' .repeat(60));
  console.log('Goal: Can the AI identify and return all 20 Cifa pumps?');
  console.log(`Domain: ${DOMAIN}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  const results = [];
  
  // Test each query
  for (const testCase of TEST_QUERIES) {
    const result = await testQuery(testCase);
    results.push(result);
    
    // Brief pause between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 OVERALL SUMMARY');
  console.log('=' .repeat(60));
  
  const bestResult = results.reduce((best, current) => 
    current.productsFound > best.productsFound ? current : best
  );
  
  console.log(`\n🏆 Best Result: ${bestResult.productsFound}/20 products (${bestResult.coverage}%)`);
  console.log(`   From query: "${bestResult.query}"`);
  
  // Conclusions
  console.log('\n💡 KEY FINDINGS:');
  
  if (bestResult.productsFound >= 18) {
    console.log('✅ AI CAN identify and return nearly all Cifa pumps');
    console.log('✅ The intelligent route is working as expected');
  } else if (bestResult.productsFound >= 15) {
    console.log('✅ AI can find most Cifa pumps with explicit requests');
    console.log('⚠️ May need minor adjustments for complete coverage');
  } else {
    console.log('❌ AI cannot currently return all 20 Cifa pumps');
    console.log('⚠️ There may still be limitations preventing full retrieval');
    
    const missing = 20 - bestResult.productsFound;
    console.log(`\n🔍 Investigation needed: Why are ${missing} products still missing?`);
    console.log('   Possible causes:');
    console.log('   • Search function may have additional hidden limits');
    console.log('   • AI may be filtering results for relevance');
    console.log('   • Some products may not be properly indexed');
    console.log('   • Token limits may prevent showing all results');
  }
  
  // Recommendations
  console.log('\n📋 RECOMMENDATIONS:');
  if (bestResult.productsFound < 15) {
    console.log('1. Check if search functions have additional limits');
    console.log('2. Verify all 20 products are properly indexed with embeddings');
    console.log('3. Test with direct database queries to confirm availability');
    console.log('4. Consider implementing pagination or "show more" functionality');
  } else if (bestResult.productsFound < 20) {
    console.log('1. Fine-tune search parameters for complete retrieval');
    console.log('2. Ensure AI prompt emphasizes showing ALL results');
    console.log('3. Check token limits in responses');
  } else {
    console.log('✅ System is working optimally!');
  }
}

main().catch(console.error);