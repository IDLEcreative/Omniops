# TypeScript Documentation Index

Complete guide to all TypeScript type definitions, interfaces, and type systems in the Customer Service Agent application.

## 📚 Documentation Structure

This project maintains comprehensive TypeScript documentation across multiple specialized files:

### Core Type Documentation
- **[`/types/README.md`](/types/README.md)** - Main types directory with comprehensive overview
- **[`/types/index.ts`](/types/index.ts)** - Central barrel export for common types
- **[`/types/api.ts`](/types/api.ts)** - API request/response types with Zod validation  
- **[`/types/database.ts`](/types/database.ts)** - Supabase database schema types

### Specialized Type Documentation  
- **[`/lib/WOOCOMMERCE_TYPES.md`](/lib/WOOCOMMERCE_TYPES.md)** - Complete WooCommerce integration types
- **[`/components/COMPONENT_TYPES.md`](/components/COMPONENT_TYPES.md)** - React component prop types and patterns
- **[`/lib/woocommerce-types.ts`](/lib/woocommerce-types.ts)** - Extended WooCommerce type definitions
- **[`/constants/index.ts`](/constants/index.ts)** - Application constants with strong typing

## 🏗️ Type Architecture Overview

### 1. Database Layer Types (`/types/database.ts`)
```typescript
// Core database entities
CustomerConfig, ScrapedPage, Conversation, Message, PageEmbedding, SupportTicket
```
- Complete Supabase table schema types
- Consistent naming conventions
- Metadata support with proper typing

### 2. API Layer Types (`/types/api.ts`) 
```typescript
// Request/Response types with Zod validation
ChatRequest, ChatResponse, ScrapeRequest, ScrapeResponse, GDPRExportResponse
```
- Runtime validation with Zod schemas
- Type inference from schemas
- Comprehensive error handling types

### 3. Business Logic Types (`/types/index.ts`)
```typescript
// Cross-cutting concern types
WooCommerceProduct, WooCommerceOrder, WooCommerceCustomer, WooCommerceSearchResponse
```
- Reusable business entity types
- Integration-ready definitions
- Extensible with index signatures

### 4. UI Component Types (`/components/`)
```typescript
// React component interfaces
ChatWidgetProps, MessageContentProps, ErrorBoundaryProps
```
- Component prop interfaces
- Event handler types
- State management patterns

### 5. Integration Types (`/lib/woocommerce-types.ts`)
```typescript
// Extended WooCommerce ecosystem
ProductCategory, ProductReview, ShippingZone, SettingsGroup, ReportData
```
- Complete WooCommerce REST API coverage
- Parameter types for all endpoints
- System configuration types

## 🎯 Type Usage Patterns

### Import Strategies
```typescript
// Common types (barrel imports)
import { Message, CustomerConfig, ScrapedPage } from '@/types';

// API-specific types  
import { ChatRequest, ChatResponse } from '@/types/api';

// Database-specific types
import { PageEmbedding, SupportTicket } from '@/types/database';

// WooCommerce types
import { WooCommerceProduct, ProductListParams } from '@/lib/woocommerce-types';

// Component types
import type { ChatWidgetProps } from '@/components/ChatWidget';
```

### Validation Patterns
```typescript
// Runtime validation with Zod
import { ChatRequestSchema } from '@/types/api';

const validatedRequest = ChatRequestSchema.parse(unknownData);
// TypeScript knows validatedRequest is ChatRequest

// Type guards for runtime checking
function isMessage(obj: unknown): obj is Message {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}
```

### Generic Type Usage
```typescript
// API response wrapper
interface ApiResponse<TData = unknown> {
  success: boolean;
  data?: TData;
  error?: string;
}

// Usage with specific types
const response: ApiResponse<ChatResponse> = await fetch('/api/chat');
```

## 🔍 Key Type Categories

### Database Types
- **Purpose**: Match Supabase table schemas exactly
- **Pattern**: All include `id`, `created_at`, `updated_at` 
- **Metadata**: Flexible `Record<string, unknown>` for extensibility
- **Examples**: `CustomerConfig`, `Message`, `ScrapedPage`

