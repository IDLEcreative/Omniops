/**
 * Autonomous Operations Queue Types
 *
 * Defines job types, data structures, and configurations for queuing
 * autonomous agent operations.
 *
 * @module lib/autonomous/queue/types
 */

/**
 * Job priority levels for autonomous operations
 */
export enum OperationPriority {
  CRITICAL = 10,  // System health, credential rotation
  HIGH = 5,       // User-initiated setup operations
  NORMAL = 0,     // Scheduled operations
  LOW = -5,       // Background health checks
  DEFERRED = -10, // Analytics, cleanup
}

/**
 * Types of autonomous operations that can be queued
 */
export type OperationJobType =
  | 'woocommerce_setup'
  | 'shopify_setup'
  | 'bigcommerce_setup'
  | 'credential_generation'
  | 'credential_rotation'
  | 'integration_test'
  | 'health_check';

/**
 * Job status in the queue lifecycle
 */
export type OperationJobStatus =
  | 'waiting'      // In queue, not started
  | 'active'       // Currently processing
  | 'completed'    // Successfully completed
  | 'failed'       // Failed after all retries
  | 'delayed'      // Delayed for retry
  | 'paused'       // Manually paused
  | 'cancelled';   // Manually cancelled

/**
 * Base job data structure for all autonomous operations
 */
export interface BaseOperationJobData {
  /**
   * Unique operation ID (matches autonomous_operations.id)
   */
  operationId: string;

  /**
   * Organization this operation belongs to
   */
  organizationId: string;

  /**
   * User who initiated the operation
   */
  userId: string;

  /**
   * Service being configured (woocommerce, shopify, etc)
   */
  service: string;

  /**
   * Type of operation (api_key_generation, etc)
   */
  operation: string;

  /**
   * Job priority
   */
  priority?: OperationPriority;

  /**
   * Job type for routing to correct agent
   */
  jobType: OperationJobType;

  /**
   * Timestamp when job was created
   */
  createdAt?: string;

  /**
   * Optional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Configuration for agent execution
 */
export interface AgentExecutionConfig {
  /**
   * Store URL (for e-commerce integrations)
   */
  storeUrl?: string;

  /**
   * Run browser in headless mode
   */
  headless?: boolean;

  /**
   * Slow down operations for debugging (ms)
   */
  slowMo?: number;

  /**
   * Operation timeout (ms)
   */
  timeout?: number;

  /**
   * Maximum retries for agent execution
   */
  maxRetries?: number;

  /**
   * Additional config specific to the agent
   */
  agentConfig?: Record<string, any>;
}

/**
 * WooCommerce setup job data
 */
export interface WooCommerceSetupJobData extends BaseOperationJobData {
  jobType: 'woocommerce_setup';
  config: AgentExecutionConfig & {
    storeUrl: string;
  };
}

/**
 * Shopify setup job data
 */
export interface ShopifySetupJobData extends BaseOperationJobData {
  jobType: 'shopify_setup';
  config: AgentExecutionConfig & {
    storeUrl: string;
  };
}

/**
 * Credential rotation job data
 */
export interface CredentialRotationJobData extends BaseOperationJobData {
  jobType: 'credential_rotation';
  config: AgentExecutionConfig & {
    credentialIds: string[];
    forceRotation?: boolean;
  };
}

/**
 * Health check job data
 */
export interface HealthCheckJobData extends BaseOperationJobData {
  jobType: 'health_check';
  config: {
    checkType: 'credential_expiry' | 'consent_validity' | 'service_health';
    notifyOnFailure?: boolean;
  };
}

/**
 * Union type for all operation job data types
 */
export type OperationJobData =
  | WooCommerceSetupJobData
  | ShopifySetupJobData
  | CredentialRotationJobData
  | HealthCheckJobData;

/**
 * Job result after processing
 */
export interface OperationJobResult {
  success: boolean;
  operationId: string;
  completedAt: string;
  duration: number; // ms
  result?: any; // Agent-specific result (API keys, tokens, etc)
  error?: string;
  retryCount?: number;
  auditSummary?: {
    totalSteps: number;
    successfulSteps: number;
    failedSteps: number;
    screenshots: string[];
  };
}

/**
 * Progress update during job processing
 */
export interface OperationProgressUpdate {
  operationId: string;
  status: OperationJobStatus;
  progress: number; // 0-100
  currentStep?: string;
  message?: string;
  timestamp: string;
}

/**
 * Queue configuration
 */
export interface OperationQueueConfig {
  /**
   * Queue name (defaults to 'autonomous-operations')
   */
  queueName?: string;

  /**
   * Redis connection URL
   */
  redisUrl?: string;

  /**
   * Maximum concurrent operations
   */
  maxConcurrency?: number;

  /**
   * Default job options
   */
  defaultJobOptions?: {
    attempts?: number;
    backoffDelay?: number;
    timeout?: number;
  };

  /**
   * Enable metrics collection
   */
  enableMetrics?: boolean;

  /**
   * Rate limiting per organization (operations per hour)
   */
  rateLimitPerOrg?: number;
}

/**
 * Queue statistics
 */
export interface OperationQueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

/**
 * Queue health status
 */
export interface OperationQueueHealth {
  healthy: boolean;
  queueName: string;
  redisConnected: boolean;
  activeWorkers: number;
  stats: OperationQueueStats;
  lastJobProcessedAt?: string;
  errors?: string[];
}
