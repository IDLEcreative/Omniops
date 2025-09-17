#!/usr/bin/env npx tsx
/**
 * Direct test of the chat route with Cifa query to see AI reasoning
 */

import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });

const TEST_QUERY = 'Need a pump for my Cifa mixer';
const API_URL = 'http://localhost:3000/api/chat';

async function testChatRoute() {
  console.log('🔬 TESTING CHAT ROUTE WITH CIFA QUERY');
  console.log('═'.repeat(60));
  console.log(`Query: "${TEST_QUERY}"`);
  console.log(`Endpoint: ${API_URL}`);
  console.log('═'.repeat(60));
  
  try {
    console.log('\n📡 Sending request to chat API...');
    const startTime = Date.now();
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: TEST_QUERY,
        session_id: uuidv4(),
        domain: 'thompsonseparts.co.uk',
        config: {
          features: {
            websiteScraping: { enabled: true },
            woocommerce: { enabled: true }
          },
          ai: {
            trustAIPresentation: true,
            postProcessing: {
              enabled: false
            }
          }
        }
      }),
    });

    const elapsed = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    console.log(`\n✅ Response received in ${elapsed}ms\n`);
    
    console.log('📊 RESPONSE ANALYSIS');
    console.log('━'.repeat(50));
    
    // Analyze the response
    const responseLower = data.message.toLowerCase();
    
    console.log('\n📝 Response Content:');
    console.log('─'.repeat(50));
    console.log(data.message);
    console.log('─'.repeat(50));
    
    console.log('\n🔍 Response Characteristics:');
    console.log(`• Response length: ${data.message.length} characters`);
    console.log(`• Conversation ID: ${data.conversation_id}`);
    console.log(`• Sources provided: ${data.sources?.length || 0}`);
    
    console.log('\n🧠 AI Reasoning Indicators:');
    console.log(`• Mentions "Cifa": ${responseLower.includes('cifa') ? '✅' : '❌'}`);
    console.log(`• Mentions "pump": ${responseLower.includes('pump') ? '✅' : '❌'}`);
    console.log(`• Mentions "mixer": ${responseLower.includes('mixer') ? '✅' : '❌'}`);
    console.log(`• Admits uncertainty: ${responseLower.includes("don't have") || responseLower.includes("unable to find") ? '✅' : '❌'}`);
    console.log(`• Suggests alternatives: ${responseLower.includes('alternative') || responseLower.includes('instead') ? '✅' : '❌'}`);
    console.log(`• Includes product links: ${data.message.includes('http') || data.message.includes('](') ? '✅' : '❌'}`);
    console.log(`• Includes prices: ${data.message.includes('£') ? '✅' : '❌'}`);
    console.log(`• Recommends contact: ${responseLower.includes('contact') || responseLower.includes('customer service') ? '✅' : '❌'}`);
    
    if (data.sources && data.sources.length > 0) {
      console.log('\n📚 Sources Used:');
      data.sources.slice(0, 5).forEach((source: any, i: number) => {
        console.log(`  ${i + 1}. ${source.title}`);
        console.log(`     URL: ${source.url}`);
        console.log(`     Relevance: ${(source.relevance * 100).toFixed(1)}%`);
      });
      
      // Analyze source quality
      const cifaSources = data.sources.filter((s: any) => 
        s.title?.toLowerCase().includes('cifa') || 
        s.url?.toLowerCase().includes('cifa')
      );
      
      const pumpSources = data.sources.filter((s: any) => 
        s.title?.toLowerCase().includes('pump') || 
        s.url?.toLowerCase().includes('pump')
      );
      
      console.log('\n📈 Source Quality Analysis:');
      console.log(`• Total sources: ${data.sources.length}`);
      console.log(`• Cifa-related sources: ${cifaSources.length}`);
      console.log(`• Pump-related sources: ${pumpSources.length}`);
      console.log(`• Average relevance: ${(data.sources.reduce((sum: number, s: any) => sum + s.relevance, 0) / data.sources.length * 100).toFixed(1)}%`);
    }
    
    // Determine AI strategy
    let strategy = 'unknown';
    if (responseLower.includes('cifa') && !responseLower.includes("don't have")) {
      strategy = 'found_direct_match';
    } else if (responseLower.includes("don't have") && responseLower.includes('alternative')) {
      strategy = 'no_match_with_alternatives';
    } else if (responseLower.includes("don't have") && responseLower.includes('contact')) {
      strategy = 'no_match_contact_recommended';
    } else if (responseLower.includes('alternative')) {
      strategy = 'alternatives_provided';
    }
    
    console.log('\n🎯 AI Strategy Detection:');
    console.log(`• Detected strategy: ${strategy}`);
    
    // Quality score
    let qualityScore = 0;
    if (data.message.length > 100) qualityScore += 2;
    if (responseLower.includes('cifa')) qualityScore += 2;
    if (responseLower.includes('pump')) qualityScore += 2;
    if (data.message.includes('http') || data.message.includes('](')) qualityScore += 2;
    if (data.sources && data.sources.length > 0) qualityScore += 1;
    if (data.sources && data.sources.length >= 5) qualityScore += 1;
    
    console.log('\n⭐ Quality Assessment:');
    console.log(`• Quality score: ${qualityScore}/10`);
    
    if (qualityScore >= 8) {
      console.log('• Verdict: 🏆 EXCELLENT - AI provided comprehensive, relevant response');
    } else if (qualityScore >= 6) {
      console.log('• Verdict: ✅ GOOD - AI provided helpful response');
    } else if (qualityScore >= 4) {
      console.log('• Verdict: ⚠️  FAIR - Response could be improved');
    } else {
      console.log('• Verdict: ❌ POOR - Response lacks relevance or detail');
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ TEST COMPLETE');
    console.log('═'.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
console.log('🚀 Starting Chat Route Test...\n');
console.log('⚠️  Make sure the development server is running on localhost:3000\n');

testChatRoute()
  .then(() => {
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });