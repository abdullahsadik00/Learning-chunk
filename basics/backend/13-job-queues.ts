// ═══════════════════════════════════════════════════════════════
// BACKEND 13: BULLMQ · JOB QUEUES · RETRIES · SCHEDULING  (Day 48)
// Run: npx ts-node 13-job-queues.ts
// ═══════════════════════════════════════════════════════════════
//
// A job queue lets your HTTP server hand off slow or unreliable
// work to a separate process (a "worker"), so the request returns
// immediately and the work happens in the background — with
// automatic retries, scheduling, and crash recovery.
//
// STACK: BullMQ (TypeScript-first) + Redis (persistence layer)
//
// INSTALL (when using for real):
//   npm install bullmq ioredis
//   # Redis must be running: docker run -p 6379:6379 redis
//
// NOTE: This file is a teaching reference. The BullMQ imports and
//       class instantiations are typed but guarded so that
//       `npx ts-node 13-job-queues.ts` runs without Redis present.

// ───────────────────────────────────────────────────────────────
// 1. WHY JOB QUEUES
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Why Job Queues ===");

/*
  INLINE PROCESSING — the naive approach
  ───────────────────────────────────────
  POST /signup
    1. Insert user into DB          ← fast
    2. Send welcome email via SMTP  ← 800 ms
    3. Generate PDF receipt         ← 1200 ms
    4. Resize profile avatar        ← 600 ms
    5. return 201 Created           ← user waited 2.6 s

  Problems:
  • Slow response — user feels the latency
  • No retry  — if SMTP is down the email is lost forever
  • Lost on crash — if the server dies mid-step, work is gone
  • Blocks the event loop with CPU-heavy tasks
  • Hard to rate-limit external APIs (e.g. Twilio, SendGrid)

  WITH A JOB QUEUE
  ────────────────
  POST /signup
    1. Insert user into DB          ← fast
    2. Enqueue "send-welcome-email" ← ~1 ms  (just writes to Redis)
    3. Enqueue "generate-pdf"       ← ~1 ms
    4. Enqueue "resize-avatar"      ← ~1 ms
    5. return 201 Created           ← user waited ~10 ms  ✓

  Worker process (separate Node process):
    • Picks up "send-welcome-email", retries on failure
    • Picks up "generate-pdf", runs CPU work outside HTTP loop
    • Picks up "resize-avatar"
    • If worker crashes, Redis still holds the jobs — they resume

  WHEN TO USE A QUEUE
  ───────────────────
  • Sending emails / SMS / push notifications
  • Generating PDFs, reports, exports
  • Image / video transcoding
  • Calling rate-limited 3rd-party APIs
  • Scheduled tasks (cron jobs without cron)
  • Distributing work across multiple workers (horizontal scale)
  • Any work that can fail and needs retries
*/

const reasons: string[] = [
  "Decouples slow work from HTTP request lifecycle",
  "Automatic retries with configurable backoff",
  "Survives server crashes — Redis persists job state",
  "Rate-limit external API calls across workers",
  "Horizontal scaling: add workers without changing the API",
  "Scheduling: replace cron jobs with repeatable queue jobs",
];

console.log("Reasons to use a job queue:");
reasons.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));

// ───────────────────────────────────────────────────────────────
// 2. BULLMQ FUNDAMENTALS
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. BullMQ Fundamentals ===");

/*
  CORE OBJECTS
  ────────────
  Queue        — producer side: add jobs
  Worker       — consumer side: process jobs
  QueueEvents  — listen to events across processes
  Job          — a unit of work with data, options, state

  REDIS AS THE BACKBONE
  ─────────────────────
  BullMQ stores every job in Redis sorted sets and hashes:
    bull:<queue>:wait     — jobs waiting to be picked up
    bull:<queue>:active   — jobs currently being processed
    bull:<queue>:completed— finished jobs (if kept)
    bull:<queue>:failed   — jobs that exhausted all retries
    bull:<queue>:delayed  — jobs scheduled for the future

  Redis guarantees atomicity (via Lua scripts inside BullMQ),
  so two workers can never pick up the same job simultaneously.

  JOB LIFECYCLE
  ─────────────
    add()
      │
      ▼
   [waiting]  ──►  [active]  ──►  [completed]
                      │
                      └──►  [failed]  ──►  (retry? → waiting | dead)
*/

