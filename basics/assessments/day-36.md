# Day 36 Assessment — Node.js Internals · Streams · Buffers · EventEmitter · Child Processes

**Theme:** You are a backend engineer at a data pipeline company. Your team processes large files, runs CPU-intensive transformations, and emits events between services.

**Scoring:** 0–4 re-study · 5–9 progressing · 10–12 solid · 13–15 ready to advance

---

### Q1 — Stream Types ⭐

**Scenario:** Your onboarding doc says "HTTP requests are streams," but a junior developer asks why you sometimes call `.pipe()` on `req` and sometimes on `res`.

**Task:** Explain the four stream types (Readable, Writable, Transform, Duplex). Identify which type `req` and `res` are in an Express handler. Give one real-world example of each type.

**Acceptance Criteria:**
- [ ] Readable: produces data, can be consumed with `.on('data')` or `.pipe()` — example: `fs.createReadStream()`
- [ ] Writable: accepts data written to it — example: `fs.createWriteStream()`
- [ ] Transform: both Readable and Writable, transforms data passing through — example: `zlib.createGzip()`
- [ ] Duplex: both Readable and Writable but the two sides are independent — example: a TCP socket
- [ ] `req` is a Readable stream (incoming request body flows in)
- [ ] `res` is a Writable stream (you write the response body out)
- [ ] States that pipe direction is always Readable → Writable

---

### Q2 — Buffer Allocation ⭐

**Scenario:** A security scan flags `Buffer.allocUnsafe(1024)` in a legacy file-parsing module with the comment "potential memory leak."

**Task:** Explain the difference between `Buffer.alloc(n)` and `Buffer.allocUnsafe(n)`. Demonstrate why `allocUnsafe` can expose old memory contents. Show a base64 encode → decode round-trip for the string `"pipeline-secret"`.

**Acceptance Criteria:**
- [ ] `Buffer.alloc(n)` zeroes out memory before returning — safe but slightly slower
- [ ] `Buffer.allocUnsafe(n)` skips zeroing — faster but the buffer may contain arbitrary data from the process heap
- [ ] Demonstrates that reading an `allocUnsafe` buffer before filling it can expose previous memory contents (sensitive data risk)
- [ ] Encodes with `Buffer.from('pipeline-secret').toString('base64')` → `'cGlwZWxpbmUtc2VjcmV0'`
- [ ] Decodes with `Buffer.from('cGlwZWxpbmUtc2VjcmV0', 'base64').toString('utf8')` → `'pipeline-secret'`
- [ ] States the rule: always prefer `Buffer.alloc()` unless benchmarks prove the overhead is unacceptable and the buffer is immediately filled

---

### Q3 — EventEmitter Basics ⭐

**Scenario:** A microservice crashes overnight with `Error: Unhandled 'error' event`. The on-call engineer doesn't know why this is different from other unhandled errors.

**Task:** Show how to use `emit`, `on`, `once`, and `off` on a Node.js `EventEmitter`. Explain why the `'error'` event is special and what happens if it fires with no listener attached.

**Acceptance Criteria:**
- [ ] `emitter.on('event', handler)` registers a persistent listener that fires every time
- [ ] `emitter.once('event', handler)` registers a listener that fires only once then auto-removes
- [ ] `emitter.off('event', handler)` (or `removeListener`) removes a specific listener — handler reference must match
- [ ] `emitter.emit('event', payload)` fires all registered listeners synchronously
- [ ] States that `'error'` is the only event that, when emitted with no listener, causes the process to throw and crash (not just silently emit nothing)
- [ ] Shows the fix: always attach `emitter.on('error', handler)` before triggering anything that might emit errors
- [ ] Demonstrates a minimal working example with all four methods

---

### Q4 — Child Process Variants ⭐

**Scenario:** Your pipeline runs a Python ML model, a shell `wc -l` command, and a Node.js worker. A teammate asks why you use three different child process methods.

**Task:** Compare `exec`, `spawn`, and `fork`. State when to use each. Call out the output buffer limit for `exec` and what happens when it is exceeded.

**Acceptance Criteria:**
- [ ] `exec`: runs a shell command, buffers all stdout/stderr in memory, returns via callback — use for short commands with small output
- [ ] `spawn`: streams stdout/stderr, no shell by default, no output buffer limit — use for long-running or large-output processes
- [ ] `fork`: like spawn but specifically for Node.js files; creates an IPC channel between parent and child — use for Node.js workers
- [ ] `exec` default output buffer is 1 MB (1024 * 1024 bytes); exceeding it throws `Error: maxBuffer exceeded` and kills the child
- [ ] States that `spawn` is the correct choice for running the Python model (no buffer limit, streaming output)
- [ ] States that `fork` is the correct choice for the Node.js worker (IPC channel for structured message passing)
- [ ] Notes that `exec` spawns a shell (`/bin/sh -c`), which creates an injection risk if user input is interpolated into the command string

