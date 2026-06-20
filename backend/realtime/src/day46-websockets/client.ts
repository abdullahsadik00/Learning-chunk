// ════════════════════════════════════════════════════════════════
// DAY 46 — WEBSOCKET TEST CLIENT
// ════════════════════════════════════════════════════════════════
//
// Run this in a second terminal while server.ts is running:
//   ts-node src/day46-websockets/client.ts
//
// What this demonstrates:
//   1. Connecting to a WebSocket server programmatically
//   2. Sending typed JSON messages
//   3. Receiving and parsing server messages
//   4. Simulating multiple users with sequential connections
//   5. Proper connection teardown
//
// In a real app the client would be a browser using:
//   const ws = new WebSocket('ws://localhost:8080');
//   ws.onmessage = (event) => { const msg = JSON.parse(event.data); ... }
//   ws.send(JSON.stringify({ type: 'join', roomId: 'lobby', username: 'Alice' }));
// ════════════════════════════════════════════════════════════════

import WebSocket from 'ws';

// ─── Types (must match server.ts) ────────────────────────────────

type ClientMessage =
  | { type: 'join';    roomId: string; username: string }
  | { type: 'message'; roomId: string; text: string }
  | { type: 'leave';   roomId: string }
  | { type: 'pong' };

type ServerMessage =
  | { type: 'joined';   roomId: string; username: string }
  | { type: 'message';  roomId: string; username: string; text: string; id: string; ts: number }
  | { type: 'left';     roomId: string; username: string }
  | { type: 'presence'; roomId: string; users: string[] }
  | { type: 'ping' }
  | { type: 'pong' }
  | { type: 'error';    message: string };

// ─── Helper ───────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Single user simulation ───────────────────────────────────────

async function simulateUser(username: string, roomId: string, messages: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:8080');

    ws.on('open', async () => {
      console.log(`\n[${username}] Connected to server`);

      // Step 1: Join the room
      const joinMsg: ClientMessage = { type: 'join', roomId, username };
      ws.send(JSON.stringify(joinMsg));

      await delay(200);

      // Step 2: Send messages with delays to simulate real conversation
      for (const text of messages) {
        const chatMsg: ClientMessage = { type: 'message', roomId, text };
        ws.send(JSON.stringify(chatMsg));
        console.log(`[${username}] Sent: "${text}"`);
        await delay(500);
      }

      await delay(300);

      // Step 3: Leave the room gracefully
      const leaveMsg: ClientMessage = { type: 'leave', roomId };
      ws.send(JSON.stringify(leaveMsg));
      console.log(`[${username}] Sent leave`);

      await delay(200);
      ws.close();
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString()) as ServerMessage;

      switch (msg.type) {
        case 'joined':
          console.log(`[${username}] ← Server: joined room "${msg.roomId}"`);
          break;

        case 'message':
          // Don't log own messages echoed back — just others
          if (msg.username !== username) {
            console.log(`[${username}] ← ${msg.username}: "${msg.text}"`);
          }
          break;

        case 'presence':
          console.log(`[${username}] ← Presence update in ${msg.roomId}: [${msg.users.join(', ')}]`);
          break;

        case 'left':
          console.log(`[${username}] ← ${msg.username} left the room`);
          break;

        case 'ping':
          // Server heartbeat — reply with pong
          console.log(`[${username}] ← ping → sending pong`);
          ws.send(JSON.stringify({ type: 'pong' } satisfies ClientMessage));
          break;

        case 'error':
          console.error(`[${username}] ← ERROR: ${msg.message}`);
          break;
      }
    });

    ws.on('close', () => {
      console.log(`[${username}] Connection closed`);
      resolve();
    });

    ws.on('error', (err) => {
      console.error(`[${username}] WebSocket error:`, err.message);
      reject(err);
    });
  });
}

// ─── Main: simulate 3 users chatting ─────────────────────────────

async function main(): Promise<void> {
  console.log('════════════════════════════════════════════════');
  console.log('WebSocket Chat Client — 3 user simulation');
  console.log('Connecting to ws://localhost:8080 ...');
  console.log('════════════════════════════════════════════════\n');

  // Users join at slightly different times (realistic)
  // Promise.all would have them overlap; we stagger with delays

  const alicePromise = simulateUser('Alice', 'lobby', [
    'Hey everyone!',
    'How is the async event loop treating you?',
    'WebSockets are way cooler than polling.',
  ]);

  await delay(300); // Bob joins 300ms after Alice

  const bobPromise = simulateUser('Bob', 'lobby', [
    'Alice! Great to see you here.',
    'Agreed — full-duplex is 🔥',
  ]);

  await delay(400); // Charlie joins 700ms after Alice

  const charliePromise = simulateUser('Charlie', 'lobby', [
    'Late to the party but I made it',
  ]);

  // Wait for all three to finish
  await Promise.all([alicePromise, bobPromise, charliePromise]);

  console.log('\n════════════════════════════════════════════════');
  console.log('All simulated users have disconnected.');

  // Query the stats endpoint to verify cleanup
  try {
    const { default: http } = await import('http');
    await new Promise<void>((resolve) => {
      http.get('http://localhost:3001/stats', (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          console.log('\nFinal stats from server:');
          console.log(body);
          resolve();
        });
      }).on('error', () => {
        console.log('(Could not reach stats server)');
        resolve();
      });
    });
  } catch {
    console.log('(Stats check skipped)');
  }
}

main().catch(console.error);
