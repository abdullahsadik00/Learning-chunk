# Day 48 Assessment — BullMQ · Job Queues · Retries · Scheduling

**Theme:** You are the platform engineer at an email marketing company. Your API handles 50k user sign-ups per day, each requiring: welcome email, Stripe customer creation, Slack notification, PDF generation. You cannot do these synchronously. Your job queue architecture determines whether users have a great experience or see timeouts.

---

### Q1 — Why background jobs ⭐

**Scenario:** Your current sign-up handler does everything inline: sends an email, calls Stripe, posts to Slack, generates a PDF — all in the same `await` chain. The endpoint times out at 30 seconds during peak hours, and a single Stripe API outage takes down the entire sign-up flow.

**Task:** List 5 reasons a task should be a background job instead of running synchronously in an HTTP handler. Provide a concrete example for each.

**Acceptance Criteria:**
- [ ] Slow external API: the HTTP handler must wait for the external call to complete before responding; example: Stripe customer creation takes 800ms — user waits for it even though it doesn't affect the response
- [ ] Retry on failure: HTTP responses are already sent — you cannot retry a step that failed without losing the result; example: welcome email fails due to SendGrid outage — needs to retry 3× without the user re-submitting the form
- [ ] CPU-intensive work: blocking the Node.js event loop delays all other requests; example: generating a 50-page PDF report blocks the server for 2–3 seconds
- [ ] Scheduled work: tasks that must run at a specific time cannot be in an HTTP handler; example: "send re-engagement email 7 days after sign-up" — no HTTP request happens 7 days later
- [ ] Fire-and-forget: the response doesn't depend on the task's result; example: Slack notification to `#new-users` — whether it succeeds or fails is irrelevant to the user's sign-up experience
- [ ] Summary principle: if the task's success or failure does not affect the HTTP response, or if it can fail and be retried independently, it belongs in a background job

---

### Q2 — BullMQ concepts ⭐

**Scenario:** Your team is adopting BullMQ for the first time. Before writing any code, a new engineer needs to understand the 4 core concepts and why Redis is used as the broker rather than PostgreSQL.

**Task:** Define Queue (producer side), Worker (consumer side), Job (unit of work), and QueueEvents (monitoring). Explain why Redis is used as the broker.

**Acceptance Criteria:**
- [ ] Queue: the producer-side object that adds jobs to the queue; your HTTP server creates a `Queue` instance and calls `queue.add(name, data, opts)` to enqueue work; does not process jobs
- [ ] Worker: the consumer-side object that processes jobs; `new Worker(queueName, processorFn, opts)` — pulls jobs from Redis, calls `processorFn(job)`, marks job completed or failed
- [ ] Job: the unit of work — a JSON-serializable payload plus metadata (id, attempts, progress, timestamps); stored in Redis until processed and optionally cleaned up
- [ ] QueueEvents: an event emitter that listens to Redis pub/sub for job lifecycle events (`completed`, `failed`, `progress`, `stalled`); used for monitoring dashboards and alerting without coupling to the Worker
- [ ] Redis is used because: it provides atomic operations (`LPUSH`/`BRPOPLPUSH`) to move jobs between states without race conditions; it is fast (in-memory); it supports pub/sub for QueueEvents; it persists jobs to disk (AOF/RDB) so jobs survive worker restarts
- [ ] PostgreSQL alternative: possible but requires polling (no pub/sub), complex locking for multi-worker concurrency, and table scans for job queries — Redis is purpose-built for this pattern

---

### Q3 — Job lifecycle states ⭐

**Scenario:** A job for sending a welcome email fails on the first attempt (SendGrid rate limit). You have configured `attempts: 3`. You want to understand exactly what states the job transitions through and how to prevent Redis from filling up with completed job data.

**Task:** List all 5 states a BullMQ job transitions through. Explain what happens when `attempts: 3` is set and a job fails. Explain `removeOnComplete`.

