// ════════════════════════════════════════════════════════════════
// DAY 36 — BUFFERS
// ════════════════════════════════════════════════════════════════
//
// Node built-ins used by the real-world demos below.
import { randomBytes, randomUUID, createHmac, timingSafeEqual } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
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

// ═════════════════════════════════════════════════════════════════
//  REAL-WORLD SCENARIOS
//  Each demo below maps a concept from DEMO 1-4 onto something you
//  actually ship in production code.
// ═════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────
// REAL-WORLD 1: Secure tokens, salts & UUIDs
//   (concept: DEMO 1 alloc/allocUnsafe + DEMO 2 hex/base64url)
// ─────────────────────────────────────────────────────────────────
//
// Where you meet this: password-reset links, email-verification tokens,
// API keys, session IDs, CSRF tokens, cryptographic salts.
//
// KEY INSIGHT: crypto.randomBytes() returns a Buffer of cryptographically
// secure random bytes. Internally it uses allocUnsafe-style memory then
// fills every byte — the exact "fill before you read" pattern from DEMO 1.
// NEVER use Math.random() for anything security-related.
export function real1_secureTokens(): void {
  console.log('\n─── REAL-WORLD 1: Secure tokens, salts & UUIDs ───');

  // A URL-safe token for a password-reset email link.
  // 32 random bytes → base64url (no +, /, = so it's safe in a URL/query).
  const resetToken = randomBytes(32).toString('base64url');
  console.log('  Password-reset token :', resetToken);
  console.log('    (drop into: https://app.com/reset?token=' + resetToken.slice(0, 12) + '...)');

  // An API key as hex — 24 bytes → 48 hex chars. Hex is common because
  // it's copy-paste safe and case-insensitive.
  const apiKey = 'sk_live_' + randomBytes(24).toString('hex');
  console.log('  Stripe-style API key :', apiKey);

  // A password salt: stored alongside the hash so identical passwords
  // produce different hashes. 16 random bytes is the usual size.
  const salt = randomBytes(16);
  console.log('  Password salt (hex)  :', salt.toString('hex'));

  // A UUID v4 — Node builds this from 16 random bytes with version/variant
  // bits set. Great for primary keys and correlation IDs.
  console.log('  Request correlation  :', randomUUID());

  // WHY BUFFERS? Random data is raw bytes. The Buffer is the neutral
  // container; you choose the *encoding* (hex/base64url) at the edge
  // depending on where the value has to travel (URL vs header vs DB).
}

// ─────────────────────────────────────────────────────────────────
// REAL-WORLD 2: HTTP Basic Auth, JWT decoding & data URIs
//   (concept: DEMO 2 base64 / base64url round-trips)
// ─────────────────────────────────────────────────────────────────
//
// base64 shows up any time binary/credentials must ride inside a
// text-only channel: HTTP headers, JWTs, JSON, and CSS/HTML data URIs.
export function real2_base64InTheWild(): void {
  console.log('\n─── REAL-WORLD 2: Basic Auth, JWT & data URIs ───');

  // ── HTTP Basic Auth ──────────────────────────────────────────
  // The header is literally: "Authorization: Basic base64(user:pass)"
  const user = 'admin';
  const pass = 's3cr3t!';
  const basic = 'Basic ' + Buffer.from(`${user}:${pass}`, 'utf8').toString('base64');
  console.log('  Authorization header :', basic);

  // Server side — decode it back to verify credentials:
  const raw = Buffer.from(basic.replace('Basic ', ''), 'base64').toString('utf8');
  const [gotUser, gotPass] = raw.split(':');
  console.log('  Decoded on server    :', { user: gotUser, pass: gotPass });

  // ── Decode a JWT WITHOUT a library ───────────────────────────
  // A JWT is three base64url segments joined by dots:
  //   header.payload.signature
  // You can read header + payload with just Buffer (signature needs a key).
  const jwt =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
    '.eyJzdWIiOiIxMjM0NSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTcwMDAwMDAwMH0' +
    '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  const [h, p] = jwt.split('.');
  const header  = JSON.parse(Buffer.from(h, 'base64url').toString('utf8'));
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
  console.log('  JWT header           :', header);
  console.log('  JWT payload          :', payload);
  console.log('    ⚠ decoding ≠ verifying — anyone can read a JWT; only the');
  console.log('      signature (checked with the secret) proves it is genuine.');

  // ── Data URI — embed a tiny image directly in HTML/CSS ───────
  // A 1x1 transparent PNG, base64-encoded, ready to paste into <img src>.
  const onePixelPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  );
  const dataUri = 'data:image/png;base64,' + onePixelPng.toString('base64');
  console.log('  Data URI (1x1 PNG)   :', dataUri.slice(0, 48) + '...');
}

