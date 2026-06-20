// ════════════════════════════════════════════════════════════════
// DAY 48 — BACKGROUND JOBS WITH BULLMQ
// ════════════════════════════════════════════════════════════════
//
// WHY BACKGROUND JOBS?
//   Some tasks are too slow, unreliable, or expensive to do synchronously
//   inside an HTTP request handler:
//
//   ❌ Sync (bad):
//     POST /register → send welcome email → wait 800ms → respond 200
//     If email API is down: user gets a 500 error for something unrelated
//
//   ✅ Async with queue (good):
//     POST /register → add email job to queue → respond 202 Accepted immediately
//     Background worker picks up job → sends email → retries on failure
//
//   Real examples:
//     - Sending email (external API, can fail, needs retries)
//     - Image/video processing (CPU-intensive, blocks event loop)
//     - PDF generation (slow, memory-hungry)
//     - Webhook delivery to external services (network-dependent)
//     - Nightly reports / data exports (scheduled)
//     - Cache warming, search index updates
//
// BULLMQ ARCHITECTURE:
//
//   ┌─────────┐   add()   ┌───────┐   BRPOP   ┌────────┐
//   │Producer │ ────────▶ │ Redis │ ──────────▶│ Worker │
//   │(your API│           │Queue  │            │        │
//   │handler) │           └───────┘            └────────┘
//   └─────────┘               │                     │
//                             │   stores state:      │ updates state:
//                             │   waiting/active/    │ active→completed
//                             │   completed/failed   │ or failed+retry
//
//   Queue:   where jobs are added (producer side). Backed by Redis sorted sets.
//   Worker:  pulls jobs and processes them (consumer side). One per process/thread.
//   Job:     unit of work with { name, data, opts } — persisted in Redis.
//   QueueEvents: listens to job lifecycle events (completed, failed, progress).
//   FlowProducer: adds jobs as DAGs — job B only runs after job A completes.
//
// JOB LIFECYCLE:
//   added → waiting → active → completed
//                          ↘ failed → (retry if attempts remaining)
//                                   → dead (in failed set)
//
// REDIS KEYS BULLMQ USES (useful to know for debugging):
//   bull:{queueName}:wait     — sorted set of waiting jobs
//   bull:{queueName}:active   — list of active jobs
//   bull:{queueName}:completed — sorted set of completed jobs
//   bull:{queueName}:{jobId}  — hash of job data
//
// REQUIRES: Redis running on localhost:6379
// Start:  docker run -d -p 6379:6379 redis:7-alpine
// Check:  redis-cli ping  (should return PONG)
//
// SCALING:
//   Add more workers (same queue, more processes/servers) to increase throughput.
//   Each worker is a separate process — true parallelism, not just async.
//   BullMQ handles the locking so only one worker picks each job.
//
// ════════════════════════════════════════════════════════════════

