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

interface TokenUsage {
  input: number;
  output: number;
  total: number;
  costUSD: number;
}

interface ModelPricing {
  inputPricePerMillion: number;
  outputPricePerMillion: number;
}

interface ChatSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  model: string;
  iterations: number;
  searches: SearchOperation[];
  tokensUsed?: number; // Deprecated - kept for compatibility
  tokenUsage?: TokenUsage;
  finalResponse?: string;
  error?: string;
  modelConfig?: any;
  domain?: string;
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
  private static readonly MODEL_PRICING: Record<string, ModelPricing> = {
    'gpt-5-mini': { inputPricePerMillion: 0.25, outputPricePerMillion: 2.00 },
    'gpt-4.1': { inputPricePerMillion: 10.00, outputPricePerMillion: 30.00 },
    'gpt-4-turbo': { inputPricePerMillion: 10.00, outputPricePerMillion: 30.00 },
    'gpt-4': { inputPricePerMillion: 30.00, outputPricePerMillion: 60.00 },
    'gpt-3.5-turbo': { inputPricePerMillion: 0.50, outputPricePerMillion: 1.50 },
    'default': { inputPricePerMillion: 5.00, outputPricePerMillion: 15.00 }
  };

  constructor(
    sessionId: string, 
    model: string,
    options: {
      metricsEnabled?: boolean;
      detailedLogging?: boolean;
      persistToDatabase?: boolean;
      domain?: string;
    } = {}
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
   * Track token usage from OpenAI response
   */
  trackTokenUsage(usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }) {
    if (!usage) return;

    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || (inputTokens + outputTokens);
    const costUSD = this.calculateCost(inputTokens, outputTokens);

    // Update or accumulate token usage
    if (this.session.tokenUsage) {
      this.session.tokenUsage.input += inputTokens;
      this.session.tokenUsage.output += outputTokens;
      this.session.tokenUsage.total += totalTokens;
      this.session.tokenUsage.costUSD += costUSD;
    } else {
      this.session.tokenUsage = {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens,
        costUSD
      };
    }

    // Keep deprecated field for compatibility
    this.session.tokensUsed = this.session.tokenUsage.total;

    this.log('info', 'ai', 'Token usage tracked', {
      input: inputTokens,
      output: outputTokens,
      total: totalTokens,
      costUSD: costUSD.toFixed(6),
      cumulativeCost: this.session.tokenUsage.costUSD.toFixed(6)
    });
  }

  /**
   * Calculate cost based on model and token usage
   */
  private calculateCost(inputTokens: number, outputTokens: number): number {
    const pricing = ChatTelemetry.MODEL_PRICING[this.session.model] || 
                   ChatTelemetry.MODEL_PRICING['default'];
    
    const inputCost = (inputTokens / 1000000) * pricing!.inputPricePerMillion;
    const outputCost = (outputTokens / 1000000) * pricing!.outputPricePerMillion;
    
    return inputCost + outputCost;
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
      tokens: this.session.tokenUsage ? {
        input: this.session.tokenUsage.input,
        output: this.session.tokenUsage.output,
        total: this.session.tokenUsage.total,
        costUSD: this.session.tokenUsage.costUSD.toFixed(6),
        costBreakdown: {
          inputCost: ((this.session.tokenUsage.input / 1000000) * 
            (ChatTelemetry.MODEL_PRICING[this.session.model]?.inputPricePerMillion || 5)).toFixed(6),
          outputCost: ((this.session.tokenUsage.output / 1000000) * 
            (ChatTelemetry.MODEL_PRICING[this.session.model]?.outputPricePerMillion || 15)).toFixed(6)
        }
      } : undefined,
      success: !this.session.error,
      error: this.session.error,
      domain: this.session.domain
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
        // Token tracking
        input_tokens: this.session.tokenUsage?.input,
        output_tokens: this.session.tokenUsage?.output,
        // total_tokens is a generated column, don't insert
        cost_usd: this.session.tokenUsage?.costUSD,
        tokens_used: this.session.tokenUsage?.total, // Deprecated field for compatibility
        // Model configuration
        model_config: this.session.modelConfig,
        // Status
        success: !this.session.error,
        error: this.session.error,
        logs: this.logBuffer,
        // Domain tracking
        domain: this.session.domain
      });

    if (error) {
      console.error('Failed to persist telemetry:', error);
    } else {
      this.log('info', 'performance', 'Telemetry persisted to database', {
        sessionId: this.session.sessionId,
        tokenUsage: this.session.tokenUsage,
        cost: this.session.tokenUsage?.costUSD.toFixed(6)
      });
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
    
    // Log session creation with model info
    console.log(`[TelemetryManager] Created session ${sessionId} with model ${model}`);
    
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
    let totalTokens = { input: 0, output: 0, total: 0 };
    
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
  getCostAnalytics(hoursBack: number = 24) {
    const cutoffTime = Date.now() - (hoursBack * 60 * 60 * 1000);
    const relevantSessions = [];
    
    for (const [id, session] of this.sessions.entries()) {
      const metrics = session.getMetrics();
      if (session['session'].startTime >= cutoffTime) {
        relevantSessions.push(metrics);
      }
    }
    
    const totalCost = relevantSessions.reduce((sum, s) => 
      sum + (s.tokenUsage?.costUSD || 0), 0);
    
    const byModel = relevantSessions.reduce((acc, s) => {
      if (!acc[s.model]) {
        acc[s.model] = { count: 0, cost: 0, tokens: 0 };
      }
      acc[s.model].count++;
      acc[s.model].cost += s.tokenUsage?.costUSD || 0;
      acc[s.model].tokens += s.tokenUsage?.total || 0;
      return acc;
    }, {} as Record<string, any>);
    
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
}

export const telemetryManager = TelemetryManager.getInstance();