// ─────────────────────────────────────────────────────────────────
// REAL-WORLD 3: File-type detection via magic bytes
//   (concept: DEMO 3 subarray / compare / indexOf, DEMO 2 hex)
// ─────────────────────────────────────────────────────────────────
//
// You should NEVER trust a file's extension or the client's Content-Type
// on upload — both are trivially spoofed. Instead you sniff the first few
// bytes ("magic numbers") that every real file format starts with.
// This is exactly what libraries like `file-type` do.
export function real3_fileTypeDetection(): void {
  console.log('\n─── REAL-WORLD 3: Detect file type from magic bytes ───');

  // Signature table: format → the exact leading bytes it must start with.
  const signatures: { type: string; magic: Buffer }[] = [
    { type: 'PNG',  magic: Buffer.from([0x89, 0x50, 0x4e, 0x47]) },       // ‰PNG
    { type: 'JPEG', magic: Buffer.from([0xff, 0xd8, 0xff]) },
    { type: 'GIF',  magic: Buffer.from('GIF89a', 'ascii') },
    { type: 'PDF',  magic: Buffer.from('%PDF', 'ascii') },
    { type: 'ZIP',  magic: Buffer.from([0x50, 0x4b, 0x03, 0x04]) },       // PK.. (also .docx/.xlsx/.jar)
  ];

  function sniff(file: Buffer): string {
    for (const { type, magic } of signatures) {
      // subarray = zero-copy view of the first N bytes; equals = byte compare
      if (file.subarray(0, magic.length).equals(magic)) return type;
    }
    return 'unknown';
  }

  // Fake uploads: real headers followed by junk body.
  const fakePng = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.from('...pixels...')]);
  const fakePdf = Buffer.concat([Buffer.from('%PDF-1.7'), Buffer.from(' ...doc...')]);
  const spoofed = Buffer.from('<?php system($_GET[c]); ?>'); // uploaded as "avatar.png"

  console.log('  upload #1 detected   :', sniff(fakePng)); // PNG
  console.log('  upload #2 detected   :', sniff(fakePdf)); // PDF
  console.log('  upload #3 detected   :', sniff(spoofed), '← reject! extension lied');
  console.log('    First 4 bytes hex  :', spoofed.subarray(0, 4).toString('hex'));
}

// ─────────────────────────────────────────────────────────────────
// REAL-WORLD 4: Timing-safe secret comparison
//   (concept: DEMO 3 equals/compare — but why the naive way is a bug)
// ─────────────────────────────────────────────────────────────────
//
// Comparing an incoming API key / HMAC signature / password-reset token
// with `===` or `.equals()` leaks information: a normal comparison returns
// as soon as it finds the first mismatching byte, so an attacker can
// measure response time to guess a secret one byte at a time.
//
// crypto.timingSafeEqual() compares two Buffers in constant time.
// This is how you verify webhook signatures (Stripe, GitHub, Slack).
export function real4_timingSafeCompare(): void {
  console.log('\n─── REAL-WORLD 4: Timing-safe secret comparison ───');

  const webhookSecret = 'whsec_ProductionSigningKey';

  // Verifying a GitHub/Stripe-style webhook: recompute the HMAC over the
  // raw body and compare it to the signature the sender put in a header.
  function verify(rawBody: string, receivedSig: string): boolean {
    const expected = createHmac('sha256', webhookSecret).update(rawBody).digest(); // Buffer
    const received = Buffer.from(receivedSig, 'hex');

    // timingSafeEqual THROWS if lengths differ — so guard length first,
    // and do it in a way that itself doesn't short-circuit on content.
    if (expected.length !== received.length) return false;
    return timingSafeEqual(expected, received);
  }

  const body = JSON.stringify({ event: 'payment.succeeded', amount: 4200 });
  const goodSig = createHmac('sha256', webhookSecret).update(body).digest('hex');
  const badSig  = createHmac('sha256', 'wrong-secret').update(body).digest('hex');

  console.log('  Genuine webhook      :', verify(body, goodSig)); // true
  console.log('  Forged webhook       :', verify(body, badSig));  // false
  console.log('    ✓ constant-time compare = no timing side-channel');
}

