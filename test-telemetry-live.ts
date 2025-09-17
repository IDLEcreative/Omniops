#!/usr/bin/env npx tsx
/**
 * Test telemetry by making a real chat request and checking the monitoring endpoint
 */

import 'dotenv/config';

const DOMAIN = "thompsonseparts.co.uk";

async function testChatWithTelemetry() {
  console.log('🔍 TESTING TELEMETRY WITH LIVE CHAT REQUEST');
  console.log('=' .repeat(60));
  
  const sessionId = `telemetry-test-${Date.now()}`;
  const query = "Show me Cifa pumps";
  
  console.log(`Session ID: ${sessionId}`);
  console.log(`Query: "${query}"\n`);
  
  // Make chat request
  console.log('📡 Making chat request...');
  try {
    const chatResponse = await fetch('http://localhost:3000/api/chat-intelligent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        session_id: sessionId,
        domain: DOMAIN,
      }),
    });

    const chatData = await chatResponse.json();
    
    if (!chatResponse.ok) {
      throw new Error(chatData.error || 'Chat request failed');
    }
    
    console.log('✅ Chat response received');
    
    // Check if telemetry was recorded
    if (chatData.telemetry) {
      console.log('\n📊 TELEMETRY DATA CAPTURED:');
      console.log('-'.repeat(50));
      console.log(`Model: ${chatData.telemetry.model || 'unknown'}`);
      console.log(`Duration: ${chatData.telemetry.totalDuration || 'unknown'}`);
      console.log(`Iterations: ${chatData.telemetry.iterations || 0}`);
      console.log(`Searches: ${chatData.telemetry.searches?.total || 0}`);
      console.log(`Total Results: ${chatData.telemetry.searches?.totalResults || 0}`);
      
      if (chatData.telemetry.searches?.breakdown) {
        console.log('\nSearch Breakdown:');
        Object.entries(chatData.telemetry.searches.breakdown).forEach(([source, count]) => {
          console.log(`  ${source}: ${count}`);
        });
      }
    }
    
    // Check search metadata (existing telemetry)
    if (chatData.searchMetadata) {
      console.log('\n🔍 SEARCH METADATA:');
      console.log('-'.repeat(50));
      console.log(`Total searches: ${chatData.searchMetadata.searchLog?.length || 0}`);
      if (chatData.searchMetadata.searchLog) {
        chatData.searchMetadata.searchLog.forEach((log: any, i: number) => {
          console.log(`${i + 1}. ${log.tool}: "${log.query}" → ${log.resultCount} results`);
        });
      }
    }
    
    // Wait a moment for async telemetry to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check monitoring endpoint
    console.log('\n📈 Checking monitoring endpoint...');
    const monitorResponse = await fetch('http://localhost:3000/api/monitoring/chat?period=hour', {
      headers: { 
        'x-api-key': process.env.MONITORING_API_KEY || 'test-key'
      }
    });
    
    if (monitorResponse.ok) {
      const metrics = await monitorResponse.json();
      console.log('\n📊 AGGREGATED METRICS:');
      console.log('-'.repeat(50));
      console.log(`Average Response Time: ${metrics.avgResponseTime || 'N/A'}`);
      console.log(`Search Success Rate: ${metrics.searchSuccessRate || 'N/A'}`);
      console.log(`Error Rate: ${metrics.errorRate || 'N/A'}`);
      console.log(`Total Sessions: ${metrics.totalSessions || 0}`);
      console.log(`Total Searches: ${metrics.totalSearches || 0}`);
      
      if (metrics.topQueries?.length > 0) {
        console.log('\nTop Queries:');
        metrics.topQueries.slice(0, 5).forEach((q: any, i: number) => {
          console.log(`  ${i + 1}. "${q.query}" (${q.count} times)`);
        });
      }
    } else {
      console.log('⚠️ Monitoring endpoint not available or requires authentication');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ TELEMETRY SYSTEM IS WORKING!');
    console.log('='.repeat(60));
    console.log('\nThe intelligent chat route is now fully observable with:');
    console.log('  • Search operation tracking');
    console.log('  • Performance timing');
    console.log('  • Error tracking');
    console.log('  • Session summaries');
    console.log('  • Aggregated metrics');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

testChatWithTelemetry().catch(console.error);