// --- Typed reference (no live Redis needed) ---

interface RedisConnection {
  host: string;
  port: number;
  password?: string;
}

interface JobData {
  userId: string;
  email: string;
  templateId?: string;
}

interface AddJobOpts {
  delay?: number;
  attempts?: number;
  backoff?: { type: "fixed" | "exponential"; delay: number };
  priority?: number;
  removeOnComplete?: number | boolean;
  removeOnFail?: number | boolean;
  jobId?: string;
  repeat?: { pattern?: string; every?: number; tz?: string };
}

// Pseudocode mirroring the real BullMQ API:

function bullmqFundamentalsExample(): void {
  const connection: RedisConnection = { host: "localhost", port: 6379 };

  // --- Queue (producer) ---
  // const emailQueue = new Queue("email", { connection });

  // Add a job: queue.add(jobName, data, options)
  // await emailQueue.add("welcome-email", {
  //   userId: "u_123",
  //   email: "alice@example.com",
  //   templateId: "welcome-v2",
  // });

  // Inspect counts:
  // const counts = await emailQueue.getJobCounts(
  //   "waiting", "active", "completed", "failed", "delayed"
  // );
  // console.log(counts);
  // → { waiting: 3, active: 1, completed: 142, failed: 2, delayed: 0 }

  // --- Worker (consumer) ---
  // const worker = new Worker<JobData>(
  //   "email",
  //   async (job) => {
  //     console.log(`Processing job ${job.id}: ${job.name}`);
  //     console.log("Data:", job.data);
  //     await sendEmail(job.data.email, job.data.templateId);
  //   },
  //   { connection }
  // );

  // --- QueueEvents (cross-process event bus) ---
  // const events = new QueueEvents("email", { connection });
  // events.on("completed", ({ jobId }) => console.log(`Job ${jobId} done`));
  // events.on("failed", ({ jobId, failedReason }) =>
  //   console.log(`Job ${jobId} failed: ${failedReason}`)
  // );

  console.log(`[Fundamentals] connection target: ${connection.host}:${connection.port}`);
  console.log("[Fundamentals] Queue → Worker → QueueEvents pattern loaded");
}

bullmqFundamentalsExample();

// ───────────────────────────────────────────────────────────────
// 3. JOB OPTIONS
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Job Options ===");

/*
  delay           Schedule job to run N ms in the future.
                  Job goes to [delayed] until the time comes.

  attempts        Total number of tries (1st attempt + N-1 retries).
                  Default is 1 (no retries).

  backoff         Time to wait between retries.
                    { type: "fixed",       delay: 2000 }  → always 2 s
                    { type: "exponential", delay: 1000 }  → 1s, 2s, 4s, 8s…

  priority        Lower number = higher priority.
                    priority: 1  picked before  priority: 10
                  Default: no priority (FIFO).

  removeOnComplete Keep only last N completed jobs (saves Redis memory).
                    true  → remove immediately
                    100   → keep last 100

  removeOnFail    Same for failed jobs.

  jobId           Custom ID for deduplication:
                    If a job with the same ID already exists in
                    waiting/delayed/active, the new add() is ignored.
                    Perfect for "only one pending sync per user" patterns.
*/

interface JobOptionsDemo {
  name: string;
  opts: AddJobOpts;
  explanation: string;
}

const jobOptionsExamples: JobOptionsDemo[] = [
  {
    name: "delayed-reminder",
    opts: { delay: 24 * 60 * 60 * 1000 },         // 24 hours from now
    explanation: "Run after a 24-hour delay (drip email)",
  },
  {
    name: "retry-with-backoff",
    opts: { attempts: 4, backoff: { type: "exponential", delay: 1000 } },
    explanation: "4 total tries: retries at 1s, 2s, 4s",
  },
  {
    name: "high-priority-payment",
    opts: { priority: 1 },
    explanation: "Jump ahead of default-priority jobs",
  },
  {
    name: "memory-safe",
    opts: { removeOnComplete: 50, removeOnFail: 20 },
    explanation: "Keep only last 50 completed + 20 failed in Redis",
  },
  {
    name: "deduplicated-sync",
    opts: { jobId: "sync:user:u_123" },
    explanation: "Won't enqueue a second sync for same user if one is pending",
  },
];

