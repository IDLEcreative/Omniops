/**
 * Intelligent Category Mapping System
 * Maps products to categories based on URL patterns and product names
 * No hardcoding - uses dynamic pattern detection
 */

import type { CategoryMapping } from './types';
import { buildCategoryMappings } from './builder';
import { findCategoryForQuery } from './finder';
import { persistMappings } from './persistence';

export class CategoryMapper {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  /**
   * Analyze all products and build category mappings
   * Uses pagination to prevent OOM on large datasets
   */
  async buildCategoryMappings(): Promise<Map<string, CategoryMapping>> {
    return buildCategoryMappings(this.supabase);
  }

  /**
   * Find best category for a search query
   */
  async findCategoryForQuery(query: string, searchResults: any[]): Promise<{
    category: string;
    url?: string;
    confidence: number;
  } | null> {
    // Build mappings if not cached
    const mappings = await this.buildCategoryMappings();
    return findCategoryForQuery(query, searchResults, mappings);
  }

  /**
   * Store mappings in database for persistence
   */
  async persistMappings(mappings: Map<string, CategoryMapping>): Promise<void> {
    return persistMappings(this.supabase, mappings);
  }
}

// Re-export types
export type { CategoryMapping, ProductCategory } from './types';
