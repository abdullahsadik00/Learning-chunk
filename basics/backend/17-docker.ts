// ═══════════════════════════════════════════════════════════════
// BACKEND 17: DOCKER · MULTI-STAGE BUILDS · DOCKER-COMPOSE · CONTAINER SECURITY  (Day 52)
// Run: npx ts-node 17-docker.ts
// ═══════════════════════════════════════════════════════════════
//
// Docker packages your app + its runtime into a portable, isolated unit
// called a CONTAINER.  A container is always the same no matter where it
// runs: your laptop, CI, staging, production.
//
//  Core idea:
//  • IMAGE   — read-only blueprint (like a class)
//  • CONTAINER — running instance of an image (like an object)
//  • LAYER   — each Dockerfile instruction adds a cached layer on top of
//               the previous one; unchanged layers are reused on rebuild
//
//  Flow: write Dockerfile → docker build → push to registry → docker run
//
// WHY DOCKER?
//  1. "Works on my machine" → "works everywhere" (eliminates env drift)
//  2. Reproducible builds — same image every time
//  3. Isolation — processes can't interfere with the host or each other
//  4. Horizontal scaling — spin up 10 identical containers in seconds
//  5. Cloud-native — Kubernetes, ECS, Cloud Run all consume Docker images

// ───────────────────────────────────────────────────────────────
// 1. Docker Fundamentals
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Docker Fundamentals ===");

/*
  IMAGE vs CONTAINER
  ──────────────────
  Image   → immutable snapshot stored in a registry.
             Built from a Dockerfile.  Think: CD-ROM.
  Container → running process created FROM an image.
               Has its own filesystem, network, PID namespace.
               Ephemeral by default — data is lost on removal.

  REGISTRY
  ────────
  Docker Hub  → hub.docker.com   (public default)
  ECR         → AWS Elastic Container Registry (private, IAM-gated)
  GCR / GAR   → Google Artifact Registry
  GHCR        → GitHub Container Registry (ghcr.io)

  You pull FROM a registry, you push TO a registry.

  ─────────────────────────────────
  ESSENTIAL CLI COMMANDS
  ─────────────────────────────────

  Build
  ─────
  docker build -t myapp:1.0 .           # build from ./Dockerfile, tag it
  docker build -t myapp:1.0 -f prod.Dockerfile .   # custom Dockerfile

  Run
  ───
  docker run myapp:1.0                  # foreground, remove nothing
  docker run -d myapp:1.0              # detached (background)
  docker run --rm myapp:1.0            # auto-remove when it exits
  docker run -p 3000:3000 myapp:1.0    # host-port:container-port
  docker run -p 3000:3000 -d --name api myapp:1.0   # named container

  Port mapping:  -p <host>:<container>
  The app inside listens on container port 3000.
  -p 3000:3000 binds host port 3000 → container port 3000.
  -p 8080:3000 exposes the app on localhost:8080 instead.

  Environment variables
  ─────────────────────
  docker run -e NODE_ENV=production -e PORT=3000 myapp:1.0
  docker run --env-file .env myapp:1.0          # read from file

  Volume mounting  (-v / --mount)
  ────────────────────────────────
  docker run -v /host/path:/container/path myapp:1.0   # bind mount
  docker run -v pgdata:/var/lib/postgresql/data postgres:16  # named vol

  Inspect / manage
  ─────────────────
  docker ps                   # running containers
  docker ps -a                # all containers (including stopped)
  docker logs api             # stdout/stderr of container named "api"
  docker logs -f api          # follow (tail -f equivalent)
  docker exec -it api sh      # open interactive shell inside container
  docker exec api node -e "console.log(process.env)"

  docker stop api             # send SIGTERM, then SIGKILL after 10 s
  docker rm api               # delete stopped container
  docker rm -f api            # force-stop and remove

  docker images               # list local images
  docker rmi myapp:1.0        # delete an image
  docker system prune         # clean up stopped containers + dangling images
*/

console.log("Docker: image = blueprint, container = running instance");
console.log("Key commands: build → run → ps → logs → exec → stop → rm");

// ───────────────────────────────────────────────────────────────
// 2. Writing a Dockerfile for Node.js
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Writing a Dockerfile for Node.js ===");

