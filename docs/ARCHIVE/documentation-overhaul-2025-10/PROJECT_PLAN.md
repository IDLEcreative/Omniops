# Customer Service Chat System - Project Plan

## 🎯 Project Overview
An AI-powered customer service chat system that integrates with WordPress/WooCommerce sites, providing personalized support based on customer context, order history, and shopping cart data.

## ✅ Completed Features

### 1. Core Chat Infrastructure
- [x] Next.js 15 application with TypeScript
- [x] OpenAI GPT-4 integration for intelligent responses
- [x] Real-time chat interface with embeddable widget
- [x] Supabase database integration for persistent conversations
- [x] Graceful fallback to in-memory storage when database unavailable

### 2. WordPress/WooCommerce Integration
- [x] WordPress plugin (`wordpress-plugin/customer-service-chat.php`)
- [x] Rich context passing (user data, cart, orders, page context)
- [x] Personalized greetings based on customer status (VIP, regular, new)
- [x] WooCommerce API integration for product/order lookups
- [x] Dynamic context updates via AJAX

### 3. Database Structure
- [x] `conversations` table for chat sessions
- [x] `messages` table for individual messages
- [x] Metadata storage for WordPress context
- [x] Automatic session management

### 4. Security & Privacy
- [x] Environment-based configuration
- [x] Encrypted credential storage (AES-256)
- [x] Service role authentication for database
- [x] CORS and origin verification

### 5. Analytics Dashboard & Telemetry (COMPLETED - January 2025)
- [x] **Real-time Dashboard API (6 Endpoints)**
  - [x] `/api/dashboard/conversations` - Chat session metrics with period comparison
  - [x] `/api/dashboard/analytics` - Performance metrics, satisfaction scores, query analysis
  - [x] `/api/dashboard/scraped` - Content indexing statistics and domain coverage
  - [x] `/api/dashboard/woocommerce` - E-commerce integration status and product metrics
  - [x] `/api/dashboard/missing-products` - Customer demand intelligence for inventory
  - [x] `/api/dashboard/telemetry` - Cost tracking, token usage, and AI model analytics
- [x] **Comprehensive Telemetry System**
  - [x] Real-time cost tracking with projections (daily/monthly)
  - [x] Token usage monitoring (input/output/total)
  - [x] Model usage breakdown with cost analysis
  - [x] Performance metrics (response times, search counts)
  - [x] Live session monitoring with active cost tracking
  - [x] Hourly trend analysis for cost optimization
  - [x] Domain-specific usage analytics
- [x] **Chat System Enhancements**
  - [x] Mandatory product count display ("We have 24 items, showing 5")
  - [x] Conversation context retention for follow-ups
  - [x] Improved handling of vague references ("that one", "this product")
  - [x] Topic switching with memory preservation
- [x] **Documentation**
  - [x] Complete API documentation in `docs/DASHBOARD_API.md`
  - [x] All endpoints with request/response examples
  - [x] Error handling and fallback strategies documented
- [x] **Operational Runbooks & Blueprint**
  - [x] Updated integration blueprint with analytics/GDPR implementation log
  - [x] Nightly telemetry & GDPR runbooks with Slack alert setup and manual validation steps
  - [x] GDPR audit runbook covering retention cron + CSV export workflow

## 🚀 Next Steps - Priority Order

### Phase 1: Production Readiness (Week 1-2)

#### 1.1 CI/CD & Monitoring Infrastructure (COMPLETED - January 2025)
- [x] **GitHub Actions Workflow Setup**
  - [x] Created `.github/workflows/nightly-telemetry-gdpr.yml`
  - [x] Nightly telemetry rollup validation
  - [x] GDPR audit health monitoring
  - [x] Playwright smoke tests for dashboard validation
  - [x] Automatic Slack notifications on failure
- [x] **TypeScript & Code Quality**
  - [x] Fixed all TypeScript errors (`npx tsc --noEmit` passes)
  - [x] Added missing `@types/pg` dependency
  - [x] Fixed Supabase query compatibility issues
  - [x] Resolved module export/import issues
- [x] **Alerting & Notifications**
  - [x] Slack webhook integration (`lib/alerts/notify.ts`)
  - [x] Failure notification system (`scripts/notify-monitor-failure.ts`)
  - [x] Context-aware alerts with GitHub run URLs
- [x] **GDPR & Privacy Compliance**
  - [x] Two-year automatic retention for audit logs
  - [x] Privacy dashboard with filters and CSV export
  - [x] Domain and actor-based audit filtering
  - [x] Date range selection for compliance reports
