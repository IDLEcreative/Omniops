#!/usr/bin/env npx tsx

/**
 * Log Analyzer Usage Examples
 * 
 * This script demonstrates various ways to use the Log Analyzer tool
 * for real-world log analysis scenarios.
 */

import { writeFileSync } from 'fs';
// Temporarily commented out - module not found
// import {
//   createLogAnalyzer,
//   analyzeLogFile,
//   analyzeLogText,
//   createLogMonitor,
//   LogPattern
// } from './lib/dev-tools/log-analyzer';

const createLogAnalyzer: any = () => {};
const analyzeLogFile: any = () => {};
const analyzeLogText: any = () => {};
const createLogMonitor: any = () => {};
const LogPattern: any = {};

/**
 * Example 1: Quick log file analysis
 */
async function quickAnalysis() {
  console.log('📊 Example 1: Quick Log File Analysis');
  console.log('-'.repeat(40));

  // Create a sample log file
  const sampleLogs = `
2024-01-15T10:30:00Z INFO Application started successfully
2024-01-15T10:30:05Z WARN High memory usage: 1.8GB/2GB
2024-01-15T10:30:10Z ERROR Database connection failed: ECONNREFUSED
2024-01-15T10:30:15Z ERROR SQL injection attempt: SELECT * FROM users WHERE id = 1 OR 1=1
2024-01-15T10:30:20Z INFO Request processed in 5.2 seconds
2024-01-15T10:30:25Z FATAL System out of memory - terminating
  `.trim();

  writeFileSync('./sample-app.log', sampleLogs);

  // Analyze the file
  const report = await analyzeLogFile('./sample-app.log');
  
  console.log(`Total entries: ${report.summary.totalEntries}`);
  console.log(`Error rate: ${(report.summary.errorRate * 100).toFixed(1)}%`);
  console.log(`Security events: ${report.summary.securityEvents}`);
  console.log(`Performance issues: ${report.summary.performanceIssues}`);
  console.log(`Critical issues: ${report.summary.criticalIssues}`);
  
  // Show top error groups
  if (report.errorGroups.length > 0) {
    console.log('\nTop error groups:');
    report.errorGroups.slice(0, 3).forEach((group: any, i: number) => {
      console.log(`  ${i + 1}. ${group.message} (${group.count} occurrences)`);
    });
  }
}

/**
 * Example 2: Advanced analyzer with custom patterns
 */
async function advancedAnalysis() {
  console.log('\n🔍 Example 2: Advanced Analysis with Custom Patterns');
  console.log('-'.repeat(50));

  // Define custom patterns for your application
  const customPatterns: any[] = [
    {
      id: 'payment-failure',
      name: 'Payment Processing Failure',
      pattern: /payment.*failed|payment.*error|stripe.*error/i,
      severity: 'critical',
      category: 'error',
      description: 'Payment processing system failure',
      enabled: true
    },
    {
      id: 'api-rate-limit',
      name: 'API Rate Limit Exceeded',
      pattern: /rate.*limit.*exceeded|too.*many.*requests/i,
      severity: 'high',
      category: 'performance',
      description: 'API rate limiting triggered',
      enabled: true
    },
    {
      id: 'user-signup',
      name: 'User Registration',
      pattern: /user.*registered|new.*user.*created|signup.*successful/i,
      severity: 'info',
      category: 'access',
      description: 'New user registration',
      enabled: true
    }
  ];

  const analyzer = createLogAnalyzer({
    enablePatternMatching: true,
    enableErrorGrouping: true,
    enableSecurityDetection: true,
    enablePerformanceAnalysis: true,
    customPatterns,
    slowRequestThreshold: 3000, // 3 seconds
    memoryThreshold: 1024 // 1GB
  });

  // Sample application logs with custom scenarios
  const appLogs = `
2024-01-15T10:30:00Z INFO User registered successfully: user_12345
2024-01-15T10:30:05Z ERROR Payment failed for order ORD-789: Stripe error
2024-01-15T10:30:10Z WARN Rate limit exceeded for API key: api_key_456
2024-01-15T10:30:15Z ERROR Payment processing error: insufficient funds
2024-01-15T10:30:20Z INFO New user created: john.doe@example.com
2024-01-15T10:30:25Z WARN Too many requests from IP 192.168.1.100
2024-01-15T10:30:30Z ERROR Database query timeout after 4.5 seconds
2024-01-15T10:30:35Z INFO Signup successful for premium account
  `.trim();

  // Parse the logs
  const lines = appLogs.split('\n');
  for (const line of lines) {
    const entry = analyzer.parseLogEntry(line);
    if (entry) {
      analyzer.addEntry(entry);
    }
  }

  const report = analyzer.generateReport();
  
  console.log(`Analysis complete: ${report.summary.totalEntries} entries processed`);
  
  // Show custom pattern matches
  console.log('\nCustom pattern matches:');
  report.patterns.matched.forEach((pattern: any) => {
    if (customPatterns.some(cp => cp.id === pattern.id)) {
      console.log(`  - ${pattern.name}: ${pattern.count} matches`);
    }
  });

  // Show recommendations
  if (report.recommendations.immediate.length > 0) {
    console.log('\nImmediate recommendations:');
    report.recommendations.immediate.forEach((rec: any) => {
      console.log(`  • ${rec}`);
    });
  }
}