**Acceptance Criteria:**
- [ ] State 1 — waiting: job is in the queue, waiting to be picked up by an available worker
- [ ] State 2 — active: a worker has claimed the job and is currently executing the processor function
- [ ] State 3 — completed: the processor function resolved successfully; job data is kept in Redis (unless `removeOnComplete` is set)
- [ ] State 4 — failed: the processor function threw an error; if `attempts` remain, the job moves back to waiting (after backoff delay); if all attempts are exhausted, it moves to the failed set permanently
- [ ] State 5 — delayed: job is scheduled to run in the future (via `delay` option or backoff); stored in a Redis sorted set scored by the run-at timestamp
- [ ] `attempts: 3` behavior: on first failure, attempt count increments to 1 and job re-enters waiting/delayed; on second failure, attempt count is 2; on third failure, all attempts exhausted — job moves to the failed set and `queueEvents` emits `'failed'`
- [ ] `removeOnComplete: { count: 1000 }` — keeps only the last 1,000 completed jobs in Redis, automatically removing older ones; without this, completed jobs accumulate indefinitely and Redis memory grows proportional to total throughput

---

### Q4 — Queue vs Worker separation ⭐

**Scenario:** A colleague co-locates the Queue and Worker in the same Express `index.ts` file for simplicity. During a deployment, the process receives SIGTERM — Express stops accepting new requests but active Worker jobs are killed mid-execution, leaving partial state in the database.

**Task:** Explain why the Queue should live in the HTTP server and Workers should run in a separate process. Describe what goes wrong when they are co-located during graceful shutdown.

**Acceptance Criteria:**
- [ ] Queue in HTTP server: the server needs to enqueue jobs when handling requests; it does not need to process them; importing `Queue` (not `Worker`) in the server keeps the server lightweight and focused on request handling
- [ ] Worker in separate process: workers are long-running CPU/IO consumers; they can be scaled independently of the HTTP server (more workers during high load); they can be restarted without disrupting the HTTP server
- [ ] Co-location problem during shutdown: when the HTTP server receives SIGTERM and starts its graceful shutdown, Node.js begins draining the event loop; if the Worker is in the same process, in-flight jobs are abandoned mid-execution
- [ ] Consequence of abandoned jobs: the job remains in the "active" state in Redis with a lock; after `lockDuration` (default 30s) the lock expires and the job is moved back to "waiting" as a stalled job — processed twice by the next worker (idempotency becomes critical)
- [ ] Correct shutdown order for Workers: call `await worker.close()` which waits for the current job to finish before shutting down; this cannot be done cleanly if the HTTP server owns the shutdown sequence
- [ ] Deployment benefit: separate processes allow rolling restarts — restart workers one at a time while the HTTP server continues serving traffic, and vice versa

---

### Q5 — Exponential backoff ⭐⭐

**Scenario:** Your welcome email job calls the SendGrid API. SendGrid is intermittently returning 429 (rate limit) errors. Retrying immediately (fixed 1s delay) floods SendGrid with repeated requests, making the rate limit worse. You need exponential backoff.

**Task:** Write the BullMQ retry config with exponential backoff. Calculate the delay for each of 5 attempts (starting at 1s). Explain why exponential backoff reduces load on a failing external service.

**Acceptance Criteria:**
- [ ] BullMQ config: `{ attempts: 5, backoff: { type: 'exponential', delay: 1000 } }`
- [ ] Attempt 1 delay: 1,000ms (1s) — `delay × 2^0`
- [ ] Attempt 2 delay: 2,000ms (2s) — `delay × 2^1`
- [ ] Attempt 3 delay: 4,000ms (4s) — `delay × 2^2`
- [ ] Attempt 4 delay: 8,000ms (8s) — `delay × 2^3`
- [ ] Attempt 5 delay: 16,000ms (16s) — `delay × 2^4`
- [ ] Why exponential: a fixed-delay retry (e.g., all 5 attempts in 5 seconds) sends a burst of requests to the already-overloaded service; exponential spacing allows the service's rate limit window to reset between retries — the retry load decreases over time rather than hammering at a constant rate

---

### Q6 — Job deduplication ⭐⭐

**Scenario:** Users on the marketing site sometimes click the "Send me a copy" button multiple times before the page responds. Each click fires a POST to your API, which enqueues an email job. Users receive 3–5 duplicate emails.

**Task:** Use BullMQ's `jobId` option to deduplicate. Show the `queue.add` call. Explain what states an existing job must be in for deduplication to work and what happens if it is already in the "completed" state.

