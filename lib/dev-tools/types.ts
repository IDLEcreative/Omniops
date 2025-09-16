/**
 * Shared types for universal developer tools
 */

export interface PerformanceMetrics {
  duration: number;
  memoryUsed: number;
  timestamp: number;
  args?: unknown[];
  result?: unknown;
  error?: Error;
}

export interface FunctionCallInfo {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  memoryBefore: number;
  memoryAfter: number;
  memoryDelta: number;
  args: unknown[];
  result?: unknown;
  error?: Error;
  callStack: string[];
}

export interface ProfilerStats {
  count: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  p50: number;
  p95: number;
  p99: number;
  totalMemory: number;
  avgMemory: number;
  errorCount: number;
}

export interface MemorySnapshot {
  used: number;
  total: number;
  external: number;
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
}

export interface ChromeDevToolsProfile {
  version: string;
  type: string;
  title: string;
  nodes: ChromeProfileNode[];
  startTime: number;
  endTime: number;
  samples: number[];
  timeDeltas: number[];
}

export interface ChromeProfileNode {
  id: number;
  callFrame: {
    functionName: string;
    scriptId: string;
    url: string;
    lineNumber: number;
    columnNumber: number;
  };
  hitCount: number;
  children?: number[];
}

export interface ProfilerReport {
  summary: {
    totalFunctions: number;
    totalCalls: number;
    totalTime: number;
    totalMemory: number;
    topBottlenecks: string[];
  };
  functions: Record<string, ProfilerStats>;
  memoryLeaks: {
    suspected: boolean;
    growthRate: number;
    snapshots: MemorySnapshot[];
  };
  recommendations: string[];
  timestamp: number;
}

export interface AutoInstrumentOptions {
  includePrivate?: boolean;
  excludePatterns?: RegExp[];
  maxCallStackDepth?: number;
  trackMemory?: boolean;
  sampleRate?: number;
}

export interface ProfilerOptions {
  trackMemory?: boolean;
  maxHistory?: number;
  autoFlush?: boolean;
  flushInterval?: number;
  enableCallStack?: boolean;
  maxCallStackDepth?: number;
}

// Query Inspector Types
export interface QueryExecution {
  id: string;
  query: string;
  normalizedQuery: string;
  startTime: number;
  endTime: number;
  duration: number;
  rowCount?: number;
  affectedRows?: number;
  error?: Error;
  stackTrace: string[];
  timestamp: number;
  params?: unknown[];
  method?: string;
  table?: string;
}

export interface QueryPattern {
  normalizedQuery: string;
  count: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  errorCount: number;
  lastSeen: number;
  tables: Set<string>;
  methods: Set<string>;
}

export interface NPlusOneDetection {
  pattern: string;
  occurrences: number;
  totalTime: number;
  queries: QueryExecution[];
  confidence: number; // 0-1, how confident we are it's N+1
}

export interface SlowQuery {
  execution: QueryExecution;
  reason: 'duration' | 'rows' | 'frequency';
  severity: 'warning' | 'critical';
}

export interface QueryInspectorStats {
  totalQueries: number;
  totalTime: number;
  avgTime: number;
  slowQueries: SlowQuery[];
  nPlusOneIssues: NPlusOneDetection[];
  errorRate: number;
  patterns: QueryPattern[];
  topTables: Array<{ table: string; count: number; time: number }>;
  recommendations: string[];
}

export interface QueryInspectorOptions {
  slowQueryThreshold?: number; // milliseconds
  maxHistorySize?: number;
  trackStackTrace?: boolean;
  enableNPlusOneDetection?: boolean;
  enablePatternAnalysis?: boolean;
  nPlusOneThreshold?: number; // minimum occurrences to flag as N+1
  nPlusOneTimeWindow?: number; // milliseconds to look for patterns
  autoReport?: boolean;
  reportInterval?: number; // milliseconds
}

// Log Analyzer Types
export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  source?: string;
  metadata?: Record<string, unknown>;
  raw?: string;
  format?: LogFormat;
  patterns?: string[];
  severity?: LogSeverity;
  category?: LogCategory;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'fatal' | 'unknown';
export type LogFormat = 'json' | 'apache' | 'nginx' | 'syslog' | 'plain' | 'combined' | 'custom';
export type LogSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type LogCategory = 'security' | 'performance' | 'error' | 'access' | 'system' | 'database' | 'network' | 'other';

