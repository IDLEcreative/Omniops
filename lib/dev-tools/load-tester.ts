/**
 * Universal Load Tester
 * Zero-dependency HTTP load testing tool with comprehensive metrics
 */

import { EventEmitter } from 'events';
import { URL } from 'url';
import http from 'http';
import https from 'https';
import { randomUUID } from 'crypto';
import {
  LoadTestConfig,
  LoadTestOptions,
  LoadTestRequest,
  LoadTestWorker,
  LoadTestMetrics,
  LoadTestProgress,
  LoadTestResult,
  LoadTestStats,
  LoadTestPhase,
  ConnectionPoolStats
} from './types';

/**
 * High-performance load testing utility with advanced metrics
 */
export class LoadTester extends EventEmitter {
  private config: LoadTestConfig;
  private options: LoadTestOptions;
  private isRunning = false;
  private isPaused = false;
  private shouldStop = false;
  private workers: Map<string, LoadTestWorker> = new Map();
  private requests: LoadTestRequest[] = [];
  private errors: Array<{ timestamp: number; error: Error; request: Partial<LoadTestRequest>; phase: LoadTestPhase }> = [];
  private stats!: LoadTestStats;
  private agent!: http.Agent | https.Agent;
  private startTime = 0;
  private endTime = 0;
  private currentPhase: LoadTestPhase = 'warmup';
  private phaseStartTime = 0;
  private rateLimiter: { tokens: number; lastRefill: number; interval: NodeJS.Timeout | null } = {
    tokens: 0,
    lastRefill: Date.now(),
    interval: null
  };
  private metricsCollectionTimer?: NodeJS.Timeout;
  private progressReportTimer?: NodeJS.Timeout;
  private activeConnections = 0;
  private maxConcurrentRequests = 0;
  private responseTimes: number[] = [];
  private recentResponseTimes: number[] = [];
  private connectionStats: ConnectionPoolStats = {
    created: 0,
    destroyed: 0,
    active: 0,
    idle: 0,
    pending: 0,
    errors: 0,
    timeouts: 0,
    avgConnectionTime: 0,
    maxConnectionTime: 0,
    reuseCount: 0
  };

  constructor(config: LoadTestConfig, options: LoadTestOptions = {}) {
    super();
    this.config = { ...this.getDefaultConfig(), ...config };
    this.options = { ...this.getDefaultOptions(), ...options };
    
    this.validateConfig();
    this.setupAgent();
    this.initializeStats();
    this.setupRateLimiter();
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): Partial<LoadTestConfig> {
    return {
      method: 'GET',
      timeout: 30000,
      retries: 0,
      warmupDuration: 10000,
      rampupDuration: 30000,
      sustainedDuration: 60000,
      cooldownDuration: 10000,
      enableStressTesting: false,
      stressRampupStep: 5,
      stressStepDuration: 10000,
      keepAlive: true,
      maxSockets: Infinity,
      maxSocketsPerHost: 256,
      reportingInterval: 5000,
      enableRealTimeStats: true,
      maxErrors: 1000,
      maxErrorRate: 0.5
    };
  }

  /**
   * Get default options
   */
  private getDefaultOptions(): LoadTestOptions {
    return {
      enableMetricsCollection: true,
      enableRequestSampling: true,
      requestSampleRate: 0.1,
      enableErrorSampling: true,
      errorSampleRate: 1.0,
      maxStoredRequests: 10000,
      maxStoredErrors: 1000,
      enableProgressCallback: true,
      enableJitter: false,
      jitterPercent: 10,
      enableResourceMonitoring: false,
      gracefulShutdown: true,
      shutdownTimeout: 30000
    };
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (!this.config.url) {
      throw new Error('URL is required');
    }

    try {
      new URL(this.config.url);
    } catch {
      throw new Error('Invalid URL format');
    }

    if (this.config.concurrency <= 0) {
      throw new Error('Concurrency must be greater than 0');
    }

    if (this.config.requestsPerSecond && this.config.requestsPerSecond <= 0) {
      throw new Error('Requests per second must be greater than 0');
    }

    if (this.config.totalRequests && this.config.totalRequests <= 0) {
      throw new Error('Total requests must be greater than 0');
    }
  }

  /**
   * Setup HTTP/HTTPS agent for connection pooling
   */
  private setupAgent(): void {
    const url = new URL(this.config.url);
    const isHttps = url.protocol === 'https:';
    
    const agentOptions = {
      keepAlive: this.config.keepAlive ?? true,
      maxSockets: this.config.maxSockets ?? Infinity,
      maxFreeSockets: Math.min(this.config.maxSocketsPerHost ?? 256, 256),
      timeout: this.config.timeout ?? 30000,
      keepAliveMsecs: 1000
    };

    this.agent = isHttps 
      ? new https.Agent(agentOptions)
      : new http.Agent(agentOptions);

    // Monitor connection events
    this.agent.on('connect', () => {
      this.connectionStats.created++;
      this.connectionStats.active++;
    });

    this.agent.on('disconnect', () => {
      this.connectionStats.destroyed++;
      this.connectionStats.active = Math.max(0, this.connectionStats.active - 1);
    });
  }