- [x] **Documentation & Validation**
  - [x] Blueprint synced with telemetry/GDPR automation
  - [x] Runbook instructions for GitHub secrets and manual workflow dry run
- [ ] **GitHub Secrets Configuration (ACTION REQUIRED)**
  - [ ] Add `DATABASE_URL` secret (get from Supabase Dashboard)
  - [ ] Add `SUPABASE_URL` secret (from `.env.local` line 28)
  - [ ] Add `SUPABASE_SERVICE_ROLE_KEY` secret (from `.env.local` line 4)
  - [ ] Add `MONITOR_ALERT_WEBHOOK_URL` secret (create Slack webhook or use placeholder)
  - [ ] Run manual workflow test to verify pipeline
- [x] **Audit Detail UX Enhancement (COMPLETED - January 2025)**
  - [x] Add per-entry modal for viewing full JSON payloads
  - [x] Implement per-row download functionality
  - [x] Add tabbed interface for summary/raw data/future payload
  - [x] Clickable table rows with hover effects
  - [x] Copy to clipboard functionality
  - [x] Compliance notes with retention information

#### 1.2 WordPress Plugin Enhancement
- [ ] Update session ID generation to use UUIDs
  ```php
  'session_id' => wp_generate_uuid4()
  ```
- [ ] Add plugin settings page for API configuration
- [ ] Implement webhook for order status updates
- [ ] Add customer service agent notification system

#### 1.3 Database Optimization
- [ ] Add proper indexes for performance
- [ ] Implement conversation archiving (30-day retention)
- [ ] Set up database backups
- [ ] Create analytics views for reporting

#### 1.4 Error Handling & Monitoring
- [ ] Add Sentry or similar error tracking
- [ ] Implement health check endpoint
- [ ] Add response time monitoring
- [ ] Set up alerting for failures

### Phase 2: Deployment (Week 2-3)

#### 2.1 Production Deployment
- [ ] Deploy to Vercel/Railway/AWS
- [ ] Configure production environment variables
- [ ] Set up custom domain with SSL
- [ ] Configure CDN for static assets

#### 2.2 Testing & QA
- [ ] Test with real WooCommerce store
- [ ] Load testing (target: 1000 concurrent chats)
- [ ] Security audit and penetration testing
- [ ] Cross-browser compatibility testing

#### 2.3 Documentation
- [ ] API documentation
- [ ] WordPress plugin installation guide
- [ ] Troubleshooting guide
- [ ] Video tutorials for setup

### Phase 3: Enhanced Features (Week 3-4)

#### 3.1 Admin Dashboard
- [ ] Conversation history viewer
- [ ] Export chat logs to CSV/PDF
- [ ] Customer satisfaction metrics
- [ ] Common questions analytics
- [ ] Agent performance tracking

#### 3.2 Advanced Chat Features
- [ ] Typing indicators
- [ ] File upload support (receipts, screenshots)
- [ ] Quick reply buttons for FAQs
- [ ] Proactive chat triggers based on behavior
- [ ] Multi-language support (i18n)

#### 3.3 AI Enhancements
- [ ] Intent recognition for better routing
- [ ] Sentiment analysis for escalation
- [ ] Product recommendations based on history
- [ ] Automated FAQ generation from chat history

#### 3.4 Smart Periodic Scraper (High Priority - 93% Cost Reduction)
- [ ] **Phase 1: Core Implementation (Week 1-2)**
  - [ ] Database schema implementation (5 core tables)
  - [ ] Change detection engine (HTTP headers, content hashing)
  - [ ] Incremental scraping logic (15 min vs 7 hours)
  - [ ] Job queue management with Redis
  - [ ] Basic UI controls in training dashboard
- [ ] **Phase 2: Scheduling System (Week 3)**
  - [ ] Cron-based scheduling service
  - [ ] Manual, Scheduled, and Smart modes
  - [ ] Page-type specific schedules (products, news, static)
  - [ ] Real-time progress monitoring via WebSocket
  - [ ] Notification system for changes detected
- [ ] **Phase 3: Analytics & Optimization (Week 4)**
  - [ ] Change pattern analysis and heatmaps
  - [ ] Performance metrics dashboard
  - [ ] Smart mode AI predictions
  - [ ] Cost savings calculator
  - [ ] Auto-optimization recommendations
