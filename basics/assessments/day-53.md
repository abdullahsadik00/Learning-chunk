# Day 53 Assessment — CI/CD · GitHub Actions · Automated Testing · Deployment Pipelines

**Theme:** You are the engineer implementing CI/CD for a startup that has been doing manual deployments. Every release takes 2 hours and causes anxiety. You're automating the pipeline so the team can ship with confidence multiple times per day.

---

### Q1 — CI vs CD Distinction ⭐

**Scenario:** Your CEO asks "what's the difference between CI, Continuous Delivery, and Continuous Deployment? Which should we use?" You need a clear, honest answer.

**Task:** Define all three terms precisely. Explain which level is appropriate for a startup and why.

**Acceptance Criteria:**
- [ ] Defines CI (Continuous Integration): automatically run tests and static checks on every commit/push — fast feedback loop, no long-lived divergent branches
- [ ] Defines Continuous Delivery: automatically deploy to staging on every merge to main; human approves before production deployment
- [ ] Defines Continuous Deployment: automatically deploy all the way to production on green CI — no human gate
- [ ] States appropriate level for a startup: typically Continuous Delivery — automated to staging, human approval for production
- [ ] Explains why not full Continuous Deployment for a startup: feature flags, customer communication, and rollback readiness must be in place first
- [ ] Notes that CI is the prerequisite for either CD level — you cannot safely automate deploys without automated tests

---

### Q2 — GitHub Actions Anatomy ⭐

**Scenario:** You're reading a colleague's workflow YAML and they ask you to explain every structural component.

**Task:** Define: Workflow, Event, Job, Step, Runner. Explain what `on: push: branches: [main]` means and how to also trigger on pull requests.

**Acceptance Criteria:**
- [ ] Defines Workflow: a YAML file in `.github/workflows/` that defines the automation triggered by events
- [ ] Defines Event: what triggers the workflow (e.g., `push`, `pull_request`, `schedule`, `workflow_dispatch`)
- [ ] Defines Job: a set of steps that run on a single runner; jobs run in parallel by default
- [ ] Defines Step: a single task within a job — either an Action (`uses:`) or a shell command (`run:`)
- [ ] Defines Runner: the virtual machine that executes a job (e.g., `ubuntu-latest`, `macos-latest`, `windows-latest`)
- [ ] Explains `on: push: branches: [main]`: triggers the workflow only when commits are pushed to the `main` branch
- [ ] Shows how to add PR trigger: `on: [push, pull_request]` or `on: pull_request: branches: [main]`

---

### Q3 — `needs` for Job Sequencing ⭐

**Scenario:** Your workflow has four jobs: `lint`, `typecheck`, `test`, `build`, `deploy`. You need them to run in the right order with parallelism where possible.

**Task:** Explain that jobs run in parallel by default. Show `needs` syntax. Draw/describe the DAG for: lint and typecheck run in parallel → test needs both → build needs test → deploy needs build and runs only on main.

**Acceptance Criteria:**
- [ ] States that jobs without `needs` run in parallel on separate runners simultaneously
- [ ] Shows `needs: [lint, typecheck]` on the `test` job
- [ ] Shows `needs: [test]` on the `build` job
- [ ] Shows `needs: [build]` on the `deploy` job
- [ ] Adds the `main`-only condition: `if: github.ref == 'refs/heads/main'` on the `deploy` job
- [ ] Explains the efficiency gain: lint + typecheck run simultaneously, cutting total time
- [ ] Notes that if `lint` fails, `typecheck` still runs to completion — `needs` only blocks downstream jobs

---

### Q4 — Secrets in GitHub Actions ⭐

**Scenario:** You need your CI pipeline to connect to a staging database and push to a Docker registry. How do you handle credentials securely?