/*
  DOCKERFILE — Dockerfile (no extension, capital D)

  ┌────────────────────────────────────────────────────────────┐
  │  FROM node:20-alpine                                       │
  │                                                            │
  │  WORKDIR /app                                              │
  │                                                            │
  │  COPY package*.json ./                                     │
  │  RUN  npm ci --only=production                             │
  │                                                            │
  │  COPY . .                                                  │
  │                                                            │
  │  EXPOSE 3000                                               │
  │                                                            │
  │  CMD ["node", "dist/index.js"]                             │
  └────────────────────────────────────────────────────────────┘

  Instruction-by-instruction breakdown
  ─────────────────────────────────────
  FROM node:20-alpine
    • Base image: Node.js 20 on Alpine Linux (~5 MB vs ~900 MB for Debian)
    • Always pin a specific tag — never FROM node:latest (breaks silently
      when upstream publishes a breaking change)

  WORKDIR /app
    • Sets the working directory inside the image for all subsequent
      instructions (COPY, RUN, CMD).
    • Creates the directory if it doesn't exist.

  COPY package*.json ./
    • Copies ONLY package.json and package-lock.json first.
    • WHY THIS ORDER?  ← critical layer-caching trick
      Docker caches each layer.  If package.json didn't change, the
      `RUN npm ci` layer is served from cache — no reinstall needed.
      Only source-code changes (COPY . .) bust the later layers.
      Reversing the order would bust the npm cache on every source edit.

  RUN npm ci --only=production
    • npm ci  → clean install from lock file (reproducible, fast)
    • --only=production → skips devDependencies (TypeScript, Jest, …)
      Keep the production image lean; you don't need ts-node at runtime.

  COPY . .
    • Copies the rest of the source into /app.
    • Comes AFTER npm ci so source changes don't bust the deps layer.

  EXPOSE 3000
    • Documents which port the container listens on.
    • Does NOT actually publish the port — -p does that at `docker run`.
    • Acts as metadata for operators / orchestrators.

  CMD ["node", "dist/index.js"]
    • Default command to run when the container starts.
    • Use JSON array form (exec form) — NOT CMD node dist/index.js
      (shell form wraps in /bin/sh -c, which breaks signal forwarding).

  .dockerignore  (next to Dockerfile)
  ────────────────────────────────────
  node_modules     ← never copy host node_modules into the image
  dist             ← rebuilt inside the image
  .env             ← secrets must NOT bake into the image
  .git
  *.log
  coverage
  __tests__

  Without .dockerignore, COPY . . can accidentally include node_modules
  (hundreds of MB) or .env files containing secrets.
*/

const dockerfileExample = `
# ── Production Dockerfile for a Node.js / Express API ────────────
FROM node:20-alpine

# Set working directory
WORKDIR /app

# 1. Copy manifests first — layer cache for npm install
COPY package*.json ./

# 2. Install ONLY production dependencies
RUN npm ci --only=production

# 3. Copy compiled source (assumes tsc already ran in CI)
COPY dist/ ./dist/

# Document the port
EXPOSE 3000

# Run as non-root (security — covered in section 6)
USER node

# Start the server
CMD ["node", "dist/index.js"]
`;

console.log("Single-stage Dockerfile example (for pre-compiled dist/):");
console.log(dockerfileExample);

// ───────────────────────────────────────────────────────────────
// 3. Multi-Stage Builds
// ───────────────────────────────────────────────────────────────

console.log("=== 3. Multi-Stage Builds ===");

