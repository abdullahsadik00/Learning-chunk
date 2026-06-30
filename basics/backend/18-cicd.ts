// ═══════════════════════════════════════════════════════════════
// BACKEND 18: CI/CD · GITHUB ACTIONS · AUTOMATED TESTING · DEPLOYMENT PIPELINES  (Day 53)
// Run: npx ts-node 18-cicd.ts
// ═══════════════════════════════════════════════════════════════
//
// CI/CD = the practice of shipping software continuously and safely
//
//  • Continuous Integration  — merge frequently, run tests automatically
//  • Continuous Delivery     — always keep the build shippable; deploy manually
//  • Continuous Deployment   — deploy automatically on every green build
//
// WHY DOES IT MATTER?
//  1. Small changes = smaller blast radius when something breaks
//  2. Fast feedback = bugs found in minutes, not weeks
//  3. Repeatable deploys = no "works on my machine" surprises
//  4. Audit trail = every deploy is tied to a commit + actor

// ───────────────────────────────────────────────────────────────
// 1. CI/CD Concepts
// ───────────────────────────────────────────────────────────────

console.log("=== 1. CI/CD Concepts ===");

/*
  THE PIPELINE STAGES
  ───────────────────
  Every CI/CD pipeline runs a sequence of gates. Each gate must pass
  before the next one starts. A failure stops the pipeline and notifies
  the team immediately.

  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
  │  LINT    │ → │  TEST    │ → │  BUILD   │ → │  DEPLOY  │
  └──────────┘   └──────────┘   └──────────┘   └──────────┘

  1. Lint
     - Static analysis: ESLint, Prettier, tsc --noEmit
     - Catches style issues and type errors before tests even run
     - Fastest gate — should complete in < 30 s

  2. Test
     - Unit tests, integration tests, coverage thresholds
     - May spin up service containers (Postgres, Redis)
     - A coverage drop below the threshold blocks the PR

  3. Build
     - Compile TypeScript, bundle frontend assets, build Docker image
     - Artifacts produced here (binaries, images) are what gets deployed

  4. Deploy
     - Ship the artifact to a target environment
     - CI/CD (Continuous Deployment): automatic on green main branch
     - CD only (Continuous Delivery): requires a manual approval gate

  CONTINUOUS INTEGRATION vs DELIVERY vs DEPLOYMENT
  ─────────────────────────────────────────────────
  CI                → every PR is tested automatically; branch merges often
  Continuous Delivery → the build is always ready to deploy; humans press the button
  Continuous Deployment → humans write code; the pipeline presses the button

  WHY SMALL CHANGES REDUCE RISK
  ──────────────────────────────
  A PR with 10 lines: easy to review, easy to revert if broken.
  A PR with 10 000 lines: hard to review, painful to roll back.
  CI discipline keeps PRs small → bugs are isolated → rollbacks are cheap.
*/

// Simulating pipeline stage results in TypeScript:
type StageStatus = "pass" | "fail" | "skipped";

interface PipelineStage {
    name: string;
    status: StageStatus;
    durationMs: number;
}

function runPipeline(stages: PipelineStage[]): void {
    console.log("\nPipeline run:");
    for (const stage of stages) {
        const icon = stage.status === "pass" ? "✓" : stage.status === "fail" ? "✗" : "–";
        console.log(`  [${icon}] ${stage.name.padEnd(12)} ${stage.durationMs}ms`);
        if (stage.status === "fail") {
            console.log(`      Pipeline stopped at: ${stage.name}`);
            return;
        }
    }
    console.log("  Pipeline complete — artifact ready to deploy.");
}

runPipeline([
    { name: "lint",   status: "pass", durationMs: 18000  },
    { name: "test",   status: "pass", durationMs: 45000  },
    { name: "build",  status: "pass", durationMs: 90000  },
    { name: "deploy", status: "pass", durationMs: 120000 },
]);

runPipeline([
    { name: "lint",  status: "pass", durationMs: 18000 },
    { name: "test",  status: "fail", durationMs: 30000 },
    { name: "build", status: "skipped", durationMs: 0  },
]);

// ───────────────────────────────────────────────────────────────
// 2. GitHub Actions Fundamentals
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. GitHub Actions Fundamentals ===");