jobOptionsExamples.forEach(({ name, opts, explanation }) => {
  console.log(`  Job: "${name}"`);
  console.log(`    opts: ${JSON.stringify(opts)}`);
  console.log(`    → ${explanation}`);
});

// ───────────────────────────────────────────────────────────────
// 4. RETRY STRATEGIES
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Retry Strategies ===");

/*
  EXPONENTIAL BACKOFF
  ───────────────────
  Each retry waits longer than the last, giving the failing
  service time to recover without hammering it continuously.

    attempts: 5, backoff: { type: "exponential", delay: 1000 }
    → attempt 1 (immediate)
    → attempt 2 after  1 s   (delay * 2^0)
    → attempt 3 after  2 s   (delay * 2^1)
    → attempt 4 after  4 s   (delay * 2^2)
    → attempt 5 after  8 s   (delay * 2^3)
    → all retries exhausted → job moves to [failed]

  JITTER (prevent thundering herd)
  ─────────────────────────────────
  When many jobs fail simultaneously (e.g., downstream service
  goes down), they all retry at the same intervals and flood the
  service together. Adding random jitter spreads the load:

    delay = baseDelay * 2^attempt + Math.random() * 1000

  BullMQ's built-in exponential backoff does NOT add jitter, so
  implement it yourself via a custom backoff strategy or by
  computing the delay in the processor itself.

  ACCESSING ATTEMPT NUMBER INSIDE PROCESSOR
  ─────────────────────────────────────────
  job.attemptsMade  — number of attempts so far (0 on first try)
  job.opts.attempts — total allowed attempts

  DEAD LETTER QUEUE
  ─────────────────
  After all retries are exhausted, the job moves to [failed].
  You can move it to a separate "dead-letter" queue for manual
  inspection or alerting:

    worker.on("failed", async (job, err) => {
      if (job.attemptsMade >= job.opts.attempts - 1) {
        await deadLetterQueue.add("dead", { ...job.data, error: err.message });
      }
    });
*/

// Simulate retry timing calculation (no Redis needed)
function calculateRetryDelays(
  attempts: number,
  baseDelay: number,
  addJitter = false
): number[] {
  const delays: number[] = [];
  for (let i = 0; i < attempts - 1; i++) {
    const exponential = baseDelay * Math.pow(2, i);
    const jitter = addJitter ? Math.floor(Math.random() * 500) : 0;
    delays.push(exponential + jitter);
  }
  return delays;
}

const delays = calculateRetryDelays(5, 1000);
console.log("  Exponential backoff delays (ms) for 5 attempts:");
delays.forEach((d, i) => console.log(`    After attempt ${i + 1}: ${d} ms`));

const delaysWithJitter = calculateRetryDelays(5, 1000, true);
console.log("  With jitter:");
delaysWithJitter.forEach((d, i) =>
  console.log(`    After attempt ${i + 1}: ${d} ms`)
);

// Processor snippet (reference):
/*
  const worker = new Worker<JobData>("email", async (job) => {
    console.log(`Attempt ${job.attemptsMade + 1} of ${job.opts.attempts}`);
    await sendEmail(job.data.email);          // throws on failure
  }, { connection });

  worker.on("failed", async (job, err) => {
    const exhausted = job.attemptsMade >= (job.opts.attempts ?? 1) - 1;
    if (exhausted) {
      await deadLetterQueue.add("dead-letter", {
        originalData: job.data,
        error: err.message,
        failedAt: new Date().toISOString(),
      });
      console.error(`Job ${job.id} moved to dead-letter queue`);
    }
  });
*/

console.log("  [Retry logic reference printed — see code comments for full snippet]");

// ───────────────────────────────────────────────────────────────
// 5. SCHEDULING (REPEATABLE JOBS)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Scheduling (Repeatable Jobs) ===");

