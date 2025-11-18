**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# App Directory - OmniOps AI Customer Service Platform

This directory contains the complete Next.js 15 App Router implementation for the OmniOps AI Customer Service Platform. Features a modern, performance-optimized architecture with Server Components, streaming UI, and comprehensive API endpoints.

**Architecture Highlights:**
- **60+ API Endpoints**: Comprehensive REST API coverage for all features
- **Multi-Tenant Pages**: Domain-based customer isolation and management
- **Server Components First**: Optimized performance with selective client-side interactivity
- **Streaming UI**: Progressive loading with React Suspense integration
- **Type-Safe Routing**: Full TypeScript integration with route parameter validation

## Core Features Implementation

**AI-Powered Intelligence:**
- RAG (Retrieval-Augmented Generation) system with semantic search
- OpenAI GPT-4 integration with context awareness
- Multi-language support (40+ languages) with cultural adaptation
- Hallucination prevention with built-in factual validation

**E-commerce Integration:**
- Deep WooCommerce API integration with real-time sync
- Customer verification system with email and order matching
- Abandoned cart tracking and automated recovery workflows
- Inventory management with stock level awareness

**Enterprise Architecture:**
- Multi-tenant design with complete domain isolation
- AES-256 encrypted credential storage
- GDPR/CCPA compliance with data export and deletion
- Performance-optimized with sub-300ms response times

## Directory Structure

```
app/
├── api/                         # API Routes (60+ endpoints)
│   ├── chat/                   # AI conversation engine
│   ├── chat-intelligent/       # Advanced chat with RAG
│   ├── woocommerce/            # E-commerce integration (15+ endpoints)
│   │   ├── products/           # Product search and management
│   │   ├── orders/             # Order tracking and updates
│   │   ├── customers/          # Customer verification
│   │   ├── abandoned-carts/    # Cart recovery system
│   │   └── dashboard/          # E-commerce analytics
│   ├── scrape/                 # Web scraping and content extraction
│   ├── admin/                  # Administrative operations
│   │   ├── config/             # Customer configuration management
│   │   └── test-connection/    # System health and connectivity
│   ├── customer/               # Customer verification services
│   │   ├── verify/             # Full customer verification
│   │   └── quick-verify/       # Streamlined verification
│   ├── privacy/                # GDPR/CCPA compliance
│   │   ├── export/             # Data export functionality
│   │   └── delete/             # Right to erasure implementation
│   ├── training/               # AI training and knowledge management
│   │   ├── text/               # Text-based training
│   │   ├── qa/                 # Q&A pair training
│   │   └── [id]/               # Training session management
│   ├── demo/                   # Demo generation and preview
│   ├── health/                 # System health monitoring
│   ├── debug/                  # Development and debugging tools
│   └── monitoring/             # Performance and observability
├── dashboard/                   # Customer Dashboard (Multi-page)
│   ├── layout.tsx              # Unified dashboard layout
│   ├── page.tsx                # Dashboard overview and metrics
│   ├── analytics/              # Usage analytics and insights
│   │   └── page.tsx            # Detailed analytics dashboard
│   ├── conversations/          # Chat history and management
│   │   └── page.tsx            # Conversation browser
│   ├── integrations/           # Third-party service connections
│   │   ├── page.tsx            # Integration overview
│   │   └── woocommerce/        # WooCommerce setup wizard
│   ├── training/               # AI knowledge management
│   │   └── page.tsx            # Training data interface
│   ├── settings/               # Account and widget settings
│   │   └── page.tsx            # Configuration interface
│   ├── customers/              # Customer management tools
│   ├── customize/              # Widget appearance customization
│   ├── privacy/                # Privacy controls and GDPR tools
│   ├── team/                   # Team management (multi-user)
│   └── help/                   # Documentation and support
├── embed/                       # Widget Embedding System
│   ├── page.tsx                # Main embeddable chat widget
│   └── enhanced-page.tsx       # Advanced widget with features
├── demo/                        # Demo Generation System
│   ├── [demoId]/               # Dynamic demo pages
│   │   └── page.tsx            # Individual demo preview
│   └── page.tsx                # Demo creation interface
├── auth/                        # Authentication Flow
│   ├── callback/               # OAuth callback handling
│   │   └── page.tsx            # Authentication processing
│   └── page.tsx                # Main auth interface
├── privacy/                     # Privacy and Legal Pages
│   ├── export/                 # GDPR data export interface
│   │   └── page.tsx            # Export request handling
│   └── page.tsx                # Privacy policy and controls
├── chat/                        # Direct Chat Interface
│   └── page.tsx                # Standalone chat page
├── configure/                   # Widget Configuration
│   └── page.tsx                # Setup and customization wizard
├── setup/                       # Onboarding Flow
│   └── page.tsx                # New customer setup wizard
├── install/                     # Installation Guide
│   └── page.tsx                # Integration instructions
├── login/                       # User Authentication
│   └── page.tsx                # Login interface
├── signup/                      # User Registration
│   └── page.tsx                # Registration form
├── terms/                       # Legal Documents
│   └── page.tsx                # Terms of service
├── accessibility/               # Accessibility Features
│   └── page.tsx                # Accessibility statement
├── test-widget/                 # Development Tools
│   └── page.tsx                # Widget testing environment
└── widget-test/                 # Widget Testing
    └── page.tsx                # Widget validation tools
```

