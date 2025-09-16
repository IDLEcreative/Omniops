# Log Analyzer Tool

A comprehensive, zero-dependency log analysis tool for the universal developer tools toolkit. This tool provides advanced log parsing, pattern detection, security analysis, and performance monitoring capabilities.

## Features

### Core Capabilities

- **Multi-format Parsing**: JSON, Apache, Nginx, Syslog, and plain text logs
- **Pattern Detection**: Configurable regex patterns with severity levels
- **Error Grouping**: Automatic categorization of similar errors
- **Security Analysis**: Detection of SQL injection, XSS, path traversal, and other threats
- **Performance Monitoring**: Slow request identification and memory issue detection
- **Real-time Processing**: Stream-based log monitoring with alerts
- **Timeline Visualization**: Data generation for log visualization
- **Export Capabilities**: JSON, CSV, and HTML report generation

### Zero Dependencies

Built using only Node.js built-in modules:
- `fs` - File system operations
- `stream` - Stream processing
- `readline` - Line-by-line processing
- `crypto` - Hash generation and UUIDs
- `events` - Event-driven architecture

## Quick Start

### Basic Usage

```typescript
import { createLogAnalyzer, analyzeLogFile } from './lib/dev-tools';

// Quick file analysis
const report = await analyzeLogFile('/var/log/app.log');
console.log(`Error rate: ${(report.summary.errorRate * 100).toFixed(2)}%`);
console.log(`Security events: ${report.summary.securityEvents}`);
```

### Advanced Configuration

```typescript
import { createLogAnalyzer, LogPattern } from './lib/dev-tools';

const customPatterns: LogPattern[] = [
  {
    id: 'payment-failure',
    name: 'Payment Processing Failure',
    pattern: /payment.*failed|stripe.*error/i,
    severity: 'critical',
    category: 'error',
    description: 'Payment system failure',
    enabled: true
  }
];

const analyzer = createLogAnalyzer({
  enablePatternMatching: true,
  enableSecurityDetection: true,
  enablePerformanceAnalysis: true,
  customPatterns,
  slowRequestThreshold: 3000, // 3 seconds
  memoryThreshold: 1024 // 1GB
});
```

### Real-time Monitoring

```typescript
import { createReadStream } from 'fs';
import { createLogMonitor } from './lib/dev-tools';

const { analyzer, stream } = createLogMonitor(
  createReadStream('/var/log/app.log'),
  { parseLines: true, skipEmpty: true }
);

// Listen for security events
analyzer.on('securityEvent', (event) => {
  console.warn(`Security threat: ${event.type} (Risk: ${event.riskScore})`);
});

// Listen for performance issues
analyzer.on('performanceIssue', (issue) => {
  console.warn(`Performance issue: ${issue.type} - ${issue.impact}`);
});
```

## Log Format Support

### JSON Logs
```json
{"timestamp":"2024-01-15T10:30:00.123Z","level":"error","message":"Database connection failed","service":"api"}
```

### Apache Access Logs
```
192.168.1.1 - - [15/Jan/2024:10:30:00 +0000] "GET /api/users HTTP/1.1" 200 1024
```

### Nginx Error Logs
```
2024/01/15 10:30:00 [error] 123#0: *456 connect() failed (111: Connection refused)
```

### Syslog Format
```
Jan 15 10:30:00 webserver01 sshd[5678]: Failed password for root from 192.168.1.100
```

### Plain Text Logs
```
2024-01-15 10:30:00 ERROR Database connection failed: ECONNREFUSED
```

## Pattern Detection

### Built-in Security Patterns

- **SQL Injection**: `(\bunion\s+select\b|\bor\s+1\s*=\s*1\b|';\s*(drop|delete|insert|update)\b)`
- **XSS Attempts**: `<script[^>]*>|javascript:|on\w+\s*=|<iframe[^>]*>`
- **Path Traversal**: `\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\\`
- **Brute Force**: `\b(brute\s*force|password\s*attack|login\s*attempt|authentication\s*fail)`

### Built-in Performance Patterns

- **Slow Requests**: `\b(slow|timeout|response\s*time|latency).*?(\d+(?:\.\d+)?)\s*(ms|seconds?|s)\b`
- **Memory Issues**: `\b(out\s*of\s*memory|memory\s*leak|heap\s*overflow|oom|high\s*memory)`
- **Database Slow**: `\b(slow\s*query|database\s*timeout|query\s*execution|db\s*slow)`

