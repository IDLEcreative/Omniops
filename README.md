**Last Updated:** 2025-10-24
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

## 🚀 Quick Start

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
- Multi-language support (40+ languages)
- Hallucination prevention safeguards
- **→ Learn more:** [docs/CHAT_SYSTEM_DOCUMENTATION.md](docs/CHAT_SYSTEM_DOCUMENTATION.md)

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
- [Configuration Guide](docs/CONFIGURATION.md)
- [Environment Variables](docs/ENVIRONMENT.md)

### Architecture & Design
- [System Architecture](docs/ARCHITECTURE.md)
- [Database Schema](docs/SUPABASE_SCHEMA.md)
- [Search Architecture](docs/SEARCH_ARCHITECTURE.md)
- [Performance Optimization](docs/PERFORMANCE_OPTIMIZATION.md)

### API Reference
- [Chat API](docs/api/CHAT_API.md)
- [Scraping API](docs/SCRAPING_API.md)
- [WooCommerce API](docs/woocommerce/WOOCOMMERCE_DEVELOPER_REFERENCE.md)
- [Privacy APIs](docs/api/PRIVACY_API.md)

### Development
- [Developer Guide](docs/DEVELOPMENT.md)
- [Component Library](components/README.md)
- [Testing Guide](docs/TESTING.md)
- [Database Cleanup](docs/DATABASE_CLEANUP.md)

### Deployment
- [Production Deployment](docs/PRODUCTION-DEPLOYMENT.md)
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

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # TypeScript checking
npm test               # Run all tests
npm run test:watch     # Watch mode testing
npm run test:coverage  # Coverage report

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

**→ Complete development guide:** [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)

---

## 🐳 Deployment

### Deployment Options

**Vercel (Recommended)**
- One-click deployment
- Automatic HTTPS and CDN
- Environment variable management
- **→ Guide:** [docs/PRODUCTION-DEPLOYMENT.md](docs/PRODUCTION-DEPLOYMENT.md)

**Docker**
- Full containerization
- Production-ready multi-stage builds
- Redis included in stack
- **→ Guide:** [docs/setup/DOCKER_README.md](docs/setup/DOCKER_README.md)

**Self-Hosted**
- Complete control
- Custom infrastructure
- Manual scaling
- **→ Guide:** [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md)

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

**→ Contributing guide:** [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 💬 Support

### Get Help
- 📖 **Documentation:** [docs/README.md](docs/README.md)
- 🐛 **Issues:** [GitHub Issues](https://github.com/yourusername/omniops/issues)
- 💡 **Discussions:** [GitHub Discussions](https://github.com/yourusername/omniops/discussions)
- 📧 **Email:** support@omniops.com

### Troubleshooting
- Check [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
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