## Routes

### Public Routes

**Marketing & Information:**
- `/` - Landing page with interactive demo generator and pricing
- `/terms` - Terms of service and legal information
- `/privacy` - Privacy policy with GDPR data export tools
- `/accessibility` - WCAG 2.1 accessibility statement and features

**Authentication:**
- `/login` - User authentication with OAuth support (Google, GitHub)
- `/signup` - User registration with email verification
- `/auth/callback` - OAuth callback processing
- `/reset-password` - Password reset workflow
- `/update-password` - Password update interface

**Widget & Demo System:**
- `/embed` - Production embeddable chat widget
- `/demo/[demoId]` - Dynamic demo preview pages with auto-generated content
- `/test-widget` - Widget testing environment for developers
- `/widget-test` - Widget validation and debugging tools
- `/simple-test` - Simplified testing interface

### Protected Routes (Require Authentication)

**Main Application:**
- `/chat` - Direct chat interface for customer support interactions
- `/configure` - Complete widget configuration and appearance customization
- `/setup` - Guided onboarding wizard for new customers
- `/install` - Integration guide with embed codes and documentation

**Customer Dashboard:**
- `/dashboard` - Main dashboard with metrics overview and quick actions
- `/dashboard/analytics` - Comprehensive usage analytics and performance insights
- `/dashboard/conversations` - Chat history browser with search and filtering
- `/dashboard/integrations` - Third-party service connection management
- `/dashboard/integrations/woocommerce` - WooCommerce setup wizard and configuration
- `/dashboard/training` - AI knowledge management and training data interface
- `/dashboard/settings` - Account settings and widget configuration
- `/dashboard/customers` - Customer management and verification tools
- `/dashboard/customize` - Advanced widget appearance and behavior customization
- `/dashboard/privacy` - Privacy controls and GDPR compliance tools
- `/dashboard/team` - Team member management and permissions
- `/dashboard/help` - Documentation, tutorials, and support resources

### Admin Routes (Admin Access Only)

**System Administration:**
- `/admin` - System dashboard with platform-wide metrics and health monitoring
- `/admin/scraping` - Website scraping management, job monitoring, and performance analytics
- `/admin/privacy` - Global privacy settings, GDPR compliance tools, and audit trails

**Note**: Admin routes are protected by role-based access control and require elevated permissions.

### Development & Testing Routes

**Demo System:**
- `/demo/[demoId]` - Dynamic demo pages with auto-generated configurations based on scraped website content
- `/demo` - Demo creation interface for generating new previews

**Development Tools:**
- `/simple-test` - Simplified testing interface for rapid development and debugging
- `/test-widget` - Comprehensive widget testing environment with multiple scenarios
- `/widget-test` - Widget validation tools for integration testing

**Note**: Testing routes are typically disabled in production environments.

## API Architecture

The API layer provides 60+ endpoints organized into logical groups:

**Core Services:**
- **Chat APIs**: AI conversation engine with RAG integration
- **WooCommerce APIs**: Complete e-commerce integration suite
- **Scraping APIs**: Website content extraction and indexing
- **Customer APIs**: Verification and management services
- **Privacy APIs**: GDPR/CCPA compliance implementation
- **Training APIs**: AI knowledge management and optimization
- **Admin APIs**: System administration and monitoring