/*
  WORKFLOW YAML ANATOMY
  ──────────────────────
  A workflow is a YAML file under .github/workflows/.
  It defines WHEN to run (on:) and WHAT to run (jobs:).

  ┌─────────────────────────────────────────────────────────────┐
  │ .github/workflows/ci.yml                                    │
  ├─────────────────────────────────────────────────────────────┤
  │ name: CI                                                    │
  │                                                             │
  │ on:                          ← TRIGGERS                     │
  │   push:                                                     │
  │     branches: [main]                                        │
  │   pull_request:                                             │
  │     branches: [main]                                        │
  │                                                             │
  │ jobs:                        ← JOBS (run in parallel by default) │
  │   test:                                                     │
  │     runs-on: ubuntu-latest   ← RUNNER                       │
  │     steps:                   ← STEPS (sequential)           │
  │       - uses: actions/checkout@v4                           │
  │       - uses: actions/setup-node@v4                         │
  │         with:                                               │
  │           node-version: 20                                  │
  │       - run: npm ci                                         │
  │       - run: npm test                                       │
  └─────────────────────────────────────────────────────────────┘

  TRIGGERS (on:)
  ──────────────
  push               runs on every push to matched branches
  pull_request       runs on PR open / sync / reopen
  schedule           cron syntax: "0 2 * * 1" = every Monday at 02:00 UTC
  workflow_dispatch  manual trigger; can accept inputs (button in GitHub UI)
  release            triggered when a GitHub Release is published
  workflow_call      lets other workflows call this one as a reusable sub-workflow

  RUNNERS (runs-on:)
  ──────────────────
  ubuntu-latest      GitHub-hosted Linux runner (most common, cheapest)
  macos-latest       macOS runner (2-3× more expensive than Linux)
  windows-latest     Windows runner
  self-hosted        a machine you register with GitHub; own hardware/cost

  USES vs RUN
  ───────────
  uses: actions/checkout@v4      → reuse a pre-built Action (from Marketplace or repo)
  run: npm ci                    → run a shell command on the runner

  KEY EXPRESSIONS AND CONTEXTS
  ─────────────────────────────
  ${{ github.sha }}              the full commit SHA (e.g., use as Docker image tag)
  ${{ github.ref }}              "refs/heads/main" or "refs/pull/42/merge"
  ${{ github.actor }}            the user who triggered the workflow
  ${{ secrets.GITHUB_TOKEN }}    auto-generated token scoped to the repo; no setup needed
  ${{ secrets.MY_SECRET }}       a secret you added in repo Settings → Secrets
  ${{ env.MY_VAR }}              an environment variable set at job or step level

  ENV AT JOB / STEP LEVEL
  ─────────────────────────
  jobs:
    build:
      env:                       ← applies to ALL steps in this job
        NODE_ENV: test
      steps:
        - run: echo $NODE_ENV
          env:                   ← applies to this step only (overrides job-level)
            NODE_ENV: production
*/

// Simulating context values that GitHub Actions would expose:
const githubContext = {
    sha: "a3f9c2d1e8b74506f1230cd45ef678901234abcd",
    ref: "refs/heads/main",
    actor: "sadik",
    eventName: "push",
    repository: "sadik/my-api",
    runId: 9812345,
};

console.log("\nGitHub Actions context (simulated):");
console.log(`  sha:    ${githubContext.sha.slice(0, 8)}`);
console.log(`  ref:    ${githubContext.ref}`);
console.log(`  actor:  ${githubContext.actor}`);
console.log(`  event:  ${githubContext.eventName}`);
console.log(`  runId:  ${githubContext.runId}`);

// ───────────────────────────────────────────────────────────────
// 3. A Complete Node.js CI Workflow
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Complete Node.js CI Workflow ===");

