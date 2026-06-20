# Day 44 Assessment — Redis · Caching · Pub/Sub · Rate Limiting · Distributed Locks

**Theme:** You are adding Redis to a Node.js API that is struggling under load. Writes are hitting PostgreSQL too hard, some operations need to be coordinated across 3 server instances, and you need real-time features.

---

### Q1 — Redis data structures ⭐

**Scenario:** A new team member asks why Redis has multiple data structures instead of just storing everything as a string.

**Task:** Describe String, Hash, List, Set, and Sorted Set in one sentence each — what it stores and one primary use case.

**Acceptance Criteria:**
- [ ] String: stores a single value (text, number, serialized JSON); use case: cache a single API response or increment a counter
- [ ] Hash: stores a map of field-value pairs under one key; use case: store a user session or object with multiple fields without serializing the whole thing
- [ ] List: ordered collection of strings, push/pop from head or tail; use case: message queue, recent activity feed
- [ ] Set: unordered collection of unique strings; use case: track unique visitors, compute set intersections (mutual friends)
- [ ] Sorted Set: set where every member has a numeric score used for ordering; use case: leaderboard, rate limiting with timestamps
- [ ] Notes that each structure has O-complexity guarantees (e.g., `ZADD` is O(log N), `SADD` is O(1))

---

### Q2 — TTL and expiry ⭐

**Scenario:** A cache key is set without a TTL. Six months later it is still in Redis consuming memory. A developer wonders how to check remaining TTL and what happens when a key expires.

**Task:** Explain the difference between `SET key value EX 60` and `EXPIRE key 60`. Show how to check the remaining TTL. Explain what happens when a key expires.

**Acceptance Criteria:**
- [ ] `SET key value EX 60`: sets the value AND the TTL atomically in a single command
- [ ] `EXPIRE key 60`: sets a TTL on an already-existing key; does nothing if the key does not exist
- [ ] Shows `TTL key`: returns remaining seconds; returns -1 if no TTL (persistent); returns -2 if key does not exist
- [ ] Explains expiry: when TTL reaches 0 the key is deleted lazily (on next access) and actively (Redis background sweep)
- [ ] After expiry, `GET key` returns `nil` (null) — the key is gone
- [ ] Notes `PERSIST key` removes the TTL from a key, making it persistent again

---

### Q3 — Cache-aside pattern ⭐

**Scenario:** You are adding a Redis cache in front of a PostgreSQL `users` table. A teammate is unsure whether to update the cache or invalidate it when a user updates their profile.

**Task:** Describe the cache-aside (lazy loading) pattern for reads and writes. Explain why "invalidate on write" is safer than "update cache on write."

**Acceptance Criteria:**
- [ ] Read flow: (1) check Redis for key → (2) on cache miss, query PostgreSQL → (3) write result to Redis with TTL → (4) return data
- [ ] Write flow (invalidate): update PostgreSQL → delete the cache key → next read will repopulate from DB
- [ ] Write flow (update): update PostgreSQL → write new value to cache
- [ ] Explains the race condition in "update cache": if two writes happen concurrently, the order of DB writes may differ from the order of cache writes, leaving the cache with a stale value
- [ ] States that "invalidate" is safer: the next read always gets fresh data from the DB
- [ ] Notes the downside of invalidation: the first request after invalidation always hits the DB (cache miss); mitigated by write-through caching for critical paths

---

### Q4 — Redis vs in-memory cache ⭐

**Scenario:** A developer caches rate-limit counters in a `Map` in Node.js memory. The API is deployed on 3 server instances. Users can hit the rate limit on one server and bypass it on another.

**Task:** Explain why in-process memory caching fails in a multi-instance deployment. Explain why Redis solves this. Give two other scenarios where shared state across instances is required.

**Acceptance Criteria:**
- [ ] States that each Node.js instance has its own isolated heap — a `Map` in instance A is not visible to instance B
- [ ] States that Redis is an external shared store — all instances read and write to the same data
- [ ] Confirms that rate limiting requires a shared counter: if instance A increments and instance B never sees it, the per-user limit is multiplied by instance count
- [ ] Additional scenario 1: session storage — a user logged in on instance A must stay authenticated when their next request hits instance B
- [ ] Additional scenario 2: distributed locks — only one instance should run a cron job at a time
- [ ] Notes that sticky sessions (load balancer routing the same user to the same instance) are a partial workaround but break on instance restart

---

### Q5 — Cache invalidation strategies ⭐⭐

