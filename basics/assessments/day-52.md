# Day 52 Assessment — Docker · Multi-stage Builds · docker-compose · Container Security

**Theme:** You are the DevOps-minded engineer at a startup shipping its first container-based deployment. The team knows Docker exists but has never written a production Dockerfile. You're establishing the containerization standards the team will follow for all future services.

---

### Q1 — Docker Fundamentals ⭐

**Scenario:** A new engineer joins and asks "what's the difference between a Docker image and a container? And what does a Dockerfile actually do?"

**Task:** Explain what an image is, what a container is, and what a Dockerfile is. Explain the difference between `docker build` and `docker run`.

**Acceptance Criteria:**
- [ ] Defines image correctly: read-only filesystem snapshot organized as layers, plus metadata (env vars, entry point, exposed ports)
- [ ] Defines container correctly: a running instance of an image — an isolated process with its own filesystem, network, and process space
- [ ] Defines Dockerfile correctly: a text file with sequential instructions Docker executes to build an image
- [ ] Explains `docker build`: reads the Dockerfile, executes each instruction, produces a new image tagged with a name
- [ ] Explains `docker run`: creates a container from the named image and starts it
- [ ] Notes the analogy: image is a class, container is an instance (or image is a recipe, container is the dish)
- [ ] Mentions that multiple containers can run from the same image simultaneously

---

### Q2 — Layer Caching ⭐

**Scenario:** Your Node.js Dockerfile looks like this:
```dockerfile
COPY . .
RUN npm ci
```
Every build takes 90 seconds even when you only changed one line of application code.

**Task:** Explain why this is slow. Show the correct layer order. Explain how Docker decides when to invalidate cache.

**Acceptance Criteria:**
- [ ] Explains the problem: `COPY . .` copies all source files, invalidating cache on any file change — even a README change triggers `npm ci`
- [ ] Shows correct order: `COPY package*.json ./` → `RUN npm ci` → `COPY . .`
- [ ] Explains Docker cache invalidation: if a layer's instruction or its inputs change, that layer and ALL subsequent layers are re-run
- [ ] States the result: with correct order, `npm ci` only re-runs when `package.json` or `package-lock.json` changes
- [ ] Notes `package*.json` glob copies both `package.json` and `package-lock.json`
- [ ] Mentions that cache is per-machine by default — CI machines often start with empty cache (use registry cache or `--cache-from`)

---

### Q3 — Multi-stage Builds ⭐

**Scenario:** Your production Docker image is 1.2 GB. It contains TypeScript, ts-node, all devDependencies, and raw `.ts` source files — none of which belong in production.

**Task:** Write a 2-stage Dockerfile: a builder stage that compiles TypeScript, and a production stage that copies only the compiled `dist/` folder and production dependencies. State a typical size reduction.

**Acceptance Criteria:**
- [ ] Stage 1 uses `FROM node:20 AS builder` (or similar)
- [ ] Stage 1 runs `npm ci` (all deps including devDeps) and `npm run build` (or `tsc`)
- [ ] Stage 2 uses `FROM node:20-alpine AS production` (smaller base image)
- [ ] Stage 2 uses `COPY --from=builder /app/dist ./dist` to copy compiled output
- [ ] Stage 2 runs `npm ci --only=production` (or `npm ci --omit=dev`) — only production deps
- [ ] Stage 2 does NOT contain TypeScript compiler, devDependencies, or raw `.ts` files
- [ ] States typical size reduction: from ~500–900 MB to ~80–180 MB

---

### Q4 — Alpine vs Full Node Image ⭐

**Scenario:** Your colleague uses `FROM node:20` (full Debian image) for production. You suggest switching to Alpine. They ask about trade-offs.

**Task:** Explain why `node:20-alpine` is preferred for production, when to avoid it, and what the alternative `node:20-slim` offers.

**Acceptance Criteria:**
- [ ] States Alpine size advantage: ~50 MB vs ~1 GB for the full image
- [ ] Explains why Alpine is smaller: uses musl libc and busybox instead of glibc and full GNU utils
- [ ] States when to avoid Alpine: native Node.js modules that require glibc (e.g., `bcrypt`, `sharp`, some database drivers compiled with glibc assumptions)
- [ ] Explains the musl vs glibc incompatibility: precompiled binaries linked against glibc won't run on Alpine
- [ ] Describes `node:20-slim`: Debian-based (glibc), strips non-essential packages, ~150–250 MB — good compromise
- [ ] Recommends testing Alpine builds on CI (not just locally) to catch native module issues early

---

### Q5 — .dockerignore File ⭐⭐

