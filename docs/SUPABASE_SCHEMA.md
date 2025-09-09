# Supabase Database Schema Documentation

> **Last Updated**: 2025-08-28  
> **Purpose**: Single source of truth for all Supabase Omni database tables, columns, and relationships  
> **Note**: This document prevents table/column name mismatches in development

## 📋 Table of Contents
- [Database Overview](#database-overview)
- [Complete Table List](#complete-table-list)
- [Detailed Schema](#detailed-schema)
- [Foreign Key Relationships](#foreign-key-relationships)
- [Indexes](#indexes)
- [Key Features](#key-features)

## Database Overview

### Tech Stack
- **Database**: PostgreSQL (via Supabase)
- **Extensions**: 
  - `uuid-ossp` - UUID generation
  - `vector` - pgvector for embedding storage (1536 dimensions for OpenAI)
  - `pg_trgm` - Text search optimization

### Architecture Pattern
- Multi-tenant system with domain-based isolation
- Row Level Security (RLS) on all tables
- Cascading deletes for data integrity
- Encrypted credential storage (AES-256)

## Complete Table List

### Core Business Tables (3)
| Table Name | Purpose |
|------------|---------|
| `customers` | Primary customer/client records with auth integration |
| `customer_configs` | Customer settings, integrations, and encrypted credentials |
| `domains` | Registered domains for scraping and management |

### Content & Scraping Tables (7)
| Table Name | Purpose |
|------------|---------|
| `scraped_pages` | Raw scraped website pages |
| `website_content` | Processed and structured website content |
| `structured_extractions` | AI-extracted structured data (products, FAQs, etc.) |
| `content_refresh_jobs` | Background job tracking for content updates |
| `content_hashes` | Content deduplication and change detection |
| `page_content_references` | Internal/external link mapping and analysis |
| `domain_patterns` | Learned extraction patterns for different platforms |

### AI & Embeddings Tables (3)
| Table Name | Purpose |
|------------|---------|
| `page_embeddings` | Vector embeddings for scraped pages and semantic search |
| `ai_optimized_content` | AI-enhanced content with quality scores |
| `training_data` | Custom training data for domain-specific AI |

### Chat & Communication Tables (4)
| Table Name | Purpose |
|------------|---------|
| `conversations` | Chat conversation sessions |
| `messages` | Individual chat messages |
| `chat_sessions` | Chat session metadata (alternative structure) |
| `chat_messages` | Alternative chat message structure |

### Privacy & Compliance Tables (4)
| Table Name | Purpose |
|------------|---------|
| `customer_verifications` | Customer verification records |
| `customer_access_logs` | Access logging and audit trails |
| `customer_data_cache` | Cached customer-specific data |
| `privacy_requests` | GDPR/CCPA privacy requests tracking |

### Multi-tenant Architecture Tables (3)
| Table Name | Purpose |
|------------|---------|
| `businesses` | Multi-tenant business accounts |
| `business_configs` | Business-specific configurations |
| `business_usage` | Usage tracking and billing |

## Detailed Schema

### Core Business Tables

#### `customers`
```sql
id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4()
auth_user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE
email               TEXT UNIQUE NOT NULL
name                TEXT
company_name        TEXT
created_at          TIMESTAMPTZ DEFAULT NOW()
updated_at          TIMESTAMPTZ DEFAULT NOW()
```

#### `customer_configs`
```sql
id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4()
customer_id             UUID REFERENCES customers(id) ON DELETE CASCADE
domain                  TEXT UNIQUE NOT NULL
business_name           TEXT
business_description    TEXT
primary_color           TEXT DEFAULT '#000000'
welcome_message         TEXT
suggested_questions     JSONB DEFAULT '[]'::jsonb
woocommerce_url         TEXT
woocommerce_consumer_key    TEXT
woocommerce_consumer_secret TEXT
encrypted_credentials   JSONB
owned_domains           TEXT[] DEFAULT '{}'
rate_limit              INTEGER DEFAULT 10
allowed_origins         TEXT[] DEFAULT ARRAY['*']
active                  BOOLEAN DEFAULT true
created_at              TIMESTAMPTZ DEFAULT NOW()
updated_at              TIMESTAMPTZ DEFAULT NOW()
```

#### `domains`
```sql
id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE
domain              TEXT UNIQUE NOT NULL
name                TEXT
description         TEXT
last_scraped_at     TIMESTAMPTZ
last_content_refresh TIMESTAMPTZ
scrape_frequency    TEXT DEFAULT 'weekly'
active              BOOLEAN DEFAULT true
created_at          TIMESTAMPTZ DEFAULT NOW()
updated_at          TIMESTAMPTZ DEFAULT NOW()
```

### Content & Scraping Tables

#### `scraped_pages`
```sql
id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4()
domain_id           UUID REFERENCES domains(id) ON DELETE CASCADE
url                 TEXT NOT NULL
title               TEXT
content             TEXT
html                TEXT
metadata            JSONB DEFAULT '{}'::jsonb
status              TEXT DEFAULT 'pending'
error_message       TEXT
scraped_at          TIMESTAMPTZ
last_modified       TIMESTAMPTZ
created_at          TIMESTAMPTZ DEFAULT NOW()
```

#### `website_content`
```sql
id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4()
domain_id           UUID REFERENCES domains(id) ON DELETE CASCADE
url                 TEXT NOT NULL
title               TEXT
content             TEXT
summary             TEXT
content_type        TEXT
content_hash        TEXT
metadata            JSONB DEFAULT '{}'::jsonb
scraped_at          TIMESTAMPTZ
created_at          TIMESTAMPTZ DEFAULT NOW()
updated_at          TIMESTAMPTZ DEFAULT NOW()
```

#### `structured_extractions`
```sql
id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4()
domain_id           UUID REFERENCES domains(id) ON DELETE CASCADE
url                 TEXT NOT NULL
extract_type        TEXT NOT NULL  -- 'faq', 'product', 'contact', etc.
extracted_data      JSONB NOT NULL
schema_used         JSONB
confidence_score    FLOAT
extracted_at        TIMESTAMPTZ
created_at          TIMESTAMPTZ DEFAULT NOW()
```

#### `content_refresh_jobs`
```sql
id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4()
domain_id           UUID REFERENCES domains(id) ON DELETE CASCADE
job_type            TEXT NOT NULL
status              TEXT DEFAULT 'pending'
started_at          TIMESTAMPTZ
completed_at        TIMESTAMPTZ
error_message       TEXT
metadata            JSONB DEFAULT '{}'::jsonb
created_at          TIMESTAMPTZ DEFAULT NOW()
updated_at          TIMESTAMPTZ DEFAULT NOW()
```

### AI & Embeddings Tables

#### `page_embeddings`
```sql
id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4()
page_id             UUID REFERENCES scraped_pages(id) ON DELETE CASCADE
chunk_text          TEXT NOT NULL
embedding           vector(1536)  -- OpenAI embeddings dimension
metadata            JSONB DEFAULT '{}'::jsonb
created_at          TIMESTAMPTZ DEFAULT NOW()
```


#### `ai_optimized_content`
```sql
id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4()
domain_id               UUID REFERENCES domains(id) ON DELETE CASCADE
source_content_id       UUID REFERENCES website_content(id) ON DELETE CASCADE
url                     TEXT NOT NULL
content_type            TEXT NOT NULL
raw_content             TEXT
raw_html                TEXT
optimized_title         TEXT
optimized_summary       TEXT
optimized_content       TEXT
key_points              JSONB DEFAULT '[]'::jsonb
topics                  JSONB DEFAULT '[]'::jsonb
meta_title              TEXT
meta_description        TEXT
keywords                TEXT[]
structured_data         JSONB DEFAULT '{}'::jsonb
readability_score       REAL
content_quality_score   REAL
seo_score               REAL
ai_model_used           TEXT
processing_version      TEXT
processing_tokens       INTEGER
processing_cost         DECIMAL(10,4)
processed_at            TIMESTAMPTZ
created_at              TIMESTAMPTZ DEFAULT NOW()
updated_at              TIMESTAMPTZ DEFAULT NOW()
```

#### `training_data`
```sql
id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE
domain_id           UUID REFERENCES domains(id) ON DELETE CASCADE
type                TEXT NOT NULL
input_text          TEXT NOT NULL
output_text         TEXT NOT NULL
metadata            JSONB DEFAULT '{}'::jsonb
status              TEXT DEFAULT 'pending'
created_at          TIMESTAMPTZ DEFAULT NOW()
updated_at          TIMESTAMPTZ DEFAULT NOW()
```

### Chat Tables

#### `conversations`
```sql
id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4()
customer_id         UUID REFERENCES customers(id) ON DELETE CASCADE
domain_id           UUID REFERENCES domains(id) ON DELETE CASCADE
session_id          TEXT
started_at          TIMESTAMPTZ DEFAULT NOW()
ended_at            TIMESTAMPTZ
metadata            JSONB DEFAULT '{}'::jsonb
created_at          TIMESTAMPTZ DEFAULT NOW()
```

#### `messages`
```sql
id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4()
conversation_id     UUID REFERENCES conversations(id) ON DELETE CASCADE
role                TEXT NOT NULL  -- 'user', 'assistant', 'system'
content             TEXT NOT NULL
metadata            JSONB DEFAULT '{}'::jsonb
created_at          TIMESTAMPTZ DEFAULT NOW()
```

## Foreign Key Relationships

### Relationship Map
```
auth.users
    ├── customers (via auth_user_id)
    ├── domains (via user_id)
    └── training_data (via user_id)

customers
    ├── customer_configs (via customer_id)
    └── conversations (via customer_id)

domains
    ├── scraped_pages (via domain_id)
    ├── website_content (via domain_id)
    ├── structured_extractions (via domain_id)
    ├── content_refresh_jobs (via domain_id)
    ├── ai_optimized_content (via domain_id)
    ├── content_hashes (via domain_id)
    ├── page_content_references (via domain_id)
    ├── training_data (via domain_id)
    └── conversations (via domain_id)

scraped_pages
    └── page_embeddings (via page_id)

website_content
    └── ai_optimized_content (via source_content_id)

conversations
    └── messages (via conversation_id)
```

**Total**: 15 foreign key relationships with CASCADE deletion

## Indexes

### Performance Indexes (33+)

#### Primary Lookup Indexes
- `idx_scraped_pages_url` - URL lookups
- `idx_scraped_pages_domain` - Domain filtering
- `idx_website_content_url` - Content URL lookups
- `idx_customer_configs_domain` - Config by domain

#### Vector Search Indexes (IVFFlat)
- `idx_page_embeddings_vector` - Semantic search on page embeddings

#### Time-based Indexes
- `idx_scraped_pages_last_scraped` - Recent scraping activity
- `idx_conversations_created_at` - Recent conversations
- `idx_messages_created_at` - Recent messages

#### JSONB Indexes (GIN)
- `idx_scraped_pages_metadata_gin` - Metadata searches
- `idx_page_embeddings_metadata_gin` - Embedding metadata

#### Composite Indexes
- `idx_scraped_pages_domain_scraped` - Domain + time queries
- `idx_messages_conversation_created` - Conversation messages by time
- `idx_training_data_customer_type` - Customer training data by type

#### Partial Indexes
- `idx_scraped_pages_active` - Recently active pages (last 7 days)
- `idx_customer_configs_active_woo` - WooCommerce-enabled domains

## Key Features

### Security & Privacy
- **Row Level Security (RLS)**: Enabled on all tables
- **Encryption**: AES-256 for all credentials
- **Multi-tenancy**: Domain-based isolation
- **Audit Trail**: Access logging and privacy request tracking
- **GDPR/CCPA**: Privacy-compliant data handling

### AI Capabilities
- **Vector Embeddings**: 1536-dimensional OpenAI embeddings
- **Semantic Search**: Hybrid search with pgvector
- **Content Optimization**: AI-enhanced content with quality scoring
- **Deduplication**: Content hash tracking
- **Training Data**: Domain-specific AI customization

### Performance Optimizations
- **Comprehensive Indexing**: 33+ indexes for all query patterns
- **Vector Similarity**: IVFFlat indexes for fast semantic search
- **Partial Indexes**: For frequently accessed recent data
- **JSONB Optimization**: GIN indexes for metadata queries
- **Materialized Views**: For complex aggregations

### Data Integrity
- **Cascading Deletes**: Automatic cleanup via foreign keys
- **Updated Timestamps**: Automatic triggers on all tables
- **Content Hashing**: Change detection and deduplication
- **Job Tracking**: Background process monitoring

## Usage Guidelines

### Naming Conventions
- **Tables**: Lowercase with underscores (e.g., `customer_configs`)
- **Columns**: Lowercase with underscores (e.g., `created_at`)
- **Foreign Keys**: `[referenced_table]_id` pattern
- **Indexes**: `idx_[table]_[column(s)]` pattern

### Common Queries

```sql
-- Get customer configuration by domain
SELECT * FROM customer_configs WHERE domain = 'example.com';

-- Find similar content using embeddings
SELECT * FROM search_embeddings('query text', 'domain.com', 10);

-- Get recent conversations for a customer
SELECT * FROM conversations 
WHERE customer_id = ? 
ORDER BY created_at DESC 
LIMIT 10;

-- Find stale content needing refresh
SELECT * FROM get_stale_content('domain.com', INTERVAL '7 days');
```

### Best Practices
1. Always use domain_id for multi-tenant queries
2. Leverage vector indexes for semantic search
3. Use partial indexes for time-based queries
4. Include metadata in JSONB for flexibility
5. Monitor index usage with provided views

---

**Note**: This document should be updated whenever schema changes are made. Always refer to this document to ensure correct table and column names in your code.