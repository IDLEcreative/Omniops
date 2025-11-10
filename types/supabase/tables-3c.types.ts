/**
 * Auto-generated types from Supabase
 * Database table definitions (Part 3c)
 * Tables: structured_extractions, training_data, website_content
 */

import type { Json } from './json.types'

export interface Tables3c {
  structured_extractions: {
    Row: {
      confidence_score: number | null
      created_at: string | null
      domain_id: string | null
      extract_type: string
      extracted_at: string | null
      extracted_data: Json
      id: string
      schema_used: Json | null
      url: string
    }
    Insert: {
      confidence_score?: number | null
      created_at?: string | null
      domain_id?: string | null
      extract_type: string
      extracted_at?: string | null
      extracted_data: Json
      id?: string
      schema_used?: Json | null
      url: string
    }
    Update: {
      confidence_score?: number | null
      created_at?: string | null
      domain_id?: string | null
      extract_type?: string
      extracted_at?: string | null
      extracted_data?: Json
      id?: string
      schema_used?: Json | null
      url?: string
    }
    Relationships: [
      {
        foreignKeyName: "structured_extractions_domain_id_fkey"
        columns: ["domain_id"]
        isOneToOne: false
        referencedRelation: "domains"
        referencedColumns: ["id"]
      },
    ]
  }
  training_data: {
    Row: {
      content: string
      created_at: string | null
      domain_id: string | null
      id: string
      metadata: Json | null
      status: string | null
      type: string
      user_id: string | null
    }
    Insert: {
      content: string
      created_at?: string | null
      domain_id?: string | null
      id?: string
      metadata?: Json | null
      status?: string | null
      type: string
      user_id?: string | null
    }
    Update: {
      content?: string
      created_at?: string | null
      domain_id?: string | null
      id?: string
      metadata?: Json | null
      status?: string | null
      type?: string
      user_id?: string | null
    }
    Relationships: [
      {
        foreignKeyName: "training_data_domain_id_fkey"
        columns: ["domain_id"]
        isOneToOne: false
        referencedRelation: "domains"
        referencedColumns: ["id"]
      },
    ]
  }
  website_content: {
    Row: {
      content: string | null
      content_hash: string | null
      content_type: string | null
      created_at: string | null
      domain_id: string | null
      id: string
      metadata: Json | null
      scraped_at: string | null
      summary: string | null
      title: string | null
      updated_at: string | null
      url: string
    }
    Insert: {
      content?: string | null
      content_hash?: string | null
      content_type?: string | null
      created_at?: string | null
      domain_id?: string | null
      id?: string
      metadata?: Json | null
      scraped_at?: string | null
      summary?: string | null
      title?: string | null
      updated_at?: string | null
      url: string
    }
    Update: {
      content?: string | null
      content_hash?: string | null
      content_type?: string | null
      created_at?: string | null
      domain_id?: string | null
      id?: string
      metadata?: Json | null
      scraped_at?: string | null
      summary?: string | null
      title?: string | null
      updated_at?: string | null
      url?: string
    }
    Relationships: [
      {
        foreignKeyName: "website_content_domain_id_fkey"
        columns: ["domain_id"]
        isOneToOne: false
        referencedRelation: "domains"
        referencedColumns: ["id"]
      },
    ]
  }
}