/*
  BullMQ can replace cron jobs entirely. Repeatable jobs are stored
  in Redis and survive worker restarts.

  CRON SYNTAX
  ───────────
    '* * * * *'      every minute
    '0 9 * * *'      every day at 09:00
    '0 0 * * 1'      every Monday at midnight
    '0 */6 * * *'    every 6 hours
    '0 0 1 * *'      1st day of every month at midnight

  INTERVAL (ms)
  ─────────────
    { every: 60_000 }   every 60 seconds
    { every: 3_600_000 } every hour

  TIMEZONE
  ────────
    { pattern: '0 9 * * *', tz: 'America/New_York' }
    Requires the 'luxon' peer dependency in some BullMQ versions.

  MANAGING REPEATABLE JOBS
  ────────────────────────
    // Add:
    await queue.add("daily-report", {}, {
      repeat: { pattern: "0 9 * * *", tz: "UTC" }
    });

    // List all:
    const jobs = await queue.getRepeatableJobs();
    jobs.forEach(j => console.log(j.key, j.pattern));

    // Remove by key (key comes from getRepeatableJobs):
    await queue.removeRepeatableByKey(jobs[0].key);

  KEY INSIGHT
  ───────────
  A repeatable job definition lives in Redis.
  Each time it fires, BullMQ creates a normal job and adds it
  to the waiting list — so all retry / monitoring features apply.
*/

interface RepeatableJobConfig {
  name: string;
  repeat: { pattern?: string; every?: number; tz?: string };
  description: string;
}

const repeatableJobs: RepeatableJobConfig[] = [
  {
    name: "daily-report",
    repeat: { pattern: "0 9 * * *", tz: "UTC" },
    description: "Email daily analytics report at 9 AM UTC",
  },
  {
    name: "hourly-sync",
    repeat: { every: 3_600_000 },
    description: "Sync inventory from supplier API every hour",
  },
  {
    name: "midnight-cleanup",
    repeat: { pattern: "0 0 * * *", tz: "UTC" },
    description: "Purge expired sessions and temp files at midnight",
  },
  {
    name: "weekly-digest",
    repeat: { pattern: "0 8 * * 1", tz: "America/New_York" },
    description: "Send weekly digest every Monday at 8 AM ET",
  },
];

console.log("  Repeatable job examples:");
repeatableJobs.forEach(({ name, repeat, description }) => {
  const schedule = repeat.pattern ?? `every ${repeat.every! / 1000}s`;
  const tz = repeat.tz ? ` (${repeat.tz})` : "";
  console.log(`  • "${name}" — ${schedule}${tz}`);
  console.log(`      ${description}`);
});

// ───────────────────────────────────────────────────────────────
// 6. CONCURRENCY AND RATE LIMITING
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Concurrency and Rate Limiting ===");

/*
  CONCURRENCY PER WORKER
  ──────────────────────
  By default a Worker processes one job at a time. Increase with
  the `concurrency` option:

    new Worker("email", processor, { connection, concurrency: 10 });

  This worker runs up to 10 jobs simultaneously (async in parallel).
  Good for I/O-bound jobs (network, DB calls).
  Keep concurrency lower for CPU-bound jobs (image processing).

  HORIZONTAL SCALING
  ──────────────────
  Multiple Worker instances on the SAME queue name share the work.
  BullMQ guarantees each job is picked up by exactly one worker:

    # Process 1 (server 1):
    new Worker("email", processor, { connection, concurrency: 5 });

    # Process 2 (server 2 — same Redis):
    new Worker("email", processor, { connection, concurrency: 5 });

    → 10 total concurrent jobs across two servers

  RATE LIMITER
  ────────────
  Limit how many jobs a worker processes per time window — crucial
  when calling a 3rd-party API with a rate limit (e.g. SendGrid
  allows 100 emails/second):

    new Worker("email", processor, {
      connection,
      limiter: { max: 100, duration: 1000 },  // 100 jobs per 1000 ms
    });

  Workers across all instances SHARE the same rate limit via Redis,
  so the total throughput is bounded globally, not per-worker.

  NAMED WORKERS
  ─────────────
  Workers have a `name` field for logging and BullMQ Board:
    new Worker("email", processor, { connection, name: "email-worker-1" });
*/

interface ConcurrencyScenario {
  scenario: string;
  workers: number;
  concurrencyPerWorker: number;
  rateLimiter?: { max: number; durationMs: number };
  maxThroughput: string;
}

