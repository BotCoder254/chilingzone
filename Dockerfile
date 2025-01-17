# Use Node.js LTS version as the base image
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies first (caching)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Create type definitions directory
RUN mkdir -p src/types

# Build the application
RUN npm run build

# Copy views and public to dist
RUN cp -r views dist/ && cp -r public dist/

# Remove development dependencies
RUN npm prune --production

# Create a non-root user
RUN addgroup -S chilingzone && \
    adduser -S chilingzone -G chilingzone
USER chilingzone

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application
CMD ["npm", "start"] 