**Task:** Show where secrets are stored in GitHub, how to reference them in a workflow, and how to pass them to a step. Explain why `echo ${{ secrets.DATABASE_URL }}` is dangerous (and why it's also safe in Actions specifically).

**Acceptance Criteria:**
- [ ] States secrets are stored in: repo Settings → Secrets and variables → Actions → Repository secrets
- [ ] Shows correct reference syntax: `${{ secrets.DATABASE_URL }}`
- [ ] Shows how to pass to a step: `env: DATABASE_URL: ${{ secrets.DATABASE_URL }}` in the step definition
- [ ] Explains why `echo ${{ secrets.DATABASE_URL }}` is dangerous in principle: could log secrets in other CI systems
- [ ] Notes GitHub Actions' protection: secrets are automatically masked in logs — replaced with `***`
- [ ] Notes the caveat: if the secret value appears in an encoded form (base64, URL-encoded), masking may not catch it
- [ ] Mentions organization-level secrets for sharing across multiple repos

---

### Q5 — Matrix Builds ⭐⭐

**Scenario:** Your Node.js library claims to support Node 18, 20, and 22. Currently you only test on Node 20 (your local version). A user reports a bug that only appears on Node 18.

**Task:** Show the matrix strategy syntax for testing across 3 Node versions. Explain what this catches. Show how to add an OS matrix and how to exclude a combination.

**Acceptance Criteria:**
- [ ] Shows `strategy: matrix: node: [18, 20, 22]` correctly
- [ ] Shows `uses: actions/setup-node@v4` with `node-version: ${{ matrix.node }}`
- [ ] Explains what matrix catches: version-specific API changes, deprecated features, behavior differences between Node LTS versions
- [ ] Shows OS matrix addition: `os: [ubuntu-latest, windows-latest]` and `runs-on: ${{ matrix.os }}`
- [ ] Shows `exclude:` syntax: `exclude: [{ node: 18, os: windows-latest }]`
- [ ] States that matrix creates N×M parallel jobs (3 nodes × 2 OS = 6 jobs)
- [ ] Mentions `fail-fast: false` to let all matrix jobs complete even if one fails (useful for gathering full compatibility report)

---

### Q6 — Service Containers in CI ⭐⭐

**Scenario:** Your test suite requires a real PostgreSQL database. When you run in CI, there's no database available. You need to spin one up automatically for the test job.

**Task:** Show the `services` block for a postgres container. Show the connection URL. Explain why the service is accessible on `localhost`. Show the healthcheck `options` to wait for postgres to be ready.

**Acceptance Criteria:**
- [ ] Shows `services: postgres: image: postgres:16-alpine` in the job definition
- [ ] Shows `env: POSTGRES_USER: postgres / POSTGRES_PASSWORD: postgres / POSTGRES_DB: test` on the service
- [ ] Shows connection URL: `DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test`
- [ ] Explains localhost access: in GitHub Actions, service containers and the job runner share the same network namespace, so services are reachable on `localhost`
- [ ] Shows `options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5`
- [ ] Explains that without healthcheck options, the test step might run before Postgres accepts connections
- [ ] Notes ports mapping: `ports: ['5432:5432']` may be needed depending on runner type (container-based vs VM runner)

---

### Q7 — Caching node_modules ⭐⭐

**Scenario:** Your CI job runs `npm ci` which takes 3 minutes downloading packages every single run. Your pipeline runs 50 times per day — that's 150 minutes/day wasted on package downloads.

**Task:** Show the full `actions/cache` step for caching node_modules. Explain what the hash does. Show `restore-keys` for partial cache hits. State the time saved.

**Acceptance Criteria:**
- [ ] Shows `uses: actions/cache@v4` (or v3) step
- [ ] Shows `path: ~/.npm` (npm cache dir, better than `node_modules` directly) or `path: node_modules`
- [ ] Shows `key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}`
- [ ] Explains what `hashFiles` does: computes a hash of the lockfile — cache key changes only when dependencies change
- [ ] Shows `restore-keys: ${{ runner.os }}-node-` as fallback for partial cache hit (uses most recent compatible cache)
- [ ] States time saved: with cache hit, `npm ci` goes from ~3 min to ~20 seconds
- [ ] Notes that the cache step must come BEFORE the `npm ci` step

---

### Q8 — Docker Build in CI ⭐⭐

**Scenario:** You want to build and push a Docker image to GitHub Container Registry (ghcr.io) on every merge to main. The image must be tagged in a way that enables rollbacks.

**Task:** Show the Docker build and push workflow steps. Describe the tagging strategy (latest, git SHA, branch name). Explain why git SHA tagging is critical for rollback.

**Acceptance Criteria:**
- [ ] Shows `docker/login-action` to authenticate with `ghcr.io` using `GITHUB_TOKEN`
- [ ] Shows `docker/metadata-action` or manual tagging with `${{ github.sha }}` and `latest`
- [ ] Shows `docker/build-push-action` with `push: true` and `tags:` referencing both latest and SHA
- [ ] Explains `latest` tag: convenient but overwritten on every push — cannot be used for rollback
- [ ] Explains git SHA tag: permanent, unique, tied to exact code state — `docker pull myapp:a3f9c2d` will always return the same image
- [ ] Explains branch tag: ephemeral per-branch latest — useful for staging deploys, not for production rollback
- [ ] Recommends storing the deployed git SHA in deployment logs or environment metadata for rollback reference

---

### Q9 — Conditional Deployment ⭐⭐

**Scenario:** You have a deploy job that should only run on direct pushes to main — not on pull request builds from main.

**Task:** Show the `if` condition that handles this correctly. Explain why the `github.event_name` check is needed. Describe GitHub Environments as an alternative for production gates.

**Acceptance Criteria:**
- [ ] Shows `if: github.ref == 'refs/heads/main' && github.event_name == 'push'`
- [ ] Explains why `event_name == 'push'` is needed: a PR from a branch into main has `github.ref == 'refs/heads/main'` on the target but `event_name == 'pull_request'` — without the event check, a PR could trigger deployment
- [ ] Notes `github.ref_name == 'main'` as an equivalent shorter alternative
- [ ] Describes GitHub Environments: configured in repo Settings → Environments — can require specific reviewers to approve before the job runs
- [ ] Shows `environment: production` on the job to link it to the production environment
- [ ] Explains that environment protection rules create a required approval gate in the UI before deployment proceeds
- [ ] Mentions environment secrets: scoped to the environment, only available to jobs using that environment

---

### Q10 — Branch Protection Rules ⭐⭐

**Scenario:** Engineers have been force-pushing to main and merging PRs with failing tests. You need to enforce quality gates at the repository level.

**Task:** List the branch protection rules to configure. Explain what "required status checks" means. Explain why branch protection + CI = only working code reaches main.

**Acceptance Criteria:**
- [ ] Lists: require status checks to pass before merging (CI green)
- [ ] Lists: require at least 1 PR review before merging
- [ ] Lists: restrict who can push directly to main (disable direct push for non-admins)
- [ ] Lists: do not allow force pushes to main
- [ ] Explains "required status checks": specific job names from your workflow must complete with green status before the Merge button becomes active
- [ ] Explains the combined effect: no human can bypass tests — code without passing CI literally cannot merge
- [ ] Notes that admins can bypass protection rules by default — recommend enabling "Include administrators" to prevent exceptions

---

### Q11 — Coverage Reporting ⭐⭐

**Scenario:** Your PRs merge and coverage silently drops. Two months later you realize large code paths are completely untested. You want coverage gates that fail PRs which drop coverage.

**Task:** Show the Jest command for lcov coverage output. Show the codecov upload action. Explain what the PR coverage comment shows. Describe a coverage gate and how it can be gamed.

**Acceptance Criteria:**
- [ ] Shows `jest --coverage --coverageReporters=lcov text` in the CI step
- [ ] Shows `uses: codecov/codecov-action@v4` with `token: ${{ secrets.CODECOV_TOKEN }}`
- [ ] Explains what the PR comment shows: per-file coverage, delta (increase/decrease vs base branch), overall project coverage
- [ ] Shows coverage gate configuration: `coverageThreshold: { global: { lines: 80 } }` in `jest.config.js`
- [ ] Explains how CI enforces the gate: Jest exits with code 1 if threshold not met, failing the CI job
- [ ] Explains how coverage gates can be gamed: write tests that call functions but don't assert anything (coverage goes up, code confidence doesn't)
- [ ] Notes that mutation testing (e.g., Stryker) is the answer to gamed coverage — verifies tests actually catch broken code