**Acceptance Criteria:**
- [ ] Dedup call: `await queue.add('welcome-email', { userId, email }, { jobId: `welcome:${userId}` })`
- [ ] Effect: if a job with `jobId: 'welcome:123'` already exists in the queue, BullMQ skips adding a new one — the `add` call returns the existing job instead of creating a duplicate
- [ ] States where dedup works: `waiting`, `delayed`, `active` — if the job is in any of these states, a new job with the same ID is not added
- [ ] `completed` state: once a job completes, its ID is freed — a subsequent `queue.add` with the same `jobId` will create a new job; this is the desired behavior (if a user legitimately requests a second copy days later, it should be sent)
- [ ] `failed` state: a failed job with that ID still exists — `queue.add` will NOT add a new job; the user's button click is silently dropped; fix by calling `await queue.remove(existingJob.id)` before re-adding, or by using a time-scoped job ID: `welcome:${userId}:${Date.now()}`
- [ ] Idempotency key pattern: the `jobId` acts as an idempotency key — the same concept as `Idempotency-Key` in REST APIs; the client can safely retry the request without causing duplicate work

---

### Q7 — Delayed jobs ⭐⭐

**Scenario:** Your onboarding team finds that users who haven't completed their profile 24 hours after sign-up have a 40% higher churn rate. You want to send a "complete your profile" reminder email exactly 24 hours after sign-up if the user hasn't completed it yet.

**Task:** Show the `queue.add` call with a 24-hour delay. Describe the internal Redis data structure used for delayed jobs. Explain how to implement the "only send if profile incomplete" check inside the worker.

**Acceptance Criteria:**
- [ ] Delayed job: `await queue.add('profile-reminder', { userId }, { delay: 86_400_000 })` — delay is in milliseconds; 24h = 86,400,000ms
- [ ] Job is not processed immediately — it enters the `delayed` state and will not be picked up by workers until `now + delay` time has elapsed
- [ ] Internal Redis structure: BullMQ stores delayed jobs in a Redis Sorted Set (`ZSET`) where the score is the Unix timestamp (in milliseconds) when the job should run; a scheduler process polls this ZSET and moves jobs to the waiting queue when their score ≤ `Date.now()`
- [ ] Worker check: inside the processor, query the database for the user's profile status: `const user = await db.users.findById(job.data.userId); if (user.profileComplete) return; // skip`
- [ ] Guard against deleted users: `if (!user) return;` — the user may have deleted their account in the 24 hours since the job was enqueued
- [ ] This pattern (enqueue eagerly, check condition at execution time) is called "check on consume" — it is simpler than trying to cancel the job if the user completes their profile (though you can also cancel with `job.remove()`)

---

### Q8 — Recurring jobs with cron ⭐⭐

**Scenario:** Your marketing team sends a weekly engagement report to all subscribers every Monday at 9am. The current implementation uses `setInterval` in the server process — it misses sends when the server restarts and runs on every instance in a 3-node cluster (sending 3 reports).

**Task:** Replace `setInterval` with BullMQ's cron repeat. Parse the cron expression `0 9 * * 1-5`. Explain how BullMQ's scheduler differs from `setInterval`. Show how to remove a repeating job.

**Acceptance Criteria:**
- [ ] BullMQ cron add: `await queue.add('weekly-report', {}, { repeat: { pattern: '0 9 * * 1' } })` — `0 9 * * 1` = at 09:00 on Mondays; the prompt's `1-5` means weekdays (Monday–Friday)
- [ ] Cron expression breakdown: `0` = minute 0, `9` = hour 9, `*` = any day of month, `*` = any month, `1-5` = Monday through Friday
- [ ] BullMQ scheduler vs `setInterval`: the repeat schedule is stored in Redis, not in process memory — if all workers restart, the schedule survives; on restart, BullMQ reads the schedule and queues the next occurrence
- [ ] Single execution: even with multiple worker instances, BullMQ uses Redis locks to ensure only one worker processes each scheduled occurrence — unlike `setInterval` which runs independently in every process
- [ ] Remove repeating job: `await queue.removeRepeatable('weekly-report', { pattern: '0 9 * * 1' })` or get the job's repeat key and call `queue.removeRepeatableByKey(repeatKey)`
- [ ] Add-once pattern: `queue.add` with a repeat pattern is idempotent if called with the same name and pattern — re-deploying the server does not create duplicate repeating jobs (BullMQ deduplicates by the pattern key)

