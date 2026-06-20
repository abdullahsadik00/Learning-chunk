// ════════════════════════════════════════════════════════════════
// DAY 36 — NODE.JS INTERNALS: STREAMS
// ════════════════════════════════════════════════════════════════
//
// WHAT IS A STREAM?
// Instead of loading an entire file into memory, a stream processes
// data in chunks. Essential for: large files, HTTP responses, real-time data.
//
// STREAM TYPES:
//   Readable  — source of data (fs.createReadStream, http.IncomingMessage)
//   Writable  — destination (fs.createWriteStream, http.ServerResponse)
//   Transform — reads, modifies, and outputs data (zlib.createGzip, csv-parse)
//   Duplex    — both readable and writable simultaneously (TCP sockets)
//
// BACKPRESSURE:
// If the writer is slower than the reader, data accumulates in memory.
// Streams handle this automatically via the 'drain' event and .pipe().
//
// THE RULE: if (writable.write(chunk) === false) { readable.pause(); }
// .pipe() does this for you automatically — prefer pipe over manual writes.
//
// HIGHWATERMARK:
// The internal buffer size. Default: 16KB for byte streams, 16 objects for
// object mode. Tune with { highWaterMark: 64 * 1024 } for large file reads.

import { Readable, Transform, Writable, pipeline } from 'stream';
import { promisify } from 'util';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

const pipelineAsync = promisify(pipeline);

// ─────────────────────────────────────────────────────────────────
// DEMO 1: Read a file with createReadStream — count bytes, log progress
// ─────────────────────────────────────────────────────────────────
export async function demo1_readStream(): Promise<void> {
  console.log('\n─── DEMO 1: Readable Stream ───');

  // Create some temporary content to read (we do this in-memory to avoid
  // needing a file on disk, then write it to a temp file for demonstration)
  const tmpFile = path.join(os.tmpdir(), 'stream-demo.txt');
  const content = 'Hello from streams!\n'.repeat(1000); // ~20KB
  fs.writeFileSync(tmpFile, content);

  let totalBytes = 0;
  let chunkCount = 0;

  // createReadStream returns a Readable stream.
  // highWaterMark controls how many bytes are read per chunk.
  // Smaller = more chunks, more events. Larger = fewer, faster.
  const readable = fs.createReadStream(tmpFile, {
    highWaterMark: 4096, // 4KB per chunk — default is 64KB
    encoding: 'utf8',    // without this, chunks would be Buffers
  });

  // 'data' event fires for every chunk the OS delivers
  readable.on('data', (chunk: string | Buffer) => {
    chunkCount++;
    totalBytes += Buffer.byteLength(chunk as string, 'utf8');
    // Uncomment to see each chunk:
    // console.log(`  Chunk ${chunkCount}: ${Buffer.byteLength(chunk, 'utf8')} bytes`);
  });

  // 'end' fires when all data has been consumed
  await new Promise<void>((resolve, reject) => {
    readable.on('end', () => {
      console.log(`  Read complete: ${totalBytes} bytes in ${chunkCount} chunks`);
      console.log(`  Average chunk size: ${Math.round(totalBytes / chunkCount)} bytes`);
      resolve();
    });
    readable.on('error', reject);
  });

  fs.unlinkSync(tmpFile);
}

// ─────────────────────────────────────────────────────────────────
// DEMO 2: pipe() — readable → transform (uppercase) → writable
// ─────────────────────────────────────────────────────────────────
export async function demo2_pipeTransform(): Promise<void> {
  console.log('\n─── DEMO 2: pipe() — Readable → Transform → Writable ───');

  const tmpIn  = path.join(os.tmpdir(), 'stream-in.txt');
  const tmpOut = path.join(os.tmpdir(), 'stream-out.txt');
  fs.writeFileSync(tmpIn, 'hello world\nnode streams are cool\n'.repeat(100));

  // Transform stream: intercepts data and lets you modify it
  const uppercaseTransform = new Transform({
    // transform() is called for each chunk.
    // Call this.push(data) to send transformed data downstream.
    // Call callback() (the third arg) to signal you're ready for more.
    transform(chunk: Buffer, _encoding: string, callback: () => void) {
      this.push(chunk.toString().toUpperCase());
      callback();
    },
    // flush() is called when the source ends — for any buffered output
    flush(callback: () => void) {
      callback();
    },
  });

  const readStream  = fs.createReadStream(tmpIn);
  const writeStream = fs.createWriteStream(tmpOut);

  // pipeline() is the modern replacement for .pipe()
  // It automatically handles errors and cleanup — .pipe() leaks on error
  await pipelineAsync(readStream, uppercaseTransform, writeStream);

  const result = fs.readFileSync(tmpOut, 'utf8');
  console.log(`  First 80 chars of output: "${result.slice(0, 80).trim()}"`);
  console.log(`  Input size:  ${fs.statSync(tmpIn).size} bytes`);
  console.log(`  Output size: ${fs.statSync(tmpOut).size} bytes (same — only case changed)`);

  fs.unlinkSync(tmpIn);
  fs.unlinkSync(tmpOut);
}

