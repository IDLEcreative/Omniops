import {
  ErrorSeverity,
  ErrorCategory,
  ErrorContext,
  ErrorLog
} from './error-logger-types';
import {
  determineErrorSeverity,
  determineErrorCategory,
  formatErrorForConsole,
  formatLogsForFile,
  formatLogForDatabase
} from './error-logger-formatters';

// Re-export types for backward compatibility
export type { ErrorContext, ErrorLog } from './error-logger-types';
export { ErrorSeverity, ErrorCategory } from './error-logger-types';

class ErrorLogger {
  private static instance: ErrorLogger;
  private isDevelopment = process.env.NODE_ENV === 'development';
  private errorBuffer: ErrorLog[] = [];
  private lastFlushTimestamp: Date | null = null;
  private maxBufferSize = 10;
  private readonly FLUSH_INTERVAL_MS = 30000; // Flush every 30 seconds (used for lazy evaluation)

  private constructor() {
    // No automatic flushing - using lazy evaluation for serverless compatibility
  }

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  public async logError(
    error: Error | unknown,
    context?: ErrorContext,
    customSeverity?: ErrorSeverity,
    customCategory?: ErrorCategory
  ): Promise<void> {
    try {
      const err = error instanceof Error ? error : new Error(String(error));

      const errorLog: ErrorLog = {
        timestamp: new Date(),
        severity: customSeverity || determineErrorSeverity(err),
        category: customCategory || determineErrorCategory(err),
        message: err.message,
        stack: err.stack,
        errorCode: (err as any).code,
        errorName: err.name,
        context: {
          ...context,
          nodeEnv: process.env.NODE_ENV,
          timestamp: new Date().toISOString()
        }
      };

      if (this.isDevelopment) {
        formatErrorForConsole(errorLog);
      }

      this.errorBuffer.push(errorLog);

      // Eager flushing: Flush when buffer is full or error is CRITICAL
      if (this.errorBuffer.length >= this.maxBufferSize ||
          errorLog.severity === ErrorSeverity.CRITICAL) {
        await this.flushBuffer();
        this.lastFlushTimestamp = new Date();
      }
      // Lazy flushing: Flush if enough time has passed since last flush
      else {
        const now = new Date();
        const shouldFlush = !this.lastFlushTimestamp ||
          now.getTime() - this.lastFlushTimestamp.getTime() >= this.FLUSH_INTERVAL_MS;

        if (shouldFlush && this.errorBuffer.length > 0) {
          await this.flushBuffer();
          this.lastFlushTimestamp = now;
        }
      }

      if (errorLog.severity === ErrorSeverity.CRITICAL) {
        await this.saveToDatabase([errorLog]);
      }
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  }

  private async flushBuffer(): Promise<void> {
    if (this.errorBuffer.length === 0) return;

    const logsToFlush = [...this.errorBuffer];
    this.errorBuffer = [];

    try {
      await this.saveToDatabase(logsToFlush);
    } catch (error) {
      console.error('Failed to flush error buffer to database:', error);

      const criticalErrors = logsToFlush.filter(
        log => log.severity === ErrorSeverity.CRITICAL
      );
      this.errorBuffer.unshift(...criticalErrors);
    }
  }

  private async saveToDatabase(logs: ErrorLog[]): Promise<void> {
    try {
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');

      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log('Supabase credentials not available for error logging');
        await this.logToFile(logs);
        return;
      }

      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          }
        }
      );

      const { error: tableError } = await supabase
        .from('error_logs')
        .select('id')
        .limit(1);

      if (tableError?.code === 'PGRST116') {
        console.log('Creating error_logs table...');
        await this.createErrorLogsTable();
      }

      const { error } = await supabase
        .from('error_logs')
        .insert(logs.map(formatLogForDatabase));

      if (error) {
        throw error;
      }
    } catch (error) {
      await this.logToFile(logs);
    }
  }

  private async createErrorLogsTable(): Promise<void> {
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return;
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    );

    const { error } = await supabase.rpc('create_error_logs_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS error_logs (
          id BIGSERIAL PRIMARY KEY,
          severity TEXT NOT NULL,
          category TEXT NOT NULL,
          message TEXT NOT NULL,
          stack TEXT,
          error_code TEXT,
          error_name TEXT,
          context JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          resolved BOOLEAN DEFAULT FALSE,
          resolved_at TIMESTAMPTZ,
          resolved_by TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
        CREATE INDEX IF NOT EXISTS idx_error_logs_category ON error_logs(category);
        CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
      `
    });

    if (error) {
      console.error('Failed to create error_logs table:', error);
    }
  }

  private async logToFile(logs: ErrorLog[]): Promise<void> {
    if (typeof window !== 'undefined') {
      console.log('File logging not available in browser environment');
      return;
    }

    try {
      const fs = await import('fs').then(m => m.promises);
      const path = await import('path');

      const logDir = path.join(process.cwd(), 'logs');
      const logFile = path.join(logDir, `errors-${new Date().toISOString().split('T')[0]}.log`);

      await fs.mkdir(logDir, { recursive: true });
      await fs.appendFile(logFile, formatLogsForFile(logs));
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  public async getRecentErrors(
    limit = 100,
    severity?: ErrorSeverity,
    category?: ErrorCategory
  ): Promise<any[]> {
    try {
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');

      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return [];
      }

      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          }
        }
      );

      let query = supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (severity) {
        query = query.eq('severity', severity);
      }

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch recent errors:', error);
      return [];
    }
  }

  public destroy(): void {
    // Flush any remaining errors before destroying
    this.flushBuffer();
  }
}

export const errorLogger = ErrorLogger.getInstance();

export async function logError(
  error: Error | unknown,
  context?: ErrorContext,
  severity?: ErrorSeverity,
  category?: ErrorCategory
): Promise<void> {
  return errorLogger.logError(error, context, severity, category);
}

if (typeof process !== 'undefined') {
  process.on('exit', () => {
    errorLogger.destroy();
  });
}