---

### Q9 — Job progress reporting ⭐⭐

**Scenario:** Your PDF generation job takes up to 60 seconds and has 10 discrete steps (fetch data, render each of 8 sections, combine, upload). Users on the frontend see a spinning loader with no feedback. The product team wants a live progress bar.

**Task:** Implement progress reporting using `job.updateProgress`. Show how the client (via QueueEvents) receives progress events. Show the difference between numeric and object progress.

**Acceptance Criteria:**
- [ ] In worker: `await job.updateProgress(10)` after step 1, `await job.updateProgress(20)` after step 2, and so on up to 100
- [ ] `job.updateProgress(pct)` stores the value in Redis and publishes a pub/sub event — it does not pause or block the worker
- [ ] QueueEvents listener: `const queueEvents = new QueueEvents('pdf-generation'); queueEvents.on('progress', ({ jobId, data }) => { console.log(`Job ${jobId}: ${data}%`); })`
- [ ] Frontend polling: expose `GET /api/jobs/:jobId/progress` → `const job = await queue.getJob(jobId); return res.json({ progress: job.progress })`; frontend polls every 2s and updates the progress bar
- [ ] Object progress: `await job.updateProgress({ step: 3, message: 'Rendering section 2', pct: 30 })` — richer progress data; useful when the UI shows step names alongside the percentage
- [ ] Numeric vs object: both are valid; `data` in the `'progress'` event will be whatever you passed to `updateProgress`; the client must handle both forms if you mix them

---

### Q10 — Concurrency configuration ⭐⭐

**Scenario:** Your worker processes welcome emails at 2 per second (concurrency 1, each job takes 500ms). During peak sign-up hours, the queue depth reaches 10,000 jobs — a 1.4-hour backlog. You need to scale up processing throughput.

**Task:** Explain what `concurrency` means in BullMQ Worker config. Show how multiple worker processes multiply throughput. Describe the risk of setting concurrency too high when calling a rate-limited API.

**Acceptance Criteria:**
- [ ] `new Worker('emails', handler, { concurrency: 10 })` — this worker pulls up to 10 jobs simultaneously and runs them in parallel (via `Promise.all` internally); Node.js handles the parallelism via the event loop (IO-bound work)
- [ ] Throughput calculation: 10 concurrent jobs × 2 jobs/second per slot = 20 jobs/second; queue of 10,000 clears in 500 seconds (~8 minutes) instead of 1.4 hours
- [ ] Multiple processes: run 5 worker processes each with `concurrency: 5` = 25 concurrent jobs total; each process independently pulls from Redis — BullMQ's locking mechanism ensures no job is processed twice
- [ ] Rate limit risk: SendGrid allows 100 emails/second per account; if you run 50 concurrent workers each completing in <100ms, you exceed 100/second and receive 429 errors which trigger retries and make the backlog worse
- [ ] Fix for rate limit: use BullMQ's built-in rate limiting: `new Worker('emails', handler, { limiter: { max: 80, duration: 1000 } })` — processes at most 80 jobs per 1,000ms across all workers
- [ ] Rule of thumb: set concurrency based on the downstream service's rate limit, not on available CPU — for IO-bound jobs (API calls), high concurrency (20–50) is fine; for CPU-bound (PDF generation), concurrency = number of CPU cores

---

### Q11 — Dead letter queue ⭐⭐

**Scenario:** Over the past week, 3,000 jobs exhausted all retries and moved to BullMQ's failed state. Some were legitimate transient errors (now resolved), some were bad input data (will never succeed), and a few were critical billing jobs that must be manually reviewed. All are mixed together in the failed set.

**Task:** Implement a Dead Letter Queue pattern. Listen to the `'failed'` event on QueueEvents and route critical jobs to a `dlq` queue for manual inspection. Explain why a DLQ matters.

