# Getting Started with OmniOps

A 5-minute quick start guide to get OmniOps running on your local machine.

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop)
- **OpenAI API Key** - [Get one here](https://platform.openai.com/api-keys)
- **Supabase Account** - [Sign up here](https://supabase.com)

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
git clone <repository-url>
cd Omniops
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials
```

**Required environment variables:**

```bash
# Supabase (get from: https://supabase.com/dashboard/project/_/settings/api)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (get from: https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-your-api-key-here

# Redis (use default for local development)
REDIS_URL=redis://localhost:6379

# Encryption (generate with: openssl rand -base64 32)
ENCRYPTION_KEY=your-32-char-encryption-key
```

### 3. Start Services

```bash
# Start Docker Desktop (macOS)
open -a "Docker"

# Start Redis
docker-compose -f docker-compose.dev.yml up -d

# Verify Redis is running
docker-compose ps
```

### 4. Set Up Database

**Option A: Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy schema from `docs/01-ARCHITECTURE/database-schema.md`
4. Run the SQL to create tables

**Option B: Supabase CLI**
```bash
npx supabase db push
```

### 5. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 - you should see the application running!

## Verify Your Setup

### Test the Health Endpoint

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-24T..."
}
```

### Test the Chat Widget

Visit http://localhost:3000/embed to see the embeddable chat widget.

### Test the Chat API

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, what can you help me with?",
    "domain": "test.example.com"
  }'
```

You should receive an AI-generated response!

## Common Issues

### Port 3000 Already in Use

```bash
# Kill existing processes
pkill -f "next dev"

# Or find and kill specific process
lsof -i :3000
kill -9 <PID>
```

### Docker Not Running

```bash
# macOS: Start Docker Desktop
open -a "Docker"

# Wait for Docker icon in menu bar
docker ps  # Verify it's running
```

### Redis Connection Failed

```bash
# Check if Redis is running
docker-compose ps

# Restart Redis
docker-compose -f docker-compose.dev.yml up -d redis

# Check logs
docker-compose logs redis
```

### Database Connection Errors

1. Verify credentials in `.env.local`
2. Check Supabase project is active (not paused)
3. Test connection in Supabase dashboard
4. Ensure firewall isn't blocking connections

## Next Steps

Now that you're up and running:

1. **Read the full developer guide**: [docs/00-GETTING-STARTED/for-developers.md](00-GETTING-STARTED/for-developers.md)
2. **Understand the architecture**: [docs/01-ARCHITECTURE/](01-ARCHITECTURE/)
3. **Learn about key features**: [docs/02-FEATURES/](02-FEATURES/)
4. **Explore the API**: [docs/03-API/](03-API/)
5. **Development best practices**: [docs/04-DEVELOPMENT/](04-DEVELOPMENT/)

## Essential Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm test                 # Run tests

# Docker
docker-compose up -d                    # Start all services
docker-compose down                     # Stop services
docker-compose logs -f app              # View logs

# Database
npx tsx test-database-cleanup.ts stats  # View data stats
npx tsx test-database-cleanup.ts clean  # Clean scraped data

# Code Quality
npm run lint             # Check code style
npm run type-check       # Check TypeScript
npm run check:all        # Run all checks
```

## Getting Help

- **Documentation**: [docs/README.md](README.md)
- **Troubleshooting**: [docs/06-TROUBLESHOOTING/README.md](06-TROUBLESHOOTING/README.md)
- **Development Guide**: [docs/00-GETTING-STARTED/for-developers.md](00-GETTING-STARTED/for-developers.md)
- **Architecture**: [docs/ARCHITECTURE.md](ARCHITECTURE.md)

## Development Workflow

```bash
# 1. Start Docker (if not running)
open -a "Docker"

# 2. Start Redis
docker-compose -f docker-compose.dev.yml up -d

# 3. Start dev server
npm run dev

# 4. Make changes (hot reload enabled)

# 5. Run tests
npm test

# 6. Check types
npm run type-check

# 7. Commit with conventional commits
git commit -m "feat: add new feature"
```

## Important Notes

### Multi-Tenant Architecture

This is a **multi-tenant, brand-agnostic** system:
- Never hardcode company names, products, or business-specific data
- All business data comes from the database, not code
- System must work for ANY business type (e-commerce, restaurants, healthcare, etc.)

See [docs/00-GETTING-STARTED/brand-agnostic-checklist.md](00-GETTING-STARTED/brand-agnostic-checklist.md) for details.

### File Length Limit

All files must be under **300 lines of code** (LOC). If a file exceeds this:
- Refactor into smaller, focused modules
- Extract shared logic into utilities
- Split by responsibility (Single Responsibility Principle)

### Required Reading

Before contributing code, read:
1. **CLAUDE.md** - Development guidelines and philosophy
2. **docs/00-GETTING-STARTED/brand-agnostic-checklist.md** - Critical multi-tenant rules
3. **docs/01-ARCHITECTURE/database-schema.md** - Database structure
4. **docs/SEARCH_ARCHITECTURE.md** - How RAG and search works

## Welcome!

You're now ready to start developing with OmniOps. Remember:
- Read documentation before coding
- Test everything
- Ask questions
- Keep code simple and maintainable

Happy coding! 🚀
