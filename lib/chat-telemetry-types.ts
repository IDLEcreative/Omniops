/**
 * Chat Telemetry Types and Constants
 * Type definitions and constants for the telemetry system
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory = 'search' | 'ai' | 'tool' | 'performance' | 'error' | 'mcp' | 'config' | 'conversation';

export interface SearchOperation {
  tool: string;
  query: string;
  resultCount: number;
  duration: number;
  source: string;
}

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
  costUSD: number;
}

export interface ModelPricing {
  inputPricePerMillion: number;
  outputPricePerMillion: number;
}

export interface ChatSession {
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

export interface LogEntry {
  timestamp: string;
  sessionId: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  duration: number;
}

export interface TelemetryOptions {
  metricsEnabled?: boolean;
  detailedLogging?: boolean;
  persistToDatabase?: boolean;
  domain?: string;
}

export interface SessionSummary {
  sessionId: string;
  model: string;
  totalDuration: string;
  iterations: number;
  searches: {
    total: number;
    totalResults: number;
    avgTime: string;
    breakdown: Record<string, number>;
  };
  tokens?: {
    input: number;
    output: number;
    total: number;
    costUSD: string;
    costBreakdown: {
      inputCost: string;
      outputCost: string;
    };
  };
  success: boolean;
  error?: string;
  domain?: string;
}

export interface SessionMetrics {
  sessionId: string;
  uptime: number;
  iterations: number;
  searches: number;
  totalResults: number;
  logCount: number;
  tokenUsage?: TokenUsage;
  estimatedCost?: number;
  model: string;
  domain?: string;
}

export interface CostAnalytics {
  period: string;
  totalSessions: number;
  totalCostUSD: number;
  avgCostPerSession: number;
  modelBreakdown: Record<string, {
    count: number;
    cost: number;
    tokens: number;
  }>;
  hourlyRate: number;
  projectedDailyCost: number;
  projectedMonthlyCost: number;
}

/**
 * Model pricing configuration
 * Prices per million tokens
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  'gpt-5-mini': { inputPricePerMillion: 0.25, outputPricePerMillion: 2.00 },
  'gpt-4.1': { inputPricePerMillion: 10.00, outputPricePerMillion: 30.00 },
  'gpt-4-turbo': { inputPricePerMillion: 10.00, outputPricePerMillion: 30.00 },
  'gpt-4': { inputPricePerMillion: 30.00, outputPricePerMillion: 60.00 },
  'gpt-3.5-turbo': { inputPricePerMillion: 0.50, outputPricePerMillion: 1.50 },
  'default': { inputPricePerMillion: 5.00, outputPricePerMillion: 15.00 }
};