**Acceptance Criteria:**
- [ ] QueueEvents listener: `queueEvents.on('failed', async ({ jobId, failedReason }) => { const job = await queue.getJob(jobId); if (!job) return; await dlqQueue.add('failed-job', { originalQueue: 'emails', jobData: job.data, error: failedReason, failedAt: Date.now() }); })`
- [ ] `dlq` is a separate BullMQ queue specifically for failed jobs; it has no automatic workers — items sit there until a human reviews them
- [ ] Why DLQ matters: the `failed` set in Redis is not a queue — it is not easy to inspect, replay, or route selectively; a dedicated `dlq` Queue supports monitoring dashboards, alerting thresholds, and manual retry tooling
- [ ] Alerting: `if (await dlqQueue.getWaitingCount() > 10) sendSlackAlert('DLQ depth > 10 — review required')` — engineering team is notified of accumulating failures
- [ ] Audit trail: DLQ jobs record when the failure occurred, the error message, and the original job data — essential for debugging and for compliance (e.g., billing failures must be logged)
- [ ] Manual retry: engineer reviews the DLQ job, fixes the root cause, then calls `await originalQueue.add(job.name, job.data)` to re-enqueue — controlled and deliberate, not automatic

---

### Q12 — Queue prioritization ⭐⭐⭐

**Scenario:** Your queue processes two types of jobs: transactional emails (welcome, password reset — time-sensitive, user is waiting) and marketing emails (weekly newsletter — can be delayed by hours). During newsletter send campaigns, 500k marketing jobs flood the queue and delay transactional emails by 45 minutes.

**Task:** Implement BullMQ priority queue for transactional vs marketing jobs. Then show the alternative approach of using two separate queues. Compare the trade-offs.

**Acceptance Criteria:**
- [ ] Priority queue: `await queue.add('transactional', data, { priority: 1 })` and `await queue.add('marketing', data, { priority: 10 })` — lower number = higher priority; BullMQ processes priority-1 jobs first when multiple are waiting
- [ ] Priority queue limitation: BullMQ priority is enforced per-dequeue, not globally — under very high load, a constant stream of priority-1 jobs can starve priority-10 jobs indefinitely; this is priority inversion and "starvation"
- [ ] Separate queues approach: create `transactionalQueue` and `marketingQueue`; run dedicated workers for each: `new Worker('transactional', handler, { concurrency: 20 })` and `new Worker('marketing', handler, { concurrency: 5 })`
- [ ] Separate queues advantage: resource isolation — transactional worker capacity is guaranteed regardless of marketing queue depth; transactional jobs are never delayed by marketing backlog
- [ ] Separate queues advantage: independent scaling — scale marketing workers up only during campaign sends; the transactional worker count remains stable
- [ ] When priority queue is appropriate: similar job types with occasional priority differences (e.g., premium vs free tier); when the volume ratio between high and low priority is manageable (<10:1)
- [ ] When separate queues are required: vastly different volumes (500k marketing vs 5k transactional), different SLAs, different resource requirements (CPU, memory), or different retry policies

---

### Q13 — Job result passing ⭐⭐⭐

**Scenario:** Your sign-up flow has 3 sequential steps: (1) create Stripe customer → get `stripeCustomerId`, (2) create database user with `stripeCustomerId`, (3) send welcome email with the new user's ID. Each step depends on the result of the previous one.

**Task:** Show how to pass job results between sequential jobs. Compare 3 approaches: return value from worker, store in Redis directly, and BullMQ Flows (parent/child). State when to use Flows.