**Scenario:** Your Docker builds are slow and your colleague accidentally committed a `.env` file into the image. The security team is alarmed.

**Task:** List what belongs in `.dockerignore`. Explain why `.env` is critical to exclude. Explain what happens if `node_modules` is copied into the image.

**Acceptance Criteria:**
- [ ] Lists `node_modules/` as required entry — wrong platform binaries, massive size (hundreds of MB)
- [ ] Lists `dist/` or `build/` — stale compiled output that should be regenerated inside the image
- [ ] Lists `.env` — secrets must never be baked into an image; `docker inspect` or `docker history` can reveal them
- [ ] Lists `.git/` — large, unnecessary, can expose source history
- [ ] Includes at least two more sensible entries: `*.md`, `coverage/`, `.DS_Store`, `*.log`, `test/`, `.github/`
- [ ] Explains `.env` severity: secrets in an image are accessible to anyone who pulls it, even from private registries if access is later granted
- [ ] Explains `node_modules` cross-platform issue: binaries compiled on macOS won't work on Linux containers

---

### Q6 — Non-root User ⭐⭐

**Scenario:** A security audit flags that your Node.js container runs as `root`. The auditor says this is a critical finding.

**Task:** Explain why running as root in a container is risky. Show how to add a non-root user in the Dockerfile, set file permissions before switching, and use `--chown` in `COPY`.

**Acceptance Criteria:**
- [ ] Explains the risk: if the container is compromised (e.g., via a code execution vulnerability), the attacker has root access inside the container, which can be used to escape the container or access mounted volumes
- [ ] Shows `USER node` directive (node user is pre-created in official Node images)
- [ ] Shows `RUN chown -R node:node /app` before the `USER node` instruction
- [ ] Shows `COPY --chown=node:node . .` to set ownership at copy time (more efficient than separate `chown`)
- [ ] Notes that `USER node` must come AFTER all file operations requiring root (installing packages, setting permissions)
- [ ] Mentions that `node:20-alpine` includes the `node` user; custom base images need `RUN addgroup --system node && adduser --system --ingroup node node`

---

### Q7 — Environment Variables in Docker ⭐⭐

**Scenario:** Your team has three different approaches to environment variables: one engineer uses `ENV DB_PASSWORD=prod123` in the Dockerfile, another uses `--env-file .env` at runtime, and a third wants to use Docker secrets.

**Task:** Explain the difference between each approach, rank them by security, and explain why `ENV` for secrets is dangerous.

**Acceptance Criteria:**
- [ ] Explains `ENV KEY=value` in Dockerfile: baked into image layers, visible via `docker inspect <image>` and `docker history`
- [ ] States `ENV` for secrets is dangerous: the secret is stored permanently in the image and any image layer, even after removal
- [ ] Explains `--env-file .env` at runtime: variables injected at container start, not stored in image — `.env` file stays on host
- [ ] Explains Docker secrets: mounted as files at `/run/secrets/<name>`, only available to specific containers, never in image or env vars
- [ ] Ranks security: Docker secrets > `--env-file` at runtime > `ENV` in Dockerfile
- [ ] Notes that `--env-file` secrets can be seen via `docker inspect <container>` on the running container
- [ ] Recommends Docker secrets (or Kubernetes Secrets / HashiCorp Vault) for production

---

### Q8 — docker-compose for Development ⭐⭐

**Scenario:** Your `docker-compose.yml` has `depends_on: [postgres]`, but the app container crashes at startup because it tries to connect to Postgres before Postgres is ready to accept connections.

**Task:** Explain what `depends_on` does and what it doesn't do. Show how to add a healthcheck to the postgres service and use `condition: service_healthy`. Show the postgres healthcheck command.

**Acceptance Criteria:**
- [ ] Explains what `depends_on` does: ensures postgres container starts before the app container
- [ ] Explains what `depends_on` does NOT do: does not wait for postgres to be ready to accept connections — only waits for the container process to start
- [ ] Shows postgres healthcheck: `test: ["CMD-SHELL", "pg_isready -U postgres"]`
- [ ] Shows `interval`, `timeout`, `retries` fields on the healthcheck (reasonable values: 5s interval, 5s timeout, 5 retries)
- [ ] Shows `depends_on: postgres: condition: service_healthy` in the app service
- [ ] Explains that with `condition: service_healthy`, Compose waits until the healthcheck passes before starting the dependent service
- [ ] Notes an alternative: application-level retry logic with exponential backoff (resilient even without healthchecks)

---

### Q9 — Volume Types ⭐⭐

