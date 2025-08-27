# Types Directory

TypeScript type definitions and interfaces for the entire application.

## Structure

```
types/
├── api/              # API request/response types
├── database/         # Database schema types
├── api.ts            # Main API types
├── database.ts       # Main database types
└── index.ts          # Common types and re-exports
```

## Type Categories

### API Types (`api.ts`, `api/`)
Request and response types for all API endpoints:

```typescript
// Chat API
interface ChatRequest {
  message: string
  conversation_id?: string
  session_id: string
  domain?: string
}

interface ChatResponse {
  message: string
  conversation_id: string
  sources?: Source[]
}

// Scraping API
interface ScrapeRequest {
  url: string
  crawl?: boolean
  max_pages?: number
}

interface ScrapeResponse {
  status: 'started' | 'completed' | 'failed'
  job_id?: string
  pages_scraped?: number
}
```

### Database Types (`database.ts`, `database/`)
Types matching Supabase table schemas:

```typescript
// Customer configuration
interface CustomerConfig {
  id: string
  domain: string
  config: WidgetConfig
  encrypted_woocommerce_config?: string
  created_at: string
  updated_at: string
}

// Message
interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

// Scraped page
interface ScrapedPage {
  id: string
  customer_id: string
  url: string
  title: string
  content: string
  metadata?: Record<string, any>
}
```

### Common Types (`index.ts`)
Shared types used across the application:

```typescript
// Widget configuration
interface WidgetConfig {
  businessName: string
  welcomeMessage: string
  placeholder: string
  primaryColor: string
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  features: {
    woocommerce: {
      enabled: boolean
    }
    websiteScraping: {
      enabled: boolean
      urls?: string[]
    }
  }
}

// User session
interface UserSession {
  id: string
  email?: string
  metadata?: Record<string, any>
}

// Search result
interface SearchResult {
  content: string
  url?: string
  title?: string
  relevance: number
}
```

## Type Organization

### Naming Conventions
- **Interfaces**: PascalCase, prefixed with `I` if needed to avoid conflicts
- **Types**: PascalCase
- **Enums**: PascalCase with UPPER_CASE values
- **Generic Types**: Use descriptive type parameters (not just `T`)

### File Organization
- Group related types in the same file
- Use barrel exports (`index.ts`) for clean imports
- Separate API types from database types
- Keep third-party types in their own files

## Usage Examples

### Importing Types
```typescript
// Import from barrel export
import { WidgetConfig, CustomerConfig, Message } from '@/types'

// Import specific API types
import { ChatRequest, ChatResponse } from '@/types/api'

// Import database types
import { ScrapedPage, PageEmbedding } from '@/types/database'
```

### Type Guards
```typescript
// Type guard function
function isValidMessage(obj: any): obj is Message {
  return (
    typeof obj === 'object' &&
    'id' in obj &&
    'content' in obj &&
    'role' in obj
  )
}

// Usage
if (isValidMessage(data)) {
  // TypeScript knows data is Message here
  console.log(data.content)
}
```

### Generic Types
```typescript
// API response wrapper
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Paginated response
interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
```

## Zod Integration

We use Zod for runtime validation alongside TypeScript types:

```typescript
import { z } from 'zod'

// Define schema
const MessageSchema = z.object({
  content: z.string().min(1).max(1000),
  role: z.enum(['user', 'assistant', 'system'])
})

// Derive TypeScript type from Zod schema
type Message = z.infer<typeof MessageSchema>

// Validate at runtime
const validated = MessageSchema.parse(unknownData)
```

## Best Practices

1. **Single Source of Truth**: Define types once, import everywhere
2. **Strict Types**: Avoid `any`, use `unknown` when needed
3. **Optional vs Undefined**: Be explicit about optional properties
4. **Discriminated Unions**: Use for state management
5. **Document Complex Types**: Add JSDoc comments for clarity

### Example of Well-Typed Code
```typescript
// Discriminated union for async state
type AsyncState<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

// Using the type
function handleState<T>(state: AsyncState<T>) {
  switch (state.status) {
    case 'idle':
      return 'Ready'
    case 'loading':
      return 'Loading...'
    case 'success':
      return state.data // TypeScript knows data exists
    case 'error':
      return state.error.message // TypeScript knows error exists
  }
}
```

## Type Utilities

Common utility types used in the project:

```typescript
// Make all properties optional recursively
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Pick only certain keys
type Pick<T, K extends keyof T> = {
  [P in K]: T[P]
}

// Omit certain keys
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

// Make certain keys required
type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>
```