  /**
   * Initialize statistics
   */
  private initializeStats(): void {
    this.stats = {
      startTime: 0,
      endTime: undefined,
      phases: {
        warmup: this.createEmptyMetrics('warmup'),
        rampup: this.createEmptyMetrics('rampup'),
        sustained: this.createEmptyMetrics('sustained'),
        cooldown: this.createEmptyMetrics('cooldown'),
        stress: this.createEmptyMetrics('stress')
      },
      currentPhase: 'warmup',
      overallMetrics: this.createEmptyMetrics('warmup'),
      connectionPool: this.connectionStats,
      timeline: []
    };
  }

  /**
   * Create empty metrics object
   */
  private createEmptyMetrics(phase: LoadTestPhase): LoadTestMetrics {
    return {
      startTime: 0,
      endTime: undefined,
      totalDuration: 0,
      totalRequests: 0,
      completedRequests: 0,
      failedRequests: 0,
      successRate: 0,
      errorRate: 0,
      requestsPerSecond: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      statusCodeDistribution: {},
      errorDistribution: {},
      bytesTransferred: 0,
      averageThroughput: 0,
      phase,
      activeConnections: 0,
      maxConcurrentRequests: 0
    };
  }

  /**
   * Setup rate limiter
   */
  private setupRateLimiter(): void {
    if (!this.config.requestsPerSecond) return;

    this.rateLimiter.tokens = this.config.requestsPerSecond;
    this.rateLimiter.interval = setInterval(() => {
      this.rateLimiter.tokens = Math.min(
        this.config.requestsPerSecond!,
        this.rateLimiter.tokens + this.config.requestsPerSecond!
      );
    }, 1000);
  }

  /**
   * Check if request can proceed (rate limiting)
   */
  private canMakeRequest(): boolean {
    if (!this.config.requestsPerSecond) return true;
    
    if (this.rateLimiter.tokens > 0) {
      this.rateLimiter.tokens--;
      return true;
    }
    return false;
  }