const concurrencyScenarios: ConcurrencyScenario[] = [
  {
    scenario: "Single worker, default",
    workers: 1,
    concurrencyPerWorker: 1,
    maxThroughput: "1 job at a time",
  },
  {
    scenario: "Single worker, high concurrency",
    workers: 1,
    concurrencyPerWorker: 20,
    maxThroughput: "20 parallel async jobs",
  },
  {
    scenario: "Three servers, concurrency 5 each",
    workers: 3,
    concurrencyPerWorker: 5,
    maxThroughput: "15 parallel jobs total",
  },
  {
    scenario: "Rate-limited (SendGrid 100/s)",
    workers: 2,
    concurrencyPerWorker: 10,
    rateLimiter: { max: 100, durationMs: 1000 },
    maxThroughput: "100 emails/second globally",
  },
];

console.log("  Concurrency scenarios:");
concurrencyScenarios.forEach(({ scenario, workers, concurrencyPerWorker, rateLimiter, maxThroughput }) => {
  console.log(`  • ${scenario}`);
  console.log(`      workers=${workers}, concurrency=${concurrencyPerWorker}${rateLimiter ? `, limiter=${rateLimiter.max}/${rateLimiter.durationMs}ms` : ""}`);
  console.log(`      → ${maxThroughput}`);
});

// ───────────────────────────────────────────────────────────────
// 7. JOB EVENTS AND MONITORING
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. Job Events and Monitoring ===");

/*
  WORKER EVENTS (in-process)
  ───────────────────────────
    worker.on("completed", (job, result) => { ... })
    worker.on("failed",    (job, err)    => { ... })
    worker.on("progress",  (job, progress) => { ... })
    worker.on("active",    (job)         => { ... })
    worker.on("stalled",   (jobId)       => { ... })  // job crashed mid-run

  PROGRESS FROM INSIDE THE PROCESSOR
  ───────────────────────────────────
  Call job.updateProgress() from within the async processor to
  report how far along the job is:

    const worker = new Worker("video-transcode", async (job) => {
      for (let pct = 0; pct <= 100; pct += 10) {
        await transcodeChunk(job.data.videoId, pct);
        await job.updateProgress(pct);          // ← emits "progress" event
      }
    }, { connection });

  QUEUEEVENTS (cross-process)
  ────────────────────────────
  QueueEvents connects to Redis and receives events from ALL workers,
  even if they run in different processes/servers:

    const events = new QueueEvents("email", { connection });
    events.on("completed", ({ jobId, returnvalue }) => { ... });
    events.on("failed",    ({ jobId, failedReason }) => { ... });
    events.on("progress",  ({ jobId, data })         => { ... });

  Use QueueEvents in your API server to await job completion:

    const result = await events.waitUntilFinished(
      queue.add("generate-pdf", data)
    );

  BULLMQ BOARD (UI DASHBOARD)
  ────────────────────────────
  Install @bull-board/express (or Fastify/Hapi adapter) to get
  a web dashboard showing queue state, job history, retry controls:

    import { createBullBoard } from "@bull-board/api";
    import { BullMQAdapter }   from "@bull-board/api/bullMQAdapter";
    import { ExpressAdapter }  from "@bull-board/express";

    const serverAdapter = new ExpressAdapter();
    createBullBoard({
      queues: [new BullMQAdapter(emailQueue)],
      serverAdapter,
    });
    app.use("/admin/queues", serverAdapter.getRouter());
    // → http://localhost:3000/admin/queues
*/

type EventName = "active" | "progress" | "completed" | "failed" | "stalled";

interface EventDescription {
  event: EventName;
  payload: string;
  use: string;
}

const events: EventDescription[] = [
  { event: "active",     payload: "(job)",              use: "Log job start, set timeout watchdog" },
  { event: "progress",   payload: "(job, progress)",    use: "Stream progress to client via WebSocket" },
  { event: "completed",  payload: "(job, result)",      use: "Send notification, update DB status" },
  { event: "failed",     payload: "(job, err)",         use: "Alert on-call, move to dead-letter queue" },
  { event: "stalled",    payload: "(jobId)",            use: "Alert: worker died mid-job, job will be retried" },
];

console.log("  Worker event reference:");
events.forEach(({ event, payload, use }) => {
  console.log(`  worker.on("${event}", ${payload})`);
  console.log(`    → ${use}`);
});

// ───────────────────────────────────────────────────────────────
// 8. PRACTICAL PATTERNS
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. Practical Patterns ===");

