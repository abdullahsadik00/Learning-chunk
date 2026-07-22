// ═══════════════════════════════════════════════════════════
// CHALLENGE C12: SSE · REALTIME  (Day 47)
// Run: npm run challenge:12  |  Time target: 25–35 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Implement the wire format and decisions behind realtime
//          transports — a Server-Sent Events frame serializer, a
//          transport selector (SSE vs WebSocket vs long-poll), and
//          reconnect backoff with a cap.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • Run `npm run challenge:12` to check your work (all PASS = done).

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// PART 1 — SSE frame serializer
// ══════════════════════════════════════════════════════════
// Serialize one SSE message. Field order: id, event, data, then a
// blank line to terminate the frame. Only include id/event lines when
// provided. `data` is JSON-stringified. Every frame ends with "\n\n".
//   Example (id:7, event:"tick", data:{n:1}):
//     "id: 7\nevent: tick\ndata: {\"n\":1}\n\n"

export interface SseMessage { data: unknown; event?: string; id?: number; }

export function serializeSse(msg: SseMessage): string {
  // TODO: build lines in order [id?, event?, data], each "field: value\n",
  //       then a trailing "\n". data value = JSON.stringify(msg.data).
  void msg;
  return ""; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 2 — Transport selector
// ══════════════════════════════════════════════════════════
// Choose the realtime transport from the requirements:
//   • bidirectional true                    → "websocket"
//   • else server→client only & modern env  → "sse"
//   • else (legacy env, no SSE support)     → "long-poll"

export interface RealtimeNeeds { bidirectional: boolean; supportsSse: boolean; }

export function selectTransport(n: RealtimeNeeds): "websocket" | "sse" | "long-poll" {
  // TODO: implement the decision above
  void n;
  return "long-poll"; // placeholder — replace
}

// ══════════════════════════════════════════════════════════
// PART 3 — Reconnect backoff (capped exponential)
// ══════════════════════════════════════════════════════════
// delay(attempt) = min(baseMs * 2^attempt, maxMs). attempt is 0-based.

export function reconnectDelay(attempt: number, baseMs: number, maxMs: number): number {
  // TODO: return the capped exponential delay
  void attempt; void baseMs; void maxMs;
  return 0; // placeholder — replace
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C12 SSE · realtime assertions ──");

assert(serializeSse({ data: { n: 1 } }) === 'data: {"n":1}\n\n',
  "sse: data-only frame");
assert(serializeSse({ id: 7, event: "tick", data: { n: 1 } }) === 'id: 7\nevent: tick\ndata: {"n":1}\n\n',
  "sse: id + event + data in order, terminated by blank line");
assert(serializeSse({ event: "ping", data: "hi" }) === 'event: ping\ndata: "hi"\n\n',
  "sse: omits id line when id is absent");

assert(selectTransport({ bidirectional: true, supportsSse: true }) === "websocket",
  "transport: bidirectional needs → websocket");
assert(selectTransport({ bidirectional: false, supportsSse: true }) === "sse",
  "transport: one-way + SSE support → sse");
assert(selectTransport({ bidirectional: false, supportsSse: false }) === "long-poll",
  "transport: legacy fallback → long-poll");

assert(reconnectDelay(0, 1000, 30000) === 1000,  "backoff: attempt 0 = base");
assert(reconnectDelay(3, 1000, 30000) === 8000,  "backoff: attempt 3 = base*2^3");
assert(reconnectDelay(10, 1000, 30000) === 30000, "backoff: capped at maxMs");

export {};