**Scenario:** You have three types of data: (a) product prices that change once a day, (b) user profile data that changes on save, (c) a shopping cart that changes on every add/remove.

**Task:** Describe TTL-based, event-based, and write-through cache invalidation strategies. Match each strategy to one of the three scenarios above and justify.

**Acceptance Criteria:**
- [ ] TTL-based: set an expiry on cache keys; data may be stale for up to TTL seconds but requires no coordination between write and cache
- [ ] Event-based (invalidate-on-write): when data changes, explicitly delete or update the cache key; ensures freshness but adds coupling between the write path and cache
- [ ] Write-through: write to cache and DB simultaneously on every write; cache is always current but doubles write latency
- [ ] Matches product prices → TTL-based (changes infrequently; 1 hour stale is acceptable)
- [ ] Matches user profile → event-based (changes on user action; must be fresh immediately after save)
- [ ] Matches shopping cart → write-through (changes on every interaction; real-time accuracy required)
- [ ] Notes that write-through is the most expensive; TTL is the simplest; event-based requires careful implementation to avoid missed invalidations

---

### Q6 — Rate limiting with Redis ⭐⭐

**Scenario:** An API endpoint must allow max 100 requests per IP per minute. The current implementation uses a fixed-window counter. Users discover they can send 200 requests by sending 100 at 11:59:59 and 100 at 12:00:01.

**Task:** Implement a fixed-window rate limiter with Redis. Explain the boundary burst problem. Describe how a sliding window fixes it.

**Acceptance Criteria:**
- [ ] Fixed window: `INCR rate:{ip}:{minute_bucket}` → check if value > 100 → `EXPIRE rate:{ip}:{minute_bucket} 60`
- [ ] Explains the boundary burst: at the window boundary a user gets 2× the limit by straddling two windows
- [ ] Sliding window approach: use a Sorted Set where the score is the request timestamp; `ZREMRANGEBYSCORE` removes entries older than 60s; `ZCARD` gives the count in the last 60 seconds
- [ ] Shows the sliding window ZADD: `ZADD rate:{ip} now now` then `ZCOUNT rate:{ip} (now-60) now`
- [ ] Notes that sliding window is more accurate but uses more memory (stores each request timestamp)
- [ ] Explains the trade-off: fixed window is O(1) memory; sliding window is O(requests per window)

---

### Q7 — Pub/Sub use cases ⭐⭐

**Scenario:** The team wants to use Redis Pub/Sub to notify all server instances when a user's profile changes (to invalidate their cache), to show who is online in real time, and to fan out notifications. A teammate suggests replacing Kafka with Redis Pub/Sub for order processing.

**Task:** List three appropriate use cases for Redis Pub/Sub. List three scenarios where Redis Pub/Sub is NOT the right choice.

**Acceptance Criteria:**
- [ ] Appropriate 1: cache invalidation broadcast — publish an event so all instances delete the stale cache key
- [ ] Appropriate 2: presence (who is online) — instances publish heartbeats; all subscribers update an in-memory set
- [ ] Appropriate 3: ephemeral real-time events (notifications, typing indicators) — fire-and-forget, no durability needed
- [ ] NOT appropriate 1: order processing — Redis Pub/Sub has no persistence; if a subscriber is offline it misses the message
- [ ] NOT appropriate 2: consumer groups — Redis Pub/Sub broadcasts to all subscribers; no concept of one consumer processing a message and ACKing it
- [ ] NOT appropriate 3: replay / audit — there is no message history in Pub/Sub; use Redis Streams or Kafka for replay
- [ ] Notes that Redis Streams (`XADD`/`XREAD`) is the correct Redis primitive when persistence and consumer groups are needed

---

### Q8 — Distributed lock with NX ⭐⭐

**Scenario:** A cron job that sends daily digest emails runs on 3 server instances. Without coordination, each instance sends the email — users receive 3 copies.

**Task:** Implement a distributed lock using `SET ... NX EX`. Explain what NX does, why the value must be a UUID, and why EX is required. Show the lock release logic.

**Acceptance Criteria:**
- [ ] Lock acquisition: `SET lock:digest {uuid} EX 60 NX` — returns OK if acquired, nil if already locked
- [ ] NX (Not eXists): only sets the key if it does not already exist — ensures only one instance acquires the lock
- [ ] UUID value: the lock owner stores its UUID; when releasing, it checks the value matches before deleting, preventing a different instance from releasing someone else's lock
- [ ] EX (expiry): if the lock holder crashes before releasing, the lock auto-expires after 60s, preventing a permanent deadlock
- [ ] Lock release using a Lua script: `if redis.call("get", key) == uuid then redis.call("del", key) end` — atomic check-and-delete
- [ ] Notes that without the UUID check, instance B could accidentally delete instance A's lock if B finishes after A's lock expires and A re-acquires

