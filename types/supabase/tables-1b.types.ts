/**
 * Auto-generated types from Supabase
 * Database table definitions (Part 1b)
 * Tables: businesses, content_hashes, content_refresh_jobs
 */

import type { Json } from './json.types'

export interface Tables1b {
  businesses: {
    Row: {
      api_calls_limit: number | null
      api_calls_this_month: number | null
      company_name: string
      created_at: string | null
      email: string
      id: string
      password_hash: string
      settings: Json | null
      subscription_plan: string | null
      subscription_status: string | null
      updated_at: string | null
    }
    Insert: {
      api_calls_limit?: number | null
      api_calls_this_month?: number | null
      company_name: string
      created_at?: string | null
      email: string
      id?: string
      password_hash: string
      settings?: Json | null
      subscription_plan?: string | null
      subscription_status?: string | null
      updated_at?: string | null
    }
    Update: {
      api_calls_limit?: number | null
      api_calls_this_month?: number | null
      company_name?: string
      created_at?: string | null
      email?: string
      id?: string
      password_hash?: string
      settings?: Json | null
      subscription_plan?: string | null
      subscription_status?: string | null
      updated_at?: string | null
    }
    Relationships: []
  }
  content_hashes: {
    Row: {
      content_hash: string
      content_length: number | null
      content_preview: string | null
      content_type: string
      domain_id: string | null
      first_seen_at: string | null
      id: string
      last_seen_at: string | null
      occurrence_count: number | null
      url: string
    }
    Insert: {
      content_hash: string
      content_length?: number | null
      content_preview?: string | null
      content_type: string
      domain_id?: string | null
      first_seen_at?: string | null
      id?: string
      last_seen_at?: string | null
      occurrence_count?: number | null
      url: string
    }
    Update: {
      content_hash?: string
      content_length?: number | null
      content_preview?: string | null
      content_type?: string
      domain_id?: string | null
      first_seen_at?: string | null
      id?: string
      last_seen_at?: string | null
      occurrence_count?: number | null
      url?: string
    }
    Relationships: [
      {
        foreignKeyName: "content_hashes_domain_id_fkey"
        columns: ["domain_id"]
        isOneToOne: false
        referencedRelation: "domains"
        referencedColumns: ["id"]
      },
    ]
  }
  content_refresh_jobs: {
    Row: {
      completed_at: string | null
      config: Json | null
      created_at: string | null
      domain_id: string | null
      error: string | null
      id: string
      job_type: string
      started_at: string | null
      stats: Json | null
      status: string
    }
    Insert: {
      completed_at?: string | null
      config?: Json | null
      created_at?: string | null
      domain_id?: string | null
      error?: string | null
      id?: string
      job_type: string
      started_at?: string | null
      stats?: Json | null
      status?: string
    }
    Update: {
      completed_at?: string | null
      config?: Json | null
      created_at?: string | null
      domain_id?: string | null
      error?: string | null
      id?: string
      job_type?: string
      started_at?: string | null
      stats?: Json | null
      status?: string
    }
    Relationships: [
      {
        foreignKeyName: "content_refresh_jobs_domain_id_fkey"
        columns: ["domain_id"]
        isOneToOne: false
        referencedRelation: "domains"
        referencedColumns: ["id"]
      },
    ]
  }
}