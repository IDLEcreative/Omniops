/**
 * Chat Telemetry Collectors
 * Metric collection and tracking functionality
 */

import type {
  SearchOperation,
  TokenUsage,
  ChatSession,
  LogLevel,
  LogCategory,
  LogEntry,
  MODEL_PRICING
} from './chat-telemetry-types';
import { MODEL_PRICING as PRICING } from './chat-telemetry-types';

/**
 * Track a search operation in the session
 */
export function trackSearch(
  session: ChatSession,
  logBuffer: LogEntry[],
  operation: Omit<SearchOperation, 'duration'> & { startTime: number },
  metricsEnabled: boolean,
  detailedLogging: boolean
): void {
  const duration = Date.now() - operation.startTime;
  const searchOp: SearchOperation = {
    tool: operation.tool,
    query: operation.query,
    resultCount: operation.resultCount,
    source: operation.source,
    duration
  };

  session.searches.push(searchOp);

  if (metricsEnabled) {
    logMessage(
      session,
      logBuffer,
      'info',
      'search',
      `Search completed: ${operation.tool}`,
      {
        query: operation.query,
        results: operation.resultCount,
        duration: `${duration}ms`,
        source: operation.source
      },
      detailedLogging
    );
  }
}

/**
 * Track an AI iteration
 */
export function trackIteration(
  session: ChatSession,
  logBuffer: LogEntry[],
  iterationNumber: number,
  toolCalls: number,
  detailedLogging: boolean
): void {
  session.iterations = iterationNumber;
  logMessage(
    session,
    logBuffer,
    'info',
    'ai',
    `AI Iteration ${iterationNumber}`,
    {
      toolCalls,
      searchesSoFar: session.searches.length
    },
    detailedLogging
  );
}

/**
 * Track token usage from OpenAI response
 */
export function trackTokenUsage(
  session: ChatSession,
  logBuffer: LogEntry[],
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number },
  detailedLogging: boolean
): void {
  if (!usage) return;

  const inputTokens = usage.prompt_tokens || 0;
  const outputTokens = usage.completion_tokens || 0;
  const totalTokens = usage.total_tokens || (inputTokens + outputTokens);
  const costUSD = calculateCost(session.model, inputTokens, outputTokens);

  // Update or accumulate token usage
  if (session.tokenUsage) {
    session.tokenUsage.input += inputTokens;
    session.tokenUsage.output += outputTokens;
    session.tokenUsage.total += totalTokens;
    session.tokenUsage.costUSD += costUSD;
  } else {
    session.tokenUsage = {
      input: inputTokens,
      output: outputTokens,
      total: totalTokens,
      costUSD
    };
  }

  // Keep deprecated field for compatibility
  session.tokensUsed = session.tokenUsage.total;

  logMessage(
    session,
    logBuffer,
    'info',
    'ai',
    'Token usage tracked',
    {
      input: inputTokens,
      output: outputTokens,
      total: totalTokens,
      costUSD: costUSD.toFixed(6),
      cumulativeCost: session.tokenUsage.costUSD.toFixed(6)
    },
    detailedLogging
  );
}

/**
 * Calculate cost based on model and token usage
 */
export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING[model] || PRICING['default'];

  const inputCost = (inputTokens / 1000000) * pricing!.inputPricePerMillion;
  const outputCost = (outputTokens / 1000000) * pricing!.outputPricePerMillion;

  return inputCost + outputCost;
}

/**
 * Log a message with structured context
 */
export function logMessage(
  session: ChatSession,
  logBuffer: LogEntry[],
  level: LogLevel,
  category: LogCategory,
  message: string,
  data: any,
  detailedLogging: boolean
): void {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    sessionId: session.sessionId,
    level,
    category,
    message,
    data,
    duration: Date.now() - session.startTime
  };

  // Always log errors and warnings
  if (level === 'error' || level === 'warn') {
    console.error(`[${category.toUpperCase()}] ${message}`, data);
  } else if (detailedLogging) {
    console.log(`[${category.toUpperCase()}] ${message}`, data || '');
  }

  logBuffer.push(logEntry);
}