---

### Q9 — Redis pipeline ⭐⭐

**Scenario:** A leaderboard update must execute 100 `ZADD` commands. Each command takes ~0.5ms of network round-trip time. The total update takes 50ms.

**Task:** Explain why 100 individual commands are slow. Explain how pipelining works. Show how to pipeline in ioredis. Explain Lua scripts for atomic operations. State when each is preferred.

**Acceptance Criteria:**
- [ ] Explains that each individual command incurs a full network round-trip: send → wait → receive (100 RTTs = 50ms)
- [ ] Explains pipelining: batch all commands into one TCP write; server processes all and sends all responses back in one response — reduces to ~1 RTT
- [ ] Shows ioredis pipeline: `const pipeline = redis.pipeline(); pipeline.zadd(...); ... ; await pipeline.exec()`
- [ ] Explains Lua scripts: `redis.eval(script, keys, args)` runs a Lua program atomically on the Redis server (single RTT + atomic)
- [ ] Pipelining preferred when: commands are independent and you want throughput
- [ ] Lua scripts preferred when: you need atomicity (read-then-write without race condition, e.g., check-and-increment)
- [ ] Notes that pipelines are NOT atomic — individual commands can fail; Lua is atomic

---

### Q10 — Sorted set leaderboard ⭐⭐

**Scenario:** A gaming platform needs a real-time leaderboard that updates on every game completion and shows a user's rank among 1M players.

**Task:** Show the Redis commands to: add/update a player score, retrieve the top 10 with scores, and get a specific player's rank. Explain why a Sorted Set is better than `ORDER BY` for real-time leaderboards.

**Acceptance Criteria:**
- [ ] Add/update score: `ZADD leaderboard {score} {userId}` — automatically updates if userId already exists
- [ ] Top 10: `ZREVRANGE leaderboard 0 9 WITHSCORES` — returns highest scores first
- [ ] User's rank: `ZREVRANK leaderboard {userId}` — returns 0-indexed rank (0 = first place)
- [ ] Explains that SQL `ORDER BY score DESC` requires scanning the index on every read; Redis Sorted Set maintains the sorted order incrementally on every `ZADD`
- [ ] States `ZADD` is O(log N); `ZREVRANGE` is O(log N + M) where M is the result count — both sub-millisecond for 1M players
- [ ] Notes that `ZINCRBY leaderboard {delta} {userId}` atomically increments a player's score — ideal for "add points" events

---

### Q11 — Cache stampede ⭐⭐

**Scenario:** A popular product page caches for 60 seconds. When the cache expires, 500 concurrent requests all miss the cache simultaneously, all hit PostgreSQL at once, and the database falls over.

**Task:** Define cache stampede. Describe three strategies to prevent it. Pick the best strategy for this scenario and justify.

**Acceptance Criteria:**
- [ ] Defines cache stampede (also called thundering herd): a cache key expires and many concurrent requests all miss and simultaneously hit the backing store
- [ ] Strategy 1 — probabilistic early expiration: before the key expires, occasionally re-compute it early (based on a probability formula using remaining TTL and re-compute time)
- [ ] Strategy 2 — lock-based rebuild: when a cache miss occurs, acquire a distributed Redis lock; only the lock holder rebuilds the cache; other requests wait or return stale data
- [ ] Strategy 3 — background refresh: a background job refreshes the cache before it expires, so it is always warm; requests never miss
- [ ] Recommends background refresh for this scenario: product pages have predictable access patterns; a scheduler can refresh every 50 seconds
- [ ] Notes the trade-off of lock-based rebuild: slightly slower for the first requester but prevents DB overload

---

### Q12 — Redis Cluster vs Redis Sentinel ⭐⭐⭐

**Scenario:** A company has two Redis deployments. One is used for session storage with high availability requirements. The other is used for caching 100GB of data that won't fit on one server.

**Task:** Explain Redis Sentinel and when it is appropriate. Explain Redis Cluster and when it is appropriate. Map each to the company's use cases.