import { Queue, Worker, QueueEvents, Job, ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';

// ─── Redis connection ─────────────────────────────────────────────
// IMPORTANT: BullMQ v5 bundles its OWN copy of ioredis internally.
// Passing an external IORedis instance causes a TypeScript type mismatch
// because the two ioredis builds are structurally incompatible (different
// module paths → different nominal types even if identical at runtime).
//
// SOLUTION: Pass a plain ConnectionOptions object { host, port }.
// BullMQ creates its own internal Redis connections from this config.
//
// Use a separate IORedis instance ONLY for the health-check ping —
// that uses the public ioredis package directly and is fine.

const connection: ConnectionOptions = {
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null, // BullMQ requirement — don't limit retries internally
};

// Test Redis availability before running demos (uses ioredis directly, not BullMQ)
async function checkRedis(): Promise<boolean> {
  const probe = new IORedis({ host: 'localhost', port: 6379, lazyConnect: true });
  try {
    await probe.connect();
    await probe.ping();
    await probe.quit();
    console.log('[redis] Connected to Redis on localhost:6379');
    return true;
  } catch (err) {
    console.warn('[redis] Could not connect to Redis:', (err as Error).message);
    console.warn('[redis] Start Redis with: docker run -d -p 6379:6379 redis:7-alpine');
    try { probe.disconnect(); } catch { /* ignore */ }
    return false;
  }
}

// ─── DEMO 1: Email queue ──────────────────────────────────────────
// Pattern: HTTP handler adds job → worker processes it → can retry on failure.
// This is the most common BullMQ use case.

interface EmailJobData {
  to: string;
  subject: string;
  body: string;
  name?: string;
}

async function runEmailQueueDemo(): Promise<void> {
  console.log('\n──────────────────────────────────────');
  console.log('DEMO 1: Email Queue');
  console.log('──────────────────────────────────────');

  const emailQueue = new Queue<EmailJobData>('emails', { connection });

  // QueueEvents lets you listen to job lifecycle events.
  // Useful for: logging, metrics, notifying other services, updating a DB.
  const emailEvents = new QueueEvents('emails', { connection });

  emailEvents.on('completed', ({ jobId, returnvalue }) => {
    console.log(`[emails] Job ${jobId} completed — result: ${returnvalue}`);
  });

  emailEvents.on('failed', ({ jobId, failedReason }) => {
    console.error(`[emails] Job ${jobId} FAILED: ${failedReason}`);
  });

  // Worker: processes jobs from the 'emails' queue.
  // Each Worker instance runs in an async loop (BRPOP on Redis).
  // In production: workers run in separate processes.
  const emailWorker = new Worker<EmailJobData, string>(
    'emails',
    async (job: Job<EmailJobData>) => {
      console.log(`  [worker] Processing job "${job.name}" id=${job.id}`);
      console.log(`  [worker] To: ${job.data.to}, Subject: ${job.data.subject}`);

      // Simulate email send latency (network call to Nodemailer/SendGrid)
      // In real code: await transporter.sendMail({ to, subject, html })
      await new Promise(r => setTimeout(r, 80 + Math.random() * 40));

      console.log(`  [worker] Email sent to ${job.data.to}`);
      return `sent:${job.data.to}:${Date.now()}`;
    },
    { connection },
  );

  emailWorker.on('error', (err) => {
    console.error('[emailWorker] Error:', err.message);
  });

  // Producer: add jobs (this is what your HTTP handler does)
  console.log('[emails] Adding 3 email jobs...');

  await emailQueue.add('welcome-email', {
    to: 'alice@example.com',
    subject: 'Welcome to our app!',
    body: 'Hi Alice, thanks for signing up.',
    name: 'Alice',
  });

  await emailQueue.add('password-reset', {
    to: 'bob@example.com',
    subject: 'Password reset request',
    body: 'Click here to reset your password...',
    name: 'Bob',
  });

  await emailQueue.add('weekly-digest', {
    to: 'carol@example.com',
    subject: 'Your weekly digest',
    body: 'Here is what happened this week...',
  });

  // Wait for all 3 jobs to complete (demo only — production doesn't wait)
  await waitForQueueDrain(emailQueue, emailWorker, 3, 10_000);
  await emailWorker.close();
  await emailEvents.close();
  await emailQueue.close();
}

// ─── DEMO 2: Retry with exponential backoff ───────────────────────
// Pattern: flaky external API call — retry 3 times with increasing delays.
//
// Backoff types:
//   fixed:       always wait `delay` ms between retries
//   exponential: wait delay * 2^attempt ms (1s, 2s, 4s, 8s...)
//
// WHY EXPONENTIAL?
//   If your email API is down, hammering it every 1s makes it worse.
//   Exponential backoff gives the external service time to recover.
//   Add jitter in production: delay * (0.5 + Math.random()) to avoid
//   thundering herd (all retries hitting at exactly the same time).

interface FlakyJobData {
  shouldFailAttempts: number; // fail for the first N attempts
}

async function runRetryDemo(): Promise<void> {
  console.log('\n──────────────────────────────────────');
  console.log('DEMO 2: Retry with Exponential Backoff');
  console.log('──────────────────────────────────────');

  const retryQueue = new Queue<FlakyJobData>('retries', { connection });
  const retryEvents = new QueueEvents('retries', { connection });

  retryEvents.on('failed', ({ jobId, failedReason, prev }) => {
    console.log(`  [retry] Job ${jobId} failed (was: ${prev}): ${failedReason}`);
  });
  retryEvents.on('completed', ({ jobId }) => {
    console.log(`  [retry] Job ${jobId} finally succeeded!`);
  });

  const retryWorker = new Worker<FlakyJobData>(
    'retries',
    async (job: Job<FlakyJobData>) => {
      const attemptNumber = job.attemptsMade; // 0-indexed
      console.log(`  [retry-worker] Attempt #${attemptNumber + 1} for job ${job.id}`);

      if (attemptNumber < job.data.shouldFailAttempts) {
        // Simulate a transient failure (network timeout, API rate limit, etc.)
        throw new Error(`Simulated failure on attempt ${attemptNumber + 1}`);
      }

      console.log(`  [retry-worker] SUCCESS on attempt ${attemptNumber + 1}`);
      return 'ok';
    },
    { connection },
  );

  retryWorker.on('error', (err) => {
    console.error('[retryWorker] Error:', err.message);
  });

  // This job will fail twice, then succeed on the 3rd attempt.
  // With exponential backoff starting at 200ms (demo — real apps use 1000ms+):
  //   Attempt 1: fail → wait 200ms
  //   Attempt 2: fail → wait 400ms
  //   Attempt 3: succeed
  await retryQueue.add(
    'flaky-api-call',
    { shouldFailAttempts: 2 },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 200 },
    },
  );

  await waitForQueueDrain(retryQueue, retryWorker, 1, 10_000);
  await retryWorker.close();
  await retryEvents.close();
  await retryQueue.close();
}