/*
  PATTERN 1: FAN-OUT (one job spawns many)
  ─────────────────────────────────────────
  Use case: send a notification to 10,000 users.
  Add one "broadcast" job; the worker splits it into per-user jobs.

    new Worker("broadcast", async (job) => {
      const users = await getUserSegment(job.data.segmentId);
      await Promise.all(
        users.map(u =>
          emailQueue.add("send-notification", { userId: u.id, ...job.data })
        )
      );
    }, { connection });

  PATTERN 2: JOB CHAINING (waterfall via completed callback)
  ────────────────────────────────────────────────────────────
  Use case: after transcoding, generate thumbnail, then index.

    worker.on("completed", async (job) => {
      if (job.name === "transcode-video") {
        await thumbnailQueue.add("generate-thumbnail", {
          videoId: job.data.videoId,
          outputPath: job.returnvalue.path,
        });
      }
    });

  PATTERN 3: FLOW PRODUCER (parent-child, built-in)
  ───────────────────────────────────────────────────
  BullMQ's FlowProducer lets you define a tree of jobs where a
  parent only completes after all children finish:

    const flow = new FlowProducer({ connection });
    await flow.add({
      name: "process-order",
      queueName: "orders",
      data: { orderId: "o_999" },
      children: [
        { name: "charge-payment",  queueName: "payments",  data: { orderId: "o_999" } },
        { name: "reserve-stock",   queueName: "inventory", data: { orderId: "o_999" } },
        { name: "send-receipt",    queueName: "email",     data: { orderId: "o_999" } },
      ],
    });

  PATTERN 4: IDEMPOTENT PROCESSORS
  ──────────────────────────────────
  Design processors to be safe to run twice (retry-safe):
  • Check if work is already done before doing it
  • Use database upserts instead of inserts
  • Use jobId deduplication at enqueue time

    async function sendWelcomeEmail(job: Job<JobData>) {
      const alreadySent = await db.emailLogs.exists({
        userId: job.data.userId, type: "welcome"
      });
      if (alreadySent) return;  // idempotent guard
      await mailer.send(job.data.email, "welcome");
      await db.emailLogs.insert({ userId: job.data.userId, type: "welcome" });
    }

  PATTERN 5: GRACEFUL SHUTDOWN
  ──────────────────────────────
  On SIGTERM (e.g. Kubernetes pod shutdown), finish in-flight jobs
  before exiting:

    process.on("SIGTERM", async () => {
      console.log("Shutting down worker...");
      await worker.close();   // waits for active jobs to finish
      await connection.quit();
      process.exit(0);
    });
*/

interface Pattern {
  name: string;
  trigger: string;
  summary: string;
}

const patterns: Pattern[] = [
  {
    name: "Fan-out",
    trigger: "One job, many recipients",
    summary: "Worker splits one job into N child jobs (e.g. mass notification)",
  },
  {
    name: "Job Chaining",
    trigger: "Step-by-step pipeline",
    summary: "completed event adds the next job (transcode → thumbnail → index)",
  },
  {
    name: "FlowProducer",
    trigger: "Parent waits for children",
    summary: "Built-in parent-child tree; parent completes only when all children do",
  },
  {
    name: "Idempotent Processor",
    trigger: "Retry safety",
    summary: "Guard against duplicate work: check DB before acting, use upserts",
  },
  {
    name: "Graceful Shutdown",
    trigger: "SIGTERM / deploy",
    summary: "worker.close() drains active jobs before process exits",
  },
];

console.log("  Common BullMQ patterns:");
patterns.forEach(({ name, trigger, summary }) => {
  console.log(`  [${name}]`);
  console.log(`    When: ${trigger}`);
  console.log(`    How:  ${summary}`);
});

// ───────────────────────────────────────────────────────────────
// PRACTICE Q&A
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice Q&A ===");

