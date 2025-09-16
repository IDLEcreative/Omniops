/**
 * Universal Log Analyzer - Zero Dependencies
 * 
 * Features:
 * - Multiple log format parsing (JSON, Apache, Nginx, Syslog, plain text)
 * - Pattern detection with configurable regex patterns
 * - Error grouping and categorization
 * - Timeline visualization data generation
 * - Memory issue detection
 * - Security event detection (SQL injection, XSS, etc.)
 * - Slow request identification
 * - Real-time log monitoring from streams
 * - Statistical analysis and trends
 * - Comprehensive reports with recommendations
 * - Export capabilities (JSON, CSV, HTML)
 */

import { createReadStream, createWriteStream, ReadStream } from 'fs';
import { createInterface } from 'readline';
import { Transform, Readable } from 'stream';
import { EventEmitter } from 'events';
import { createHash, randomUUID } from 'crypto';

import type {
  LogEntry,
  LogLevel,
  LogFormat,
  LogSeverity,
  LogCategory,
  LogPattern,
  ErrorGroup,
  TimelineBucket,
  LogStatistics,
  SecurityEvent,
  SecurityEventType,
  PerformanceIssue,
  PerformanceIssueType,
  LogAnalyzerOptions,
  LogAnalysisReport,
  LogStreamOptions,
  AlertCondition,
  Alert,
  AlertAction
} from './types';

/**
 * Main Log Analyzer class
 */
export class LogAnalyzer extends EventEmitter {
  private entries: LogEntry[] = [];
  private patterns: LogPattern[] = [];
  private errorGroups: Map<string, ErrorGroup> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private performanceIssues: PerformanceIssue[] = [];
  private alerts: Alert[] = [];
  private alertConditions: AlertCondition[] = [];
  private options: Required<LogAnalyzerOptions>;
  private readonly maxMemoryMB = 500; // Memory safety limit

  constructor(options: LogAnalyzerOptions = {}) {
    super();
    
    this.options = {
      maxEntries: options.maxEntries || 100000,
      enablePatternMatching: options.enablePatternMatching ?? true,
      enableErrorGrouping: options.enableErrorGrouping ?? true,
      enableSecurityDetection: options.enableSecurityDetection ?? true,
      enablePerformanceAnalysis: options.enablePerformanceAnalysis ?? true,
      customPatterns: options.customPatterns || [],
      errorGroupingSimilarity: options.errorGroupingSimilarity || 0.8,
      timelineBucketSize: options.timelineBucketSize || 60, // 1 hour
      memoryThreshold: options.memoryThreshold || 1024, // 1GB
      slowRequestThreshold: options.slowRequestThreshold || 5000, // 5 seconds
      realTimeAlerts: options.realTimeAlerts ?? false,
      retentionPeriod: options.retentionPeriod || 30 // 30 days
    };

    this.initializeDefaultPatterns();
    this.initializeDefaultAlerts();
  }

  /**
   * Parse log entry from different formats
   */
  parseLogEntry(line: string, format?: LogFormat): LogEntry | null {
    if (!line.trim()) return null;

    try {
      const detected = format || this.detectLogFormat(line);
      let entry: Partial<LogEntry>;

      switch (detected) {
        case 'json':
          entry = this.parseJSON(line);
          break;
        case 'apache':
        case 'combined':
          entry = this.parseApache(line);
          break;
        case 'nginx':
          entry = this.parseNginx(line);
          break;
        case 'syslog':
          entry = this.parseSyslog(line);
          break;
        case 'plain':
        default:
          entry = this.parsePlainText(line);
          break;
      }

      const logEntry: LogEntry = {
        id: randomUUID(),
        timestamp: entry.timestamp || new Date(),
        level: entry.level || 'unknown',
        message: entry.message || line,
        source: entry.source,
        metadata: entry.metadata,
        raw: line,
        format: detected,
        patterns: [],
        severity: this.determineSeverity(entry.level || 'unknown'),
        category: this.categorizeLog(entry.message || line, entry.level || 'unknown')
      };

      return logEntry;
    } catch (error) {
      // Return a basic entry for unparseable lines
      return {
        id: randomUUID(),
        timestamp: new Date(),
        level: 'unknown',
        message: line,
        raw: line,
        format: 'plain',
        patterns: [],
        severity: 'info',
        category: 'other'
      };
    }
  }

