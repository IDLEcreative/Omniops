/**
 * Memory Monitor - Zero-dependency memory tracking and leak detection
 * 
 * Features:
 * - Real-time memory tracking (heap, RSS, external, array buffers)
 * - Memory leak detection with trend analysis
 * - Object tracking with WeakRef for leak detection
 * - Garbage collection monitoring and forced GC
 * - Memory snapshot comparisons
 * - Growth trend analysis with linear regression
 * - Configurable alerting thresholds
 * - Export data for visualization (CSV, JSON)
 * - Memory pressure warnings
 * - Historical data with configurable retention
 * - Heap dump generation support (v8 module)
 */

import { EventEmitter } from 'events';
import type {
  MemoryMonitorOptions,
  MemoryUsage,
  MemorySnapshot,
  MemoryTrend,
  MemoryLeak,
  ObjectTracking,
  GCEvent,
  MemoryPressure,
  MemoryAlert,
  MemoryStatistics,
  MemoryReport,
  HeapDumpOptions,
  MemoryComparisonResult
} from './types';

// Optional v8 import for heap dumps (graceful degradation)
let v8: any;
try {
  v8 = require('v8');
} catch {
  v8 = null;
}

export class MemoryMonitor extends EventEmitter {
  private options: Required<MemoryMonitorOptions>;
  private snapshots: MemorySnapshot[] = [];
  private alerts: MemoryAlert[] = [];
  private gcEvents: GCEvent[] = [];
  private pressureEvents: MemoryPressure[] = [];
  private trackedObjects: Map<string, ObjectTracking> = new Map();
  private detectedLeaks: Map<string, MemoryLeak> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private gcObserver?: any;
  private startTime: number;
  private alertIdCounter = 0;
  private objectIdCounter = 0;
  private leakIdCounter = 0;
  private baselineSnapshot?: MemorySnapshot;

  constructor(options: MemoryMonitorOptions = {}) {
    super();
    
    this.options = {
      samplingInterval: options.samplingInterval ?? 1000,
      historySize: options.historySize ?? 1000,
      leakDetectionThreshold: options.leakDetectionThreshold ?? 1024 * 1024, // 1MB/s
      pressureThresholds: {
        heapUsed: options.pressureThresholds?.heapUsed ?? 80,
        rss: options.pressureThresholds?.rss ?? 85,
        external: options.pressureThresholds?.external ?? 75,
      },
      enableObjectTracking: options.enableObjectTracking ?? false,
      enableGCMonitoring: options.enableGCMonitoring ?? true,
      enableHeapDump: options.enableHeapDump ?? false,
      alertThresholds: {
        memoryGrowth: options.alertThresholds?.memoryGrowth ?? 512 * 1024, // 512KB/s
        gcFrequency: options.alertThresholds?.gcFrequency ?? 10, // 10 GCs per minute
        heapUsage: options.alertThresholds?.heapUsage ?? 90, // 90%
      },
      retentionPeriod: options.retentionPeriod ?? 24 * 60 * 60 * 1000, // 24 hours
      autoCleanup: options.autoCleanup ?? true,
      enableRegression: options.enableRegression ?? true,
      regressionWindowSize: options.regressionWindowSize ?? 50,
      enablePrediction: options.enablePrediction ?? true,
    };

    this.startTime = Date.now();
    this.setupGCMonitoring();
  }

  /**
   * Start continuous memory monitoring
   */
  start(): void {
    if (this.monitoringInterval) {
      return; // Already started
    }

    this.takeSnapshot(); // Initial snapshot
    this.baselineSnapshot = this.getCurrentSnapshot();

    this.monitoringInterval = setInterval(() => {
      this.takeSnapshot();
      this.analyzeMemoryTrends();
      this.detectMemoryLeaks();
      this.checkMemoryPressure();
      this.updateObjectTracking();
      
      if (this.options.autoCleanup) {
        this.cleanup();
      }
    }, this.options.samplingInterval);

    this.emit('started', { timestamp: Date.now() });
  }