const qa: Array<{ q: string; a: string }> = [
  {
    q: "Why should sending a welcome email be a background job, not inline in the signup route?",
    a: `Inline email sending adds ~800 ms to the response, fails silently if
       the SMTP server is down (no retries), and loses the email if the server
       crashes during that request. A background job returns the 201 immediately
       (~1 ms to enqueue), retries automatically on SMTP failure, and persists
       in Redis across server restarts.`,
  },
  {
    q: "You want a job to retry 3 times with 1s, 2s, 4s delays. What BullMQ options do you set?",
    a: `{ attempts: 4, backoff: { type: "exponential", delay: 1000 } }
       attempts=4 means 1 original try + 3 retries.
       Exponential backoff with delay=1000 gives: 1s, 2s, 4s between retries.`,
  },
  {
    q: "How do you prevent the same job from being added to the queue twice?",
    a: `Use a deterministic jobId based on the data:
         queue.add("sync", { userId: "u_123" }, { jobId: "sync:u_123" })
       BullMQ ignores add() calls for a jobId that already exists in
       waiting, delayed, or active state — so the second call is a no-op.`,
  },
  {
    q: "A worker crashes mid-job. What happens to the job?",
    a: `BullMQ marks jobs as "stalled" if the worker process stops sending
       heartbeats. A background stalledCheck process (or another worker)
       detects this and moves the job back to [waiting] so another worker
       can pick it up. The job counts this as an attempt, so retries still
       apply. This is why Redis persistence matters: the job state survives
       the crash.`,
  },
  {
    q: "How do you run a cleanup job every day at midnight UTC?",
    a: `Add a repeatable job with a cron pattern:
         await queue.add("midnight-cleanup", {}, {
           repeat: { pattern: "0 0 * * *", tz: "UTC" }
         });
       BullMQ stores the schedule in Redis. Each midnight it creates a
       regular job that goes through the normal waiting → active lifecycle,
       with all the retry and event features that entails.`,
  },
];

qa.forEach(({ q, a }, i) => {
  console.log(`\n  Q${i + 1}: ${q}`);
  console.log(`  A:  ${a.trim()}`);
});

// ───────────────────────────────────────────────────────────────
// REFERENCE CARD + runDemo
// ───────────────────────────────────────────────────────────────

function runDemo(): void {
  console.log("\n" + "═".repeat(65));
  console.log("BACKEND 13 — BULLMQ REFERENCE CARD");
  console.log("═".repeat(65));

  const card: Record<string, string[]> = {
    "Core objects": [
      "Queue(name, { connection })            — add jobs",
      "Worker(name, async (job)=>{}, opts)    — process jobs",
      "QueueEvents(name, { connection })      — cross-process events",
      "FlowProducer({ connection })           — parent-child trees",
    ],
    "Add job": [
      'queue.add("jobName", data, opts)',
      "opts: delay | attempts | backoff | priority",
      "      removeOnComplete | removeOnFail | jobId | repeat",
    ],
    "Retry options": [
      "attempts: 4                            — 1 try + 3 retries",
      'backoff: { type: "exponential", delay: 1000 }',
      "                                       → 1s, 2s, 4s delays",
      'backoff: { type: "fixed",       delay: 2000 }',
      "                                       → always 2s",
    ],
    "Scheduling": [
      'repeat: { pattern: "0 9 * * *", tz: "UTC" }',
      "repeat: { every: 60_000 }              — every 60 s",
      "queue.getRepeatableJobs()              — list schedules",
      "queue.removeRepeatableByKey(key)       — cancel schedule",
    ],
    "Concurrency": [
      "new Worker(n, fn, { concurrency: 10 }) — 10 parallel jobs",
      "limiter: { max: 100, duration: 1000 }  — 100 jobs/second",
      "Multiple Workers on same queue name    — horizontal scale",
    ],
    "Events": [
      'worker.on("completed", (job, result) => {})',
      'worker.on("failed",    (job, err)    => {})',
      'worker.on("progress",  (job, pct)    => {})',
      "await job.updateProgress(50)           — from inside processor",
    ],
    "Key patterns": [
      "Fan-out        — one job spawns many child jobs",
      "Job chaining   — completed handler adds next job",
      "FlowProducer   — parent waits for all children",
      "Idempotent     — guard before acting, use upserts",
      "Graceful exit  — await worker.close() on SIGTERM",
    ],
    "Install": [
      "npm install bullmq ioredis",
      "docker run -p 6379:6379 redis   (or managed Redis)",
      "npm install @bull-board/express  (optional UI)",
    ],
  };

  Object.entries(card).forEach(([section, lines]) => {
    console.log(`\n  ${section}:`);
    lines.forEach(line => console.log(`    ${line}`));
  });

  console.log("\n" + "═".repeat(65));
}

export default runDemo;

runDemo();