**Key Features:**
- **Type-Safe Validation**: All endpoints use Zod schemas for request/response validation
- **Rate Limiting**: Per-domain and per-endpoint rate limiting with Redis backend
- **Error Handling**: Standardized error responses with detailed logging
- **Documentation**: OpenAPI-compatible documentation with examples
- **Testing**: Comprehensive test coverage with MSW mocking

**Complete API Documentation**: [api/README.md](./api/README.md)

## Layout System

### Root Layout (`layout.tsx`)
**Purpose**: Global application shell with providers and theme management
**Features:**
- **Authentication Provider**: Session management and user state
- **Theme Provider**: Dark/light mode with system preference detection
- **Font Optimization**: Geist font family with optimal loading
- **Global Styles**: Tailwind CSS integration with custom design tokens
- **Metadata Management**: Dynamic SEO optimization and social sharing
- **Security Headers**: CSP, CSRF protection, and security policies

### Dashboard Layout (`dashboard/layout.tsx`)
**Purpose**: Customer-focused interface with comprehensive navigation
**Features:**
- **Sidebar Navigation**: Contextual menu with active state management
- **User Profile**: Account information and quick access controls
- **Notification System**: Real-time alerts and system messages
- **Breadcrumb Navigation**: Hierarchical navigation with deep linking
- **Quick Actions**: Frequently used operations and shortcuts
- **Responsive Design**: Mobile-optimized with collapsible navigation

### Admin Layout (`admin/layout.tsx`)
**Purpose**: Administrative interface with elevated permissions
**Features:**
- **Admin Navigation**: System management and monitoring tools
- **Permission Checks**: Role-based access control validation
- **System Status**: Real-time health monitoring and alerts
- **Audit Trail**: Activity logging and compliance tracking

## Error Handling & User Experience

### Error Boundaries
- **`error.tsx`**: Route-level error boundary with recovery options and user-friendly messaging
- **`global-error.tsx`**: Application-level error boundary for critical failures
- **`not-found.tsx`**: Custom 404 page with helpful navigation and search functionality

### Error Recovery
- **Graceful Degradation**: Partial functionality when services are unavailable
- **Retry Mechanisms**: Automatic retry with exponential backoff for transient failures
- **User Feedback**: Clear error messages with actionable next steps
- **Logging Integration**: Comprehensive error tracking for debugging and monitoring

## Performance Optimization

### Server Components Strategy
**Default Approach**: All pages are Server Components unless marked with `'use client'`
**Benefits:**
- **Reduced JavaScript Bundle**: Client-side code minimized to essential interactivity
- **Faster Initial Load**: Server-rendered content with immediate visibility
- **SEO Optimization**: Fully rendered HTML for search engine crawling
- **Performance Metrics**: Improved Core Web Vitals scores

### Data Fetching Patterns
**Parallel Data Loading**: Dashboard uses concurrent data fetching for optimal performance
**Streaming UI**: Progressive loading with React Suspense for better perceived performance
**Caching Strategy**: Multi-layer caching with Redis and edge caching
**Error Boundaries**: Graceful degradation when individual data sources fail

### Code Splitting & Optimization
**Dynamic Imports**: Heavy components loaded on demand
**Route-based Splitting**: Automatic code splitting by page
**Bundle Analysis**: Regular bundle size monitoring and optimization
**Image Optimization**: Next.js Image component with WebP conversion and responsive sizes

## Feature Implementation Details

### Authentication & Authorization System
**Multi-Tier Access Control:**
- **Public Access**: Landing pages, demos, and marketing content
- **Authenticated Users**: Dashboard, chat interface, and widget management
- **Admin Users**: System administration, monitoring, and global settings
- **OAuth Integration**: Google, GitHub, and custom provider support
- **Session Management**: Secure httpOnly cookies with automatic renewal
- **Permission Validation**: Route-level and component-level access control

### AI Chat System Implementation
**Conversation Engine:**
- **RAG Integration**: Semantic search across indexed website content
- **Context Management**: Conversation history and user preference tracking
- **Multi-Language Support**: Native support for 40+ languages with cultural context
- **Response Optimization**: Sub-2-second response times with streaming
- **Safety Measures**: Hallucination prevention and content filtering
- **Rate Limiting**: Intelligent throttling to prevent abuse