/*
  PROBLEM with a naive single-stage Dockerfile when you compile TS:
    • You need TypeScript + all devDependencies to compile.
    • If you install everything and COPY src/, the final image contains:
        - TypeScript compiler
        - ts-node, nodemon, Jest, ESLint, …
        - All the src/ .ts files
      Final size: ~800 MB.  Production image should be ~80–120 MB.

  SOLUTION: Multi-stage build
    Stage 1 — "builder"  → full Node + devDeps → compile TS → output dist/
    Stage 2 — "runtime"  → fresh alpine + prodDeps only → copy dist/ only

  Final image is stage 2; stage 1 is thrown away after the build.

  ┌────────────────────────────────────────────────────────────────┐
  │  # ── Stage 1: Build ──────────────────────────────────────── │
  │  FROM node:20-alpine AS builder                               │
  │                                                                │
  │  WORKDIR /app                                                  │
  │                                                                │
  │  COPY package*.json ./                                         │
  │  RUN  npm ci                          # includes devDeps       │
  │                                                                │
  │  COPY . .                                                      │
  │  RUN  npm run build                   # tsc → dist/            │
  │                                                                │
  │  # ── Stage 2: Runtime ─────────────────────────────────────  │
  │  FROM node:20-alpine AS runtime                               │
  │                                                                │
  │  WORKDIR /app                                                  │
  │                                                                │
  │  COPY package*.json ./                                         │
  │  RUN  npm ci --only=production        # prod deps only         │
  │                                                                │
  │  # Copy ONLY compiled output from stage 1                      │
  │  COPY --from=builder /app/dist ./dist                         │
  │                                                                │
  │  EXPOSE 3000                                                   │
  │  USER node                                                     │
  │  CMD ["node", "dist/index.js"]                                │
  └────────────────────────────────────────────────────────────────┘

  Key syntax
  ──────────
  FROM … AS <name>            → name a stage
  COPY --from=<name> src dst  → copy from a named stage (not the host)

  What gets discarded?
  ─────────────────────
  • TypeScript compiler and all devDependencies
  • Raw .ts source files
  • Test files, coverage reports, etc.

  Size comparison (typical Express + TS app)
  ───────────────────────────────────────────
  Single-stage (with devDeps + src):  ~800 MB
  Multi-stage  (runtime only):        ~90–120 MB

  Build command is the same — Docker handles stages internally:
    docker build -t myapp:1.0 .

  You can also target a specific stage (useful for running tests in CI):
    docker build --target builder -t myapp:test .
    docker run --rm myapp:test npm test
*/

console.log("Multi-stage: builder stage compiles TS; runtime stage copies only dist/");
console.log("Result: ~90 MB production image instead of ~800 MB");

// ───────────────────────────────────────────────────────────────
// 4. docker-compose
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. docker-compose ===");

/*
  docker-compose (now `docker compose` with a space) defines a MULTI-
  CONTAINER application as a single YAML file.

  Use it for:  local development, integration tests, staging environments.
  Don't use it for: production at scale (use Kubernetes / ECS instead).

  ──────────────────────────────────────────────────
  docker-compose.yml  (Node API + PostgreSQL + Redis)
  ──────────────────────────────────────────────────

  version: "3.9"

  services:

    api:
      build:
        context: .
        dockerfile: Dockerfile
      ports:
        - "3000:3000"
      environment:
        NODE_ENV: development
        DATABASE_URL: postgres://user:pass@db:5432/mydb
        REDIS_URL: redis://cache:6379
      env_file:
        - .env                      # load local secrets (dev only)
      depends_on:
        db:
          condition: service_healthy
        cache:
          condition: service_started
      volumes:
        - ./src:/app/src            # bind mount for live reload in dev
      networks:
        - backend
      healthcheck:
        test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
        interval: 30s
        timeout: 10s
        retries: 3
        start_period: 15s

    db:
      image: postgres:16-alpine
      environment:
        POSTGRES_USER: user
        POSTGRES_PASSWORD: pass
        POSTGRES_DB: mydb
      volumes:
        - pgdata:/var/lib/postgresql/data   # NAMED VOLUME — data persists
      networks:
        - backend
      healthcheck:
        test: ["CMD-SHELL", "pg_isready -U user -d mydb"]
        interval: 10s
        timeout: 5s
        retries: 5

    cache:
      image: redis:7-alpine
      networks:
        - backend

  volumes:
    pgdata:         # declare named volume (managed by Docker)

  networks:
    backend:        # isolated network — services reach each other by name

  ──────────────────────────────────────────────────
  Key concepts
  ──────────────────────────────────────────────────
  image vs build
    • image: postgres:16-alpine → pull from registry, no build step
    • build: { context: . }    → run docker build for that service

  depends_on
    • Ensures startup ORDER.  Does NOT wait for the service to be "ready"
      unless you add `condition: service_healthy` (requires healthcheck).

  networks
    • Services on the same network reach each other via SERVICE NAME as
      the hostname: DATABASE_URL: postgres://db:5432/mydb  (host = "db")

  volumes
    • Named volume `pgdata:` persists across `docker compose down`.
    • `docker compose down -v` also removes volumes (wipes data).

  ──────────────────────────────────────────────────
  Essential compose CLI commands
  ──────────────────────────────────────────────────
  docker compose up -d                # start all services detached
  docker compose up --build           # rebuild images then start
  docker compose down                 # stop + remove containers & networks
  docker compose down -v              # also remove named volumes
  docker compose logs -f              # tail all service logs
  docker compose logs -f api          # tail just the api service
  docker compose exec api sh          # shell into the running api container
  docker compose exec db psql -U user -d mydb   # open psql in db container
  docker compose ps                   # show service status
  docker compose restart api          # restart one service
  docker compose run --rm api npm test  # one-off command in a new container
*/