  /**
   * Stop memory monitoring
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    if (this.gcObserver) {
      this.gcObserver.disconnect();
      this.gcObserver = undefined;
    }

    this.emit('stopped', { timestamp: Date.now() });
  }

  /**
   * Take a memory snapshot
   */
  takeSnapshot(): MemorySnapshot {
    const usage = this.getMemoryUsage();
    const timestamp = Date.now();
    
    const snapshot: MemorySnapshot = {
      timestamp,
      usage,
      metadata: {
        gcCount: this.gcEvents.length,
        gcTime: this.gcEvents.reduce((sum, event) => sum + event.duration, 0),
        objectCount: this.trackedObjects.size,
        generation: this.snapshots.length,
      },
    };

    this.snapshots.push(snapshot);

    // Maintain history size limit
    if (this.snapshots.length > this.options.historySize) {
      this.snapshots.shift();
    }

    this.emit('snapshot', snapshot);
    return snapshot;
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): MemoryUsage {
    const memUsage = process.memoryUsage();
    return {
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
    };
  }

  /**
   * Get current memory snapshot
   */
  getCurrentSnapshot(): MemorySnapshot {
    return {
      timestamp: Date.now(),
      usage: this.getMemoryUsage(),
      metadata: {
        gcCount: this.gcEvents.length,
        objectCount: this.trackedObjects.size,
        generation: this.snapshots.length,
      },
    };
  }

  /**
   * Compare two memory snapshots
   */
  compareSnapshots(
    baseline: MemorySnapshot, 
    current: MemorySnapshot,
    threshold = 5 // 5% threshold
  ): MemoryComparisonResult {
    const diff = {
      rss: current.usage.rss - baseline.usage.rss,
      heapTotal: current.usage.heapTotal - baseline.usage.heapTotal,
      heapUsed: current.usage.heapUsed - baseline.usage.heapUsed,
      external: current.usage.external - baseline.usage.external,
      arrayBuffers: current.usage.arrayBuffers - baseline.usage.arrayBuffers,
    };

    const percentageChange = {
      rss: baseline.usage.rss > 0 ? (diff.rss / baseline.usage.rss) * 100 : 0,
      heapTotal: baseline.usage.heapTotal > 0 ? (diff.heapTotal / baseline.usage.heapTotal) * 100 : 0,
      heapUsed: baseline.usage.heapUsed > 0 ? (diff.heapUsed / baseline.usage.heapUsed) * 100 : 0,
      external: baseline.usage.external > 0 ? (diff.external / baseline.usage.external) * 100 : 0,
      arrayBuffers: baseline.usage.arrayBuffers > 0 ? (diff.arrayBuffers / baseline.usage.arrayBuffers) * 100 : 0,
    };

    const significant = Object.values(percentageChange).some(change => Math.abs(change) > threshold);
    
    const timeDiff = current.timestamp - baseline.timestamp;
    const growthRate = timeDiff > 0 ? (diff.heapUsed / timeDiff) * 1000 : 0; // bytes/second

    return {
      baseline,
      current,
      diff,
      percentageChange,
      significant,
      threshold,
      analysis: {
        isMemoryGrowing: growthRate > 0,
        growthRate,
        projectedUsage: current.usage.heapUsed + (growthRate * 3600), // projected usage in 1 hour
        timeToLimit: v8 ? this.calculateTimeToLimit(current.usage.heapUsed, growthRate) : undefined,
      },
    };
  }

  /**
   * Track a specific object for leak detection
   */
  trackObject(obj: object, metadata: Partial<ObjectTracking> = {}): string {
    if (!this.options.enableObjectTracking) {
      throw new Error('Object tracking is not enabled');
    }

    const id = `obj_${++this.objectIdCounter}`;
    const tracking: ObjectTracking = {
      id,
      type: typeof obj,
      constructor: obj.constructor?.name || 'Unknown',
      createdAt: Date.now(),
      weakRef: new WeakRef(obj),
      isAlive: true,
      lastSeen: Date.now(),
      location: metadata.location,
    };

    this.trackedObjects.set(id, tracking);
    
    this.emit('objectTracked', { id, tracking });
    return id;
  }

  /**
   * Force garbage collection (if available)
   */
  forceGC(): boolean {
    if (global.gc) {
      const before = this.getMemoryUsage();
      const startTime = Date.now();
      
      global.gc();
      
      const after = this.getMemoryUsage();
      const duration = Date.now() - startTime;
      
      const gcEvent: GCEvent = {
        timestamp: startTime,
        type: 'mark-sweep',
        duration,
        memoryBefore: before,
        memoryAfter: after,
        freed: before.heapUsed - after.heapUsed,
        collections: 1,
      };

      this.recordGCEvent(gcEvent);
      this.emit('gcForced', gcEvent);
      return true;
    }
    return false;
  }

