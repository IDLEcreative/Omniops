# Customer Service Agent

An AI-powered customer service chat widget that can be embedded on any website. Built with Next.js, OpenAI, and Supabase.

## 🚀 New: Owned Domains for 20x Faster Bot Training

Train your customer service bot on your own website up to 20x faster! See [Quick Start Guide](./docs/QUICK-START-OWNED-DOMAINS.md) or [Full Documentation](./docs/OWNED-DOMAINS-FEATURE.md).

## 🚀 Features

### Core Features
- **AI-Powered Chat**: Intelligent responses using OpenAI GPT-4
- **Instant Demo**: Single URL input to generate live preview in seconds
- **Hybrid Search**: Combines vector embeddings with real-time web search for accurate answers
- **Website Content Learning**: Automatically scrapes and indexes your website content
- **Content Auto-Refresh**: Keep your knowledge base up-to-date automatically
- **Structured Data Extraction**: Extract FAQs, products, and contact info from web pages
- **WooCommerce Full API Access**: Complete read/write access to all WooCommerce endpoints (products, orders, customers, refunds, shipping, taxes, and more)
- **Easy Embedding**: Simple script tag integration
- **Multi-tenant**: Support multiple customers with isolated configurations

### New in v2.1.0 
- **Owned Domains for 20x Faster Scraping**:
  - Configure your company's domains in Admin panel
  - Automatic detection and optimization
  - Up to 100+ pages/second scraping speed
  - 20 concurrent jobs with 20 browsers each
  - No rate limiting on your own sites
  - Perfect for training bots on large websites

### New in v3.0.0
- **Customer Verification System**:
  - Progressive verification (none/basic/full) for minimal friction
  - Automatic information extraction from messages
  - Secure access to order history and account details
  - GDPR-compliant audit logging
  - Data masking for sensitive information
  - Quick verification via name + order number
  - Full verification via email matching
  - See [Customer Verification Docs](./docs/CUSTOMER_VERIFICATION_SYSTEM.md)

### New in v2.0.0
- **Full WooCommerce API Integration**:
  - Complete access to all WooCommerce REST API v3 endpoints
  - Order management and refund processing
  - Customer data management with verification
  - Inventory tracking and updates
  - Coupon and tax management
  - Shipping configuration
  - Real-time webhooks support
  - Batch operations for bulk updates
  - **Abandoned Cart Tracking**: Monitor and recover incomplete purchases using pending/on-hold orders

### New in v1.1.0
- **Enhanced Privacy Controls**: 
  - 30-day configurable data retention
  - User opt-out toggle in widget footer
  - "Your data is never sold" trust signal
  - GDPR consent management
  - Data export and deletion tools
- **Improved User Experience**:
  - Simplified 2-minute setup with single URL input
  - Real-time scraping progress indicators
  - Theme presets (Light/Dark/Brand)
  - WCAG AA accessibility compliance
  - Live widget preview
- **Advanced Configuration**:
  - Contrast warnings for brand colors
  - Framework-specific embed code (coming soon)
  - Sync schedules for content updates
  - Failed page error logging
