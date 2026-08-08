# Build context is the repo ROOT (not backend/), since this is an npm
# workspaces monorepo: backend depends on the sibling `database` workspace
# package, and npm workspaces hoist/symlink cross-package deps from the
# root node_modules. Build with:
#   docker build -f backend/Dockerfile -t rangewebsite-backend .
#
# node:20-slim (Debian, glibc) rather than alpine: Prisma's query engine
# binaries target glibc by default, and slim avoids the extra
# binaryTargets configuration alpine/musl would otherwise need.

FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---------------------------------------------------------------------------
# `build`: full install (incl. devDependencies) + compiled backend +
# generated Prisma client. Also used directly (via `target: build`) as the
# image for the one-shot migrate/seed job, since that needs the Prisma CLI
# and tsx which are devDependencies not present in the pruned runtime image.
# ---------------------------------------------------------------------------
FROM base AS build

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY database/package.json database/package.json
RUN npm ci

COPY database/prisma database/prisma
COPY database/tsconfig.json database/tsconfig.json
COPY backend/src backend/src
COPY backend/tsconfig.json backend/tsconfig.json

RUN npx prisma generate --schema=database/prisma/schema.prisma
RUN npm run build --workspace=backend

# ---------------------------------------------------------------------------
# `prod-deps`: production-only install, so the runtime image doesn't carry
# typescript/tsx/prisma-cli/vitest.
# ---------------------------------------------------------------------------
FROM base AS prod-deps

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY database/package.json database/package.json
RUN npm ci --omit=dev

# ---------------------------------------------------------------------------
# `runtime`: lean final image.
# ---------------------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/package.json ./package.json
COPY --from=prod-deps /app/backend/package.json ./backend/package.json
COPY --from=prod-deps /app/database/package.json ./database/package.json
COPY --from=build /app/database/generated ./database/generated
COPY --from=build /app/backend/dist ./backend/dist

WORKDIR /app/backend
EXPOSE 4000
CMD ["node", "dist/server.js"]
