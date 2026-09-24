---
name: Docker - Next.js Containerization
description: |
  Dockerfile and docker-compose patterns for Next.js apps: cache-friendly multi-stage production
  images (standalone output, non-root), no secrets baked into layers, and a dev container that
  hot-reloads without the node_modules bind-mount trap.
  Trigger: Activated when writing a Dockerfile, docker-compose.yml or .dockerignore, or when
  containerizing a Next.js app or setting up local development with Docker.
license: MIT
metadata:
  author: ai-library
  version: "1.0"
  scope: [root, backend]
  auto_invoke:
    - "Writing a Dockerfile"
    - "Creating docker-compose.yml"
    - "Containerizing a Next.js app"
    - "Setting up local development with Docker"
---

# Docker - Next.js Containerization

> **Core Principle:** An image is built once and runs anywhere — nothing secret or environment-specific is baked into a layer, and what changes least is copied first.

---

## 🆕 What's New

> **Instruction for Claude:** When this skill is loaded, check this table and mention any entry relevant to what the developer is working on — before writing code.

| Version | Change | Affects |
|---------|--------|---------|
| 1.0 | Initial skill | — |

---

## 🚫 FORBIDDEN PATTERNS

### 1. Never Copy the Source Before Installing Dependencies

Any source edit would invalidate the install layer and reinstall everything on every build.

```dockerfile
# ❌ FORBIDDEN - every code change reinstalls all dependencies
COPY . .
RUN pnpm install

# ✅ CORRECT - the install layer is reused until the lockfile changes
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
```

### 2. Never Put Secrets in ARG or ENV

`ARG`/`ENV` values persist in the image layers and metadata — anyone who can pull the image can read them.

```dockerfile
# ❌ FORBIDDEN - the key ships inside the image
ARG SUPABASE_SERVICE_ROLE_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# ✅ CORRECT - server secrets are injected at runtime (env_file / orchestrator secrets)
#    docker run --env-file .env.production ...
```

The one legitimate build-time value is `NEXT_PUBLIC_*`: Next.js inlines it into the client bundle during `next build`, it is public by definition, and changing it later needs a rebuild (see `env-config`). If a build step truly needs a secret, use `RUN --mount=type=secret`.

### 3. Never Bind-Mount the Whole Project Over node_modules

`.:/app` hides the `node_modules` installed in the image behind the host's — wrong OS/architecture binaries, or an empty folder.

```yaml
# ❌ FORBIDDEN
services:
  web:
    volumes:
      - .:/app

# ✅ PREFER - Compose Watch syncs source and never touches node_modules (see Required #3)

# ✅ ACCEPTABLE fallback - a named volume keeps the container's own node_modules
services:
  web:
    volumes:
      - .:/app
      - node_modules:/app/node_modules
volumes:
  node_modules:
```

The named volume goes **stale** when dependencies change: rebuild and recreate it (`docker compose down -v && docker compose up --build`).

### 4. Never Run the Production Container as Root, or Ship the Dev Server

```dockerfile
# ❌ FORBIDDEN - root user, dev dependencies and source in the runtime image
FROM node:24-slim
COPY . .
CMD ["pnpm", "dev"]

# ✅ CORRECT - standalone output only, non-root (see Required #1)
USER node
CMD ["node", "server.js"]
```

---

## ✅ REQUIRED PATTERNS

### 1. Multi-Stage Dockerfile (production + dev targets)

Requires `output: 'standalone'` in `next.config.ts` and a `public/` folder (`COPY .../public` fails if it is missing — `create-next-app` includes one; otherwise add `public/.gitkeep`). Adapted from the official Next.js `with-docker` example.

```dockerfile
# syntax=docker/dockerfile:1
# Pin the major from package.json "engines"; use an LTS that still bundles corepack.
ARG NODE_VERSION=24-slim

FROM node:${NODE_VERSION} AS deps
WORKDIR /app
# The pnpm version comes from the "packageManager" field in package.json.
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM node:${NODE_VERSION} AS dev
WORKDIR /app
RUN corepack enable pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# next dev listens on 0.0.0.0 by default.
CMD ["pnpm", "dev"]

FROM dev AS builder
# NEXT_PUBLIC_* are public and inlined at build time — build args are fine for these only.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NODE_ENV=production
RUN pnpm build

FROM node:${NODE_VERSION} AS runner
WORKDIR /app
# Docker sets HOSTNAME to the container id; the standalone server.js binds to it.
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/public ./public
RUN mkdir .next && chown node:node .next
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
```

Build production with `docker build --target runner --build-arg NEXT_PUBLIC_...=... .`; development uses `target: dev` from compose. Keep `HOSTNAME=0.0.0.0`: the standalone `server.js` listens on `$HOSTNAME`, which Docker sets to the container id, so without it the server only binds the container's own IP. Published ports still work, but `localhost` *inside* the container is refused (`ECONNREFUSED`) — that breaks in-container health checks and sidecars.

### 2. .dockerignore

Keeps the build context small and stops local secrets and artifacts from entering the image.

```text
node_modules/
.next/
.git
.env*
!.env.example
Dockerfile*
docker-compose*.yml
coverage/
*.log
.DS_Store
```

### 3. Dev Compose with Compose Watch

Compose Watch (Docker Compose ≥ 2.22) syncs edits into the container and lets you ignore `node_modules/`, which is what bind mounts cannot do. Start it with `docker compose up --watch`.

```yaml
# docker-compose.yml
services:
  web:
    build:
      context: .
      target: dev
    ports:
      - "3000:3000"
    env_file: .env.local        # e.g. a remote Supabase — runtime env, never baked into the image
    develop:
      watch:
        - action: sync
          path: .
          target: /app
          ignore:
            - node_modules/
            - .next/
        - action: rebuild       # dependency changes need a new image
          path: package.json
        - action: rebuild
          path: pnpm-lock.yaml
```

### 4. File-Watching Fallback for Bind Mounts

Try a bind mount without polling first — file events crossed the mount on Docker Desktop for Mac. Enable polling only when edits don't trigger a reload (native file events don't cross the mount). The setting depends on the bundler:

```typescript
// next.config.ts — Turbopack (default in Next.js 16)
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  watchOptions: { pollIntervalMs: 1000 },   // polling costs CPU — add it only when needed
}
export default nextConfig
```

For `next dev --webpack` the equivalent is the environment variable `WATCHPACK_POLLING=true`; it has no effect on Turbopack.

---

## 📁 File Structure

```
Dockerfile              # deps → dev → builder → runner
docker-compose.yml      # dev: target dev + Compose Watch
.dockerignore
.env.example            # committed; real values live in .env.local (gitignored)
```

---

## 📋 Checklist Before Commit

- [ ] Lockfile is copied and installed before the source (`COPY . .` comes after `pnpm install`)
- [ ] No secret in `ARG`/`ENV`; only `NEXT_PUBLIC_*` are build args
- [ ] `next.config.ts` has `output: 'standalone'`; runtime image runs `node server.js` as `USER node` with `HOSTNAME=0.0.0.0`
- [ ] `.dockerignore` excludes `node_modules`, `.next`, `.git` and `.env*`
- [ ] Dev uses Compose Watch (or a named `node_modules` volume) — never `.:/app` alone
- [ ] Node version pinned; `packageManager` field set in `package.json`

---

*Skill Version: 1.0.0 | Compatible with Next.js 16.x, Docker Compose 2.22+, BuildKit*
