/**
 * Database Optimization - Main Export
 * Provides backward-compatible exports from modular structure
 *
 * Original file: lib/db-optimization.ts (427 LOC)
 * Refactored into 3 focused modules:
 * - query-cache.ts (DatabaseOptimizer) - Query caching & batching
 * - connection-pool.ts (SupabasePool) - Connection pooling with LRU eviction
 * - query-builder.ts (QueryBuilder) - Auto-batching query builder
 */

// Query Cache - DatabaseOptimizer class and singleton
export { DatabaseOptimizer, dbOptimizer } from './query-cache';

// Connection Pool - SupabasePool class and singleton
export { SupabasePool, supabasePool } from './connection-pool';

// Query Builder - QueryBuilder class and singleton
export { QueryBuilder, queryBuilder } from './query-builder';
