/**
 * Chat Telemetry Reporters
 * Session summary generation and data persistence
 */

import { createClient } from '@supabase/supabase-js';
import type {
  ChatSession,
  SessionSummary,
  LogEntry,
  MODEL_PRICING
} from './chat-telemetry-types';
import { MODEL_PRICING as PRICING } from './chat-telemetry-types';
import { logMessage } from './chat-telemetry-collectors';

// Singleton Supabase client for all telemetry
let telemetrySupabase: any = null;

function getTelemetrySupabase() {
  if (!telemetrySupabase && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    telemetrySupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return telemetrySupabase;
}

/**
 * Generate a human-readable summary of the session
 */
export function generateSummary(session: ChatSession): SessionSummary {
  const totalSearches = session.searches.length;
  const totalResults = session.searches.reduce((sum, s) => sum + s.resultCount, 0);
  const avgSearchTime = totalSearches > 0
    ? session.searches.reduce((sum, s) => sum + s.duration, 0) / totalSearches
    : 0;

  const searchBreakdown = session.searches.reduce((acc, search) => {
    acc[search.source] = (acc[search.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    sessionId: session.sessionId,
    model: session.model,
    totalDuration: `${session.totalDuration}ms`,
    iterations: session.iterations,
    searches: {
      total: totalSearches,
      totalResults,
      avgTime: `${avgSearchTime.toFixed(0)}ms`,
      breakdown: searchBreakdown
    },
    tokens: session.tokenUsage ? {
      input: session.tokenUsage.input,
      output: session.tokenUsage.output,
      total: session.tokenUsage.total,
      costUSD: session.tokenUsage.costUSD.toFixed(6),
      costBreakdown: {
        inputCost: ((session.tokenUsage.input / 1000000) *
          (PRICING[session.model]?.inputPricePerMillion || 5)).toFixed(6),
        outputCost: ((session.tokenUsage.output / 1000000) *
          (PRICING[session.model]?.outputPricePerMillion || 15)).toFixed(6)
      }
    } : undefined,
    success: !session.error,
    error: session.error,
    domain: session.domain
  };
}

/**
 * Persist session to database for analytics
 */
export async function persistSession(
  session: ChatSession,
  logBuffer: LogEntry[],
  persistToDatabase: boolean,
  detailedLogging: boolean
): Promise<void> {
  const supabase = persistToDatabase ? getTelemetrySupabase() : null;
  if (!supabase) return;

  const { error } = await supabase
    .from('chat_telemetry')
    .insert({
      session_id: session.sessionId,
      model: session.model,
      start_time: new Date(session.startTime).toISOString(),
      end_time: new Date(session.endTime!).toISOString(),
      duration_ms: session.totalDuration,
      iterations: session.iterations,
      search_count: session.searches.length,
      total_results: session.searches.reduce((sum, s) => sum + s.resultCount, 0),
      searches: session.searches,
      // Token tracking
      input_tokens: session.tokenUsage?.input,
      output_tokens: session.tokenUsage?.output,
      // total_tokens is a generated column, don't insert
      cost_usd: session.tokenUsage?.costUSD,
      tokens_used: session.tokenUsage?.total, // Deprecated field for compatibility
      // Model configuration
      model_config: session.modelConfig,
      // Status
      success: !session.error,
      error: session.error,
      logs: logBuffer,
      // Domain tracking
      domain: session.domain
    });

  if (error) {
    console.error('Failed to persist telemetry:', error);
  } else {
    logMessage(
      session,
      logBuffer,
      'info',
      'performance',
      'Telemetry persisted to database',
      {
        sessionId: session.sessionId,
        tokenUsage: session.tokenUsage,
        cost: session.tokenUsage?.costUSD.toFixed(6)
      },
      detailedLogging
    );
  }
}

/**
 * Export logs for debugging
 */
export function exportLogs(session: ChatSession, logBuffer: LogEntry[]) {
  return {
    session: session,
    logs: logBuffer
  };
}