console.log("docker compose up -d  → starts API + Postgres + Redis in one command");
console.log("Services reach each other by service name (e.g. host='db' for postgres)");

// ───────────────────────────────────────────────────────────────
// 5. Environment Variables and Secrets
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Environment Variables and Secrets ===");

/*
  GOLDEN RULE: never bake secrets into a Docker image.
  ─────────────────────────────────────────────────────
  If you write:
    ENV DATABASE_PASSWORD=supersecret
  …that value is visible in:
    docker history myapp:1.0
    docker inspect myapp:1.0
    Any registry where the image is pushed
  It lives in the image layer forever — even if you add a later layer that
  deletes it.

  ARG vs ENV
  ──────────
  ARG  → build-time variable.  Available ONLY during `docker build`.
         NOT present in the running container.
         Visible in docker history (still avoid secrets here).
  ENV  → runtime variable.  Set in the image, present in every container
         started from it.  Can be overridden at `docker run -e`.

  ARG example (fine for non-secret build config):
    ARG NODE_ENV=production
    ENV NODE_ENV=${NODE_ENV}          # promote ARG → ENV

  Build with a custom arg:
    docker build --build-arg NODE_ENV=staging -t myapp:staging .

  ──────────────────────────────────────────────────────────────────
  Runtime secrets — best practices per environment
  ──────────────────────────────────────────────────────────────────

  Local development:
    • .env file + --env-file flag or env_file: in compose
    • .env must be in .gitignore AND .dockerignore

  CI/CD pipelines:
    • Store secrets in the CI secret store (GitHub Actions Secrets,
      GitLab CI variables, CircleCI contexts)
    • Inject at runtime:
        docker run -e DB_URL=${{ secrets.DB_URL }} myapp:1.0

  Production — Docker Swarm:
    • docker secret create db_password ./password.txt
    • Reference in compose:
        secrets:
          - db_password
      Secrets are mounted as files at /run/secrets/db_password
      NOT exposed as environment variables (safer — not visible in ps)

  Production — Kubernetes:
    • kubectl create secret generic db-secret --from-literal=password=…
    • Mount as env var or volume in Pod spec

  Production — Cloud managed secrets:
    • AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault
    • Sidecar or init-container fetches secret at startup and injects it

  ──────────────────────────────────────────────────────────────────
  .env file example (dev only, NEVER commit)
  ──────────────────────────────────────────────────────────────────
  DATABASE_URL=postgres://user:pass@localhost:5432/mydb
  JWT_SECRET=my-local-dev-secret
  REDIS_URL=redis://localhost:6379

  .env.example (commit this — documents required vars without values)
  DATABASE_URL=
  JWT_SECRET=
  REDIS_URL=
*/

const secretsDemo = {
    buildArg: "ARG  → available during docker build only",
    envVar:   "ENV  → baked into image, present at runtime (override with -e)",
    envFile:  "--env-file .env  → inject at docker run (dev / CI)",
    rule:     "Never ENV a secret — use runtime injection or Docker secrets",
};
console.log("Secrets strategy:", JSON.stringify(secretsDemo, null, 2));

// ───────────────────────────────────────────────────────────────
// 6. Container Security
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Container Security ===");