/*
  FULL WORKFLOW: .github/workflows/ci.yml
  ────────────────────────────────────────

  name: Node.js CI

  on:
    push:
      branches: [main]
    pull_request:
      branches: [main]

  jobs:
    ci:
      name: "Node ${{ matrix.node-version }}"
      runs-on: ubuntu-latest

      strategy:
        matrix:
          node-version: [18, 20, 22]    ← runs 3 parallel jobs, one per version

      steps:
        # 1. Check out the repo at the triggering commit
        - name: Checkout
          uses: actions/checkout@v4

        # 2. Install Node; cache ~/.npm to skip re-downloading packages
        - name: Setup Node ${{ matrix.node-version }}
          uses: actions/setup-node@v4
          with:
            node-version: ${{ matrix.node-version }}
            cache: npm                  ← caches the npm cache dir between runs

        # 3. Install exact versions from package-lock.json (faster + reproducible)
        - name: Install dependencies
          run: npm ci

        # 4. TypeScript type check (no emit — just validate types)
        - name: Type check
          run: npx tsc --noEmit

        # 5. Lint
        - name: Lint
          run: npm run lint

        # 6. Tests with coverage
        - name: Test
          run: npm test -- --coverage

        # 7. Upload coverage report to Codecov
        - name: Upload coverage
          uses: codecov/codecov-action@v4
          with:
            token: ${{ secrets.CODECOV_TOKEN }}
            fail_ci_if_error: true      ← fail the pipeline if upload fails

  ─────────────────────────────────────────────────────────────────
  PR CHECK vs PUSH-TO-MAIN BRANCHING
  ─────────────────────────────────────────────────────────────────
  Use 'if:' conditions to split behaviour:

  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - run: npm ci && npm test

    deploy:
      needs: test                       ← only runs after 'test' passes
      if: github.ref == 'refs/heads/main' && github.event_name == 'push'
      runs-on: ubuntu-latest
      steps:
        - run: ./scripts/deploy.sh      ← only on push to main, not PRs

  WHY npm ci INSTEAD OF npm install?
  ────────────────────────────────────
  npm install  → may update package-lock.json; installs "compatible" versions
  npm ci       → deletes node_modules, installs exact versions from lock file
                 → deterministic, faster in CI, never surprises you with drift
*/

// Demonstrating matrix strategy concept in TypeScript:
const nodeVersionMatrix = [18, 20, 22];

console.log("\nMatrix build simulation:");
nodeVersionMatrix.forEach((version) => {
    const passed = version >= 18; // hypothetical: only 18+ pass
    console.log(`  Node ${version}: ${passed ? "PASS" : "FAIL"}`);
});

// ───────────────────────────────────────────────────────────────
// 4. Service Containers in CI
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Service Containers in CI ===");

/*
  WHY SERVICE CONTAINERS?
  ────────────────────────
  Integration tests often need a real database or cache, not a mock.
  GitHub Actions can spin up Docker containers as "services" — they start
  before your steps run and are torn down after the job completes.

  POSTGRESQL + REDIS SERVICE EXAMPLE
  ────────────────────────────────────

  jobs:
    integration-test:
      runs-on: ubuntu-latest

      services:
        postgres:
          image: postgres:16
          env:
            POSTGRES_USER: testuser
            POSTGRES_PASSWORD: testpass
            POSTGRES_DB: testdb
          ports:
            - 5432:5432
          options: >-
            --health-cmd pg_isready
            --health-interval 10s
            --health-timeout 5s
            --health-retries 5

        redis:
          image: redis:7
          ports:
            - 6379:6379
          options: >-
            --health-cmd "redis-cli ping"
            --health-interval 10s
            --health-timeout 5s
            --health-retries 5

      env:
        DATABASE_URL: postgresql://testuser:testpass@localhost:5432/testdb
        REDIS_URL: redis://localhost:6379

      steps:
        - uses: actions/checkout@v4

        - uses: actions/setup-node@v4
          with:
            node-version: 20
            cache: npm

        - run: npm ci

        # Run migrations before tests — DB is up because healthcheck passed
        - name: Run database migrations
          run: npx prisma migrate deploy

        - name: Run integration tests
          run: npm test

  KEY POINTS:
  ───────────
  • 'options: --health-cmd' ensures the container is READY before steps run
    (without this, pg_isready might fail because Postgres is still starting)
  • Services are accessed via 'localhost' even though they run in containers
    because GitHub maps the container port to the runner's loopback interface
  • DATABASE_URL at job level is available to ALL steps in the job
  • Use separate jobs for unit tests (no containers) and integration tests
    (with containers) to keep fast feedback on pure unit test failures
*/

// Simulating DB connection check logic:
interface ServiceHealth {
    name: string;
    host: string;
    port: number;
    ready: boolean;
}

function checkServices(services: ServiceHealth[]): void {
    console.log("\nService health checks:");
    services.forEach((svc) => {
        const status = svc.ready ? "ready" : "not ready";
        console.log(`  ${svc.name.padEnd(10)} ${svc.host}:${svc.port}  →  ${status}`);
    });
    const allReady = services.every((s) => s.ready);
    console.log(`  All services ready: ${allReady}`);
}

checkServices([
    { name: "postgres", host: "localhost", port: 5432, ready: true  },
    { name: "redis",    host: "localhost", port: 6379, ready: true  },
]);

// ───────────────────────────────────────────────────────────────
// 5. Building and Pushing Docker Images
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Building and Pushing Docker Images ===");