  /**
   * Generate heap dump (if v8 module is available)
   */
  generateHeapDump(options: HeapDumpOptions = {}): string | null {
    if (!v8 || !this.options.enableHeapDump) {
      return null;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = options.filename || `heap-dump-${timestamp}.heapsnapshot`;
      
      const heapSnapshot = v8.getHeapSnapshot();
      
      if (options.format === 'json') {
        // Convert to JSON format
        const chunks: Buffer[] = [];
        heapSnapshot.on('data', (chunk: Buffer) => chunks.push(chunk));
        heapSnapshot.on('end', () => {
          const jsonData = Buffer.concat(chunks).toString();
          require('fs').writeFileSync(filename.replace('.heapsnapshot', '.json'), jsonData);
        });
      } else {
        // Default heapsnapshot format
        const fs = require('fs');
        const writeStream = fs.createWriteStream(filename);
        heapSnapshot.pipe(writeStream);
      }

      this.emit('heapDumpGenerated', { filename, options });
      return filename;
    } catch (error) {
      this.emit('error', error);
      return null;
    }
  }

  /**
   * Get comprehensive memory statistics
   */
  getStatistics(): MemoryStatistics {
    if (this.snapshots.length === 0) {
      throw new Error('No memory snapshots available');
    }

    const timespan = {
      start: this.snapshots[0].timestamp,
      end: this.snapshots[this.snapshots.length - 1].timestamp,
      duration: this.snapshots[this.snapshots.length - 1].timestamp - this.snapshots[0].timestamp,
    };

    const usage = this.calculateUsageStatistics();
    const trends = this.calculateTrends();
    const gc = this.calculateGCStatistics();
    const leaks = this.getLeakStatistics();
    const pressure = this.getPressureStatistics();
    const objects = this.getObjectStatistics();

    return {
      totalSamples: this.snapshots.length,
      timespan,
      usage,
      trends,
      gc,
      leaks,
      pressure,
      objects,
    };
  }

  /**
   * Generate comprehensive memory report
   */
  generateReport(): MemoryReport {
    const statistics = this.getStatistics();
    const status = this.determineHealthStatus();
    
    const leaks = Array.from(this.detectedLeaks.values());
    const recommendations = this.generateRecommendations(statistics, leaks);

    return {
      summary: {
        status,
        totalIssues: leaks.length + this.alerts.filter(a => !a.acknowledged).length,
        memoryLeaks: leaks.length,
        pressureEvents: this.pressureEvents.length,
        gcIssues: this.gcEvents.filter(e => e.duration > 100).length,
        recommendations: recommendations.immediate,
      },
      statistics,
      leaks,
      alerts: this.alerts,
      gcEvents: this.gcEvents,
      pressureEvents: this.pressureEvents,
      objectTracking: this.options.enableObjectTracking ? {
        summary: {
          totalObjects: this.trackedObjects.size,
          aliveObjects: Array.from(this.trackedObjects.values()).filter(t => t.isAlive).length,
          suspectedLeaks: Array.from(this.trackedObjects.values()).filter(t => 
            t.isAlive && (Date.now() - t.createdAt) > 60000
          ).length,
        },
        objects: Array.from(this.trackedObjects.values()),
      } : undefined,
      exportData: {
        csv: this.exportCSV(),
        json: this.exportJSON(),
        heapDump: this.options.enableHeapDump ? 'Available via generateHeapDump()' : undefined,
      },
      generatedAt: Date.now(),
      recommendations,
    };
  }

