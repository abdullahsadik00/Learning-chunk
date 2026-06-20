# Day 52 — Docker

Day 52 is hands-on with Docker files rather than runnable TypeScript scripts.
Read each file and follow the commands in the comments.

## Files

- `Dockerfile` — multi-stage build for a Node.js API
- `docker-compose.yml` — local development stack (API + Postgres + Redis)
- `.dockerignore` — files excluded from the Docker build context

## Quick Start

```bash
# Build and start all services
docker compose up -d

# View API logs in real time
docker compose logs -f api

# Run only the database services (then run API locally with ts-node)
docker compose up -d postgres redis

# Stop everything (keeps volumes — data is preserved)
docker compose down

# Stop and remove all volumes (DELETES ALL DATABASE DATA)
docker compose down -v
```
