/**
 * WooCommerce API Cache Types
 */

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  avgTimeSaved: number;
  totalTimeSaved: number;
}

export interface CacheResult<T> {
  data: T;
  fromCache: boolean;
  responseTime: number;
}

export interface CommonQuery {
  operation: string;
  params: any;
}
