/**
 * Sample utils - heavily depended upon utility module
 */

import { performance } from 'perf_hooks';
import crypto from 'crypto';

// High fan-in utility functions

export function processData(data: any[]): any[] {
  const start = performance.now();
  
  const processed = data
    .filter(item => item != null)
    .map(item => ({
      ...item,
      id: item.id || generateId(),
      timestamp: Date.now(),
      processed: true
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  console.log(`Data processing took ${performance.now() - start}ms`);
  return processed;
}

export function validateData(data: any): boolean {
  if (!data) return false;
  if (!Array.isArray(data)) return false;
  if (data.length === 0) return false;

  return data.every(item => 
    typeof item === 'object' && 
    item !== null &&
    typeof item.id !== 'undefined'
  );
}

export function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Configuration object
export const UTILS_CONFIG = {
  version: '1.0.0',
  debug: process.env.NODE_ENV === 'development',
  maxRetries: 3,
  timeout: 5000
};

// Type definitions
export interface ProcessedItem {
  id: string;
  timestamp: number;
  processed: boolean;
  [key: string]: any;
}

export type DataValidator = (data: any) => boolean;
export type DataProcessor = (data: any[]) => ProcessedItem[];

// Default exports
export default {
  processData,
  validateData,
  generateId,
  formatSize,
  debounce,
  throttle,
  UTILS_CONFIG
};