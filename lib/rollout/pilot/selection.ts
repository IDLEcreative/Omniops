/**
 * Feature Selection Logic
 *
 * Purpose: Determines if a feature should be enabled for a customer
 * Uses deterministic hashing for consistent percentage-based rollout
 * Last Updated: 2025-11-03
 */

import { getRolloutConfig } from './config-loader';
import { RolloutStatus } from './types';

/**
 * Check if feature should be enabled for a customer
 *
 * Uses deterministic hashing to ensure consistent results
 */
export async function shouldEnableFeature(
  featureName: string,
  customerId: string
): Promise<boolean> {
  const config = await getRolloutConfig(featureName);
  if (!config) {
    return false; // Feature not configured for rollout
  }

  // Check status
  if (config.status !== RolloutStatus.IN_PROGRESS && config.status !== RolloutStatus.COMPLETED) {
    return false;
  }

  // Check blacklist first
  if (config.blacklistedCustomers.includes(customerId)) {
    return false;
  }

  // Check whitelist
  if (config.whitelistedCustomers.includes(customerId)) {
    return true;
  }

  // Check percentage-based rollout using deterministic hash
  const hash = hashCustomerId(customerId, featureName);
  const shouldEnable = hash < config.percentage;

  return shouldEnable;
}

/**
 * Deterministic hash function for customer ID
 *
 * Returns a number between 0-100 based on customer ID and feature name
 * Same inputs always produce same output (deterministic)
 */
export function hashCustomerId(customerId: string, featureName: string): number {
  const input = `${customerId}:${featureName}`;
  let hash = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to 0-100 range
  return Math.abs(hash % 100);
}
