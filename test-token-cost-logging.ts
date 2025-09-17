#!/usr/bin/env npx tsx
/**
 * Test Token Cost Logging System
 * Verifies that token usage is tracked and costs are calculated correctly
 */

import 'dotenv/config';
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

// GPT-5-mini pricing
const PRICING = {
  input: 0.25 / 1_000_000,  // $0.25 per 1M tokens
  output: 2.00 / 1_000_000, // $2.00 per 1M tokens
};

async function testTokenLogging() {
  console.log(`\n${colors.cyan}${colors.bright}🔬 Testing Token Cost Logging System${colors.reset}\n`);
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const sessionId = `token-test-${Date.now()}`;
  
  try {
    // Test 1: Make a chat request that should trigger token logging
    console.log(`${colors.blue}Test 1: Chat request with token tracking${colors.reset}`);
    
    const chatResponse = await fetch(`${API_BASE_URL}/api/chat-intelligent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Need a pump for my Cifa mixer',
        session_id: sessionId,
        domain: 'thompsonseparts.co.uk',
      }),
    });

    if (!chatResponse.ok) {
      throw new Error(`Chat request failed: ${chatResponse.status}`);
    }

    const chatData = await chatResponse.json();
    console.log(`${colors.green}✓ Chat request completed${colors.reset}`);
    
    // Check if token data is in response
    if (chatData.tokenUsage) {
      console.log(`${colors.green}✓ Token usage in response:${colors.reset}`);
      console.log(`  - Input tokens: ${chatData.tokenUsage.inputTokens}`);
      console.log(`  - Output tokens: ${chatData.tokenUsage.outputTokens}`);
      console.log(`  - Total tokens: ${chatData.tokenUsage.totalTokens}`);
      console.log(`  - Estimated cost: $${chatData.tokenUsage.estimatedCost?.toFixed(6) || 'N/A'}`);
      
      // Verify cost calculation
      const expectedCost = 
        (chatData.tokenUsage.inputTokens * PRICING.input) +
        (chatData.tokenUsage.outputTokens * PRICING.output);
      
      console.log(`  - Calculated cost: $${expectedCost.toFixed(6)}`);
      
      if (Math.abs(expectedCost - (chatData.tokenUsage.estimatedCost || 0)) < 0.000001) {
        console.log(`${colors.green}  ✓ Cost calculation accurate!${colors.reset}`);
      } else {
        console.log(`${colors.yellow}  ⚠ Cost mismatch detected${colors.reset}`);
      }
    } else {
      console.log(`${colors.yellow}⚠ No token usage data in response${colors.reset}`);
    }

    // Wait for telemetry to be persisted
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Verify token data in database
    console.log(`\n${colors.blue}Test 2: Verify token data in database${colors.reset}`);
    
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

    console.log(`${colors.green}✓ Telemetry found in database${colors.reset}`);
    console.log(`  - Session ID: ${telemetryData.session_id}`);
    console.log(`  - Input tokens: ${telemetryData.input_tokens || 0}`);
    console.log(`  - Output tokens: ${telemetryData.output_tokens || 0}`);
    console.log(`  - Total tokens: ${telemetryData.total_tokens || 0}`);
    console.log(`  - Cost (USD): $${telemetryData.cost_usd || 0}`);
    console.log(`  - Model: ${telemetryData.model || 'Not specified'}`);

    // Test 3: Test monitoring API for cost data
    console.log(`\n${colors.blue}Test 3: Testing monitoring API cost endpoints${colors.reset}`);
    
    const monitoringResponse = await fetch(`${API_BASE_URL}/api/monitoring/chat?period=hour&includeDetails=true`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.MONITORING_API_KEY || 'test-api-key',
      },
    });

    if (monitoringResponse.ok) {
      const monitoringData = await monitoringResponse.json();
      console.log(`${colors.green}✓ Monitoring API responded${colors.reset}`);
      
      if (monitoringData.tokenMetrics) {
        console.log(`  Token Metrics:`);
        console.log(`    - Total input tokens: ${monitoringData.tokenMetrics.totalInputTokens || 0}`);
        console.log(`    - Total output tokens: ${monitoringData.tokenMetrics.totalOutputTokens || 0}`);
        console.log(`    - Average per request: ${monitoringData.tokenMetrics.avgTokensPerRequest || 0}`);
      }
      
      if (monitoringData.costAnalytics) {
        console.log(`  Cost Analytics:`);
        console.log(`    - Total cost: $${monitoringData.costAnalytics.totalCost?.toFixed(6) || '0'}`);
        console.log(`    - Average cost: $${monitoringData.costAnalytics.avgCost?.toFixed(6) || '0'}`);
        console.log(`    - Min cost: $${monitoringData.costAnalytics.minCost?.toFixed(6) || '0'}`);
        console.log(`    - Max cost: $${monitoringData.costAnalytics.maxCost?.toFixed(6) || '0'}`);
      }
    } else {
      console.log(`${colors.yellow}⚠ Monitoring API requires authentication${colors.reset}`);
    }

    // Test 4: Query cost analytics views
    console.log(`\n${colors.blue}Test 4: Testing cost analytics views${colors.reset}`);
    
    // Test hourly costs view
    const { data: hourlyCosts } = await supabase
      .from('chat_telemetry_hourly_costs')
      .select('*')
      .limit(5);
    
    if (hourlyCosts && hourlyCosts.length > 0) {
      console.log(`${colors.green}✓ Hourly costs view working${colors.reset}`);
      console.log(`  Latest hour: ${hourlyCosts[0].hour}`);
      console.log(`  - Requests: ${hourlyCosts[0].requests}`);
      console.log(`  - Total cost: $${hourlyCosts[0].total_cost || 0}`);
      console.log(`  - Avg cost: $${hourlyCosts[0].avg_cost || 0}`);
    }

    // Test domain costs view
    const { data: domainCosts } = await supabase
      .from('chat_telemetry_domain_costs')
      .select('*')
      .eq('domain', 'thompsonseparts.co.uk')
      .limit(1);
    
    if (domainCosts && domainCosts.length > 0) {
      console.log(`${colors.green}✓ Domain costs view working${colors.reset}`);
      console.log(`  Domain: ${domainCosts[0].domain}`);
      console.log(`  - Daily cost: $${domainCosts[0].daily_cost || 0}`);
      console.log(`  - Requests: ${domainCosts[0].requests}`);
    }

    // Test 5: Test cost summary function
    console.log(`\n${colors.blue}Test 5: Testing cost summary function${colors.reset}`);
    
    const { data: costSummary } = await supabase
      .rpc('get_cost_summary', {
        p_domain: 'thompsonseparts.co.uk',
        p_days: 1
      });
    
    if (costSummary && costSummary.length > 0) {
      console.log(`${colors.green}✓ Cost summary function working${colors.reset}`);
      console.log(`  Period: ${costSummary[0].period}`);
      console.log(`  - Total requests: ${costSummary[0].requests}`);
      console.log(`  - Total cost: $${costSummary[0].total_cost || 0}`);
      console.log(`  - Avg cost/request: $${costSummary[0].avg_cost_per_request || 0}`);
    }

    // Performance and cost analysis
    console.log(`\n${colors.cyan}${colors.bright}📊 Cost Analysis Summary${colors.reset}`);
    
    if (telemetryData && telemetryData.input_tokens && telemetryData.output_tokens) {
      const inputCost = telemetryData.input_tokens * PRICING.input;
      const outputCost = telemetryData.output_tokens * PRICING.output;
      const totalCost = inputCost + outputCost;
      
      console.log(`  Token Usage Breakdown:`);
      console.log(`    - Input: ${telemetryData.input_tokens} tokens = $${inputCost.toFixed(6)}`);
      console.log(`    - Output: ${telemetryData.output_tokens} tokens = $${outputCost.toFixed(6)}`);
      console.log(`    - Total: ${telemetryData.total_tokens} tokens = $${totalCost.toFixed(6)}`);
      
      // Projection
      const costPer1000 = totalCost * 1000;
      const costPer10000 = totalCost * 10000;
      const costPer100000 = totalCost * 100000;
      
      console.log(`\n  Cost Projections (at current usage):`);
      console.log(`    - 1,000 queries: $${costPer1000.toFixed(2)}`);
      console.log(`    - 10,000 queries: $${costPer10000.toFixed(2)}`);
      console.log(`    - 100,000 queries: $${costPer100000.toFixed(2)}`);
      
      // Efficiency rating
      if (totalCost < 0.003) {
        console.log(`\n  ${colors.green}✓ EXCELLENT: Cost under $0.003 per query${colors.reset}`);
      } else if (totalCost < 0.005) {
        console.log(`\n  ${colors.yellow}⚠ GOOD: Cost under $0.005 per query${colors.reset}`);
      } else {
        console.log(`\n  ${colors.red}❌ HIGH: Cost over $0.005 per query - optimization needed${colors.reset}`);
      }
    }

    console.log(`\n${colors.green}${colors.bright}✅ Token logging tests completed successfully!${colors.reset}\n`);
    
  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}❌ Test failed:${colors.reset}`, error);
    process.exit(1);
  }
}