export interface LogPattern {
  id: string;
  name: string;
  pattern: RegExp;
  severity: LogSeverity;
  category: LogCategory;
  description: string;
  enabled: boolean;
  count?: number;
  lastMatch?: Date;
  examples?: string[];
}

export interface ErrorGroup {
  id: string;
  signature: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  level: LogLevel;
  message: string;
  category: LogCategory;
  entries: LogEntry[];
  similarity?: number;
  resolved?: boolean;
}

export interface TimelineBucket {
  timestamp: Date;
  count: number;
  errorCount: number;
  warnCount: number;
  infoCount: number;
  debugCount: number;
  levels: Record<LogLevel, number>;
  categories: Record<LogCategory, number>;
  patterns: Record<string, number>;
}

export interface LogStatistics {
  totalEntries: number;
  entriesByLevel: Record<LogLevel, number>;
  entriesByCategory: Record<LogCategory, number>;
  entriesBySource: Record<string, number>;
  errorRate: number;
  timespan: {
    start: Date;
    end: Date;
    duration: number;
  };
  patterns: {
    matched: number;
    total: number;
    byPattern: Record<string, number>;
  };
  trends: {
    errorsPerHour: number;
    warningsPerHour: number;
    peakHour: Date;
    quietHour: Date;
  };
}

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: LogSeverity;
  timestamp: Date;
  source: string;
  details: Record<string, unknown>;
  logEntry: LogEntry;
  riskScore: number; // 0-100
  indicators: string[];
}

export type SecurityEventType = 
  | 'sql_injection'
  | 'xss_attempt'
  | 'path_traversal'
  | 'brute_force'
  | 'unusual_traffic'
  | 'malformed_request'
  | 'privilege_escalation'
  | 'data_exfiltration'
  | 'suspicious_user_agent'
  | 'rate_limit_exceeded'
  | 'authentication_failure'
  | 'unauthorized_access';

export interface PerformanceIssue {
  id: string;
  type: PerformanceIssueType;
  severity: LogSeverity;
  timestamp: Date;
  duration?: number;
  threshold?: number;
  details: Record<string, unknown>;
  logEntry: LogEntry;
  impact: string;
  suggestions: string[];
}

export type PerformanceIssueType = 
  | 'slow_request'
  | 'high_memory'
  | 'high_cpu'
  | 'timeout'
  | 'connection_pool_exhausted'
  | 'database_slow'
  | 'cache_miss'
  | 'large_payload'
  | 'queue_backlog';

export interface LogAnalyzerOptions {
  maxEntries?: number;
  enablePatternMatching?: boolean;
  enableErrorGrouping?: boolean;
  enableSecurityDetection?: boolean;
  enablePerformanceAnalysis?: boolean;
  customPatterns?: LogPattern[];
  errorGroupingSimilarity?: number; // 0-1
  timelineBucketSize?: number; // minutes
  memoryThreshold?: number; // MB
  slowRequestThreshold?: number; // milliseconds
  realTimeAlerts?: boolean;
  retentionPeriod?: number; // days
}

export interface LogAnalysisReport {
  summary: {
    totalEntries: number;
    timespan: { start: Date; end: Date };
    errorRate: number;
    criticalIssues: number;
    securityEvents: number;
    performanceIssues: number;
  };
  statistics: LogStatistics;
  errorGroups: ErrorGroup[];
  securityEvents: SecurityEvent[];
  performanceIssues: PerformanceIssue[];
  timeline: TimelineBucket[];
  patterns: {
    matched: LogPattern[];
    recommendations: string[];
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  exportData?: {
    json?: string;
    csv?: string;
    html?: string;
  };
  generatedAt: Date;
}

export interface LogStreamOptions {
  encoding?: BufferEncoding;
  highWaterMark?: number;
  objectMode?: boolean;
  parseLines?: boolean;
  skipEmpty?: boolean;
}

export interface AlertCondition {
  id: string;
  name: string;
  pattern?: RegExp;
  level?: LogLevel;
  category?: LogCategory;
  threshold?: number;
  timeWindow?: number; // minutes
  enabled: boolean;
  action: AlertAction;
}

export type AlertAction = 'log' | 'email' | 'webhook' | 'slack' | 'custom';

export interface Alert {
  id: string;
  condition: AlertCondition;
  timestamp: Date;
  count: number;
  entries: LogEntry[];
  severity: LogSeverity;
  message: string;
}