# Welcome to OmniOps Developer Onboarding

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 15 minutes

## Purpose

This guide helps new developers get up and running with OmniOps quickly, understand the project structure, and learn how to contribute effectively.

## Quick Links

- [Project Overview](#project-overview) - What OmniOps does
- [Architecture Overview](#architecture-overview) - How it's built
- [Development Setup](#development-setup) - Get running locally
- [First Contribution](#first-contribution) - Make your first change
- [Common Tasks](#common-tasks) - Everyday development commands
- [Getting Help](#getting-help) - Resources and support
- [Next Steps](#next-steps) - Where to go from here

---

## Project Overview

### What is OmniOps?

OmniOps is a **general-purpose AI-powered customer service chat widget** for any business type.

**Key Features:**
- Embeddable chat widget for any website
- Multi-tenant, brand-agnostic architecture
- Web scraping and content extraction
- WooCommerce and Shopify integration
- Semantic search with embeddings
- GDPR/CCPA compliant data handling

**Who Uses It?**
- E-commerce stores
- Restaurants and food services
- Real estate agents
- Healthcare providers
- Educational institutions
- Any business needing customer support

### Why Brand-Agnostic?

OmniOps is **not** hardcoded for a specific industry. The same codebase supports all business types through:
- Database-driven configuration (not hardcoded)
- Dynamic product/service handling
- Customizable integrations
- Per-tenant settings

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, TypeScript 5, Tailwind CSS |
| **Backend** | Next.js API Routes, Node.js |
| **Database** | Supabase (PostgreSQL) with pgvector embeddings |
| **AI** | OpenAI GPT-4 for chat, embeddings |
| **Infrastructure** | Docker, Redis, BullMQ job queue |
| **Testing** | Jest (unit/integration), Playwright (E2E) |

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────┐
│         Customer's Website                  │
│    (Any e-commerce/business site)           │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│    OmniOps Embedded Chat Widget             │
│   (Minimal 7-line JavaScript embed)         │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│       Next.js Application (port 3000)       │
├─────────────────────────────────────────────┤
│ • API Routes: /api/*                        │
│ • Frontend: React components                │
│ • Business Logic: TypeScript services       │
└──────┬───────────────────┬──────────────────┘
       │                   │
       ▼                   ▼
┌────────────────┐  ┌──────────────────┐
│   Supabase     │  │   OpenAI API     │
│   PostgreSQL   │  │   (Chat + Embed) │
│   & pgvector   │  │                  │
└────────────────┘  └──────────────────┘
```

### Directory Structure

```
Omniops/
├── app/                    # Next.js app router
│   ├── api/               # All API endpoints
│   ├── embed/             # Widget embed page
│   └── layout.tsx         # Root layout
│
├── components/            # React components
│   ├── ui/               # UI component library
│   └── chat/             # Chat-specific components
│
├── lib/                  # Business logic
│   ├── embeddings.ts     # Vector search
│   ├── woocommerce-api.ts # WooCommerce integration
│   ├── shopify-api.ts    # Shopify integration
│   ├── crawler-config.ts # Web scraping config
│   └── services/         # Core services
│
├── hooks/                # Custom React hooks
├── types/                # TypeScript types
├── __tests__/            # Test suites
│   ├── unit/            # Unit tests
│   ├── integration/      # Integration tests
│   └── playwright/       # E2E tests
│
├── scripts/              # Development scripts
│   ├── database/        # DB utilities
│   ├── monitoring/      # Health monitoring
│   └── setup.sh         # Initial setup
│
├── docs/                 # Documentation
├── docker/               # Docker configs
├── migrations/           # Database migrations
└── public/               # Static assets
```

**See Also:** [Complete architecture documentation](../01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md)

---

## Development Setup

### Step 1: Prerequisites

Ensure you have these installed:

```bash
# Check Node.js version (need 18+)
node --version

# Check npm version (need 9+)
npm --version

# Check Docker Desktop (required for Redis and Supabase)
docker --version
```

**If missing, install:**
- **Node.js & npm:** Download from [nodejs.org](https://nodejs.org/) (LTS version)
- **Docker Desktop:** Download from [docker.com](https://docker.com/)
  - macOS: Run `open -a "Docker"` to start
  - Windows/Linux: Follow Docker Desktop installation

### Step 2: Clone and Install

```bash
# Clone the repository
git clone <repo-url>
cd Omniops

# Install dependencies
npm install

# Verify installation
npm run check:all
```

### Step 3: Environment Variables

```bash
# Copy example environment file
cp .env.example .env.local

# The .env.local file contains all needed env vars
# Check documentation for sensitive variables:
# - OPENAI_API_KEY: Get from https://platform.openai.com
# - Supabase credentials: Get from your Supabase project
# - Redis: Usually localhost:6379 in dev
```

**All required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role (keep secret!)
- `OPENAI_API_KEY` - Your OpenAI API key
- `REDIS_URL` - Redis connection (default: `redis://localhost:6379`)

**See:** [Environment Setup Guide](SETUP_GUIDE.md)

### Step 4: Start Services

```bash
# Start Docker services (Redis + Supabase)
docker-compose -f docker/docker-compose.dev.yml up -d

# Verify Redis is running
npm run redis:cli ping
# Should output: PONG
```

### Step 5: Running the Application

```bash
# Option A: Development server only
npm run dev
# Visit http://localhost:3000

# Option B: Full development (dev server + tests)
npm run dev:full
# Runs server + unit tests + E2E tests in watch mode

# Option C: Automated setup
bash scripts/setup.sh
# Runs full setup + starts everything
```

**If port 3000 is in use:**
```bash
# Kill processes using port 3000
pkill -f "next dev"

# Or find what's using it
lsof -i :3000
```

### Step 6: Verify Setup

```bash
# Run the setup verification script
bash scripts/check-test-environment.sh

# Expected output: All checks pass
# ✅ Node.js installed
# ✅ npm installed
# ✅ Dependencies installed
# ✅ .env.local exists
# ✅ Docker is running
# ✅ Redis is running
# ✅ Supabase credentials configured
```

---

## First Contribution

### 1. Create a Feature Branch

```bash
# Create and switch to new branch
git checkout -b feature/my-feature-name

# Branch naming convention:
# feature/short-description
# fix/bug-description
# refactor/what-you-refactored
# docs/what-you-documented
```

### 2. Make Your Changes

```bash
# Edit files in your editor
# Follow the project conventions:
# - Use TypeScript strict mode
# - Keep files under 300 LOC
# - Write tests for new code
```

### 3. Test Your Changes

```bash
# Run tests
npm test

# Run all checks
npm run check:all

# Run E2E tests
npm run test:e2e:watch
```

### 4. Commit Your Work

```bash
# Stage your changes
git add .

# Commit with clear message
git commit -m "feat: add new feature description"

# Commit message format:
# feat: new feature
# fix: bug fix
# docs: documentation update
# refactor: code restructuring
# test: test additions
```

### 5. Push and Create PR

```bash
# Push to remote
git push origin feature/my-feature-name

# Create pull request on GitHub
# Link any related issues
# Describe what you changed and why
```

### 6. Code Review

- Wait for CI/CD to pass
- Respond to review comments
- Push additional commits if needed
- Merge when approved

---

## Common Tasks

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Watch mode (auto-rerun on changes)
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e:watch

# Specific test file
npm test -- path/to/test.spec.ts
```

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Linting and Type Checking

```bash
# Run ESLint
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Type check the entire project
npx tsc --noEmit

# Run all checks
npm run check:all
```

### Database Operations

```bash
# Seed development data
npm run seed:dashboard

# Create seed data script
npm run seed:dev-data

# Check database stats
npx tsx scripts/database/test-database-cleanup.ts stats

# Clean specific domain
npx tsx scripts/database/test-database-cleanup.ts clean --domain=example.com

# Run migrations
npm run migrate:encrypt-credentials
```

### Docker Operations

```bash
# Start Docker services
docker-compose -f docker/docker-compose.dev.yml up -d

# Stop Docker services
docker-compose -f docker/docker-compose.dev.yml down

# View logs
docker-compose logs -f app
docker-compose logs -f redis

# Access container shell
docker exec -it omniops-app sh
```

### Debugging

```bash
# Debug with VSCode
# Press F5 or use Run > Start Debugging

# Debug tests
npm run test:e2e:debug

# Debug with node
node --inspect-brk dist/your-file.js
```

---

## Key Files and Directories

### Essential Files to Know

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and npm scripts |
| `.env.example` | Environment variables template |
| `tsconfig.json` | TypeScript configuration |
| `jest.config.js` | Test configuration |
| `CLAUDE.md` | AI assistant guidelines |

### Important Directories

| Directory | Purpose |
|-----------|---------|
| `app/api/` | API endpoints (routes) |
| `lib/` | Reusable business logic |
| `components/` | React UI components |
| `__tests__/` | All test files |
| `scripts/database/` | Database utilities |
| `docs/` | Project documentation |

---

## Getting Help

### Finding Answers

1. **Documentation First**
   - Browse `/docs` directory
   - [README.md](../../README.md) for overview
   - Specific guide documents: `docs/02-GUIDES/GUIDE_*.md`

2. **Code Examples**
   - Check similar implementations in codebase
   - Look at test files for usage examples
   - See `__tests__/` directory

3. **Project Standards**
   - Read [CLAUDE.md](../../CLAUDE.md) for guidelines
   - Check [Architecture docs](../01-ARCHITECTURE/)
   - Review [Reference docs](../09-REFERENCE/)

### Common Questions

**Q: Where do I add new API endpoints?**
A: Create a route in `app/api/[feature]/route.ts` and add tests in `__tests__/api/`

**Q: How do I add a new npm script?**
A: Edit `package.json` scripts section and test with `npm run script-name`

**Q: How should I structure new components?**
A: Look at examples in `components/ui/` - follow the same pattern

**Q: Where should I put new utilities?**
A: Create in `lib/services/` or `lib/utils/` depending on type

**Q: How do I run a specific test?**
A: `npm test -- path/to/test.spec.ts`

**Q: How do I debug E2E tests?**
A: `npm run test:e2e:debug` opens interactive debugger

### Resources

- **TypeScript Help:** [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- **React Help:** [React Documentation](https://react.dev/)
- **Next.js Help:** [Next.js Documentation](https://nextjs.org/docs/)
- **Supabase Help:** [Supabase Docs](https://supabase.com/docs)
- **Playwright Help:** [Playwright Testing](https://playwright.dev/)

### Getting in Touch

- **Code Issues:** Create GitHub issue with details
- **Architecture Questions:** Check `docs/01-ARCHITECTURE/`
- **API Issues:** See `docs/09-REFERENCE/REFERENCE_API_ENDPOINTS.md`
- **Database Issues:** See `docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md`

---

## Next Steps

### 1. Explore the Codebase
- Start with `app/api/chat/route.ts` (main chat endpoint)
- Look at `lib/embeddings.ts` (AI features)
- Review `__tests__/playwright/` (user workflows)

### 2. Run Your First Tests
```bash
npm run test:unit                    # See tests pass
npm run test:e2e:watch              # Interactive E2E testing
```

### 3. Make a Small Change
- Fix a typo in comments
- Update a test
- Improve documentation
- Get comfortable with the workflow

### 4. Contribute a Feature
- Pick a "good first issue" from GitHub
- Follow the contribution process above
- Get code reviewed
- Celebrate your first merged PR!

### 5. Deep Dive Topics
- [Search Architecture](../01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md) - How search works
- [Database Schema](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) - Complete database
- [Performance Guide](../09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md) - Optimization
- [Testing Philosophy](../../CLAUDE.md#testing--code-quality-philosophy) - Testing approach
- [Brand-Agnostic Design](../../CLAUDE.md#-critical-brand-agnostic-application) - Multi-tenant architecture

---

## Quick Command Reference

```bash
# Setup
npm install                         # Install dependencies
bash scripts/setup.sh               # Automated setup
docker-compose up -d                # Start services

# Development
npm run dev                          # Start dev server
npm run dev:full                     # Dev + tests + E2E

# Testing
npm test                             # Run tests
npm run test:watch                   # Watch mode
npm run test:e2e:watch              # E2E watch mode

# Quality
npm run lint                         # Check linting
npm run lint:fix                     # Fix issues
npm run check:all                    # All checks

# Building
npm run build                        # Build for production
npm start                            # Run production build

# Docker
docker-compose up -d                 # Start services
docker-compose down                  # Stop services

# Database
npm run seed:dashboard               # Seed sample data
npm run migrate:encrypt-credentials  # Run migration
```

---

## Troubleshooting

**See:** [TROUBLESHOOTING_DEVELOPMENT.md](TROUBLESHOOTING_DEVELOPMENT.md) for common issues and solutions.

---

## Success Checklist

After setup, verify:
- [ ] Node.js v18+ installed
- [ ] npm dependencies installed
- [ ] Docker running
- [ ] `.env.local` configured
- [ ] `npm run dev` starts server on port 3000
- [ ] `npm test` passes all tests
- [ ] `npm run check:all` passes
- [ ] You can access http://localhost:3000
- [ ] VSCode and debugging work
- [ ] You've read [CLAUDE.md](../../CLAUDE.md)

Welcome to the team! You're ready to contribute. Start with a small change and work your way up to bigger features.