// ─────────────────────────────────────────────────────────────────
// REAL-WORLD 5: Parsing a real binary format (PNG header)
//   (concept: DEMO 3 readUInt32BE, DEMO 4 structured binary parsing)
// ─────────────────────────────────────────────────────────────────
//
// This is how image libraries read dimensions WITHOUT decoding the whole
// image. A PNG starts with an 8-byte signature, then an IHDR chunk whose
// data holds width and height as big-endian UInt32 — the exact BE/LE
// concept from DEMO 3, applied to a format you use every day.
//
// PNG layout we care about:
//   bytes  0-7  : signature 89 50 4E 47 0D 0A 1A 0A
//   bytes  8-11 : IHDR chunk length (always 13)
//   bytes 12-15 : "IHDR"
//   bytes 16-19 : width  (UInt32 BE)
//   bytes 20-23 : height (UInt32 BE)
//   byte  24    : bit depth
//   byte  25    : color type
export function real5_parsePng(): void {
  console.log('\n─── REAL-WORLD 5: Parse PNG dimensions from bytes ───');

  // Build a valid PNG *header* for 800x600, 8-bit, truecolor (type 2).
  const png = Buffer.alloc(26);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(png, 0); // signature
  png.writeUInt32BE(13, 8);          // IHDR length
  png.write('IHDR', 12, 'ascii');    // chunk type
  png.writeUInt32BE(800, 16);        // width
  png.writeUInt32BE(600, 20);        // height
  png.writeUInt8(8, 24);             // bit depth
  png.writeUInt8(2, 25);             // color type (2 = RGB)

  // ── Parser (what `image-size` does in ~10 lines) ─────────────
  const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!png.subarray(0, 8).equals(PNG_SIG)) throw new Error('Not a PNG');
  if (png.subarray(12, 16).toString('ascii') !== 'IHDR') throw new Error('Missing IHDR');

  const width  = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  const depth  = png.readUInt8(24);
  const color  = png.readUInt8(25);

  console.log(`  Dimensions           : ${width} x ${height}`);
  console.log(`  Bit depth / color    : ${depth}-bit, type ${color} (2 = truecolor RGB)`);
  console.log('    Read from the first 26 bytes — no full decode needed.');
}

// ─────────────────────────────────────────────────────────────────
// REAL-WORLD 6: File I/O with Buffers (write, read, append, checksum)
//   (concept: Buffers ARE what fs gives you when you don't pass an encoding)
// ─────────────────────────────────────────────────────────────────
//
// fs.readFileSync(path) with NO encoding returns a Buffer. This is the
// bread-and-butter of file handling: uploads, exports, log files, caches.
export function real6_fileIO(): void {
  console.log('\n─── REAL-WORLD 6: File I/O with Buffers ───');

  const tmp = path.join(os.tmpdir(), `day36-buffers-${process.pid}.bin`);

  try {
    // Write raw bytes: a small "record" = 4-byte magic + a UTF-8 message.
    const magic = Buffer.from('LOG1', 'ascii');
    const body  = Buffer.from('user 42 logged in\n', 'utf8');
    fs.writeFileSync(tmp, Buffer.concat([magic, body]));

    // Read it back as a Buffer (no encoding arg = raw bytes).
    const raw = fs.readFileSync(tmp);
    console.log('  File size (bytes)    :', raw.length);
    console.log('  Magic tag            :', raw.subarray(0, 4).toString('ascii'));
    console.log('  Message              :', raw.subarray(4).toString('utf8').trim());

    // Append more bytes (like appending to a log file).
    fs.appendFileSync(tmp, Buffer.from('user 42 logged out\n', 'utf8'));
    console.log('  After append (bytes) :', fs.readFileSync(tmp).length);

    // A quick content checksum — HMAC/hash over file bytes is how you
    // detect corruption or verify a download.
    const digest = createHmac('sha256', 'k').update(fs.readFileSync(tmp)).digest('hex');
    console.log('  Content fingerprint  :', digest.slice(0, 16) + '...');
  } finally {
    fs.rmSync(tmp, { force: true }); // clean up temp file
  }
}