### Website Intelligence & Content Management
**Automated Content Processing:**
- **Intelligent Crawling**: Crawlee + Playwright for robust content extraction
- **Content Cleaning**: Mozilla Readability for clean, readable content
- **Semantic Indexing**: OpenAI embeddings for contextual search
- **Real-time Updates**: Automated content refresh and synchronization
- **Duplicate Detection**: Advanced algorithms to maintain content quality
- **Performance Monitoring**: Crawling job status and error tracking

### E-commerce Integration (WooCommerce)
**Deep Integration Features:**
- **Real-time API Sync**: Live inventory, orders, and customer data
- **Customer Verification**: Email and order-based authentication
- **Order Management**: Complete lifecycle tracking and updates
- **Cart Recovery**: Abandoned cart detection and automated follow-up
- **Inventory Awareness**: Stock level monitoring and notifications
- **Analytics Integration**: E-commerce performance metrics

### Privacy & Compliance Framework
**GDPR/CCPA Implementation:**
- **Data Minimization**: Collect only necessary information
- **Consent Management**: Granular privacy controls
- **Right to Export**: Complete data export in JSON format
- **Right to Erasure**: Comprehensive data deletion with audit trails
- **Data Encryption**: AES-256 encryption for sensitive information
- **Audit Logging**: Complete activity tracking for compliance

### Widget Embedding System
**Production-Ready Integration:**
- **Single Script Integration**: One-line implementation for any website
- **Theme Customization**: Complete branding and appearance control
- **Responsive Design**: Mobile-optimized with accessibility features
- **Performance Optimized**: Minimal impact on host website performance
- **Demo Generation**: Automated demo creation from website content
- **Testing Tools**: Comprehensive validation and debugging utilities

## Advanced Architecture Patterns

### Server-First Architecture
**Implementation Strategy:**
- **Default Server Components**: Maximize server-side rendering for performance
- **Selective Client Interactivity**: Use `'use client'` only for essential interactive features
- **Hybrid Rendering**: Combine static generation with dynamic server rendering
- **Edge Computing**: Leverage edge functions for geo-distributed performance

### Dynamic Metadata & SEO
**Advanced SEO Implementation:**
- **Dynamic Meta Generation**: Page-specific titles, descriptions, and keywords
- **Open Graph Optimization**: Rich social media previews with dynamic content
- **JSON-LD Structured Data**: Enhanced search engine understanding
- **Sitemap Generation**: Automatic sitemap updates for better indexing
- **Performance Optimization**: Core Web Vitals optimization for search ranking

### Progressive Loading & UX
**User Experience Optimization:**
- **Streaming UI**: React Suspense for progressive content loading
- **Skeleton States**: Intelligent loading placeholders for better perceived performance
- **Optimistic Updates**: Immediate UI feedback with background synchronization
- **Error Recovery**: Graceful fallbacks and retry mechanisms
- **Accessibility**: WCAG 2.1 compliance with keyboard navigation and screen reader support

### Concurrent Data Architecture
**Performance Optimization:**
- **Parallel Data Fetching**: Concurrent API calls to minimize loading times
- **Request Deduplication**: Intelligent caching to prevent redundant requests
- **Background Refresh**: Keep data fresh without user interaction
- **Error Isolation**: Individual component failures don't affect the entire page
- **Cache Invalidation**: Smart cache management for data consistency

## Development Standards & Guidelines

### Code Organization Philosophy
**Separation of Concerns:**
1. **Thin Pages**: Keep page components focused on layout and data presentation
2. **Business Logic Isolation**: All business logic resides in `/lib` for reusability
3. **Component Strategy**: Server Components for data fetching, Client Components for interactivity only
4. **Colocation**: Keep page-specific components within their route folders
5. **Route Organization**: Use route groups `()` for logical organization without URL impact
6. **File Length Enforcement**: Maximum 300 lines per file (strictly enforced)

### Performance Excellence
**Optimization Strategies:**
1. **Image Optimization**: Next.js Image component with WebP conversion and responsive sizing
2. **Code Splitting**: Dynamic imports for heavy components and libraries
3. **Caching Strategy**: Multi-layer caching with Redis, edge caching, and browser caching
4. **Bundle Monitoring**: Regular bundle analysis with automated size alerts
5. **Core Web Vitals**: Continuous monitoring and optimization for search ranking
6. **Memory Management**: Proper cleanup and memory leak prevention