  /**
   * Start load test
   */
  async start(): Promise<LoadTestResult> {
    if (this.isRunning) {
      throw new Error('Load test is already running');
    }

    this.isRunning = true;
    this.shouldStop = false;
    this.startTime = Date.now();
    this.stats.startTime = this.startTime;
    
    this.emit('start', { timestamp: this.startTime, config: this.config });

    try {
      // Setup timers
      this.setupProgressReporting();
      this.setupMetricsCollection();

      // Run test phases
      await this.runWarmupPhase();
      if (!this.shouldStop) await this.runRampupPhase();
      if (!this.shouldStop) await this.runSustainedPhase();
      if (!this.shouldStop && this.config.enableStressTesting) await this.runStressPhase();
      if (!this.shouldStop) await this.runCooldownPhase();

      return this.generateResult('completed');
    } catch (error) {
      this.emit('error', error);
      return this.generateResult('error');
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Stop load test
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;
    
    this.shouldStop = true;
    this.emit('stop', { timestamp: Date.now(), reason: 'manual' });
    
    if (this.options.gracefulShutdown) {
      await this.gracefulShutdown();
    } else {
      await this.forceShutdown();
    }
  }

  /**
   * Pause load test
   */
  pause(): void {
    if (!this.isRunning) return;
    this.isPaused = true;
    this.emit('pause', { timestamp: Date.now() });
  }

  /**
   * Resume load test
   */
  resume(): void {
    if (!this.isRunning) return;
    this.isPaused = false;
    this.emit('resume', { timestamp: Date.now() });
  }

  /**
   * Setup progress reporting
   */
  private setupProgressReporting(): void {
    if (!this.config.enableRealTimeStats) return;

    this.progressReportTimer = setInterval(() => {
      if (!this.isRunning) return;
      
      const progress = this.calculateProgress();
      this.emit('progress', progress);
      
      if (this.options.progressCallback) {
        this.options.progressCallback(progress);
      }
    }, this.config.reportingInterval);
  }

  /**
   * Setup metrics collection
   */
  private setupMetricsCollection(): void {
    if (!this.options.enableMetricsCollection) return;

    this.metricsCollectionTimer = setInterval(() => {
      if (!this.isRunning) return;
      this.collectMetrics();
    }, 1000);
  }

  /**
   * Run warmup phase
   */
  private async runWarmupPhase(): Promise<void> {
    if (!this.config.warmupDuration) return;
    
    this.currentPhase = 'warmup';
    this.phaseStartTime = Date.now();
    this.stats.phases.warmup.startTime = this.phaseStartTime;
    
    this.emit('phaseStart', { phase: 'warmup', timestamp: this.phaseStartTime });
    
    const concurrency = Math.max(1, Math.floor(this.config.concurrency * 0.1));
    await this.runLoadPhase(concurrency, this.config.warmupDuration, 'warmup');
    
    this.stats.phases.warmup.endTime = Date.now();
    this.emit('phaseEnd', { phase: 'warmup', timestamp: this.stats.phases.warmup.endTime });
  }

  /**
   * Run rampup phase
   */
  private async runRampupPhase(): Promise<void> {
    if (!this.config.rampupDuration) return;
    
    this.currentPhase = 'rampup';
    this.phaseStartTime = Date.now();
    this.stats.phases.rampup.startTime = this.phaseStartTime;
    
    this.emit('phaseStart', { phase: 'rampup', timestamp: this.phaseStartTime });
    
    const targetConcurrency = this.config.rampupTarget ?? this.config.concurrency;
    const steps = 10;
    const stepDuration = this.config.rampupDuration / steps;
    
    for (let i = 1; i <= steps && !this.shouldStop; i++) {
      const currentConcurrency = Math.floor((targetConcurrency * i) / steps);
      await this.runLoadPhase(currentConcurrency, stepDuration, 'rampup');
    }
    
    this.stats.phases.rampup.endTime = Date.now();
    this.emit('phaseEnd', { phase: 'rampup', timestamp: this.stats.phases.rampup.endTime });
  }

  /**
   * Run sustained phase
   */
  private async runSustainedPhase(): Promise<void> {
    if (!this.config.sustainedDuration) return;
    
    this.currentPhase = 'sustained';
    this.phaseStartTime = Date.now();
    this.stats.phases.sustained.startTime = this.phaseStartTime;
    
    this.emit('phaseStart', { phase: 'sustained', timestamp: this.phaseStartTime });
    
    await this.runLoadPhase(this.config.concurrency, this.config.sustainedDuration, 'sustained');
    
    this.stats.phases.sustained.endTime = Date.now();
    this.emit('phaseEnd', { phase: 'sustained', timestamp: this.stats.phases.sustained.endTime });
  }

  /**
   * Run stress phase
   */
  private async runStressPhase(): Promise<void> {
    if (!this.config.enableStressTesting) return;
    
    this.currentPhase = 'stress';
    this.phaseStartTime = Date.now();
    this.stats.phases.stress.startTime = this.phaseStartTime;
    
    this.emit('phaseStart', { phase: 'stress', timestamp: this.phaseStartTime });
    
    const maxConcurrency = this.config.stressMaxConcurrency ?? this.config.concurrency * 3;
    const step = this.config.stressRampupStep ?? 5;
    const stepDuration = this.config.stressStepDuration ?? 10000;
    
    for (let concurrency = this.config.concurrency; concurrency <= maxConcurrency && !this.shouldStop; concurrency += step) {
      await this.runLoadPhase(concurrency, stepDuration, 'stress');
      
      // Check if we've reached breaking point
      const currentMetrics = this.calculateCurrentMetrics();
      if (currentMetrics.errorRate > 0.5 || currentMetrics.averageResponseTime > (this.config.targetResponseTime ?? 10000)) {
        this.emit('breakingPoint', { concurrency, metrics: currentMetrics });
        break;
      }
    }
    
    this.stats.phases.stress.endTime = Date.now();
    this.emit('phaseEnd', { phase: 'stress', timestamp: this.stats.phases.stress.endTime });
  }

  /**
   * Run cooldown phase
   */
  private async runCooldownPhase(): Promise<void> {
    if (!this.config.cooldownDuration) return;
    
    this.currentPhase = 'cooldown';
    this.phaseStartTime = Date.now();
    this.stats.phases.cooldown.startTime = this.phaseStartTime;
    
    this.emit('phaseStart', { phase: 'cooldown', timestamp: this.phaseStartTime });
    
    const concurrency = Math.max(1, Math.floor(this.config.concurrency * 0.2));
    await this.runLoadPhase(concurrency, this.config.cooldownDuration, 'cooldown');
    
    this.stats.phases.cooldown.endTime = Date.now();
    this.emit('phaseEnd', { phase: 'cooldown', timestamp: this.stats.phases.cooldown.endTime });
  }

  /**
   * Run load phase with specified concurrency
   */
  private async runLoadPhase(concurrency: number, duration: number, phase: LoadTestPhase): Promise<void> {
    const endTime = Date.now() + duration;
    const workers: Promise<void>[] = [];
    
    // Start workers
    for (let i = 0; i < concurrency; i++) {
      workers.push(this.startWorker(phase, endTime));
    }
    
    // Wait for phase completion
    await Promise.all(workers);
  }

  /**
   * Start a worker
   */
  private async startWorker(phase: LoadTestPhase, endTime: number): Promise<void> {
    const workerId = randomUUID();
    const worker: LoadTestWorker = {
      id: workerId,
      startTime: Date.now(),
      requestsCompleted: 0,
      requestsFailed: 0,
      totalDuration: 0,
      avgResponseTime: 0,
      isActive: true
    };
    
    this.workers.set(workerId, worker);
    
    while (Date.now() < endTime && !this.shouldStop && !this.isPaused) {
      if (!this.canMakeRequest()) {
        await this.sleep(10);
        continue;
      }
      
      await this.makeRequest(workerId, phase);
      
      // Apply jitter if enabled
      if (this.options.enableJitter) {
        const jitter = Math.random() * (this.options.jitterPercent ?? 10) * 10;
        await this.sleep(jitter);
      }
    }
    
    worker.endTime = Date.now();
    worker.isActive = false;
  }

  /**
   * Make HTTP request
   */
  private async makeRequest(workerId: string, phase: LoadTestPhase): Promise<void> {
    const requestId = randomUUID();
    const startTime = Date.now();
    
    this.activeConnections++;
    this.maxConcurrentRequests = Math.max(this.maxConcurrentRequests, this.activeConnections);
    
    const request: LoadTestRequest = {
      id: requestId,
      url: this.config.url,
      method: this.config.method ?? 'GET',
      headers: this.config.headers,
      body: this.config.body,
      timeout: this.config.timeout,
      retries: this.config.retries ?? 0,
      startTime,
      success: false,
      attempt: 1,
      phase
    };

    try {
      await this.executeRequest(request);
      
      const worker = this.workers.get(workerId);
      if (worker) {
        worker.requestsCompleted++;
        worker.totalDuration += request.duration ?? 0;
        worker.avgResponseTime = worker.totalDuration / worker.requestsCompleted;
      }
      
      this.emit('requestComplete', request);
    } catch (error) {
      request.error = error as Error;
      request.success = false;
      
      const worker = this.workers.get(workerId);
      if (worker) {
        worker.requestsFailed++;
      }
      
      this.recordError(error as Error, request, phase);
      this.emit('requestError', { request, error });
    } finally {
      request.endTime = Date.now();
      request.duration = request.endTime - request.startTime;
      
      this.activeConnections--;
      this.recordRequest(request);
    }
  }

  /**
   * Execute HTTP request
   */
  private async executeRequest(request: LoadTestRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = new URL(request.url);
      const requestModule = url.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: request.method,
        headers: {
          'User-Agent': 'LoadTester/1.0',
          ...request.headers
        },
        agent: this.agent,
        timeout: request.timeout
      };

      const req = requestModule.request(options, (res) => {
        let responseSize = 0;
        
        res.on('data', (chunk) => {
          responseSize += chunk.length;
        });
        
        res.on('end', () => {
          request.statusCode = res.statusCode;
          request.responseSize = responseSize;
          request.success = res.statusCode ? res.statusCode < 400 : false;
          
          if (this.options.validateResponse) {
            request.success = request.success && this.options.validateResponse(res);
          }
          
          resolve();
        });
      });

      req.on('error', (error) => {
        this.connectionStats.errors++;
        reject(error);
      });

      req.on('timeout', () => {
        this.connectionStats.timeouts++;
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (request.body) {
        req.write(request.body);
      }
      
      req.end();
    });
  }

