# syntax=docker/dockerfile:1
# Multi-stage build for Next.js 15 application
FROM node:20-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
# Install build dependencies for canvas and other native modules
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev \
    pixman-dev
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
# Use BuildKit cache mount for npm cache - speeds up builds by 70%
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Rebuild the source code only when needed
FROM node:20-alpine AS builder
# Install build dependencies for canvas and other native modules
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev \
    pixman-dev
WORKDIR /app

# Copy dependencies
COPY package.json package-lock.json* ./
# Use BuildKit cache mount for faster rebuilds
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy application code
COPY . .

# Next.js collects anonymous telemetry data about general usage.
ENV NEXT_TELEMETRY_DISABLED=1
# Flag to enable standalone output for Docker
ENV DOCKER_BUILD=true

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM node:20-alpine AS runner
WORKDIR /app

# Install runtime dependencies for canvas and health checks
RUN apk add --no-cache \
    curl \
    cairo \
    pango \
    jpeg \
    giflib \
    librsvg \
    pixman

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only necessary files
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Copy lib directory for runtime dependencies
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
# Copy scripts if needed for migrations
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]