import { Job } from 'bullmq';

/**
 * Job processing result
 */
export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  pagesProcessed?: number;
  totalPages?: number;
  metadata?: Record<string, any>;
}

/**
 * Progress update structure
 */
export interface ProgressUpdate {
  percentage: number;
  message: string;
  pagesProcessed?: number;
  totalPages?: number;
  currentUrl?: string;
  errors?: number;
  metadata?: Record<string, any>;
}

/**
 * Job processor configuration
 */
export interface JobProcessorConfig {
  maxConcurrency: number;
  stalledInterval: number;
  maxStalledCount: number;
  retryProcessDelay: number;
  enableMetrics: boolean;
}

/**
 * Processing metrics
 */
export interface ProcessingMetrics {
  jobsProcessed: number;
  jobsFailed: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
  lastProcessedAt?: Date;
  errorsByType: Record<string, number>;
}

/**
 * Job processor internal state
 */
export interface JobProcessorState {
  metrics: ProcessingMetrics;
  isShuttingDown: boolean;
  config: JobProcessorConfig;
}