/*
  FULL DOCKER BUILD + PUSH WORKFLOW
  ───────────────────────────────────

  jobs:
    docker:
      runs-on: ubuntu-latest
      needs: ci                         ← only build image after tests pass

      steps:
        - uses: actions/checkout@v4

        # Enable BuildKit (multi-platform, faster caching)
        - name: Set up Docker Buildx
          uses: docker/setup-buildx-action@v3

        # Log in to GitHub Container Registry (GHCR)
        - name: Login to GHCR
          uses: docker/login-action@v3
          with:
            registry: ghcr.io
            username: ${{ github.actor }}
            password: ${{ secrets.GITHUB_TOKEN }}

        # (Alternative) Log in to DockerHub:
        # - name: Login to DockerHub
        #   uses: docker/login-action@v3
        #   with:
        #     username: ${{ secrets.DOCKERHUB_USERNAME }}
        #     password: ${{ secrets.DOCKERHUB_TOKEN }}

        # Build and push with layer caching via GitHub Actions cache
        - name: Build and push
          uses: docker/build-push-action@v5
          with:
            context: .
            push: true
            tags: |
              ghcr.io/${{ github.repository }}:latest
              ghcr.io/${{ github.repository }}:${{ github.sha }}
            cache-from: type=gha          ← restore cache from GitHub Actions
            cache-to: type=gha,mode=max   ← write cache to GitHub Actions

  IMAGE TAGGING STRATEGIES
  ──────────────────────────
  :latest               always points to the most recent build
                        easy to reference but no traceability

  :${{ github.sha }}    immutable — ties the image to an exact commit
                        what you actually deploy; enables rollback

  Semver tags (with docker/metadata-action@v5):
    On git tag v1.2.3 → produces:
      ghcr.io/org/app:1
      ghcr.io/org/app:1.2
      ghcr.io/org/app:1.2.3

  LAYER CACHING
  ──────────────
  Docker builds images layer by layer. Unchanged layers are reused.
  cache-from/cache-to with type=gha stores layer data in GitHub's
  managed cache store — subsequent builds only rebuild changed layers.

  Dockerfile ordering for best cache hits:
    FROM node:20-alpine                   ← rarely changes
    COPY package*.json ./                 ← changes only when deps change
    RUN npm ci                            ← cached when package-lock unchanged
    COPY . .                              ← changes every commit (but above is cached)
    RUN npm run build
    CMD ["node", "dist/index.js"]
*/

// Simulating image tag generation:
function generateImageTags(
    registry: string,
    repository: string,
    sha: string,
    gitTag?: string
): string[] {
    const base = `${registry}/${repository}`;
    const tags = [`${base}:latest`, `${base}:${sha.slice(0, 8)}`];

    if (gitTag) {
        // e.g. gitTag = "v1.2.3"
        const [major, minor, patch] = gitTag.replace("v", "").split(".");
        tags.push(`${base}:${major}`);
        tags.push(`${base}:${major}.${minor}`);
        tags.push(`${base}:${major}.${minor}.${patch}`);
    }

    return tags;
}

const imageTags = generateImageTags(
    "ghcr.io",
    "sadik/my-api",
    "a3f9c2d1e8b74506f1230cd45ef678901234abcd",
    "v2.1.0"
);

console.log("\nGenerated image tags:");
imageTags.forEach((tag) => console.log(`  ${tag}`));

// ───────────────────────────────────────────────────────────────
// 6. Deployment Strategies
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Deployment Strategies ===");

/*
  DEPLOY ON PUSH TO MAIN (Continuous Deployment)
  ────────────────────────────────────────────────

  jobs:
    deploy-production:
      needs: docker
      if: github.ref == 'refs/heads/main' && github.event_name == 'push'
      runs-on: ubuntu-latest
      steps:
        - name: Deploy to production
          run: |
            curl -X POST https://api.render.com/deploy/srv-xxx \
              -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}"

  DEPLOY ON GIT TAG (Release-based CD)
  ──────────────────────────────────────

  on:
    push:
      tags:
        - 'v*.*.*'           ← only triggers on tags like v1.2.3

  jobs:
    deploy-release:
      runs-on: ubuntu-latest
      steps:
        - name: Deploy tagged release
          run: echo "Deploying ${{ github.ref_name }}"   # e.g. "v1.2.3"

  MANUAL APPROVAL (Production Gate)
  ───────────────────────────────────
  GitHub Environments let you require approvals before a job runs.

    jobs:
      deploy-production:
        runs-on: ubuntu-latest
        environment: production       ← references a GitHub Environment

  In repo Settings → Environments → production:
    • Add "Required reviewers" (e.g., the tech lead)
    • The deploy job pauses and sends a Slack/email notification
    • An approved reviewer clicks "Approve and deploy" in the GitHub UI

  DEPLOYMENT PATTERNS
  ────────────────────
  Rolling deploy:
    Update instances one at a time. Zero downtime.
    If new version is bad, remaining old instances still serve traffic.
    Rollback: re-deploy the previous image tag.

  Blue-green deployment:
    Keep two identical environments (blue = current, green = new).
    Deploy new version to green. Run smoke tests.
    Flip the load balancer to green. Blue stays up for instant rollback.
    Cost: you pay for double capacity during the switch.

  Canary release:
    Route a small percentage of traffic (5–10%) to the new version.
    Monitor error rates and latency. If healthy, increase traffic gradually.
    If bad: route 100% back to old version immediately.

  Rollback pattern:
    Never rebuild the old image — just redeploy the previous image tag.
    Because each commit has a unique :sha tag, rollback is deterministic.

    steps:
      - name: Rollback to previous version
        run: |
          # PREVIOUS_SHA stored in a release database or SSM Parameter Store
          docker pull ghcr.io/org/app:$PREVIOUS_SHA
          docker service update --image ghcr.io/org/app:$PREVIOUS_SHA myapp
*/