// ─────────────────────────────────────────────────────────────────
// DEMO 3: Object-mode Transform — parse NDJSON lines
// ─────────────────────────────────────────────────────────────────
// NDJSON = Newline-Delimited JSON. Each line is a complete JSON object.
// Used by: Docker logs, log aggregators, streaming APIs.
//
// Object mode: instead of Buffers/strings, the stream emits JS objects.
// Set { objectMode: true } on Transform/Writable to enable.
export async function demo3_ndjsonTransform(): Promise<void> {
  console.log('\n─── DEMO 3: Object-Mode Transform (NDJSON Parser) ───');

  // Simulate an NDJSON data source
  const ndjsonData = [
    '{"id":1,"name":"Alice","score":95}',
    '{"id":2,"name":"Bob","score":82}',
    '{"id":3,"name":"Carol","score":91}',
    '',                // blank lines are common in real NDJSON — handle them
    '{"id":4,"name":"Dave","score":78}',
  ].join('\n');

  // Readable from a string — handy for testing without files
  const source = Readable.from([ndjsonData]);

  // Accumulate lines across chunks — a chunk boundary may split a line!
  let leftover = '';

  const lineParser = new Transform({
    // readableObjectMode: true — the output side emits objects
    // writableObjectMode: false — the input side still gets string chunks
    readableObjectMode: true,
    transform(chunk: Buffer, _enc: string, cb: () => void) {
      const text = leftover + chunk.toString();
      const lines = text.split('\n');
      // The last element may be an incomplete line — save for next chunk
      leftover = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue; // skip blank lines
        try {
          this.push(JSON.parse(trimmed)); // push a JS object downstream
        } catch {
          console.warn(`  Skipping invalid JSON line: "${trimmed}"`);
        }
      }
      cb();
    },
    flush(cb: () => void) {
      // Handle any trailing data after the final newline
      if (leftover.trim()) {
        try { this.push(JSON.parse(leftover.trim())); } catch { /* ignore */ }
      }
      cb();
    },
  });

  // A Writable in object mode to consume the parsed objects
  const consumer = new Writable({
    objectMode: true,
    write(obj: { id: number; name: string; score: number }, _enc: string, cb: () => void) {
      console.log(`  Parsed object → id=${obj.id} name=${obj.name} score=${obj.score}`);
      cb();
    },
  });

  await pipelineAsync(source, lineParser, consumer);
}

// ─────────────────────────────────────────────────────────────────
// DEMO 4: HTTP server that streams a large response
// ─────────────────────────────────────────────────────────────────
// Key insight: res.write() for streaming, res.end() to finish.
// The client receives and can display data before the response is complete.
// This is how: video streaming, server-sent events, and large CSV exports work.
export async function demo4_httpStream(): Promise<void> {
  console.log('\n─── DEMO 4: HTTP Streaming Server ───');

  const PORT = 3099;
  let linesSent = 0;
  const TOTAL_LINES = 200;

  const server = http.createServer((_req, res) => {
    // Set headers before writing body
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      // Transfer-Encoding: chunked is set automatically when you use
      // res.write() without a Content-Length header
    });

    let i = 0;
    const interval = setInterval(() => {
      if (i >= TOTAL_LINES) {
        clearInterval(interval);
        res.end(`\nDone — streamed ${TOTAL_LINES} lines\n`);
        return;
      }

      const line = `Line ${++i}: ${new Date().toISOString()} — chunk of data\n`;
      linesSent++;

      // res.write() returns false if the internal buffer is full (backpressure).
      // For a real server you'd pause the source and resume on 'drain'.
      const ok = res.write(line);
      if (!ok) {
        // The client can't keep up — in production: pause your data source here
        // res.once('drain', () => source.resume());
      }
    }, 2); // 2ms between lines — fast enough to see streaming
  });

  server.listen(PORT);

  // Now act as a client and consume the streaming response
  await new Promise<void>((resolve, reject) => {
    const req = http.get(`http://localhost:${PORT}`, (res) => {
      let receivedLines = 0;
      let firstChunkTime: number | null = null;

      res.on('data', (chunk: Buffer) => {
        if (!firstChunkTime) {
          firstChunkTime = Date.now();
          console.log(`  First chunk received after ${firstChunkTime - startTime}ms`);
        }
        receivedLines += chunk.toString().split('\n').filter(Boolean).length;
      });

      res.on('end', () => {
        console.log(`  Total lines received: ~${receivedLines}`);
        console.log(`  Lines sent by server: ${linesSent}`);
        server.close();
        resolve();
      });
    });
    req.on('error', reject);
  });

  const startTime = Date.now();
  // Note: startTime is used above — this is a teaching file, order is intentional
}

// Export a single function that runs all stream demos sequentially
export async function runStreamDemos(): Promise<void> {
  console.log('\n════════════════════════════════════════');
  console.log('  STREAMS — DAY 36');
  console.log('════════════════════════════════════════');

  await demo1_readStream();
  await demo2_pipeTransform();
  await demo3_ndjsonTransform();

  // Demo 4 starts a real HTTP server — run it last
  // It's commented out by default since it requires a free port.
  // Uncomment to try it:
  // await demo4_httpStream();
  console.log('\n  (Demo 4 — HTTP streaming server — is runnable but skipped here)');
  console.log('  Uncomment demo4_httpStream() in index.ts to run it.\n');
}