/*
  1. RUN AS NON-ROOT USER
  ───────────────────────
  Containers run as root by default.  If an attacker exploits your app
  and escapes the container, root inside ≈ root on the host (especially
  without user namespaces).

  Fix — add to Dockerfile (node:alpine already has a "node" user):

    # Create user (if not already on the base image)
    RUN addgroup -S appgroup && adduser -S appuser -G appgroup

    # Switch to non-root user
    USER node          # built-in on node:alpine images

  Everything after USER node runs as that user.
  Do npm ci and COPY before the USER instruction (need root for those).

  ┌─────────────────────────────────────────────────────────┐
  │  WORKDIR /app                                           │
  │  COPY package*.json ./                                  │
  │  RUN  npm ci --only=production                          │
  │  COPY --chown=node:node . .         ← set file owner   │
  │  USER node                          ← switch user       │
  │  CMD ["node", "dist/index.js"]                          │
  └─────────────────────────────────────────────────────────┘

  2. READ-ONLY FILESYSTEM
  ───────────────────────
  Prevents malware from writing persistent files to the container:
    docker run --read-only myapp:1.0

  If your app genuinely needs to write (tmp files, uploads), mount
  a specific writable tmpfs:
    docker run --read-only --tmpfs /tmp myapp:1.0

  3. DROP CAPABILITIES
  ────────────────────
  Linux capabilities grant specific root-like powers.
  Drop everything, add back only what you need:
    docker run --cap-drop ALL --cap-add NET_BIND_SERVICE myapp:1.0

  NET_BIND_SERVICE → bind ports < 1024 (only needed if listening on 80/443)
  Most apps binding on 3000+ need zero extra capabilities.

  4. NO --privileged
  ───────────────────
  --privileged gives the container FULL host access (all capabilities,
  all devices, no seccomp).  Never use in production.

  5. IMAGE VULNERABILITY SCANNING
  ─────────────────────────────────
  docker scout cves myapp:1.0        # Docker's built-in scanner
  trivy image myapp:1.0             # OSS scanner (Aqua Security)
  grype myapp:1.0                   # Anchore's scanner

  Integrate into CI — fail the build if HIGH/CRITICAL CVEs are found:
    trivy image --exit-code 1 --severity HIGH,CRITICAL myapp:1.0

  6. PIN IMAGE TAGS — NEVER USE :latest
  ──────────────────────────────────────
  FROM node:latest     ← bad: breaks silently when upstream updates
  FROM node:20-alpine  ← good: predictable
  FROM node:20.14.0-alpine3.20  ← best: fully pinned (use in production)

  7. HEALTHCHECK INSTRUCTION
  ───────────────────────────
  Tells the Docker daemon how to check if the container is actually healthy:

    HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
      CMD curl -f http://localhost:3000/health || exit 1

  Status: starting → healthy | unhealthy
  Orchestrators (Kubernetes, ECS) use this to route traffic away from
  unhealthy instances and restart them.
*/

const securityChecklist = [
    "USER node  — run as non-root",
    "--read-only — immutable filesystem",
    "--cap-drop ALL — no extra Linux capabilities",
    "no --privileged",
    "trivy / docker scout — scan for CVEs in CI",
    "Pin image tags: FROM node:20.14.0-alpine3.20",
    "HEALTHCHECK in Dockerfile",
    "Secrets via runtime injection, never ENV",
];
console.log("Container security checklist:");
securityChecklist.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));

// ───────────────────────────────────────────────────────────────
// 7. Volumes and Persistence
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. Volumes and Persistence ===");

/*
  Containers are EPHEMERAL.  When you `docker rm` a container, everything
  written to its filesystem is gone.  Use volumes for data that must persist.

  ────────────────────────────────────────────────────────────
  1. NAMED VOLUMES  (recommended for databases)
  ────────────────────────────────────────────────────────────
  docker run -v pgdata:/var/lib/postgresql/data postgres:16

  • Managed by Docker (stored in /var/lib/docker/volumes/ on Linux)
  • Survive container removal: `docker rm db` → data intact
  • Destroyed only by: `docker volume rm pgdata` or `docker compose down -v`
  • Best for: PostgreSQL, MySQL, MongoDB, Redis persistence, uploads

  In docker-compose.yml:
    volumes:
      pgdata:           ← declare at top level

    services:
      db:
        volumes:
          - pgdata:/var/lib/postgresql/data   ← reference it

  ────────────────────────────────────────────────────────────
  2. BIND MOUNTS  (recommended for local development)
  ────────────────────────────────────────────────────────────
  docker run -v $(pwd)/src:/app/src myapp:1.0

  • Maps a HOST directory → container path
  • Changes on host are instantly visible inside the container
  • Best for: live reload in dev (nodemon watches /app/src)
  • Avoid in production: couples container to host filesystem

  In docker-compose.yml (dev override):
    volumes:
      - ./src:/app/src          # live reload
      - ./package.json:/app/package.json

  ────────────────────────────────────────────────────────────
  3. TMPFS MOUNTS  (in-memory, no persistence)
  ────────────────────────────────────────────────────────────
  docker run --tmpfs /tmp:size=100m myapp:1.0

  • Stored in host RAM, never written to disk
  • Destroyed when container stops
  • Best for: temp files when using --read-only

  ────────────────────────────────────────────────────────────
  Volume lifecycle commands
  ────────────────────────────────────────────────────────────
  docker volume ls                  # list all named volumes
  docker volume inspect pgdata      # inspect a volume (shows mountpoint)
  docker volume rm pgdata           # delete a volume (data gone!)
  docker volume prune               # remove all unused volumes

  Pro tip: never mount the host's node_modules into the container.
  Use an anonymous volume to shadow it:
    services:
      api:
        volumes:
          - .:/app                  # bind mount source
          - /app/node_modules       # anonymous vol shadows host node_modules
*/

