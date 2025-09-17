#!/usr/bin/env npx tsx
/**
 * Test if the intelligent route now gathers complete context using parallel searches
 * and responds with awareness of all 30 Cifa products
 */

import 'dotenv/config';

const DOMAIN = "thompsonseparts.co.uk";

async function testCompleteContextGathering() {
  console.log('🚀 TESTING COMPLETE CONTEXT GATHERING WITH PARALLEL SEARCH');
  console.log('=' .repeat(60));
  
  const query = "Need a pump for my Cifa mixer";
  console.log(`Query: "${query}"`);
  console.log(`Expected: AI should search in parallel and be aware of all 30 Cifa products\n`);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/chat-intelligent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        session_id: `parallel-test-${Date.now()}`,
        domain: DOMAIN,
      }),
    });

    const data = await response.json();
    const processingTime = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    // Analyze search metadata
    console.log('🔍 SEARCH ACTIVITY ANALYSIS');
    console.log('-'.repeat(50));
    
    if (data.searchMetadata?.searchLog) {
      console.log(`Total searches performed: ${data.searchMetadata.searchLog.length}`);
      console.log(`Search iterations: ${data.searchMetadata.iterations || 1}`);
      console.log('\nSearch operations executed:');
      
      const searchStartTimes: number[] = [];
      data.searchMetadata.searchLog.forEach((log: any, index: number) => {
        console.log(`  ${index + 1}. ${log.tool}: "${log.query}"`);
        console.log(`     → ${log.resultCount} results from ${log.source}`);
      });
      
      // Check if searches happened in parallel
      const parallelSearches = data.searchMetadata.searchLog.filter((log: any) => 
        log.tool === 'search_products' || log.tool === 'search_by_category'
      );
      
      if (parallelSearches.length > 1) {
        console.log('\n✅ Multiple searches detected - likely executed in parallel');
      } else {
        console.log('\n⚠️ Only one search detected - may not be using parallel execution');
      }
    }
    
    // Analyze response content
    console.log('\n📊 RESPONSE ANALYSIS');
    console.log('-'.repeat(50));
    
    const message = data.message.toLowerCase();
    
    // Check if AI acknowledges total product count
    const mentionsTotal = message.includes('30') || 
                         message.includes('over') || 
                         message.includes('multiple') ||
                         message.includes('variety') ||
                         message.includes('range');
    
    // Count Cifa products mentioned
    const cifaLines = data.message.split('\n').filter((line: string) => 
      line.toLowerCase().includes('cifa')
    );
    
    // Extract prices
    const prices = (message.match(/£[\d,]+\.?\d*/gi) || []);
    
    console.log(`Response time: ${processingTime}ms`);
    console.log(`Cifa products shown: ${cifaLines.length}`);
    console.log(`Prices included: ${prices.length}`);
    console.log(`Mentions total inventory: ${mentionsTotal ? '✅ Yes' : '❌ No'}`);
    
    // Check for intelligent categorization
    const hasCategorization = message.includes('hydraulic') && message.includes('water');
    console.log(`Shows product categories: ${hasCategorization ? '✅ Yes' : '❌ No'}`);
    
    // Look for context awareness phrases
    const contextPhrases = [
      'we have',
      'our inventory',
      'available products',
      'from our',
      'in stock',
      'catalogue',
      'range of'
    ];
    
    const showsContextAwareness = contextPhrases.some(phrase => message.includes(phrase));
    console.log(`Shows inventory awareness: ${showsContextAwareness ? '✅ Yes' : '❌ No'}`);
    
    // Show response excerpt
    console.log('\n📝 RESPONSE EXCERPT');
    console.log('-'.repeat(50));
    const firstParagraph = data.message.split('\n\n')[0];
    console.log(firstParagraph.substring(0, 300) + '...');
    
    // Calculate completeness score
    console.log('\n📈 COMPLETENESS SCORE');
    console.log('-'.repeat(50));
    
    let score = 0;
    let maxScore = 6;
    
    if (cifaLines.length >= 5) score++; // Shows multiple products
    if (cifaLines.length >= 10) score++; // Shows many products
    if (prices.length >= 5) score++; // Includes prices
    if (mentionsTotal) score++; // Acknowledges total inventory
    if (hasCategorization) score++; // Shows understanding of categories
    if (showsContextAwareness) score++; // Demonstrates inventory awareness
    
    const percentage = (score / maxScore * 100).toFixed(0);
    console.log(`Score: ${score}/${maxScore} (${percentage}%)`);
    
    if (score >= 5) {
      console.log('✅ EXCELLENT: AI gathers complete context and responds intelligently');
    } else if (score >= 3) {
      console.log('⚠️ GOOD: AI shows some context awareness but could improve');
    } else {
      console.log('❌ NEEDS IMPROVEMENT: AI not gathering complete context');
    }
    
    // Final verdict
    console.log('\n' + '='.repeat(60));
    console.log('🎯 FINAL VERDICT');
    console.log('='.repeat(60));
    
    if (data.searchMetadata?.searchLog.length >= 3 && cifaLines.length >= 10 && mentionsTotal) {
      console.log('✅ SUCCESS: AI is gathering complete context using parallel searches!');
      console.log('   • Multiple searches executed');
      console.log('   • Shows awareness of total inventory');
      console.log('   • Presents comprehensive product options');
    } else {
      console.log('⚠️ PARTIAL SUCCESS: AI improved but not fully utilizing parallel search');
      console.log('\nAreas needing attention:');
      if (data.searchMetadata?.searchLog.length < 3) {
        console.log('   • Should execute more parallel searches');
      }
      if (cifaLines.length < 10) {
        console.log('   • Should show more products (found only ' + cifaLines.length + ')');
      }
      if (!mentionsTotal) {
        console.log('   • Should mention total inventory count');
      }
    }
    
    return {
      success: true,
      searches: data.searchMetadata?.searchLog.length || 0,
      products: cifaLines.length,
      contextAware: mentionsTotal && showsContextAwareness,
      score: percentage
    };
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function main() {
  const result = await testCompleteContextGathering();
  
  if (result.success && result.contextAware) {
    console.log('\n🎉 The intelligent route successfully gathers complete context!');
  } else {
    console.log('\n📋 Further improvements may be needed for complete context gathering.');
  }
}

main().catch(console.error);