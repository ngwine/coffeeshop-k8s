# ============================================================
# CoffeeShop Frontend — Production Dockerfile
# Multi-stage: build React app → serve via Nginx
# ============================================================

# ── Stage 1: Build React App ──
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Nginx Production Server ──
FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy React build output
COPY --from=build /app/build /usr/share/nginx/html

# Copy K8s-optimized nginx config (no /api proxy — Ingress handles routing)
COPY nginx-k8s.conf /etc/nginx/conf.d/default.conf

# Health check for Kubernetes probes
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
