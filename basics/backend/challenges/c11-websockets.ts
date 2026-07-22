// ═══════════════════════════════════════════════════════════
// CHALLENGE C11: WEBSOCKETS  (Day 46)
// Run: npm run challenge:11  |  Time target: 25–35 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Build the server-side bookkeeping behind a realtime chat —
//          a room registry (join/leave), presence tracking, and a
//          broadcast that fans a message out to a room except the
//          sender. No sockets; connections are plain string ids.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • Run `npm run challenge:11` to check your work (all PASS = done).

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// A room hub: connections (by id) join/leave named rooms.
// ══════════════════════════════════════════════════════════

export class RoomHub {
  // room name → set of connection ids
  private rooms = new Map<string, Set<string>>();

  join(room: string, connId: string): void {
    // TODO: create the room set if missing, then add connId
    void room; void connId;
  }

  leave(room: string, connId: string): void {
    // TODO: remove connId from the room; if the room becomes empty, delete it
    void room; void connId;
  }

  // All connection ids currently in the room (any order).
  members(room: string): string[] {
    // TODO: return the members as an array (empty if the room is gone)
    void room;
    return []; // placeholder — replace
  }

  // Number of DISTINCT connections currently in ANY room.
  presenceCount(): number {
    // TODO: count unique connection ids across all rooms
    return 0; // placeholder — replace
  }

  // Return the recipients of a broadcast: everyone in `room` EXCEPT
  // the sender. Order does not matter.
  broadcast(room: string, senderId: string): string[] {
    // TODO: members(room) minus senderId
    void room; void senderId;
    return []; // placeholder — replace
  }
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C11 WebSockets assertions ──");

const hub = new RoomHub();
hub.join("general", "c1");
hub.join("general", "c2");
hub.join("general", "c3");
hub.join("random", "c1");

assert(hub.members("general").sort().join(",") === "c1,c2,c3", "join: room lists all members");
assert(hub.presenceCount() === 3, "presence: 3 distinct connections across rooms");

const recipients = hub.broadcast("general", "c2").sort();
assert(recipients.join(",") === "c1,c3", "broadcast: everyone in the room except the sender");

hub.leave("general", "c3");
assert(hub.members("general").sort().join(",") === "c1,c2", "leave: member is removed from the room");

hub.leave("random", "c1");
assert(hub.members("random").length === 0, "leave: emptied room reports no members");
assert(hub.presenceCount() === 2, "presence: recount after leaves");

export {};