  /**
   * Export memory data as CSV
   */
  exportCSV(): string {
    const headers = [
      'timestamp',
      'rss',
      'heapTotal',
      'heapUsed',
      'external',
      'arrayBuffers',
      'gcCount',
      'objectCount'
    ];

    const rows = this.snapshots.map(snapshot => [
      new Date(snapshot.timestamp).toISOString(),
      snapshot.usage.rss,
      snapshot.usage.heapTotal,
      snapshot.usage.heapUsed,
      snapshot.usage.external,
      snapshot.usage.arrayBuffers,
      snapshot.metadata?.gcCount || 0,
      snapshot.metadata?.objectCount || 0,
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Export memory data as JSON
   */
  exportJSON(): string {
    return JSON.stringify({
      snapshots: this.snapshots,
      alerts: this.alerts,
      gcEvents: this.gcEvents,
      pressureEvents: this.pressureEvents,
      leaks: Array.from(this.detectedLeaks.values()),
      options: this.options,
      exportedAt: Date.now(),
    }, null, 2);
  }

  /**
   * Reset monitor state
   */
  reset(): void {
    this.snapshots = [];
    this.alerts = [];
    this.gcEvents = [];
    this.pressureEvents = [];
    this.trackedObjects.clear();
    this.detectedLeaks.clear();
    this.baselineSnapshot = undefined;
    this.startTime = Date.now();
    
    this.emit('reset', { timestamp: Date.now() });
  }

  /**
   * Get baseline snapshot for comparisons
   */
  getBaseline(): MemorySnapshot | undefined {
    return this.baselineSnapshot;
  }

  /**
   * Set baseline snapshot for comparisons
   */
  setBaseline(snapshot?: MemorySnapshot): void {
    this.baselineSnapshot = snapshot || this.getCurrentSnapshot();
    this.emit('baselineSet', this.baselineSnapshot);
  }

  // Private methods

  private setupGCMonitoring(): void {
    if (!this.options.enableGCMonitoring) return;

    // Try to set up GC monitoring using performance hooks
    try {
      const { PerformanceObserver } = require('perf_hooks');
      
      this.gcObserver = new PerformanceObserver((list: any) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'gc') {
            const before = this.snapshots[this.snapshots.length - 2]?.usage;
            const after = this.getMemoryUsage();
            
            const gcEvent: GCEvent = {
              timestamp: Date.now() - entry.duration,
              type: this.mapGCKind(entry.detail?.kind),
              duration: entry.duration,
              memoryBefore: before || after,
              memoryAfter: after,
              freed: before ? before.heapUsed - after.heapUsed : 0,
              collections: 1,
            };

            this.recordGCEvent(gcEvent);
          }
        }
      });

      this.gcObserver.observe({ entryTypes: ['gc'] });
    } catch (error) {
      // GC monitoring not available, continue without it
    }
  }

  private mapGCKind(kind?: number): GCEvent['type'] {
    switch (kind) {
      case 1: return 'scavenge';
      case 2: return 'mark-sweep';
      case 4: return 'incremental';
      case 8: return 'weak-callback';
      default: return 'unknown';
    }
  }

  private recordGCEvent(event: GCEvent): void {
    this.gcEvents.push(event);
    
    // Maintain history size
    if (this.gcEvents.length > this.options.historySize) {
      this.gcEvents.shift();
    }

    // Check for GC frequency alerts
    const recentEvents = this.gcEvents.filter(
      e => Date.now() - e.timestamp < 60000 // Last minute
    );
    
    if (recentEvents.length > this.options.alertThresholds.gcFrequency) {
      this.createAlert({
        type: 'gc',
        severity: 'warning',
        message: `High GC frequency: ${recentEvents.length} events in the last minute`,
        details: { frequency: recentEvents.length, threshold: this.options.alertThresholds.gcFrequency },
      });
    }

    this.emit('gc', event);
  }

  private analyzeMemoryTrends(): void {
    if (!this.options.enableRegression || this.snapshots.length < this.options.regressionWindowSize) {
      return;
    }

    const recentSnapshots = this.snapshots.slice(-this.options.regressionWindowSize);
    
    // Check for memory growth in each metric
    const metrics: (keyof MemoryUsage)[] = ['rss', 'heapTotal', 'heapUsed', 'external', 'arrayBuffers'];
    
    for (const metric of metrics) {
      const trend = this.calculateLinearRegression(
        recentSnapshots.map(s => s.timestamp),
        recentSnapshots.map(s => s.usage[metric])
      );

      if (trend.growthRate > this.options.alertThresholds.memoryGrowth) {
        this.createAlert({
          type: 'growth',
          severity: trend.growthRate > this.options.leakDetectionThreshold ? 'error' : 'warning',
          message: `Memory growth detected in ${metric}: ${(trend.growthRate / 1024).toFixed(2)} KB/s`,
          details: { metric, trend },
        });
      }
    }
  }