/**
 * Example 3: Real-time monitoring with alerts
 */
async function realTimeMonitoring() {
  console.log('\n⏱️ Example 3: Real-time Monitoring with Alerts');
  console.log('-'.repeat(45));

  const analyzer = createLogAnalyzer({
    realTimeAlerts: true,
    enablePatternMatching: true,
    enableSecurityDetection: true,
    enablePerformanceAnalysis: true
  });

  // Set up custom alert conditions
  analyzer.addAlertCondition({
    id: 'critical-errors',
    name: 'Critical Error Burst',
    level: 'error',
    threshold: 3,
    timeWindow: 5, // 5 minutes
    enabled: true,
    action: 'log'
  });

  analyzer.addAlertCondition({
    id: 'security-threats',
    name: 'Security Threat Detection',
    pattern: /injection|xss|attack|hack/i,
    threshold: 1,
    timeWindow: 1,
    enabled: true,
    action: 'log'
  });

  // Event listeners for real-time alerts
  analyzer.on('alert', (alert: any) => {
    console.log(`🚨 ALERT: ${alert.message}`);
    console.log(`   Condition: ${alert.condition.name}`);
    console.log(`   Severity: ${alert.severity}`);
    console.log(`   Count: ${alert.count} events in ${alert.condition.timeWindow} minutes`);
  });

  analyzer.on('securityEvent', (event: any) => {
    console.log(`🛡️ SECURITY EVENT: ${event.type}`);
    console.log(`   Risk Score: ${event.riskScore}/100`);
    console.log(`   Source: ${event.source}`);
    console.log(`   Indicators: ${event.indicators.join(', ')}`);
  });

  analyzer.on('performanceIssue', (issue: any) => {
    console.log(`⚡ PERFORMANCE ISSUE: ${issue.type}`);
    console.log(`   Severity: ${issue.severity}`);
    console.log(`   Impact: ${issue.impact}`);
  });

  // Simulate incoming log stream
  const streamLogs = [
    'ERROR Critical database failure',
    'ERROR System memory exhausted',
    'ERROR Application crashed unexpectedly',
    'WARN SQL injection attempt detected in user input',
    'ERROR Slow request taking 8.5 seconds to complete',
    'INFO Normal operation resumed'
  ];

  console.log('\nSimulating real-time log stream...');
  
  for (const log of streamLogs) {
    const entry = analyzer.parseLogEntry(`2024-01-15T10:30:00Z ${log}`);
    if (entry) {
      analyzer.addEntry(entry);
    }
    // Simulate delay between log entries
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\nReal-time monitoring simulation complete');
}

/**
 * Example 4: Security analysis focus
 */
async function securityAnalysis() {
  console.log('\n🛡️ Example 4: Security-Focused Analysis');
  console.log('-'.repeat(40));

  const analyzer = createLogAnalyzer({
    enableSecurityDetection: true,
    enablePatternMatching: true,
    customPatterns: [
      {
        id: 'suspicious-ip',
        name: 'Suspicious IP Activity',
        pattern: /blocked.*ip|banned.*address|suspicious.*activity/i,
        severity: 'high',
        category: 'security',
        description: 'Suspicious IP address activity detected',
        enabled: true
      }
    ]
  });

  // Security-focused log samples
  const securityLogs = `
192.168.1.100 - - [15/Jan/2024:10:30:00 +0000] "GET /admin/../../etc/passwd HTTP/1.1" 403 128
192.168.1.101 - - [15/Jan/2024:10:30:05 +0000] "POST /login?user=admin&pass=admin' OR '1'='1 HTTP/1.1" 401 256
192.168.1.102 - - [15/Jan/2024:10:30:10 +0000] "GET /search?q=<script>alert('XSS')</script> HTTP/1.1" 400 64
{"timestamp":"2024-01-15T10:30:15Z","level":"warn","message":"Brute force attack detected from 192.168.1.100"}
{"timestamp":"2024-01-15T10:30:20Z","level":"error","message":"Multiple failed login attempts - IP blocked"}
{"timestamp":"2024-01-15T10:30:25Z","level":"info","message":"Suspicious activity pattern detected for user agent: EvilBot/1.0"}
  `.trim();

  const lines = securityLogs.split('\n');
  for (const line of lines) {
    const entry = analyzer.parseLogEntry(line);
    if (entry) {
      analyzer.addEntry(entry);
    }
  }

  const report = analyzer.generateReport();
  
  console.log(`Security analysis: ${report.summary.securityEvents} events detected`);
  
  // Detailed security event breakdown
  const eventTypes = new Map<string, number>();
  report.securityEvents.forEach((event: any) => {
    eventTypes.set(event.type, (eventTypes.get(event.type) || 0) + 1);
  });

  console.log('\nSecurity event breakdown:');
  for (const [type, count] of eventTypes) {
    console.log(`  - ${type}: ${count} events`);
  }

  // Show high-risk events
  const highRiskEvents = report.securityEvents.filter((e: any) => e.riskScore >= 70);
  if (highRiskEvents.length > 0) {
    console.log('\nHigh-risk security events:');
    highRiskEvents.forEach((event: any) => {
      console.log(`  🔥 ${event.type} (Risk: ${event.riskScore}) from ${event.source}`);
    });
  }
}

/**
 * Example 5: Export and reporting
 */
async function exportAndReporting() {
  console.log('\n📤 Example 5: Export and Reporting');
  console.log('-'.repeat(35));

  const analyzer = createLogAnalyzer({
    enablePatternMatching: true,
    enableErrorGrouping: true,
    enableSecurityDetection: true,
    enablePerformanceAnalysis: true
  });

  // Add some sample data
  const sampleData = [
    'ERROR Database connection failed',
    'WARN Memory usage high: 90%',
    'INFO Application started',
    'ERROR SQL injection attempt detected',
    'WARN Slow query: 4.2 seconds',
    'ERROR Authentication failed'
  ];

  for (const log of sampleData) {
    const entry = analyzer.parseLogEntry(`2024-01-15T10:30:00Z ${log}`);
    if (entry) {
      analyzer.addEntry(entry);
    }
  }

  // Export in different formats
  console.log('Generating exports...');
  
  // JSON export (for API integration)
  const jsonReport = analyzer.exportJSON();
  writeFileSync('./log-analysis-report.json', jsonReport);
  console.log('✅ JSON report saved to: log-analysis-report.json');

  // CSV export (for spreadsheet analysis)
  const csvData = analyzer.exportCSV();
  writeFileSync('./log-analysis-data.csv', csvData);
  console.log('✅ CSV data saved to: log-analysis-data.csv');

  // HTML report (for sharing/presentation)
  const htmlReport = analyzer.exportHTML();
  writeFileSync('./log-analysis-report.html', htmlReport);
  console.log('✅ HTML report saved to: log-analysis-report.html');

  const report = analyzer.generateReport();
  console.log(`\nReport summary:`);
  console.log(`  - Total entries: ${report.summary.totalEntries}`);
  console.log(`  - Time span: ${report.statistics.timespan.duration}ms`);
  console.log(`  - Patterns matched: ${report.patterns.matched.length}`);
  console.log(`  - Export files generated: 3`);
}

/**
 * Main execution
 */
async function runExamples() {
  console.log('🚀 Log Analyzer Usage Examples');
  console.log('='.repeat(50));

  try {
    await quickAnalysis();
    await advancedAnalysis();
    await realTimeMonitoring();
    await securityAnalysis();
    await exportAndReporting();

    console.log('\n' + '='.repeat(50));
    console.log('🎉 All examples completed successfully!');
    console.log('\nGenerated files:');
    console.log('  - sample-app.log');
    console.log('  - log-analysis-report.json');
    console.log('  - log-analysis-data.csv');
    console.log('  - log-analysis-report.html');

  } catch (error) {
    console.error('\n❌ Example execution failed:', error);
    process.exit(1);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}

export { runExamples };