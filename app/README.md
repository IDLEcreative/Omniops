# App Directory - Omniops AI Customer Service Platform

This directory contains all Next.js App Router pages, layouts, and API routes for the Omniops AI Customer Service Platform. Built with Next.js 15 and the App Router architecture.

## Project Overview

Omniops is an intelligent customer service platform that provides AI-powered chat assistance for businesses. It features:
- AI chat agents with 40+ language support
- Website scraping for context-aware responses
- WooCommerce integration for e-commerce support
- Multi-tenant architecture with customer verification
- GDPR-compliant data handling
- Real-time chat widget embedding

## Directory Structure

```
app/
├── api/                    # API Routes (see api/README.md)
│   ├── admin/             # Admin management endpoints
│   ├── auth/              # Authentication endpoints
│   ├── chat/              # Main chat API
│   ├── woocommerce/       # E-commerce integration
│   └── ...                # Additional API endpoints
├── admin/                 # Admin panel pages
│   ├── layout.tsx         # Admin layout with sidebar
│   ├── page.tsx           # Admin dashboard
│   ├── privacy/           # Privacy management
│   └── scraping/          # Website scraping management
├── dashboard/             # Customer dashboard
│   ├── layout.tsx         # Dashboard layout
│   ├── page.tsx           # Dashboard overview
│   ├── analytics/         # Usage analytics
│   ├── conversations/     # Chat history
│   ├── integrations/      # Third-party integrations
│   └── training/          # AI training interface
├── chat/                  # Main chat interface
├── embed/                 # Widget embedding pages
├── demo/                  # Demo preview pages
├── privacy/               # Privacy and GDPR pages
└── ...                    # Additional pages
```

## Routes

### Public Routes
- `/` - Landing page with demo generator and pricing
- `/login` - User authentication (supports OAuth)
- `/signup` - User registration
- `/demo/[demoId]` - Interactive demo preview pages
- `/terms` - Terms of service
- `/privacy` - Privacy policy with GDPR export
- `/accessibility` - Accessibility statement and features
- `/embed` - Embeddable chat widget
- `/test-widget` - Widget testing environment

### Protected Routes (Require Authentication)
- `/chat` - Main chat interface for customer interactions
- `/configure` - Widget configuration and customization
- `/setup` - Quick setup wizard for new customers
- `/install` - Installation guide and embed codes
- `/dashboard/` - Customer dashboard hub
  - `/dashboard/analytics` - Usage analytics and performance metrics
  - `/dashboard/conversations` - Chat history and conversation management
  - `/dashboard/integrations` - Third-party service integrations
  - `/dashboard/integrations/woocommerce` - WooCommerce setup and management
  - `/dashboard/training` - AI training interface and data management

### Admin Routes (Admin Access Only)
- `/admin` - Admin dashboard with system overview
- `/admin/scraping` - Website scraping management and monitoring
- `/admin/privacy` - Privacy settings and GDPR compliance tools

### Demo and Testing Routes
- `/demo/[demoId]` - Dynamic demo pages with generated chat configurations
- `/simple-test` - Simple testing interface for development

## API Endpoints

See [api/README.md](./api/README.md) for detailed API documentation.

## Layouts

- `layout.tsx` - Root layout with providers
- `admin/layout.tsx` - Admin layout with sidebar navigation
- `dashboard/layout.tsx` - Dashboard layout with navigation

## Error Handling

- `error.tsx` - Error boundary for route segments
- `global-error.tsx` - Global error boundary
- `not-found.tsx` - 404 page

## Core Layouts

### Root Layout (`layout.tsx`)
- Provides global providers: AuthProvider, ThemeProvider
- Sets up Geist fonts and global CSS
- Includes metadata for SEO optimization
- Configures HTML structure with theme support

### Admin Layout (`admin/layout.tsx`) 
- Sidebar navigation for admin functions
- Protected route with authentication check
- Navigation items: Dashboard, Website Scraping, Privacy & Security
- Sign out functionality and widget settings access

### Dashboard Layout (`dashboard/layout.tsx`)
- Customer-focused navigation and sidebar
- Integration management and analytics access
- Training interface and conversation history

## Error Handling

- `error.tsx` - Error boundary for route segments with recovery options
- `global-error.tsx` - Global error boundary for unhandled exceptions
- `not-found.tsx` - Custom 404 page with helpful navigation

## Key Features

### Authentication & Authorization
- Multi-level access control (public, protected, admin)
- Session-based authentication with secure token handling
- OAuth integration support
- Role-based access control for admin functions

### AI Chat System
- Real-time chat interface with WebSocket support
- Context-aware responses using RAG (Retrieval-Augmented Generation)
- Multi-language support (40+ languages)
- Rate limiting and spam protection

### Website Scraping & Content Management
- Automated website crawling and indexing
- Content embedding for semantic search
- Real-time content refresh and updates
- Duplicate content detection and management

### E-commerce Integration
- WooCommerce API integration
- Customer verification and order tracking
- Inventory management and stock updates
- Abandoned cart tracking and recovery

### Privacy & GDPR Compliance
- Data export functionality
- Complete data deletion
- Privacy-first architecture
- Audit trails and compliance reporting

### Widget Embedding
- Customizable chat widget
- Easy integration with single line of code
- Theme customization and branding
- Demo generation for testing

## Architecture Patterns

### Server Components First
- All pages are Server Components by default unless marked with `'use client'`
- Improved performance with server-side rendering
- Better SEO with static generation where possible

### Dynamic Metadata
- Page-specific metadata generation
- SEO optimization with dynamic titles and descriptions
- Open Graph and Twitter card support

### Loading States
- Streaming UI with React Suspense
- Progressive loading for better user experience
- Skeleton screens during data fetching

### Parallel Data Fetching
- Dashboard uses parallel routes for efficient data loading
- Concurrent API calls for improved performance
- Error boundaries for graceful degradation

## Development Guidelines

### Code Organization
1. Keep pages thin - business logic belongs in `/lib`
2. Use Server Components for data fetching and static content
3. Client Components only when interactivity is required
4. Colocate page-specific components within route folders
5. Use route groups `()` for organization without affecting URLs

### Performance Best Practices
1. Leverage Next.js Image optimization
2. Use dynamic imports for heavy client-side components
3. Implement proper caching strategies
4. Monitor bundle sizes and code splitting

### Security Considerations
1. Input validation with Zod schemas
2. Rate limiting on sensitive endpoints  
3. CSRF protection for forms
4. Secure session handling
5. Environment variable protection

### Testing Strategy
1. Unit tests for utility functions
2. Integration tests for API routes
3. E2E tests for critical user flows
4. Component testing with React Testing Library

### Deployment
1. Environment-specific configuration
2. Database migrations and seeding
3. CDN optimization for static assets
4. Health checks and monitoring