  private detectMemoryLeaks(): void {
    if (this.snapshots.length < 10) return; // Need sufficient data

    const heapUsedTrend = this.calculateLinearRegression(
      this.snapshots.map(s => s.timestamp),
      this.snapshots.map(s => s.usage.heapUsed)
    );

    if (heapUsedTrend.growthRate > this.options.leakDetectionThreshold && 
        heapUsedTrend.correlation > 0.8) {
      
      const leakId = `leak_${++this.leakIdCounter}`;
      
      if (!this.detectedLeaks.has(leakId)) {
        const leak: MemoryLeak = {
          id: leakId,
          detectedAt: Date.now(),
          confidence: heapUsedTrend.correlation,
          growthRate: heapUsedTrend.growthRate,
          trend: heapUsedTrend,
          snapshots: this.snapshots.slice(-20), // Last 20 snapshots
          severity: this.calculateLeakSeverity(heapUsedTrend.growthRate),
          impact: this.calculateLeakImpact(heapUsedTrend),
          suggestions: this.generateLeakSuggestions(heapUsedTrend),
        };

        this.detectedLeaks.set(leakId, leak);
        
        this.createAlert({
          type: 'leak',
          severity: leak.severity === 'critical' ? 'critical' : 'error',
          message: `Memory leak detected: ${(leak.growthRate / 1024 / 1024).toFixed(2)} MB/s growth`,
          details: { leak },
        });

        this.emit('leakDetected', leak);
      }
    }
  }

  private checkMemoryPressure(): void {
    const current = this.getMemoryUsage();
    const heapLimit = v8 ? v8.getHeapStatistics().heap_size_limit : current.heapTotal * 2;
    
    const pressure: MemoryPressure = {
      level: 'normal',
      timestamp: Date.now(),
      usage: current,
      thresholds: {
        heapUsedPercent: (current.heapUsed / heapLimit) * 100,
        rssPercent: (current.rss / (process.platform === 'linux' ? 8 * 1024 * 1024 * 1024 : 16 * 1024 * 1024 * 1024)) * 100,
        externalPercent: (current.external / heapLimit) * 100,
      },
      impact: {
        performanceDegradation: 0,
        riskOfOOM: 0,
        gcPressure: 0,
      },
      recommendations: [],
    };

    // Determine pressure level
    if (pressure.thresholds.heapUsedPercent > this.options.pressureThresholds.heapUsed ||
        pressure.thresholds.rssPercent > this.options.pressureThresholds.rss) {
      pressure.level = 'critical';
      pressure.impact.performanceDegradation = 0.8;
      pressure.impact.riskOfOOM = 0.9;
      pressure.impact.gcPressure = 0.7;
      pressure.recommendations = [
        'Immediately reduce memory usage',
        'Consider increasing heap limit',
        'Force garbage collection',
        'Check for memory leaks',
      ];
    } else if (pressure.thresholds.heapUsedPercent > this.options.pressureThresholds.heapUsed * 0.8) {
      pressure.level = 'moderate';
      pressure.impact.performanceDegradation = 0.3;
      pressure.impact.riskOfOOM = 0.4;
      pressure.impact.gcPressure = 0.5;
      pressure.recommendations = [
        'Monitor memory usage closely',
        'Consider optimizing data structures',
        'Review caching strategies',
      ];
    }

    if (pressure.level !== 'normal') {
      this.pressureEvents.push(pressure);
      
      this.createAlert({
        type: 'pressure',
        severity: pressure.level === 'critical' ? 'critical' : 'warning',
        message: `Memory pressure detected: ${pressure.level} level`,
        details: { pressure },
      });

      this.emit('memoryPressure', pressure);
    }
  }

  private updateObjectTracking(): void {
    if (!this.options.enableObjectTracking) return;

    for (const [id, tracking] of this.trackedObjects.entries()) {
      const obj = tracking.weakRef.deref();
      
      if (obj === undefined) {
        // Object was garbage collected
        tracking.isAlive = false;
        this.emit('objectCollected', { id, tracking });
      } else {
        tracking.lastSeen = Date.now();
        
        // Check for potential leaks (objects alive too long)
        const age = Date.now() - tracking.createdAt;
        if (age > 300000) { // 5 minutes
          this.emit('suspectedObjectLeak', { id, tracking, age });
        }
      }
    }
  }

