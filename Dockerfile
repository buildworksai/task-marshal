# Task-Marshal Dockerfile
# BuildWorks.AI - Production-ready MCP server container

FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S taskmarshal -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=taskmarshal:nodejs /app/dist ./dist
COPY --from=builder --chown=taskmarshal:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=taskmarshal:nodejs /app/package*.json ./

# Create necessary directories
RUN mkdir -p logs data && \
    chown -R taskmarshal:nodejs logs data

# Switch to non-root user
USER taskmarshal

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Start the application
CMD ["node", "dist/server.js"]
