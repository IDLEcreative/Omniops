// Database table types

export interface CustomerConfig {
  id: string;
  domain: string;
  config: {
    business_name?: string;
    welcome_message?: string;
    primary_color?: string;
    chat_button_text?: string;
    chat_icon_url?: string;
    position?: 'bottom-right' | 'bottom-left';
    features?: {
      woocommerce?: { enabled: boolean };
      websiteScraping?: { enabled: boolean };
    };
    suggested_questions?: string[];
  };
  encrypted_woocommerce_config?: string;
  woocommerce_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScrapedPage {
  id: string;
  customer_id: string;
  url: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  last_scraped_at: string;
  created_at: string;
}

export interface PageEmbedding {
  id: string;
  page_id: string;
  chunk_text: string;
  embedding: number[];
  metadata?: {
    chunk_index?: number;
    [key: string]: string | number | boolean | null | undefined;
  };
  created_at: string;
}

export interface Conversation {
  id: string;
  customer_id: string;
  session_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    sources?: string[];
    products?: number[];
    orders?: number[];
    [key: string]: string[] | number[] | string | number | boolean | null | undefined;
  };
  created_at: string;
}

export interface SupportTicket {
  id: string;
  conversation_id: string;
  customer_id: string;
  email: string;
  summary: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}