  private calculateUsageStatistics() {
    const usages = this.snapshots.map(s => s.usage);
    
    return {
      current: usages[usages.length - 1],
      min: {
        rss: Math.min(...usages.map(u => u.rss)),
        heapTotal: Math.min(...usages.map(u => u.heapTotal)),
        heapUsed: Math.min(...usages.map(u => u.heapUsed)),
        external: Math.min(...usages.map(u => u.external)),
        arrayBuffers: Math.min(...usages.map(u => u.arrayBuffers)),
      },
      max: {
        rss: Math.max(...usages.map(u => u.rss)),
        heapTotal: Math.max(...usages.map(u => u.heapTotal)),
        heapUsed: Math.max(...usages.map(u => u.heapUsed)),
        external: Math.max(...usages.map(u => u.external)),
        arrayBuffers: Math.max(...usages.map(u => u.arrayBuffers)),
      },
      avg: {
        rss: usages.reduce((sum, u) => sum + u.rss, 0) / usages.length,
        heapTotal: usages.reduce((sum, u) => sum + u.heapTotal, 0) / usages.length,
        heapUsed: usages.reduce((sum, u) => sum + u.heapUsed, 0) / usages.length,
        external: usages.reduce((sum, u) => sum + u.external, 0) / usages.length,
        arrayBuffers: usages.reduce((sum, u) => sum + u.arrayBuffers, 0) / usages.length,
      },
      peak: usages.reduce((peak, current) => 
        current.heapUsed > peak.heapUsed ? current : peak
      ),
      peakTime: this.snapshots.find(s => 
        s.usage.heapUsed === Math.max(...usages.map(u => u.heapUsed))
      )?.timestamp || 0,
    };
  }

  private calculateTrends() {
    const timestamps = this.snapshots.map(s => s.timestamp);
    
    return {
      rss: this.calculateLinearRegression(timestamps, this.snapshots.map(s => s.usage.rss)),
      heapTotal: this.calculateLinearRegression(timestamps, this.snapshots.map(s => s.usage.heapTotal)),
      heapUsed: this.calculateLinearRegression(timestamps, this.snapshots.map(s => s.usage.heapUsed)),
      external: this.calculateLinearRegression(timestamps, this.snapshots.map(s => s.usage.external)),
      arrayBuffers: this.calculateLinearRegression(timestamps, this.snapshots.map(s => s.usage.arrayBuffers)),
    };
  }

  private calculateLinearRegression(x: number[], y: number[]): MemoryTrend {
    const n = x.length;
    if (n < 2) {
      return {
        slope: 0,
        correlation: 0,
        isIncreasing: false,
        growthRate: 0,
      };
    }

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate correlation coefficient (R²)
    const meanX = sumX / n;
    const meanY = sumY / n;
    const ssXX = sumXX - n * meanX * meanX;
    const ssYY = sumYY - n * meanY * meanY;
    const ssXY = sumXY - n * meanX * meanY;
    const correlation = Math.abs(ssXY / Math.sqrt(ssXX * ssYY));

    const growthRate = slope; // bytes per millisecond
    const growthRatePerSecond = growthRate * 1000;

    const trend: MemoryTrend = {
      slope,
      correlation: Math.min(correlation, 1),
      isIncreasing: slope > 0,
      growthRate: growthRatePerSecond,
    };

    if (this.options.enablePrediction && x.length > 0) {
      const lastX = x[x.length - 1];
      const nextX = lastX + this.options.samplingInterval;
      const nextValue = slope * nextX + intercept;
      
      trend.prediction = {
        nextValue: Math.max(0, nextValue),
        confidence: correlation,
      };
    }

    return trend;
  }

  private calculateGCStatistics() {
    return {
      totalEvents: this.gcEvents.length,
      totalTime: this.gcEvents.reduce((sum, event) => sum + event.duration, 0),
      avgTime: this.gcEvents.length > 0 
        ? this.gcEvents.reduce((sum, event) => sum + event.duration, 0) / this.gcEvents.length 
        : 0,
      frequency: this.gcEvents.length > 0 
        ? (this.gcEvents.length / (Date.now() - this.startTime)) * 60000 // events per minute
        : 0,
      totalFreed: this.gcEvents.reduce((sum, event) => sum + event.freed, 0),
      avgFreed: this.gcEvents.length > 0 
        ? this.gcEvents.reduce((sum, event) => sum + event.freed, 0) / this.gcEvents.length 
        : 0,
      lastEvent: this.gcEvents[this.gcEvents.length - 1],
    };
  }

