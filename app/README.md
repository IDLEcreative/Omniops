# App Directory

This directory contains all Next.js 15 App Router pages, layouts, and API routes.

## Structure Overview

```
app/
├── api/               # API Routes
├── (public)/          # Public pages (no auth required)
├── (protected)/       # Protected pages (auth required)
├── (admin)/          # Admin-only pages
└── (embed)/          # Widget-related pages
```

## Routes

### Public Routes
- `/` - Landing page with demo generator
- `/login` - User authentication
- `/signup` - User registration
- `/demo/[demoId]` - Demo preview pages
- `/terms` - Terms of service
- `/privacy` - Privacy policy
- `/accessibility` - Accessibility statement

### Protected Routes
- `/chat` - Main chat interface
- `/dashboard/*` - Customer dashboard
  - `/dashboard` - Overview
  - `/dashboard/analytics` - Usage analytics
  - `/dashboard/conversations` - Chat history
  - `/dashboard/integrations` - Third-party integrations
  - `/dashboard/training` - Bot training

### Admin Routes
- `/admin` - Admin dashboard
- `/admin/scraping` - Content management
- `/admin/privacy` - Privacy settings

### Widget Routes
- `/embed` - Embeddable widget
- `/configure` - Widget configuration
- `/setup` - Quick setup wizard
- `/install` - Installation guide
- `/test-widget` - Widget testing environment

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

## Key Features

### Server Components
All pages are Server Components by default unless marked with `'use client'`.

### Metadata
Each page exports metadata for SEO optimization.

### Loading States
Use `loading.tsx` files for automatic loading UI.

### Parallel Routes
Dashboard uses parallel routes for efficient data fetching.

## Development Guidelines

1. Keep pages thin - business logic goes in `/lib`
2. Use Server Components where possible
3. Client Components only when needed for interactivity
4. Colocate page-specific components within route folders
5. Use route groups `()` for organization without affecting URLs