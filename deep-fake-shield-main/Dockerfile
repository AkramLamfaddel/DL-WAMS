# ── Stage 1: Install dependencies ─────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

# ── Stage 2: Build the application ────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# In Docker, all API calls go through Traefik (same origin = port 80).
# Empty string means relative URL — browser calls /api/auth/... which
# Traefik routes to the correct backend container.
ENV NEXT_PUBLIC_AUTH_URL=""
ENV NEXT_PUBLIC_GALLERY_URL=""
ENV NEXT_PUBLIC_AI_URL=""
ENV NEXT_PUBLIC_HISTORIQUE_URL=""

# NextAuth (server-side) — points to Traefik entry point
ENV NEXTAUTH_URL="http://localhost"
ENV NEXTAUTH_SECRET="verifai-deepfake-shield-secret-key-2026"

RUN npm run build

# ── Stage 3: Production runner ─────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy only the standalone build output (much smaller image)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy public assets if they exist
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