---

### Q12 — Zero-downtime Deploy with Health Checks ⭐⭐⭐

**Scenario:** Your startup has paying customers. Every deployment currently causes a 30-second outage while the old container stops and the new one starts. You need zero-downtime deploys.

**Task:** Describe the zero-downtime deploy sequence in numbered steps. Explain what happens if the new container's health check fails. State which step is the critical rollback decision point.

**Acceptance Criteria:**
- [ ] Step 1: Pull/push new Docker image to registry
- [ ] Step 2: Start new container alongside old container (both running)
- [ ] Step 3: Wait for new container health check to return 200 (`GET /health`) repeatedly for N checks
- [ ] Step 4: Update load balancer / service mesh to route traffic to new container
- [ ] Step 5: Stop old container only after traffic has been switched
- [ ] Explains failure scenario: if step 3 fails (new container unhealthy), abort the deploy — keep old container running, do NOT switch traffic, alert on-call
- [ ] States step 3 as the rollback decision point: health check pass/fail determines whether to proceed or abort
- [ ] Notes that this requires the load balancer to support live target updates (nginx upstream reload, AWS ALB target group swap, Kubernetes rolling update)

---

### Q13 — Rollback Strategy ⭐⭐⭐

**Scenario:** You deployed at 3 PM and at 3:15 PM users are reporting errors. You need to roll back immediately. You have 3 strategies available — pick the right one and explain the others.