**Acceptance Criteria:**
- [ ] Redis Sentinel: monitors a master + replica topology; automatically promotes a replica to master on failure; provides high availability but all data lives on one shard
- [ ] Redis Cluster: shards data across 6+ nodes (3 masters + 3 replicas); each master holds a subset of the 16,384 hash slots; provides both HA and horizontal scaling
- [ ] Sentinel use case: datasets that fit on one server but need automatic failover (< ~25GB)
- [ ] Cluster use case: datasets too large for one server, or read/write throughput exceeding a single node's capacity
- [ ] Maps session storage → Sentinel (small dataset, needs HA, single-key operations are simple)
- [ ] Maps 100GB cache → Cluster (data sharded across nodes)
- [ ] Notes that Cluster complicates multi-key operations (keys must hash to the same slot for atomic operations)

---

### Q13 — Session storage with Redis ⭐⭐⭐

**Scenario:** The team debates using Redis sessions vs JWTs. JWTs cannot be revoked before expiry — a fired employee's JWT stays valid for 24 hours.

**Task:** Implement session storage with Redis using a Hash. Show how to read and validate a session on each request. Explain three advantages of Redis sessions over JWTs.

**Acceptance Criteria:**
- [ ] Writes: `HSET session:{sessionId} userId {id} role {role} expiresAt {timestamp}`
- [ ] Sets TTL: `EXPIRE session:{sessionId} 86400`
- [ ] On request: `HGETALL session:{sessionId}` → check if key exists (not empty) → check `expiresAt > now` → attach user to request context
- [ ] Advantage 1: instant revocation — delete the Redis key and the session is immediately invalid, even if the token has not expired
- [ ] Advantage 2: smaller cookies — the client stores only a session ID (e.g., 32 bytes) not the entire JWT payload
- [ ] Advantage 3: server controls session lifetime — can extend, reduce, or terminate sessions without waiting for token expiry
- [ ] Notes the trade-off: Redis sessions require a Redis lookup on every request; JWTs are stateless (verified locally without a DB call)

---

### Q14 — Redis memory management ⭐⭐⭐

**Scenario:** A Redis instance hits its `maxmemory` limit. Some keys have TTLs (cache entries), others do not (persistent session data). The team needs to configure eviction correctly to protect sessions while allowing cache entries to be evicted.

**Task:** Explain `maxmemory`. Describe `allkeys-lru` and `volatile-lru` eviction policies. Explain what happens with no eviction policy. State which policy to use for this scenario and why.

**Acceptance Criteria:**
- [ ] `maxmemory`: a hard cap on Redis memory usage; set in `redis.conf` or via `CONFIG SET maxmemory 2gb`
- [ ] `allkeys-lru`: when memory is full, evict the least-recently-used key regardless of whether it has a TTL — treats all keys as evictable cache
- [ ] `volatile-lru`: when memory is full, evict the least-recently-used key among keys that HAVE a TTL — keys without TTL are never evicted
- [ ] No eviction policy (`noeviction`): when memory is full, write commands return an error — Redis refuses to accept new data
- [ ] Recommends `volatile-lru` for this scenario: cache entries (with TTL) are evicted as needed; session keys (without TTL) are protected
- [ ] Notes that `volatile-lru` requires setting TTLs on all cache entries; forgetting a TTL means the key is treated as persistent
- [ ] Bonus: `allkeys-lfu` (least-frequently-used) is often more cache-efficient than LRU for workloads with skewed access patterns

---

### Q15 — Atomic operations for inventory ⭐⭐⭐

**Scenario:** An e-commerce flash sale has 100 units of a product. 1,000 concurrent requests try to decrement stock. Without coordination, 200 units get "sold" (overselling).

**Task:** Implement an atomic "reserve stock" operation using Redis WATCH / MULTI / EXEC (optimistic concurrency). Explain how WATCH prevents overselling. Explain what to do when EXEC returns nil.

**Acceptance Criteria:**
- [ ] Shows `WATCH quantity:{productId}` — marks the key for monitoring; if it changes before EXEC, the transaction aborts
- [ ] Shows `MULTI` — starts a transaction block
- [ ] Shows `GET quantity:{productId}` (outside MULTI, before watching) to read the current quantity
- [ ] Shows `DECR quantity:{productId}` inside the MULTI/EXEC block (or `DECRBY 1`)
- [ ] Shows `EXEC` — atomically applies the queued commands; returns nil if the watched key was modified by another client
- [ ] Explains that if EXEC returns nil (concurrent modification detected), the application must retry the entire WATCH/MULTI/EXEC sequence
- [ ] Notes an alternative: a Lua script that checks quantity > 0 before decrementing, which is simpler and equally atomic without the retry loop