### Custom Patterns

```typescript
const customPattern: LogPattern = {
  id: 'api-timeout',
  name: 'API Timeout',
  pattern: /api.*timeout|external.*service.*timeout/i,
  severity: 'high',
  category: 'performance',
  description: 'External API timeout detected',
  enabled: true
};
```

## Security Analysis

### Detected Security Events

- **SQL Injection**: Attempts to manipulate database queries
- **XSS Attempts**: Cross-site scripting attack vectors
- **Path Traversal**: Directory traversal attempts
- **Brute Force**: Authentication attack patterns
- **Suspicious Traffic**: Unusual request patterns
- **Malformed Requests**: Invalid HTTP requests

### Risk Scoring

Each security event receives a risk score (0-100):
- **Critical (90+)**: SQL injection, code execution
- **High (70-89)**: XSS, path traversal, brute force
- **Medium (50-69)**: Rate limiting, suspicious patterns
- **Low (30-49)**: Minor anomalies
- **Info (0-29)**: Informational events

## Performance Analysis

### Detected Issues

- **Slow Requests**: Requests exceeding threshold
- **High Memory**: Memory usage above limits
- **Database Slow**: Slow database operations
- **Connection Errors**: Network connectivity issues
- **Timeouts**: Request/response timeouts
- **Queue Backlog**: Processing queue issues

### Thresholds

```typescript
const analyzer = createLogAnalyzer({
  slowRequestThreshold: 5000, // 5 seconds
  memoryThreshold: 2048, // 2GB
  enablePerformanceAnalysis: true
});
```

## Error Grouping

### Automatic Grouping

Similar errors are automatically grouped using:
- Message normalization (numbers → N, IPs → IP, paths → PATH)
- Content similarity analysis
- Configurable similarity threshold (0-1)

### Example Groups

```
Group 1: "Database connection failed: ECONNREFUSED localhost:5432" (15 occurrences)
Group 2: "Failed to authenticate user with ID N" (8 occurrences)
Group 3: "Timeout waiting for response from API endpoint /PATH" (5 occurrences)
```

## Real-time Alerts

### Alert Conditions

```typescript
analyzer.addAlertCondition({
  id: 'critical-errors',
  name: 'Critical Error Burst',
  level: 'error',
  threshold: 5,
  timeWindow: 10, // 10 minutes
  enabled: true,
  action: 'log'
});
```

### Event Listeners

```typescript
analyzer.on('alert', (alert) => {
  console.log(`🚨 ${alert.message}`);
  // Send to monitoring system
});

analyzer.on('securityEvent', (event) => {
  console.log(`🛡️ Security: ${event.type}`);
  // Trigger security response
});
```

## Export and Reporting

### JSON Export
```typescript
const jsonReport = analyzer.exportJSON();
// Complete analysis report in JSON format
```

### CSV Export
```typescript
const csvData = analyzer.exportCSV();
// Log entries in CSV format for spreadsheet analysis
```

### HTML Report
```typescript
const htmlReport = analyzer.exportHTML();
// Formatted HTML report with styling
```

### Report Contents

- **Summary**: Total entries, error rates, security events
- **Statistics**: Breakdown by level, category, source
- **Error Groups**: Grouped similar errors
- **Security Events**: Detected threats with risk scores
- **Performance Issues**: Slow operations and bottlenecks
- **Timeline**: Time-bucketed event distribution
- **Recommendations**: Immediate, short-term, and long-term actions

## Memory Management

### Automatic Limits

- **Max Entries**: Configurable limit (default: 100,000)
- **Memory Monitoring**: Automatic cleanup when heap exceeds 500MB
- **Circular Buffer**: Oldest entries removed when limits reached

### Stream Processing

- **Large Files**: Line-by-line processing for memory efficiency
- **Real-time Streams**: Continuous processing without accumulation
- **Chunked Analysis**: Process large datasets in manageable chunks

## API Reference

### Main Classes

#### LogAnalyzer

```typescript
class LogAnalyzer extends EventEmitter {
  constructor(options?: LogAnalyzerOptions)
  parseLogEntry(line: string, format?: LogFormat): LogEntry | null
  addEntry(entry: LogEntry): void
  parseFile(filePath: string, format?: LogFormat): Promise<void>
  generateReport(): LogAnalysisReport
  exportJSON(): string
  exportCSV(): string
  exportHTML(): string
  clear(): void
}
```

