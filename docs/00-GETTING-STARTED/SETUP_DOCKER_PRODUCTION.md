# Docker Setup for Omniops

**Type:** Setup
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Dependencies:**
- [Performance Optimization](docs/07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md) - Container optimization
- [Database Schema](docs/07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) - Connection setup
**Estimated Read Time:** 8 minutes

## Purpose
Complete Docker setup guide for building and running the Omniops application using Docker Compose, covering both production and development configurations with multi-stage builds (59% faster with cache), Redis integration for job queuing, health checks, and container orchestration including troubleshooting and performance optimization.

## Quick Links
- [Quick Start](#quick-start) - Get running in 3 steps
- [Docker Configuration Files](#docker-configuration-files) - Production vs development setup
- [Common Commands](#common-commands) - Container management essentials
- [Architecture](#architecture) - Next.js app + Redis setup
- [Troubleshooting](#troubleshooting) - Common issues and solutions

## Keywords
Docker, containerization, deployment, Docker Compose, Dockerfile, docker-compose.yml, multi-stage build, Redis, environment variables, production, development, hot reload, orchestration, container management, image building, Docker Desktop, .dockerignore, health check

## Aliases
- "Docker Compose" (also known as: docker-compose, compose, multi-container Docker, container orchestration)
- "Dockerfile" (also known as: Docker image definition, container build file, image recipe, build configuration)
- "multi-stage build" (also known as: staged build, layered build, optimized build, build optimization)
- "hot reload" (also known as: live reload, auto-refresh, development mode, watch mode)
- ".dockerignore" (also known as: Docker ignore file, build exclusions, ignored files, build context filter)
- "health check" (also known as: container health, health endpoint, status check, readiness probe)
- "Docker Desktop" (also known as: Docker for Mac, Docker for Windows, Docker GUI, Docker client)

---

This guide explains how to build and run the Omniops application using Docker.

## Prerequisites

- Docker Desktop (v28.3.2 or later)
- Docker Compose (included with Docker Desktop)

## Quick Start

### 1. Set up environment variables

Copy the example environment file and add your credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your:
- Supabase credentials (URL, anon key, service role key)
- OpenAI API key
- Optional: WooCommerce credentials

### 2. Build and run with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# Or for development with hot reload
docker-compose -f docker-compose.dev.yml up -d
```

The application will be available at http://localhost:3000

### 3. Verify the deployment

```bash
# Check container status
docker ps

# Check application health
curl http://localhost:3000/api/health

# View logs
docker logs omniops-app
```

## Docker Configuration Files

### Production Setup
- `Dockerfile` - Multi-stage production build
- `docker-compose.yml` - Production orchestration with Redis

### Development Setup
- `Dockerfile.dev` - Development image with hot reload
- `docker-compose.dev.yml` - Development orchestration

### Supporting Files
- `.dockerignore` - Excludes unnecessary files from build
- `.env.example` - Example environment configuration (use for all environments)

## Common Commands

### Container Management
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f app
docker-compose logs -f redis

# Execute commands in container
docker exec -it omniops-app sh
```

### Building and Rebuilding
```bash
# Build image only
docker build -t omniops-app:latest .

# Rebuild and restart
docker-compose up -d --build

# Clean rebuild (removes cache)
docker-compose build --no-cache
```

### Troubleshooting
```bash
# Check container health
docker inspect omniops-app --format='{{.State.Health.Status}}'

# View Redis connection
docker exec omniops-app env | grep REDIS

# Test Redis connectivity
docker exec -it omniops-redis redis-cli ping

# Remove all containers and volumes (careful!)
docker-compose down -v
```

## Architecture

The Docker setup includes:

1. **Next.js Application** (omniops-app)
   - Production: Optimized multi-stage build
   - Development: Hot reload enabled
   - Runs on port 3000
   - Health checks included

2. **Redis** (omniops-redis)
   - Used for job queuing and caching
   - Persistent volume for data
   - Runs on port 6379

3. **Network** (omniops-network)
   - Bridge network for container communication
   - Services communicate using container names

## Performance Optimizations

The production Dockerfile uses:
- Multi-stage builds to minimize image size
- Node.js Alpine images for smaller footprint
- Standalone Next.js output for optimal performance
- Non-root user for security
- Health checks for reliability

## Deployment Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use secrets management in production
- Redis URL in Docker: `redis://redis:6379`

### Scaling
To scale the application:
```bash
docker-compose up -d --scale app=3
```

### Monitoring
- Health endpoint: `/api/health`
- Logs: Centralize with logging drivers
- Metrics: Consider adding Prometheus/Grafana

## Troubleshooting

### Port Already in Use
If port 3000 is already in use:
```bash
# Find and kill the process
lsof -i :3000
pkill -f "next dev"
```

### Redis Connection Issues
The app handles Redis connection gracefully with fallback. If you see Redis errors during build, they can be safely ignored.

### Build Failures
If the build fails:
1. Ensure Docker has enough resources (RAM/CPU)
2. Clear Docker cache: `docker system prune -a`
3. Check Node.js version compatibility

## Production Deployment

For production deployment:
1. Use environment-specific docker-compose files
2. Implement proper secrets management
3. Set up monitoring and logging
4. Configure reverse proxy (nginx/traefik)
5. Enable SSL/TLS termination
6. Set up backup strategies for Redis data

## Support

For issues or questions about the Docker setup, check:
- Docker logs: `docker logs omniops-app`
- Health status: http://localhost:3000/api/health
- Redis connectivity: `docker exec omniops-app redis-cli -h redis ping`