**Scenario:** A developer deletes a container to "restart fresh" and is horrified that the PostgreSQL data is gone. Another developer has hot-reload not working because source code changes aren't reflected in the container.

**Task:** Explain bind mounts vs named volumes, when to use each, and what `docker compose down -v` does.

**Acceptance Criteria:**
- [ ] Defines bind mount: maps a specific host directory path into the container — `- ./src:/app/src`
- [ ] Defines named volume: Docker-managed storage independent of host path — `- postgres-data:/var/lib/postgresql/data`
- [ ] States when to use bind mounts: development hot-reload, sharing config files with the host
- [ ] States when to use named volumes: persistent data that must survive container restarts (databases, uploads)
- [ ] Explains why the developer lost data: using a bind mount to a temp directory, or using an anonymous volume that was removed with the container
- [ ] Explains `docker compose down -v`: removes the named volumes defined in the compose file — permanently deletes database data
- [ ] Warns about `down -v` being irreversible for development databases

---

### Q10 — Port Mapping ⭐⭐

**Scenario:** Your compose file has `ports: ["3001:3001"]` for the API and `ports: ["5432:5432"]` for Postgres. A teammate asks what happens if they already have Postgres running locally on port 5432.

**Task:** Explain HOST_PORT:CONTAINER_PORT mapping. Show an example where the ports differ. Explain what `EXPOSE` in a Dockerfile actually does vs port mapping.

**Acceptance Criteria:**
- [ ] Correctly explains the format: `"HOST_PORT:CONTAINER_PORT"` — left is the port on the developer's machine, right is inside the container
- [ ] Explains the conflict scenario: local Postgres on 5432 conflicts with `"5432:5432"` — fix with `"5433:5432"` (host 5433 → container 5432)
- [ ] Shows a concrete differing example: `"8080:3001"` — developer accesses `localhost:8080`, container listens on `3001`
- [ ] Explains `EXPOSE 3001` in Dockerfile: documentation only — tells other developers and tools which port the app uses; does NOT publish the port to the host
- [ ] Notes that containers on the same Docker network communicate on container ports directly, without host port mapping
- [ ] Mentions `"127.0.0.1:3001:3001"` binds only to localhost (security hardening for production-like setups)

---

### Q11 — Resource Limits ⭐⭐

**Scenario:** Your production server running 5 Docker containers slows to a crawl whenever the image processing container runs. It consumes all available memory and CPU.

**Task:** Show how to set `mem_limit` and `cpus` in docker-compose. Explain what happens when a container exceeds its memory limit. Explain how to monitor resource usage.

**Acceptance Criteria:**
- [ ] Shows `mem_limit: 512m` (or `deploy.resources.limits.memory: 512M` for compose v3) correctly
- [ ] Shows `cpus: '0.5'` to limit to half a CPU core
- [ ] Explains OOMKilled: Linux kernel kills the container process when it exceeds memory limit — Docker shows status as `OOMKilled`
- [ ] Explains impact of no limits: one container can starve all others by monopolizing CPU or exhausting available RAM
- [ ] Shows `docker stats` command: real-time CPU%, MEM USAGE/LIMIT, NET I/O, BLOCK I/O per container
- [ ] Notes that `mem_limit` without `memswap_limit` defaults swap to 2× memory limit — set `memswap_limit` equal to `mem_limit` to disable swap

---

### Q12 — Production Image Security ⭐⭐⭐

**Scenario:** Your security team requires a security sign-off before the first production deployment. They ask for your Docker security checklist.

**Task:** Describe 5 production image security practices. Explain what `--read-only` requires for runtime. Mention vulnerability scanning tools.