**Acceptance Criteria:**
- [ ] Return value approach: `return { stripeCustomerId: 'cus_abc123' }` from the Stripe worker; in the next worker, check `const prevJob = await queue.getJob(prevJobId); const { stripeCustomerId } = prevJob.returnvalue`
- [ ] Return value limitation: requires knowing the previous job's ID and polling/waiting for it to complete before enqueuing the next job — creates tight coupling between job producer logic
- [ ] Redis store approach: after Stripe job completes, `await redis.set(`signup:${userId}:stripeId`, stripeCustomerId, 'EX', 3600)`; subsequent jobs read from Redis — decoupled, but requires manual key management and TTL hygiene
- [ ] BullMQ Flows: parent job waits for all child jobs to complete before running; `new FlowProducer().add({ name: 'send-welcome', data: { userId }, children: [{ name: 'create-stripe', data: {} }, { name: 'create-user', data: {} }] })`
- [ ] Flows limitation: all children run in parallel — for sequential dependencies (step 3 needs step 2's result) use chained flows or pass data via Redis between children
- [ ] When to use Flows: fan-out workflows where a parent job spawns many parallel child jobs and waits for all to complete (e.g., send email to 1,000 recipients, parent marks campaign as sent when all are done); not for simple sequential pipelines where a linear queue with Redis state is simpler

---

### Q14 — Worker shutdown ⭐⭐⭐

**Scenario:** Your Kubernetes cluster sends SIGTERM to the worker pod before terminating it. The worker is 20 seconds into processing a payment job (external API call, database write). If the process exits immediately, the payment is partially processed — money is debited but the database record is not created.

**Task:** Implement graceful shutdown that waits for the current job to finish. Show `worker.close()` with `force: false`. Explain what happens to a job if the process kills without graceful close.

**Acceptance Criteria:**
- [ ] SIGTERM handler: `process.on('SIGTERM', async () => { console.log('SIGTERM received — draining worker'); await worker.close(); process.exit(0); })`
- [ ] `worker.close()` with `force: false` (default): stops accepting new jobs from the queue, waits for all currently-active jobs to complete their processor functions, then resolves; the process exits cleanly after all in-flight work is done
- [ ] `worker.close(true)` (force): immediately terminates the worker without waiting — in-flight jobs are abandoned; use only in emergency situations where waiting is not possible
- [ ] Kubernetes configuration: set `terminationGracePeriodSeconds: 60` in the pod spec — gives the worker up to 60 seconds to finish its current job before Kubernetes sends SIGKILL; must be longer than the longest expected job duration
- [ ] Without graceful close (SIGKILL): the job remains in "active" state in Redis with an acquired lock; after the lock duration expires (default 30s), BullMQ's stall-detection moves the job back to "waiting" — it will be retried by another worker; this is safe only if the processor is idempotent
- [ ] Idempotency requirement: because jobs CAN be re-processed after a crash, every job processor must be idempotent (safe to run twice with the same data); for payments, check if the Stripe charge already exists before creating a new one

---

### Q15 — Queue monitoring and alerting ⭐⭐⭐

**Scenario:** Your email queue silently backed up to 50,000 jobs over a weekend. The workers had crashed due to an OOM error on Friday evening. Nobody noticed until Monday morning when the backlog was discovered. Users had not received their welcome emails for 60 hours.

**Task:** Implement queue depth monitoring with alerting. Explain why queue depth is the primary metric (not completion rate). Describe what a depth spike means and an automated response.

**Acceptance Criteria:**
- [ ] Queue depth check: `const depth = await queue.getWaitingCount() + await queue.getDelayedCount()` — total unprocessed jobs
- [ ] Alert threshold: `if (depth > 1000) await sendAlert({ channel: '#ops', message: `Email queue depth: ${depth} — investigate workers` })`
- [ ] Scheduled monitoring: run this check every 60 seconds via a separate cron job or `setInterval` in a dedicated monitoring process (not inside the worker itself)
- [ ] Why depth is the primary metric: completion rate can look healthy (jobs are completing) while depth spikes silently (new jobs arrive faster than they are processed); a rising depth is the earliest signal of a problem before SLA violations occur
- [ ] Depth spike causes: worker process crashed (check process health), external service is slow causing jobs to take longer (check active count vs expected), traffic spike outpacing worker capacity (check arrival rate), workers are failing and jobs are being retried (check failed count)
- [ ] Automated response — worker crash: use a process manager (pm2, Kubernetes deployment) to auto-restart crashed workers; Kubernetes `restartPolicy: Always` handles this automatically
- [ ] Automated response — traffic spike: if depth > 5,000, trigger autoscaling (scale worker pods from 3 to 10); use Kubernetes HPA with a custom metric from a metrics exporter (Bull Board exposes Prometheus metrics)

---

## Scoring Rubric

| Score | Interpretation |
|-------|----------------|
| 0–4   | Re-study — revisit BullMQ docs, job lifecycle states, and the queue/worker separation pattern |
| 5–9   | Progressing — fundamentals understood; implement a complete queue with retry, dedup, and cleanup to solidify knowledge |
| 10–12 | Solid — ready to build production job queues; review prioritization strategies and graceful shutdown for edge cases |
| 13–15 | Ready to advance — strong grasp of job queue architecture including scaling, DLQ, and monitoring; move to Day 49 |
