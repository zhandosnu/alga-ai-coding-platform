FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

# Install Docker CLI for sandbox spawning
RUN apk add --no-cache docker-cli

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

# Create sandbox temp dir
RUN mkdir -p /tmp/alga-sandbox

EXPOSE 4000
CMD ["node", "dist/main"]
