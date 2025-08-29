// Supabase client will be created dynamically to avoid cookies context issues

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  DATABASE = 'database',
  API = 'api',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  EXTERNAL_SERVICE = 'external_service',
  SYSTEM = 'system',
  BUSINESS_LOGIC = 'business_logic'
}

interface ErrorContext {
  userId?: string;
  domain?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: any;
}

interface ErrorLog {
  timestamp: Date;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  stack?: string;
  context?: ErrorContext;
  errorCode?: string;
  errorName?: string;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private isDevelopment = process.env.NODE_ENV === 'development';
  private errorBuffer: ErrorLog[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private maxBufferSize = 10; // Reduced from 50 to prevent memory buildup

  private constructor() {
    // Flush buffer every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushBuffer();
    }, 30000);
  }

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  private determineErrorSeverity(error: Error): ErrorSeverity {
    // Critical errors that could crash the app
    if (error.message?.includes('clientReferenceManifest') ||
        error.message?.includes('Invariant') ||
        error.name === 'FatalError') {
      return ErrorSeverity.CRITICAL;
    }
    
    // High severity for database and auth errors
    if (error.message?.includes('PGRST') ||
        error.message?.includes('unauthorized') ||
        error.message?.includes('forbidden')) {
      return ErrorSeverity.HIGH;
    }
    
    // Medium for API and validation errors
    if (error.name === 'ValidationError' ||
        error.message?.includes('400') ||
        error.message?.includes('404')) {
      return ErrorSeverity.MEDIUM;
    }
    
    return ErrorSeverity.LOW;
  }

  private determineErrorCategory(error: Error): ErrorCategory {
    if (error.message?.includes('PGRST') || 
        error.message?.includes('supabase')) {
      return ErrorCategory.DATABASE;
    }
    
    if (error.message?.includes('fetch') ||
        error.message?.includes('API')) {
      return ErrorCategory.API;
    }
    
    if (error.name === 'ValidationError' ||
        error.message?.includes('validation')) {
      return ErrorCategory.VALIDATION;
    }
    
    if (error.message?.includes('auth') ||
        error.message?.includes('unauthorized')) {
      return ErrorCategory.AUTHENTICATION;
    }
    
    if (error.message?.includes('OpenAI') ||
        error.message?.includes('WooCommerce')) {
      return ErrorCategory.EXTERNAL_SERVICE;
    }
    
    return ErrorCategory.SYSTEM;
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
        severity: customSeverity || this.determineErrorSeverity(err),
        category: customCategory || this.determineErrorCategory(err),
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

      // Console log in development
      if (this.isDevelopment) {
        console.error('🚨 Error Logged:', {
          severity: errorLog.severity,
          category: errorLog.category,
          message: errorLog.message,
          context: errorLog.context
        });
        if (errorLog.stack) {
          console.error('Stack trace:', errorLog.stack);
        }
      }

      // Add to buffer
      this.errorBuffer.push(errorLog);

      // Flush if buffer is full or if it's a critical error
      if (this.errorBuffer.length >= this.maxBufferSize || 
          errorLog.severity === ErrorSeverity.CRITICAL) {
        await this.flushBuffer();
      }

      // For critical errors, also try to save immediately
      if (errorLog.severity === ErrorSeverity.CRITICAL) {
        await this.saveToDatabase([errorLog]);
      }
    } catch (loggingError) {
      // Fail silently but log to console
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
      // If database save fails, log to console and put critical errors back
      console.error('Failed to flush error buffer to database:', error);
      
      // Put critical errors back in buffer for retry
      const criticalErrors = logsToFlush.filter(
        log => log.severity === ErrorSeverity.CRITICAL
      );
      this.errorBuffer.unshift(...criticalErrors);
    }
  }

  private async saveToDatabase(logs: ErrorLog[]): Promise<void> {
    try {
      // Use service role key for background operations
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
      
      // Create error_logs table if it doesn't exist
      const { error: tableError } = await supabase
        .from('error_logs')
        .select('id')
        .limit(1);
      
      if (tableError?.code === 'PGRST116') {
        // Table doesn't exist, create it
        console.log('Creating error_logs table...');
        await this.createErrorLogsTable();
      }

      // Insert logs
      const { error } = await supabase
        .from('error_logs')
        .insert(logs.map(log => ({
          severity: log.severity,
          category: log.category,
          message: log.message,
          stack: log.stack,
          error_code: log.errorCode,
          error_name: log.errorName,
          context: log.context,
          created_at: log.timestamp
        })));

      if (error) {
        throw error;
      }
    } catch (error) {
      // Fallback to file logging if database fails
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
    // Only write to file in Node.js environment
    if (typeof window !== 'undefined') {
      console.log('File logging not available in browser environment');
      return;
    }
    
    try {
      // In production, you might want to write to a file or external service
      const fs = await import('fs').then(m => m.promises);
      const path = await import('path');
      
      const logDir = path.join(process.cwd(), 'logs');
      const logFile = path.join(logDir, `errors-${new Date().toISOString().split('T')[0]}.log`);
      
      await fs.mkdir(logDir, { recursive: true });
      
      const logContent = logs.map(log => 
        JSON.stringify({
          ...log,
          timestamp: log.timestamp.toISOString()
        })
      ).join('\n') + '\n';
      
      await fs.appendFile(logFile, logContent);
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
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flushBuffer();
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance();

// Helper function for easy error logging
export async function logError(
  error: Error | unknown,
  context?: ErrorContext,
  severity?: ErrorSeverity,
  category?: ErrorCategory
): Promise<void> {
  return errorLogger.logError(error, context, severity, category);
}

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    errorLogger.destroy();
  });
}