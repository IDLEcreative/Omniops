# Development Troubleshooting Guide

**Type:** Troubleshooting
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 10 minutes

## Quick Fix Index

| Problem | Solution |
|---------|----------|
| Port 3000 already in use | [Port 3000 Already in Use](#port-3000-already-in-use) |
| Docker not running | [Docker Not Running](#docker-not-running) |
| Database connection error | [Database Connection Error](#database-connection-error) |
| Redis connection error | [Redis Connection Error](#redis-connection-error) |
| Environment variables missing | [Environment Variables Not Loaded](#environment-variables-not-loaded) |
| Build fails with errors | [Build Errors](#build-errors) |
| Tests fail to run | [Test Failures](#test-failures) |
| TypeScript errors | [TypeScript Errors](#typescript-errors) |
| Supabase connection issues | [Supabase Issues](#supabase-issues) |
| WooCommerce API errors | [WooCommerce API Errors](#woocommerce-api-errors) |
| E2E tests fail | [E2E Test Failures](#e2e-test-failures) |
| Dependencies conflict | [Dependency Issues](#dependency-issues) |

---

## Port 3000 Already in Use

### Symptoms
```
Error: listen EADDRINUSE: address already in use :::3000
```

### Cause
Another process is running on port 3000 (previous dev server, another app, etc.)

### Solution

**Option 1: Kill the process using port 3000**
```bash
# macOS/Linux
pkill -f "next dev"

# Verify port is free
lsof -i :3000
# Should return empty
```

**Option 2: Find what's using the port**
```bash
# Show process using port 3000
lsof -i :3000

# Kill by PID (e.g., PID 12345)
kill 12345
kill -9 12345  # Force kill if needed
```

**Option 3: Use a different port**
```bash
# Start on a different port
PORT=3001 npm run dev

# Update environment if needed
# But default should be 3000
```

### Verify Fix
```bash
npm run dev
# Should start successfully
```

---

## Docker Not Running

### Symptoms
```
Error: Cannot connect to Docker daemon
Error: docker: command not found
Error: connect ECONNREFUSED 127.0.0.1:2375
```

### Cause
Docker Desktop is not installed or not running.

### Solution

**Check if Docker is installed:**
```bash
docker --version
```

**If not installed:**
- Download [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Install following instructions for your OS

**Start Docker:**
```bash
# macOS
open -a "Docker"

# Wait for Docker to fully start
# Check status
docker ps
# Should show: CONTAINER ID    IMAGE    COMMAND...
```

**Restart Docker services:**
```bash
# Stop services
docker-compose -f docker/docker-compose.dev.yml down

# Wait 2 seconds
sleep 2

# Start services again
docker-compose -f docker/docker-compose.dev.yml up -d

# Check status
docker-compose ps
```

### Verify Fix
```bash
docker ps                    # Shows running containers
npm run redis:cli ping       # Should show PONG
```

---

## Database Connection Error

### Symptoms
```
Error: relation "customer_configs" does not exist
Error: Failed to connect to Supabase
Error: ENOENT - No such file or directory: database.json
```

### Cause
- Database not initialized
- Wrong database credentials in `.env.local`
- Supabase not configured
- Database migrations not run

### Solution

**Step 1: Check Supabase credentials**
```bash
# Verify .env.local has Supabase variables
grep "SUPABASE" .env.local

# Should show:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Step 2: Update credentials if needed**
```bash
# Edit .env.local with your Supabase project details
# Get values from: https://app.supabase.com/

# Edit the file
nano .env.local

# Or use your editor
code .env.local
```

**Step 3: Restart dev server**
```bash
# Stop current server
# Press Ctrl+C

# Start again
npm run dev
```

**Step 4: Check database tables exist**
```bash
# Query database
curl -X POST "https://your-project.supabase.co/rest/v1/rpc/show_tables" \
  -H "Authorization: Bearer your-anon-key"
```

**See:** [Supabase Setup Guide](SETUP_SUPABASE.md) for detailed instructions.

### Verify Fix
```bash
# Try API call that uses database
curl "http://localhost:3000/api/health"
# Should return: {"status": "ok"}
```

---

## Redis Connection Error

### Symptoms
```
Error: connect ECONNREFUSED 127.0.0.1:6379
Error: Redis connection failed
Error: connect ENOENT /tmp/redis.sock
```

### Cause
- Redis not running
- Docker Redis container not started
- Wrong Redis URL in `.env.local`

### Solution

**Option 1: Use Docker (Recommended)**
```bash
# Start Redis via Docker
docker-compose -f docker/docker-compose.dev.yml up -d redis

# Verify Redis is running
docker-compose ps

# Should show redis container as 'Up'
```

**Option 2: Check Redis is configured**
```bash
# Verify .env.local has Redis URL
grep "REDIS_URL" .env.local

# If using Docker:
# REDIS_URL=redis://localhost:6379

# If using local Redis:
# REDIS_URL=redis://localhost:6379
```

**Option 3: Restart Redis**
```bash
# Stop Redis
docker-compose -f docker/docker-compose.dev.yml stop redis

# Remove and recreate
docker-compose -f docker/docker-compose.dev.yml down
docker-compose -f docker/docker-compose.dev.yml up -d redis

# Wait 2 seconds for startup
sleep 2

# Test connection
npm run redis:cli ping
# Should show: PONG
```

**Option 4: View Redis logs**
```bash
# See what's wrong with Redis
docker-compose logs redis

# Look for error messages
```

### Verify Fix
```bash
npm run redis:cli ping
# Should output: PONG

npm run queue:stats
# Should show queue statistics
```

---

## Environment Variables Not Loaded

### Symptoms
```
Error: process.env.OPENAI_API_KEY is undefined
Error: Missing environment variable: SUPABASE_URL
```

### Cause
- `.env.local` file doesn't exist
- Wrong filename (should be `.env.local`, not `.env`)
- Environment variables not reloaded after editing

### Solution

**Step 1: Create .env.local file**
```bash
# Copy from example
cp .env.example .env.local

# Verify file exists
ls -la .env.local
# Should show the file
```

**Step 2: Update variables**
```bash
# Edit the file
nano .env.local

# Add your actual values for:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - OPENAI_API_KEY
# - REDIS_URL
```

**Step 3: Reload environment**
```bash
# Stop the dev server (Ctrl+C)

# Start it again
npm run dev

# Environment will be reloaded from .env.local
```

**Step 4: Verify variables loaded**
```bash
# Check if variable is set
node -e "console.log(process.env.OPENAI_API_KEY ? 'Set' : 'Not set')"
```

### Verify Fix
```bash
# Run dev server
npm run dev

# Should not show "undefined" errors
```

---

## Build Errors

### Symptoms
```
Error: Failed to compile
Error: SyntaxError: Unexpected token
error TS1234: Type error in file...
```

### Solution

**Step 1: Clear build artifacts**
```bash
# Remove Next.js build cache
rm -rf .next

# Remove node_modules (if very broken)
rm -rf node_modules
npm install
```

**Step 2: Check for syntax errors**
```bash
# Run TypeScript type check
npx tsc --noEmit

# Look at the error message and line number
# Fix the issue in your editor
```

**Step 3: Build again**
```bash
npm run build

# Check for specific error
```

**Step 4: Common build issues**

**Issue: Import not found**
```typescript
// ❌ Wrong
import { something } from './somefile'  // missing .ts

// ✅ Right
import { something } from './somefile.ts'
```

**Issue: Type not defined**
```typescript
// ❌ Wrong
const user: User = {}  // User type not imported

// ✅ Right
import { User } from '@/types'
const user: User = {}
```

**Issue: Missing dependencies**
```bash
# Install missing package
npm install package-name

# Or check package.json for typos
npm ls
```

### Verify Fix
```bash
npm run build
# Should complete successfully

npm start
# Should start production server
```

---

## Test Failures

### Symptoms
```
FAIL __tests__/unit/example.test.ts
● Test suite failed to compile
● Tests failed
```

### Solution

**Step 1: Run tests with verbose output**
```bash
# See detailed error messages
npm test -- --verbose

# Run specific test file
npm test -- path/to/test.spec.ts
```

**Step 2: Common test issues**

**Issue: Module not found**
```bash
# Reinstall dependencies
npm install

# Clear Jest cache
npx jest --clearCache
```

**Issue: Timeout**
```typescript
// Increase timeout in test
jest.setTimeout(10000)  // 10 seconds

// Or use the third parameter
it('my test', async () => {
  // test code
}, 10000)
```

**Issue: Async test not working**
```typescript
// ❌ Wrong
it('test', () => {
  setTimeout(() => {
    expect(true).toBe(true)
  }, 100)
})

// ✅ Right
it('test', (done) => {
  setTimeout(() => {
    expect(true).toBe(true)
    done()
  }, 100)
})

// Or use async/await
it('test', async () => {
  await new Promise(resolve => setTimeout(resolve, 100))
  expect(true).toBe(true)
})
```

**Step 3: Clear cache and retry**
```bash
# Clear Jest cache
npx jest --clearCache

# Run tests again
npm test
```

### Verify Fix
```bash
npm test
# All tests should pass
```

---

## TypeScript Errors

### Symptoms
```
error TS7006: Parameter 'x' implicitly has an 'any' type
error TS2339: Property 'name' does not exist
error TS2322: Type 'string' is not assignable to type 'number'
```

### Solution

**Step 1: Read the error**
```
error TS2339: Property 'foo' does not exist on type 'Bar'
          ↑ Error code (look up in TypeScript docs)
file.ts:15:4
       ↑ Line and column number
```

**Step 2: Fix the error**

**Issue: Missing type annotation**
```typescript
// ❌ Wrong - 'x' has implicit 'any' type
const func = (x) => x.toUpperCase()

// ✅ Right - Type is explicit
const func = (x: string) => x.toUpperCase()
```

**Issue: Property doesn't exist**
```typescript
// ❌ Wrong - 'foo' doesn't exist
const user = { name: 'John' }
console.log(user.foo)

// ✅ Right - Use correct property
const user = { name: 'John' }
console.log(user.name)
```

**Issue: Type mismatch**
```typescript
// ❌ Wrong - assigning string to number variable
const count: number = "5"

// ✅ Right - Convert to number
const count: number = 5
const count: number = parseInt("5")
```

**Step 3: Type check all files**
```bash
npx tsc --noEmit

# Fix all errors shown
```

### Verify Fix
```bash
npx tsc --noEmit
# Should complete with no errors

npm run check:all
# All checks should pass
```

---

## Supabase Issues

### Symptoms
```
Error: Unauthorized
Error: row-level security policy violation
Error: 401 Unauthorized
```

### Cause
- API keys are wrong
- Row-level security (RLS) policies not configured
- Service role key not provided for admin operations

### Solution

**Step 1: Check API keys**
```bash
# Get correct keys from Supabase dashboard
# https://app.supabase.com/project/[project-ref]/settings/api

# Update .env.local with correct values
nano .env.local

# Verify:
# - NEXT_PUBLIC_SUPABASE_URL matches project URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY is the anon key
# - SUPABASE_SERVICE_ROLE_KEY is the service role key
```

**Step 2: Check RLS policies**
```bash
# View current RLS policies in Supabase dashboard
# Settings > Database > RLS Policies

# For development, you can disable RLS temporarily:
# ⚠️ WARNING: Only for local development!
# In Supabase: Click table > RLS toggle > Disable RLS
```

**Step 3: Use service role key for admin operations**
```typescript
// ❌ Wrong - Using anon key for admin operations
const { data } = await supabaseAnonClient.from('users').select('*')

// ✅ Right - Using service role for admin operations
const { data } = await supabaseServiceClient.from('users').select('*')
```

**See:** [Supabase Setup Guide](SETUP_SUPABASE.md)

### Verify Fix
```bash
# Test Supabase connection
curl -X GET "http://localhost:3000/api/health"
```

---

## WooCommerce API Errors

### Symptoms
```
Error: Invalid API credentials
Error: 401 Unauthorized - Woo API
Error: Connection refused to WooCommerce
```

### Cause
- WooCommerce credentials not set in database
- Wrong API keys
- WooCommerce API not enabled
- Store URL not reachable

### Solution

**Step 1: Verify WooCommerce is set up**
```bash
# Check customer_configs table has WooCommerce credentials
curl "http://localhost:3000/api/woocommerce/check?domain=yourdomain.com"
```

**Step 2: Add WooCommerce credentials**
```bash
# Method 1: Through API
curl -X POST "http://localhost:3000/api/woocommerce/configure" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "yourdomain.com",
    "woocommerceUrl": "https://yourstore.com",
    "consumerKey": "ck_xxxx",
    "consumerSecret": "cs_xxxx"
  }'

# Method 2: Directly in database (for local dev)
# Use Supabase dashboard to edit customer_configs table
```

**Step 3: Get correct API keys**
```
1. Go to your WooCommerce admin: https://yourstore.com/wp-admin
2. Navigate to: Settings > Advanced > REST API
3. Create new API key for OmniOps
4. Copy Consumer Key and Consumer Secret
5. Make sure key has 'Read/Write' permissions
```

**Step 4: Test WooCommerce connection**
```bash
curl "http://localhost:3000/api/woocommerce/test?domain=yourdomain.com"

# Should return:
# {"status": "connected", "version": "3.4.0", ...}
```

### Verify Fix
```bash
# Test API call
curl "http://localhost:3000/api/woocommerce/products?domain=yourdomain.com"

# Should return product list
```

---

## E2E Test Failures

### Symptoms
```
FAIL __tests__/playwright/example.spec.ts
Error: Timeout waiting for page to load
Error: Element not found
```

### Solution

**Step 1: Ensure dev server is running**
```bash
# E2E tests require the dev server running on port 3000
npm run dev

# In another terminal:
npm run test:e2e:watch
```

**Step 2: Debug specific test**
```bash
# Run single test
npx playwright test __tests__/playwright/example.spec.ts

# Run with UI debugger
npm run test:e2e:debug

# View full output
npm run test:e2e -- --verbose
```

**Step 3: Common E2E issues**

**Issue: Element not found**
```typescript
// ❌ Wrong - Selector doesn't match
await page.click('.non-existent-button')

// ✅ Right - Use correct selector
await page.click('button:has-text("Click me")')
```

**Issue: Timeout waiting for element**
```typescript
// ❌ Wrong - Element takes too long
await page.waitForSelector('.slow-element', { timeout: 5000 })

// ✅ Right - Increase timeout
await page.waitForSelector('.slow-element', { timeout: 30000 })
```

**Issue: Network issues**
```bash
# Ensure dev server is accessible
curl http://localhost:3000
# Should return HTML page

# Check if test can reach server
npm run test:e2e:debug
# In debugger, navigate to http://localhost:3000
```

**Step 4: Check browser compatibility**
```bash
# Run tests in specific browser
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit
```

### Verify Fix
```bash
npm run test:e2e:critical
# Core tests should pass
```

---

## Dependency Issues

### Symptoms
```
npm ERR! peer dep missing
Error: Module not found: 'package-name'
npm ERR! conflicting peer dependency
```

### Solution

**Step 1: Check for conflicts**
```bash
# Show dependency tree
npm ls

# Look for red warnings about conflicts
```

**Step 2: Clean and reinstall**
```bash
# Remove all dependencies
rm -rf node_modules package-lock.json

# Reinstall clean
npm install

# Check again
npm ls
```

**Step 3: Update specific package**
```bash
# Update to latest version
npm update package-name

# Or specify version
npm install package-name@latest

# Or specific version
npm install package-name@1.2.3
```

**Step 4: Check for vulnerabilities**
```bash
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Or manually for specific packages
npm update vulnerable-package
```

### Verify Fix
```bash
npm run check:all
# All checks should pass
```

---

## Getting More Help

### When Stuck

1. **Check documentation first**
   - [ONBOARDING.md](ONBOARDING.md) - Getting started
   - [SETUP_GUIDE.md](SETUP_GUIDE.md) - Detailed setup
   - [CLAUDE.md](../../CLAUDE.md) - Project guidelines

2. **Search the codebase**
   - Look for similar patterns
   - Check `__tests__/` for examples
   - Review existing implementations

3. **Check commit history**
   - See how others solved similar issues
   - Look at recent commits for patterns
   - Check pull request discussions

4. **Try simplification**
   - Disable features temporarily
   - Comment out code sections
   - Test in isolation

---

## Quick Validation Script

Run this to verify your setup:

```bash
bash scripts/check-test-environment.sh

# Expected output:
# ✅ Node.js v18+ installed
# ✅ npm v9+ installed
# ✅ Dependencies installed
# ✅ .env.local configured
# ✅ Docker running
# ✅ Redis accessible
# ✅ Supabase configured
```

---

**Still stuck?** Review [ONBOARDING.md](ONBOARDING.md) Getting Help section for additional resources.