// ─── DEMO 3: Delayed jobs ─────────────────────────────────────────
// Schedule a job to run in the future.
// Use cases: reminder emails, trial expiry notices, deferred cleanup.
//
// HOW IT WORKS:
//   BullMQ stores delayed jobs in a sorted set keyed by their run timestamp.
//   A scheduler process (built into Worker) promotes them to "waiting"
//   when their time arrives.

async function runDelayedJobDemo(): Promise<void> {
  console.log('\n──────────────────────────────────────');
  console.log('DEMO 3: Delayed Jobs');
  console.log('──────────────────────────────────────');

  const delayedQueue = new Queue<{ to: string; message: string }>('delayed', { connection });

  const delayedWorker = new Worker<{ to: string; message: string }>(
    'delayed',
    async (job) => {
      console.log(`  [delayed-worker] Sending reminder to ${job.data.to}: "${job.data.message}"`);
      await new Promise(r => setTimeout(r, 50));
    },
    { connection },
  );

  delayedWorker.on('error', (err) => {
    console.error('[delayedWorker] Error:', err.message);
  });

  const DELAY_MS = 2_000; // 2s for demo; real apps use hours/days

  console.log(`[delayed] Adding job with ${DELAY_MS}ms delay...`);
  console.log(`[delayed] Job will run at: ${new Date(Date.now() + DELAY_MS).toISOString()}`);

  await delayedQueue.add(
    'trial-expiry-reminder',
    { to: 'dave@example.com', message: 'Your trial expires in 3 days!' },
    { delay: DELAY_MS },
  );

  await waitForQueueDrain(delayedQueue, delayedWorker, 1, 10_000);
  await delayedWorker.close();
  await delayedQueue.close();
}

// ─── DEMO 4: Recurring jobs ───────────────────────────────────────
// Run jobs on a schedule (like cron). BullMQ uses cron expressions.
// Internally: BullMQ uses a "scheduler" key in Redis to track next run time.
//
// Cron expression format: minute hour day-of-month month day-of-week
//   "0 9 * * 1-5"   → 9am Mon-Fri
//   "0 0 * * *"     → midnight every day
//   "*/5 * * * *"   → every 5 minutes
//   "* * * * *"     → every minute (used in this demo)
//
// NOTE: Repeatable jobs keep their ID across runs — BullMQ tracks them
// by the pattern. Adding the same pattern twice doesn't create duplicates.
// Use removeOnComplete to avoid filling Redis with completed job history.

async function runRecurringJobDemo(): Promise<void> {
  console.log('\n──────────────────────────────────────');
  console.log('DEMO 4: Recurring Jobs (cron)');
  console.log('──────────────────────────────────────');

  const reportQueue = new Queue('reports', { connection });

  const reportWorker = new Worker(
    'reports',
    async (job) => {
      console.log(`  [report-worker] Generating report at ${new Date().toISOString()}`);
      await new Promise(r => setTimeout(r, 100));
      console.log(`  [report-worker] Report complete (job ${job.id})`);
    },
    { connection },
  );

  reportWorker.on('error', (err) => {
    console.error('[reportWorker] Error:', err.message);
  });

  // Add a recurring job — fires every minute in this demo
  // In production use "0 2 * * *" for 2am daily
  await reportQueue.add(
    'daily-summary-report',
    { reportType: 'daily', includeMetrics: true },
    {
      repeat: { pattern: '* * * * *' }, // every minute
      removeOnComplete: { count: 10 },  // keep last 10 completed records in Redis
      removeOnFail: { count: 5 },       // keep last 5 failed records
    },
  );

  console.log('[reports] Recurring job scheduled — will fire every minute.');
  console.log('[reports] Waiting 70s to see at least one run...');

  // Wait 70s to observe one execution
  await new Promise(r => setTimeout(r, 70_000));

  // Clean up repeatable jobs when done
  const repeatableJobs = await reportQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await reportQueue.removeRepeatableByKey(job.key);
    console.log(`[reports] Removed repeatable job: ${job.name}`);
  }

  await reportWorker.close();
  await reportQueue.close();
}

