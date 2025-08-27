// API request/response types

import { z } from 'zod';

// Chat API
export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  conversation_id: z.string().uuid().optional(),
  session_id: z.string().min(1),
  domain: z.string().optional(),
  config: z.object({
    features: z.object({
      woocommerce: z.object({ enabled: z.boolean() }).optional(),
      websiteScraping: z.object({ enabled: z.boolean() }).optional(),
    }).optional(),
  }).optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export interface ChatResponse {
  message: string;
  conversation_id: string;
  sources?: Array<{
    url: string;
    title: string;
    relevance: number;
  }>;
}

// Scraping API
export const ScrapeRequestSchema = z.object({
  url: z.string().url(),
  crawl: z.boolean().default(false),
  max_pages: z.number().min(1).max(100).default(50),
});

export type ScrapeRequest = z.infer<typeof ScrapeRequestSchema>;

export interface ScrapeResponse {
  status: 'started' | 'completed' | 'failed';
  job_id?: string;
  pages_scraped?: number;
  message: string;
}

// Admin API
export const ConfigUpdateRequestSchema = z.object({
  domain: z.string(),
  config: z.object({
    business_name: z.string().optional(),
    welcome_message: z.string().optional(),
    primary_color: z.string().optional(),
    chat_button_text: z.string().optional(),
    chat_icon_url: z.string().optional(),
    position: z.enum(['bottom-right', 'bottom-left']).optional(),
    features: z.object({
      woocommerce: z.object({ enabled: z.boolean() }).optional(),
      websiteScraping: z.object({ enabled: z.boolean() }).optional(),
    }).optional(),
    suggested_questions: z.array(z.string()).optional(),
    woocommerce_url: z.string().optional(),
    woocommerce_key: z.string().optional(),
    woocommerce_secret: z.string().optional(),
  }),
});

export type ConfigUpdateRequest = z.infer<typeof ConfigUpdateRequestSchema>;

// WooCommerce API
export interface WooCommerceTestRequest {
  url: string;
  consumerKey: string;
  consumerSecret: string;
}

export interface WooCommerceTestResponse {
  success: boolean;
  message?: string;
  store_name?: string;
  woocommerce_version?: string;
}

// GDPR API
export const GDPRRequestSchema = z.object({
  session_id: z.string(),
});

export type GDPRRequest = z.infer<typeof GDPRRequestSchema>;

export interface GDPRExportResponse {
  conversations: Array<{
    id: string;
    session_id: string;
    user_email?: string;
    created_at: string;
    updated_at: string;
    metadata?: Record<string, unknown>;
  }>;
  messages: Array<{
    id: string;
    conversation_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: Record<string, unknown>;
    created_at: string;
  }>;
  support_tickets: Array<{
    id: string;
    conversation_id: string;
    email: string;
    summary: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    created_at: string;
    updated_at: string;
  }>;
}

export interface GDPRDeleteResponse {
  success: boolean;
  deleted: {
    conversations: number;
    messages: number;
    support_tickets: number;
  };
}

// Support API
export const SupportTicketRequestSchema = z.object({
  conversation_id: z.string().uuid(),
  email: z.string().email(),
  summary: z.string(),
});

export type SupportTicketRequest = z.infer<typeof SupportTicketRequestSchema>;

// Error Response
export interface ErrorResponse {
  error: string;
  details?: Record<string, unknown> | string | unknown[];
}