console.log("Named volumes  → persist across container restarts (databases)");
console.log("Bind mounts    → host ↔ container sync (dev live reload)");
console.log("Tmpfs mounts   → in-memory scratch space (read-only containers)");

// ───────────────────────────────────────────────────────────────
// 8. Production Docker Patterns
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. Production Docker Patterns ===");

/*
  1. HEALTH CHECK ENDPOINT
  ─────────────────────────
  Add a /health route to your Express app:

    app.get("/health", (_req, res) => {
      res.json({ status: "ok", uptime: process.uptime() });
    });

  Wire it to the HEALTHCHECK instruction in the Dockerfile:
    HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
      CMD wget -qO- http://localhost:3000/health || exit 1

  (Use wget on Alpine — curl may not be installed.)

  2. GRACEFUL SHUTDOWN (SIGTERM HANDLER)
  ───────────────────────────────────────
  `docker stop` sends SIGTERM, waits 10 s, then sends SIGKILL.
  If you don't handle SIGTERM, connections are dropped hard.

    const server = app.listen(3000);

    process.on("SIGTERM", () => {
      console.log("SIGTERM received — shutting down gracefully");
      server.close(() => {
        console.log("HTTP server closed");
        process.exit(0);
      });
    });

  3. INIT PROCESS (tini)
  ──────────────────────
  PID 1 inside a container must forward signals to child processes.
  `node` does NOT do this by default, so SIGTERM never reaches your app.

  Fix:
    Option A — use Docker's --init flag:
      docker run --init myapp:1.0

    Option B — install tini in the Dockerfile (explicit, portable):
      RUN apk add --no-cache tini
      ENTRYPOINT ["/sbin/tini", "--"]
      CMD ["node", "dist/index.js"]

  4. RESOURCE LIMITS
  ───────────────────
  Prevent a runaway container from starving the host:
    docker run --memory="512m" --cpus="0.5" myapp:1.0

  In docker-compose.yml (v3.9 with deploy):
    services:
      api:
        deploy:
          resources:
            limits:
              memory: 512M
              cpus: "0.50"

  5. MULTI-PLATFORM BUILDS (docker buildx)
  ─────────────────────────────────────────
  Build for multiple CPU architectures from one machine:
    docker buildx create --use
    docker buildx build \
      --platform linux/amd64,linux/arm64 \
      -t myregistry/myapp:1.0 \
      --push .

  Why? Developers on M1/M2 Macs (arm64) deploying to AWS EC2 (amd64).
  Running a mismatched image works but is ~3× slower via emulation.

  6. LAYER ORDERING FOR CACHE EFFICIENCY
  ─────────────────────────────────────────
  Least-changed layers → top.  Most-changed layers → bottom.

  Best order:
    FROM …               ← rarely changes
    COPY package*.json   ← changes when deps change
    RUN npm ci           ← cached while package*.json is unchanged
    COPY . .             ← changes on every source edit
    RUN npm run build    ← only runs when source changes
    CMD …

  7. .dockerignore IS MANDATORY
  ──────────────────────────────
  node_modules   ← ~100 MB you don't need (rebuilt inside)
  .env           ← secrets
  .git           ← history blob
  dist           ← rebuilt inside
  coverage
  *.log
  .DS_Store
  Dockerfile     ← avoid copying Dockerfile into itself (minor)
*/

// Demonstrate graceful shutdown pattern in TypeScript
function createShutdownHandler(serverName: string): () => void {
    return function gracefulShutdown(): void {
        console.log(`[${serverName}] SIGTERM received — draining connections…`);
        // In a real app: server.close(() => process.exit(0))
        console.log(`[${serverName}] Shutdown complete`);
    };
}

const shutdownHandler = createShutdownHandler("API");
// process.on("SIGTERM", shutdownHandler);  // uncomment in real app
console.log("Graceful shutdown handler created:", shutdownHandler.name);

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice Q&A ===");