### Security Framework
**Multi-Layer Security:**
1. **Input Validation**: Comprehensive Zod schema validation for all inputs
2. **Rate Limiting**: Per-domain and per-endpoint protection with Redis backend
3. **CSRF Protection**: Built-in protection for all form submissions
4. **Session Security**: Secure httpOnly cookies with proper expiration
5. **Environment Protection**: Secure environment variable handling
6. **SQL Injection Prevention**: Parameterized queries and ORM usage
7. **XSS Protection**: Content Security Policy and input sanitization

### Testing Excellence
**Comprehensive Testing Strategy:**
1. **Unit Testing**: All utility functions and business logic (80%+ coverage)
2. **Integration Testing**: Complete API route testing with realistic scenarios
3. **Component Testing**: React Testing Library for UI component validation
4. **E2E Testing**: Critical user flows with Playwright automation
5. **Performance Testing**: Load testing and performance regression detection
6. **Security Testing**: Automated vulnerability scanning and penetration testing

### Production Deployment
**Enterprise-Grade Deployment:**
1. **Environment Management**: Staging, production, and preview environments
2. **Database Migrations**: Automated schema migrations with rollback capabilities
3. **CDN Integration**: Global content delivery with edge caching
4. **Health Monitoring**: Comprehensive health checks and alerting
5. **Performance Monitoring**: Real-time performance metrics and optimization
6. **Security Monitoring**: Continuous security scanning and threat detection
7. **Backup & Recovery**: Automated backups with disaster recovery procedures

## Technical Specifications & Requirements

### Browser Support Matrix
**Modern Browser Support:**
- Chrome 90+ (95% of users)
- Firefox 88+ (Latest ESR + 2 versions)
- Safari 14+ (macOS and iOS)
- Edge 90+ (Chromium-based)
- Mobile browsers with ES2020 support

### Performance Targets
**Measurable Performance Goals:**
- **API Response Time**: <300ms (95th percentile)
- **Page Load Time**: <1 second (Largest Contentful Paint)
- **Chat Response Time**: <2 seconds (end-to-end)
- **Bundle Size**: <500KB (main bundle)
- **Core Web Vitals**: All metrics in "Good" range
- **Uptime**: 99.9% availability target

### Accessibility Standards
**WCAG 2.1 Level AA Compliance:**
- **Keyboard Navigation**: Full functionality accessible via keyboard
- **Screen Reader Support**: Semantic HTML with proper ARIA labels
- **Color Contrast**: Minimum 4.5:1 ratio for normal text
- **Focus Management**: Clear focus indicators and logical tab order
- **Responsive Design**: Usable at 200% zoom level
- **Alternative Text**: Descriptive alt text for all images

## Getting Started with Development

### Quick Setup
```bash
# Clone and setup
git clone <repository-url>
cd Omniops
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development services
docker-compose -f docker/docker-compose.dev.yml up -d

# Start development server
npm run dev
```

### Development Workflow
1. **Feature Development**: Create feature branch from main
2. **Code Standards**: Follow TypeScript strict mode and file length limits
3. **Testing**: Write tests for new functionality
4. **Quality Checks**: Run linting, type checking, and tests
5. **Documentation**: Update relevant README files
6. **Pull Request**: Submit with detailed description and testing notes

### Common Development Tasks
```bash
# Development
npm run dev                    # Start development server
npm run build                  # Build for production
npm test                       # Run all tests
npm run lint                   # Check code quality

# Database operations
npx tsx test-database-cleanup.ts stats    # View data statistics
npx tsx test-database-cleanup.ts clean    # Clean scraped data

# Docker operations
docker-compose -f docker/docker-compose.dev.yml up -d    # Start services
docker-compose -f docker/docker-compose.dev.yml logs -f  # View logs
```

**Additional Resources:**
- [API Documentation](api/README.md) - Complete API reference
- [Dashboard Documentation](dashboard/README.md) - Dashboard feature guide  
- [Embed Documentation](embed/README.md) - Widget integration guide
- [CLAUDE.md](../CLAUDE.md) - Project guidelines and development standards