/**
 * Chat Telemetry and Observability System
 * Provides structured logging, metrics, and tracing for the intelligent chat system
 */

import { createClient } from '@supabase/supabase-js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory = 'search' | 'ai' | 'tool' | 'performance' | 'error';

interface SearchOperation {
  tool: string;
  query: string;
  resultCount: number;
  duration: number;
  source: string;
}

interface ChatSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  model: string;
  iterations: number;
  searches: SearchOperation[];
  tokensUsed?: number;
  finalResponse?: string;
  error?: string;
}

/**
 * Telemetry class for comprehensive observability
 */
export class ChatTelemetry {
  private session: ChatSession;
  private logBuffer: any[] = [];
  private metricsEnabled: boolean;
  private detailedLogging: boolean;
  private supabase: any;

  constructor(
    sessionId: string, 
    model: string,
    options: {
      metricsEnabled?: boolean;
      detailedLogging?: boolean;
      persistToDatabase?: boolean;
    } = {}
  ) {
    this.session = {
      sessionId,
      startTime: Date.now(),
      model,
      iterations: 0,
      searches: []
    };
    
    this.metricsEnabled = options.metricsEnabled ?? true;
    this.detailedLogging = options.detailedLogging ?? process.env.NODE_ENV === 'development';
    
    if (options.persistToDatabase && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    }
  }

  /**
   * Log a message with structured context
   */
  log(level: LogLevel, category: LogCategory, message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      sessionId: this.session.sessionId,
      level,
      category,
      message,
      data,
      duration: Date.now() - this.session.startTime
    };

    // Always log errors and warnings
    if (level === 'error' || level === 'warn') {
      console.error(`[${category.toUpperCase()}] ${message}`, data);
    } else if (this.detailedLogging) {
      console.log(`[${category.toUpperCase()}] ${message}`, data || '');
    }

    this.logBuffer.push(logEntry);
  }

  /**
   * Track a search operation
   */
  trackSearch(operation: Omit<SearchOperation, 'duration'> & { startTime: number }) {
    const duration = Date.now() - operation.startTime;
    const searchOp: SearchOperation = {
      tool: operation.tool,
      query: operation.query,
      resultCount: operation.resultCount,
      source: operation.source,
      duration
    };

    this.session.searches.push(searchOp);
    
    if (this.metricsEnabled) {
      this.log('info', 'search', `Search completed: ${operation.tool}`, {
        query: operation.query,
        results: operation.resultCount,
        duration: `${duration}ms`,
        source: operation.source
      });
    }
  }

  /**
   * Track an AI iteration
   */
  trackIteration(iterationNumber: number, toolCalls: number) {
    this.session.iterations = iterationNumber;
    this.log('info', 'ai', `AI Iteration ${iterationNumber}`, {
      toolCalls,
      searchesSoFar: this.session.searches.length
    });
  }

  /**
   * Complete the session and generate summary
   */
  async complete(finalResponse?: string, error?: string) {
    this.session.endTime = Date.now();
    this.session.totalDuration = this.session.endTime - this.session.startTime;
    this.session.finalResponse = finalResponse;
    this.session.error = error;

    const summary = this.generateSummary();
    
    // Log summary
    console.log('\n📊 CHAT SESSION SUMMARY', summary);

    // Persist to database if enabled
    if (this.supabase) {
      try {
        await this.persistSession();
      } catch (err) {
        console.error('Failed to persist telemetry:', err);
      }
    }

    return summary;
  }

  /**
   * Generate a human-readable summary
   */
  private generateSummary() {
    const totalSearches = this.session.searches.length;
    const totalResults = this.session.searches.reduce((sum, s) => sum + s.resultCount, 0);
    const avgSearchTime = totalSearches > 0 
      ? this.session.searches.reduce((sum, s) => sum + s.duration, 0) / totalSearches 
      : 0;

    const searchBreakdown = this.session.searches.reduce((acc, search) => {
      acc[search.source] = (acc[search.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      sessionId: this.session.sessionId,
      model: this.session.model,
      totalDuration: `${this.session.totalDuration}ms`,
      iterations: this.session.iterations,
      searches: {
        total: totalSearches,
        totalResults,
        avgTime: `${avgSearchTime.toFixed(0)}ms`,
        breakdown: searchBreakdown
      },
      success: !this.session.error,
      error: this.session.error
    };
  }

  /**
   * Persist session to database for analytics
   */
  private async persistSession() {
    if (!this.supabase) return;

    const { error } = await this.supabase
      .from('chat_telemetry')
      .insert({
        session_id: this.session.sessionId,
        model: this.session.model,
        start_time: new Date(this.session.startTime).toISOString(),
        end_time: new Date(this.session.endTime!).toISOString(),
        duration_ms: this.session.totalDuration,
        iterations: this.session.iterations,
        search_count: this.session.searches.length,
        total_results: this.session.searches.reduce((sum, s) => sum + s.resultCount, 0),
        searches: this.session.searches,
        success: !this.session.error,
        error: this.session.error,
        logs: this.logBuffer
      });

    if (error) {
      console.error('Failed to persist telemetry:', error);
    }
  }

  /**
   * Get current metrics for monitoring
   */
  getMetrics() {
    return {
      sessionId: this.session.sessionId,
      uptime: Date.now() - this.session.startTime,
      iterations: this.session.iterations,
      searches: this.session.searches.length,
      totalResults: this.session.searches.reduce((sum, s) => sum + s.resultCount, 0),
      logCount: this.logBuffer.length
    };
  }

  /**
   * Export logs for debugging
   */
  exportLogs() {
    return {
      session: this.session,
      logs: this.logBuffer
    };
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

  createSession(sessionId: string, model: string, options?: any): ChatTelemetry {
    const telemetry = new ChatTelemetry(sessionId, model, options);
    this.sessions.set(sessionId, telemetry);
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
    for (const [id, session] of this.sessions.entries()) {
      metrics.push(session.getMetrics());
    }
    return metrics;
  }
}

export const telemetryManager = TelemetryManager.getInstance();