// Simulating deployment strategy decision logic:
type DeployStrategy = "rolling" | "blue-green" | "canary";

interface DeployConfig {
    strategy: DeployStrategy;
    canaryPercent?: number;
    requireApproval: boolean;
    rollbackTag: string;
}

function describeDeployment(config: DeployConfig): void {
    console.log(`\nDeployment config:`);
    console.log(`  strategy:       ${config.strategy}`);
    if (config.strategy === "canary" && config.canaryPercent !== undefined) {
        console.log(`  canary traffic: ${config.canaryPercent}%`);
    }
    console.log(`  requireApproval: ${config.requireApproval}`);
    console.log(`  rollbackTag:    ${config.rollbackTag}`);
}

describeDeployment({
    strategy: "canary",
    canaryPercent: 10,
    requireApproval: true,
    rollbackTag: "a3f9c2d1",
});

// ───────────────────────────────────────────────────────────────
// 7. Deployment Targets
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. Deployment Targets ===");

/*
  RENDER / RAILWAY / FLY.IO (Push-to-deploy PaaS)
  ────────────────────────────────────────────────
  These platforms watch your repo and auto-deploy on push.
  OR expose a deploy hook URL you call from GitHub Actions:

    - name: Trigger Render deploy
      run: |
        curl -X POST \
          "https://api.render.com/deploy/srv-${{ secrets.RENDER_SERVICE_ID }}" \
          -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}"

  Fly.io has a dedicated Action:
    - uses: superfly/flyctl-actions/setup-flyctl@master
    - run: flyctl deploy --remote-only
      env:
        FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  DIGITAL OCEAN APP PLATFORM
  ───────────────────────────
    - uses: digitalocean/action-doctl@v2
      with:
        token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}
    - run: doctl apps create-deployment $APP_ID

  AWS ECS (Elastic Container Service)
  ─────────────────────────────────────
  Steps:
    1. Push new Docker image to ECR (Elastic Container Registry)
    2. Download current ECS task definition JSON
    3. Inject new image URI into task definition
    4. Register updated task definition
    5. Update ECS service to use new task definition

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ap-south-1

    - name: Login to ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v2

    - name: Render task definition
      id: render-task-def
      uses: aws-actions/amazon-ecs-render-task-definition@v1
      with:
        task-definition: task-definition.json
        container-name: my-api
        image: ${{ steps.login-ecr.outputs.registry }}/my-api:${{ github.sha }}

    - name: Deploy to ECS
      uses: aws-actions/amazon-ecs-deploy-task-definition@v1
      with:
        task-definition: ${{ steps.render-task-def.outputs.task-definition }}
        service: my-api-service
        cluster: my-cluster
        wait-for-service-stability: true

  SELF-HOSTED VPS (SSH + Docker Compose)
  ─────────────────────────────────────────
  Store the SSH private key in GitHub Secrets. SSH into your server,
  pull the new image, and restart with docker compose.

    - name: Deploy via SSH
      uses: appleboy/ssh-action@v1.0.3
      with:
        host: ${{ secrets.VPS_HOST }}
        username: deploy
        key: ${{ secrets.VPS_SSH_KEY }}
        script: |
          cd /opt/my-api
          docker compose pull
          docker compose up -d --no-build
          docker image prune -f

  SECRETS MANAGEMENT COMPARISON
  ───────────────────────────────
  GitHub Secrets        → simple, per-repo or org-level; fine for most projects
  AWS SSM Param Store   → hierarchical, IAM-controlled; good for AWS workloads
  HashiCorp Vault       → enterprise; dynamic secrets, lease/revoke
  Doppler / Infisical   → third-party secret managers with GitHub Actions integrations
*/

