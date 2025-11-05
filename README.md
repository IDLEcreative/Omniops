**Last Updated:** 2025-10-31
**Verified Accurate For:** v0.1.0

# OmniOps AI Customer Service Platform

A modern, AI-powered customer service platform providing embeddable chat widgets for businesses. Built with Next.js 15, React 19, and TypeScript.

## What is OmniOps?

OmniOps is a multi-tenant, brand-agnostic AI customer service platform that combines intelligent chat, web scraping, and e-commerce integration to provide contextual customer support. The system learns from your website content and integrates with your e-commerce platform to deliver accurate, real-time responses.

**Key Capabilities:**
- 🤖 AI-powered chat with GPT-4 and Retrieval-Augmented Generation (RAG)
- 🛒 Deep WooCommerce and Shopify integration (orders, inventory, customer verification)
- 🌐 Intelligent web scraping and semantic search with vector embeddings
- 🔒 GDPR/CCPA compliant with privacy-first architecture
- 🏢 Multi-tenant design with domain-based isolation
- 🌍 Native support for 40+ languages

**Why OmniOps?**
- Reduces support workload by handling common inquiries automatically
- Provides instant, 24/7 customer support across languages
- Maintains context across conversations with RAG-powered responses
- Integrates seamlessly with existing e-commerce infrastructure

---

## 💬 Widget Installation (For Customers)

Install the OmniOps chat widget on your website in under 60 seconds with just 7 lines of code.

### Minimal Installation

```html
<!-- Add before closing </body> tag -->
<script>
window.ChatWidgetConfig = {
  "serverUrl": "https://omniops.co.uk"
};
</script>
<script src="https://omniops.co.uk/embed.js" async></script>
```

**That's it!** All configuration (appearance, behavior, features) loads dynamically from your dashboard.

### Why This Approach?

Following SaaS industry standards (like Intercom, Drift, Segment):
- ✅ **Install once, never update** - Make changes via dashboard
- ✅ **7 lines instead of 50+** - Minimal integration code
- ✅ **Instant updates** - Configuration changes apply immediately
- ✅ **Zero maintenance** - No code changes needed for customization

### Dashboard Configuration

After installation, customize everything via dashboard:
- 🎨 **Appearance** - Colors, position, welcome message
- ⚙️ **Behavior** - Auto-open, timing, conversation persistence
- 🛠️ **Features** - Web scraping, WooCommerce integration, FAQs
- 🌍 **Language** - 40+ languages supported

Changes apply instantly without updating your website code.

**→ Installation guide:** Go to Dashboard → Installation → Copy Code

---

## 🚀 Development Quick Start

### Prerequisites
- Node.js 18+
- Redis (for job queue)
- OpenAI API key
- Supabase account

### Installation

```bash
# 1. Clone and install
git clone <repository-url>
cd omniops
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 3. Start Redis
docker-compose -f docker-compose.dev.yml up redis -d

# 4. Run development server
npm run dev
```

### Verify Setup

1. Open http://localhost:3000
2. Test the chat widget at http://localhost:3000/embed
3. Check health endpoint: http://localhost:3000/api/health

**→ Complete setup guide:** [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)

---

## 📊 Quality Metrics

### Test Coverage
- **Total Tests:** 1,048+ across 67 test files
- **Test Code:** 23,677 lines of code
- **Coverage Target:** 80%+
- **Categories:**
  - Component Tests: 138 tests
  - Hook Tests: 102 tests
  - API Tests: 300+ tests
  - Integration Tests: 100+ tests
  - Business Logic: 400+ tests

### Code Quality
- TypeScript strict mode enabled
- ESLint with strict rules
- 100% type coverage
- Zero tolerance for `any` types in new code
- Comprehensive error handling

**→ Full testing guide:** [docs/04-DEVELOPMENT/testing/TESTING_GUIDE.md](docs/04-DEVELOPMENT/testing/TESTING_GUIDE.md)

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI components with Server Components
- **TypeScript 5** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Supabase** - PostgreSQL database with pgvector
- **Redis** - Job queue and caching
- **OpenAI GPT-4** - Conversational AI
- **Crawlee + Playwright** - Web scraping

### Infrastructure
- **Docker** - Containerization
- **Vercel** - Deployment platform (recommended)
- **Supabase** - Managed PostgreSQL with vector search

**Why these technologies?**
- Next.js enables full-stack TypeScript with excellent DX
- Supabase provides vector search critical for RAG
- Redis handles async job processing at scale
- OpenAI delivers industry-leading AI capabilities

**→ Detailed architecture:** [docs/01-ARCHITECTURE/](docs/01-ARCHITECTURE/)
**→ Database schema:** [docs/01-ARCHITECTURE/database-schema.md](docs/01-ARCHITECTURE/database-schema.md)

