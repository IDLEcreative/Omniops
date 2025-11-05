/**
 * Logging utilities for MCP tools
 *
 * Purpose: Centralized logging for tool execution tracking
 * Category: shared
 * Version: 1.0.0
 * Last Updated: 2025-11-05
 */

import { createClient } from '@/lib/supabase/server';
import { ToolExecutionLog } from '../types';

/**
 * Log tool execution to console and database
 */
export async function logToolExecution(log: ToolExecutionLog): Promise<void> {
  // Console logging for development
  const status = log.status === 'success' ? '✅' : '❌';
  const duration = log.executionTime;

  if (log.status === 'success') {
    console.log(
      `${status} [MCP Tool] ${log.tool} - Customer: ${log.customerId} - ` +
      `Results: ${log.resultCount || 0} - Time: ${duration}ms`
    );
  } else {
    console.error(
      `${status} [MCP Tool] ${log.tool} - Customer: ${log.customerId} - ` +
      `Error: ${log.error} - Time: ${duration}ms`
    );
  }

  // Optional: Write to database for analytics
  try {
    const supabase = await createClient();

    if (!supabase) {
      return; // Silently skip database logging if client unavailable
    }

    await supabase
      .from('mcp_tool_execution_logs')
      .insert({
        tool_name: log.tool,
        category: log.category,
        customer_id: log.customerId,
        status: log.status,
        execution_time_ms: log.executionTime,
        result_count: log.resultCount,
        error_message: log.error,
        created_at: log.timestamp
      });
  } catch (error) {
    // Silent fail - don't break tool execution if logging fails
    console.error('[MCP Logger] Failed to log to database:', error);
  }
}

/**
 * Create a performance timer for measuring execution time
 */
export class PerformanceTimer {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Get elapsed time in milliseconds
   */
  elapsed(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Reset the timer
   */
  reset(): void {
    this.startTime = Date.now();
  }
}
