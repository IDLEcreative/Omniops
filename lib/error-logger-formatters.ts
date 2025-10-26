import { ErrorSeverity, ErrorCategory, ErrorLog } from './error-logger-types';

export function determineErrorSeverity(error: Error): ErrorSeverity {
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

export function determineErrorCategory(error: Error): ErrorCategory {
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

export function formatErrorForConsole(errorLog: ErrorLog): void {
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

export function formatLogsForFile(logs: ErrorLog[]): string {
  return logs.map(log =>
    JSON.stringify({
      ...log,
      timestamp: log.timestamp.toISOString()
    })
  ).join('\n') + '\n';
}

export function formatLogForDatabase(log: ErrorLog) {
  return {
    severity: log.severity,
    category: log.category,
    message: log.message,
    stack: log.stack,
    error_code: log.errorCode,
    error_name: log.errorName,
    context: log.context,
    created_at: log.timestamp
  };
}