---

### Q5 — Backpressure ⭐⭐

**Scenario:** A log-shipping script reads a 50 GB access log file and writes it to a slow network socket. After 10 minutes it crashes with `ENOMEM` (out of memory).

**Task:** Explain what backpressure is and trace exactly how this OOM crash happens. Show the `.pipe()` fix and then show the manual fix using the `writable.write()` return value and the `'drain'` event.

**Acceptance Criteria:**
- [ ] Backpressure: the writable side cannot accept data as fast as the readable side produces it
- [ ] Without backpressure handling, Node.js buffers all pending chunks in memory until the writable catches up — this causes OOM on large files
- [ ] `.pipe()` handles backpressure automatically: it pauses the readable when `writable.write()` returns `false` and resumes on `'drain'`
- [ ] Manual fix: check the return value of `writable.write(chunk)` — if `false`, call `readable.pause()`
- [ ] Manual fix continued: listen for `writable.on('drain', () => readable.resume())` to resume when the buffer clears
- [ ] Code snippet for the manual approach is included and syntactically correct
- [ ] States that `stream.pipeline()` (not `.pipe()`) is the production-grade approach for multi-step pipelines (handles error cleanup)

---

### Q6 — CSV to JSON Transform Stream ⭐⭐

**Scenario:** The pipeline receives daily 2 GB CSV exports. Parsing the entire file into memory with `JSON.parse` and `csv-parse` crashes the server. You need a streaming solution.

**Task:** Implement a Transform stream class `CsvToJsonTransform` that reads CSV text chunks, treats the first row as headers, and emits one JSON object (as a Buffer) per subsequent row.

**Acceptance Criteria:**
- [ ] Extends `Transform` from the `stream` module with `{ objectMode: false }` or appropriate mode declared
- [ ] Buffers incomplete lines across chunks (accounts for a chunk ending mid-line)
- [ ] Parses the first complete line as the header row and stores the field names
- [ ] For each subsequent complete line, splits by comma and zips with header names into a plain object
- [ ] Pushes `JSON.stringify(obj) + '\n'` (as a Buffer or string) for each row
- [ ] Implements `_flush(callback)` to process any remaining buffered data when the source ends
- [ ] Can be piped: `fs.createReadStream('data.csv').pipe(new CsvToJsonTransform()).pipe(outputStream)`

---

### Q7 — Binary Protocol with Buffers ⭐⭐

**Scenario:** Two services communicate over a TCP socket using a custom binary protocol: a 4-byte big-endian UInt32 length header followed by a UTF-8 JSON payload.

**Task:** Implement `encode(obj: object): Buffer` and `decode(buf: Buffer): object`. Show that encoding then decoding a sample object returns the original value.

**Acceptance Criteria:**
- [ ] `encode` serializes the object with `JSON.stringify`, converts to a UTF-8 Buffer, writes the byte length as a 4-byte big-endian UInt32 into the first 4 bytes using `buf.writeUInt32BE`
- [ ] `encode` returns a single concatenated Buffer of length `4 + payloadBytes`
- [ ] `decode` reads the first 4 bytes with `buf.readUInt32BE(0)` to get the payload length
- [ ] `decode` slices `buf.slice(4, 4 + length)` and parses with `JSON.parse(slice.toString('utf8'))`
- [ ] Round-trip test: `decode(encode({ type: 'ingest', rows: 42 }))` returns `{ type: 'ingest', rows: 42 }`
- [ ] Notes the limitation: this assumes the entire frame is in one buffer; a production implementation needs a framing accumulator for partial TCP reads
- [ ] Uses `Buffer.concat([headerBuf, payloadBuf])` rather than unsafe manual byte copying

---

### Q8 — EventEmitter Memory Leak ⭐⭐

**Scenario:** The server logs `MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 'data' listeners added to [EventEmitter].` after running for 6 hours.

**Task:** Explain what this warning means, give three real coding patterns that cause it, and provide three fixes.

**Acceptance Criteria:**
- [ ] The warning fires when more than 10 listeners (default limit) are registered for the same event on one emitter — Node.js suspects a listener is being added in a loop without cleanup
- [ ] Cause 1: registering a listener inside a function that is called repeatedly without calling `off()` to remove the previous one
- [ ] Cause 2: attaching listeners in a constructor that is instantiated many times, all pointing to the same shared emitter
- [ ] Cause 3: forgetting to use `once()` for a one-time event and instead using `on()`, letting them accumulate
- [ ] Fix 1: use `emitter.once()` for one-shot subscriptions
- [ ] Fix 2: store the listener reference and call `emitter.off(event, ref)` when the component is destroyed/unsubscribed
- [ ] Fix 3: call `emitter.setMaxListeners(n)` if the high listener count is genuinely expected (and explain why the default exists as a safety net, not a hard cap)

