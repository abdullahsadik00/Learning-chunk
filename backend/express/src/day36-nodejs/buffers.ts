// ════════════════════════════════════════════════════════════════
// DAY 36 — BUFFERS
// ════════════════════════════════════════════════════════════════
//
// WHAT IS A BUFFER?
// A fixed-size chunk of memory outside the V8 heap.
// Used for: binary data, network protocols, file I/O, cryptography.
//
// Buffer vs String:
//   String:  JavaScript encoding (UTF-16), immutable, heap-allocated
//   Buffer:  raw bytes (subclass of Uint8Array), mutable, off-heap
//
// WHY OFF-HEAP?
// V8's garbage collector doesn't manage Buffer memory — it's allocated
// directly from the OS. This avoids GC pauses when handling large binary data.
//
// ENCODINGS:
//   'utf8'   — default, handles all Unicode (variable 1-4 bytes per char)
//   'base64' — binary data as ASCII-safe text (3 bytes → 4 chars)
//   'hex'    — each byte as two hex digits (1 byte → 2 chars)
//   'binary' / 'latin1' — one byte per char, not Unicode-safe
//   'ascii'  — 7-bit ASCII only, fast but limited
//   'utf16le'— Windows default, 2 bytes per char (UCS-2 compatible)

// ─────────────────────────────────────────────────────────────────
// DEMO 1: Creating Buffers — three ways, with safety implications
// ─────────────────────────────────────────────────────────────────
export function demo1_createBuffers(): void {
  console.log('\n─── DEMO 1: Creating Buffers ───');

  // Buffer.alloc(size) — SAFE: fills memory with zeros
  // Use this when you need a clean buffer (cryptography, headers, etc.)
  const zeroed = Buffer.alloc(8);
  console.log('  Buffer.alloc(8)         :', zeroed); // <Buffer 00 00 00 00 00 00 00 00>

  // Buffer.alloc(size, fill) — fills with a specific byte value
  const filled = Buffer.alloc(8, 0xff);
  console.log('  Buffer.alloc(8, 0xff)   :', filled); // <Buffer ff ff ff ff ff ff ff ff>

  // Buffer.from(string, encoding) — create from existing data
  const fromString = Buffer.from('Hello, Node!', 'utf8');
  console.log('  Buffer.from("Hello..."):', fromString);
  console.log('  Length in bytes        :', fromString.length); // 12 (ASCII = 1 byte/char)

  const fromArray = Buffer.from([0x48, 0x69, 0x21]); // "Hi!"
  console.log('  Buffer.from([0x48...]) :', fromArray.toString()); // "Hi!"

  // Buffer.allocUnsafe(size) — DANGEROUS: does NOT zero the memory!
  // The buffer will contain whatever was in that memory region before.
  // WHY USE IT? It's much faster — no zeroing step.
  // WHEN? Only when you immediately overwrite every byte (e.g., a fixed-format header).
  const unsafe = Buffer.allocUnsafe(16);
  console.log('  Buffer.allocUnsafe(16) :', unsafe); // May contain garbage data!
  console.log('  ⚠ allocUnsafe can expose old heap data — always fill before reading');

  // RULE: Use alloc() unless you have a measured performance reason for allocUnsafe()
  // and you immediately fill all bytes.
}

// ─────────────────────────────────────────────────────────────────
// DEMO 2: Encoding conversions — the full round-trip
// ─────────────────────────────────────────────────────────────────
export function demo2_encodings(): void {
  console.log('\n─── DEMO 2: Encoding Conversions ───');

  const original = 'Node.js Buffers 🚀'; // Note: emoji is 4 bytes in UTF-8

  // String → Buffer (UTF-8)
  const buf = Buffer.from(original, 'utf8');
  console.log(`  Original string      : "${original}"`);
  console.log(`  UTF-8 byte length    : ${buf.length}`);     // More than char count because of emoji
  console.log(`  JS string .length    : ${original.length}`); // Counts UTF-16 code units

  // Buffer → hex string (2 hex chars per byte)
  const hex = buf.toString('hex');
  console.log(`  As hex               : ${hex.slice(0, 40)}... (${hex.length} chars)`);

  // Buffer → base64 (4 chars per 3 bytes — ~33% size increase)
  // Used for: embedding binary data in JSON, HTTP Basic Auth, data URIs
  const base64 = buf.toString('base64');
  console.log(`  As base64            : ${base64}`);

  // Base64 → Buffer → String (full round-trip)
  const decoded = Buffer.from(base64, 'base64').toString('utf8');
  console.log(`  Round-trip from b64  : "${decoded}"`);
  console.log(`  Round-trip match     : ${decoded === original}`);

  // Hex → Buffer → String
  const fromHex = Buffer.from(hex, 'hex').toString('utf8');
  console.log(`  Round-trip from hex  : "${fromHex}"`);

  // PRACTICAL: Base64 URL-safe encoding (used in JWTs, URL tokens)
  // Standard base64 uses +, /, = which are URL-special characters
  // Base64url replaces: + → -, / → _, removes =
  const urlSafe = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  console.log(`  Base64url (JWT-safe) : ${urlSafe}`);
}