// ─── DEMO 5: Job progress tracking ───────────────────────────────
// Workers can report progress (0–100). Consumers listen via QueueEvents.
// Use case: show a progress bar in the UI while a long job runs.
// The UI can poll GET /jobs/:id/progress, which reads from Redis.

async function runProgressDemo(): Promise<void> {
  console.log('\n──────────────────────────────────────');
  console.log('DEMO 5: Job Progress Tracking');
  console.log('──────────────────────────────────────');

  const imageQueue = new Queue<{ filename: string }>('image-processing', { connection });
  const imageEvents = new QueueEvents('image-processing', { connection });

  // QueueEvents fires 'progress' when job.updateProgress() is called
  imageEvents.on('progress', ({ jobId, data }) => {
    const pct = typeof data === 'number' ? data : (data as { pct: number }).pct;
    process.stdout.write(`\r  [progress] Job ${jobId}: ${pct}%   `);
    if (pct === 100) process.stdout.write('\n');
  });

  imageEvents.on('completed', ({ jobId }) => {
    console.log(`  [progress] Job ${jobId} completed!`);
  });

  const imageWorker = new Worker<{ filename: string }>(
    'image-processing',
    async (job: Job<{ filename: string }>) => {
      const stages = [
        'Reading file',
        'Decoding image',
        'Resizing to 1200px',
        'Generating thumbnail',
        'Running compression',
        'Writing WebP variant',
        'Uploading to S3',
        'Updating database',
        'Purging CDN cache',
        'Done',
      ];

      for (let i = 0; i < stages.length; i++) {
        // job.updateProgress() stores progress in Redis and emits the event
        await job.updateProgress(Math.round(((i + 1) / stages.length) * 100));
        await new Promise(r => setTimeout(r, 80));
      }

      return { url: `https://cdn.example.com/${job.data.filename}` };
    },
    { connection },
  );

  imageWorker.on('error', (err) => {
    console.error('[imageWorker] Error:', err.message);
  });

  await imageQueue.add('process-image', { filename: 'hero-photo.jpg' });

  await waitForQueueDrain(imageQueue, imageWorker, 1, 15_000);
  await imageWorker.close();
  await imageEvents.close();
  await imageQueue.close();
}

// ─── Utility: wait for queue to drain ────────────────────────────
// Polls until the expected number of jobs have completed (or timeout).
// Production alternative: use QueueEvents 'completed' count.

async function waitForQueueDrain(
  queue: Queue,
  _worker: Worker,
  expectedJobs: number,
  timeoutMs: number,
): Promise<void> {
  const start = Date.now();
  let completed = 0;

  while (completed < expectedJobs && Date.now() - start < timeoutMs) {
    const counts = await queue.getJobCounts('completed', 'failed');
    completed = (counts.completed ?? 0) + (counts.failed ?? 0);
    if (completed < expectedJobs) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  if (Date.now() - start >= timeoutMs) {
    console.warn(`[drain] Timeout waiting for ${queue.name} to drain`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('════════════════════════════════════════════════════');
  console.log('DAY 48 — BullMQ Background Jobs');
  console.log('════════════════════════════════════════════════════');

  const redisAvailable = await checkRedis();
  if (!redisAvailable) {
    console.log('\nSkipping demos — Redis required.');
    console.log('Run: docker run -d -p 6379:6379 redis:7-alpine');
    process.exit(0);
  }

  try {
    await runEmailQueueDemo();
    await runRetryDemo();
    await runDelayedJobDemo();
    await runProgressDemo();
    // NOTE: runRecurringJobDemo() takes 70s — uncomment to run it
    // await runRecurringJobDemo();

    console.log('\n════════════════════════════════════════════════════');
    console.log('All demos complete.');
  } catch (err) {
    console.error('[main] Error:', err);
  } finally {
    // BullMQ manages its own internal Redis connections — they are closed
    // when each Queue/Worker/QueueEvents is closed (done inside each demo).
    process.exit(0);
  }
}

main().catch(console.error);