// Simulating deployment target registry:
const deploymentTargets = [
    { platform: "Render",            method: "webhook",    secretsIn: "GitHub Secrets" },
    { platform: "Fly.io",            method: "flyctl CLI", secretsIn: "GitHub Secrets" },
    { platform: "AWS ECS",           method: "aws CLI",    secretsIn: "GitHub Secrets + AWS IAM" },
    { platform: "DigitalOcean Apps", method: "doctl CLI",  secretsIn: "GitHub Secrets" },
    { platform: "Self-hosted VPS",   method: "SSH",        secretsIn: "GitHub Secrets (SSH key)" },
] as const;

console.log("\nDeployment target overview:");
deploymentTargets.forEach(({ platform, method, secretsIn }) => {
    console.log(`  ${platform.padEnd(22)} method: ${method.padEnd(14)}  secrets: ${secretsIn}`);
});

// ───────────────────────────────────────────────────────────────
// 8. Branch Protection and Quality Gates
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. Branch Protection and Quality Gates ===");

/*
  GITHUB BRANCH PROTECTION RULES
  ────────────────────────────────
  In repo Settings → Branches → Add rule → Branch: main:

  ✅ Require status checks to pass before merging
     → Add checks: "ci / Node 20", "ci / Node 22", "lint"
     → "Require branches to be up to date before merging" (avoid stale PRs)

  ✅ Require a pull request before merging
     → Require N approvals (e.g., 1 or 2)
     → Dismiss stale reviews when new commits are pushed

  ✅ Do not allow bypassing the above settings
     → Even repo admins must follow the rules

  CODECOV QUALITY GATE
  ─────────────────────
  codecov/codecov-action with a codecov.yml config:

    # codecov.yml
    coverage:
      status:
        project:
          default:
            target: 80%           ← overall project must stay above 80%
            threshold: 2%         ← allow up to 2% drop without failing
        patch:
          default:
            target: 70%           ← new/changed lines must be 70% covered

  Codecov posts a status check on the PR. Branch protection requires it
  to pass → a coverage drop blocks the merge automatically.

  SEMANTIC VERSIONING WITH semantic-release
  ───────────────────────────────────────────
  semantic-release reads Conventional Commits to decide the next version:

  Commit message prefix → Version bump:
    fix: ...             → PATCH  (1.2.3 → 1.2.4)
    feat: ...            → MINOR  (1.2.4 → 1.3.0)
    feat!: ... or
    BREAKING CHANGE: ... → MAJOR  (1.3.0 → 2.0.0)

  It then:
    1. Creates a git tag (v2.0.0)
    2. Generates CHANGELOG.md
    3. Publishes to npm (if configured)
    4. Creates a GitHub Release

  In .github/workflows/release.yml:
    - name: Release
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
      run: npx semantic-release

  CODEOWNERS FILE
  ────────────────
  .github/CODEOWNERS defines who must review changes to specific paths:

    # Syntax: <path-pattern>  @<owner>
    *                @org/core-team       ← everyone must be reviewed by core-team
    /docs/           @org/docs-team       ← doc changes require docs-team approval
    /infra/          @org/devops-team     ← infra changes require devops-team
    /src/payments/   @alice @bob          ← payment code: Alice or Bob must approve

  When a PR touches a CODEOWNERS path, GitHub automatically requests review
  from the specified owner. Branch protection can require CODEOWNERS review.
*/

// Simulating quality gate checks:
interface QualityGate {
    name: string;
    threshold: number;
    actual: number;
    unit: string;
}

function evaluateQualityGates(gates: QualityGate[]): boolean {
    console.log("\nQuality gates:");
    let allPass = true;

    gates.forEach(({ name, threshold, actual, unit }) => {
        const pass = actual >= threshold;
        if (!pass) allPass = false;
        const icon = pass ? "✓" : "✗";
        console.log(
            `  [${icon}] ${name.padEnd(20)} required: ${threshold}${unit}  actual: ${actual}${unit}`
        );
    });

    console.log(`  Overall: ${allPass ? "GATES PASSED — PR can merge" : "GATES FAILED — PR blocked"}`);
    return allPass;
}

