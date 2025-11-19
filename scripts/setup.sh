#!/bin/bash

#############################################
# OmniOps Automated Setup Script
#
# Complete setup for local development
# - Validates prerequisites
# - Installs dependencies
# - Configures environment
# - Starts Docker services
# - Seeds development data
# - Verifies setup
#
# Usage: bash scripts/setup.sh
#############################################

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'  # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    OmniOps Development Environment Setup${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

# Cleanup function
cleanup_on_error() {
  echo -e "\n${RED}Setup failed. Please check the error above.${NC}"
  exit 1
}
trap cleanup_on_error ERR

#############################################
# STEP 1: Validate Prerequisites
#############################################
echo -e "${YELLOW}Step 1: Validating prerequisites...${NC}\n"

check_command() {
  if ! command -v "$1" &>/dev/null; then
    echo -e "${RED}✗ $2 not found${NC}"
    echo -e "  Install from: $3"
    return 1
  fi
  echo -e "${GREEN}✓ $2 installed${NC}"
  return 0
}

check_command "node" "Node.js" "https://nodejs.org/"
check_command "npm" "npm" "https://npmjs.com/"
check_command "docker" "Docker" "https://docker.com/products/docker-desktop"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}✗ Node.js v18+ required (found v$NODE_VERSION)${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Node.js version OK (v$NODE_VERSION)${NC}\n"

#############################################
# STEP 2: Install Dependencies
#############################################
echo -e "${YELLOW}Step 2: Installing dependencies...${NC}\n"

if [ ! -d "node_modules" ]; then
  echo "Running npm install..."
  npm install
  echo -e "${GREEN}✓ Dependencies installed${NC}\n"
else
  echo -e "${GREEN}✓ Dependencies already installed${NC}\n"
fi

#############################################
# STEP 3: Configure Environment
#############################################
echo -e "${YELLOW}Step 3: Configuring environment...${NC}\n"

if [ ! -f ".env.local" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env.local
    echo -e "${GREEN}✓ Created .env.local from .env.example${NC}"
    echo -e "${YELLOW}⚠  Update .env.local with your credentials:${NC}"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo "   - OPENAI_API_KEY"
    echo ""
  else
    echo -e "${RED}✗ .env.example not found${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✓ .env.local already exists${NC}\n"
fi

#############################################
# STEP 4: Start Docker Services
#############################################
echo -e "${YELLOW}Step 4: Starting Docker services...${NC}\n"

# Check if Docker is running
if ! docker ps &>/dev/null; then
  echo -e "${YELLOW}⚠  Docker is not running${NC}"
  echo "   Starting Docker Desktop..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    open -a "Docker" || {
      echo -e "${RED}✗ Could not start Docker automatically${NC}"
      echo "   Please start Docker Desktop manually and run this script again"
      exit 1
    }
    sleep 5  # Wait for Docker to start
  else
    echo -e "${YELLOW}⚠  Please start Docker and run this script again${NC}"
    exit 1
  fi
fi

# Start Docker services
echo "Stopping any existing services..."
docker-compose -f docker/docker-compose.dev.yml down 2>/dev/null || true

echo "Starting Docker services (Redis, etc.)..."
docker-compose -f docker/docker-compose.dev.yml up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 2

# Check Redis
if npm run redis:cli ping &>/dev/null; then
  echo -e "${GREEN}✓ Docker services started${NC}\n"
else
  echo -e "${YELLOW}⚠  Docker services may still be starting...${NC}\n"
fi

#############################################
# STEP 5: Run Validations
#############################################
echo -e "${YELLOW}Step 5: Running validations...${NC}\n"

# Validate environment
if [ -f "scripts/validate-env.sh" ]; then
  bash scripts/validate-env.sh || {
    echo -e "${YELLOW}⚠  Environment validation warnings (non-fatal)${NC}\n"
  }
else
  echo -e "${GREEN}✓ Environment configured${NC}\n"
fi

#############################################
# STEP 6: Lint Check
#############################################
echo -e "${YELLOW}Step 6: Running code quality checks...${NC}\n"

# TypeScript check
echo "Checking TypeScript..."
npx tsc --noEmit || {
  echo -e "${YELLOW}⚠  TypeScript errors found${NC}"
  echo "   Run: npm run lint:fix"
  echo ""
}

echo -e "${GREEN}✓ Quality checks complete${NC}\n"

#############################################
# STEP 7: Optional: Seed Data
#############################################
read -p "Do you want to create sample development data? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Step 7: Creating seed data...${NC}\n"
  npx tsx scripts/database/seed-dev-data.ts
  echo -e "${GREEN}✓ Seed data created${NC}\n"
else
  echo -e "${YELLOW}Skipped seed data creation${NC}\n"
fi

#############################################
# STEP 8: Next Steps
#############################################
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}\n"

echo -e "${BLUE}📝 Next Steps:${NC}\n"

echo "1. Update credentials in .env.local:"
echo "   ${YELLOW}code .env.local${NC}"
echo ""

echo "2. Start development server:"
echo "   ${YELLOW}npm run dev${NC}"
echo "   or full development (with tests):"
echo "   ${YELLOW}npm run dev:full${NC}"
echo ""

echo "3. Open in browser:"
echo "   ${YELLOW}http://localhost:3000${NC}"
echo ""

echo "4. Read documentation:"
echo "   ${YELLOW}cat docs/00-GETTING-STARTED/ONBOARDING.md${NC}"
echo ""

echo -e "${BLUE}📚 Common Commands:${NC}\n"
echo "   npm test              # Run tests"
echo "   npm run lint          # Check code style"
echo "   npm run test:e2e      # Run E2E tests"
echo "   npm run build         # Build for production"
echo "   make help             # Show all commands (if Makefile exists)"
echo ""

echo -e "${BLUE}🐳 Docker Commands:${NC}\n"
echo "   docker-compose ps                                 # Check services"
echo "   docker-compose logs -f redis                      # View Redis logs"
echo "   docker-compose down                               # Stop services"
echo ""

echo -e "${BLUE}💡 Tips:${NC}\n"
echo "   - Keep Docker running while developing"
echo "   - Run 'npm run dev:full' for best development experience"
echo "   - Check CLAUDE.md for project guidelines"
echo "   - Use 'npm run check:all' before committing"
echo ""

echo -e "${GREEN}Happy coding! 🚀${NC}\n"
