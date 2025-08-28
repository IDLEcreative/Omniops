# AI Customer Service Agent

A modern, AI-powered customer service chat widget that can be embedded on any website. Built with Next.js, TypeScript, and integrated with various AI providers for intelligent customer support.

## 🚀 Features

### Core Capabilities
- **AI-Powered Conversations**: Intelligent responses using OpenAI GPT-4 or Anthropic Claude
- **Embeddable Widget**: Simple script tag integration for any website
- **Job Queue System**: Redis-based background processing for scalable operations
- **Real-time Processing**: Asynchronous job processing with status tracking
- **Multi-tenant Architecture**: Support multiple clients with isolated data
- **Component-based UI**: Modern React components with TypeScript

### Technical Features
- **Next.js 15**: Latest React framework with App Router
- **TypeScript**: Full type safety throughout the application
- **Redis Queue**: Background job processing and caching
- **Docker Support**: Containerized deployment with worker services
- **API-First Design**: RESTful APIs for all functionality
- **Component Library**: Reusable UI components with documentation

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Docker Deployment](#docker-deployment)
- [Component Library](#component-library)
- [Contributing](#contributing)

## 🏃 Quick Start

### Prerequisites

- Node.js 18+
- Redis server
- AI API key (OpenAI or Anthropic)

### Basic Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd customer-service-agent
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start Redis** (using Docker):
   ```bash
   docker-compose -f docker-compose.dev.yml up redis -d
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000) in your browser

## 📦 Installation

### Environment Variables

Create a `.env.local` file with the following configuration:

```bash
# AI Configuration
OPENAI_API_KEY=sk-your_openai_api_key_here
ANTHROPIC_API_KEY=sk-ant-your_anthropic_api_key_here  # Optional alternative

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Security
ENCRYPTION_KEY=your_32_character_encryption_key_here
API_SECRET=your_api_secret_key_here

# Application Settings
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Database
DATABASE_URL=your_database_connection_string

# Optional: Webhooks
WEBHOOK_SECRET=your_webhook_secret_key
```

### Development Dependencies

```bash
# Install all dependencies
npm install

# Install specific dependency groups
npm install --only=dev        # Development dependencies
npm install --only=prod       # Production dependencies
```

## ⚙️ Configuration

### Core Configuration Files

#### Next.js Configuration (`next.config.js`)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript and ESLint settings
  typescript: {
    ignoreBuildErrors: false
  },
  eslint: {
    ignoreDuringBuilds: false
  },
  
  // Performance optimizations
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  
  // Security headers
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' }
      ]
    }];
  },
  
  // Docker deployment
  output: 'standalone'
};

module.exports = nextConfig;
```

#### TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    },
    "forceConsistentCasingInFileNames": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

#### Docker Configuration

**Main Application Container (`Dockerfile`)**
```dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Worker Service Container (`Dockerfile.worker`)**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["node", "lib/workers/scraper-worker-service.js"]
```

**Development Environment (`docker-compose.dev.yml`)**
```yaml
version: '3.8'

services:
  # Redis for job queue and caching
  redis:
    image: redis:7-alpine
    container_name: cs-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
      - ./redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Main application
  app:
    build: .
    container_name: cs-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - REDIS_URL=redis://redis:6379
    depends_on:
      redis:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules

  # Background worker
  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    container_name: cs-worker
    environment:
      - NODE_ENV=development
      - REDIS_URL=redis://redis:6379
    depends_on:
      redis:
        condition: service_healthy

volumes:
  redis-data:
```

#### Redis Configuration (`redis.conf`)

```conf
# Redis configuration for Customer Service Agent

# Network and security
bind 127.0.0.1
port 6379
protected-mode yes

# Memory and persistence
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000

# Logging
loglevel notice
logfile ""

# Performance
tcp-keepalive 300
timeout 0
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    
    "docker:build": "docker-compose -f docker-compose.dev.yml build",
    "docker:up": "docker-compose -f docker-compose.dev.yml up -d",
    "docker:down": "docker-compose -f docker-compose.dev.yml down",
    "docker:logs": "docker-compose -f docker-compose.dev.yml logs -f",
    
    "queue:start": "node lib/queue/job-processor.js",
    "worker:start": "node lib/workers/scraper-worker-service.js",
    
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## 🏗️ Architecture

### Project Structure

```
customer-service-agent/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── jobs/                 # Job management endpoints
│   │   │   ├── [jobId]/         # Individual job operations
│   │   │   └── route.ts         # Job creation and listing
│   │   └── queue/               # Queue management
│   │       └── route.ts         # Queue status and controls
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── chat/                    # Chat-related components
│   ├── dashboard/               # Dashboard components
│   ├── forms/                   # Form components
│   └── COMPONENT_TYPES.md       # Component documentation
├── lib/                         # Core business logic
│   ├── auth/                    # Authentication utilities
│   ├── queue/                   # Job queue system
│   │   ├── job-processor.ts     # Job processing logic
│   │   └── queue-utils.ts       # Queue utilities
│   ├── workers/                 # Background workers
│   │   └── scraper-worker-service.ts  # Web scraping worker
│   └── WOOCOMMERCE_TYPES.md     # WooCommerce type definitions
├── public/                      # Static assets
├── docker-compose.dev.yml       # Development Docker setup
├── Dockerfile.worker            # Worker service container
├── redis.conf                  # Redis configuration
└── TYPE_DOCUMENTATION_INDEX.md # Type system documentation
```

### Core Services

#### Job Queue System
- **Technology**: Redis-based job queue
- **Purpose**: Background processing of long-running tasks
- **Components**:
  - Job creation and management APIs
  - Worker processes for job execution
  - Queue monitoring and status tracking
  - Retry and error handling mechanisms

#### Component Architecture
- **Design System**: Modular, reusable components
- **Documentation**: Each component group has dedicated README
- **Type Safety**: Full TypeScript integration
- **Testing**: Component-level testing with Jest

#### Worker Services
- **Containerized**: Docker-based worker processes
- **Scalable**: Multiple worker instances supported
- **Fault Tolerant**: Automatic retry and error recovery
- **Monitoring**: Built-in job status and performance tracking

## 📡 API Documentation

### Job Management API

#### Create Job
**POST** `/api/jobs`

```typescript
// Request
{
  "type": "scrape_website",
  "data": {
    "url": "https://example.com",
    "options": {
      "crawl": true,
      "maxPages": 50
    }
  }
}

// Response
{
  "jobId": "job_123456_abc",
  "status": "queued",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### Get Job Status
**GET** `/api/jobs/[jobId]`

```typescript
// Response
{
  "jobId": "job_123456_abc",
  "status": "processing",  // queued, processing, completed, failed
  "progress": {
    "current": 25,
    "total": 100,
    "percentage": 25
  },
  "result": null,  // Available when status is "completed"
  "error": null,   // Available when status is "failed"
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:05:00Z"
}
```

#### List Jobs
**GET** `/api/jobs`

Query parameters:
- `status`: Filter by job status
- `type`: Filter by job type
- `limit`: Number of results (default: 20)
- `offset`: Pagination offset

### Queue Management API

#### Get Queue Status
**GET** `/api/queue`

```typescript
// Response
{
  "stats": {
    "waiting": 5,
    "active": 2,
    "completed": 150,
    "failed": 3,
    "delayed": 0
  },
  "workers": {
    "active": 2,
    "total": 4
  }
}
```

#### Queue Controls
**POST** `/api/queue`

```typescript
// Pause queue
{
  "action": "pause"
}

// Resume queue
{
  "action": "resume"
}

// Clear completed jobs
{
  "action": "clean",
  "type": "completed",
  "age": 3600000  // 1 hour in milliseconds
}
```

## 🛠️ Development

### Running Locally

```bash
# Start development environment
npm run dev

# Or with Docker
npm run docker:up

# Monitor logs
npm run docker:logs

# Stop services
npm run docker:down
```

### Development Workflow

1. **Code Changes**: Edit files in your IDE
2. **Hot Reload**: Next.js automatically reloads changes
3. **Testing**: Run tests with `npm test`
4. **Type Checking**: Verify types with `npm run type-check`
5. **Linting**: Check code style with `npm run lint`

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # ESLint checking
npm run type-check      # TypeScript checking
npm test               # Run tests
npm run test:watch     # Watch mode testing

# Docker Operations
npm run docker:build   # Build containers
npm run docker:up      # Start all services
npm run docker:down    # Stop all services
npm run docker:logs    # View container logs

# Background Services
npm run queue:start    # Start job processor
npm run worker:start   # Start worker service
```

## 🐳 Docker Deployment

### Development Environment

```bash
# Build and start all services
docker-compose -f docker-compose.dev.yml up --build -d

# View logs from all services
docker-compose -f docker-compose.dev.yml logs -f

# Stop and remove containers
docker-compose -f docker-compose.dev.yml down
```

### Production Deployment

```bash
# Build production images
docker build -t cs-agent:latest .
docker build -f Dockerfile.worker -t cs-worker:latest .

# Run with production configuration
docker run -d \\
  --name cs-agent \\
  -p 3000:3000 \\
  -e NODE_ENV=production \\
  -e REDIS_URL=redis://redis:6379 \\
  cs-agent:latest

# Run worker service
docker run -d \\
  --name cs-worker \\
  -e NODE_ENV=production \\
  -e REDIS_URL=redis://redis:6379 \\
  cs-worker:latest
```

### Container Health Checks

```bash
# Check application health
curl http://localhost:3000/api/health

# Check Redis connection
docker exec cs-redis redis-cli ping

# Monitor container status
docker ps
docker stats
```

## 📚 Component Library

The application uses a component-based architecture with dedicated documentation:

- **[Chat Components](components/chat/README.md)**: Real-time messaging interface
- **[Dashboard Components](components/dashboard/README.md)**: Admin and analytics interfaces  
- **[Form Components](components/forms/README.md)**: User input and validation
- **[Auth Components](lib/auth/README.md)**: Authentication and authorization

### Component Types

See **[COMPONENT_TYPES.md](components/COMPONENT_TYPES.md)** for detailed type definitions and component interfaces.

### TypeScript Integration

- **Full Type Safety**: All components are fully typed
- **Interface Documentation**: Comprehensive type definitions
- **IDE Support**: IntelliSense and auto-completion
- **Build-time Checking**: Type errors caught during build

## 🔒 Security

### Security Measures

- **Environment Variables**: Sensitive data stored securely
- **HTTPS Only**: Production requires secure connections
- **Input Validation**: All inputs validated and sanitized
- **Rate Limiting**: API endpoints protected from abuse
- **CORS Protection**: Cross-origin requests controlled
- **Content Security Policy**: XSS and injection protection

### Best Practices

1. **Never commit secrets** to version control
2. **Use environment variables** for configuration
3. **Validate all inputs** on both client and server
4. **Implement proper authentication** and authorization
5. **Keep dependencies updated** to patch security vulnerabilities
6. **Monitor for security issues** in production

## 📊 Monitoring

### Application Monitoring

```bash
# View application logs
docker logs cs-agent -f

# Monitor job queue
curl http://localhost:3000/api/queue

# Check worker status
docker logs cs-worker -f
```

### Performance Monitoring

- **Redis**: Monitor queue performance and memory usage
- **Next.js**: Built-in performance metrics
- **Docker**: Container resource usage
- **API**: Response times and error rates

## 🤝 Contributing

### Development Setup

1. **Fork the repository**
2. **Clone your fork**: `git clone <your-fork-url>`
3. **Install dependencies**: `npm install`
4. **Create a feature branch**: `git checkout -b feature/amazing-feature`
5. **Make your changes**
6. **Run tests**: `npm test`
7. **Check types**: `npm run type-check`
8. **Lint code**: `npm run lint`
9. **Commit changes**: `git commit -m 'Add amazing feature'`
10. **Push to branch**: `git push origin feature/amazing-feature`
11. **Open a Pull Request**

### Code Style

- **TypeScript**: Use strict type checking
- **ESLint**: Follow configured linting rules
- **Prettier**: Automatic code formatting
- **Conventional Commits**: Use semantic commit messages

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📞 Support

### Documentation

- **[Component Documentation](components/)**: Individual component guides
- **[API Documentation](#api-documentation)**: Complete API reference
- **[Type Documentation](TYPE_DOCUMENTATION_INDEX.md)**: TypeScript type definitions

### Getting Help

1. **Check the documentation** first
2. **Search existing issues** for similar problems  
3. **Create a new issue** with detailed information
4. **Provide reproduction steps** and environment details

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js**: React framework for production
- **TypeScript**: Type-safe JavaScript
- **Redis**: In-memory data structure store
- **Docker**: Containerization platform

---

Built with ❤️ using modern web technologies