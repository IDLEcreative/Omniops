# Getting Started Guide for New Developers

Welcome to the OmniOps AI Customer Service Platform! This guide will help you set up your development environment and understand the codebase on your first day.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Your First Tasks](#your-first-tasks)
- [Understanding the Codebase](#understanding-the-codebase)
- [Development Workflow](#development-workflow)
- [Key Concepts to Learn](#key-concepts-to-learn)
- [Common Commands Reference](#common-commands-reference)
- [Troubleshooting Setup](#troubleshooting-setup)
- [Next Steps](#next-steps)
- [Getting Help](#getting-help)

## Prerequisites

### Required Software

Before you begin, ensure you have the following installed:

1. **Node.js 18+** (LTS version recommended)
   ```bash
   node --version  # Should be v18.0.0 or higher
   ```
   Download from: https://nodejs.org/

2. **Docker Desktop** (Version 28.3.2 or later)
   ```bash
   docker --version
   ```
   Download from: https://www.docker.com/products/docker-desktop

3. **Git** (latest version)
   ```bash
   git --version
   ```

4. **Code Editor** - We recommend VS Code with these extensions:
   - ESLint
   - TypeScript and JavaScript Language Features
   - Prettier - Code formatter
   - Tailwind CSS IntelliSense

### Required Accounts

You'll need accounts for:

1. **Supabase** (https://supabase.com)
   - Free tier is sufficient for development
   - Provides PostgreSQL database with pgvector extension

2. **OpenAI** (https://platform.openai.com)
   - Required for AI chat and embeddings
   - Get API key from https://platform.openai.com/api-keys

3. **Optional but helpful:**
   - GitHub account (for contributing code)
   - Redis Cloud account (if not using local Docker Redis)

### Knowledge Prerequisites

This project uses:
- **TypeScript 5** - Strict mode enabled
- **Next.js 15** - App Router (not Pages Router)
- **React 19** - Latest features including Server Components
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - PostgreSQL with real-time capabilities

Don't worry if you're not familiar with all of these - you'll learn as you go!

## Initial Setup

Follow these steps carefully to set up your development environment:

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone <repository-url>
cd Omniops

# Verify you're in the right directory
pwd  # Should show path ending in /Omniops
```

### Step 2: Install Dependencies

```bash
# Install all project dependencies
npm install

# This may take 2-3 minutes
```

**Expected output:** You should see npm downloading packages and building dependencies. No errors should appear.

### Step 3: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Open the file in your editor
code .env.local  # or use your preferred editor
```

Now fill in the required values:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Encryption Key (generate with: openssl rand -base64 32)
ENCRYPTION_KEY=your-32-character-encryption-key

# Optional: WooCommerce (for e-commerce features)
# WOOCOMMERCE_URL=https://your-store.com
# WOOCOMMERCE_CONSUMER_KEY=ck_your_key
# WOOCOMMERCE_CONSUMER_SECRET=cs_your_secret
```

**How to get Supabase credentials:**
1. Go to https://supabase.com and create a new project
2. Navigate to Settings > API
3. Copy the "Project URL" (NEXT_PUBLIC_SUPABASE_URL)
4. Copy the "anon public" key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
5. Copy the "service_role" key (SUPABASE_SERVICE_ROLE_KEY) - **Keep this secret!**

**Generate encryption key:**
```bash
openssl rand -base64 32
```

### Step 4: Start Docker Services

```bash
# Start Docker Desktop first (macOS)
open -a "Docker"

# Wait for Docker to fully start (look for whale icon in menu bar)

# Start Redis and other services
docker-compose -f docker-compose.dev.yml up -d

# Verify services are running
docker-compose ps
```

**Expected output:**
```
NAME                IMAGE           STATUS
omniops-redis       redis:7-alpine  Up About a minute (healthy)
```

### Step 5: Set Up the Database

Your Supabase project needs the database schema. You have two options:

**Option A: Using Supabase Dashboard (Recommended for first-time setup)**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the schema from `docs/01-ARCHITECTURE/database-schema.md` or ask a team member for the latest migration file
4. Run the SQL to create all tables

**Option B: Using Supabase CLI (Advanced)**
```bash
# If you have migrations already set up
npx supabase db push
```

### Step 6: Verify Setup

```bash
# Check that TypeScript compiles without errors
npx tsc --noEmit

# You should see: No output means success!

# Check for dependency issues
npm run check:deps

# Run linting to verify code style setup
npm run lint
```

### Step 7: Start the Development Server

```bash
# Start the Next.js development server
npm run dev
```

**Expected output:**
```
▲ Next.js 15.1.3
- Local:        http://localhost:3000
- Ready in 3.2s
```

**Checkpoint:** Open http://localhost:3000 in your browser. You should see the application running!

## Your First Tasks

Let's verify everything is working by completing these hands-on exercises:

### Task 1: Make Your First API Call

Open a new terminal (keep the dev server running) and test the chat API:

```bash
# Test the chat endpoint with curl
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how can you help me?",
    "domain": "test.example.com"
  }'
```

**Expected response:** You should see a JSON response with an AI-generated message.

**If this fails:** Check that:
- Your OpenAI API key is valid in `.env.local`
- The dev server is running on port 3000
- No errors appear in the dev server terminal

### Task 2: View the Database

1. Go to your Supabase project dashboard
2. Navigate to Table Editor
3. Find the `customer_configs` table
4. You should see the database structure (may be empty)

**Checkpoint:** Can you see tables like `customer_configs`, `conversations`, `messages`, and `scraped_pages`?

### Task 3: Run the Test Suite

```bash
# Run all tests
npm test

# You should see tests passing (some may be skipped)
```

**Expected output:**
```
Test Suites: X passed, X total
Tests:       X passed, X total
```

**If tests fail:** This is okay on first run! Some tests may need environment setup. Take note of failures and ask for help.

### Task 4: Make a Small Code Change

Let's make a simple change to verify hot reload:

1. Open `app/page.tsx` in your editor
2. Find any text on the page
3. Change it to something else
4. Save the file
5. Look at your browser (http://localhost:3000)

**Checkpoint:** Did the page update automatically without refreshing? That's hot module replacement in action!

## Understanding the Codebase

### Project Structure Overview

```
Omniops/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes (backend endpoints)
│   │   ├── chat/         # AI chat endpoint
│   │   ├── scrape/       # Web scraping endpoints
│   │   ├── woocommerce/  # E-commerce integration
│   │   └── privacy/      # GDPR/CCPA compliance
│   ├── embed/            # Embeddable chat widget
│   └── page.tsx          # Homepage
├── lib/                   # Core business logic (IMPORTANT!)
│   ├── supabase/         # Database clients
│   ├── embeddings.ts     # AI vector search
│   ├── crawler-config.ts # Web scraping setup
│   └── rate-limit.ts     # API rate limiting
├── components/            # React components
│   └── ui/               # Reusable UI components
├── public/               # Static files
│   └── embed.js         # Widget embed script
├── docs/                 # Documentation (you're here!)
├── __tests__/            # Test files
└── types/                # TypeScript definitions
```

### Key Directories Explained

**`app/api/`** - All backend API endpoints
- Each folder is a route (e.g., `api/chat/route.ts` → `/api/chat`)
- Routes export `GET`, `POST`, etc. functions
- Uses Zod for request validation

**`lib/`** - Where the magic happens
- Pure business logic (no React/UI code)
- Can be used by API routes or components
- Class-based services for complex features
- **Most of your work will likely be here**

**`components/`** - React UI components
- Use Radix UI primitives for accessibility
- Styled with Tailwind CSS
- Server Components by default (use 'use client' when needed)

**`public/`** - Static assets
- `embed.js` is the customer-facing widget script
- Served directly at `/embed.js`

### Important Files to Read

Before writing code, read these files to understand the system:

1. **`CLAUDE.md`** (root) - Development guidelines and philosophy
2. **`README.md`** (root) - Project overview and features
3. **`docs/01-ARCHITECTURE/database-schema.md`** - Complete database schema
4. **`docs/SEARCH_ARCHITECTURE.md`** - How RAG and search works
5. **`lib/config.ts`** - Feature flags and configuration

### Architecture Quick Summary

This is a **multi-tenant SaaS application** where:

- **Multi-tenant** = One codebase serves multiple customers
- Each customer is identified by their domain (e.g., `store1.com`, `store2.com`)
- Data is isolated per domain (via Row Level Security)
- No hardcoding of business-specific information (see brand-agnostic-checklist.md)

**Three-layer architecture:**
1. **API Layer** (`app/api/`) - Handles HTTP requests/responses
2. **Service Layer** (`lib/`) - Business logic and data processing
3. **Data Layer** (Supabase) - PostgreSQL with vector search

## Development Workflow

### Daily Development Routine

```bash
# 1. Start Docker (if not already running)
open -a "Docker"

# 2. Start Redis
docker-compose -f docker-compose.dev.yml up -d

# 3. Start development server
npm run dev

# 4. Start coding! The app auto-reloads on file changes
```

### Making Changes Safely

**Before editing any file:**

1. **Read the entire file first** - Don't make assumptions
2. **Check for related files** - Use search to find usages
3. **Understand the context** - Why does this code exist?

**Example workflow for adding a feature:**

```bash
# 1. Create a feature branch
git checkout -b feature/my-new-feature

# 2. Make your changes in small commits
git add lib/my-new-file.ts
git commit -m "feat: add my new feature"

# 3. Run tests frequently
npm test

# 4. Check types and linting
npm run check:all

# 5. Push when ready
git push origin feature/my-new-feature
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage
```

**Test file locations:**
- `__tests__/api/` - API route tests
- `__tests__/lib/` - Business logic tests
- `__tests__/components/` - Component tests

### Git Workflow

**Commit message format (Conventional Commits):**
```
feat: add customer verification
fix: resolve rate limiting bug
docs: update API documentation
test: add tests for chat endpoint
refactor: simplify embedding logic
```

**Pull Request Process:**
1. Create feature branch from `main`
2. Make changes and commit
3. Run `npm run check:all` - must pass!
4. Push branch and open PR
5. Request review from team
6. Address feedback
7. Merge when approved

## Key Concepts to Learn

### 1. Multi-Tenancy

**What it means:** One codebase serves many customers, each isolated by domain.

**Example:**
```typescript
// ❌ NEVER hardcode customer data
const products = await getProducts('example.com');

// ✅ ALWAYS use the domain from the request
const products = await getProducts(domain);
```

**Why it matters:** Hardcoding breaks the system for other customers. See `docs/00-GETTING-STARTED/brand-agnostic-checklist.md` for details.

### 2. Brand-Agnostic Design

**Critical rule:** This system must work for ANY business type:
- E-commerce stores
- Restaurants
- Healthcare providers
- Real estate agencies
- Service businesses

**Never assume:**
- What products look like
- Industry-specific terminology
- Business workflows
- Currency or location

### 3. RAG (Retrieval-Augmented Generation)

**What it is:** AI that searches your data before answering.

**How it works:**
1. User asks: "What are your return policies?"
2. System searches website content embeddings
3. Finds relevant pages about returns
4. Sends context + question to AI
5. AI answers based on actual website content

**Key file:** `lib/embeddings.ts`

**Learn more:** `docs/SEARCH_ARCHITECTURE.md`

### 4. Vector Search with pgvector

**What it is:** Semantic search using AI embeddings.

**Example:**
- Traditional search: "refund" only matches exact word
- Vector search: "refund" matches "return policy", "money back guarantee", etc.

**How it's stored:** PostgreSQL with pgvector extension (1536 dimensions)

### 5. WooCommerce Integration

**What it does:** Connects to customer's WooCommerce store for:
- Real-time order tracking
- Inventory levels
- Customer verification
- Product information

**Key files:**
- `lib/woocommerce-dynamic.ts` - Main API client
- `app/api/woocommerce/` - Integration endpoints

**Learn more:** `docs/woocommerce/WOOCOMMERCE_INTEGRATION.md`

## Common Commands Reference

### Development Commands

```bash
npm run dev              # Start dev server (port 3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Check code style
npm run lint:fix         # Auto-fix linting issues
```

### Testing Commands

```bash
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### Database Commands

```bash
# Cleanup scraped data
npx tsx test-database-cleanup.ts stats              # View stats
npx tsx test-database-cleanup.ts clean              # Clean all
npx tsx test-database-cleanup.ts clean --domain=X   # Clean domain

# Embeddings health
npx tsx monitor-embeddings-health.ts check          # Health check
npx tsx monitor-embeddings-health.ts auto           # Auto-fix issues
```

### Docker Commands

```bash
# Start services
docker-compose -f docker-compose.dev.yml up -d

# Stop services
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose logs -f redis

# Check status
docker-compose ps
```

### Type Checking

```bash
npx tsc --noEmit         # Check TypeScript types
npm run check:all        # Run all checks (deps + lint + types)
```

## Troubleshooting Setup

### Problem: Port 3000 Already in Use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Kill existing Next.js processes
pkill -f "next dev"

# Or find and kill the specific process
lsof -i :3000
kill -9 <PID>

# Then restart
npm run dev
```

### Problem: Docker Not Running

**Symptoms:**
```
Cannot connect to the Docker daemon
```

**Solution:**
```bash
# macOS: Start Docker Desktop
open -a "Docker"

# Wait for Docker icon to appear in menu bar

# Verify Docker is running
docker ps
```

### Problem: Redis Connection Failed

**Symptoms:**
```
Error: Redis connection to localhost:6379 failed
```

**Solution:**
```bash
# Check if Redis is running
docker-compose ps

# If not running, start it
docker-compose -f docker-compose.dev.yml up -d redis

# Check logs
docker-compose logs redis
```

### Problem: Database Connection Errors

**Symptoms:**
```
Error: connect ECONNREFUSED
```

**Solution:**
1. Verify Supabase credentials in `.env.local`
2. Check Supabase project is active (not paused)
3. Test connection in Supabase dashboard
4. Ensure no firewall blocking connections

**Verify credentials:**
```bash
# Check your .env.local has these set
grep SUPABASE .env.local
```

### Problem: OpenAI API Key Invalid

**Symptoms:**
```
Error: Incorrect API key provided
```

**Solution:**
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Update in `.env.local`
4. Restart dev server

**Note:** API keys start with `sk-`

### Problem: TypeScript Errors in Editor

**Symptoms:** Red squiggly lines everywhere, but app runs fine

**Solution:**
```bash
# Restart TypeScript server in VS Code
# Command Palette (Cmd+Shift+P) → "TypeScript: Restart TS Server"

# Or reload window
# Command Palette → "Developer: Reload Window"
```

### Problem: npm install Fails

**Symptoms:**
```
npm ERR! code ERESOLVE
```

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If still failing, try legacy peer deps
npm install --legacy-peer-deps
```

## Next Steps

### Recommended Learning Path

Now that your environment is set up, here's what to learn next:

**Week 1: Understand the Architecture**
1. Read `docs/ARCHITECTURE.md` - Overall system design
2. Read `docs/SEARCH_ARCHITECTURE.md` - How RAG works
3. Read `docs/01-ARCHITECTURE/database-schema.md` - Database structure
4. Explore the codebase with VS Code search

**Week 2: Dive into Features**
1. Study the chat system (`app/api/chat/route.ts`)
2. Understand embeddings (`lib/embeddings.ts`)
3. Explore WooCommerce integration (`lib/woocommerce-dynamic.ts`)
4. Review web scraping (`lib/crawler-config.ts`)

**Week 3: Start Contributing**
1. Pick a "good first issue" from the issue tracker
2. Make a small bug fix or documentation improvement
3. Write tests for your changes
4. Submit your first PR!

### Deeper Documentation

**Architecture & Design:**
- `docs/01-ARCHITECTURE/` - System architecture details
- `docs/PERFORMANCE_OPTIMIZATION.md` - Performance patterns
- `docs/DEPENDENCY_INJECTION.md` - Code organization patterns

**Feature Documentation:**
- `docs/02-FEATURES/` - Detailed feature docs
- `docs/HALLUCINATION_PREVENTION.md` - AI accuracy safeguards
- `docs/DATABASE_CLEANUP.md` - Data management

**API Reference:**
- `docs/03-API/` - API endpoint documentation
- `docs/API_REFERENCE.md` - Complete API guide

**Development Guides:**
- `docs/04-DEVELOPMENT/` - Development best practices
- `docs/TESTING.md` - Testing strategies
- `docs/ERROR_HANDLING.md` - Error handling patterns

### Recommended Reading Order

1. Start here: `README.md` (project overview)
2. Then read: `CLAUDE.md` (development philosophy)
3. Next: `docs/00-GETTING-STARTED/brand-agnostic-checklist.md` (critical!)
4. Then: `docs/00-GETTING-STARTED/glossary.md` (terminology)
5. Finally: Explore `docs/` based on what you're working on

### Practice Exercises

**Exercise 1: Add a Simple API Endpoint**
Create a new endpoint at `/api/hello` that returns your name:

```typescript
// app/api/hello/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Hello from [Your Name]!'
  });
}
```

Test it: http://localhost:3000/api/hello

**Exercise 2: Query the Database**
Add code to fetch customers from Supabase:

```typescript
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('customer_configs')
    .select('domain')
    .limit(10);

  return NextResponse.json({ customers: data });
}
```

**Exercise 3: Write a Test**
Create a test file for your hello endpoint:

```typescript
// __tests__/api/hello/route.test.ts
import { GET } from '@/app/api/hello/route';

describe('GET /api/hello', () => {
  it('returns a greeting', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.message).toContain('Hello');
  });
});
```

Run it: `npm test hello`

## Getting Help

### Where to Find Answers

**Documentation Search:**
1. Use VS Code search (Cmd+Shift+F) in the `docs/` folder
2. Check the Table of Contents in main docs
3. Look for README files in feature directories

**Code Search:**
1. Use GitHub/GitLab search for code examples
2. Search for similar patterns in existing code
3. Check test files for usage examples

**Understanding Errors:**
1. Read the full error message (don't skip stack traces!)
2. Search error message in codebase (might be handled elsewhere)
3. Check `docs/ERROR_HANDLING.md` for common errors
4. Look in `docs/06-TROUBLESHOOTING/` for solutions

### Who to Ask

**For technical questions:**
- Check team documentation first
- Ask in team chat/Slack
- Tag relevant team members
- Be specific: "I'm trying to X, I expected Y, but got Z"

**For architecture decisions:**
- Review `CLAUDE.md` and `docs/ARCHITECTURE.md` first
- Ask senior developers
- Bring examples of what you want to do

**For urgent blockers:**
- Share full error output
- Explain what you've already tried
- Provide steps to reproduce

### Documentation Resources

**Quick References:**
- `CLAUDE.md` - Development guidelines
- `docs/QUICK_REFERENCE.md` - Common tasks
- `docs/00-GETTING-STARTED/glossary.md` - Terminology
- `docs/NPX_TOOLS_GUIDE.md` - Available utilities

**Complete Guides:**
- `README.md` - Feature overview
- `docs/01-ARCHITECTURE/database-schema.md` - Database schema
- `docs/SEARCH_ARCHITECTURE.md` - Search system
- `docs/TESTING.md` - Testing practices

**Video/Interactive:**
- Ask team for onboarding session recording
- Pair programming with senior developers
- Team standup meetings
- Architecture review sessions

### Best Practices for Asking Questions

**Good question format:**
```
I'm trying to: [what you want to accomplish]
I expected: [what you thought would happen]
Instead: [what actually happened]
I've tried: [what you already attempted]
Error message: [paste full error]
Code: [relevant code snippet]
```

**Example:**
```
I'm trying to: Add a new field to customer_configs table
I expected: Migration to run successfully
Instead: Getting error "column already exists"
I've tried: Dropping and recreating the migration
Error message: [paste error]
Related file: supabase/migrations/20240101_add_field.sql
```

### Tips for Success

**Do:**
- Read documentation before asking
- Search codebase for examples
- Include context in questions
- Share what you've tried
- Ask follow-up questions

**Don't:**
- Ask questions already answered in docs
- Share partial error messages
- Skip reading error outputs
- Assume someone knows your context
- Be afraid to ask "dumb" questions (there aren't any!)

---

## Welcome to the Team!

You're now set up and ready to contribute to OmniOps. Remember:

1. **Read first, code second** - Understand before changing
2. **Test everything** - Write tests for your changes
3. **Ask questions** - We're here to help
4. **Document as you go** - Help future developers
5. **Have fun!** - Building cool AI stuff is exciting

**Your first task:** Introduce yourself in the team chat and share what you learned from this guide!

Happy coding! 🚀
