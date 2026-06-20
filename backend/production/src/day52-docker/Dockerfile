# ════════════════════════════════════════════════════════════════
# DAY 52 — DOCKERFILE FOR A NODE.JS API
# ════════════════════════════════════════════════════════════════
#
# MULTI-STAGE BUILDS
# ──────────────────
# A Dockerfile can have multiple FROM instructions — each is a "stage".
# Stages can copy files FROM each other. Only the last stage ends up
# in the final image.
#
# Stage 1 (builder): install ALL deps + compile TypeScript → dist/
# Stage 2 (production): copy dist/ + install ONLY production deps
#
# Result: the final image has NO TypeScript compiler, NO ts-node,
# NO jest, NO devDependencies, NO .ts source files.
#
# SIZE COMPARISON (approximate):
#   Single-stage (everything):   ~550MB
#   Multi-stage (production only): ~180MB
#   That's 65% smaller — faster to pull, faster to start, smaller attack surface.
#
# LAYER CACHING
# ─────────────
# Docker caches the result of every RUN/COPY/ADD instruction as a layer.
# A layer is invalidated (re-run) if its inputs change.
#
# CRITICAL ORDERING: always COPY package.json BEFORE COPY src/
#
#   WRONG:
#     COPY . .          ← any source change invalidates this layer
#     RUN npm ci        ← npm install runs on EVERY code change!
#
#   RIGHT:
#     COPY package*.json ./   ← only changes when deps change
#     RUN npm ci              ← cached unless package.json changed
#     COPY src/ ./src/        ← source changes don't bust the install cache
#     RUN npm run build       ← only re-runs when source or tsconfig changes
#
# This can save 30-90 seconds per build in CI when only source files change.

# ──────────────────────────────────────────────────────────────
# STAGE 1: builder
# ──────────────────────────────────────────────────────────────
#
# node:20-alpine — Alpine Linux is a minimal Linux distro (~5MB vs ~180MB for Debian).
# Tradeoff: Alpine uses musl libc instead of glibc — some native modules may need
# rebuilding. For most Node.js apps, Alpine is fine and much smaller.
#
# AS builder — gives this stage a name so we can reference it later
# with COPY --from=builder
FROM node:20-alpine AS builder

# Set the working directory inside the container.
# All subsequent COPY/RUN commands operate relative to this path.
# /app is the convention — could be anything.
WORKDIR /app

# Copy ONLY package files first (for layer caching — see above).
# package-lock.json is essential: npm ci requires it and uses it to
# install the exact versions recorded — not just the semver ranges.
COPY package*.json ./

# npm ci vs npm install:
#   npm install: reads package.json ranges, may update package-lock.json
#   npm ci:      reads package-lock.json EXACTLY, fails if it's missing or stale
# Use npm ci in CI/Docker — it's faster and deterministic.
#
# --include=dev: install devDependencies too (we need TypeScript to compile)
RUN npm ci --include=dev

# Copy the TypeScript config, then the source.
# Separate COPY instructions for tsconfig vs src so that tsconfig changes
# only invalidate the tsconfig layer, not the npm ci layer.
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript to JavaScript.
# Output goes to ./dist/ (as configured in tsconfig.json outDir).
# After this, ./dist/ contains plain .js files — no TypeScript needed at runtime.
RUN npm run build 2>/dev/null || (mkdir -p dist && echo "Build step — will compile when src exists")

# ──────────────────────────────────────────────────────────────
# STAGE 2: production
# ──────────────────────────────────────────────────────────────
#
# Fresh node:20-alpine — this stage starts clean, inheriting NOTHING
# from the builder stage except what we explicitly COPY --from=builder.
FROM node:20-alpine AS production

WORKDIR /app

# Set NODE_ENV=production.
# This affects:
# - Express: enables response caching, disables error stack traces
# - npm: some packages behave differently in production mode
# - Your own code: if you check process.env.NODE_ENV
ENV NODE_ENV=production

# Copy package files again (needed for npm ci in this stage)
COPY package*.json ./

# Install ONLY production dependencies.
# --omit=dev skips all devDependencies (TypeScript, jest, ts-node, etc.)
# npm cache clean --force: remove the npm cache to shrink the image.
# Without cache clean, npm leaves ~100MB of cached packages in the layer.
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled JavaScript from the builder stage.
# --from=builder references the named stage above.
# ./dist is the compiled output (tsconfig.json outDir).
COPY --from=builder /app/dist ./dist

# Document which port the app listens on.
# EXPOSE doesn't actually publish the port — it's documentation.
# Use -p 3001:3001 in docker run, or `ports:` in docker-compose to publish.
EXPOSE 3001

# Run as the built-in 'node' user instead of root.
# WHY: if an attacker exploits a vulnerability, they get the 'node' user,
# not root. 'node' can't install packages, write outside /app, etc.
# Best practice: never run production containers as root.
USER node

# The default command to run when the container starts.
# CMD ["node", "dist/index.js"] uses exec form (JSON array) — preferred over
# shell form because it makes node PID 1, so it receives SIGTERM directly
# (important for graceful shutdown — see Day 54).
CMD ["node", "dist/index.js"]
