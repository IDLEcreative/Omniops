/**
 * Test file for Chat Telemetry System
 * Verifies that telemetry is properly tracking chat sessions, searches, and performance
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const API_BASE_URL = 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function testChatWithTelemetry() {
  console.log(`\n${colors.cyan}${colors.bright}🔬 Testing Chat Telemetry System${colors.reset}\n`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const sessionId = `test-session-${Date.now()}`;
  
  try {
    // Test 1: Make a chat request that triggers searches
    console.log(`${colors.blue}Test 1: Chat request with product search${colors.reset}`);
    
    const chatResponse = await fetch(`${API_BASE_URL}/api/chat/route-intelligent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Show me Cifa hydraulic pumps',
        session_id: sessionId,
        domain: 'thompsonseparts.co.uk',
        config: {
          ai: {
            maxSearchIterations: 2,
            searchTimeout: 15000
          }
        }
      }),
    });

    if (!chatResponse.ok) {
      throw new Error(`Chat request failed: ${chatResponse.status}`);
    }

    const chatData = await chatResponse.json();
    console.log(`${colors.green}✓ Chat request completed${colors.reset}`);
    console.log(`  - Iterations: ${chatData.searchMetadata?.iterations || 0}`);
    console.log(`  - Searches: ${chatData.searchMetadata?.totalSearches || 0}`);
    console.log(`  - Response length: ${chatData.message.length} chars`);

    // Wait for telemetry to be persisted
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Verify telemetry was recorded
    console.log(`\n${colors.blue}Test 2: Verify telemetry in database${colors.reset}`);
    
    const { data: telemetryData, error: telemetryError } = await supabase
      .from('chat_telemetry')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (telemetryError) {
      throw new Error(`Failed to fetch telemetry: ${telemetryError.message}`);
    }

    if (!telemetryData) {
      throw new Error('No telemetry data found for session');
    }

    console.log(`${colors.green}✓ Telemetry recorded successfully${colors.reset}`);
    console.log(`  - Session ID: ${telemetryData.session_id}`);
    console.log(`  - Duration: ${telemetryData.duration_ms}ms`);
    console.log(`  - Iterations: ${telemetryData.iterations}`);
    console.log(`  - Search count: ${telemetryData.search_count}`);
    console.log(`  - Total results: ${telemetryData.total_results}`);
    console.log(`  - Success: ${telemetryData.success}`);

    // Test 3: Verify search details
    console.log(`\n${colors.blue}Test 3: Analyze search operations${colors.reset}`);
    
    if (telemetryData.searches && Array.isArray(telemetryData.searches)) {
      console.log(`${colors.green}✓ Found ${telemetryData.searches.length} search operations${colors.reset}`);
      
      telemetryData.searches.forEach((search: any, index: number) => {
        console.log(`\n  Search ${index + 1}:`);
        console.log(`    - Tool: ${search.tool}`);
        console.log(`    - Query: "${search.query}"`);
        console.log(`    - Results: ${search.resultCount}`);
        console.log(`    - Source: ${search.source}`);
        console.log(`    - Duration: ${search.duration}ms`);
      });
    } else {
      console.log(`${colors.yellow}⚠ No search details found${colors.reset}`);
    }

    // Test 4: Test monitoring API
    console.log(`\n${colors.blue}Test 4: Testing monitoring API${colors.reset}`);
    
    // Set monitoring API key in env if not present
    const monitoringApiKey = process.env.MONITORING_API_KEY || 'test-api-key';
    
    const monitoringResponse = await fetch(`${API_BASE_URL}/api/monitoring/chat?period=hour&includeDetails=true`, {
      method: 'GET',
      headers: {
        'x-api-key': monitoringApiKey,
      },
    });

    if (monitoringResponse.status === 401) {
      console.log(`${colors.yellow}⚠ Monitoring API requires authentication (expected)${colors.reset}`);
    } else if (monitoringResponse.ok) {
      const monitoringData = await monitoringResponse.json();
      console.log(`${colors.green}✓ Monitoring API accessible${colors.reset}`);
      console.log(`  - Total sessions: ${monitoringData.summary?.totalSessions || 0}`);
      console.log(`  - Success rate: ${monitoringData.summary?.successRate || 'N/A'}`);
      console.log(`  - Avg duration: ${monitoringData.summary?.avgDuration || 0}ms`);
      console.log(`  - Active sessions: ${monitoringData.activeSessions?.count || 0}`);
    }

    // Test 5: Error handling with telemetry
    console.log(`\n${colors.blue}Test 5: Testing error tracking${colors.reset}`);
    
    const errorSessionId = `error-test-${Date.now()}`;
    const errorResponse = await fetch(`${API_BASE_URL}/api/chat/route-intelligent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '', // Empty message to trigger validation error
        session_id: errorSessionId,
      }),
    });

    if (!errorResponse.ok) {
      console.log(`${colors.green}✓ Error response received as expected (${errorResponse.status})${colors.reset}`);
      
      // Check if error was tracked
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: errorTelemetry } = await supabase
        .from('chat_telemetry')
        .select('success, error')
        .eq('session_id', errorSessionId)
        .single();
      
      if (errorTelemetry && !errorTelemetry.success) {
        console.log(`${colors.green}✓ Error tracked in telemetry${colors.reset}`);
      }
    }

    // Performance metrics summary
    console.log(`\n${colors.cyan}${colors.bright}📊 Performance Summary${colors.reset}`);
    
    if (telemetryData) {
      const avgSearchTime = telemetryData.searches && telemetryData.searches.length > 0
        ? telemetryData.searches.reduce((sum: number, s: any) => sum + s.duration, 0) / telemetryData.searches.length
        : 0;
      
      console.log(`  - Total request time: ${telemetryData.duration_ms}ms`);
      console.log(`  - Average search time: ${Math.round(avgSearchTime)}ms`);
      console.log(`  - Overhead (non-search): ${telemetryData.duration_ms - (telemetryData.searches?.reduce((sum: number, s: any) => sum + s.duration, 0) || 0)}ms`);
      
      // Check performance target
      if (telemetryData.duration_ms < 5000) {
        console.log(`${colors.green}  ✓ Performance target met (<5s)${colors.reset}`);
      } else {
        console.log(`${colors.yellow}  ⚠ Performance target missed (>5s)${colors.reset}`);
      }
    }

    console.log(`\n${colors.green}${colors.bright}✅ All telemetry tests completed successfully!${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}❌ Test failed:${colors.reset}`, error);
    process.exit(1);
  }
}

// Test aggregated metrics query
async function testAggregatedMetrics() {
  console.log(`\n${colors.cyan}${colors.bright}📈 Testing Aggregated Metrics View${colors.reset}\n`);
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  try {
    const { data: metrics, error } = await supabase
      .from('chat_telemetry_metrics')
      .select('*')
      .limit(5);
    
    if (error) {
      throw new Error(`Failed to fetch metrics: ${error.message}`);
    }
    
    if (metrics && metrics.length > 0) {
      console.log(`${colors.green}✓ Found ${metrics.length} hourly metric records${colors.reset}\n`);
      
      metrics.forEach((metric: any) => {
        console.log(`Hour: ${new Date(metric.hour).toLocaleString()}`);
        console.log(`  - Sessions: ${metric.total_sessions}`);
        console.log(`  - Success rate: ${metric.success_rate}%`);
        console.log(`  - Avg duration: ${metric.avg_duration_ms}ms`);
        console.log(`  - P95 duration: ${metric.p95_duration_ms}ms`);
        console.log('---');
      });
    } else {
      console.log(`${colors.yellow}No aggregated metrics available yet${colors.reset}`);
    }
    
  } catch (error) {
    console.error(`${colors.red}Failed to test aggregated metrics:${colors.reset}`, error);
  }
}

// Main execution
async function main() {
  console.log(`${colors.bright}Starting Chat Telemetry System Test${colors.reset}`);
  console.log('=====================================');
  
  // Verify environment
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error(`${colors.red}Missing required environment variables${colors.reset}`);
    console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
    process.exit(1);
  }
  
  // Run tests
  await testChatWithTelemetry();
  await testAggregatedMetrics();
  
  console.log(`\n${colors.bright}${colors.green}🎉 All tests completed!${colors.reset}\n`);
}

// Run tests
main().catch(error => {
  console.error(`${colors.red}${colors.bright}Fatal error:${colors.reset}`, error);
  process.exit(1);
});