  private getLeakStatistics() {
    const leaks = Array.from(this.detectedLeaks.values());
    return {
      detected: leaks,
      suspected: leaks.filter(l => l.confidence < 0.8).length,
      confirmed: leaks.filter(l => l.confidence >= 0.8).length,
      totalGrowthRate: leaks.reduce((sum, leak) => sum + leak.growthRate, 0),
    };
  }

  private getPressureStatistics() {
    const current = this.pressureEvents[this.pressureEvents.length - 1] || {
      level: 'normal' as const,
      timestamp: Date.now(),
      usage: this.getMemoryUsage(),
      thresholds: { heapUsedPercent: 0, rssPercent: 0, externalPercent: 0 },
      impact: { performanceDegradation: 0, riskOfOOM: 0, gcPressure: 0 },
      recommendations: [],
    };

    return {
      current,
      events: this.pressureEvents.length,
      criticalEvents: this.pressureEvents.filter(e => e.level === 'critical').length,
      avgLevel: this.pressureEvents.length > 0 
        ? this.pressureEvents.filter(e => e.level !== 'normal').length / this.pressureEvents.length 
        : 0,
    };
  }

  private getObjectStatistics() {
    const objects = Array.from(this.trackedObjects.values());
    return {
      tracked: objects.length,
      alive: objects.filter(o => o.isAlive).length,
      collected: objects.filter(o => !o.isAlive).length,
      leaking: objects.filter(o => o.isAlive && (Date.now() - o.createdAt) > 300000).length,
    };
  }

  private calculateLeakSeverity(growthRate: number): MemoryLeak['severity'] {
    const mbPerSecond = growthRate / (1024 * 1024);
    
    if (mbPerSecond > 10) return 'critical';
    if (mbPerSecond > 5) return 'high';
    if (mbPerSecond > 1) return 'medium';
    return 'low';
  }

  private calculateLeakImpact(trend: MemoryTrend): string {
    const mbPerSecond = trend.growthRate / (1024 * 1024);
    const hoursToGb = (1024 / mbPerSecond) / 3600;
    
    return `At current growth rate (${mbPerSecond.toFixed(2)} MB/s), ` +
           `memory will reach 1GB in ${hoursToGb.toFixed(1)} hours`;
  }

  private generateLeakSuggestions(trend: MemoryTrend): string[] {
    const suggestions = [
      'Check for event listeners that are not properly removed',
      'Review closures that might be holding references to large objects',
      'Examine cache implementations for proper cleanup',
      'Look for circular references in object graphs',
    ];

    if (trend.growthRate > 5 * 1024 * 1024) { // > 5MB/s
      suggestions.unshift('Immediately investigate - growth rate is extremely high');
    }

    return suggestions;
  }

  private calculateTimeToLimit(currentUsage: number, growthRate: number): number | undefined {
    if (!v8 || growthRate <= 0) return undefined;
    
    const heapLimit = v8.getHeapStatistics().heap_size_limit;
    const remainingBytes = heapLimit - currentUsage;
    
    return (remainingBytes / growthRate) * 1000; // milliseconds
  }

  private determineHealthStatus(): 'healthy' | 'warning' | 'critical' {
    const criticalAlerts = this.alerts.filter(a => a.severity === 'critical' && !a.acknowledged);
    const errorAlerts = this.alerts.filter(a => a.severity === 'error' && !a.acknowledged);
    
    if (criticalAlerts.length > 0 || this.detectedLeaks.size > 0) {
      return 'critical';
    }
    
    if (errorAlerts.length > 0 || this.pressureEvents.some(e => e.level === 'moderate')) {
      return 'warning';
    }
    
    return 'healthy';
  }