**Task:** Describe 3 rollback approaches: git revert + re-deploy, Docker image tag rollback, blue-green deployment. Compare their speed. Recommend the sweet spot for a startup.

**Acceptance Criteria:**
- [ ] Describes git revert: revert the offending commit, push to main, wait for CI to pass, re-deploy — ~5–10 minutes total
- [ ] States git revert limitation: requires CI to pass, slow, creates noise in git history
- [ ] Describes image tag rollback: run deploy pipeline with the previous known-good git SHA image tag — ~30–60 seconds
- [ ] Explains image tag rollback prerequisite: must have tracked the last-known-good image tag (deployment log, environment variable, git tag)
- [ ] Describes blue-green deployment: maintain two identical environments; swap load balancer from green (new) to blue (old) — ~5 seconds
- [ ] States blue-green limitation: requires double the infrastructure cost
- [ ] Recommends image tag rollback for startups: fast, no extra infrastructure, fits startup budget — document the deployment SHA in Slack/deployment log for quick reference

---

### Q14 — Environment Promotion ⭐⭐⭐

**Scenario:** You have three environments: development (per-branch), staging (auto-deployed from main), and production (manual approval required). You need to implement this in GitHub Actions.

**Task:** Describe the full promotion pipeline. Show how GitHub Environments implement manual approval for production. Explain what the deployment history and audit log provides.

**Acceptance Criteria:**
- [ ] Describes the flow: feature branch → PR → CI runs tests → merge to main → auto-deploy to staging → manual approval → deploy to production
- [ ] Shows staging deploy job: `environment: staging`, triggered on push to main, no approval required
- [ ] Shows production deploy job: `environment: production`, `needs: [deploy-staging]`, requires approval from "production-approvers" team
- [ ] Explains GitHub environment protection: in repo Settings → Environments → production → Required reviewers — add team or users
- [ ] Explains the UI flow: CI finishes, deploy-staging runs, then production job pauses and shows "Waiting for review" — reviewer approves in UI
- [ ] Explains deployment history: GitHub shows a timeline of every deployment per environment — who deployed, when, which commit, pass/fail
- [ ] Explains audit log value: traceability for compliance (SOC 2, ISO 27001) — "who deployed what to production and when"

---

### Q15 — Pipeline Performance ⭐⭐⭐

**Scenario:** Your CI pipeline takes 12 minutes: 3 min for `npm install`, 6 min for tests, 2 min for Docker build, 1 min for deploy. PRs wait 12 minutes for feedback. Engineers have started skipping CI locally.

**Task:** Identify 4 specific optimizations with time estimates. State a target total time. Show the `paths-ignore` pattern for skipping CI on docs changes.

**Acceptance Criteria:**
- [ ] Optimization 1: cache `node_modules` — `npm install` drops from 3 min to ~20 sec
- [ ] Optimization 2: shard test suite — `jest --shard=1/4` splits tests across 4 parallel jobs, 6 min total → ~2 min (4 parallel shards, each ~1.5 min)
- [ ] Optimization 3: fail-fast on lint — run lint as first job (30 sec); if lint fails, cancel downstream jobs immediately, saving 6+ min on failed PRs
- [ ] Optimization 4: skip CI on docs-only changes — `on: push: paths-ignore: ['**/*.md', 'docs/**']`
- [ ] Shows `paths-ignore` syntax correctly in the `on:` trigger block
- [ ] States the resulting target: ~3–4 minutes total (20s install + ~2 min sharded tests + 2 min build + 1 min deploy, with parallelism)
- [ ] Notes that caching Docker layers (`cache-from: type=gha`) also reduces Docker build time significantly

---

## Scoring Rubric

Count the number of acceptance criteria checkboxes you fully satisfied across all 15 questions.

| Score | Level | What it means |
|-------|-------|---------------|
| 0–4   | 🔴 Re-study | Go back to the Day 53 teaching file. CI/CD concepts need to solidify before the GitHub Actions syntax makes sense. |
| 5–9   | 🟡 Progressing | You can write basic workflows but advanced patterns (matrix, environments, rollback) need more practice. |
| 10–12 | 🟢 Solid | You can build and maintain a production-grade CI/CD pipeline. Move on — revisit rollback and environment promotion later. |
| 13–15 | 🚀 Ready to advance | Strong pipeline engineering knowledge. You can own the CI/CD infrastructure for a startup end-to-end. |