---

## ✨ Key Features

### 🤖 AI Chat with RAG
Intelligent conversational AI powered by OpenAI GPT-4 with semantic search across your content.
- Context-aware responses using vector embeddings
- Advanced conversation context tracking (86% accuracy)
- Multi-language support (40+ languages)
- Hallucination prevention safeguards
- **→ Learn more:** [docs/CHAT_SYSTEM_DOCUMENTATION.md](docs/CHAT_SYSTEM_DOCUMENTATION.md)

### 🧠 Advanced Conversation Context
Sophisticated metadata tracking for human-like conversation understanding.
- **Correction Tracking** - Remembers when users correct themselves ("I meant X not Y")
- **List Navigation** - Users can reference "item 2" or "the first one" from numbered lists (100% accuracy)
- **Pronoun Resolution** - Understands "it", "that", and contextual references (83% accuracy)
- **Context Awareness** - Maintains conversation state across multiple turns
- **Session Persistence** - Conversations automatically saved and restored across page refreshes and navigation
- **Performance** - <15ms overhead per message
- **→ Learn more:** [docs/CONVERSATION_ACCURACY_IMPROVEMENTS.md](docs/CONVERSATION_ACCURACY_IMPROVEMENTS.md)

### 🛒 WooCommerce Integration
Deep integration for e-commerce operations and customer support.
- Real-time order tracking and status updates
- Customer email verification
- Inventory and stock level awareness
- Abandoned cart recovery
- **→ Learn more:** [docs/woocommerce/WOOCOMMERCE_INTEGRATION_DOCUMENTATION.md](docs/woocommerce/WOOCOMMERCE_INTEGRATION_DOCUMENTATION.md)

### 🏪 Shopify Integration
Comprehensive Shopify Admin API integration for multi-platform support.
- Product catalog and inventory sync
- Order management and tracking
- Customer data integration
- **→ Learn more:** [lib/shopify-api.ts](lib/shopify-api.ts)

### 🌐 Web Scraping & Content Intelligence
Automated website indexing with semantic search capabilities.
- Intelligent crawling with Crawlee + Playwright
- Content extraction using Mozilla Readability
- Vector embeddings for semantic search
- Duplicate detection and deduplication
- **→ Learn more:** [docs/WEB_SCRAPING.md](docs/WEB_SCRAPING.md)

### 🔒 Privacy & Compliance
GDPR/CCPA compliant with comprehensive data protection.
- User data export (JSON format)
- Right to deletion (complete data removal)
- Configurable retention policies
- Encrypted credential storage (AES-256)
- **→ Learn more:** [docs/PRIVACY_COMPLIANCE.md](docs/PRIVACY_COMPLIANCE.md)

### 🏢 Multi-Tenant Architecture
Enterprise-grade scalability with domain-based isolation.
- Complete tenant isolation
- Encrypted credential storage
- Rate limiting per domain
- Horizontal scaling support
- **→ Learn more:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 📚 Documentation

### Getting Started
- [Installation & Setup](docs/GETTING_STARTED.md)
- [Developer Guide](docs/00-GETTING-STARTED/for-developers.md)
- [DevOps Guide](docs/00-GETTING-STARTED/for-devops.md)

### Architecture & Design
- [System Architecture](docs/ARCHITECTURE.md)
- [Database Schema](docs/01-ARCHITECTURE/database-schema.md)
- [Search Architecture](docs/01-ARCHITECTURE/search-architecture.md)
- [Performance Optimization](docs/01-ARCHITECTURE/performance-optimization.md)

### API Reference
- [Chat API](docs/api/CHAT_API.md)
- [Scraping API](docs/SCRAPING_API.md)
- [WooCommerce API](docs/WOOCOMMERCE_DEVELOPER_REFERENCE.md)
- [Privacy APIs](docs/api/PRIVACY_API.md)

### Development
- [Testing Guide](docs/04-DEVELOPMENT/testing/TESTING_GUIDE.md) - Comprehensive testing patterns and best practices
- [Test Suite Overview](__tests__/README.md) - Test directory structure and statistics
- [Code Patterns](docs/04-DEVELOPMENT/code-patterns/)
- [Component Library](components/README.md)
- [Database Cleanup](docs/DATABASE_CLEANUP.md)

### Deployment
- [Production Deployment](docs/PRODUCTION-DEPLOYMENT.md)
- [Production Checklist](docs/05-DEPLOYMENT/production-checklist.md)
- [Docker Guide](docs/setup/DOCKER_README.md)
- [Monitoring & Telemetry](docs/MONITORING_SETUP_GUIDE.md)

