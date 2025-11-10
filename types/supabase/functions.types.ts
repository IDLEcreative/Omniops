/**
 * Auto-generated types from Supabase
 * Database function type definitions
 */

import type { Json } from './json.types'

export type Functions = {
  binary_quantize: {
    Args: { "": string } | { "": unknown }
    Returns: unknown
  }
  clean_expired_data: {
    Args: Record<PropertyKey, never>
    Returns: undefined
  }
  create_manual_scrape_job: {
    Args: {
      p_config?: Json
      p_domain: string
      p_job_type?: string
      p_metadata?: Json
      p_priority?: number
    }
    Returns: string
  }
  get_business_id_from_domain: {
    Args: { p_domain: string }
    Returns: string
  }
  get_stale_content: {
    Args: { p_domain_id: string; p_hours_threshold?: number }
    Returns: {
      id: string
      scraped_at: string
      url: string
    }[]
  }
  gtrgm_compress: {
    Args: { "": unknown }
    Returns: unknown
  }
  gtrgm_decompress: {
    Args: { "": unknown }
    Returns: unknown
  }
  gtrgm_in: {
    Args: { "": unknown }
    Returns: unknown
  }
  gtrgm_options: {
    Args: { "": unknown }
    Returns: undefined
  }
  gtrgm_out: {
    Args: { "": unknown }
    Returns: unknown
  }
  halfvec_avg: {
    Args: { "": number[] }
    Returns: unknown
  }
  halfvec_out: {
    Args: { "": unknown }
    Returns: unknown
  }
  halfvec_send: {
    Args: { "": unknown }
    Returns: string
  }
  halfvec_typmod_in: {
    Args: { "": unknown[] }
    Returns: number
  }
  hnsw_bit_support: {
    Args: { "": unknown }
    Returns: unknown
  }
  hnsw_halfvec_support: {
    Args: { "": unknown }
    Returns: unknown
  }
  hnsw_sparsevec_support: {
    Args: { "": unknown }
    Returns: unknown
  }
  hnswhandler: {
    Args: { "": unknown }
    Returns: unknown
  }
  ivfflat_bit_support: {
    Args: { "": unknown }
    Returns: unknown
  }
  ivfflat_halfvec_support: {
    Args: { "": unknown }
    Returns: unknown
  }
  ivfflathandler: {
    Args: { "": unknown }
    Returns: unknown
  }
  l2_norm: {
    Args: { "": unknown } | { "": unknown }
    Returns: number
  }
  l2_normalize: {
    Args: { "": string } | { "": unknown } | { "": unknown }
    Returns: string
  }
  manually_trigger_scraping: {
    Args: { p_domain: string; p_max_pages?: number; p_priority?: number }
    Returns: string
  }
  search_embeddings: {
    Args: {
      match_count?: number
      match_threshold?: number
      p_domain_id: string
      query_embedding: string
    }
    Returns: {
      content: string
      similarity: number
      title: string
      url: string
    }[]
  }
  set_limit: {
    Args: { "": number }
    Returns: number
  }
  show_limit: {
    Args: Record<PropertyKey, never>
    Returns: number
  }
  show_trgm: {
    Args: { "": string }
    Returns: string[]
  }
  sparsevec_out: {
    Args: { "": unknown }
    Returns: unknown
  }
  sparsevec_send: {
    Args: { "": unknown }
    Returns: string
  }
  sparsevec_typmod_in: {
    Args: { "": unknown[] }
    Returns: number
  }
  track_api_usage: {
    Args: { p_business_id: string; p_usage_type?: string }
    Returns: undefined
  }
  vector_avg: {
    Args: { "": number[] }
    Returns: string
  }
  vector_dims: {
    Args: { "": string } | { "": unknown }
    Returns: number
  }
  vector_norm: {
    Args: { "": string }
    Returns: number
  }
  vector_out: {
    Args: { "": string }
    Returns: unknown
  }
  vector_send: {
    Args: { "": string }
    Returns: string
  }
  vector_typmod_in: {
    Args: { "": unknown[] }
    Returns: number
  }
}