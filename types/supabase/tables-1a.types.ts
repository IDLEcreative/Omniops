/**
 * Auto-generated types from Supabase
 * Database table definitions (Part 1a)
 * Tables: ai_optimized_content, business_configs, business_usage
 */

import type { Json } from './json.types'

export interface Tables1a {
  ai_optimized_content: {
    Row: {
      ai_model_used: string | null
      content_quality_score: number | null
      content_type: string
      created_at: string | null
      domain_id: string | null
      id: string
      key_points: Json | null
      keywords: string[] | null
      meta_description: string | null
      meta_title: string | null
      optimized_content: string | null
      optimized_summary: string | null
      optimized_title: string | null
      processed_at: string | null
      processing_cost: number | null
      processing_tokens: number | null
      processing_version: string | null
      raw_content: string | null
      raw_html: string | null
      readability_score: number | null
      seo_score: number | null
      source_content_id: string | null
      structured_data: Json | null
      topics: Json | null
      updated_at: string | null
      url: string
    }
    Insert: {
      ai_model_used?: string | null
      content_quality_score?: number | null
      content_type: string
      created_at?: string | null
      domain_id?: string | null
      id?: string
      key_points?: Json | null
      keywords?: string[] | null
      meta_description?: string | null
      meta_title?: string | null
      optimized_content?: string | null
      optimized_summary?: string | null
      optimized_title?: string | null
      processed_at?: string | null
      processing_cost?: number | null
      processing_tokens?: number | null
      processing_version?: string | null
      raw_content?: string | null
      raw_html?: string | null
      readability_score?: number | null
      seo_score?: number | null
      source_content_id?: string | null
      structured_data?: Json | null
      topics?: Json | null
      updated_at?: string | null
      url: string
    }
    Update: {
      ai_model_used?: string | null
      content_quality_score?: number | null
      content_type?: string
      created_at?: string | null
      domain_id?: string | null
      id?: string
      key_points?: Json | null
      keywords?: string[] | null
      meta_description?: string | null
      meta_title?: string | null
      optimized_content?: string | null
      optimized_summary?: string | null
      optimized_title?: string | null
      processed_at?: string | null
      processing_cost?: number | null
      processing_tokens?: number | null
      processing_version?: string | null
      raw_content?: string | null
      raw_html?: string | null
      readability_score?: number | null
      seo_score?: number | null
      source_content_id?: string | null
      structured_data?: Json | null
      topics?: Json | null
      updated_at?: string | null
      url?: string
    }
    Relationships: [
      {
        foreignKeyName: "ai_optimized_content_domain_id_fkey"
        columns: ["domain_id"]
        isOneToOne: false
        referencedRelation: "domains"
        referencedColumns: ["id"]
      },
      {
        foreignKeyName: "ai_optimized_content_source_content_id_fkey"
        columns: ["source_content_id"]
        isOneToOne: false
        referencedRelation: "website_content"
        referencedColumns: ["id"]
      },
    ]
  }
  business_configs: {
    Row: {
      ai_model: string | null
      ai_temperature: number | null
      business_id: string
      created_at: string | null
      custom_prompt: string | null
      domain: string
      id: string
      openai_api_key_encrypted: string | null
      shopify_access_token_encrypted: string | null
      shopify_enabled: boolean | null
      shopify_store_url: string | null
      updated_at: string | null
      widget_settings: Json | null
      woocommerce_consumer_key_encrypted: string | null
      woocommerce_consumer_secret_encrypted: string | null
      woocommerce_enabled: boolean | null
      woocommerce_url: string | null
    }
    Insert: {
      ai_model?: string | null
      ai_temperature?: number | null
      business_id: string
      created_at?: string | null
      custom_prompt?: string | null
      domain: string
      id?: string
      openai_api_key_encrypted?: string | null
      shopify_access_token_encrypted?: string | null
      shopify_enabled?: boolean | null
      shopify_store_url?: string | null
      updated_at?: string | null
      widget_settings?: Json | null
      woocommerce_consumer_key_encrypted?: string | null
      woocommerce_consumer_secret_encrypted?: string | null
      woocommerce_enabled?: boolean | null
      woocommerce_url?: string | null
    }
    Update: {
      ai_model?: string | null
      ai_temperature?: number | null
      business_id?: string
      created_at?: string | null
      custom_prompt?: string | null
      domain?: string
      id?: string
      openai_api_key_encrypted?: string | null
      shopify_access_token_encrypted?: string | null
      shopify_enabled?: boolean | null
      shopify_store_url?: string | null
      updated_at?: string | null
      widget_settings?: Json | null
      woocommerce_consumer_key_encrypted?: string | null
      woocommerce_consumer_secret_encrypted?: string | null
      woocommerce_enabled?: boolean | null
      woocommerce_url?: string | null
    }
    Relationships: [
      {
        foreignKeyName: "business_configs_business_id_fkey"
        columns: ["business_id"]
        isOneToOne: false
        referencedRelation: "businesses"
        referencedColumns: ["id"]
      },
    ]
  }
  business_usage: {
    Row: {
      api_calls: number | null
      business_id: string
      cache_hits: number | null
      conversations_count: number | null
      created_at: string | null
      date: string
      id: string
      messages_count: number | null
      verifications_count: number | null
    }
    Insert: {
      api_calls?: number | null
      business_id: string
      cache_hits?: number | null
      conversations_count?: number | null
      created_at?: string | null
      date: string
      id?: string
      messages_count?: number | null
      verifications_count?: number | null
    }
    Update: {
      api_calls?: number | null
      business_id?: string
      cache_hits?: number | null
      conversations_count?: number | null
      created_at?: string | null
      date?: string
      id?: string
      messages_count?: number | null
      verifications_count?: number | null
    }
    Relationships: [
      {
        foreignKeyName: "business_usage_business_id_fkey"
        columns: ["business_id"]
        isOneToOne: false
        referencedRelation: "businesses"
        referencedColumns: ["id"]
      },
    ]
  }
}