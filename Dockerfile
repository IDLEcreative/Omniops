# Multi-stage build for Next.js application
FROM node:20-alpine AS builder

# Install dependencies
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with retry
RUN npm config set fetch-timeout 300000 && \
    npm ci || npm ci || npm ci

# Copy application code
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=true

# Build the application (skip TypeScript checking)
RUN npm run build || npx next build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Install production dependencies
RUN apk add --no-cache libc6-compat

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy package files and install production dependencies
COPY package.json package-lock.json* ./
RUN npm config set fetch-timeout 300000 && \
    npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if(r.statusCode !== 200) throw new Error()})" || exit 1

# Start the application
CMD ["npm", "start"]