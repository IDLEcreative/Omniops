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

// Execution Tracer Types
export interface TraceEntry {
  id: string;
  type: 'entry' | 'exit' | 'error' | 'async_start' | 'async_end';
  functionName: string;
  className?: string;
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
  timestamp: number;
  duration?: number;
  depth: number;
  callId: string;
  parentCallId?: string;
  args?: unknown[];
  result?: unknown;
  error?: Error;
  stackTrace?: string[];
  isAsync: boolean;
  asyncId?: string;
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
}

export interface CallStats {
  count: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  errorCount: number;
  lastCalled: number;
  recursiveCount: number;
  asyncCount: number;
}

export interface CallGraph {
  nodes: CallGraphNode[];
  edges: CallGraphEdge[];
  stats: Record<string, CallStats>;
}

export interface CallGraphNode {
  id: string;
  functionName: string;
  className?: string;
  fileName?: string;
  calls: number;
  selfTime: number;
  totalTime: number;
  errors: number;
  isAsync: boolean;
}

export interface CallGraphEdge {
  from: string;
  to: string;
  calls: number;
  totalTime: number;
}

export interface SequenceDiagram {
  participants: string[];
  interactions: SequenceInteraction[];
  mermaidCode: string;
}

export interface SequenceInteraction {
  from: string;
  to: string;
  message: string;
  type: 'call' | 'return' | 'error';
  timestamp: number;
  duration?: number;
  isAsync: boolean;
}

export interface ChromeTraceEvent {
  name: string;
  cat: string;
  ph: 'B' | 'E' | 'X' | 'i' | 'I'; // Begin, End, Complete, Instant, Counter
  ts: number; // timestamp in microseconds
  dur?: number; // duration in microseconds
  pid: number; // process id
  tid: number; // thread id
  args?: Record<string, unknown>;
  stack?: string[];
}

export interface ChromeTraceFormat {
  traceEvents: ChromeTraceEvent[];
  displayTimeUnit: 'ms' | 'ns';
  systemTraceEvents?: string;
  otherData?: Record<string, unknown>;
}

export interface ExecutionTimeline {
  startTime: number;
  endTime: number;
  duration: number;
  totalCalls: number;
  maxDepth: number;
  entries: TraceEntry[];
  summary: {
    functionCalls: number;
    asyncCalls: number;
    errors: number;
    uniqueFunctions: number;
    deepestCall: number;
  };
}

export interface TracerOptions {
  maxDepth?: number;
  maxHistory?: number;
  trackArgs?: boolean;
  trackReturnValues?: boolean;
  trackMemory?: boolean;
  trackStackTrace?: boolean;
  excludePatterns?: RegExp[];
  includePatterns?: RegExp[];
  asyncTracking?: boolean;
  memoryBounded?: boolean;
  memoryLimit?: number; // bytes
  enableSourceMap?: boolean;
  sampleRate?: number; // 0-1, for performance
}

export interface AutoInstrumentTracerOptions {
  includePrivate?: boolean;
  includeGetters?: boolean;
  includeSetters?: boolean;
  excludeConstructor?: boolean;
  excludePatterns?: RegExp[];
  maxDepth?: number;
  trackArgs?: boolean;
  trackReturnValues?: boolean;
}

export interface TraceReport {
  summary: {
    totalCalls: number;
    totalTime: number;
    maxDepth: number;
    errorRate: number;
    asyncCallsPercent: number;
    topFunctions: Array<{ name: string; calls: number; time: number }>;
    slowestFunctions: Array<{ name: string; avgTime: number; maxTime: number }>;
    mostCalledFunctions: Array<{ name: string; calls: number; totalTime: number }>;
  };
  callGraph: CallGraph;
  timeline: ExecutionTimeline;
  sequenceDiagram: SequenceDiagram;
  performance: {
    memoryLeaks: Array<{ function: string; growthRate: number }>;
    bottlenecks: Array<{ function: string; impact: number; reason: string }>;
    recursionIssues: Array<{ function: string; maxDepth: number; calls: number }>;
  };
  recommendations: string[];
  exportFormats: {
    chrome?: ChromeTraceFormat;
    mermaid?: string;
    json?: string;
    csv?: string;
  };
  generatedAt: number;
}

