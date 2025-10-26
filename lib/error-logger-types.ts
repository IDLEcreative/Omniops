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

export interface ErrorContext {
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

export interface ErrorLog {
  timestamp: Date;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  stack?: string;
  context?: ErrorContext;
  errorCode?: string;
  errorName?: string;
}