**Acceptance Criteria:**
- [ ] Lists non-root user: `USER node` — limits blast radius of container compromise
- [ ] Lists minimal base image: Alpine or slim variant — fewer packages = smaller attack surface
- [ ] Lists no secrets in image: never use `ENV` for passwords/tokens; use runtime injection or Docker secrets
- [ ] Lists read-only filesystem: `docker run --read-only` prevents an attacker from writing malware to the container filesystem
- [ ] Explains `--read-only` requirement: app needs writable paths like `/tmp` — add `--tmpfs /tmp` for in-memory writable temp
- [ ] Lists vulnerability scanning: `docker scout cves <image>` (Docker's built-in) or `trivy image <image>` (open source) — scans OS packages and npm deps
- [ ] Mentions pinning base image by digest (`node:20-alpine@sha256:...`) to prevent supply chain attacks from floating tags

---

### Q13 — Multi-architecture Builds ⭐⭐⭐

**Scenario:** Your team develops on M1/M2 Macs (arm64). The production servers are AMD64 Linux. Images built locally crash on the server with "exec format error."

**Task:** Explain why this happens. Show the `docker buildx` command to build for `linux/amd64`. Explain multi-arch manifests and how CI should handle this.

**Acceptance Criteria:**
- [ ] Explains the root cause: arm64 binary instructions are incompatible with amd64 — the Docker image contains ARM-compiled binaries
- [ ] Shows `docker buildx build --platform linux/amd64 -t myapp:latest .`
- [ ] Explains that `docker buildx` uses QEMU emulation or cross-compilation to build for a foreign architecture
- [ ] Shows multi-arch manifest syntax: `--platform linux/amd64,linux/arm64` builds both and creates a manifest list
- [ ] Explains manifest list behavior: `docker pull myapp:latest` automatically pulls the right architecture for the current machine
- [ ] States CI recommendation: always build with `--platform linux/amd64` regardless of runner architecture to match production
- [ ] Notes that `--push` is required for multi-arch builds (multi-arch manifests cannot be stored in local Docker daemon)

---

### Q14 — Health Checks ⭐⭐⭐

**Scenario:** Your container keeps restarting in production because the app takes 15 seconds to initialize (DB migration runs on startup). The orchestrator marks it unhealthy and kills it before it finishes starting.

**Task:** Show a Dockerfile HEALTHCHECK directive. Explain `healthy` vs `unhealthy` in docker-compose. Add `start_period` to handle slow startup. Show `retries`.

**Acceptance Criteria:**
- [ ] Shows valid HEALTHCHECK: `HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD curl -f http://localhost:3001/health || exit 1`
- [ ] Explains `--start-period`: grace period after container starts before health check failures count — prevents premature `unhealthy` during initialization
- [ ] Explains `--retries`: number of consecutive failures before marking `unhealthy` (single transient failure won't kill the container)
- [ ] Explains `healthy` status: all health checks passing — orchestrators route traffic to this container
- [ ] Explains `unhealthy` status: retries exhausted — Docker Swarm/Kubernetes stops routing traffic and may restart the container
- [ ] Notes that in docker-compose without Swarm mode, `unhealthy` containers are not automatically restarted — that requires `restart: unless-stopped` + `depends_on: condition: service_healthy`
- [ ] Mentions that `curl` must be installed in the image (not available in all Alpine images — use `wget` instead or install curl)

---

### Q15 — Container Orchestration Beyond Compose ⭐⭐⭐

**Scenario:** Your startup has grown to 15 engineers and 8 microservices. docker-compose works fine locally but your CTO says "we need to move off this for production." You need to make the case for what comes next.

**Task:** Explain why docker-compose isn't suitable for production. List what Kubernetes adds. Describe managed alternatives for small teams. State when Kubernetes makes sense.

**Acceptance Criteria:**
- [ ] States docker-compose production limitations: no automatic container restart on node failure, no rolling deploys (zero-downtime updates), no horizontal auto-scaling, no built-in load balancing across multiple host machines
- [ ] Lists at least 4 Kubernetes additions: self-healing (restarts failed pods), rolling deployments, horizontal pod autoscaling, built-in service discovery + load balancing, resource quotas, declarative configuration
- [ ] Names at least 2 managed alternatives suitable for small teams: Railway, Fly.io, Render, AWS ECS, Heroku — handle orchestration without Kubernetes complexity
- [ ] Explains when Kubernetes makes sense: team > 10 engineers, complex routing needs (canary deployments, A/B traffic), multi-region deployments, cost optimization via bin-packing at scale
- [ ] States the cost-benefit tradeoff: Kubernetes adds significant operational overhead — 1–2 dedicated platform engineers needed
- [ ] Mentions Docker Swarm as a middle ground: simpler than Kubernetes, built into Docker, but largely superseded by Kubernetes in industry

---

## Scoring Rubric

Count the number of acceptance criteria checkboxes you fully satisfied across all 15 questions.

| Score | Level | What it means |
|-------|-------|---------------|
| 0–4   | 🔴 Re-study | Go back to the Day 52 teaching file. The Docker mental model needs to click before the details make sense. |
| 5–9   | 🟡 Progressing | You can write a basic Dockerfile but production concerns (multi-stage, security, health checks) need more practice. |
| 10–12 | 🟢 Solid | You can containerize a Node.js app for production confidently. Move on — revisit multi-arch and orchestration later. |
| 13–15 | 🚀 Ready to advance | Strong containerization knowledge. You can set Docker standards for a team and pass DevOps-focused interviews. |
