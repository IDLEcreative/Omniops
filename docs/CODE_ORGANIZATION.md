# Code Organization Guide

This document explains the code organization and structure of the Customer Service Agent project.

## Directory Structure

```
customer-service-agent/
├── app/                      # Next.js App Router
│   ├── api/                 # API routes
│   │   ├── chat/           # Chat endpoints
│   │   ├── scrape/         # Scraping endpoints
│   │   ├── admin/          # Admin endpoints
│   │   ├── woocommerce/    # E-commerce endpoints
│   │   ├── gdpr/           # GDPR compliance
│   │   └── support/        # Support endpoints
│   ├── (pages)/            # Application pages
│   │   ├── admin/          # Admin interface
│   │   ├── chat/           # Chat interface
│   │   ├── configure/      # Configuration
│   │   └── embed/          # Widget embed
│   └── layout.tsx          # Root layout
│
├── components/              # React components
│   ├── ui/                 # Reusable UI components
│   │   ├── button.tsx      # Button component
│   │   ├── card.tsx        # Card component
│   │   ├── input.tsx       # Input component
│   │   └── ...            # Other UI components
│   └── features/           # Feature-specific components
│       └── cookie-consent.tsx
│
├── lib/                     # Core business logic
│   ├── supabase/           # Database clients
│   │   ├── client.ts       # Browser client
│   │   └── server.ts       # Server client
│   ├── services/           # Business services
│   │   ├── chat.service.ts # Chat logic
│   │   ├── scraping.service.ts
│   │   └── woocommerce.service.ts
│   ├── repositories/       # Data access layer
│   ├── config.ts          # Configuration schema
│   ├── embeddings.ts      # Embeddings utilities
│   ├── firecrawl.ts       # Web scraping
│   ├── rate-limit.ts      # Rate limiting
│   ├── utils.ts           # General utilities
│   └── woocommerce.ts     # WooCommerce client
│
├── types/                   # TypeScript types
│   ├── index.ts            # Legacy types (to be refactored)
│   ├── api.ts              # API types
│   ├── database.ts         # Database types
│   └── woocommerce.ts      # WooCommerce types
│
├── constants/               # Application constants
│   └── index.ts            # All constants
│
├── hooks/                   # Custom React hooks
│   └── (empty)             # To be populated
│
├── __tests__/              # Test files
│   ├── api/                # API route tests
│   ├── lib/                # Library tests
│   ├── components/         # Component tests
│   ├── mocks/              # Test mocks
│   └── utils/              # Test utilities
│
├── docs/                    # Documentation
│   ├── API.md              # API reference
│   ├── ARCHITECTURE.md     # Architecture guide
│   ├── DEPLOYMENT.md       # Deployment guide
│   └── CODE_ORGANIZATION.md # This file
│
├── public/                  # Static assets
│   └── (empty)
│
└── database/                # Database files
    ├── schema.sql          # Database schema
    ├── migrations/         # Migration files
    └── seeds/              # Seed data
```

## Code Organization Principles

### 1. Separation of Concerns

Each module has a specific responsibility:
- **API Routes**: Handle HTTP requests/responses
- **Services**: Business logic and orchestration
- **Repositories**: Data access and persistence
- **Components**: UI presentation
- **Types**: Type definitions
- **Constants**: Shared constants

### 2. File Naming Conventions

- **Components**: PascalCase (e.g., `ChatInterface.tsx`)
- **Utilities**: camelCase (e.g., `rateLimiter.ts`)
- **Types**: PascalCase for interfaces/types
- **Constants**: UPPER_SNAKE_CASE
- **Test files**: `*.test.ts` or `*.spec.ts`

### 3. Import Order

Follow this import order in all files:

```typescript
// 1. External imports
import { NextRequest } from 'next/server';
import { z } from 'zod';

// 2. Internal absolute imports
import { ChatService } from '@/lib/services/chat.service';
import { CHAT_SETTINGS } from '@/constants';

// 3. Internal relative imports
import { validateRequest } from './utils';

// 4. Type imports
import type { ChatRequest } from '@/types/api';
```

### 4. Module Organization

#### API Routes (`app/api/`)

```typescript
// Standard structure for API routes
export async function GET(request: NextRequest) {
  try {
    // 1. Validate request
    // 2. Check permissions
    // 3. Process business logic
    // 4. Return response
  } catch (error) {
    // Handle errors
  }
}
```

#### Services (`lib/services/`)

```typescript
// Service class pattern
export class ChatService {
  constructor(
    private supabase: SupabaseClient,
    private openai: OpenAI
  ) {}

  async processMessage(request: ChatRequest): Promise<ChatResponse> {
    // Business logic here
  }
}
```

#### Components (`components/`)

```typescript
// Component structure
interface ComponentProps {
  // Props definition
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // Hooks
  // Event handlers
  // Render logic
}
```

### 5. Type Organization

Types are organized by domain:

- **`types/api.ts`**: API request/response types
- **`types/database.ts`**: Database table types
- **`types/woocommerce.ts`**: WooCommerce types
- **`types/ui.ts`**: UI component props

### 6. Testing Structure

Tests mirror the source structure:

```
__tests__/
├── api/chat/route.test.ts    # Tests for app/api/chat/route.ts
├── lib/services/             # Service tests
└── components/               # Component tests
```

## Best Practices

### 1. Use Barrel Exports

Create `index.ts` files for cleaner imports:

```typescript
// lib/services/index.ts
export * from './chat.service';
export * from './scraping.service';
export * from './woocommerce.service';
```

### 2. Dependency Injection

Use dependency injection for testability:

```typescript
export function createChatService(deps: Dependencies) {
  return new ChatService(deps.supabase, deps.openai);
}
```

### 3. Error Handling

Centralized error handling:

```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}
```

### 4. Configuration

Use environment variables with validation:

```typescript
const envSchema = z.object({
  OPENAI_API_KEY: z.string(),
  DATABASE_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

### 5. Constants

Group related constants:

```typescript
export const LIMITS = {
  message: { min: 1, max: 1000 },
  conversation: { history: 10 },
} as const;
```

## Migration Guide

When refactoring existing code:

1. **Identify the domain**: Is it API, database, or UI?
2. **Move to appropriate directory**: Follow the structure above
3. **Update imports**: Use absolute imports with `@/`
4. **Add types**: Ensure proper typing
5. **Write tests**: Add corresponding tests

## Example Refactoring

Before:
```typescript
// All in one file
export async function POST(request) {
  const body = await request.json();
  // Validation, business logic, database access all mixed
}
```

After:
```typescript
// app/api/chat/route.ts
import { ChatService } from '@/lib/services/chat.service';
import { ChatRequestSchema } from '@/types/api';

export async function POST(request: NextRequest) {
  const body = ChatRequestSchema.parse(await request.json());
  const service = new ChatService();
  return NextResponse.json(await service.processMessage(body));
}

// lib/services/chat.service.ts
export class ChatService {
  async processMessage(request: ChatRequest): Promise<ChatResponse> {
    // Business logic here
  }
}
```

## Future Improvements

1. **Extract common patterns**: Create base classes/utilities
2. **Add middleware**: For common API logic
3. **Implement caching layer**: Redis integration
4. **Add monitoring**: APM integration
5. **Create SDK**: Client library for the API