### Feature Guides
- [WooCommerce Integration](docs/woocommerce/WOOCOMMERCE_INTEGRATION_DOCUMENTATION.md)
- [Web Scraping](docs/WEB_SCRAPING.md)
- [Hallucination Prevention](docs/HALLUCINATION_PREVENTION.md)
- [Privacy & GDPR](docs/PRIVACY_COMPLIANCE.md)

**📖 Full documentation index:** [docs/README.md](docs/README.md)

---

## 🔧 Development

### Common Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run build           # Build for production
npm run start           # Start production server

# Testing (1,048+ tests across 67 files)
npm test                  # Run unit tests
npm run test:watch        # Watch mode testing
npm run test:coverage     # Generate coverage report
npm run test:integration  # Run integration tests
npm run test:all          # Run all tests (unit + integration)

# Conversation Competency Tests
npx tsx scripts/tests/test-metadata-tracking.ts  # Test conversation accuracy (86%)

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # TypeScript checking

# Docker
docker-compose up -d                    # Start all services
docker-compose down                     # Stop services
docker-compose logs -f app              # View logs
DOCKER_BUILDKIT=1 docker-compose build  # Rebuild containers

# Database
npx tsx test-database-cleanup.ts stats  # View data stats
npx tsx test-database-cleanup.ts clean  # Clean scraped data

# Monitoring
npx tsx monitor-embeddings-health.ts check  # Health check
npx tsx optimize-chunk-sizes.ts analyze     # Analyze chunks
```

### Development Workflow

1. Start Redis: `docker-compose up redis -d`
2. Start dev server: `npm run dev`
3. Make changes (hot reload enabled)
4. Run tests: `npm test`
5. Check types: `npm run type-check`
6. Commit with conventional commits

**→ Complete development guide:** [docs/00-GETTING-STARTED/for-developers.md](docs/00-GETTING-STARTED/for-developers.md)

---

## 🐳 Deployment

### Deployment Options

**Vercel (Recommended)**
- One-click deployment
- Automatic HTTPS and CDN
- Environment variable management
- **→ Guide:** [docs/PRODUCTION-DEPLOYMENT.md](docs/PRODUCTION-DEPLOYMENT.md)

**Required Environment Variable:**
```bash
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```
This ensures the widget embed code uses your production domain instead of preview URLs.

**Docker**
- Full containerization
- Production-ready multi-stage builds
- Redis included in stack
- **→ Guide:** [docs/setup/DOCKER_README.md](docs/setup/DOCKER_README.md)

**Self-Hosted**
- Complete control
- Custom infrastructure
- Manual scaling
- **→ Guide:** [docs/05-DEPLOYMENT/runbooks.md](docs/05-DEPLOYMENT/runbooks.md)

### Quick Docker Deployment

```bash
# Build production containers
DOCKER_BUILDKIT=1 docker-compose build

# Start production stack
docker-compose up -d

# Monitor health
docker-compose ps
curl http://localhost:3000/api/health
```

**→ Complete deployment guide:** [docs/PRODUCTION-DEPLOYMENT.md](docs/PRODUCTION-DEPLOYMENT.md)

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test: `npm test`
4. Ensure types: `npm run type-check`
5. Lint code: `npm run lint`
6. Commit: `git commit -m 'feat: add amazing feature'`
7. Push: `git push origin feature/amazing-feature`
8. Open Pull Request

### Code Standards
- TypeScript strict mode required
- All tests must pass
- Follow existing patterns
- Use conventional commits
- Document new features

### Reporting Issues

Found a bug or have a feature request?

**Internal Contributors:**
- Add issues directly to [docs/ISSUES.md](docs/ISSUES.md)
- Follow the issue template (severity, location, description, impact)
- See 20 tracked issues: 2 critical, 5 high, 7 medium, 6 low

**External Contributors:**
- Open a [GitHub Issue](https://github.com/yourusername/omniops/issues)
- Provide steps to reproduce
- Include error messages and environment details

**→ Contributing guide:** [docs/04-DEVELOPMENT/code-patterns/](docs/04-DEVELOPMENT/code-patterns/)

---

## 💬 Support

### Get Help
- 📖 **Documentation:** [docs/README.md](docs/README.md)
- 🐛 **Issues:** [GitHub Issues](https://github.com/yourusername/omniops/issues)
- 💡 **Discussions:** [GitHub Discussions](https://github.com/yourusername/omniops/discussions)
- 📧 **Email:** support@omniops.com

### Troubleshooting
- Check [docs/06-TROUBLESHOOTING/README.md](docs/06-TROUBLESHOOTING/README.md)
- Search existing issues
- Review error logs in Docker
- Verify environment variables

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with modern web technologies:
- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Supabase](https://supabase.com/) - Database and auth
- [OpenAI](https://openai.com/) - AI capabilities
- [Redis](https://redis.io/) - Job queue
- [Docker](https://www.docker.com/) - Containerization

---

**Built with ❤️ by the OmniOps team**
