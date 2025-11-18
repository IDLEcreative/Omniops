/**
 * Chat Telemetry and Observability System
 * Provides structured logging, metrics, and tracing for the intelligent chat system
 */

import type {
  LogLevel,
  LogCategory,
  ChatSession,
  TokenUsage,
  TelemetryOptions,
  SessionSummary,
  SessionMetrics,
  CostAnalytics,
  LogEntry
} from './chat-telemetry-types';

import {
  trackSearch as collectSearch,
  trackIteration as collectIteration,
  trackTokenUsage as collectTokenUsage,
  logMessage
} from './chat-telemetry-collectors';

import {
  generateSummary as createSummary,
  persistSession as saveToDB,
  exportLogs as getLogs
} from './chat-telemetry-reporters';

// Re-export types for backward compatibility
export type { LogLevel, LogCategory };

/**
 * ChatTelemetry class for comprehensive observability
 */
export class ChatTelemetry {
  private session: ChatSession;
  private logBuffer: LogEntry[] = [];
  private metricsEnabled: boolean;
  private detailedLogging: boolean;
  private persistToDatabase: boolean;

  constructor(
    sessionId: string,
    model: string,
    options: TelemetryOptions = {}
  ) {
    this.session = {
      sessionId,
      startTime: Date.now(),
      model,
      iterations: 0,
      searches: [],
      domain: options.domain
    };

    this.metricsEnabled = options.metricsEnabled ?? true;
    this.detailedLogging = options.detailedLogging ?? process.env.NODE_ENV === 'development';
    this.persistToDatabase = options.persistToDatabase ?? false;
  }

  /**
   * Log a message with structured context
   */
  log(level: LogLevel, category: LogCategory, message: string, data?: any) {
    logMessage(this.session, this.logBuffer, level, category, message, data, this.detailedLogging);
  }

  /**
   * Track a search operation
   */
  trackSearch(operation: { tool: string; query: string; resultCount: number; source: string; startTime: number }) {
    collectSearch(this.session, this.logBuffer, operation, this.metricsEnabled, this.detailedLogging);
  }

  /**
   * Track an AI iteration
   */
  trackIteration(iterationNumber: number, toolCalls: number) {
    collectIteration(this.session, this.logBuffer, iterationNumber, toolCalls, this.detailedLogging);
  }

  /**
   * Track token usage from OpenAI response
   */
  trackTokenUsage(usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }) {
    collectTokenUsage(this.session, this.logBuffer, usage, this.detailedLogging);
  }

  /**
   * Set model configuration for tracking
   */
  setModelConfig(config: any) {
    this.session.modelConfig = config;
  }

  /**
   * Get current token usage and cost
   */
  getTokenUsage(): TokenUsage | undefined {
    return this.session.tokenUsage;
  }

  /**
   * Complete the session and generate summary
   */
  async complete(finalResponse?: string, error?: string): Promise<SessionSummary> {
    this.session.endTime = Date.now();
    this.session.totalDuration = this.session.endTime - this.session.startTime;
    this.session.finalResponse = finalResponse;
    this.session.error = error;

    const summary = createSummary(this.session);

    // Log summary

    // Persist to database if enabled
    if (this.persistToDatabase) {
      try {
        await saveToDB(this.session, this.logBuffer, this.persistToDatabase, this.detailedLogging);
      } catch (err) {
        console.error('Failed to persist telemetry:', err);
      }
    }

    return summary;
  }

  /**
   * Get current metrics for monitoring
   */
  getMetrics(): SessionMetrics {
    return {
      sessionId: this.session.sessionId,
      uptime: Date.now() - this.session.startTime,
      iterations: this.session.iterations,
      searches: this.session.searches.length,
      totalResults: this.session.searches.reduce((sum, s) => sum + s.resultCount, 0),
      logCount: this.logBuffer.length,
      tokenUsage: this.session.tokenUsage,
      estimatedCost: this.session.tokenUsage?.costUSD,
      model: this.session.model,
      domain: this.session.domain
    };
  }

  /**
   * Export logs for debugging
   */
  exportLogs() {
    return getLogs(this.session, this.logBuffer);
  }
}