// Memory Monitor Types
export interface MemoryUsage {
  rss: number;           // Resident Set Size
  heapTotal: number;     // Total allocated heap
  heapUsed: number;      // Actually used heap
  external: number;      // C++ objects bound to JavaScript
  arrayBuffers: number;  // ArrayBuffers and SharedArrayBuffers
}

export interface MemorySnapshot {
  timestamp: number;
  usage: MemoryUsage;
  metadata?: {
    gcCount?: number;
    gcTime?: number;
    objectCount?: number;
    generation?: number;
  };
}

export interface MemoryTrend {
  slope: number;         // Linear regression slope (bytes/ms)
  correlation: number;   // R-squared value (0-1)
  isIncreasing: boolean;
  growthRate: number;    // bytes/second
  prediction?: {
    nextValue: number;
    confidence: number;
  };
}

export interface MemoryLeak {
  id: string;
  detectedAt: number;
  confidence: number;    // 0-1, how confident we are it's a leak
  growthRate: number;    // bytes/second
  trend: MemoryTrend;
  snapshots: MemorySnapshot[];
  source?: {
    objects?: WeakRef<object>[];
    functions?: string[];
    callstack?: string[];
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  suggestions: string[];
}

export interface ObjectTracking {
  id: string;
  type: string;
  constructor: string;
  createdAt: number;
  weakRef: WeakRef<object>;
  isAlive: boolean;
  lastSeen: number;
  location?: {
    file?: string;
    line?: number;
    function?: string;
  };
}

export interface GCEvent {
  timestamp: number;
  type: 'scavenge' | 'mark-sweep' | 'incremental' | 'weak-callback' | 'unknown';
  duration: number;      // milliseconds
  memoryBefore: MemoryUsage;
  memoryAfter: MemoryUsage;
  freed: number;         // bytes freed
  collections: number;   // number of GC cycles
}

export interface MemoryPressure {
  level: 'normal' | 'moderate' | 'critical';
  timestamp: number;
  usage: MemoryUsage;
  thresholds: {
    heapUsedPercent: number;
    rssPercent: number;
    externalPercent: number;
  };
  impact: {
    performanceDegradation: number; // 0-1
    riskOfOOM: number;             // 0-1
    gcPressure: number;            // 0-1
  };
  recommendations: string[];
}

export interface MemoryAlert {
  id: string;
  type: 'leak' | 'pressure' | 'growth' | 'threshold' | 'gc';
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: number;
  message: string;
  details: Record<string, unknown>;
  acknowledged: boolean;
  resolvedAt?: number;
}

export interface MemoryMonitorOptions {
  samplingInterval?: number;      // milliseconds, default: 1000
  historySize?: number;          // max snapshots to keep, default: 1000
  leakDetectionThreshold?: number; // growth rate in bytes/second, default: 1MB/s
  pressureThresholds?: {
    heapUsed?: number;           // percentage, default: 80
    rss?: number;                // percentage, default: 85
    external?: number;           // percentage, default: 75
  };
  enableObjectTracking?: boolean; // track specific objects, default: false
  enableGCMonitoring?: boolean;   // monitor garbage collection, default: true
  enableHeapDump?: boolean;       // support heap dump generation, default: false
  alertThresholds?: {
    memoryGrowth?: number;        // bytes/second
    gcFrequency?: number;         // GCs per minute
    heapUsage?: number;           // percentage
  };
  retentionPeriod?: number;       // milliseconds, how long to keep history
  autoCleanup?: boolean;          // automatically clean old data
  enableRegression?: boolean;     // enable trend analysis
  regressionWindowSize?: number;  // number of samples for trend analysis
  enablePrediction?: boolean;     // enable memory usage prediction
}

export interface MemoryStatistics {
  totalSamples: number;
  timespan: {
    start: number;
    end: number;
    duration: number;
  };
  usage: {
    current: MemoryUsage;
    min: MemoryUsage;
    max: MemoryUsage;
    avg: MemoryUsage;
    peak: MemoryUsage;
    peakTime: number;
  };
  trends: {
    rss: MemoryTrend;
    heapTotal: MemoryTrend;
    heapUsed: MemoryTrend;
    external: MemoryTrend;
    arrayBuffers: MemoryTrend;
  };
  gc: {
    totalEvents: number;
    totalTime: number;
    avgTime: number;
    frequency: number;        // events per minute
    totalFreed: number;
    avgFreed: number;
    lastEvent?: GCEvent;
  };
  leaks: {
    detected: MemoryLeak[];
    suspected: number;
    confirmed: number;
    totalGrowthRate: number;
  };
  pressure: {
    current: MemoryPressure;
    events: number;
    criticalEvents: number;
    avgLevel: number;
  };
  objects: {
    tracked: number;
    alive: number;
    collected: number;
    leaking: number;
  };
}

export interface MemoryReport {
  summary: {
    status: 'healthy' | 'warning' | 'critical';
    totalIssues: number;
    memoryLeaks: number;
    pressureEvents: number;
    gcIssues: number;
    recommendations: string[];
  };
  statistics: MemoryStatistics;
  leaks: MemoryLeak[];
  alerts: MemoryAlert[];
  gcEvents: GCEvent[];
  pressureEvents: MemoryPressure[];
  objectTracking?: {
    summary: {
      totalObjects: number;
      aliveObjects: number;
      suspectedLeaks: number;
    };
    objects: ObjectTracking[];
  };
  exportData?: {
    csv?: string;
    json?: string;
    heapDump?: string;
  };
  generatedAt: number;
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

export interface HeapDumpOptions {
  filename?: string;
  format?: 'heapsnapshot' | 'json';
  compress?: boolean;
  includeStats?: boolean;
}

export interface MemoryComparisonResult {
  baseline: MemorySnapshot;
  current: MemorySnapshot;
  diff: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  percentageChange: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  significant: boolean;    // if changes exceed threshold
  threshold: number;       // percentage threshold used
  analysis: {
    isMemoryGrowing: boolean;
    growthRate: number;
    projectedUsage?: number;
    timeToLimit?: number;
  };
}

// Load Tester Types
export interface LoadTestRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  body?: string | Buffer;
  timeout?: number;
  retries?: number;
  startTime: number;
  endTime?: number;
  duration?: number;
  responseSize?: number;
  statusCode?: number;
  error?: Error;
  success: boolean;
  attempt: number;
  phase: LoadTestPhase;
}

export type LoadTestPhase = 'warmup' | 'rampup' | 'sustained' | 'cooldown' | 'stress';

export interface LoadTestWorker {
  id: string;
  startTime: number;
  endTime?: number;
  requestsCompleted: number;
  requestsFailed: number;
  totalDuration: number;
  avgResponseTime: number;
  isActive: boolean;
}

export interface LoadTestMetrics {
  startTime: number;
  endTime?: number;
  totalDuration: number;
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  successRate: number;
  errorRate: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  statusCodeDistribution: Record<number, number>;
  errorDistribution: Record<string, number>;
  bytesTransferred: number;
  averageThroughput: number; // bytes per second
  phase: LoadTestPhase;
  activeConnections: number;
  maxConcurrentRequests: number;
}

export interface LoadTestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  body?: string | Buffer;
  timeout?: number;
  retries?: number;
  