// ─────────────────────────────────────────────────────────────────
// REAL-WORLD 7: TCP stream reassembly (a stateful length-prefix framer)
//   (concept: the HARD part DEMO 4 hinted at — partial frames)
// ─────────────────────────────────────────────────────────────────
//
// DEMO 4 assumed every message arrived whole. Real TCP does not:
//   • one .on('data') chunk may contain HALF a message
//   • or 2.5 messages
//   • or a message split across three chunks
// You must buffer bytes and only emit a message once ALL its bytes arrive.
// This exact pattern powers Redis clients, database drivers, and RPC libs.
export function real7_tcpFramer(): void {
  console.log('\n─── REAL-WORLD 7: TCP stream reassembly (framer) ───');

  // A stateful framer: feed it arbitrary chunks, it yields complete messages.
  class MessageFramer {
    private buffered = Buffer.alloc(0);

    push(chunk: Buffer): object[] {
      // Accumulate whatever arrived onto leftovers from last time.
      this.buffered = Buffer.concat([this.buffered, chunk]);
      const out: object[] = [];

      // Emit every COMPLETE frame currently in the buffer.
      while (this.buffered.length >= 4) {
        const len = this.buffered.readUInt32BE(0);
        if (this.buffered.length < 4 + len) break; // frame not fully here yet — wait

        const body = this.buffered.subarray(4, 4 + len);
        out.push(JSON.parse(body.toString('utf8')));
        this.buffered = this.buffered.subarray(4 + len); // drop consumed bytes
      }
      return out;
    }
  }

  // Helper to frame a message like DEMO 4's encoder.
  const frame = (obj: object): Buffer => {
    const body = Buffer.from(JSON.stringify(obj), 'utf8');
    const head = Buffer.alloc(4);
    head.writeUInt32BE(body.length, 0);
    return Buffer.concat([head, body]);
  };

  const m1 = frame({ id: 1, cmd: 'PING' });
  const m2 = frame({ id: 2, cmd: 'SET', key: 'a', val: 1 });
  const wire = Buffer.concat([m1, m2]);

  // Simulate an evil-but-realistic chunking: split mid-message.
  const chunks = [
    wire.subarray(0, 3),            // partial header
    wire.subarray(3, 10),           // rest of header + partial body
    wire.subarray(10, m1.length + 5), // rest of m1 + start of m2
    wire.subarray(m1.length + 5),   // rest of m2
  ];

  const framer = new MessageFramer();
  chunks.forEach((c, i) => {
    const msgs = framer.push(c);
    console.log(`  chunk ${i} (${c.length}b) → emitted:`, msgs.length ? msgs : '(waiting for more)');
  });
}

// ─────────────────────────────────────────────────────────────────
// REAL-WORLD 8: Bit/byte manipulation (XOR masking)
//   (concept: a Buffer is a mutable Uint8Array — you can do byte math)
// ─────────────────────────────────────────────────────────────────
//
// Real use: the WebSocket protocol REQUIRES every client→server frame to
// be XOR-masked with a 4-byte key. Same operation is a toy stream cipher.
// XOR is reversible: applying the same key twice returns the original.
export function real8_xorMasking(): void {
  console.log('\n─── REAL-WORLD 8: XOR masking (WebSocket-style) ───');

  const payload = Buffer.from('secret message', 'utf8');
  const key = randomBytes(4); // WebSocket uses a fresh 4-byte mask per frame

  const masked = Buffer.alloc(payload.length);
  for (let i = 0; i < payload.length; i++) {
    masked[i] = payload[i] ^ key[i % 4]; // XOR each byte with the rotating key
  }
  console.log('  Original             :', payload.toString());
  console.log('  Masked (hex)         :', masked.toString('hex'));

  // Unmask = XOR again with the same key.
  const unmasked = Buffer.alloc(masked.length);
  for (let i = 0; i < masked.length; i++) {
    unmasked[i] = masked[i] ^ key[i % 4];
  }
  console.log('  Unmasked             :', unmasked.toString());
  console.log('  Round-trip match     :', unmasked.equals(payload));
}

// Export runner
export function runBufferDemos(): void {
  console.log('\n════════════════════════════════════════');
  console.log('  BUFFERS — DAY 36');
  console.log('════════════════════════════════════════');

  // ── Fundamentals (the "reference") ──
  demo1_createBuffers();
  demo2_encodings();
  demo3_bufferOps();
  demo4_binaryProtocol();

  // ── Real-world scenarios (one per concept above) ──
  real1_secureTokens();
  real2_base64InTheWild();
  real3_fileTypeDetection();
  real4_timingSafeCompare();
  real5_parsePng();
  real6_fileIO();
  real7_tcpFramer();
  real8_xorMasking();
}