### API Types  
- **Purpose**: Request/response validation and documentation
- **Pattern**: Paired request/response interfaces with Zod schemas
- **Validation**: Runtime type checking with `z.infer<>`
- **Examples**: `ChatRequest`/`ChatResponse`, `ScrapeRequest`/`ScrapeResponse`

### WooCommerce Types
- **Purpose**: Complete WooCommerce REST API integration
- **Pattern**: Mirror WooCommerce API structure with TypeScript safety
- **Extensibility**: Index signatures for additional properties
- **Examples**: `WooCommerceProduct`, `OrderListParams`, `ReportData`

### Component Types
- **Purpose**: React component prop interfaces and state management  
- **Pattern**: Props end with `Props`, state with `State`
- **Events**: Typed event handlers with specific signatures
- **Examples**: `ChatWidgetProps`, `MessageContentProps`

## 🛠️ Development Tools & Utilities

### Type Utilities
```typescript
// Common utility types available
DeepPartial<T>, RequiredFields<T, K>, OptionalFields<T, K>
DatabaseRecord<T>, CreateRecord<T>, UpdateRecord<T>
```

### Zod Integration
```typescript
// Schema-first development
const Schema = z.object({ /* ... */ });
type TypeFromSchema = z.infer<typeof Schema>;
```

### Class Variance Authority (CVA)
```typescript
// Component variant types
const buttonVariants = cva(/* ... */);
type ButtonProps = VariantProps<typeof buttonVariants>;
```

## 📋 Quick Reference

### Most Used Types
1. **`Message`** - Chat message entity  
2. **`CustomerConfig`** - Widget configuration
3. **`WooCommerceProduct`** - Product data from WooCommerce
4. **`ChatRequest`/`ChatResponse`** - API communication
5. **`ScrapedPage`** - Website content storage

### Import Cheat Sheet
```typescript
// Database entities
import { Message, Conversation, CustomerConfig, ScrapedPage } from '@/types';

// API types  
import { ChatRequest, GDPRExportResponse } from '@/types/api';
import { CustomerConfig, SupportTicket } from '@/types/database';

// WooCommerce
import { 
  WooCommerceProduct, 
  WooCommerceOrder, 
  ProductListParams 
} from '@/lib/woocommerce-types';

// Components
import type { ChatWidgetProps } from '@/components/ChatWidget';
import type { ButtonProps } from '@/components/ui/button';
```

### Validation Examples
```typescript
// API route validation
import { ChatRequestSchema } from '@/types/api';

export async function POST(request: Request) {
  const body = await request.json();
  const result = ChatRequestSchema.safeParse(body);
  
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  
  // result.data is typed as ChatRequest
  return processChat(result.data);
}
```

## 🔄 Type Relationships

### Data Flow Architecture
```
Database Types (Supabase) 
    ↓
API Types (Request/Response)
    ↓  
Component Types (React Props)
    ↓
UI Components (Rendered Output)
```

### Cross-System Integration
```
WooCommerce API → WooCommerce Types → Chat Service → Database Types → Component Types
```

## 📖 Further Reading

For detailed information on specific type systems:

1. **[Database Types](/types/database.ts)** - Supabase schema definitions
2. **[API Types](/types/api.ts)** - Request/response with validation
3. **[WooCommerce Types](/lib/WOOCOMMERCE_TYPES.md)** - Complete integration guide  
4. **[Component Types](/components/COMPONENT_TYPES.md)** - React component patterns
5. **[Main Types Overview](/types/README.md)** - Comprehensive documentation

## 🏷️ Type Conventions

### Naming Standards
- **Interfaces**: PascalCase (`CustomerConfig`, `ChatRequest`)
- **Type Aliases**: PascalCase (`WooCommerceProduct`, `AsyncState`)
- **Props**: End with `Props` (`ChatWidgetProps`)
- **State**: End with `State` (`AsyncState`, `FormState`)
- **Handlers**: Descriptive names (`MessageHandler`, `ClickHandler`)

### File Organization
- **Core types**: `/types/index.ts` (barrel export)
- **API types**: `/types/api.ts` (with Zod schemas)  
- **Database types**: `/types/database.ts` (Supabase schema)
- **Specialized types**: Domain-specific files (`woocommerce-types.ts`)
- **Component types**: Inline in component files or dedicated docs

This comprehensive type system ensures type safety, excellent developer experience, and maintainable code across the entire Customer Service Agent application.