evaluateQualityGates([
    { name: "Test coverage",    threshold: 80, actual: 83, unit: "%" },
    { name: "Patch coverage",   threshold: 70, actual: 75, unit: "%" },
    { name: "Build size",       threshold: 0,  actual: 0,  unit: " errors" },
    { name: "Type errors",      threshold: 0,  actual: 0,  unit: " errors" },
]);

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice Q&A ===");

/*
  Q1: What's the difference between Continuous Delivery and Continuous Deployment?
  ────────────────────────────────────────────────────────────────────────────────
  A: Both keep the codebase always in a releasable state, but they differ on
     WHO triggers the production deploy:

     Continuous Delivery    → automated pipeline verifies the build; a HUMAN
                              decides when to actually push it to production
                              (e.g., product manager clicks "Deploy" in the UI)

     Continuous Deployment  → no human gate; the pipeline automatically deploys
                              to production every time tests go green on main

     The tradeoff:
       CD (Deployment) gives fastest time-to-production and eliminates
       deploy toil, but requires high confidence in your test suite.
       CD (Delivery) suits regulated industries or teams that need a
       scheduled release window (e.g., "we only deploy on Tuesdays").


  Q2: Your CI runs tests against a PostgreSQL database. How do you spin it up in GitHub Actions?
  ───────────────────────────────────────────────────────────────────────────────────────────────
  A: Use the 'services:' block in the job definition. Example:

     jobs:
       test:
         runs-on: ubuntu-latest
         services:
           postgres:
             image: postgres:16
             env:
               POSTGRES_USER: testuser
               POSTGRES_PASSWORD: testpass
               POSTGRES_DB: testdb
             ports:
               - 5432:5432
             options: >-
               --health-cmd pg_isready
               --health-interval 10s
               --health-timeout 5s
               --health-retries 5
         env:
           DATABASE_URL: postgresql://testuser:testpass@localhost:5432/testdb
         steps:
           - uses: actions/checkout@v4
           - run: npm ci
           - run: npx prisma migrate deploy
           - run: npm test

     Key points:
     • 'options: --health-cmd pg_isready' ensures the container is fully
       ready BEFORE your steps execute (not just started)
     • Access the container via 'localhost' — GitHub maps the port to the runner
     • Set DATABASE_URL at the job level so all steps inherit it
     • Run migrations AFTER the service is healthy, BEFORE tests


  Q3: How do you prevent a PR from merging if test coverage drops below 80%?
  ────────────────────────────────────────────────────────────────────────────
  A: Three-part solution:

     1. Generate coverage in CI:
        run: npm test -- --coverage

     2. Upload to Codecov with fail_ci_if_error: true:
        - uses: codecov/codecov-action@v4
          with:
            token: ${{ secrets.CODECOV_TOKEN }}
            fail_ci_if_error: true

     3. Set threshold in codecov.yml (project root):
        coverage:
          status:
            project:
              default:
                target: 80%
                threshold: 0%    # zero tolerance for drops

     4. Require the Codecov status check in branch protection:
        Settings → Branches → Require status checks → add "codecov/project"

     Now Codecov posts a status check on every PR. If coverage falls
     below 80%, the check fails, and branch protection blocks the merge.


  Q4: You want to deploy to production only after a manual approval. How do you configure this?
  ──────────────────────────────────────────────────────────────────────────────────────────────
  A: Use GitHub Environments with required reviewers.

     Step 1 — Create the environment:
       GitHub repo → Settings → Environments → New environment: "production"
       → Add required reviewers (e.g., @tech-lead)
       → Optionally set a wait timer (e.g., 10 minutes before auto-deploying)

     Step 2 — Reference the environment in the workflow job:
       jobs:
         deploy:
           runs-on: ubuntu-latest
           environment: production         ← triggers the approval gate
           steps:
             - run: ./scripts/deploy.sh

     When this job is reached, GitHub pauses execution, sends a notification
     to the required reviewers, and waits. The reviewers see a prompt in the
     GitHub Actions UI: "Review deployments". They click "Approve and deploy"
     (or "Reject") before the job continues or is cancelled.

     For workflow_dispatch (manual trigger with input):
       on:
         workflow_dispatch:
           inputs:
             environment:
               type: environment
               required: true


  Q5: What's the difference between npm install and npm ci in a CI environment?
  ──────────────────────────────────────────────────────────────────────────────
  A: npm install
     • Reads package.json ranges (e.g., "^1.2.0")
     • Installs the latest version that satisfies the range
     • May UPDATE package-lock.json if it is stale
     • Preserves existing node_modules and only adds/updates what changed
     • Correct for local development

  A: npm ci
     • Reads package-lock.json exactly (ignores package.json ranges)
     • Deletes node_modules entirely, then installs from scratch
     • Never modifies package-lock.json — fails if lock file is missing or out of sync
     • 2–3× faster in CI because it skips dependency resolution
     • Correct for CI — guarantees reproducible builds

     Rule: always use 'npm ci' in CI pipelines. If the lock file is stale,
     the developer must run 'npm install' locally and commit the updated lock file.
*/

