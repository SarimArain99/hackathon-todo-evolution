# Multi-stage Dockerfile for Next.js 16 frontend (Phase IV)
# Uses standalone output for minimal image size

# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application source
COPY . .

# Build the application (standalone output creates minimal runtime)
RUN npm run build

# --- Stage 2: Runtime ---
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user for security (NFR-004)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy built application from builder (standalone output)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
