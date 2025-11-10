/**
 * Auto-generated types from Supabase
 * Database table definitions (Part 3b)
 * Tables: scrape_jobs, scraped_pages
 */

import type { Json } from './json.types'

export interface Tables3b {
  scrape_jobs: {
    Row: {
      completed_at: string | null
      config: Json | null
      created_at: string | null
      created_by: string | null
      customer_config_id: string | null
      domain: string
      domain_id: string | null
      error_message: string | null
      id: string
      job_type: string
      max_pages: number | null
      max_retries: number
      metadata: Json | null
      pages_failed: number | null
      pages_scraped: number | null
      priority: number
      progress_message: string | null
      progress_percent: number | null
      queue_job_id: string | null
      retry_count: number
      started_at: string | null
      stats: Json | null
      status: string
      updated_at: string | null
      url: string | null
    }
    Insert: {
      completed_at?: string | null
      config?: Json | null
      created_at?: string | null
      created_by?: string | null
      customer_config_id?: string | null
      domain: string
      domain_id?: string | null
      error_message?: string | null
      id?: string
      job_type?: string
      max_pages?: number | null
      max_retries?: number
      metadata?: Json | null
      pages_failed?: number | null
      pages_scraped?: number | null
      priority?: number
      progress_message?: string | null
      progress_percent?: number | null
      queue_job_id?: string | null
      retry_count?: number
      started_at?: string | null
      stats?: Json | null
      status?: string
      updated_at?: string | null
      url?: string | null
    }
    Update: {
      completed_at?: string | null
      config?: Json | null
      created_at?: string | null
      created_by?: string | null
      customer_config_id?: string | null
      domain?: string
      domain_id?: string | null
      error_message?: string | null
      id?: string
      job_type?: string
      max_pages?: number | null
      max_retries?: number
      metadata?: Json | null
      pages_failed?: number | null
      pages_scraped?: number | null
      priority?: number
      progress_message?: string | null
      progress_percent?: number | null
      queue_job_id?: string | null
      retry_count?: number
      started_at?: string | null
      stats?: Json | null
      status?: string
      updated_at?: string | null
      url?: string | null
    }
    Relationships: [
      {
        foreignKeyName: "scrape_jobs_customer_config_id_fkey"
        columns: ["customer_config_id"]
        isOneToOne: false
        referencedRelation: "customer_configs"
        referencedColumns: ["id"]
      },
      {
        foreignKeyName: "scrape_jobs_domain_id_fkey"
        columns: ["domain_id"]
        isOneToOne: false
        referencedRelation: "domains"
        referencedColumns: ["id"]
      },
    ]
  }
  scraped_pages: {
    Row: {
      content: string | null
      content_hash: string | null
      created_at: string | null
      domain_id: string | null
      error_message: string | null
      excerpt: string | null
      html: string | null
      id: string
      images: Json | null
      last_modified: string | null
      last_scraped_at: string | null
      metadata: Json | null
      scraped_at: string | null
      status: string | null
      text_content: string | null
      title: string | null
      updated_at: string | null
      url: string
      word_count: number | null
    }
    Insert: {
      content?: string | null
      content_hash?: string | null
      created_at?: string | null
      domain_id?: string | null
      error_message?: string | null
      excerpt?: string | null
      html?: string | null
      id?: string
      images?: Json | null
      last_modified?: string | null
      last_scraped_at?: string | null
      metadata?: Json | null
      scraped_at?: string | null
      status?: string | null
      text_content?: string | null
      title?: string | null
      updated_at?: string | null
      url: string
      word_count?: number | null
    }
    Update: {
      content?: string | null
      content_hash?: string | null
      created_at?: string | null
      domain_id?: string | null
      error_message?: string | null
      excerpt?: string | null
      html?: string | null
      id?: string
      images?: Json | null
      last_modified?: string | null
      last_scraped_at?: string | null
      metadata?: Json | null
      scraped_at?: string | null
      status?: string | null
      text_content?: string | null
      title?: string | null
      updated_at?: string | null
      url?: string
      word_count?: number | null
    }
    Relationships: [
      {
        foreignKeyName: "scraped_pages_domain_id_fkey"
        columns: ["domain_id"]
        isOneToOne: false
        referencedRelation: "domains"
        referencedColumns: ["id"]
      },
    ]
  }
}