  /**
   * Record request for metrics
   */
  private recordRequest(request: LoadTestRequest): void {
    // Update response times
    if (request.duration !== undefined) {
      this.responseTimes.push(request.duration);
      this.recentResponseTimes.push(request.duration);
      
      // Keep only recent response times (last 100)
      if (this.recentResponseTimes.length > 100) {
        this.recentResponseTimes = this.recentResponseTimes.slice(-100);
      }
    }
    
    // Sample requests for storage
    if (this.options.enableRequestSampling && Math.random() < (this.options.requestSampleRate ?? 0.1)) {
      this.requests.push(request);
      
      // Limit stored requests
      if (this.requests.length > (this.options.maxStoredRequests ?? 10000)) {
        this.requests = this.requests.slice(-Math.floor((this.options.maxStoredRequests ?? 10000) * 0.8));
      }
    }
  }

  /**
   * Record error
   */
  private recordError(error: Error, request: Partial<LoadTestRequest>, phase: LoadTestPhase): void {
    const errorRecord = {
      timestamp: Date.now(),
      error,
      request,
      phase
    };
    
    // Sample errors for storage
    if (this.options.enableErrorSampling && Math.random() < (this.options.errorSampleRate ?? 1.0)) {
      this.errors.push(errorRecord);
      
      // Limit stored errors
      if (this.errors.length > (this.options.maxStoredErrors ?? 1000)) {
        this.errors = this.errors.slice(-Math.floor((this.options.maxStoredErrors ?? 1000) * 0.8));
      }
    }
    
    // Check stop conditions
    if (this.errors.length >= (this.config.maxErrors ?? 1000)) {
      this.emit('maxErrorsReached', { errorCount: this.errors.length });
      this.shouldStop = true;
    }
  }