  // Load characteristics
  concurrency: number;        // number of concurrent workers
  requestsPerSecond?: number; // target RPS (rate limiting)
  totalRequests?: number;     // total requests to send
  duration?: number;          // test duration in milliseconds
  
  // Test phases
  warmupDuration?: number;    // warmup phase duration (ms)
  rampupDuration?: number;    // rampup phase duration (ms)
  rampupTarget?: number;      // target concurrency during rampup
  sustainedDuration?: number; // sustained load duration (ms)
  cooldownDuration?: number;  // cooldown phase duration (ms)
  
  // Stress testing
  enableStressTesting?: boolean;
  stressMaxConcurrency?: number;
  stressRampupStep?: number;
  stressStepDuration?: number;
  
  // Connection options
  keepAlive?: boolean;
  maxSockets?: number;
  maxSocketsPerHost?: number;
  
  // Reporting
  reportingInterval?: number; // progress report interval (ms)
  enableRealTimeStats?: boolean;
  
  // Stop conditions
  maxErrors?: number;         // stop test if error count exceeds this
  maxErrorRate?: number;      // stop test if error rate exceeds this (0-1)
  targetResponseTime?: number; // stop if response time exceeds this consistently
}

export interface LoadTestProgress {
  phase: LoadTestPhase;
  currentConcurrency: number;
  targetConcurrency: number;
  progress: number; // 0-1, overall test progress
  phaseProgress: number; // 0-1, current phase progress
  elapsedTime: number;
  remainingTime?: number;
  currentMetrics: LoadTestMetrics;
  recentResponseTimes: number[]; // last N response times for trend analysis
  isStable: boolean; // if metrics are stable in current phase
  recommendations: string[];
}