---

### Q9 — Child Process for CPU-Bound Work ⭐⭐

**Scenario:** The API has a `POST /analyze` route that runs `JSON.parse` on a 5 MB payload followed by heavy computation. Under load testing, all endpoints slow to a crawl when `/analyze` is hit.

**Task:** Explain why CPU-bound work blocks all users in Node.js. Show how `child_process.fork` offloads the work, and sketch the message-passing pattern between parent and child.

**Acceptance Criteria:**
- [ ] Node.js runs JavaScript on a single thread; while the CPU is occupied parsing/computing, the event loop cannot process other incoming requests
- [ ] `child_process.fork('worker.js')` spawns a separate Node.js process with its own V8 instance and event loop — the heavy work runs there, not on the main thread
- [ ] Parent sends work via `child.send({ type: 'analyze', payload })` and listens with `child.on('message', result => ...)`
- [ ] Worker receives via `process.on('message', msg => ...)`, computes, and replies with `process.send(result)`
- [ ] Parent's event loop remains free to handle other requests while the child computes
- [ ] Shows how to handle errors from the child (listen to `child.on('error', ...)` and `child.on('exit', code => ...)`)
- [ ] Notes that spawning a process per request is expensive — use a process pool for high-throughput scenarios

---

### Q10 — stream.pipeline vs .pipe ⭐⭐

**Scenario:** A file-processing script using `.pipe()` silently corrupts output files when the source stream errors mid-transfer. The destination file is left half-written with no error logged.

**Task:** Explain the error-handling gap in `.pipe()`. Show how `stream.pipeline()` (Node 10+) fixes it. Show the `util.promisify(pipeline)` async/await pattern.

**Acceptance Criteria:**
- [ ] `.pipe()` does not forward errors: if the readable emits `'error'`, the writable is NOT automatically destroyed — it stays open and may be left in a corrupt half-written state
- [ ] `.pipe()` returns the destination stream, so chaining `a.pipe(b).pipe(c)` — an error on `a` does not propagate to `b` or `c`
- [ ] `stream.pipeline(src, ...transforms, dest, callback)` automatically destroys all streams in the chain when any one of them errors
- [ ] The callback receives the error (or `null` on success), so errors are never silently swallowed
- [ ] `util.promisify(pipeline)(src, dest)` allows `await pipeline(src, dest)` with try/catch
- [ ] States the rule: always use `pipeline()` in production code; `.pipe()` is fine for quick scripts where error handling is not critical
- [ ] Code example demonstrates a three-stage pipeline: `readStream → gzip → writeStream` using `pipeline()`

---

### Q11 — Node.js Event Loop Phases ⭐⭐

**Scenario:** A performance review flags "inconsistent timer resolution" in the pipeline's scheduler. The code mixes `setImmediate`, `setTimeout(fn, 0)`, and `process.nextTick` in ways the author didn't fully understand.

**Task:** List the six event loop phases in order. State which phase `setImmediate` fires in vs `setTimeout(fn, 0)`. Explain where `process.nextTick` fits (it is not a phase).

**Acceptance Criteria:**
- [ ] Phase 1 — Timers: executes `setTimeout` and `setInterval` callbacks whose delay has elapsed
- [ ] Phase 2 — Pending callbacks: executes I/O callbacks deferred from the previous loop iteration
- [ ] Phase 3 — Idle/Prepare: internal use only
- [ ] Phase 4 — Poll: retrieves new I/O events; blocks here if nothing else is pending
- [ ] Phase 5 — Check: executes `setImmediate` callbacks — this is the phase after Poll
- [ ] Phase 6 — Close callbacks: cleanup callbacks (e.g., `socket.on('close', ...)`)
- [ ] `process.nextTick` runs before the event loop moves to the next phase (microtask queue, highest priority after the current operation completes)
- [ ] In an I/O callback, `setImmediate` fires before `setTimeout(fn, 0)` because Check phase comes before the next Timers phase

---

### Q12 — Large File Row Counter ⭐⭐⭐

**Scenario:** A 10 GB CSV file needs to be row-counted nightly. The previous implementation loaded the file into a string and called `.split('\n').length` — it consumed 40 GB of RAM and was killed by the OOM killer.

**Task:** Implement a Node.js script using streams that counts rows in constant memory (memory usage must not grow with file size). Explain why memory usage stays flat.

