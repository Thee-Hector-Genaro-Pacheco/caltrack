# Stage 1: Build the workspace
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy root configurations and lockfiles
COPY package.json package-lock.json tsconfig.json ./

# Copy shared monorepo packages
COPY packages/ ./packages/

# Copy api application source
COPY apps/api/ ./apps/api/

# Install full workspace dependencies
RUN npm ci

# Generate Prisma Client and compile TypeScript build
RUN npm run build --workspace=@caltrack/api

# Stage 2: Production execution
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy configurations and node_modules from builder
COPY package.json package-lock.json ./
COPY --from=builder /usr/src/app/node_modules/ ./node_modules/
COPY --from=builder /usr/src/app/apps/api/dist/ ./apps/api/dist/
COPY --from=builder /usr/src/app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /usr/src/app/apps/api/prisma/ ./apps/api/prisma/
COPY --from=builder /usr/src/app/packages/ ./packages/

EXPOSE 3001

CMD ["npm", "run", "start", "--workspace=@caltrack/api"]
