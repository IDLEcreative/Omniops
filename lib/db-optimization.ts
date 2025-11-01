/**
 * Database Query Optimization Utilities
 * Provides batching, caching, and connection pooling for Supabase queries
 *
 * NOTE: This file has been refactored into modular structure.
 * See lib/db-optimization/ directory for implementation details.
 *
 * Original file backed up as: lib/db-optimization.ts.old
 */

// Re-export all functionality from modular structure for backward compatibility
export {
  // Query Cache
  DatabaseOptimizer,
  dbOptimizer,

  // Connection Pool
  SupabasePool,
  supabasePool,

  // Query Builder
  QueryBuilder,
  queryBuilder,
} from './db-optimization/';
