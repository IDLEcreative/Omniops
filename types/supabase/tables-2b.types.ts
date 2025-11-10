/**
 * Auto-generated types from Supabase
 * Database table definitions (Part 2b)
 * Tables: customer_verifications, customers, domains
 */

import type { Json } from './json.types'

export interface Tables2b {
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