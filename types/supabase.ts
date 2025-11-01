export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
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
    Views: {
      [_ in never]: never
    }
    Functions: {
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
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

export type {
  SupabaseClient,
  User,
  Session,
  AuthError,
  AuthResponse,
  ApiError,
  PostgrestSingleResponse,
} from '@supabase/supabase-js'
