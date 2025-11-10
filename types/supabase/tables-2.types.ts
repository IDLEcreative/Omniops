/**
 * Auto-generated types from Supabase
 * Database table definitions (Part 2/3)
 * Tables: conversations, customer_access_logs, customer_configs,
 *         customer_data_cache, customer_verifications, customers, domains
 */

import type { Json } from './json.types'

export interface Tables2 {
  conversations: {
    Row: {
      created_at: string | null
      customer_id: string | null
      domain_id: string | null
      ended_at: string | null
      id: string
      metadata: Json | null
      session_id: string | null
      started_at: string | null
    }
    Insert: {
      created_at?: string | null
      customer_id?: string | null
      domain_id?: string | null
      ended_at?: string | null
      id?: string
      metadata?: Json | null
      session_id?: string | null
      started_at?: string | null
    }
    Update: {
      created_at?: string | null
      customer_id?: string | null
      domain_id?: string | null
      ended_at?: string | null
      id?: string
      metadata?: Json | null
      session_id?: string | null
      started_at?: string | null
    }
    Relationships: [
      {
        foreignKeyName: "conversations_customer_id_fkey"
        columns: ["customer_id"]
        isOneToOne: false
        referencedRelation: "customers"
        referencedColumns: ["id"]
      },
      {
        foreignKeyName: "conversations_domain_id_fkey"
        columns: ["domain_id"]
        isOneToOne: false
        referencedRelation: "domains"
        referencedColumns: ["id"]
      },
    ]
  }
  customer_access_logs: {
    Row: {
      access_method: string | null
      access_reason: string | null
      accessed_at: string | null
      accessed_by: string | null
      business_id: string
      conversation_id: string
      customer_email: string
      customer_id_in_store: string | null
      data_accessed: string[] | null
      id: string
      metadata: Json | null
    }
    Insert: {
      access_method?: string | null
      access_reason?: string | null
      accessed_at?: string | null
      accessed_by?: string | null
      business_id: string
      conversation_id: string
      customer_email: string
      customer_id_in_store?: string | null
      data_accessed?: string[] | null
      id?: string
      metadata?: Json | null
    }
    Update: {
      access_method?: string | null
      access_reason?: string | null
      accessed_at?: string | null
      accessed_by?: string | null
      business_id?: string
      conversation_id?: string
      customer_email?: string
      customer_id_in_store?: string | null
      data_accessed?: string[] | null
      id?: string
      metadata?: Json | null
    }
    Relationships: [
      {
        foreignKeyName: "customer_access_logs_business_id_fkey"
        columns: ["business_id"]
        isOneToOne: false
        referencedRelation: "businesses"
        referencedColumns: ["id"]
      },
    ]
  }
  customer_configs: {
    Row: {
      active: boolean | null
      allowed_origins: string[] | null
      business_description: string | null
      business_name: string | null
      created_at: string | null
      customer_id: string | null
      domain: string
      encrypted_credentials: Json | null
      id: string
      primary_color: string | null
      rate_limit: number | null
      shopify_access_token: string | null
      shopify_shop: string | null
      suggested_questions: Json | null
      updated_at: string | null
      welcome_message: string | null
      woocommerce_consumer_key: string | null
      woocommerce_consumer_secret: string | null
      woocommerce_url: string | null
    }
    Insert: {
      active?: boolean | null
      allowed_origins?: string[] | null
      business_description?: string | null
      business_name?: string | null
      created_at?: string | null
      customer_id?: string | null
      domain: string
      encrypted_credentials?: Json | null
      id?: string
      primary_color?: string | null
      rate_limit?: number | null
      shopify_access_token?: string | null
      shopify_shop?: string | null
      suggested_questions?: Json | null
      updated_at?: string | null
      welcome_message?: string | null
      woocommerce_consumer_key?: string | null
      woocommerce_consumer_secret?: string | null
      woocommerce_url?: string | null
    }
    Update: {
      active?: boolean | null
      allowed_origins?: string[] | null
      business_description?: string | null
      business_name?: string | null
      created_at?: string | null
      customer_id?: string | null
      domain?: string
      encrypted_credentials?: Json | null
      id?: string
      primary_color?: string | null
      rate_limit?: number | null
      shopify_access_token?: string | null
      shopify_shop?: string | null
      suggested_questions?: Json | null
      updated_at?: string | null
      welcome_message?: string | null
      woocommerce_consumer_key?: string | null
      woocommerce_consumer_secret?: string | null
      woocommerce_url?: string | null
    }
    Relationships: [
      {
        foreignKeyName: "customer_configs_customer_id_fkey"
        columns: ["customer_id"]
        isOneToOne: false
        referencedRelation: "customers"
        referencedColumns: ["id"]
      },
    ]
  }
  customer_data_cache: {
    Row: {
      business_id: string
      cache_key: string
      cached_data: Json
      conversation_id: string
      created_at: string | null
      data_type: string
      expires_at: string
      id: string
    }
    Insert: {
      business_id: string
      cache_key: string
      cached_data: Json
      conversation_id: string
      created_at?: string | null
      data_type: string
      expires_at?: string
      id?: string
    }
    Update: {
      business_id?: string
      cache_key?: string
      cached_data?: Json
      conversation_id?: string
      created_at?: string | null
      data_type?: string
      expires_at?: string
      id?: string
    }
    Relationships: [
      {
        foreignKeyName: "customer_data_cache_business_id_fkey"
        columns: ["business_id"]
        isOneToOne: false
        referencedRelation: "businesses"
        referencedColumns: ["id"]
      },
    ]
  }
  customer_verifications: {
    Row: {
      attempts: number | null
      business_id: string
      conversation_id: string
      created_at: string | null
      customer_email: string
      customer_name: string | null
      expires_at: string
      id: string
      max_attempts: number | null
      metadata: Json | null
      order_number: string | null
      postal_code: string | null
      verification_code: string | null
      verification_method: string | null
      verified_at: string | null
    }
    Insert: {
      attempts?: number | null
      business_id: string
      conversation_id: string
      created_at?: string | null
      customer_email: string
      customer_name?: string | null
      expires_at?: string
      id?: string
      max_attempts?: number | null
      metadata?: Json | null
      order_number?: string | null
      postal_code?: string | null
      verification_code?: string | null
      verification_method?: string | null
      verified_at?: string | null
    }
    Update: {
      attempts?: number | null
      business_id?: string
      conversation_id?: string
      created_at?: string | null
      customer_email?: string
      customer_name?: string | null
      expires_at?: string
      id?: string
      max_attempts?: number | null
      metadata?: Json | null
      order_number?: string | null
      postal_code?: string | null
      verification_code?: string | null
      verification_method?: string | null
      verified_at?: string | null
    }
    Relationships: [
      {
        foreignKeyName: "customer_verifications_business_id_fkey"
        columns: ["business_id"]
        isOneToOne: false
        referencedRelation: "businesses"
        referencedColumns: ["id"]
      },
    ]
  }
  customers: {
    Row: {
      auth_user_id: string | null
      company_name: string | null
      created_at: string | null
      email: string
      id: string
      name: string | null
      updated_at: string | null
    }
    Insert: {
      auth_user_id?: string | null
      company_name?: string | null
      created_at?: string | null
      email: string
      id?: string
      name?: string | null
      updated_at?: string | null
    }
    Update: {
      auth_user_id?: string | null
      company_name?: string | null
      created_at?: string | null
      email?: string
      id?: string
      name?: string | null
      updated_at?: string | null
    }
    Relationships: []
  }
  domains: {
    Row: {
      active: boolean | null
      created_at: string | null
      description: string | null
      domain: string
      id: string
      last_content_refresh: string | null
      last_scraped_at: string | null
      name: string | null
      scrape_frequency: string | null
      updated_at: string | null
      user_id: string | null
    }
    Insert: {
      active?: boolean | null
      created_at?: string | null
      description?: string | null
      domain: string
      id?: string
      last_content_refresh?: string | null
      last_scraped_at?: string | null
      name?: string | null
      scrape_frequency?: string | null
      updated_at?: string | null
      user_id?: string | null
    }
    Update: {
      active?: boolean | null
      created_at?: string | null
      description?: string | null
      domain?: string
      id?: string
      last_content_refresh?: string | null
      last_scraped_at?: string | null
      name?: string | null
      scrape_frequency?: string | null
      updated_at?: string | null
      user_id?: string | null
    }
    Relationships: []
  }
}