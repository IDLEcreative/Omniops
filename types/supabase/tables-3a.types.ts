/**
 * Auto-generated types from Supabase
 * Database table definitions (Part 3a)
 * Tables: messages, page_content_references, page_embeddings, query_cache
 */

import type { Json } from './json.types'

export interface Tables3a {
  messages: {
    Row: {
      content: string
      conversation_id: string | null
      created_at: string | null
      id: string
      metadata: Json | null
      role: string
    }
    Insert: {
      content: string
      conversation_id?: string | null
      created_at?: string | null
      id?: string
      metadata?: Json | null
      role: string
    }
    Update: {
      content?: string
      conversation_id?: string | null
      created_at?: string | null
      id?: string
      metadata?: Json | null
      role?: string
    }
    Relationships: [
      {
        foreignKeyName: "messages_conversation_id_fkey"
        columns: ["conversation_id"]
        isOneToOne: false
        referencedRelation: "conversations"
        referencedColumns: ["id"]
      },
    ]
  }
  page_content_references: {
    Row: {
      broken_link: boolean | null
      discovered_at: string | null
      domain_id: string | null
      id: string
      internal_link: boolean | null
      last_verified_at: string | null
      redirect_chain: Json | null
      reference_context: string | null
      reference_text: string | null
      reference_type: string
      referenced_page_url: string
      source_page_url: string
    }
    Insert: {
      broken_link?: boolean | null
      discovered_at?: string | null
      domain_id?: string | null
      id?: string
      internal_link?: boolean | null
      last_verified_at?: string | null
      redirect_chain?: Json | null
      reference_context?: string | null
      reference_text?: string | null
      reference_type: string
      referenced_page_url: string
      source_page_url: string
    }
    Update: {
      broken_link?: boolean | null
      discovered_at?: string | null
      domain_id?: string | null
      id?: string
      internal_link?: boolean | null
      last_verified_at?: string | null
      redirect_chain?: Json | null
      reference_context?: string | null
      reference_text?: string | null
      reference_type?: string
      referenced_page_url?: string
      source_page_url?: string
    }
    Relationships: [
      {
        foreignKeyName: "page_content_references_domain_id_fkey"
        columns: ["domain_id"]
        isOneToOne: false
        referencedRelation: "domains"
        referencedColumns: ["id"]
      },
    ]
  }
  page_embeddings: {
    Row: {
      chunk_text: string
      created_at: string | null
      embedding: string | null
      id: string
      metadata: Json | null
      page_id: string | null
    }
    Insert: {
      chunk_text: string
      created_at?: string | null
      embedding?: string | null
      id?: string
      metadata?: Json | null
      page_id?: string | null
    }
    Update: {
      chunk_text?: string
      created_at?: string | null
      embedding?: string | null
      id?: string
      metadata?: Json | null
      page_id?: string | null
    }
    Relationships: [
      {
        foreignKeyName: "page_embeddings_page_id_fkey"
        columns: ["page_id"]
        isOneToOne: false
        referencedRelation: "scraped_pages"
        referencedColumns: ["id"]
      },
    ]
  }
  query_cache: {
    Row: {
      created_at: string | null
      domain_id: string | null
      expires_at: string
      hit_count: number
      id: string
      query_hash: string
      query_text: string | null
      results: Json
      updated_at: string | null
    }
    Insert: {
      created_at?: string | null
      domain_id?: string | null
      expires_at: string
      hit_count?: number
      id?: string
      query_hash: string
      query_text?: string | null
      results: Json
      updated_at?: string | null
    }
    Update: {
      created_at?: string | null
      domain_id?: string | null
      expires_at?: string
      hit_count?: number
      id?: string
      query_hash?: string
      query_text?: string | null
      results?: Json
      updated_at?: string | null
    }
    Relationships: [
      {
        foreignKeyName: "query_cache_domain_id_fkey"
        columns: ["domain_id"]
        isOneToOne: false
        referencedRelation: "domains"
        referencedColumns: ["id"]
      },
    ]
  }
}