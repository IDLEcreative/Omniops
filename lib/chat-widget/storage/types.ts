/**
 * Storage Types
 *
 * Type definitions and interfaces for enhanced parent storage system.
 */

export interface RetryConfig {
  maxAttempts?: number; // Max retry attempts (default: 3)
  initialDelay?: number; // Initial delay in ms (default: 100)
  maxDelay?: number; // Max delay in ms (default: 2000)
  backoffMultiplier?: number; // Multiplier for exponential backoff (default: 2)
}

export interface QueuedMessage {
  type: string;
  key: string;
  value?: string;
  requestId?: string;
  timestamp: number;
}

export interface PendingRequest {
  resolve: (value: string | null) => void;
  attempts: number;
  lastAttempt: number;
}

export interface CacheEntry {
  value: string | null;
  timestamp: number;
}

export interface StorageMessage {
  type: string;
  key: string;
  value?: string;
  requestId?: string;
}

export interface StorageResponse {
  type: 'storageResponse';
  requestId: string;
  key: string;
  value: string | null;
}