  /**
   * Add log entry to analyzer
   */
  addEntry(entry: LogEntry): void {
    // Memory management
    if (this.entries.length >= this.options.maxEntries) {
      // Remove oldest 10% when limit reached
      const removeCount = Math.floor(this.options.maxEntries * 0.1);
      this.entries.splice(0, removeCount);
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    if (memoryUsage.heapUsed / 1024 / 1024 > this.maxMemoryMB) {
      this.emit('memoryWarning', {
        current: memoryUsage.heapUsed / 1024 / 1024,
        limit: this.maxMemoryMB
      });
      
      // Aggressive cleanup
      this.entries.splice(0, Math.floor(this.entries.length * 0.3));
    }

    this.entries.push(entry);

    // Real-time analysis
    if (this.options.enablePatternMatching) {
      this.matchPatterns(entry);
    }

    if (this.options.enableErrorGrouping && (entry.level === 'error' || entry.level === 'fatal')) {
      this.groupError(entry);
    }

    if (this.options.enableSecurityDetection) {
      this.detectSecurityEvents(entry);
    }

    if (this.options.enablePerformanceAnalysis) {
      this.analyzePerformance(entry);
    }

    if (this.options.realTimeAlerts) {
      this.checkAlerts(entry);
    }

    this.emit('entryAdded', entry);
  }

  /**
   * Parse log file
   */
  async parseFile(filePath: string, format?: LogFormat): Promise<void> {
    return new Promise((resolve, reject) => {
      const fileStream = createReadStream(filePath, { encoding: 'utf8' });
      const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      let lineCount = 0;

      rl.on('line', (line) => {
        lineCount++;
        const entry = this.parseLogEntry(line, format);
        if (entry) {
          this.addEntry(entry);
        }

        // Progress reporting for large files
        if (lineCount % 1000 === 0) {
          this.emit('progress', { processed: lineCount, file: filePath });
        }
      });

      rl.on('close', () => {
        this.emit('fileProcessed', { file: filePath, entries: lineCount });
        resolve();
      });

      rl.on('error', reject);
      fileStream.on('error', reject);
    });
  }

  /**
   * Create readable stream for real-time log monitoring
   */
  createLogStream(source: ReadStream | Readable, options: LogStreamOptions = {}): Transform {
    const streamOptions = {
      encoding: options.encoding || 'utf8',
      highWaterMark: options.highWaterMark || 64 * 1024,
      objectMode: options.objectMode || false,
      parseLines: options.parseLines ?? true,
      skipEmpty: options.skipEmpty ?? true
    };

    const transform = new Transform({
      objectMode: streamOptions.objectMode,
      highWaterMark: streamOptions.highWaterMark,
      transform: (chunk, encoding, callback) => {
        try {
          const text = chunk.toString(streamOptions.encoding);
          
          if (streamOptions.parseLines) {
            const lines = text.split('\n');
            
            for (const line of lines) {
              if (streamOptions.skipEmpty && !line.trim()) continue;
              
              const entry = this.parseLogEntry(line);
              if (entry) {
                this.addEntry(entry);
                if (streamOptions.objectMode) {
                  callback(null, entry);
                } else {
                  callback(null, JSON.stringify(entry) + '\n');
                }
              }
            }
          } else {
            const entry = this.parseLogEntry(text);
            if (entry) {
              this.addEntry(entry);
              callback(null, streamOptions.objectMode ? entry : JSON.stringify(entry));
            }
          }
        } catch (error) {
          callback(error);
        }
      }
    });

    // Connect source to transform
    source.pipe(transform);

    return transform;
  }

  /**
   * Generate comprehensive analysis report
   */
  generateReport(): LogAnalysisReport {
    const statistics = this.calculateStatistics();
    const timeline = this.generateTimeline();
    const recommendations = this.generateRecommendations();

    const report: LogAnalysisReport = {
      summary: {
        totalEntries: this.entries.length,
        timespan: statistics.timespan,
        errorRate: statistics.errorRate,
        criticalIssues: this.securityEvents.filter(e => e.severity === 'critical').length +
                       this.performanceIssues.filter(p => p.severity === 'critical').length,
        securityEvents: this.securityEvents.length,
        performanceIssues: this.performanceIssues.length
      },
      statistics,
      errorGroups: Array.from(this.errorGroups.values()),
      securityEvents: this.securityEvents,
      performanceIssues: this.performanceIssues,
      timeline,
      patterns: {
        matched: this.patterns.filter(p => p.count && p.count > 0),
        recommendations: recommendations.patterns
      },
      recommendations,
      generatedAt: new Date()
    };

    return report;
  }

  /**
   * Export data in various formats
   */
  exportJSON(): string {
    const report = this.generateReport();
    return JSON.stringify(report, null, 2);
  }

  exportCSV(): string {
    const headers = [
      'timestamp', 'level', 'category', 'severity', 'message', 'source', 'format'
    ];
    
    const rows = this.entries.map(entry => [
      entry.timestamp.toISOString(),
      entry.level,
      entry.category || '',
      entry.severity || '',
      `"${entry.message.replace(/"/g, '""')}"`,
      entry.source || '',
      entry.format || ''
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  exportHTML(): string {
    const report = this.generateReport();
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Log Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; }
        .error { color: #d32f2f; }
        .warning { color: #f57c00; }
        .info { color: #1976d2; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .timeline { margin: 20px 0; }
        .recommendations { background: #e8f5e8; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Log Analysis Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Entries:</strong> ${report.summary.totalEntries.toLocaleString()}</p>
        <p><strong>Error Rate:</strong> ${(report.summary.errorRate * 100).toFixed(2)}%</p>
        <p><strong>Security Events:</strong> ${report.summary.securityEvents}</p>
        <p><strong>Performance Issues:</strong> ${report.summary.performanceIssues}</p>
        <p><strong>Critical Issues:</strong> ${report.summary.criticalIssues}</p>
    </div>

    <h2>Error Groups</h2>
    <table>
        <tr><th>Signature</th><th>Count</th><th>Level</th><th>Category</th><th>First Seen</th><th>Last Seen</th></tr>
        ${report.errorGroups.map(group => `
            <tr>
                <td>${this.escapeHtml(group.signature)}</td>
                <td>${group.count}</td>
                <td class="${group.level}">${group.level}</td>
                <td>${group.category}</td>
                <td>${group.firstSeen.toLocaleString()}</td>
                <td>${group.lastSeen.toLocaleString()}</td>
            </tr>
        `).join('')}
    </table>

    <h2>Security Events</h2>
    <table>
        <tr><th>Type</th><th>Severity</th><th>Risk Score</th><th>Timestamp</th><th>Source</th></tr>
        ${report.securityEvents.map(event => `
            <tr>
                <td>${event.type}</td>
                <td class="${event.severity}">${event.severity}</td>
                <td>${event.riskScore}</td>
                <td>${event.timestamp.toLocaleString()}</td>
                <td>${this.escapeHtml(event.source)}</td>
            </tr>
        `).join('')}
    </table>

    <div class="recommendations">
        <h2>Recommendations</h2>
        <h3>Immediate Actions</h3>
        <ul>
            ${report.recommendations.immediate.map(rec => `<li>${this.escapeHtml(rec)}</li>`).join('')}
        </ul>
        <h3>Short-term Improvements</h3>
        <ul>
            ${report.recommendations.shortTerm.map(rec => `<li>${this.escapeHtml(rec)}</li>`).join('')}
        </ul>
        <h3>Long-term Strategies</h3>
        <ul>
            ${report.recommendations.longTerm.map(rec => `<li>${this.escapeHtml(rec)}</li>`).join('')}
        </ul>
    </div>

    <p><em>Report generated at: ${report.generatedAt.toLocaleString()}</em></p>
</body>
</html>
    `.trim();
  }

  /**
   * Alert management
   */
  addAlertCondition(condition: AlertCondition): void {
    this.alertConditions.push(condition);
  }

  removeAlertCondition(id: string): boolean {
    const index = this.alertConditions.findIndex(c => c.id === id);
    if (index !== -1) {
      this.alertConditions.splice(index, 1);
      return true;
    }
    return false;
  }

  getAlerts(): Alert[] {
    return [...this.alerts];
  }

  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.entries = [];
    this.errorGroups.clear();
    this.securityEvents = [];
    this.performanceIssues = [];
    this.alerts = [];
    
    // Reset pattern counts
    this.patterns.forEach(pattern => {
      pattern.count = 0;
      pattern.lastMatch = undefined;
      pattern.examples = [];
    });
  }

  /**
   * Get current statistics
   */
  getStatistics(): LogStatistics {
    return this.calculateStatistics();
  }

  /**
   * Private helper methods
   */

  private detectLogFormat(line: string): LogFormat {
    // JSON format detection
    if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
      try {
        JSON.parse(line);
        return 'json';
      } catch {
        // Not valid JSON
      }
    }

    // Apache Combined Log Format
    if (/^\S+ \S+ \S+ \[.+\] ".+" \d+ \d+ ".+" ".+"/.test(line)) {
      return 'combined';
    }

    // Apache Common Log Format
    if (/^\S+ \S+ \S+ \[.+\] ".+" \d+ \d+/.test(line)) {
      return 'apache';
    }

    // Nginx format
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3} - .+ \[.+\] ".+" \d+ \d+ ".+" ".+"/.test(line)) {
      return 'nginx';
    }

    // Syslog format
    if (/^[A-Z][a-z]{2} \d{1,2} \d{2}:\d{2}:\d{2} \S+ \S+/.test(line)) {
      return 'syslog';
    }

    return 'plain';
  }

  private parseJSON(line: string): Partial<LogEntry> {
    const data = JSON.parse(line);
    
    return {
      timestamp: data.timestamp ? new Date(data.timestamp) : 
                data.time ? new Date(data.time) :
                data['@timestamp'] ? new Date(data['@timestamp']) : new Date(),
      level: this.normalizeLogLevel(data.level || data.severity || data.loglevel),
      message: data.message || data.msg || data.log || String(data),
      source: data.source || data.service || data.logger || data.component,
      metadata: { ...data }
    };
  }

  private parseApache(line: string): Partial<LogEntry> {
    // Apache Combined: IP - - [timestamp] "method path protocol" status size "referer" "user-agent"
    const match = line.match(/^(\S+) \S+ \S+ \[([^\]]+)\] "([^"]*)" (\d+) (\d+)(?:\s+"([^"]*)"\s+"([^"]*)")?/);
    
    if (!match) {
      return { message: line };
    }

    const [, ip, timestamp, request, status, size, referer, userAgent] = match;
    const statusCode = parseInt(status);
    
    return {
      timestamp: this.parseApacheTimestamp(timestamp),
      level: statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info',
      message: `${request} - ${status}`,
      source: 'apache',
      metadata: {
        ip,
        request,
        status: statusCode,
        size: parseInt(size),
        referer,
        userAgent
      }
    };
  }

  private parseNginx(line: string): Partial<LogEntry> {
    // Similar to Apache but with slight variations
    const match = line.match(/^(\S+) - (.+) \[([^\]]+)\] "([^"]*)" (\d+) (\d+) "([^"]*)" "([^"]*)"/);
    
    if (!match) {
      return { message: line };
    }

    const [, ip, user, timestamp, request, status, size, referer, userAgent] = match;
    const statusCode = parseInt(status);
    
    return {
      timestamp: this.parseApacheTimestamp(timestamp),
      level: statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info',
      message: `${request} - ${status}`,
      source: 'nginx',
      metadata: {
        ip,
        user,
        request,
        status: statusCode,
        size: parseInt(size),
        referer,
        userAgent
      }
    };
  }

  private parseSyslog(line: string): Partial<LogEntry> {
    // Syslog: Month Day HH:MM:SS hostname process[pid]: message
    const match = line.match(/^([A-Z][a-z]{2})\s+(\d{1,2})\s+(\d{2}:\d{2}:\d{2})\s+(\S+)\s+([^:]+):\s*(.+)/);
    
    if (!match) {
      return { message: line };
    }

    const [, month, day, time, hostname, process, message] = match;
    const timestamp = this.parseSyslogTimestamp(month, day, time);
    
    return {
      timestamp,
      level: this.extractSyslogLevel(message),
      message: message.trim(),
      source: `${hostname}:${process}`,
      metadata: {
        hostname,
        process
      }
    };
  }

  private parsePlainText(line: string): Partial<LogEntry> {
    // Try to extract timestamp from beginning
    const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?)/);
    
    return {
      timestamp: timestampMatch ? new Date(timestampMatch[1]) : new Date(),
      level: this.extractLogLevel(line),
      message: line.replace(/^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?\s*/, ''),
      source: 'plain'
    };
  }

  private normalizeLogLevel(level: string): LogLevel {
    if (!level) return 'unknown';
    
    const normalized = level.toLowerCase();
    
    if (['error', 'err', 'fatal', 'crit', 'critical'].includes(normalized)) return 'error';
    if (['warn', 'warning', 'notice'].includes(normalized)) return 'warn';
    if (['info', 'information'].includes(normalized)) return 'info';
    if (['debug', 'dbg', 'verbose'].includes(normalized)) return 'debug';
    if (['trace', 'finest'].includes(normalized)) return 'trace';
    if (['fatal', 'panic', 'emerg', 'emergency'].includes(normalized)) return 'fatal';
    
    return 'unknown';
  }

  private extractLogLevel(text: string): LogLevel {
    const levelRegex = /\b(error|err|fatal|warn|warning|info|debug|trace|crit|critical|notice|emergency|emerg|panic)\b/i;
    const match = text.match(levelRegex);
    return match ? this.normalizeLogLevel(match[1]) : 'info';
  }

  private extractSyslogLevel(message: string): LogLevel {
    if (/\b(error|err|failed|failure|exception)\b/i.test(message)) return 'error';
    if (/\b(warn|warning|notice)\b/i.test(message)) return 'warn';
    if (/\b(debug|trace)\b/i.test(message)) return 'debug';
    return 'info';
  }

  private parseApacheTimestamp(timestamp: string): Date {
    // Format: 10/Oct/2000:13:55:36 -0700
    const match = timestamp.match(/(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})\s*([+-]\d{4})?/);
    if (!match) return new Date();
    
    const [, day, month, year, hour, minute, second, timezone] = match;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = monthNames.indexOf(month);
    
    return new Date(`${year}-${String(monthIndex + 1).padStart(2, '0')}-${day}T${hour}:${minute}:${second}${timezone || 'Z'}`);
  }

  private parseSyslogTimestamp(month: string, day: string, time: string): Date {
    const currentYear = new Date().getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = monthNames.indexOf(month);
    
    return new Date(`${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-${day.padStart(2, '0')}T${time}`);
  }

  private determineSeverity(level: LogLevel): LogSeverity {
    switch (level) {
      case 'fatal':
      case 'error':
        return 'critical';
      case 'warn':
        return 'medium';
      case 'info':
        return 'low';
      case 'debug':
      case 'trace':
        return 'info';
      default:
        return 'info';
    }
  }

  private categorizeLog(message: string, level: LogLevel): LogCategory {
    const msg = message.toLowerCase();
    
    // Security indicators
    if (/\b(sql injection|xss|csrf|attack|hack|malicious|unauthorized|breach|vulnerability)\b/.test(msg)) {
      return 'security';
    }
    
    // Performance indicators
    if (/\b(slow|timeout|performance|latency|memory|cpu|response time|bottleneck)\b/.test(msg)) {
      return 'performance';
    }
    
    // Database indicators
    if (/\b(database|db|sql|query|connection|transaction|deadlock)\b/.test(msg)) {
      return 'database';
    }
    
    // Network indicators
    if (/\b(network|connection|socket|tcp|udp|http|dns|proxy)\b/.test(msg)) {
      return 'network';
    }
    
    // Access indicators (requests, authentication)
    if (/\b(login|logout|auth|access|request|response|GET|POST|PUT|DELETE)\b/.test(msg)) {
      return 'access';
    }
    
    // System indicators
    if (/\b(system|service|process|thread|memory|disk|cpu|load)\b/.test(msg)) {
      return 'system';
    }
    
    // Error indicators
    if (level === 'error' || level === 'fatal') {
      return 'error';
    }
    
    return 'other';
  }

  private initializeDefaultPatterns(): void {
    const defaultPatterns: LogPattern[] = [
      // Security patterns
      {
        id: 'sql-injection',
        name: 'SQL Injection Attempt',
        pattern: /(\bunion\s+select\b|\bor\s+1\s*=\s*1\b|';\s*(drop|delete|insert|update)\b)/i,
        severity: 'critical',
        category: 'security',
        description: 'Potential SQL injection attack detected',
        enabled: true
      },
      {
        id: 'xss-attempt',
        name: 'XSS Attempt',
        pattern: /<script[^>]*>|javascript:|on\w+\s*=|<iframe[^>]*>/i,
        severity: 'high',
        category: 'security',
        description: 'Potential XSS attack detected',
        enabled: true
      },
      {
        id: 'path-traversal',
        name: 'Path Traversal',
        pattern: /\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\\/i,
        severity: 'high',
        category: 'security',
        description: 'Path traversal attempt detected',
        enabled: true
      },
      {
        id: 'brute-force',
        name: 'Brute Force Attack',
        pattern: /\b(brute\s*force|password\s*attack|login\s*attempt|authentication\s*fail)/i,
        severity: 'high',
        category: 'security',
        description: 'Potential brute force attack',
        enabled: true
      },
      
      // Performance patterns
      {
        id: 'slow-request',
        name: 'Slow Request',
        pattern: /\b(slow|timeout|response\s*time|latency).*?(\d+(?:\.\d+)?)\s*(ms|seconds?|s)\b/i,
        severity: 'medium',
        category: 'performance',
        description: 'Slow request detected',
        enabled: true
      },
      {
        id: 'memory-issue',
        name: 'Memory Issue',
        pattern: /\b(out\s*of\s*memory|memory\s*leak|heap\s*overflow|oom|high\s*memory)/i,
        severity: 'critical',
        category: 'performance',
        description: 'Memory-related issue detected',
        enabled: true
      },
      {
        id: 'database-slow',
        name: 'Slow Database Query',
        pattern: /\b(slow\s*query|database\s*timeout|query\s*execution|db\s*slow)/i,
        severity: 'medium',
        category: 'database',
        description: 'Slow database operation detected',
        enabled: true
      },
      
      // Error patterns
      {
        id: 'unhandled-exception',
        name: 'Unhandled Exception',
        pattern: /\b(unhandled\s*exception|uncaught\s*error|fatal\s*error|stack\s*trace)/i,
        severity: 'critical',
        category: 'error',
        description: 'Unhandled exception or fatal error',
        enabled: true
      },
      {
        id: 'connection-error',
        name: 'Connection Error',
        pattern: /\b(connection\s*(refused|timeout|reset|lost)|network\s*error|socket\s*error)/i,
        severity: 'high',
        category: 'network',
        description: 'Network or connection error',
        enabled: true
      }
    ];

    this.patterns = [...defaultPatterns, ...this.options.customPatterns];
  }

  private initializeDefaultAlerts(): void {
    if (!this.options.realTimeAlerts) return;

    const defaultAlerts: AlertCondition[] = [
      {
        id: 'critical-errors',
        name: 'Critical Errors',
        level: 'error',
        threshold: 5,
        timeWindow: 5, // 5 minutes
        enabled: true,
        action: 'log'
      },
      {
        id: 'security-events',
        name: 'Security Events',
        category: 'security',
        threshold: 1,
        timeWindow: 1,
        enabled: true,
        action: 'log'
      },
      {
        id: 'memory-warnings',
        name: 'Memory Warnings',
        pattern: /\b(out\s*of\s*memory|memory\s*leak|heap\s*overflow)\b/i,
        threshold: 1,
        timeWindow: 1,
        enabled: true,
        action: 'log'
      }
    ];

    this.alertConditions = defaultAlerts;
  }

  private matchPatterns(entry: LogEntry): void {
    for (const pattern of this.patterns) {
      if (!pattern.enabled) continue;

      if (pattern.pattern.test(entry.message)) {
        pattern.count = (pattern.count || 0) + 1;
        pattern.lastMatch = entry.timestamp;
        
        if (!pattern.examples) pattern.examples = [];
        if (pattern.examples.length < 5) {
          pattern.examples.push(entry.message);
        }

        entry.patterns = entry.patterns || [];
        entry.patterns.push(pattern.id);

        this.emit('patternMatched', { pattern, entry });
      }
    }
  }

  private groupError(entry: LogEntry): void {
    const signature = this.generateErrorSignature(entry.message);
    
    if (this.errorGroups.has(signature)) {
      const group = this.errorGroups.get(signature)!;
      group.count++;
      group.lastSeen = entry.timestamp;
      group.entries.push(entry);
      
      // Limit entries per group to prevent memory issues
      if (group.entries.length > 100) {
        group.entries = group.entries.slice(-50);
      }
    } else {
      const group: ErrorGroup = {
        id: randomUUID(),
        signature,
        count: 1,
        firstSeen: entry.timestamp,
        lastSeen: entry.timestamp,
        level: entry.level,
        message: entry.message,
        category: entry.category || 'error',
        entries: [entry]
      };
      
      this.errorGroups.set(signature, group);
    }
  }

  private generateErrorSignature(message: string): string {
    // Normalize the error message to group similar errors
    const normalized = message
      .replace(/\d+/g, 'N')  // Replace numbers
      .replace(/\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/gi, 'UUID') // UUIDs
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, 'IP') // IP addresses
      .replace(/\/[a-zA-Z0-9_\-\/]+/g, '/PATH') // Paths
      .replace(/\b\w+@\w+\.\w+\b/g, 'EMAIL') // Emails
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    return createHash('md5').update(normalized).digest('hex');
  }

  private detectSecurityEvents(entry: LogEntry): void {
    const securityPatterns = this.patterns.filter(p => p.category === 'security' && p.enabled);
    
    for (const pattern of securityPatterns) {
      if (pattern.pattern.test(entry.message)) {
        const event: SecurityEvent = {
          id: randomUUID(),
          type: this.mapPatternToSecurityType(pattern.id),
          severity: pattern.severity,
          timestamp: entry.timestamp,
          source: entry.source || 'unknown',
          details: { pattern: pattern.name, entry: entry.message },
          logEntry: entry,
          riskScore: this.calculateRiskScore(pattern.severity),
          indicators: [pattern.name]
        };
        
        this.securityEvents.push(event);
        this.emit('securityEvent', event);
      }
    }
  }

  private mapPatternToSecurityType(patternId: string): SecurityEventType {
    const mapping: Record<string, SecurityEventType> = {
      'sql-injection': 'sql_injection',
      'xss-attempt': 'xss_attempt',
      'path-traversal': 'path_traversal',
      'brute-force': 'brute_force'
    };
    
    return mapping[patternId] || 'malformed_request';
  }

  private calculateRiskScore(severity: LogSeverity): number {
    const scores = {
      critical: 90,
      high: 70,
      medium: 50,
      low: 30,
      info: 10
    };
    
    return scores[severity] || 10;
  }

  private analyzePerformance(entry: LogEntry): void {
    const performancePatterns = this.patterns.filter(p => p.category === 'performance' && p.enabled);
    
    for (const pattern of performancePatterns) {
      if (pattern.pattern.test(entry.message)) {
        // Extract duration if possible
        const durationMatch = entry.message.match(/(\d+(?:\.\d+)?)\s*(ms|milliseconds?|s|seconds?)/i);
        const duration = durationMatch ? parseFloat(durationMatch[1]) : undefined;
        
        const issue: PerformanceIssue = {
          id: randomUUID(),
          type: this.mapPatternToPerformanceType(pattern.id),
          severity: pattern.severity,
          timestamp: entry.timestamp,
          duration,
          threshold: this.options.slowRequestThreshold,
          details: { pattern: pattern.name, entry: entry.message },
          logEntry: entry,
          impact: this.describePerformanceImpact(pattern.id),
          suggestions: this.getPerformanceSuggestions(pattern.id)
        };
        
        this.performanceIssues.push(issue);
        this.emit('performanceIssue', issue);
      }
    }
  }

  private mapPatternToPerformanceType(patternId: string): PerformanceIssueType {
    const mapping: Record<string, PerformanceIssueType> = {
      'slow-request': 'slow_request',
      'memory-issue': 'high_memory',
      'database-slow': 'database_slow'
    };
    
    return mapping[patternId] || 'slow_request';
  }

  private describePerformanceImpact(patternId: string): string {
    const impacts: Record<string, string> = {
      'slow-request': 'User experience degradation, potential timeouts',
      'memory-issue': 'System instability, potential crashes',
      'database-slow': 'Application bottleneck, poor user experience'
    };
    
    return impacts[patternId] || 'Unknown performance impact';
  }

  private getPerformanceSuggestions(patternId: string): string[] {
    const suggestions: Record<string, string[]> = {
      'slow-request': [
        'Optimize database queries',
        'Implement caching',
        'Review algorithmic complexity',
        'Consider load balancing'
      ],
      'memory-issue': [
        'Profile memory usage',
        'Fix memory leaks',
        'Optimize data structures',
        'Implement garbage collection tuning'
      ],
      'database-slow': [
        'Add database indexes',
        'Optimize queries',
        'Consider connection pooling',
        'Review database configuration'
      ]
    };
    
    return suggestions[patternId] || ['Review and optimize code'];
  }

  private checkAlerts(entry: LogEntry): void {
    const now = entry.timestamp;
    
    for (const condition of this.alertConditions) {
      if (!condition.enabled) continue;
      
      let matches = false;
      
      // Check pattern match
      if (condition.pattern && condition.pattern.test(entry.message)) {
        matches = true;
      }
      
      // Check level match
      if (condition.level && entry.level === condition.level) {
        matches = true;
      }
      
      // Check category match
      if (condition.category && entry.category === condition.category) {
        matches = true;
      }
      
      if (matches) {
        // Count recent matches within time window
        const windowStart = new Date(now.getTime() - (condition.timeWindow || 5) * 60 * 1000);
        const recentEntries = this.entries.filter(e => 
          e.timestamp >= windowStart && e.timestamp <= now
        );
        
        const matchingEntries = recentEntries.filter(e => {
          if (condition.pattern && !condition.pattern.test(e.message)) return false;
          if (condition.level && e.level !== condition.level) return false;
          if (condition.category && e.category !== condition.category) return false;
          return true;
        });
        
        if (matchingEntries.length >= (condition.threshold || 1)) {
          const alert: Alert = {
            id: randomUUID(),
            condition,
            timestamp: now,
            count: matchingEntries.length,
            entries: matchingEntries,
            severity: this.determineSeverity(entry.level),
            message: `Alert triggered: ${condition.name} (${matchingEntries.length} occurrences)`
          };
          
          this.alerts.push(alert);
          this.emit('alert', alert);
        }
      }
    }
  }

  private calculateStatistics(): LogStatistics {
    if (this.entries.length === 0) {
      return {
        totalEntries: 0,
        entriesByLevel: {} as Record<LogLevel, number>,
        entriesByCategory: {} as Record<LogCategory, number>,
        entriesBySource: {},
        errorRate: 0,
        timespan: { start: new Date(), end: new Date(), duration: 0 },
        patterns: { matched: 0, total: this.patterns.length, byPattern: {} },
        trends: { errorsPerHour: 0, warningsPerHour: 0, peakHour: new Date(), quietHour: new Date() }
      };
    }

    const entries = [...this.entries].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const start = entries[0].timestamp;
    const end = entries[entries.length - 1].timestamp;
    const duration = end.getTime() - start.getTime();

    const entriesByLevel: Record<LogLevel, number> = {
      error: 0, warn: 0, info: 0, debug: 0, trace: 0, fatal: 0, unknown: 0
    };
    
    const entriesByCategory: Record<LogCategory, number> = {
      security: 0, performance: 0, error: 0, access: 0, system: 0, database: 0, network: 0, other: 0
    };
    
    const entriesBySource: Record<string, number> = {};

    for (const entry of this.entries) {
      entriesByLevel[entry.level]++;
      entriesByCategory[entry.category || 'other']++;
      
      const source = entry.source || 'unknown';
      entriesBySource[source] = (entriesBySource[source] || 0) + 1;
    }

    const errorCount = entriesByLevel.error + entriesByLevel.fatal;
    const errorRate = this.entries.length > 0 ? errorCount / this.entries.length : 0;

    // Calculate hourly trends
    const hoursInTimespan = Math.max(1, duration / (1000 * 60 * 60));
    const errorsPerHour = errorCount / hoursInTimespan;
    const warningsPerHour = entriesByLevel.warn / hoursInTimespan;

    // Find peak and quiet hours (simplified)
    const peakHour = end; // Most recent as peak
    const quietHour = start; // Earliest as quiet

    const patternStats = {
      matched: this.patterns.filter(p => p.count && p.count > 0).length,
      total: this.patterns.length,
      byPattern: Object.fromEntries(
        this.patterns.map(p => [p.name, p.count || 0])
      )
    };

    return {
      totalEntries: this.entries.length,
      entriesByLevel,
      entriesByCategory,
      entriesBySource,
      errorRate,
      timespan: { start, end, duration },
      patterns: patternStats,
      trends: { errorsPerHour, warningsPerHour, peakHour, quietHour }
    };
  }

  private generateTimeline(): TimelineBucket[] {
    if (this.entries.length === 0) return [];

    const bucketSizeMs = this.options.timelineBucketSize * 60 * 1000;
    const entries = [...this.entries].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const start = entries[0].timestamp;
    const end = entries[entries.length - 1].timestamp;
    
    const buckets: Map<number, TimelineBucket> = new Map();

    for (const entry of entries) {
      const bucketTime = Math.floor(entry.timestamp.getTime() / bucketSizeMs) * bucketSizeMs;
      
      if (!buckets.has(bucketTime)) {
        buckets.set(bucketTime, {
          timestamp: new Date(bucketTime),
          count: 0,
          errorCount: 0,
          warnCount: 0,
          infoCount: 0,
          debugCount: 0,
          levels: { error: 0, warn: 0, info: 0, debug: 0, trace: 0, fatal: 0, unknown: 0 },
          categories: { security: 0, performance: 0, error: 0, access: 0, system: 0, database: 0, network: 0, other: 0 },
          patterns: {}
        });
      }
      
      const bucket = buckets.get(bucketTime)!;
      bucket.count++;
      bucket.levels[entry.level]++;
      bucket.categories[entry.category || 'other']++;
      
      // Count specific level types for easier access
      if (entry.level === 'error' || entry.level === 'fatal') bucket.errorCount++;
      else if (entry.level === 'warn') bucket.warnCount++;
      else if (entry.level === 'info') bucket.infoCount++;
      else if (entry.level === 'debug') bucket.debugCount++;
      
      // Count pattern matches
      if (entry.patterns) {
        for (const patternId of entry.patterns) {
          bucket.patterns[patternId] = (bucket.patterns[patternId] || 0) + 1;
        }
      }
    }

    return Array.from(buckets.values()).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private generateRecommendations(): { immediate: string[]; shortTerm: string[]; longTerm: string[]; patterns: string[] } {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];
    const patterns: string[] = [];

    const stats = this.calculateStatistics();

    // Immediate actions based on critical issues
    if (this.securityEvents.some(e => e.severity === 'critical')) {
      immediate.push('Address critical security vulnerabilities immediately');
      immediate.push('Review and strengthen authentication mechanisms');
    }

    if (stats.errorRate > 0.1) {
      immediate.push('Investigate high error rate (>10%)');
      immediate.push('Review recent deployments or changes');
    }

    if (this.performanceIssues.some(p => p.severity === 'critical')) {
      immediate.push('Resolve critical performance issues');
      immediate.push('Monitor system resources and scale if necessary');
    }

    // Short-term improvements
    if (stats.entriesByLevel.warn > stats.totalEntries * 0.2) {
      shortTerm.push('Reduce warning count - currently >20% of all logs');
      shortTerm.push('Implement proper error handling for warning scenarios');
    }

    if (Object.keys(stats.entriesBySource).length > 10) {
      shortTerm.push('Implement centralized logging for better log management');
      shortTerm.push('Standardize log formats across services');
    }

    if (this.errorGroups.size > 5) {
      shortTerm.push('Implement proper error grouping and alerting');
      shortTerm.push('Create error tracking and resolution workflow');
    }

    // Long-term strategies
    longTerm.push('Implement comprehensive monitoring and alerting strategy');
    longTerm.push('Establish log retention and archival policies');
    longTerm.push('Create automated log analysis and reporting');
    longTerm.push('Implement proactive error detection and prevention');

    // Pattern-specific recommendations
    const activePatterns = this.patterns.filter(p => p.count && p.count > 0);
    
    if (activePatterns.some(p => p.category === 'security')) {
      patterns.push('Implement Web Application Firewall (WAF)');
      patterns.push('Enhance input validation and sanitization');
    }

    if (activePatterns.some(p => p.category === 'performance')) {
      patterns.push('Implement performance monitoring and profiling');
      patterns.push('Optimize slow operations and database queries');
    }

    if (activePatterns.length > this.patterns.length * 0.5) {
      patterns.push('Review and tune pattern detection rules');
      patterns.push('Implement pattern-based automated responses');
    }

    return { immediate, shortTerm, longTerm, patterns };
  }

  private escapeHtml(text: string): string {
    const div = { innerHTML: text } as any;
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

/**
 * Factory function for quick log analyzer creation
 */
export function createLogAnalyzer(options?: LogAnalyzerOptions): LogAnalyzer {
  return new LogAnalyzer(options);
}

/**
 * Quick log file analysis function
 */
export async function analyzeLogFile(
  filePath: string, 
  options?: LogAnalyzerOptions & { format?: LogFormat }
): Promise<LogAnalysisReport> {
  const analyzer = createLogAnalyzer(options);
  await analyzer.parseFile(filePath, options?.format);
  return analyzer.generateReport();
}

/**
 * Utility function to analyze log text directly
 */
export function analyzeLogText(
  logText: string,
  options?: LogAnalyzerOptions & { format?: LogFormat }
): LogAnalysisReport {
  const analyzer = createLogAnalyzer(options);
  const lines = logText.split('\n');
  
  for (const line of lines) {
    const entry = analyzer.parseLogEntry(line, options?.format);
    if (entry) {
      analyzer.addEntry(entry);
    }
  }
  
  return analyzer.generateReport();
}

/**
 * Create a real-time log monitor from a stream
 */
export function createLogMonitor(
  source: ReadStream | Readable,
  options?: LogAnalyzerOptions & LogStreamOptions
): { analyzer: LogAnalyzer; stream: Transform } {
  const analyzer = createLogAnalyzer(options);
  const stream = analyzer.createLogStream(source, options);
  
  return { analyzer, stream };
}

/**
 * Export all types and utilities
 */
export type * from './types';