- **Admin Dashboard**:
  - Unified navigation sidebar
  - Privacy & Security settings
  - Analytics dashboard (coming soon)
  - Conversation monitoring (coming soon)

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Web Scraping](#web-scraping)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)

## 🏃 Quick Start

### Try the Demo (No Setup Required!)

1. Visit [http://localhost:3000](http://localhost:3000)
2. Enter your website URL
3. Click "Generate Demo"
4. See your AI assistant in action instantly!

### Enable Customer Verification (WooCommerce)

For customer service with order lookup and account access:
1. Configure WooCommerce credentials in `.env.local`
2. Run database setup: [Quick Start Guide](./docs/QUICK_START_CUSTOMER_VERIFICATION.md)
3. Test with: `curl http://localhost:3000/api/woocommerce/customer-test?test=all`

### Full Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/customer-service-agent.git
   cd customer-service-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Set up the database:
   ```bash
   # Run the migrations in order
   psql -U postgres -d your_database < supabase/migrations/001_initial_migration.sql
   psql -U postgres -d your_database < supabase/migrations/002_add_auth.sql
   psql -U postgres -d your_database < supabase/migrations/003_update_customer_configs.sql
   psql -U postgres -d your_database < supabase/migrations/004_add_owned_domains.sql
   # Additional migrations if needed
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- PostgreSQL with pgvector extension
- Supabase account
- OpenAI API key
- Crawlee and Playwright (for web scraping)

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Web scraping uses Crawlee and Playwright (no API key needed)

# Encryption (32 characters)
ENCRYPTION_KEY=your_32_character_encryption_key

# WooCommerce (optional)
WOOCOMMERCE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=your_consumer_key
WOOCOMMERCE_CONSUMER_SECRET=your_consumer_secret

# Cron Security (optional, for automated refresh)
CRON_SECRET=your_cron_secret_key
```

## ⚙️ Configuration

### Widget Configuration

Customers can configure their widget through the admin panel (`/admin`):

- **Basic Settings**: Business name, welcome message
- **Features**: Enable/disable WooCommerce, website scraping
- **Appearance**: 
  - Theme presets (Light/Dark/Brand)
  - Custom colors with WCAG contrast warnings
  - Position (bottom-right, bottom-left, top-right, top-left)
  - Button text and welcome messages
  - Advanced CSS for developers
- **Privacy Controls**:
  - Data retention periods (7-365 days)
  - User rights (opt-out, data export, deletion)
  - GDPR/CCPA compliance settings
  - Encryption and security options
- **WooCommerce**: 
  - Full API access with read/write capabilities
  - Store credentials (encrypted)
  - Support for all endpoints (products, orders, customers, refunds, etc.)
  - Real-time webhooks integration
  - Multi-tenant configuration support
- **Content Management**: 
  - Scraping with progress indicators
  - Sync schedules (daily/weekly/monthly)
  - Failed page error logs

### Embedding the Widget

Add this script to any website:

```html
<!-- AI Chat Widget -->
<script>
window.ChatWidgetConfig = {
  // Optional: Configure privacy settings
  privacy: {
    allowOptOut: true,
    showPrivacyNotice: true,
    retentionDays: 30
  },
  // Optional: Customize appearance
  appearance: {
    position: 'bottom-right',
    primaryColor: '#4F46E5'
  }
};
</script>
<script src="https://your-domain.com/embed.js" async></script>
<!-- End AI Chat Widget -->
```

### Widget API

The widget exposes a global API for programmatic control:

```javascript
// Open/close the widget
ChatWidget.open();
ChatWidget.close();

// Send a message
ChatWidget.sendMessage('Hello!');

// Privacy controls
ChatWidget.privacy.optOut();      // Disable widget for user
ChatWidget.privacy.optIn();       // Re-enable widget
ChatWidget.privacy.clearData();   // Clear local storage
ChatWidget.privacy.getStatus();   // Get privacy preferences
```

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4, Embeddings API
- **Scraping**: Crawlee + Playwright (Mozilla Readability)
- **Job Queue**: Redis
- **E-commerce**: WooCommerce REST API

### Project Structure

```
customer-service-agent/
├── app/                    # Next.js app directory
│   ├── api/               # API endpoints
│   │   ├── chat/         # Chat endpoint
│   │   ├── scrape/       # Web scraping
│   │   ├── admin/        # Admin management
│   │   ├── gdpr/         # GDPR compliance
│   │   ├── woocommerce/  # E-commerce integration
│   │   └── demo/         # Demo generation
│   ├── admin/             # Admin interface
│   ├── dashboard/         # Customer dashboard
│   ├── chat/              # Chat interface
│   ├── embed/             # Embeddable widget
│   └── (routes)/          # Other pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── auth/             # Authentication
│   ├── chat/             # Chat components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   └── shared/           # Shared components
├── lib/                   # Core business logic
│   ├── supabase/         # Database clients
│   ├── auth/             # Auth utilities
│   ├── repositories/     # Data access layer
│   ├── services/         # Business services
│   ├── examples/         # Usage examples
│   ├── redis.ts          # Redis client & job manager
│   ├── config.ts         # Configuration schema
│   ├── crawler-config.ts # Web scraping with Crawlee
│   ├── content-extractor.ts  # Readability extraction
│   ├── embeddings.ts     # Vector embeddings
│   ├── encryption.ts     # Data encryption
│   ├── woocommerce*.ts   # E-commerce integration
│   └── rate-limit.ts     # Rate limiting
├── public/                # Static assets
│   └── embed.js          # Widget loader
├── types/                 # TypeScript definitions
│   ├── api/              # API types
│   ├── database/         # Database types
│   └── index.ts          # Common types
├── docs/                  # Documentation
│   ├── API/              # API documentation
│   ├── Architecture/     # System design
│   ├── Guides/           # How-to guides
│   └── README.md         # Doc index
├── __tests__/            # Test suite
│   ├── api/              # API tests
│   ├── app/              # Page tests
│   ├── lib/              # Unit tests
│   └── mocks/            # Test mocks
├── scripts/              # Utility scripts
├── supabase/             # Database migrations
├── hooks/                # React hooks
└── browser-automation/   # Experimental tools
```

### Database Schema

The application uses these main tables:

- `customer_configs` - Customer configuration and settings
- `scraped_pages` - Indexed website content
- `page_embeddings` - Vector embeddings for semantic search
- `website_content` - Unified content storage with change tracking
- `content_embeddings` - Enhanced embedding storage
- `structured_extractions` - Extracted FAQs, products, etc.
- `content_refresh_jobs` - Track refresh operations
- `conversations` - Chat conversations
- `messages` - Individual messages
- `support_tickets` - Support ticket submissions

## 📡 API Documentation

### Chat API

**POST** `/api/chat`

Send a message and receive an AI response.

```typescript
// Request
{
  "message": "Hello, I need help",
  "conversation_id": "uuid", // Optional
  "session_id": "string",
  "domain": "example.com", // Optional
  "config": {
    "features": {
      "woocommerce": { "enabled": true },
      "websiteScraping": { "enabled": true }
    }
  }
}

// Response
{
  "message": "AI response text",
  "conversation_id": "uuid",
  "sources": [
    {
      "url": "https://example.com/page",
      "title": "Page Title",
      "relevance": 0.85
    }
  ]
}
```

### Scraping API

**POST** `/api/scrape`

Scrape and index website content. See [Web Scraping Documentation](#web-scraping) for detailed usage.

```typescript
// Request
{
  "url": "https://example.com",
  "crawl": true, // false for single page
  "max_pages": 50 // -1 for unlimited
}

// Response (Single Page)
{
  "status": "completed",
  "pages_scraped": 1,
  "message": "Successfully indexed page"
}

// Response (Crawl Job)
{
  "status": "started",
  "job_id": "crawl_123456_abc",
  "message": "Started crawling website"
}
```

**GET** `/api/scrape?job_id={id}`

Check crawl job status.

```typescript
// Response
{
  "jobId": "crawl_123456_abc",
  "status": "processing", // "completed" | "failed"
  "progress": 45,
  "total": 150,
  "completed": 68,
  "failed": 2,
  "skipped": 5
}
```

### Search API

**POST** `/api/search`

Hybrid search combining embeddings and live web results.

```typescript
// Request
{
  "query": "search terms",
  "domainId": "uuid",
  "searchType": "hybrid", // "embeddings" | "web" | "hybrid"
  "limit": 5
}
```

### Extract API

**POST** `/api/extract`

Extract structured data from web pages.

```typescript
// Request
{
  "url": "https://example.com/faq",
  "domainId": "uuid",
  "extractType": "faq" // "faq" | "products" | "contact" | "custom"
}
```

### Refresh API

**POST** `/api/refresh`

Refresh content to keep embeddings current.

```typescript
// Request
{
  "domainId": "uuid",
  "refreshType": "incremental", // "full" | "incremental" | "discover"
  "options": {
    "maxPages": 50
  }
}
```

### Admin APIs

- **GET/POST** `/api/admin/config` - Manage customer configuration
- **POST** `/api/admin/test-connection` - Test WooCommerce connection
- **GET** `/api/cron/refresh` - Automated content refresh endpoint

### Privacy APIs

**POST** `/api/privacy/delete`

Delete all user data (GDPR right to erasure).

```typescript
// Request
{
  "userId": "session_123_abc"
}

// Response
{
  "success": true,
  "message": "All user data has been deleted successfully"
}
```

**GET** `/privacy/export`

Export user data (GDPR right to data portability).

```typescript
// Query params
?user=session_123_abc

// Response: JSON file download
{
  "export_date": "2024-01-01T00:00:00Z",
  "user_id": "session_123_abc",
  "conversations": [...],
  "messages": [...]
}
```

### Demo API

**POST** `/api/demo`

Generate instant demo from website URL.

```typescript
// Request
{
  "url": "https://example.com"
}

// Response
{
  "demoId": "demo_1234_abc",
  "widgetUrl": "/demo/demo_1234_abc",
  "expiresIn": 3600
}
```

[View full API documentation →](docs/API.md)

## 🕷️ Web Scraping

The application uses an advanced web scraping system built with Crawlee and Mozilla Readability for content extraction.

### Key Features

- **Full-site crawling** with configurable limits (including unlimited)
- **Smart content extraction** using Mozilla Readability
- **Content deduplication** to avoid redundant processing
- **Adaptive rate limiting** to respect server resources
- **Redis-backed job management** for scalability
- **Source attribution** for AI responses

### Quick Start

```bash
# Start Redis (required for crawling)
docker-compose up -d

# Single page scraping
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/page"}'

# Full website crawling
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "crawl": true, "max_pages": -1}'
```

### Documentation

#### Web Scraping
- [Web Scraping Guide](docs/WEB_SCRAPING.md) - Complete usage guide
- [Scraping API Reference](docs/SCRAPING_API.md) - Detailed API documentation
- [Architecture Overview](docs/SCRAPING_ARCHITECTURE.md) - System design and flow

#### WooCommerce Integration
- [WooCommerce Full API Documentation](docs/WOOCOMMERCE_FULL_API.md) - Comprehensive API documentation
- [WooCommerce Integration Guide](docs/WOOCOMMERCE_INTEGRATION_GUIDE.md) - Quick setup guide
- [WooCommerce Developer Reference](docs/WOOCOMMERCE_DEVELOPER_REFERENCE.md) - Method reference and examples
- [WooCommerce API Endpoints](docs/woocommerce-api-endpoints.md) - Complete endpoint list
- [Abandoned Cart Tracking](docs/WOOCOMMERCE_ABANDONED_CARTS.md) - Monitor and recover incomplete purchases

## 🛠️ Development

### Running Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Code Style

The project uses:
- ESLint for linting
- Prettier for formatting
- TypeScript for type safety

### Project Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm test            # Run all tests
npm run test:unit   # Run unit tests only
npm run test:watch  # Run tests in watch mode
```

## 🧪 Testing

The project includes comprehensive test coverage:

- **Unit Tests**: Business logic and utilities
- **Integration Tests**: API routes and database operations
- **Component Tests**: React components

Run tests with:

```bash
npm test                    # Run all tests
npm run test:coverage      # Generate coverage report
npm run test:watch         # Watch mode
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Self-Hosting

1. Build the application:
   ```bash
   npm run build
   ```

2. Set up PostgreSQL with pgvector
3. Run database migrations
4. Start the server:
   ```bash
   npm start
   ```

### Production Checklist

- [ ] Set strong encryption key
- [ ] Enable Supabase RLS policies
- [ ] Configure CORS for your domains
- [ ] Set up monitoring (e.g., Sentry)
- [ ] Configure rate limiting
- [ ] Enable HTTPS
- [ ] Set up backups

## 🔒 Security

### Security Features

- **Encrypted Credentials**: Customer WooCommerce credentials are encrypted
- **Row Level Security**: Database isolation between customers
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: All inputs are validated with Zod
- **CORS Protection**: Restrict widget usage to allowed domains
- **Privacy Compliance**:
  - GDPR & CCPA compliant
  - Configurable data retention (7-365 days)
  - User opt-out capabilities
  - Data export and deletion tools
  - IP anonymization option
  - Automatic data cleanup
- **Data Protection**:
  - AES-256 encryption at rest
  - TLS 1.3 for data in transit
  - Sensitive data masking
  - Consent management

### Best Practices

1. Always use environment variables for secrets
2. Enable Supabase RLS policies in production
3. Regularly update dependencies
4. Monitor for suspicious activity
5. Implement proper error handling

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- AI powered by [OpenAI](https://openai.com/)
- Database by [Supabase](https://supabase.com/)
- Web scraping by Crawlee and Playwright

## 📞 Support

- Documentation: [docs/](docs/)
- Issues: [GitHub Issues](https://github.com/yourusername/customer-service-agent/issues)
- Email: support@example.com

---

Made with ❤️ by Your Team