- [ ] **Documentation**: See `/docs/SMART_PERIODIC_SCRAPER_*.md`
  - Implementation Plan (1,138 lines)
  - Migration Scripts (PostgreSQL)
  - API Examples (Complete request/response)
  - Deployment Checklist

#### 3.5 Intelligent Site Type Detection & Domain-Specific Extraction
- [ ] **Phase 1: Automatic Site Type Detection (Week 1)**
  - [ ] Content pattern analyzer for industry detection
  - [ ] Domain name and meta tag analysis
  - [ ] Schema.org structured data extraction
  - [ ] E-commerce platform detection (WooCommerce, Shopify, etc.)
  - [ ] Confidence scoring system (0-100%)
  - [ ] Store detection results in customer_configs
- [ ] **Phase 2: Domain-Specific Extractors (Week 2)**
  - [ ] Automotive parts extractor (OEM numbers, compatibility, specs)
  - [ ] Fashion/apparel extractor (sizes, colors, materials)
  - [ ] Electronics extractor (technical specs, power ratings)
  - [ ] Food/restaurant extractor (nutrition, ingredients, allergens)
  - [ ] Services extractor (pricing tiers, packages, availability)
  - [ ] Generic fallback extractor for unknown types
- [ ] **Phase 3: Continuous Learning & Refinement (Week 3)**
  - [ ] Detection refinement with each scrape
  - [ ] Pattern learning from customer feedback
  - [ ] Manual override capability in admin panel
  - [ ] Multi-signal hybrid detection approach
  - [ ] Industry-specific search relevance tuning
- [ ] **Expected Benefits**:
  - 60-80% improvement in search relevance
  - Automatic optimization per customer domain
  - No manual configuration required
  - Industry-specific metadata extraction
  - Better entity recognition and product matching

#### 3.6 Domain-Isolated Synonym Expansion System (COMPLETED - January 2025)
- [x] **Phase 1: Database-Driven Synonym System**
  - [x] Created `domain_synonym_mappings` table for domain-specific synonyms
  - [x] Created `global_synonym_mappings` table for safe generic synonyms
  - [x] Implemented `get_domain_synonyms()` database function
  - [x] Built `learn_domain_synonym()` for learning from successful queries
  - [x] Domain isolation prevents cross-tenant contamination
- [x] **Phase 2: Dynamic Synonym Expander**
  - [x] Implemented `lib/synonym-expander-dynamic.ts`
  - [x] Database-driven loading (not hardcoded)
  - [x] 5-minute caching for performance
  - [x] Lazy initialization for better startup
  - [x] Integrated with `lib/chat-context-enhancer.ts`
- [x] **Phase 3: Auto-Learning System**
  - [x] Built `lib/synonym-auto-learner.ts`
  - [x] Analyzes scraped content for patterns after each scrape
  - [x] Extracts bracketed variations: `pump (hydraulic)`
  - [x] Finds slash alternatives: `loader/crane`
  - [x] Identifies compound terms: `heavy-duty`
  - [x] Stores learned synonyms with 0.8 weight
  - [x] Thompson's comprehensive mapping (60+ synonym groups)
- [x] **Phase 4: Critical Bug Fix (Domain ID Mismatch)**
  - [x] Discovered all 4,465 Thompson's pages had wrong domain_id
  - [x] Created `fix-thompson-config.ts` migration script
  - [x] Fixed foreign key constraints issue
  - [x] Result: 100% success rate finding products (was 0%)
- [x] **Achieved Results**:
  - Query expansion: 3-4x term expansion
  - Synonym accuracy: 100% on matching
  - Search similarity: 52% (up from 40%)
  - Product finding: 100% success rate after fix
  - CAT → Caterpillar mapping working
  - JD → John Deere mapping working
- [x] **Documentation**: See `SYNONYM_SYSTEM_COMPLETE.md`
  - Complete implementation details
  - Database schema documentation
  - Auto-learning algorithm explanation
  - Validation test results

#### 3.7 Metadata Extraction & Storage (COMPLETED - 99.3% Coverage)
- [x] **Phase 1: Comprehensive Metadata Extraction**
  - [x] Product names: 99.3% coverage (4,071/4,103 products)
  - [x] Brand extraction: 87.8% coverage
  - [x] Price extraction: 99.3% coverage (including sale prices)
  - [x] SKU codes: 99.3% coverage
  - [x] Category hierarchies: 99.3% coverage
  - [x] Stock status: 99.3% coverage
  - [x] Full e-commerce data structure preserved