/*
  Q1: Why does `COPY package*.json ./` come before `COPY . .` in a Dockerfile?

  A: Docker builds images as a stack of LAYERS.  Each instruction either
     hits the cache or runs fresh.  A layer is invalidated the moment any
     file it COPYed changes.  By copying package*.json alone first:
       • If only source files changed → package*.json layer = cache hit
         → `RUN npm ci` skips (uses cached node_modules)
         → only the COPY . . and later layers rebuild
       • If package.json changed → npm ci reruns from that point down
     Reversing the order means every source edit reruns npm ci (~minutes
     wasted per build).  Always put slow, rarely-changing layers first.


  Q2: What does a multi-stage build save you compared to a single-stage build?

  A: A single-stage build that compiles TypeScript installs all devDependencies
     (TypeScript, ts-node, Jest, ESLint, etc.) and keeps them in the final
     image alongside the raw .ts source files.  Typical result: 700–900 MB.

     A multi-stage build uses a "builder" stage with the full toolchain to
     produce dist/, then starts a fresh alpine image ("runtime" stage) that
     copies ONLY dist/ and production node_modules.  The builder stage is
     discarded — it never ships.  Result: 80–120 MB.

     Benefits:
     • Smaller attack surface (TypeScript compiler is not a runtime dep)
     • Faster pulls / deploys (less data over the wire)
     • No source code in the production image (mild IP protection)
     • Same docker build command — Docker handles stages internally


  Q3: You need PostgreSQL running alongside your API in development.
      How do you set this up?

  A: Use docker-compose.yml with two services:

     services:
       api:
         build: .
         ports: ["3000:3000"]
         environment:
           DATABASE_URL: postgres://user:pass@db:5432/mydb
         depends_on:
           db:
             condition: service_healthy    # wait for pg to be ready

       db:
         image: postgres:16-alpine
         environment:
           POSTGRES_USER: user
           POSTGRES_PASSWORD: pass
           POSTGRES_DB: mydb
         volumes:
           - pgdata:/var/lib/postgresql/data   # persist data
         healthcheck:
           test: ["CMD-SHELL", "pg_isready -U user -d mydb"]
           interval: 10s
           retries: 5

     volumes:
       pgdata:

     Key points:
     • Services reach each other by SERVICE NAME inside Docker's network
       (host = "db" in DATABASE_URL, not "localhost").
     • `depends_on` with `condition: service_healthy` waits for pg to
       pass its healthcheck before starting the API — prevents connection
       errors at startup.
     • The named volume `pgdata` means `docker compose down` does NOT
       delete your database.  `docker compose down -v` does.

     Start with:  docker compose up -d
     Tear down:   docker compose down


  Q4: Your container runs as root. What's the risk and how do you fix it?

  A: Risk — if an attacker exploits your app (e.g. RCE via a dependency
     vulnerability), they get a root shell inside the container.  Without
     proper user namespace isolation, root inside a container can:
     • Read/write host filesystem mounts
     • Load kernel modules (with --privileged)
     • Escalate to host root via kernel exploits

     Fix — switch to a non-root user in the Dockerfile:

       # node:alpine ships with a built-in "node" user (UID 1000)
       COPY --chown=node:node . .    # set file ownership before switching
       USER node                      # all subsequent layers run as "node"
       CMD ["node", "dist/index.js"]

     Also add at runtime for defence-in-depth:
       docker run --cap-drop ALL --read-only myapp:1.0


  Q5: What's the difference between `ARG` and `ENV` in a Dockerfile?

  A:
     ARG (build-time argument)
     • Available ONLY during `docker build`
     • Not present in the running container
     • Declared:  ARG NODE_ENV=production
     • Supplied:  docker build --build-arg NODE_ENV=staging .
     • Visible in docker history — do NOT use for secrets

     ENV (environment variable)
     • Baked INTO the image layer
     • Present in every container started from that image
     • Can be overridden at runtime: docker run -e KEY=value …
     • Also visible in docker inspect — do NOT use for secrets

     Pattern to promote an ARG to an ENV (for build-time config only):
       ARG  NODE_ENV=production
       ENV  NODE_ENV=${NODE_ENV}    ← now available at runtime too

     For secrets: NEITHER ARG nor ENV.  Inject at runtime via:
       docker run --env-file .env …   (dev)
       CI secret stores               (CI/CD)
       Docker Secrets / Vault         (production)
*/

console.log("Q1: Copy package.json first → `npm ci` layer cached on source-only changes");
console.log("Q2: Multi-stage cuts image from ~800 MB → ~90 MB; builder stage discarded");
console.log("Q3: docker-compose.yml with two services + depends_on healthcheck");
console.log("Q4: Root in container = host risk if exploited → add USER node");
console.log("Q5: ARG = build-time only; ENV = baked into image and runtime");