export interface LoadTestResult {
  config: LoadTestConfig;
  phases: Record<LoadTestPhase, LoadTestMetrics>;
  overallMetrics: LoadTestMetrics;
  timeline: Array<{
    timestamp: number;
    metrics: LoadTestMetrics;
    phase: LoadTestPhase;
  }>;
  requests: LoadTestRequest[];
  workers: LoadTestWorker[];
  errors: Array<{
    timestamp: number;
    error: Error;
    request: Partial<LoadTestRequest>;
    phase: LoadTestPhase;
  }>;
  performance: {
    bottlenecks: Array<{
      type: 'response_time' | 'error_rate' | 'throughput' | 'connection_limit';
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      value: number;
      threshold: number;
      impact: string;
      suggestions: string[];
    }>;
    scalability: {
      maxStableRPS: number;
      maxStableConcurrency: number;
      breakingPoint?: number;
      scalabilityFactor: number; // how well it scales with concurrency
    };
    reliability: {
      meanTimeBetweenFailures: number;
      errorClusters: Array<{
        startTime: number;
        endTime: number;
        errorCount: number;
        dominantError: string;
      }>;
      stabilityScore: number; // 0-1, how stable the performance is
    };
  };
  recommendations: {
    immediate: string[];
    capacity: string[];
    optimization: string[];
    monitoring: string[];
  };
  summary: {
    status: 'completed' | 'failed' | 'stopped' | 'error';
    duration: number;
    peakRPS: number;
    averageRPS: number;
    totalDataTransferred: string;
    overallScore: number; // 0-100, overall performance score
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
  };
  exportData?: {
    json?: string;
    csv?: string;
    html?: string;
    har?: string; // HTTP Archive format
  };
  generatedAt: number;
}

export interface LoadTestOptions {
  agent?: any; // http.Agent or https.Agent
  enableMetricsCollection?: boolean;
  enableRequestSampling?: boolean;
  requestSampleRate?: number; // 0-1, what percentage of requests to store
  enableErrorSampling?: boolean;
  errorSampleRate?: number;
  maxStoredRequests?: number;
  maxStoredErrors?: number;
  enableProgressCallback?: boolean;
  progressCallback?: (progress: LoadTestProgress) => void;
  enableJitter?: boolean; // add random jitter to request timing
  jitterPercent?: number; // 0-100, percentage of jitter to add
  validateResponse?: (response: any) => boolean;
  customErrorClassifier?: (error: Error) => string;
  enableResourceMonitoring?: boolean; // monitor CPU, memory during test
  gracefulShutdown?: boolean;
  shutdownTimeout?: number;
}

export interface ConnectionPoolStats {
  created: number;
  destroyed: number;
  active: number;
  idle: number;
  pending: number;
  errors: number;
  timeouts: number;
  avgConnectionTime: number;
  maxConnectionTime: number;
  reuseCount: number;
}

export interface LoadTestStats {
  startTime: number;
  endTime?: number;
  phases: Record<LoadTestPhase, LoadTestMetrics>;
  currentPhase: LoadTestPhase;
  overallMetrics: LoadTestMetrics;
  connectionPool?: ConnectionPoolStats;
  resourceUsage?: {
    cpu: Array<{ timestamp: number; usage: number }>;
    memory: Array<{ timestamp: number; usage: number }>;
    network: Array<{ timestamp: number; bytesIn: number; bytesOut: number }>;
  };
  timeline: Array<{
    timestamp: number;
    metrics: LoadTestMetrics;
    phase: LoadTestPhase;
    events: string[];
  }>;
}