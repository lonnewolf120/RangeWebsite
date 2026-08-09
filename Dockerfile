# Frontend image. The Next.js app lives at the repo root (this is an npm
# workspaces monorepo where `backend/` and `database/` are the other two
# members), so the build context is the repo root. Build with:
#   docker build -t rangewebsite-frontend .
#
# No backend needs to be reachable during this build: the course pages are
# rendered dynamically at request time (see src/app/**/page.tsx), not
# prerendered via generateStaticParams, so `next build` never calls the API.

FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY database/package.json database/package.json
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs eslint.config.mjs ./
COPY public ./public
COPY src ./src
RUN npm run build

# ---------------------------------------------------------------------------
# Minimal runtime: Next's standalone output traces only the node_modules
# actually imported by the server bundle, so this is a fraction of `deps`.
# ---------------------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production
# Next's standalone server binds to `localhost` by default, which is
# unreachable from outside the container — bind all interfaces instead.
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3412
CMD ["node", "server.js"]