**Acceptance Criteria:**
- [ ] Uses `fs.createReadStream(filePath)` — never reads the whole file at once
- [ ] Pipes through a line-counting mechanism (e.g., splits chunks on `\n`, accounts for partial lines at chunk boundaries)
- [ ] Maintains a single integer counter — no array accumulation of lines or chunks
- [ ] Memory profile: only one chunk (typically 64 KB) is in memory at any time; previous chunks are garbage-collected
- [ ] Correctly handles the last line of the file whether or not it ends with a newline
- [ ] Prints the final row count after the `'finish'` or `'end'` event
- [ ] Demonstrates with a test: manually counts lines in a small known file and asserts the result matches

---

### Q13 — Worker Threads vs Child Processes ⭐⭐⭐

**Scenario:** The architecture team debates whether the CPU-intensive image-thumbnail generator should use `worker_threads` or `child_process.fork`. Both work, but they have very different performance profiles.

**Task:** Compare Worker Threads and child_process.fork on: memory isolation, startup time, communication overhead, shared memory (`SharedArrayBuffer`), and use-case fit. Give a concrete example of when to use each.

**Acceptance Criteria:**
- [ ] Worker Threads: share the same process memory space, lower startup cost (~1–5 ms vs ~30–100 ms for a child process), lower IPC overhead
- [ ] `SharedArrayBuffer` + `Atomics` allow true shared memory between workers — zero-copy for large typed arrays; child processes cannot share memory
- [ ] `ArrayBuffer` can be transferred (not copied) to a worker via `transferList` — ownership moves, original becomes detached
- [ ] Child processes: fully isolated V8 instances, true process isolation (a crash in the child doesn't take down the parent), communicate over IPC (serialized messages)
- [ ] Example for Worker Threads: image resizing / video transcoding where you pass large pixel buffers via transfer (zero-copy)
- [ ] Example for child_process.fork: running a Node.js task that must be isolated (e.g., untrusted plugin code, or a process that might crash)
- [ ] States the rule: Worker Threads for CPU parallelism with shared data; fork for isolation and crash-safety

---

### Q14 — TypedEventEmitter in TypeScript ⭐⭐⭐

**Scenario:** A teammate calls `emitter.emit('complete', { rows: 100 })` and another listener expects `{ count: number }`. TypeScript does not catch the mismatch because the emitter is typed as `EventEmitter`.

**Task:** Build a `TypedEventEmitter<T extends Record<string, unknown[]>>` class in TypeScript where `emit(event, ...args)` and `on(event, handler)` are fully type-safe: only valid event names are accepted and the payload types are enforced.

**Acceptance Criteria:**
- [ ] Generic parameter `T` maps event names (string keys) to a tuple of argument types (e.g., `{ data: [Buffer]; error: [Error]; end: [] }`)
- [ ] `on<K extends keyof T>(event: K, listener: (...args: T[K]) => void): this` — TypeScript infers correct argument types from the event name
- [ ] `emit<K extends keyof T>(event: K, ...args: T[K]): boolean` — passing wrong payload types is a compile-time error
- [ ] `once<K extends keyof T>(event: K, listener: (...args: T[K]) => void): this` also type-safe
- [ ] Usage example: `emitter.emit('data', Buffer.alloc(10))` compiles; `emitter.emit('data', 'wrong type')` fails at compile time
- [ ] The implementation extends Node.js `EventEmitter` (does not reimplement the actual eventing logic)
- [ ] Demonstrates that unknown event names are rejected: `emitter.emit('nonexistent', ...)` is a TypeScript error

---

### Q15 — Cluster Module ⭐⭐⭐

**Scenario:** The API server uses only one CPU on an 8-core machine. Profiling confirms the event loop is saturated during peak traffic. The team wants to use all 8 cores without switching to a different process manager.

**Task:** Explain how Node.js `cluster` works: how `cluster.fork()` creates workers, how multiple processes share port 80, and what the master process's role is. Contrast it with `child_process.fork()`.

**Acceptance Criteria:**
- [ ] `cluster.fork()` spawns worker processes that are full copies of the current Node.js script, each with their own V8 instance and event loop
- [ ] The OS allows multiple processes to bind to the same port via `SO_REUSEPORT` (or the master uses a round-robin load balancer built into Node's cluster module to distribute connections)
- [ ] Master process role: does not handle HTTP requests itself; instead spawns workers, monitors them, and restarts crashed workers
- [ ] `cluster.isMaster` (or `cluster.isPrimary`) lets the same file branch: master forks N workers; workers start the HTTP server
- [ ] Difference from `child_process.fork()`: cluster workers share the server port automatically; `child_process.fork()` creates a generic child process with an IPC channel but no port-sharing magic
- [ ] Notes the practical alternative: running `N` separate Node.js processes behind a load balancer (nginx / PM2) achieves the same result with more operational visibility
- [ ] States that cluster does not help with single-request CPU saturation — for that, use Worker Threads or offload to a separate service
