# Chat Directory

**Purpose:** Core chat engine with AI processing, tool execution, and conversation management
**Last Updated:** 2025-10-30
**Related:** [Agents](/lib/agents), [API Chat Route](/app/api/chat)

## Overview

Contains the complete chat system implementation including AI processing, tool execution, conversation management, and WooCommerce operations integration.

## Directory Structure

```
chat/
├── ai-processor.ts              # Main AI processing orchestrator
├── ai-processor-formatter.ts    # Response formatting
├── ai-processor-tool-executor.ts # Tool execution handler
├── ai-processor-types.ts        # Type definitions
├── system-prompts.ts            # AI system prompts (main)
├── system-prompts-variant-*.ts  # Experimental prompt variants
├── tool-definitions.ts          # OpenAI function definitions
├── tool-handlers.ts             # Tool execution implementations
├── conversation-manager.ts      # Conversation state management
├── conversation-metadata.ts     # Metadata tracking
├── response-parser.ts           # AI response parsing
├── openai-client.ts            # OpenAI API client
├── request-validator.ts         # Input validation
├── product-formatters.ts        # Product display formatting
├── order-operations/           # Order-related operations
│   ├── informational.ts
│   ├── transactional.ts
│   └── utils.ts
├── product-operations/         # Product search and display
├── cart-operations*.ts         # Cart management
├── store-operations.ts         # Store info operations
├── analytics-operations.ts     # Analytics retrieval
└── report-operations.ts        # Report generation
```

## Core Components

### AI Processing Pipeline

**[ai-processor.ts](ai-processor.ts)** - Orchestrates the entire AI interaction flow:
- Message validation
- Context building
- Tool execution
- Response generation

### Tool System

**[tool-definitions.ts](tool-definitions.ts)** - Defines available tools for AI:
- Product search
- Order lookup
- Cart operations
- Customer verification
- Analytics queries

**[tool-handlers.ts](tool-handlers.ts)** - Implements tool execution:
- Parameter validation
- API calls
- Error handling
- Response formatting

### Operations

**Order Operations (`order-operations/`):**
- Order lookup by number/email
- Order status tracking
- Shipping information
- Return requests

**Product Operations (`product-operations/`):**
- Product search
- Category browsing
- Stock checking
- Price inquiries

**Cart Operations:**
- Cart viewing
- Item management
- Checkout guidance

## Usage Examples

```typescript
import { processAIRequest } from '@/lib/chat/ai-processor';

const response = await processAIRequest({
  message: "What's the status of order #12345?",
  conversationId: 'conv-123',
  customerId: 'customer-456'
});
```

```typescript
import { executeOrderLookup } from '@/lib/chat/order-operations/informational';

const orders = await executeOrderLookup({
  orderNumber: '12345',
  customerId: 'customer-id'
});
```

## System Prompts

Multiple prompt variants for A/B testing:
- **Variant A (Minimal)** - Concise, directive prompts
- **Variant B (Balanced)** - Mid-length with examples
- **Variant C (Focused)** - Detailed with context

## Dependencies

- OpenAI API for AI processing
- WooCommerce API for e-commerce data
- Supabase for conversation storage
