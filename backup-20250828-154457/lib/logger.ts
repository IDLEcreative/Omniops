type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private addToHistory(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  debug(message: string, context?: Record<string, any>) {
    if (this.isDevelopment) {
      const entry: LogEntry = { level: 'debug', message, timestamp: new Date().toISOString(), context };
      this.addToHistory(entry);
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: Record<string, any>) {
    const entry: LogEntry = { level: 'info', message, timestamp: new Date().toISOString(), context };
    this.addToHistory(entry);
    console.info(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: Record<string, any>) {
    const entry: LogEntry = { level: 'warn', message, timestamp: new Date().toISOString(), context };
    this.addToHistory(entry);
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error | unknown, context?: Record<string, any>) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const entry: LogEntry = { 
      level: 'error', 
      message, 
      timestamp: new Date().toISOString(), 
      context, 
      error: errorObj 
    };
    this.addToHistory(entry);
    
    console.error(this.formatMessage('error', message, context));
    if (error) {
      console.error(error);
    }

    // In production, you could send this to an error tracking service
    if (!this.isDevelopment && typeof window !== 'undefined') {
      // Example: Send to error tracking service
      // sendToErrorTracker({ message, error: errorObj, context });
    }
  }

  // Get recent logs for debugging
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Clear log history
  clearLogs() {
    this.logs = [];
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Create singleton instance
export const logger = new Logger();

// Utility function for async error handling
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage: string,
  context?: Record<string, any>
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    logger.error(errorMessage, error, context);
    return null;
  }
}

// React hook for error logging
export function useLogger() {
  return logger;
}