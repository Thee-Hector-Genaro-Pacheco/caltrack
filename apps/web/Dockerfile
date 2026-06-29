# AWS S3 static build artifact generator configuration
# Stage 1: Build the assets
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package descriptors and locks
COPY package.json package-lock.json tsconfig.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Install workspace dependencies
RUN npm ci

# Compile React project production bundle
RUN npm run build --workspace=@caltrack/web

# Stage 2: Serve static files using Nginx
FROM nginx:1.25-alpine

# Copy built assets
COPY --from=builder /usr/src/app/apps/web/dist /usr/share/nginx/html

# Copy custom configuration for SPA fallback routing
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
