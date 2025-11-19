.PHONY: help install dev dev:full test build clean setup setup:full docker:up docker:down seed lint check all

# Colors for output
BLUE=\033[0;34m
GREEN=\033[0;32m
YELLOW=\033[1;33m
NC=\033[0m

##############################################
# SETUP COMMANDS
##############################################

help:
	@echo "$(BLUE)═══════════════════════════════════════════════════════════$(NC)"
	@echo "$(BLUE)    OmniOps Development Commands$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(GREEN)SETUP$(NC)"
	@echo "  make setup           Setup environment & install dependencies"
	@echo "  make setup:full      Setup + start Docker + seed data"
	@echo "  make install         Install npm dependencies"
	@echo ""
	@echo "$(GREEN)DEVELOPMENT$(NC)"
	@echo "  make dev             Start development server (port 3000)"
	@echo "  make dev:full        Dev server + unit tests + E2E tests"
	@echo "  make dev:restart     Restart development server"
	@echo ""
	@echo "$(GREEN)TESTING$(NC)"
	@echo "  make test            Run all tests (unit + integration)"
	@echo "  make test:unit       Run unit tests only"
	@echo "  make test:integration Run integration tests"
	@echo "  make test:watch      Run tests in watch mode"
	@echo "  make test:e2e        Run E2E tests (Playwright)"
	@echo "  make test:e2e:watch  Interactive E2E testing"
	@echo "  make test:e2e:debug  Debug E2E tests"
	@echo "  make coverage        Generate test coverage report"
	@echo ""
	@echo "$(GREEN)CODE QUALITY$(NC)"
	@echo "  make lint            Run ESLint"
	@echo "  make lint:fix        Fix linting issues"
	@echo "  make type:check      TypeScript type checking"
	@echo "  make check           Run all checks (lint + types)"
	@echo "  make check:all       Dependencies + lint + types"
	@echo ""
	@echo "$(GREEN)BUILD$(NC)"
	@echo "  make build           Build for production"
	@echo "  make start           Start production server"
	@echo ""
	@echo "$(GREEN)DATABASE$(NC)"
	@echo "  make seed            Create development data"
	@echo "  make seed:clean      Remove seed data"
	@echo "  make migrate         Run database migrations"
	@echo ""
	@echo "$(GREEN)DOCKER$(NC)"
	@echo "  make docker:up       Start Docker services (Redis, etc.)"
	@echo "  make docker:down     Stop Docker services"
	@echo "  make docker:logs     View Docker logs"
	@echo "  make docker:clean    Remove Docker containers"
	@echo ""
	@echo "$(GREEN)UTILITIES$(NC)"
	@echo "  make clean           Remove build artifacts"
	@echo "  make clean:all       Remove node_modules + build artifacts"
	@echo "  make help            Show this help message"
	@echo ""
	@echo "$(YELLOW)Examples:$(NC)"
	@echo "  make setup           # First time setup"
	@echo "  make dev             # Start coding"
	@echo "  make test            # Run tests"
	@echo "  make check:all       # Pre-commit validation"
	@echo ""

##############################################
# SETUP TARGETS
##############################################

setup:
	@echo "$(YELLOW)Setting up OmniOps...$(NC)"
	@bash scripts/setup.sh

setup:full: setup seed docker:up
	@echo "$(GREEN)Full setup complete!$(NC)"

install:
	@echo "$(YELLOW)Installing dependencies...$(NC)"
	npm install
	@echo "$(GREEN)Dependencies installed$(NC)"

##############################################
# DEVELOPMENT TARGETS
##############################################

dev:
	@echo "$(BLUE)Starting development server on port 3000...$(NC)"
	npm run dev

dev:full:
	@echo "$(BLUE)Starting full development environment...$(NC)"
	@echo "Dev server + unit tests + E2E tests"
	npm run dev:full

dev:restart:
	@echo "$(YELLOW)Restarting development server...$(NC)"
	@pkill -f "next dev" || true
	@sleep 1
	@npm run dev

##############################################
# TESTING TARGETS
##############################################

test:
	@echo "$(BLUE)Running all tests...$(NC)"
	npm test

test:unit:
	@echo "$(BLUE)Running unit tests...$(NC)"
	npm run test:unit

test:integration:
	@echo "$(BLUE)Running integration tests...$(NC)"
	npm run test:integration

test:watch:
	@echo "$(BLUE)Running tests in watch mode...$(NC)"
	npm run test:watch

test:e2e:
	@echo "$(BLUE)Running E2E tests...$(NC)"
	npm run test:e2e

test:e2e:watch:
	@echo "$(BLUE)Opening E2E test UI...$(NC)"
	npm run test:e2e:watch

test:e2e:debug:
	@echo "$(BLUE)Starting E2E debugger...$(NC)"
	npm run test:e2e:debug

coverage:
	@echo "$(BLUE)Generating coverage report...$(NC)"
	npm run test:coverage
	@echo "$(GREEN)Coverage report generated$(NC)"

##############################################
# CODE QUALITY TARGETS
##############################################

lint:
	@echo "$(BLUE)Running ESLint...$(NC)"
	npm run lint

lint:fix:
	@echo "$(YELLOW)Fixing linting issues...$(NC)"
	npm run lint:fix
	@echo "$(GREEN)Linting issues fixed$(NC)"

type:check:
	@echo "$(BLUE)Running TypeScript type check...$(NC)"
	npx tsc --noEmit

check: lint type:check
	@echo "$(GREEN)All checks passed$(NC)"

check:all:
	@echo "$(BLUE)Running all quality checks...$(NC)"
	npm run check:all

##############################################
# BUILD TARGETS
##############################################

build:
	@echo "$(YELLOW)Building for production...$(NC)"
	npm run build
	@echo "$(GREEN)Build complete$(NC)"

start: build
	@echo "$(BLUE)Starting production server...$(NC)"
	npm start

##############################################
# DATABASE TARGETS
##############################################

seed:
	@echo "$(YELLOW)Creating seed data...$(NC)"
	npx tsx scripts/database/seed-dev-data.ts
	@echo "$(GREEN)Seed data created$(NC)"

seed:clean:
	@echo "$(YELLOW)Removing seed data...$(NC)"
	@echo "Domain: dev.local"
	npx tsx scripts/database/test-database-cleanup.ts clean --domain=dev.local
	@echo "$(GREEN)Seed data removed$(NC)"

migrate:
	@echo "$(YELLOW)Running database migrations...$(NC)"
	npm run migrate:encrypt-credentials

##############################################
# DOCKER TARGETS
##############################################

docker:up:
	@echo "$(YELLOW)Starting Docker services...$(NC)"
	docker-compose -f docker/docker-compose.dev.yml up -d
	@sleep 2
	@echo "$(GREEN)Docker services started$(NC)"
	@echo "Run 'make docker:logs' to view logs"

docker:down:
	@echo "$(YELLOW)Stopping Docker services...$(NC)"
	docker-compose -f docker/docker-compose.dev.yml down
	@echo "$(GREEN)Docker services stopped$(NC)"

docker:logs:
	@echo "$(BLUE)Docker service logs...$(NC)"
	docker-compose -f docker/docker-compose.dev.yml logs -f

docker:clean:
	@echo "$(YELLOW)Removing Docker containers...$(NC)"
	docker-compose -f docker/docker-compose.dev.yml down -v
	@echo "$(GREEN)Docker containers removed$(NC)"

##############################################
# UTILITY TARGETS
##############################################

clean:
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	rm -rf .next dist build
	@echo "$(GREEN)Build artifacts cleaned$(NC)"

clean:all: clean
	@echo "$(YELLOW)Removing node_modules...$(NC)"
	rm -rf node_modules package-lock.json
	@echo "$(GREEN)All artifacts cleaned$(NC)"

##############################################
# DEFAULT TARGET
##############################################

.DEFAULT_GOAL := help