### Factory Functions

```typescript
// Quick analyzer creation
function createLogAnalyzer(options?: LogAnalyzerOptions): LogAnalyzer

// File analysis
function analyzeLogFile(filePath: string, options?: LogAnalyzerOptions): Promise<LogAnalysisReport>

// Text analysis
function analyzeLogText(text: string, options?: LogAnalyzerOptions): LogAnalysisReport

// Stream monitoring
function createLogMonitor(source: ReadStream, options?: LogStreamOptions): { analyzer: LogAnalyzer; stream: Transform }
```

### Configuration Options

```typescript
interface LogAnalyzerOptions {
  maxEntries?: number; // Max entries to keep in memory
  enablePatternMatching?: boolean; // Enable pattern detection
  enableErrorGrouping?: boolean; // Enable error grouping
  enableSecurityDetection?: boolean; // Enable security analysis
  enablePerformanceAnalysis?: boolean; // Enable performance monitoring
  customPatterns?: LogPattern[]; // Custom detection patterns
  errorGroupingSimilarity?: number; // Similarity threshold (0-1)
  timelineBucketSize?: number; // Timeline bucket size (minutes)
  memoryThreshold?: number; // Memory threshold (MB)
  slowRequestThreshold?: number; // Slow request threshold (ms)
  realTimeAlerts?: boolean; // Enable real-time alerting
  retentionPeriod?: number; // Data retention (days)
}
```

## Examples

### Complete Example Files

- **`test-log-analyzer.ts`**: Comprehensive test suite
- **`log-analyzer-example.ts`**: Usage examples and demonstrations

### Running Tests

```bash
npx tsx test-log-analyzer.ts
```

### Running Examples

```bash
npx tsx log-analyzer-example.ts
```

## Performance Benchmarks

Based on test results:

- **Throughput**: ~100,000 entries/second
- **Memory Efficient**: Automatic cleanup and limits
- **Report Generation**: <1ms for 1,000 entries
- **Pattern Matching**: Minimal performance impact
- **Stream Processing**: Handles large files without memory issues

## Use Cases

### Development

- Debug application logs
- Monitor error patterns
- Detect performance regressions
- Track security incidents

### Production

- Real-time log monitoring
- Security event detection
- Performance bottleneck identification
- Automated alerting

### DevOps

- Log analysis automation
- Incident response
- Trend analysis
- Compliance monitoring

### Security

- Threat detection
- Attack pattern analysis
- Compliance auditing
- Incident investigation

## Integration

### With Monitoring Systems

```typescript
analyzer.on('alert', async (alert) => {
  // Send to Slack
  await sendSlackAlert(alert);
  
  // Store in database
  await storeAlert(alert);
  
  // Trigger webhook
  await triggerWebhook(alert);
});
```

### With CI/CD Pipelines

```typescript
// Analyze build logs
const report = await analyzeLogFile('./build.log');

if (report.summary.errorRate > 0.1) {
  process.exit(1); // Fail build on high error rate
}
```

### With Log Aggregation

```typescript
// ElasticSearch integration
analyzer.on('entryAdded', async (entry) => {
  await elasticsearch.index({
    index: 'logs',
    body: entry
  });
});
```

## Best Practices

1. **Configure Appropriate Thresholds**: Set realistic limits for your environment
2. **Use Custom Patterns**: Add application-specific detection patterns
3. **Monitor Memory Usage**: Be aware of log volume and memory constraints
4. **Set Up Alerts**: Configure real-time alerts for critical issues
5. **Regular Analysis**: Schedule periodic log analysis reports
6. **Export Data**: Save analysis results for trend analysis
7. **Security Focus**: Prioritize security event detection and response

## Troubleshooting

### Common Issues

1. **Memory Usage**: Reduce `maxEntries` or increase `memoryThreshold`
2. **Pattern Performance**: Limit complex regex patterns
3. **Large Files**: Use stream processing for files >100MB
4. **False Positives**: Tune pattern sensitivity and thresholds

### Debug Mode

```typescript
analyzer.on('patternMatched', ({ pattern, entry }) => {
  console.log(`Pattern matched: ${pattern.name}`);
});

analyzer.on('memoryWarning', ({ current, limit }) => {
  console.warn(`Memory usage: ${current}MB/${limit}MB`);
});
```

This tool provides enterprise-grade log analysis capabilities while maintaining zero external dependencies and high performance. It's designed to scale from development environments to production monitoring systems.