- [x] **Phase 2: Metadata Storage**
  - [x] Stored in `scraped_pages.metadata` as JSONB
  - [x] All embeddings have metadata (100% coverage)
  - [x] Proper field naming: `productName`, `productBrand`, `productPrice`, etc.
  - [x] Sale price tracking with original and discounted prices
- [x] **Testing & Validation**
  - [x] Created `check-all-metadata.ts` validation script
  - [x] Created `test-chat-quality.ts` for response quality testing
  - [x] Created `test-simple-validation.ts` for quick checks
  - [x] Validation shows system finding specific products with details

#### 3.8 Remaining Synonym System Work
- [ ] **Performance Optimization (Week 1)**
  - [ ] Implement connection pooling for database queries
  - [ ] Optimize cache strategy (currently 5 minutes)
  - [ ] Reduce query time to <50ms per expansion
  - [ ] Batch synonym lookups for efficiency
- [ ] **Enhanced Learning (Week 2)**
  - [ ] Track click-through rates on search results
  - [ ] Learn from successful customer queries
  - [ ] A/B test synonym effectiveness
  - [ ] Implement negative synonym tracking (terms that shouldn't match)
- [ ] **Admin UI (Week 3)**
  - [ ] Synonym management interface in admin panel
  - [ ] View/edit domain-specific synonyms
  - [ ] Analytics dashboard for synonym performance
  - [ ] Manual override capability for auto-learned synonyms
- [ ] **Cross-Domain Learning (Week 4)**
  - [ ] Identify common synonyms across similar industries
  - [ ] Build industry-specific synonym templates
  - [ ] Share safe synonyms across domains (with opt-in)
  - [ ] Export/import synonym dictionaries

#### 3.9 Metadata Vectorization for Enhanced Search (Future - 80% Search Improvement)

### Phase 4: Scale & Optimize (Month 2)

#### 4.1 Performance Optimization
- [ ] Implement Redis caching for responses
- [ ] Database query optimization
- [ ] Lazy loading for chat history
- [ ] Image optimization for product displays
- [ ] Bundle size reduction

#### 4.2 Integration Expansion
- [ ] Shopify plugin development
- [ ] BigCommerce integration
- [ ] Slack/Discord notifications
- [ ] CRM integration (Salesforce, HubSpot)
- [ ] Email follow-up automation

#### 4.3 Analytics & Reporting
- [ ] Customer journey mapping
- [ ] Conversion tracking
- [ ] Revenue attribution
- [ ] A/B testing framework
- [ ] Custom report builder

### Phase 5: Enterprise Features (Month 3)

#### 5.1 Multi-tenancy
- [ ] White-label solution
- [ ] Custom branding per domain
- [ ] Separate data isolation
- [ ] Usage-based billing

#### 5.2 Advanced Security
- [ ] End-to-end encryption
- [ ] GDPR compliance tools
- [ ] CCPA compliance
- [ ] SOC 2 certification prep
- [ ] Audit logging

#### 5.3 Team Collaboration
- [ ] Multiple agent support
- [ ] Chat transfer between agents
- [ ] Internal notes on conversations
- [ ] Supervisor monitoring mode
- [ ] Training mode for new agents

## 📊 Success Metrics

### Technical KPIs
- Response time < 2 seconds
- 99.9% uptime
- Database query time < 100ms
- Widget load time < 500ms
- **Scraping efficiency: 93% cost reduction**
- **Incremental scrape time: < 15 minutes (vs 7 hours full)**
- **Change detection accuracy: > 99%**
- **Search relevance score: 52% (achieved, target 80%)**
- **Product query accuracy: 100% (achieved after domain_id fix)**
- **Metadata extraction coverage: 99.3% (achieved)**
- **Synonym expansion: 3-4x query terms (achieved)**
- **Brand synonym accuracy: 100% (achieved)**
- **Dashboard API response time: < 200ms (achieved)**
- **Telemetry data granularity: Per-request tracking (achieved)**
- **Cost projection accuracy: Real-time with hourly trends (achieved)**
- **Analytics coverage: 6 comprehensive endpoints (achieved)**

### Business KPIs
- Customer satisfaction score > 4.5/5
- First response time < 30 seconds
- Resolution rate > 80%
- Conversion lift > 15%
- **Bot knowledge freshness: < 2 hours for critical pages**
- **Scraping cost savings: > $800/month per customer**

### Usage Targets
- Month 1: 100 active sites
- Month 3: 500 active sites
- Month 6: 2000 active sites
- Year 1: 10,000 active sites

## 🛠️ Tech Stack

### Current
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: Supabase (PostgreSQL with pgvector)
- **AI**: OpenAI GPT-4
- **Cache**: Redis (for job queues and caching)
- **Web Scraping**: Crawlee + Playwright, Mozilla Readability
- **Hosting**: Local development → Vercel (planned)

### Future Considerations
- Vector database for semantic search
- WebSocket for real-time updates
- GraphQL API layer
- Kubernetes for orchestration

## 💰 Resource Requirements

### Development Team
- 1 Full-stack developer (current)
- 1 DevOps engineer (needed for Phase 2)
- 1 QA engineer (needed for Phase 2)
- 1 Product designer (needed for Phase 3)

### Infrastructure Costs (Monthly)
- Supabase: $25-$599 (based on scale)
- OpenAI API: $500-$5000 (based on usage)
- Hosting: $20-$500 (Vercel Pro/Enterprise)
- Monitoring: $50-$200 (Sentry, DataDog)
- Total: ~$600-$6300/month

## 🚨 Risk Mitigation

### Technical Risks
- **API Rate Limits**: Implement caching and request queuing
- **Database Scaling**: Plan for read replicas and sharding
- **AI Costs**: Implement usage caps and tiered pricing

### Business Risks
- **Competition**: Focus on WooCommerce-specific features
- **Adoption**: Free tier for small businesses
- **Support burden**: Comprehensive documentation and self-service

## 📅 Timeline Summary

- **Week 1-2**: Production readiness
- **Week 3-4**: Deployment and testing
- **Month 2**: Enhanced features and optimization
- **Month 3**: Enterprise features and scale
- **Month 4-6**: Growth and iteration

## 🎯 Immediate Next Actions

1. **URGENT - GitHub Secrets Setup** (Required for CI/CD)
   - Add 4 secrets to GitHub repository settings
   - Values available in `.env.local` (except DATABASE_URL)
   - Run `./show-github-secrets.sh` for exact values
   - Test with manual workflow run
   - Expected completion: 30 minutes

2. **COMPLETED**: CI/CD & Monitoring Infrastructure
   - ✅ GitHub Actions workflow configured
   - ✅ TypeScript errors resolved
   - ✅ Slack alerting implemented
   - ✅ GDPR compliance features added
   - ✅ Nightly validation pipeline ready

3. **COMPLETED**: Domain-Isolated Synonym Expansion System
   - ✅ Database-driven synonym system with domain isolation
   - ✅ Auto-learning from scraped content
   - ✅ Fixed critical domain_id mismatch bug
   - ✅ Result: 100% product finding success rate

4. **COMPLETED**: Metadata Extraction & Storage
   - ✅ 99.3% coverage on product metadata
   - ✅ Brand, price, SKU, category extraction working
   - ✅ Sale price tracking implemented

5. **Next Priority**: Synonym System Optimization
   - Implement connection pooling (<50ms query time)
   - Add click-through learning
   - Build admin UI for synonym management
   - Expected completion: 2 weeks
   - ROI: Further 20-30% search improvement

6. **COMPLETED**: Audit Detail UX Enhancement (January 2025)
   - ✅ Modal for viewing full JSON payloads implemented
   - ✅ Per-row download functionality working
   - ✅ Tabbed interface for different data views
   - ✅ Click-to-open with visual hover feedback
   - ✅ Copy to clipboard and compliance notes added

7. **Future Priority**: Smart Periodic Scraper
   - Run database migrations (5 tables)
   - Build incremental scraping engine
   - Add scheduling UI to training dashboard
   - Expected completion: 4 weeks
   - ROI: 93% reduction in scraping costs

8. **Future Enhancement**: Metadata Vectorization
   - Week 1: Quick win content enrichment
   - Week 2-3: Dual embedding implementation
   - Week 4: Intelligent query routing
   - Expected completion: 4 weeks
   - ROI: Additional 30% improvement in search relevance

## 📝 Notes

- Current development server: http://localhost:3000
- Supabase project: birugqyuqhiahxvxeyqg
- WordPress plugin location: `/wordpress-plugin/`
- Documentation: `/docs/`

## 🔄 Last Updated
- Date: January 22, 2025
- Version: 1.3.0
- Status: Development → Beta (in progress)
- Latest Addition: CI/CD & Monitoring Infrastructure (Phase 1.1 - Completed)
- Action Required: GitHub Secrets Configuration for workflow activation
