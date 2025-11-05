/**
 * Token Anomaly Detection & Alert System
 *
 * Monitors token usage for anomalies and generates alerts when:
 * - System prompt tokens exceed expected range
 * - Tool execution failure rate is too high
 * - Average token usage deviates from baseline
 * - Daily costs exceed threshold
 *
 * Usage: npx tsx scripts/monitoring/check-token-anomalies.ts
 * Options:
 *   --threshold=<number>   Cost threshold in USD (default: 10)
 *   --verbose              Show detailed analysis
 *   --email                Send email alerts (TODO)
 */

import { createServiceRoleClient } from '../../lib/supabase-server';
import * as fs from 'fs';
import * as path from 'path';

// Alert thresholds
const ALERT_THRESHOLDS = {
  systemPromptTokensMin: 180,
  systemPromptTokensMax: 220,
  toolFailureRatePercent: 5,
  avgTokensPerRequestMax: 600, // Should be ~400 for MCP
  dailyCostThreshold: 10,
};

interface Alert {
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  category: string;
  message: string;
  value: string;
  expected: string;
  timestamp: string;
}

interface AnomalyReport {
  timestamp: string;
  periodHours: number;
  alerts: Alert[];
  healthScore: number; // 0-100
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

async function checkTokenAnomalies(): Promise<void> {
  const supabase = createServiceRoleClient();

  if (!supabase) {
    throw new Error('Failed to initialize Supabase client');
  }

  const verbose = process.argv.includes('--verbose');
  const costThreshold = parseFloat(
    process.argv.find(arg => arg.startsWith('--threshold='))?.split('=')[1] || '10'
  );

  const alerts: Alert[] = [];

  try {
    // Check 1: System Prompt Token Validation
    await checkSystemPromptTokens(supabase, alerts);

    // Check 2: Tool Failure Rate
    await checkToolFailureRate(supabase, alerts);

    // Check 3: Average Token Usage
    await checkAverageTokenUsage(supabase, alerts);

    // Check 4: Daily Cost Anomalies
    await checkDailyCostAnomalies(supabase, alerts, costThreshold);

    // Check 5: Error Rate
    await checkErrorRate(supabase, alerts);

    // Generate report
    const report = generateReport(alerts);

    // Display results
    displayReport(report, verbose);

    // Save to file
    saveAlertsToFile(report);

    // Exit with appropriate code
    process.exit(report.status === 'HEALTHY' ? 0 : 1);
  } catch (error) {
    console.error('Error checking token anomalies:', error);
    throw error;
  }
}

async function checkSystemPromptTokens(
  supabase: any,
  alerts: Alert[]
): Promise<void> {
  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, metadata, created_at')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .not('metadata->>system_prompt_size', 'is', null)
    .limit(100);

  if (error) {
    console.warn('Could not fetch system prompt data:', error.message);
    return;
  }

  if (!messages || messages.length === 0) {
    alerts.push({
      severity: 'INFO',
      category: 'System Prompt',
      message: 'No messages with system prompt metadata found in last 24 hours',
      value: '0',
      expected: '100+',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const systemPromptSizes = messages
    .map(m => {
      const size = m.metadata?.system_prompt_size;
      return typeof size === 'string' ? parseInt(size, 10) : size;
    })
    .filter(Boolean);

  if (systemPromptSizes.length === 0) return;

  const avgSize = systemPromptSizes.reduce((a, b) => a + b, 0) / systemPromptSizes.length;
  const minSize = Math.min(...systemPromptSizes);
  const maxSize = Math.max(...systemPromptSizes);

  // Check if within expected range (180-220 tokens for MCP)
  if (avgSize < ALERT_THRESHOLDS.systemPromptTokensMin) {
    alerts.push({
      severity: 'WARNING',
      category: 'System Prompt',
      message: 'System prompt tokens below expected minimum',
      value: avgSize.toFixed(0),
      expected: `${ALERT_THRESHOLDS.systemPromptTokensMin}-${ALERT_THRESHOLDS.systemPromptTokensMax}`,
      timestamp: new Date().toISOString(),
    });
  } else if (avgSize > ALERT_THRESHOLDS.systemPromptTokensMax) {
    alerts.push({
      severity: 'CRITICAL',
      category: 'System Prompt',
      message: 'System prompt tokens exceeding MCP baseline!',
      value: avgSize.toFixed(0),
      expected: `${ALERT_THRESHOLDS.systemPromptTokensMin}-${ALERT_THRESHOLDS.systemPromptTokensMax}`,
      timestamp: new Date().toISOString(),
    });
  } else {
    alerts.push({
      severity: 'INFO',
      category: 'System Prompt',
      message: 'System prompt tokens within expected range (MCP baseline validated)',
      value: `${avgSize.toFixed(0)} (min: ${minSize}, max: ${maxSize})`,
      expected: `${ALERT_THRESHOLDS.systemPromptTokensMin}-${ALERT_THRESHOLDS.systemPromptTokensMax}`,
      timestamp: new Date().toISOString(),
    });
  }
}

async function checkToolFailureRate(
  supabase: any,
  alerts: Alert[]
): Promise<void> {
  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, metadata, created_at')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .filter('metadata->tool_calls', 'is', 'not null')
    .limit(1000);

  if (error) {
    console.warn('Could not fetch tool data:', error.message);
    return;
  }

  if (!messages || messages.length === 0) {
    alerts.push({
      severity: 'INFO',
      category: 'Tool Execution',
      message: 'No tool executions in last 24 hours',
      value: '0',
      expected: 'N/A',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  let totalToolCalls = 0;
  let failedToolCalls = 0;

  messages.forEach(msg => {
    if (msg.metadata?.tool_calls && Array.isArray(msg.metadata.tool_calls)) {
      totalToolCalls += msg.metadata.tool_calls.length;
      failedToolCalls += msg.metadata.tool_calls.filter((tc: any) => tc.error).length;
    }
  });

  if (totalToolCalls === 0) {
    alerts.push({
      severity: 'INFO',
      category: 'Tool Execution',
      message: 'No tool executions found',
      value: '0',
      expected: 'N/A',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const failureRate = (failedToolCalls / totalToolCalls) * 100;

  if (failureRate > ALERT_THRESHOLDS.toolFailureRatePercent) {
    alerts.push({
      severity: 'CRITICAL',
      category: 'Tool Execution',
      message: 'Tool failure rate exceeding threshold!',
      value: failureRate.toFixed(2),
      expected: `< ${ALERT_THRESHOLDS.toolFailureRatePercent}%`,
      timestamp: new Date().toISOString(),
    });
  } else {
    alerts.push({
      severity: 'INFO',
      category: 'Tool Execution',
      message: 'Tool execution healthy',
      value: `${failureRate.toFixed(2)}% (${failedToolCalls}/${totalToolCalls} failed)`,
      expected: `< ${ALERT_THRESHOLDS.toolFailureRatePercent}%`,
      timestamp: new Date().toISOString(),
    });
  }
}

async function checkAverageTokenUsage(
  supabase: any,
  alerts: Alert[]
): Promise<void> {
  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, content, role, created_at')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(10000);

  if (error) {
    console.warn('Could not fetch message data:', error.message);
    return;
  }

  if (!messages || messages.length === 0) {
    alerts.push({
      severity: 'INFO',
      category: 'Token Usage',
      message: 'No messages in last 24 hours',
      value: '0',
      expected: '100+',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Estimate tokens (4 tokens per word average)
  const totalTokens = messages.reduce((sum, msg) => {
    const wordCount = msg.content?.split(/\s+/).length || 0;
    return sum + Math.ceil(wordCount / 4);
  }, 0);

  const avgTokens = totalTokens / messages.length;

  if (avgTokens > ALERT_THRESHOLDS.avgTokensPerRequestMax) {
    alerts.push({
      severity: 'WARNING',
      category: 'Token Usage',
      message: 'Average tokens per request higher than expected',
      value: avgTokens.toFixed(0),
      expected: `< ${ALERT_THRESHOLDS.avgTokensPerRequestMax}`,
      timestamp: new Date().toISOString(),
    });
  } else {
    alerts.push({
      severity: 'INFO',
      category: 'Token Usage',
      message: 'Average token usage within expected range',
      value: avgTokens.toFixed(0),
      expected: `< ${ALERT_THRESHOLDS.avgTokensPerRequestMax}`,
      timestamp: new Date().toISOString(),
    });
  }
}

async function checkDailyCostAnomalies(
  supabase: any,
  alerts: Alert[],
  costThreshold: number
): Promise<void> {
  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, content, role, created_at')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(10000);

  if (error) {
    console.warn('Could not fetch cost data:', error.message);
    return;
  }

  if (!messages || messages.length === 0) {
    alerts.push({
      severity: 'INFO',
      category: 'Cost Analysis',
      message: 'No messages in last 24 hours',
      value: '$0.00',
      expected: `< $${costThreshold}`,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  let inputTokens = 0;
  let outputTokens = 0;

  messages.forEach(msg => {
    const wordCount = msg.content?.split(/\s+/).length || 0;
    const tokens = Math.ceil(wordCount / 4);

    if (msg.role === 'user') {
      inputTokens += tokens;
    } else {
      outputTokens += tokens;
    }
  });

  // GPT-4 pricing: $0.03 per 1K input, $0.06 per 1K output
  const inputCost = (inputTokens / 1000) * 0.03;
  const outputCost = (outputTokens / 1000) * 0.06;
  const totalCost = inputCost + outputCost;

  if (totalCost > costThreshold) {
    alerts.push({
      severity: 'WARNING',
      category: 'Cost Analysis',
      message: 'Daily costs exceed threshold',
      value: `$${totalCost.toFixed(2)}`,
      expected: `< $${costThreshold}`,
      timestamp: new Date().toISOString(),
    });
  } else {
    alerts.push({
      severity: 'INFO',
      category: 'Cost Analysis',
      message: 'Daily costs within acceptable range',
      value: `$${totalCost.toFixed(2)}`,
      expected: `< $${costThreshold}`,
      timestamp: new Date().toISOString(),
    });
  }
}

async function checkErrorRate(
  supabase: any,
  alerts: Alert[]
): Promise<void> {
  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, metadata, created_at')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(1000);

  if (error) {
    console.warn('Could not fetch error data:', error.message);
    return;
  }

  if (!messages || messages.length === 0) {
    alerts.push({
      severity: 'INFO',
      category: 'Error Rate',
      message: 'No messages to analyze',
      value: '0%',
      expected: 'N/A',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const errorCount = messages.filter(m => m.metadata?.error).length;
  const errorRate = (errorCount / messages.length) * 100;

  if (errorRate > 5) {
    alerts.push({
      severity: 'CRITICAL',
      category: 'Error Rate',
      message: 'Error rate exceeding 5%',
      value: errorRate.toFixed(2),
      expected: '< 5%',
      timestamp: new Date().toISOString(),
    });
  } else {
    alerts.push({
      severity: 'INFO',
      category: 'Error Rate',
      message: 'Error rate healthy',
      value: errorRate.toFixed(2),
      expected: '< 5%',
      timestamp: new Date().toISOString(),
    });
  }
}

function generateReport(alerts: Alert[]): AnomalyReport {
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const warningCount = alerts.filter(a => a.severity === 'WARNING').length;

  let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
  let healthScore = 100;

  if (criticalCount > 0) {
    status = 'CRITICAL';
    healthScore = Math.max(0, 100 - criticalCount * 20);
  } else if (warningCount > 0) {
    status = 'WARNING';
    healthScore = Math.max(50, 100 - warningCount * 10);
  }

  return {
    timestamp: new Date().toISOString(),
    periodHours: 24,
    alerts,
    healthScore,
    status,
  };
}

function displayReport(report: AnomalyReport, verbose: boolean): void {
  const statusEmoji = {
    HEALTHY: '✅',
    WARNING: '⚠️',
    CRITICAL: '🚨',
  };

  console.log('\n' + '='.repeat(80));
  console.log('TOKEN ANOMALY DETECTION REPORT');
  console.log('='.repeat(80));
  console.log(`Generated: ${new Date(report.timestamp).toLocaleString()}`);
  console.log(`Period: Last ${report.periodHours} hours\n`);

  // Overall status
  console.log(`${statusEmoji[report.status]} Status: ${report.status}`);
  console.log(`Health Score: ${report.healthScore}/100\n`);

  // Alert summary
  const criticalAlerts = report.alerts.filter(a => a.severity === 'CRITICAL');
  const warningAlerts = report.alerts.filter(a => a.severity === 'WARNING');
  const infoAlerts = report.alerts.filter(a => a.severity === 'INFO');

  console.log('📊 ALERT SUMMARY');
  console.log('-'.repeat(80));
  console.log(`Critical: ${criticalAlerts.length}`);
  console.log(`Warnings: ${warningAlerts.length}`);
  console.log(`Info: ${infoAlerts.length}\n`);

  // Display alerts
  if (criticalAlerts.length > 0) {
    console.log('🚨 CRITICAL ALERTS');
    console.log('-'.repeat(80));
    criticalAlerts.forEach(alert => {
      console.log(`[${alert.category}] ${alert.message}`);
      console.log(`  Value: ${alert.value}`);
      console.log(`  Expected: ${alert.expected}`);
    });
    console.log();
  }

  if (warningAlerts.length > 0) {
    console.log('⚠️ WARNING ALERTS');
    console.log('-'.repeat(80));
    warningAlerts.forEach(alert => {
      console.log(`[${alert.category}] ${alert.message}`);
      console.log(`  Value: ${alert.value}`);
      console.log(`  Expected: ${alert.expected}`);
    });
    console.log();
  }

  if (verbose && infoAlerts.length > 0) {
    console.log('ℹ️ INFO ALERTS');
    console.log('-'.repeat(80));
    infoAlerts.forEach(alert => {
      console.log(`[${alert.category}] ${alert.message}`);
      console.log(`  Value: ${alert.value}`);
      console.log(`  Expected: ${alert.expected}`);
    });
    console.log();
  }

  console.log('='.repeat(80) + '\n');
}

function saveAlertsToFile(report: AnomalyReport): void {
  const logsDir = path.join(process.cwd(), 'logs', 'monitoring');

  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toISOString().split('T')[1].split('.')[0];
  const filename = path.join(logsDir, `token-alerts-${date}-${time}.json`);

  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
}

// Run the check
checkTokenAnomalies().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
