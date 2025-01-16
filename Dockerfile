FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

# Add non-root user for security
RUN adduser -D chilingzone
USER chilingzone

# Environment variables
ENV PORT=3000 \
    NODE_ENV=production \
    BASE_URL=https://allmovieland.link/player.js?v=60%20128

# Expose port
EXPOSE 3000 

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]  