  private generateRecommendations(statistics: MemoryStatistics, leaks: MemoryLeak[]) {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Immediate recommendations
    if (leaks.length > 0) {
      immediate.push('Investigate detected memory leaks immediately');
    }
    
    if (statistics.pressure.current.level === 'critical') {
      immediate.push('Memory pressure is critical - reduce memory usage now');
    }

    if (statistics.gc.frequency > 20) {
      immediate.push('High GC frequency detected - optimize memory allocations');
    }

    // Short-term recommendations
    if (statistics.trends.heapUsed.isIncreasing) {
      shortTerm.push('Monitor heap usage trend - consider optimization');
    }

    if (statistics.objects.leaking > 0) {
      shortTerm.push('Review object lifecycle management');
    }

    // Long-term recommendations
    longTerm.push('Implement regular memory monitoring in production');
    longTerm.push('Consider memory profiling during development');
    longTerm.push('Set up automated alerts for memory anomalies');

    return { immediate, shortTerm, longTerm };
  }

  private createAlert(alertData: Omit<MemoryAlert, 'id' | 'timestamp' | 'acknowledged'>): void {
    const alert: MemoryAlert = {
      id: `alert_${++this.alertIdCounter}`,
      timestamp: Date.now(),
      acknowledged: false,
      ...alertData,
    };

    this.alerts.push(alert);
    
    // Maintain alerts history
    if (this.alerts.length > this.options.historySize) {
      this.alerts.shift();
    }

    this.emit('alert', alert);
  }

  private cleanup(): void {
    const cutoff = Date.now() - this.options.retentionPeriod;
    
    // Clean old snapshots
    this.snapshots = this.snapshots.filter(s => s.timestamp > cutoff);
    
    // Clean old alerts
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff);
    
    // Clean old GC events
    this.gcEvents = this.gcEvents.filter(e => e.timestamp > cutoff);
    
    // Clean old pressure events
    this.pressureEvents = this.pressureEvents.filter(e => e.timestamp > cutoff);
    
    // Clean dead object tracking
    for (const [id, tracking] of this.trackedObjects.entries()) {
      if (!tracking.isAlive && tracking.lastSeen < cutoff) {
        this.trackedObjects.delete(id);
      }
    }
  }
}

// Factory functions and utilities

/**
 * Create a new memory monitor instance
 */
export function createMemoryMonitor(options?: MemoryMonitorOptions): MemoryMonitor {
  return new MemoryMonitor(options);
}

/**
 * Global memory monitor instance (singleton)
 */
let globalMonitor: MemoryMonitor | undefined;

/**
 * Get or create the global memory monitor
 */
export function memoryMonitor(options?: MemoryMonitorOptions): MemoryMonitor {
  if (!globalMonitor) {
    globalMonitor = new MemoryMonitor(options);
  }
  return globalMonitor;
}

/**
 * Quick memory check - take a snapshot and return current usage
 */
export function quickMemoryCheck(): MemoryUsage {
  const monitor = new MemoryMonitor();
  return monitor.getMemoryUsage();
}

/**
 * Monitor a function's memory usage
 */
export function monitorMemory<T extends (...args: any[]) => any>(
  fn: T,
  options?: MemoryMonitorOptions
): T & { getMemoryReport: () => MemoryReport } {
  const monitor = createMemoryMonitor(options);
  monitor.start();

  const wrappedFunction = ((...args: Parameters<T>) => {
    const beforeSnapshot = monitor.takeSnapshot();
    
    try {
      const result = fn(...args);
      
      if (result instanceof Promise) {
        return result.finally(() => {
          const afterSnapshot = monitor.takeSnapshot();
          const comparison = monitor.compareSnapshots(beforeSnapshot, afterSnapshot);
          monitor.emit('functionMemoryUsage', { comparison, args, result });
        });
      } else {
        const afterSnapshot = monitor.takeSnapshot();
        const comparison = monitor.compareSnapshots(beforeSnapshot, afterSnapshot);
        monitor.emit('functionMemoryUsage', { comparison, args, result });
        return result;
      }
    } catch (error) {
      const afterSnapshot = monitor.takeSnapshot();
      const comparison = monitor.compareSnapshots(beforeSnapshot, afterSnapshot);
      monitor.emit('functionMemoryUsage', { comparison, args, error });
      throw error;
    }
  }) as T & { getMemoryReport: () => MemoryReport };

  wrappedFunction.getMemoryReport = () => monitor.generateReport();

  return wrappedFunction;
}

export default MemoryMonitor;