// ─────────────────────────────────────────────────────────────────
// DEMO 3: Buffer operations — copy, slice, compare, concat
// ─────────────────────────────────────────────────────────────────
export function demo3_bufferOps(): void {
  console.log('\n─── DEMO 3: Buffer Operations ───');

  const a = Buffer.from('Hello');
  const b = Buffer.from('World');

  // concat — joins multiple buffers into one
  // IMPORTANT: Buffer.concat() is O(n) — it allocates and copies.
  // For many concats, pre-allocate with alloc() and copy into it.
  const combined = Buffer.concat([a, Buffer.from(' '), b]);
  console.log('  concat([a, " ", b])  :', combined.toString());

  // copy(target, targetStart, sourceStart, sourceEnd)
  // Copies bytes from one buffer into another — mutates target
  const target = Buffer.alloc(10, 0x00);
  a.copy(target, 0);   // copy "Hello" starting at target[0]
  b.copy(target, 5);   // copy "World" starting at target[5]
  console.log('  copy a→target[0..4] :', target.toString());

  // slice / subarray — creates a VIEW into the same memory (no copy!)
  // Modifying the slice modifies the original buffer.
  const view = combined.subarray(6, 11); // "World"
  console.log('  subarray(6, 11)     :', view.toString());
  view[0] = 0x77; // lowercase 'w' — mutates combined!
  console.log('  After mutating view :', combined.toString()); // "Hello world"

  // compare — lexicographic comparison (like strcmp)
  //   returns 0 if equal, negative if a < b, positive if a > b
  const x = Buffer.from('apple');
  const y = Buffer.from('banana');
  const z = Buffer.from('apple');
  console.log('  compare(apple, banana):', Buffer.compare(x, y)); // < 0
  console.log('  compare(apple, apple) :', Buffer.compare(x, z)); // 0
  console.log('  equals(apple, apple)  :', x.equals(z));          // true

  // indexOf — works like String.indexOf but on bytes
  const haystack = Buffer.from('find the needle in here');
  const needle   = Buffer.from('needle');
  console.log('  indexOf("needle")   :', haystack.indexOf(needle)); // 9

  // readUInt32BE / writeUInt32BE — structured binary reading
  // BE = Big-Endian (most significant byte first, used in network protocols)
  // LE = Little-Endian (least significant byte first, used by x86 CPUs)
  const numBuf = Buffer.alloc(4);
  numBuf.writeUInt32BE(0xDEADBEEF, 0);
  console.log('  writeUInt32BE(0xDEADBEEF):', numBuf);
  console.log('  readUInt32BE()           :', numBuf.readUInt32BE(0).toString(16));
}

// ─────────────────────────────────────────────────────────────────
// DEMO 4: Binary protocol — 4-byte length header + JSON payload
// ─────────────────────────────────────────────────────────────────
//
// This is how many network protocols work:
//   [ 4 bytes: payload length ][ N bytes: JSON payload ]
//
// WHY LENGTH-PREFIX?
// TCP is a byte stream — it doesn't know about message boundaries.
// You can't just read until newline (binary data may contain \n).
// So you send the length first, then read exactly that many bytes.
//
// Used by: Redis RESP protocol, MySQL protocol, gRPC (HTTP/2 frames),
//          WebSocket frames, protobuf framing, many game protocols.
export function demo4_binaryProtocol(): void {
  console.log('\n─── DEMO 4: Binary Protocol Encoding/Decoding ───');

  // ── ENCODE ──────────────────────────────────────────────────
  function encodeMessage(payload: object): Buffer {
    const json    = JSON.stringify(payload);
    const body    = Buffer.from(json, 'utf8');
    const header  = Buffer.alloc(4);
    // Write the body length as a 32-bit unsigned big-endian integer
    // Max message size with UInt32: 4GB — usually sufficient
    header.writeUInt32BE(body.length, 0);
    return Buffer.concat([header, body]);
  }

  // ── DECODE ──────────────────────────────────────────────────
  function decodeMessage(buf: Buffer): { payload: unknown; bytesConsumed: number } {
    if (buf.length < 4) {
      throw new Error('Buffer too short to contain a header');
    }
    const payloadLength = buf.readUInt32BE(0);    // read 4-byte length
    const totalLength   = 4 + payloadLength;

    if (buf.length < totalLength) {
      throw new Error(`Incomplete message: need ${totalLength} bytes, have ${buf.length}`);
    }

    const body    = buf.subarray(4, totalLength);
    const payload = JSON.parse(body.toString('utf8'));
    return { payload, bytesConsumed: totalLength };
  }

  // Test with a sample message
  const msg1 = { type: 'AUTH', token: 'abc123', ts: Date.now() };
  const msg2 = { type: 'DATA', records: [1, 2, 3, 4, 5] };

  const encoded1 = encodeMessage(msg1);
  const encoded2 = encodeMessage(msg2);

  console.log('  Message 1 encoded:');
  console.log(`    Header (4 bytes)  : ${encoded1.subarray(0, 4)} → length = ${encoded1.readUInt32BE(0)}`);
  console.log(`    Total frame size  : ${encoded1.length} bytes`);

  // Simulate receiving two messages concatenated (common in TCP)
  const received = Buffer.concat([encoded1, encoded2]);
  console.log(`\n  Received buffer total: ${received.length} bytes (two messages concatenated)`);

  // Parse in a loop — framing protocol guarantees correct boundaries
  let offset = 0;
  let msgNum = 0;
  while (offset < received.length) {
    const { payload, bytesConsumed } = decodeMessage(received.subarray(offset));
    msgNum++;
    console.log(`  Parsed message ${msgNum}:`, payload);
    offset += bytesConsumed;
  }
  console.log(`  Total messages parsed: ${msgNum}`);
}

// Export runner
export function runBufferDemos(): void {
  console.log('\n════════════════════════════════════════');
  console.log('  BUFFERS — DAY 36');
  console.log('════════════════════════════════════════');

  demo1_createBuffers();
  demo2_encodings();
  demo3_bufferOps();
  demo4_binaryProtocol();
}