  /**
   * Calculate current metrics
   */
  private calculateCurrentMetrics(): LoadTestMetrics {
    const phaseRequests = this.requests.filter(r => r.phase === this.currentPhase);
    const phaseResponseTimes = phaseRequests.map(r => r.duration).filter(d => d !== undefined) as number[];
    
    return this.calculateMetrics(phaseRequests, phaseResponseTimes, this.currentPhase);
  }

  /**
   * Calculate metrics for requests
   */
  private calculateMetrics(requests: LoadTestRequest[], responseTimes: number[], phase: LoadTestPhase): LoadTestMetrics {
    const completedRequests = requests.filter(r => r.success).length;
    const failedRequests = requests.filter(r => !r.success).length;
    const totalRequests = requests.length;
    
    const successRate = totalRequests > 0 ? completedRequests / totalRequests : 0;
    const errorRate = totalRequests > 0 ? failedRequests / totalRequests : 0;
    
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const averageResponseTime = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
    
    let minResponseTime = Infinity;
    let maxResponseTime = 0;
    if (responseTimes.length > 0) {
      for (const time of responseTimes) {
        if (time < minResponseTime) minResponseTime = time;
        if (time > maxResponseTime) maxResponseTime = time;
      }
      if (minResponseTime === Infinity) minResponseTime = 0;
    } else {
      minResponseTime = 0;
    }
    
    const p50ResponseTime = this.calculatePercentile(sortedTimes, 50);
    const p95ResponseTime = this.calculatePercentile(sortedTimes, 95);
    const p99ResponseTime = this.calculatePercentile(sortedTimes, 99);
    
    const statusCodeDistribution: Record<number, number> = {};
    const errorDistribution: Record<string, number> = {};
    let bytesTransferred = 0;
    
    requests.forEach(request => {
      if (request.statusCode) {
        statusCodeDistribution[request.statusCode] = (statusCodeDistribution[request.statusCode] || 0) + 1;
      }
      
      if (request.error) {
        const errorType = this.options.customErrorClassifier 
          ? this.options.customErrorClassifier(request.error)
          : request.error.name;
        errorDistribution[errorType] = (errorDistribution[errorType] || 0) + 1;
      }
      
      if (request.responseSize) {
        bytesTransferred += request.responseSize;
      }
    });
    
    const now = Date.now();
    const phaseStartTime = this.stats.phases[phase].startTime || now;
    const totalDuration = now - phaseStartTime;
    const requestsPerSecond = totalDuration > 0 ? (totalRequests * 1000) / totalDuration : 0;
    const averageThroughput = totalDuration > 0 ? (bytesTransferred * 1000) / totalDuration : 0;
    
    return {
      startTime: phaseStartTime,
      endTime: undefined,
      totalDuration,
      totalRequests,
      completedRequests,
      failedRequests,
      successRate,
      errorRate,
      requestsPerSecond,
      averageResponseTime,
      minResponseTime,
      maxResponseTime,
      p50ResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      statusCodeDistribution,
      errorDistribution,
      bytesTransferred,
      averageThroughput,
      phase,
      activeConnections: this.activeConnections,
      maxConcurrentRequests: this.maxConcurrentRequests
    };
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))] ?? 0;
  }

  /**
   * Calculate progress
   */
  private calculateProgress(): LoadTestProgress {
    const now = Date.now();
    const totalDuration = this.getTotalTestDuration();
    const elapsedTime = now - this.startTime;
    const progress = Math.min(elapsedTime / totalDuration, 1);
    
    const phaseDuration = this.getPhaseDuration(this.currentPhase);
    const phaseElapsed = now - this.phaseStartTime;
    const phaseProgress = Math.min(phaseElapsed / phaseDuration, 1);
    
    const currentMetrics = this.calculateCurrentMetrics();
    const isStable = this.checkStability();
    const recommendations = this.generateRecommendations();
    
    return {
      phase: this.currentPhase,
      currentConcurrency: this.activeConnections,
      targetConcurrency: this.config.concurrency,
      progress,
      phaseProgress,
      elapsedTime,
      remainingTime: totalDuration - elapsedTime,
      currentMetrics,
      recentResponseTimes: this.recentResponseTimes.slice(),
      isStable,
      recommendations
    };
  }

  /**
   * Check if metrics are stable
   */
  private checkStability(): boolean {
    if (this.recentResponseTimes.length < 10) return false;
    
    const recent = this.recentResponseTimes.slice(-10);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const variance = recent.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / recent.length;
    const stdDev = Math.sqrt(variance);
    
    // Consider stable if standard deviation is less than 20% of average
    return stdDev < avg * 0.2;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const currentMetrics = this.calculateCurrentMetrics();
    
    if (currentMetrics.errorRate > 0.1) {
      recommendations.push('High error rate detected - consider reducing load');
    }
    
    if (currentMetrics.averageResponseTime > 5000) {
      recommendations.push('High response times - server may be overloaded');
    }
    
    if (!this.checkStability()) {
      recommendations.push('Performance metrics are unstable - consider longer test duration');
    }
    
    if (this.activeConnections < this.config.concurrency * 0.8) {
      recommendations.push('Actual concurrency is lower than configured - check connection limits');
    }
    
    return recommendations;
  }

  /**
   * Get total test duration
   */
  private getTotalTestDuration(): number {
    return (this.config.warmupDuration ?? 0) +
           (this.config.rampupDuration ?? 0) +
           (this.config.sustainedDuration ?? 0) +
           (this.config.cooldownDuration ?? 0);
  }

  /**
   * Get phase duration
   */
  private getPhaseDuration(phase: LoadTestPhase): number {
    switch (phase) {
      case 'warmup': return this.config.warmupDuration ?? 0;
      case 'rampup': return this.config.rampupDuration ?? 0;
      case 'sustained': return this.config.sustainedDuration ?? 0;
      case 'cooldown': return this.config.cooldownDuration ?? 0;
      case 'stress': return (this.config.stressMaxConcurrency ?? this.config.concurrency) * (this.config.stressStepDuration ?? 10000);
      default: return 0;
    }
  }

  /**
   * Collect metrics
   */
  private collectMetrics(): void {
    const timestamp = Date.now();
    const metrics = this.calculateCurrentMetrics();
    
    this.stats.timeline.push({
      timestamp,
      metrics,
      phase: this.currentPhase,
      events: []
    });
    
    // Update phase metrics
    this.stats.phases[this.currentPhase] = metrics;
    
    // Update overall metrics
    this.stats.overallMetrics = this.calculateMetrics(this.requests, this.responseTimes, this.currentPhase);
  }

  /**
   * Generate final result
   */
  private generateResult(status: 'completed' | 'failed' | 'stopped' | 'error'): LoadTestResult {
    this.endTime = Date.now();
    this.stats.endTime = this.endTime;
    
    // Update final metrics
    Object.keys(this.stats.phases).forEach(phase => {
      const phaseRequests = this.requests.filter(r => r.phase === phase);
      const phaseResponseTimes = phaseRequests.map(r => r.duration).filter(d => d !== undefined) as number[];
      this.stats.phases[phase as LoadTestPhase] = this.calculateMetrics(phaseRequests, phaseResponseTimes, phase as LoadTestPhase);
    });
    
    this.stats.overallMetrics = this.calculateMetrics(this.requests, this.responseTimes, 'sustained');
    
    const result: LoadTestResult = {
      config: this.config,
      phases: this.stats.phases,
      overallMetrics: this.stats.overallMetrics,
      timeline: this.stats.timeline,
      requests: this.requests,
      workers: Array.from(this.workers.values()),
      errors: this.errors,
      performance: this.analyzePerformance(),
      recommendations: this.generateFinalRecommendations(),
      summary: this.generateSummary(status),
      generatedAt: Date.now()
    };
    
    // Add export data if requested
    if (this.options.enableMetricsCollection) {
      result.exportData = {
        json: JSON.stringify(result, null, 2),
        csv: this.exportCSV(),
        html: this.exportHTML()
      };
    }
    
    return result;
  }

  /**
   * Analyze performance
   */
  private analyzePerformance(): LoadTestResult['performance'] {
    const bottlenecks: LoadTestResult['performance']['bottlenecks'] = [];
    const sustainedMetrics = this.stats.phases.sustained;
    
    // Response time bottleneck
    if (sustainedMetrics.averageResponseTime > 5000) {
      bottlenecks.push({
        type: 'response_time',
        severity: sustainedMetrics.averageResponseTime > 10000 ? 'critical' : 'high',
        description: `High average response time: ${sustainedMetrics.averageResponseTime.toFixed(2)}ms`,
        value: sustainedMetrics.averageResponseTime,
        threshold: 5000,
        impact: 'User experience degradation',
        suggestions: ['Optimize server performance', 'Scale horizontally', 'Implement caching']
      });
    }
    
    // Error rate bottleneck
    if (sustainedMetrics.errorRate > 0.05) {
      bottlenecks.push({
        type: 'error_rate',
        severity: sustainedMetrics.errorRate > 0.2 ? 'critical' : 'high',
        description: `High error rate: ${(sustainedMetrics.errorRate * 100).toFixed(2)}%`,
        value: sustainedMetrics.errorRate,
        threshold: 0.05,
        impact: 'Service reliability issues',
        suggestions: ['Investigate error causes', 'Improve error handling', 'Monitor system resources']
      });
    }
    
    // Throughput analysis
    const maxStableRPS = Math.max(...Object.values(this.stats.phases).map(p => p.requestsPerSecond));
    const maxStableConcurrency = this.maxConcurrentRequests;
    
    return {
      bottlenecks,
      scalability: {
        maxStableRPS,
        maxStableConcurrency,
        scalabilityFactor: maxStableConcurrency > 0 ? maxStableRPS / maxStableConcurrency : 0
      },
      reliability: {
        meanTimeBetweenFailures: this.calculateMTBF(),
        errorClusters: this.identifyErrorClusters(),
        stabilityScore: this.calculateStabilityScore()
      }
    };
  }

  /**
   * Calculate Mean Time Between Failures
   */
  private calculateMTBF(): number {
    const failures = this.errors.length;
    if (failures <= 1) return Infinity;
    
    const totalDuration = this.endTime - this.startTime;
    return totalDuration / failures;
  }

  /**
   * Identify error clusters
   */
  private identifyErrorClusters(): Array<{ startTime: number; endTime: number; errorCount: number; dominantError: string }> {
    const clusters: Array<{ startTime: number; endTime: number; errorCount: number; dominantError: string }> = [];
    const windowSize = 30000; // 30 seconds
    
    for (let i = 0; i < this.errors.length; i++) {
      const windowStart = this.errors[i]?.timestamp;
      if (!windowStart) continue;
      const windowEnd = windowStart + windowSize;
      const windowErrors = this.errors.filter(e => e.timestamp >= windowStart && e.timestamp <= windowEnd);
      
      if (windowErrors.length >= 5) {
        const errorCounts: Record<string, number> = {};
        windowErrors.forEach(e => {
          const errorType = e.error.name;
          errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
        });
        
        const dominantError = Object.entries(errorCounts).sort(([,a], [,b]) => b - a)[0]?.[0] ?? 'Unknown';
        
        clusters.push({
          startTime: windowStart,
          endTime: windowEnd,
          errorCount: windowErrors.length,
          dominantError
        });
      }
    }
    
    return clusters;
  }

  /**
   * Calculate stability score
   */
  private calculateStabilityScore(): number {
    if (this.responseTimes.length < 10) return 0;
    
    const avg = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
    const variance = this.responseTimes.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / this.responseTimes.length;
    const coefficient = Math.sqrt(variance) / avg;
    
    // Lower coefficient of variation = higher stability
    return Math.max(0, 1 - coefficient);
  }

  /**
   * Generate final recommendations
   */
  private generateFinalRecommendations(): LoadTestResult['recommendations'] {
    const immediate: string[] = [];
    const capacity: string[] = [];
    const optimization: string[] = [];
    const monitoring: string[] = [];
    
    const overallMetrics = this.stats.overallMetrics;
    
    // Immediate recommendations
    if (overallMetrics.errorRate > 0.1) {
      immediate.push('High error rate detected - investigate and fix immediately');
    }
    
    if (overallMetrics.averageResponseTime > 10000) {
      immediate.push('Very high response times - check server resources and optimize critical paths');
    }
    
    // Capacity recommendations
    if (overallMetrics.requestsPerSecond < this.config.concurrency * 0.5) {
      capacity.push('Low throughput relative to concurrency - consider scaling up');
    }
    
    capacity.push(`System handled ${overallMetrics.requestsPerSecond.toFixed(2)} RPS - plan capacity accordingly`);
    
    // Optimization recommendations
    if (overallMetrics.p95ResponseTime > overallMetrics.averageResponseTime * 2) {
      optimization.push('High P95 response time variance - optimize slow queries/operations');
    }
    
    optimization.push('Consider implementing caching for frequently accessed resources');
    optimization.push('Monitor database connection pool and query performance');
    
    // Monitoring recommendations
    monitoring.push('Set up alerts for response time > 5 seconds');
    monitoring.push('Monitor error rates and set alerts for > 5%');
    monitoring.push('Track resource utilization (CPU, memory, disk)');
    
    return { immediate, capacity, optimization, monitoring };
  }

  /**
   * Generate summary
   */
  private generateSummary(status: LoadTestResult['summary']['status']): LoadTestResult['summary'] {
    const overallMetrics = this.stats.overallMetrics;
    const duration = this.endTime - this.startTime;
    const totalDataTransferred = this.formatBytes(overallMetrics.bytesTransferred);
    
    // Calculate overall score (0-100)
    let score = 100;
    
    // Deduct for high response times
    if (overallMetrics.averageResponseTime > 1000) {
      score -= Math.min(40, (overallMetrics.averageResponseTime - 1000) / 100);
    }
    
    // Deduct for errors
    score -= overallMetrics.errorRate * 50;
    
    // Deduct for low throughput
    const expectedRPS = this.config.concurrency * 0.8;
    if (overallMetrics.requestsPerSecond < expectedRPS) {
      score -= (expectedRPS - overallMetrics.requestsPerSecond) / expectedRPS * 20;
    }
    
    score = Math.max(0, Math.min(100, score));
    
    const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
    
    return {
      status,
      duration,
      peakRPS: Math.max(...Object.values(this.stats.phases).map(p => p.requestsPerSecond)),
      averageRPS: overallMetrics.requestsPerSecond,
      totalDataTransferred,
      overallScore: Math.round(score),
      grade
    };
  }

  /**
   * Export to CSV
   */
  private exportCSV(): string {
    const headers = [
      'timestamp', 'phase', 'requests_per_second', 'avg_response_time',
      'p95_response_time', 'error_rate', 'active_connections'
    ];
    
    const rows = this.stats.timeline.map(entry => [
      entry.timestamp,
      entry.phase,
      entry.metrics.requestsPerSecond.toFixed(2),
      entry.metrics.averageResponseTime.toFixed(2),
      entry.metrics.p95ResponseTime.toFixed(2),
      (entry.metrics.errorRate * 100).toFixed(2),
      entry.metrics.activeConnections
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Export to HTML
   */
  private exportHTML(): string {
    const overallMetrics = this.stats.overallMetrics;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Load Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 24px; font-weight: bold; color: #007cba; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f5f5f5; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Load Test Report</h1>
        <p>URL: ${this.config.url}</p>
        <p>Generated: ${new Date().toISOString()}</p>
    </div>
    
    <div class="metrics">
        <div class="metric">
            <h3>Requests/Second</h3>
            <div class="value">${overallMetrics.requestsPerSecond.toFixed(2)}</div>
        </div>
        <div class="metric">
            <h3>Avg Response Time</h3>
            <div class="value">${overallMetrics.averageResponseTime.toFixed(2)}ms</div>
        </div>
        <div class="metric">
            <h3>Success Rate</h3>
            <div class="value">${(overallMetrics.successRate * 100).toFixed(2)}%</div>
        </div>
        <div class="metric">
            <h3>Total Requests</h3>
            <div class="value">${overallMetrics.totalRequests}</div>
        </div>
    </div>
    
    <h2>Phase Results</h2>
    <table>
        <tr>
            <th>Phase</th>
            <th>RPS</th>
            <th>Avg Response Time</th>
            <th>P95 Response Time</th>
            <th>Error Rate</th>
        </tr>
        ${Object.entries(this.stats.phases).map(([phase, metrics]) => `
            <tr>
                <td>${phase}</td>
                <td>${metrics.requestsPerSecond.toFixed(2)}</td>
                <td>${metrics.averageResponseTime.toFixed(2)}ms</td>
                <td>${metrics.p95ResponseTime.toFixed(2)}ms</td>
                <td>${(metrics.errorRate * 100).toFixed(2)}%</td>
            </tr>
        `).join('')}
    </table>
</body>
</html>
    `;
  }

  /**
   * Format bytes
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Graceful shutdown
   */
  private async gracefulShutdown(): Promise<void> {
    this.isRunning = false;
    
    const timeout = this.options.shutdownTimeout ?? 30000;
    const startTime = Date.now();
    
    // Wait for active requests to complete
    while (this.activeConnections > 0 && (Date.now() - startTime) < timeout) {
      await this.sleep(100);
    }
  }

  /**
   * Force shutdown
   */
  private async forceShutdown(): Promise<void> {
    this.isRunning = false;
    // Destroy agent to close all connections
    this.agent.destroy();
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    this.isRunning = false;
    
    if (this.rateLimiter.interval) {
      clearInterval(this.rateLimiter.interval);
    }
    
    if (this.metricsCollectionTimer) {
      clearInterval(this.metricsCollectionTimer);
    }
    
    if (this.progressReportTimer) {
      clearInterval(this.progressReportTimer);
    }
    
    this.agent.destroy();
    this.emit('complete', { timestamp: Date.now() });
  }

  /**
   * Get current statistics
   */
  getStats(): LoadTestStats {
    return { ...this.stats };
  }

  /**
   * Get current progress
   */
  getProgress(): LoadTestProgress {
    return this.calculateProgress();
  }

  /**
   * Export JSON
   */
  exportJSON(): string {
    return JSON.stringify(this.getStats(), null, 2);
  }
}

/**
 * Create a load tester instance
 */
export function createLoadTester(config: LoadTestConfig, options?: LoadTestOptions): LoadTester {
  return new LoadTester(config, options);
}

/**
 * Quick load test utility
 */
export async function loadTest(url: string, concurrency: number = 10, duration: number = 60000): Promise<LoadTestResult> {
  const tester = createLoadTester({
    url,
    concurrency,
    sustainedDuration: duration,
    warmupDuration: 5000,
    cooldownDuration: 5000
  });
  
  return tester.start();
}

/**
 * Global load tester instance factory
 */
export const loadTester = (config: LoadTestConfig, options?: LoadTestOptions) => {
  return new LoadTester(config, options);
};