/**
 * Singleton manager for all active telemetry sessions
 */
class TelemetryManager {
  private static instance: TelemetryManager;
  private sessions: Map<string, ChatTelemetry> = new Map();

  static getInstance() {
    if (!TelemetryManager.instance) {
      TelemetryManager.instance = new TelemetryManager();
    }
    return TelemetryManager.instance;
  }

  createSession(sessionId: string, model: string, options?: TelemetryOptions): ChatTelemetry {
    // Clean up old sessions first (automatic garbage collection)
    this.clearOldSessions(300000); // Clear sessions older than 5 minutes

    const telemetry = new ChatTelemetry(sessionId, model, options);
    this.sessions.set(sessionId, telemetry);

    // Log session creation with model info

    return telemetry;
  }

  getSession(sessionId: string): ChatTelemetry | undefined {
    return this.sessions.get(sessionId);
  }

  clearOldSessions(maxAge: number = 3600000) { // 1 hour default
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      const metrics = session.getMetrics();
      if (now - metrics.uptime > maxAge) {
        this.sessions.delete(id);
      }
    }
  }

  getAllMetrics() {
    const metrics = [];
    let totalCost = 0;
    const totalTokens = { input: 0, output: 0, total: 0 };

    for (const [id, session] of this.sessions.entries()) {
      const sessionMetrics = session.getMetrics();
      metrics.push(sessionMetrics);

      if (sessionMetrics.tokenUsage) {
        totalCost += sessionMetrics.tokenUsage.costUSD;
        totalTokens.input += sessionMetrics.tokenUsage.input;
        totalTokens.output += sessionMetrics.tokenUsage.output;
        totalTokens.total += sessionMetrics.tokenUsage.total;
      }
    }

    return {
      sessions: metrics,
      summary: {
        activeSessions: metrics.length,
        totalCostUSD: totalCost,
        totalTokens,
        avgCostPerSession: metrics.length > 0 ? totalCost / metrics.length : 0
      }
    };
  }

  /**
   * Get cost analytics for monitoring
   */
  getCostAnalytics(hoursBack: number = 24): CostAnalytics {
    const cutoffTime = Date.now() - (hoursBack * 60 * 60 * 1000);
    const relevantSessions = [];

    for (const [id, session] of this.sessions.entries()) {
      const metrics = session.getMetrics();
      if ((metrics.uptime + this.getStartTime(session)) >= cutoffTime) {
        relevantSessions.push(metrics);
      }
    }

    const totalCost = relevantSessions.reduce((sum, s) =>
      sum + (s.tokenUsage?.costUSD || 0), 0);

    const byModel = relevantSessions.reduce((acc, s) => {
      if (!acc[s.model]) {
        acc[s.model] = { count: 0, cost: 0, tokens: 0 };
      }
      const modelStats = acc[s.model];
      if (modelStats) {
        modelStats.count++;
        modelStats.cost += s.tokenUsage?.costUSD || 0;
        modelStats.tokens += s.tokenUsage?.total || 0;
      }
      return acc;
    }, {} as Record<string, { count: number; cost: number; tokens: number }>);

    return {
      period: `${hoursBack} hours`,
      totalSessions: relevantSessions.length,
      totalCostUSD: totalCost,
      avgCostPerSession: relevantSessions.length > 0 ? totalCost / relevantSessions.length : 0,
      modelBreakdown: byModel,
      hourlyRate: totalCost / hoursBack,
      projectedDailyCost: (totalCost / hoursBack) * 24,
      projectedMonthlyCost: (totalCost / hoursBack) * 24 * 30
    };
  }

  private getStartTime(session: ChatTelemetry): number {
    const metrics = session.getMetrics();
    return Date.now() - metrics.uptime;
  }
}

export const telemetryManager = TelemetryManager.getInstance();
