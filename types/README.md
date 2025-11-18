# Types Directory

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Database Schema](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
**Estimated Read Time:** 13 minutes

## Purpose

Complete TypeScript type definitions and interfaces for the entire Customer Service Agent application, providing compile-time safety, IntelliSense support, and comprehensive documentation for database, API, and domain-specific types.

## Quick Links

- [Database Schema Reference](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [API Documentation](/home/user/Omniops/docs/03-API/reference.md)
- [Main README](/home/user/Omniops/README.md)
- [Type Tests](/home/user/Omniops/__tests__/types)

## Table of Contents

- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [Core Type Categories](#core-type-categories)
  - [Database Types (database.ts)](#1-database-types-databasets)
  - [API Types (api.ts)](#2-api-types-apits)
  - [Common Types (index.ts)](#3-common-types-indexts)
- [Type Import Patterns](#type-import-patterns)
- [Type Safety Guidelines](#type-safety-guidelines)
- [Zod Schema Validation](#zod-schema-validation)
- [Extending Types](#extending-types)
- [Type Utilities](#type-utilities)
- [Best Practices](#best-practices)
- [Related Documentation](#related-documentation)

---

## Overview

This directory contains all TypeScript type definitions, organized by domain and purpose. The types provide compile-time safety, IntelliSense support, and documentation for the entire application architecture.

## Directory Structure

```
types/
├── README.md         # This comprehensive documentation
├── index.ts          # Main barrel export with core types
├── api.ts            # API request/response types with Zod schemas
├── database.ts       # Database table types (Supabase)
├── api/              # Nested API-specific types (empty currently)
└── database/         # Nested database-specific types (empty currently)
```

## Core Type Categories

### 1. Database Types (`database.ts`)

Complete type definitions matching Supabase database schema:

#### Customer & Configuration
```typescript
interface CustomerConfig {
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
```

#### Content & Conversations
```typescript
interface ScrapedPage {
  id: string;
  customer_id: string;
  url: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  last_scraped_at: string;
  created_at: string;
}

interface Conversation {
  id: string;
  customer_id: string;
  session_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    sources?: string[];
    products?: number[];
    orders?: number[];
  };
  created_at: string;
}
```

#### AI & Embeddings
```typescript
interface PageEmbedding {
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
```

#### Support System
```typescript
interface SupportTicket {
  id: string;
  conversation_id: string;
  customer_id: string;
  email: string;
  summary: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}
```

### 2. API Types (`api.ts`)

API request/response types with runtime validation via Zod schemas:

#### Chat API
```typescript
// With Zod validation
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

interface ChatResponse {
  message: string;
  conversation_id: string;
  sources?: Array<{
    url: string;
    title: string;
    relevance: number;
  }>;
}
```

#### Scraping API
```typescript
export const ScrapeRequestSchema = z.object({
  url: z.string().url(),
  crawl: z.boolean().default(false),
  max_pages: z.number().min(1).max(100).default(50),
});

export type ScrapeRequest = z.infer<typeof ScrapeRequestSchema>;

interface ScrapeResponse {
  status: 'started' | 'completed' | 'failed';
  job_id?: string;
  pages_scraped?: number;
  message: string;
}
```

#### GDPR & Privacy
```typescript
export const GDPRRequestSchema = z.object({
  session_id: z.string(),
});

interface GDPRExportResponse {
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
```

### 3. WooCommerce Types

Comprehensive WooCommerce integration types (see detailed section below):

#### Core Entities
```typescript
type WooCommerceProduct = {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  description: string;
  price: string;
  regular_price: string;
  sale_price?: string;
  sku?: string;
  stock_status?: string;
  stock_quantity?: number;
  categories?: Array<{ id: number; name: string; slug: string }>;
  images?: Array<{ id: number; src: string; name: string; alt: string }>;
  [key: string]: unknown;
};

type WooCommerceOrder = {
  id: number;
  parent_id: number;
  number: string;
  order_key: string;
  created_via: string;
  status: string;
  currency: string;
  date_created: string;
  date_modified: string;
  total: string;
  customer_id: number;
  billing?: Record<string, string>;
  shipping?: Record<string, string>;
  line_items?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

type WooCommerceCustomer = {
  id: number;
  date_created: string;
  date_modified: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  username: string;
  billing?: Record<string, string>;
  shipping?: Record<string, string>;
  is_paying_customer: boolean;
  [key: string]: unknown;
};
```

### 4. Component Types

React component prop types found throughout the application:

#### Chat Widget
```typescript
interface ChatWidgetProps {
  demoId?: string;
  demoConfig?: any;
  initialOpen?: boolean;
  forceClose?: boolean;
  privacySettings?: {
    allowOptOut?: boolean;
    showPrivacyNotice?: boolean;
    requireConsent?: boolean;
    consentGiven?: boolean;
    retentionDays?: number;
  };
  onReady?: () => void;
  onMessage?: (message: Message) => void;
}
```

#### Error Boundary
```typescript
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}
```

### 5. Service Layer Types

Internal service and utility types:

#### Chat Service
```typescript
interface ChatSession {
  id?: string;
  session_id?: string;
  user_id?: string;
  started_at?: string;
  ended_at?: string;
  title?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

interface ChatMessage {
  id?: string;
  message_id?: string;
  session_id?: string;
  conversation_id?: string;
  user_id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}
```

## WooCommerce Type System

### Extended WooCommerce Types (`lib/woocommerce-types.ts`)

The application includes comprehensive WooCommerce REST API type definitions:

#### Extended Product Types
```typescript
interface ProductAttributeTerm {
  id: number;
  name: string;
  slug: string;
  description?: string;
  menu_order?: number;
  count?: number;
}

interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  parent?: number;
  description?: string;
  display?: string;
  image?: {
    id: number;
    date_created: string;
    date_modified: string;
    src: string;
    name: string;
    alt: string;
  };
  menu_order?: number;
  count?: number;
}

interface ProductReview {
  id: number;
  date_created: string;
  date_created_gmt: string;
  product_id: number;
  status: string;
  reviewer: string;
  reviewer_email: string;
  review: string;
  rating: number;
  verified: boolean;
  reviewer_avatar_urls?: Record<string, string>;
}
```

#### System & Settings Types
```typescript
interface SettingsGroup {
  id: string;
  label: string;
  description: string;
  parent_id: string;
  sub_groups: string[];
}

interface SettingOption {
  id: string;
  label: string;
  description: string;
  type: string;
  default: string;
  options?: Record<string, string>;
  tip?: string;
  value?: unknown;
  group_id?: string;
}
```

#### API Parameters
```typescript
interface ListParams {
  context?: 'view' | 'edit';
  page?: number;
  per_page?: number;
  search?: string;
  after?: string;
  before?: string;
  exclude?: number[];
  include?: number[];
  offset?: number;
  order?: 'asc' | 'desc';
  orderby?: string;
}

interface ProductListParams extends ListParams {
  orderby?: 'date' | 'id' | 'include' | 'title' | 'slug' | 'price' | 'popularity' | 'rating';
  parent?: number[];
  parent_exclude?: number[];
  slug?: string;
  status?: 'any' | 'draft' | 'pending' | 'private' | 'publish';
  type?: 'simple' | 'grouped' | 'external' | 'variable';
  sku?: string;
  featured?: boolean;
  category?: string;
  tag?: string;
  shipping_class?: string;
  attribute?: string;
  attribute_term?: string;
  tax_class?: string;
  on_sale?: boolean;
  min_price?: string;
  max_price?: string;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
}
```

### WooCommerce Client Type
```typescript
type WooCommerceClient = {
  get: <T = any>(path: string, params?: any) => Promise<{ data: T }>;
  post: <T = any>(path: string, data?: any) => Promise<{ data: T }>;
  put: <T = any>(path: string, data?: any) => Promise<{ data: T }>;
  delete: <T = any>(path: string, params?: any) => Promise<{ data: T }>;
};
```

## Application Constants & Types

### Constants (`constants/index.ts`)
All application constants are strongly typed with `as const` assertions:

```typescript
export const RATE_LIMITS = {
  default: { requests: 100, window: 60 * 1000 },
  premium: { requests: 500, window: 60 * 1000 },
} as const;

export const CHAT_SETTINGS = {
  maxMessageLength: 1000,
  maxConversationHistory: 10,
  aiModel: 'gpt-5-mini',
  embeddingModel: 'text-embedding-3-small',
  temperature: 1,
  maxTokens: 500,
} as const;

export const UI_CONSTANTS = {
  positions: ['bottom-right', 'bottom-left'] as const,
  defaultColor: '#0070f3',
  animationDuration: 200,
} as const;
```

## Type Usage Patterns

### 1. Import Patterns
```typescript
// Barrel imports for common types
import { Message, CustomerConfig, ScrapedPage } from '@/types';

// Specific API types
import { ChatRequest, ChatResponse } from '@/types/api';

// WooCommerce types
import { WooCommerceProduct, ProductListParams } from '@/lib/woocommerce-types';

// Component prop types
import type { ChatWidgetProps } from '@/components/ChatWidget';
```

### 2. Type Guards & Validation
```typescript
// Runtime type checking with Zod
function validateChatRequest(data: unknown): ChatRequest {
  return ChatRequestSchema.parse(data);
}

// Type guard functions
function isValidMessage(obj: any): obj is Message {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'content' in obj &&
    'role' in obj &&
    ['user', 'assistant', 'system'].includes(obj.role)
  );
}

// Usage in API handlers
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = validateChatRequest(body);
    // TypeScript knows validatedData is ChatRequest
    return await processChat(validatedData);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
```

### 3. Generic Type Usage
```typescript
// API response wrapper
interface ApiResponse<TData = unknown> {
  success: boolean;
  data?: TData;
  error?: string;
  timestamp: string;
}

// Usage with specific data types
const chatResponse: ApiResponse<ChatResponse> = {
  success: true,
  data: {
    message: "Hello!",
    conversation_id: "uuid-here",
    sources: []
  },
  timestamp: new Date().toISOString()
};

// Paginated responses
interface PaginatedResponse<TItem> {
  items: TItem[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// Usage
const productsResponse: PaginatedResponse<WooCommerceProduct> = {
  items: [...],
  pagination: { page: 1, per_page: 20, total: 100, total_pages: 5 }
};
```

### 4. Discriminated Unions
```typescript
// Async operation state
type AsyncState<TData, TError = Error> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: TData }
  | { status: 'error'; error: TError };

// Scraping job states
type ScrapeJobState = 
  | { status: 'queued'; queuedAt: string }
  | { status: 'running'; startedAt: string; progress: number }
  | { status: 'completed'; completedAt: string; pagesScraped: number }
  | { status: 'failed'; failedAt: string; error: string };
```

## Type Organization & Best Practices

### 1. Naming Conventions
- **Interfaces**: PascalCase (`CustomerConfig`, `ChatRequest`)
- **Type Aliases**: PascalCase (`WooCommerceProduct`, `AsyncState`)
- **Enums**: PascalCase with UPPER_CASE values
- **Generic Parameters**: Descriptive (`TData`, `TError` vs just `T`)
- **Props**: End with `Props` (`ChatWidgetProps`)
- **State**: End with `State` (`AsyncState`)

### 2. File Organization Strategy
- **`types/index.ts`**: Common types used across multiple modules
- **`types/api.ts`**: API request/response types with Zod validation
- **`types/database.ts`**: Database schema types (Supabase tables)
- **`lib/woocommerce-types.ts`**: WooCommerce-specific comprehensive types
- **Component files**: Inline prop types for components

### 3. Documentation Standards
```typescript
/**
 * Represents a customer's widget configuration
 * @interface CustomerConfig
 * @property {string} id - Unique identifier
 * @property {string} domain - Customer's domain
 * @property {Object} config - Widget configuration object
 * @property {boolean} woocommerce_enabled - Whether WooCommerce integration is active
 */
interface CustomerConfig {
  id: string;
  domain: string;
  config: WidgetConfigSchema;
  woocommerce_enabled: boolean;
  created_at: string;
  updated_at: string;
}
```

### 4. Type Utilities
```typescript
// Utility types for common patterns
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Database record helpers
type DatabaseRecord<T> = T & {
  id: string;
  created_at: string;
  updated_at: string;
};

type CreateRecord<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;
type UpdateRecord<T> = Partial<Omit<T, 'id' | 'created_at'>>;
```

## Runtime Validation with Zod

The application uses Zod schemas for runtime validation alongside TypeScript compile-time checking:

### Schema Patterns
```typescript
import { z } from 'zod';

// Base schemas
const UUIDSchema = z.string().uuid();
const TimestampSchema = z.string().datetime();

// API request schemas
export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  conversation_id: UUIDSchema.optional(),
  session_id: z.string().min(1),
  domain: z.string().url().optional(),
});

// Derive TypeScript type from schema
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

// Configuration schemas
const WidgetConfigSchema = z.object({
  business_name: z.string().optional(),
  welcome_message: z.string().max(500).optional(),
  primary_color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  position: z.enum(['bottom-right', 'bottom-left']).optional(),
  features: z.object({
    woocommerce: z.object({ enabled: z.boolean() }).optional(),
    websiteScraping: z.object({ enabled: z.boolean() }).optional(),
  }).optional(),
});

// Usage in API routes
export async function POST(request: Request) {
  const body = await request.json();
  
  // Runtime validation
  const result = ChatRequestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: result.error.issues },
      { status: 400 }
    );
  }
  
  // TypeScript knows result.data is ChatRequest
  return processChat(result.data);
}
```

## Type Relationships & Data Flow

### Database → API → Components Flow
```typescript
// Database types (from Supabase)
interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// API response type
interface ChatResponse {
  message: string;
  conversation_id: string;
  sources?: Array<{
    url: string;
    title: string;
    relevance: number;
  }>;
}

// Component prop type
interface MessageContentProps {
  message: Message;
  isLoading?: boolean;
  showSources?: boolean;
}

// Usage chain
const dbMessage: Message = await fetchMessage(id);
const apiResponse: ChatResponse = await sendChatMessage(request);
const messageProps: MessageContentProps = {
  message: dbMessage,
  isLoading: false,
  showSources: true
};
```

This comprehensive type system ensures type safety throughout the entire application stack, from database queries to API responses to React component props.