// ───────────────────────────────────────────────────────────────
// runDemo — Reference card
// ───────────────────────────────────────────────────────────────

function runDemo(): void {
    console.log("\n" + "═".repeat(64));
    console.log("DOCKER REFERENCE CARD");
    console.log("═".repeat(64));

    console.log(`
┌─────────────────────────────────────────────────────────────┐
│  ESSENTIAL CLI COMMANDS                                     │
├─────────────────────────────────────────────────────────────┤
│  docker build -t myapp:1.0 .       build image              │
│  docker run -d -p 3000:3000 \\                               │
│    --name api myapp:1.0            run detached             │
│  docker ps                         list running containers  │
│  docker ps -a                      all containers           │
│  docker logs -f api                tail container logs      │
│  docker exec -it api sh            shell into container     │
│  docker stop api                   graceful stop (SIGTERM)  │
│  docker rm api                     delete container         │
│  docker images                     list local images        │
│  docker rmi myapp:1.0              delete image             │
│  docker system prune               cleanup dangling layers  │
│  docker volume ls                  list named volumes       │
│  docker volume prune               remove unused volumes    │
│  docker compose up -d              start all services       │
│  docker compose down               stop + remove containers │
│  docker compose down -v            also remove volumes      │
│  docker compose logs -f            tail all service logs    │
│  docker compose exec api sh        shell into service       │
└─────────────────────────────────────────────────────────────┘`);

    console.log(`
┌─────────────────────────────────────────────────────────────┐
│  MULTI-STAGE DOCKERFILE TEMPLATE (Node.js + TypeScript)     │
└─────────────────────────────────────────────────────────────┘

# ── Stage 1: Build ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Copy manifests first (layer cache trick)
COPY package*.json ./
RUN  npm ci

# 2. Copy source and compile
COPY . .
RUN  npm run build          # tsc → dist/

# ── Stage 2: Production runtime ───────────────────────────────
FROM node:20-alpine AS runtime

# Install tini for proper signal forwarding
RUN apk add --no-cache tini

WORKDIR /app

# Production deps only
COPY package*.json ./
RUN  npm ci --only=production

# Copy ONLY compiled output from builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \\
  CMD wget -qO- http://localhost:3000/health || exit 1

# Non-root user (ships with node:alpine)
COPY --chown=node:node . .
USER node

# Init process → CMD
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]`);

    console.log(`
┌─────────────────────────────────────────────────────────────┐
│  .dockerignore (place next to Dockerfile)                   │
└─────────────────────────────────────────────────────────────┘

node_modules
dist
.env
.git
*.log
coverage
.DS_Store`);

    console.log(`
┌─────────────────────────────────────────────────────────────┐
│  SECURITY CHECKLIST                                         │
└─────────────────────────────────────────────────────────────┘

  [x] USER node            — non-root
  [x] --read-only          — immutable filesystem at runtime
  [x] --cap-drop ALL       — drop linux capabilities
  [x] no --privileged
  [x] pin image tags       — FROM node:20.14.0-alpine3.20
  [x] HEALTHCHECK          — liveness detection
  [x] tini ENTRYPOINT      — correct signal forwarding
  [x] secrets via runtime  — never ARG/ENV for credentials
  [x] trivy / docker scout — scan images in CI pipeline`);

    console.log(`
┌─────────────────────────────────────────────────────────────┐
│  LAYER CACHING ORDER (most → least stable)                  │
└─────────────────────────────────────────────────────────────┘

  FROM       → rarely changes
  COPY pkg   → changes when deps change
  RUN ci     → cached while package*.json unchanged
  COPY src   → changes every commit
  RUN build  → only when src changes
  CMD        → startup command`);

    console.log(`
┌─────────────────────────────────────────────────────────────┐
│  VOLUME TYPES AT A GLANCE                                   │
└─────────────────────────────────────────────────────────────┘

  Named volume  → -v pgdata:/var/lib/postgresql/data
    Persists across container restarts. Managed by Docker.
    Use for: databases, upload stores.

  Bind mount    → -v $(pwd)/src:/app/src
    Host ↔ container file sync. Instant live reload.
    Use for: local development only.

  Tmpfs mount   → --tmpfs /tmp:size=100m
    In-memory, no disk write. Vanishes on stop.
    Use for: temp files inside --read-only containers.`);

    console.log("\n" + "═".repeat(64));
    console.log("Day 52 complete — Docker, multi-stage builds, compose, security");
    console.log("═".repeat(64));
}

export default runDemo;

runDemo();