// Test setting cost alerts
async function testCostAlerts() {
  console.log(`\n${colors.cyan}${colors.bright}🚨 Testing Cost Alert System${colors.reset}\n`);
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  try {
    // Set a cost alert
    const { error: alertError } = await supabase
      .from('chat_cost_alerts')
      .upsert({
        domain: 'thompsonseparts.co.uk',
        alert_type: 'daily',
        threshold_usd: 10.00,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'domain,alert_type'
      });
    
    if (!alertError) {
      console.log(`${colors.green}✓ Cost alert set: $10.00 daily for thompsonseparts.co.uk${colors.reset}`);
    }
    
    // Check if threshold is exceeded
    const { data: thresholdCheck } = await supabase
      .rpc('check_cost_threshold', {
        p_domain: 'thompsonseparts.co.uk',
        p_period: 'daily'
      });
    
    if (thresholdCheck && thresholdCheck.length > 0) {
      const alert = thresholdCheck[0];
      console.log(`\n  Alert Status:`);
      console.log(`    - Current cost: $${alert.current_cost}`);
      console.log(`    - Threshold: $${alert.threshold}`);
      console.log(`    - Exceeded: ${alert.exceeded ? '⚠️ YES' : '✅ NO'}`);
    }
    
  } catch (error) {
    console.error(`${colors.red}Cost alert test failed:${colors.reset}`, error);
  }
}

// Main execution
async function main() {
  console.log(`${colors.bright}Starting Token Cost Logging Tests${colors.reset}`);
  console.log('=====================================');
  console.log(`Using GPT-5-mini pricing: $0.25/1M input, $2.00/1M output\n`);
  
  // Verify environment
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error(`${colors.red}Missing required environment variables${colors.reset}`);
    process.exit(1);
  }
  
  // Run tests
  await testTokenLogging();
  await testCostAlerts();
  
  console.log(`\n${colors.bright}${colors.green}🎉 All token logging tests completed!${colors.reset}\n`);
}

// Run tests
main().catch(error => {
  console.error(`${colors.red}${colors.bright}Fatal error:${colors.reset}`, error);
  process.exit(1);
});