// ───────────────────────────────────────────────────────────────
// REFERENCE CARD (runDemo)
// ───────────────────────────────────────────────────────────────

function runDemo(): void {
    console.log(`
╔══════════════════════════════════════════════════════════════════╗
║       BACKEND 18 — CI/CD & GITHUB ACTIONS REFERENCE CARD        ║
╠══════════════════════════════════════════════════════════════════╣
║  CI/CD CONCEPTS                                                 ║
║    CI                  merge often + auto-test every push       ║
║    Continuous Delivery  always shippable; human triggers deploy  ║
║    Continuous Deploy   pipeline auto-deploys on green main      ║
╠══════════════════════════════════════════════════════════════════╣
║  PIPELINE STAGES                                                ║
║    lint  →  test  →  build  →  deploy                           ║
║    fail fast: each stage blocks if it does not pass             ║
╠══════════════════════════════════════════════════════════════════╣
║  GITHUB ACTIONS YAML SKELETON                                   ║
║    on: push / pull_request / schedule / workflow_dispatch       ║
║    jobs.<id>.runs-on: ubuntu-latest | macos-latest | self-hosted║
║    steps:                                                       ║
║      uses: <action>@<version>   ← reuse a published Action     ║
║      run:  <shell command>      ← run arbitrary shell           ║
╠══════════════════════════════════════════════════════════════════╣
║  KEY EXPRESSIONS                                                ║
║    $\{{ github.sha }}          commit SHA (use as image tag)    ║
║    $\{{ github.ref }}          refs/heads/main                  ║
║    $\{{ secrets.MY_SECRET }}   encrypted secret value           ║
║    $\{{ secrets.GITHUB_TOKEN }} auto-generated repo-scoped token║
╠══════════════════════════════════════════════════════════════════╣
║  SERVICE CONTAINERS                                             ║
║    services:                                                    ║
║      postgres:                                                  ║
║        image: postgres:16                                       ║
║        options: --health-cmd pg_isready ...                     ║
║    access via localhost:<port>                                  ║
║    set DATABASE_URL at job env level                            ║
╠══════════════════════════════════════════════════════════════════╣
║  DOCKER BUILD + PUSH                                            ║
║    docker/setup-buildx-action   enable BuildKit                 ║
║    docker/login-action          login to GHCR or DockerHub      ║
║    docker/build-push-action     build, tag, push                ║
║      tags: :latest + :$\{{ github.sha }}                        ║
║      cache-from/to: type=gha    layer cache via Actions cache   ║
╠══════════════════════════════════════════════════════════════════╣
║  DEPLOYMENT STRATEGIES                                          ║
║    Rolling      replace instances one at a time (zero downtime) ║
║    Blue-Green   swap LB from old env to new env; instant rcback ║
║    Canary       route N% traffic to new; ramp up if healthy     ║
║    Rollback     re-deploy previous :sha tag (never rebuild)     ║
╠══════════════════════════════════════════════════════════════════╣
║  DEPLOYMENT TARGETS                                             ║
║    Render / Fly.io       webhook or CLI trigger in Actions      ║
║    AWS ECS               aws-actions/* suite + task-def update  ║
║    DigitalOcean Apps     doctl CLI                              ║
║    Self-hosted VPS       SSH action + docker compose pull && up ║
╠══════════════════════════════════════════════════════════════════╣
║  QUALITY GATES                                                  ║
║    Branch protection  require CI checks + N reviewer approvals  ║
║    Codecov            block PR if coverage < threshold          ║
║    CODEOWNERS         auto-request owner review per path        ║
║    semantic-release   auto version + changelog from commits     ║
╠══════════════════════════════════════════════════════════════════╣
║  CI QUICK RULES                                                 ║
║    npm ci        not npm install  (reproducible, faster)        ║
║    matrix:       test on Node 18 / 20 / 22 in parallel         ║
║    needs:        sequence jobs  (test → build → deploy)         ║
║    if: github.ref == 'refs/heads/main'  gate deploy to main     ║
║    environment: production  → requires manual approval          ║
╚══════════════════════════════════════════════════════════════════╝
`);
}

runDemo();

export default runDemo;
