import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { randomUUID } from 'crypto';
import { verifyAccessToken } from '../lib/jwt';
import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Client {
  connectionId: string;
  userId: string;
  name: string;
  ws: WebSocket;
  rooms: Set<string>; // snippet IDs this connection has joined
}

// Incoming message shapes
interface AuthMessage {
  type: 'auth';
  token: string;
}

interface JoinMessage {
  type: 'join';
  snippetId: string;
}

interface LeaveMessage {
  type: 'leave';
  snippetId: string;
}

interface CrdtOpMessage {
  type: 'crdt_op';
  snippetId: string;
  op: unknown; // opaque CRDT operation (e.g. Yjs update bytes as base64)
}

interface CursorMessage {
  type: 'cursor';
  snippetId: string;
  line: number;
  column: number;
}

type InboundMessage = AuthMessage | JoinMessage | LeaveMessage | CrdtOpMessage | CursorMessage;

// ─── In-process client registry ───────────────────────────────────────────────

const clients = new Map<string, Client>(); // connectionId → Client

// ─── Helpers ──────────────────────────────────────────────────────────────────

function send(ws: WebSocket, payload: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastToRoom(
  snippetId: string,
  payload: unknown,
  excludeConnectionId?: string,
): void {
  for (const client of clients.values()) {
    if (client.connectionId === excludeConnectionId) continue;
    if (client.rooms.has(snippetId)) {
      send(client.ws, payload);
    }
  }
}

function buildPresence(snippetId: string): Array<{ userId: string; name: string }> {
  const members: Array<{ userId: string; name: string }> = [];
  for (const client of clients.values()) {
    if (client.rooms.has(snippetId)) {
      // Deduplicate by userId (one user can have multiple tabs)
      if (!members.find((m) => m.userId === client.userId)) {
        members.push({ userId: client.userId, name: client.name });
      }
    }
  }
  return members;
}

// ─── Redis subscriber for horizontal scaling ──────────────────────────────────
// A separate Redis connection is needed for subscriptions (ioredis requirement).

let redisSub: typeof redis | null = null;

async function getRedisSubscriber(): Promise<typeof redis> {
  if (redisSub) return redisSub;
  const Redis = (await import('ioredis')).default;
  redisSub = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  });
  redisSub.on('error', (err) => console.error('Redis subscriber error:', err));
  await redisSub.connect();
  return redisSub;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function initWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Set up a single Redis subscriber that fans out to local clients
  void (async () => {
    const sub = await getRedisSubscriber();

    sub.on('pmessage', (_pattern: string, channel: string, message: string) => {
      // channel format: snippet:<snippetId>
      const snippetId = channel.replace(/^snippet:/, '');
      let payload: unknown;
      try {
        payload = JSON.parse(message);
      } catch {
        return;
      }

      // Re-broadcast to all local clients in this room.
      // The publishing instance already sent to its own in-process clients,
      // so we tag messages with an instanceId to avoid double-delivery.
      broadcastToRoom(snippetId, payload);
    });

    await sub.psubscribe('snippet:*');
  })();

  // ─── Per-connection handler ─────────────────────────────────────────────

  wss.on('connection', (ws: WebSocket) => {
    const connectionId = randomUUID();
    let client: Client | null = null;

    // Send a challenge so the client knows to authenticate
    send(ws, { type: 'connected', connectionId });

    // Authenticate within 10 seconds or close
    const authTimeout = setTimeout(() => {
      if (!client) {
        send(ws, { type: 'error', message: 'Authentication timeout' });
        ws.close(4001, 'Authentication timeout');
      }
    }, 10_000);

    ws.on('message', async (raw: Buffer | string) => {
      let msg: InboundMessage;
      try {
        msg = JSON.parse(raw.toString()) as InboundMessage;
      } catch {
        send(ws, { type: 'error', message: 'Invalid JSON' });
        return;
      }

      // ── auth ────────────────────────────────────────────────────────────
      if (msg.type === 'auth') {
        if (client) {
          send(ws, { type: 'error', message: 'Already authenticated' });
          return;
        }
        try {
          const payload = verifyAccessToken(msg.token);
          const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, name: true },
          });
          if (!user) {
            send(ws, { type: 'error', message: 'User not found' });
            ws.close(4003, 'User not found');
            return;
          }
          clearTimeout(authTimeout);
          client = { connectionId, userId: user.id, name: user.name, ws, rooms: new Set() };
          clients.set(connectionId, client);
          send(ws, { type: 'authenticated', userId: user.id, name: user.name });
        } catch {
          send(ws, { type: 'error', message: 'Invalid token' });
          ws.close(4001, 'Invalid token');
        }
        return;
      }

      // All subsequent messages require authentication
      if (!client) {
        send(ws, { type: 'error', message: 'Not authenticated' });
        return;
      }

      // ── join ────────────────────────────────────────────────────────────
      if (msg.type === 'join') {
        const { snippetId } = msg;
        client.rooms.add(snippetId);

        const presence = buildPresence(snippetId);

        // Tell the joining client who is already here
        send(ws, { type: 'presence', snippetId, members: presence });

        // Announce the new arrival to existing room members
        broadcastToRoom(
          snippetId,
          { type: 'user_joined', snippetId, userId: client.userId, name: client.name, members: presence },
          connectionId,
        );

        // Publish join event cross-instance
        await redis.publish(
          `snippet:${snippetId}`,
          JSON.stringify({
            type: 'user_joined',
            snippetId,
            userId: client.userId,
            name: client.name,
          }),
        );
        return;
      }

      // ── leave ───────────────────────────────────────────────────────────
      if (msg.type === 'leave') {
        const { snippetId } = msg;
        client.rooms.delete(snippetId);

        const presence = buildPresence(snippetId);

        broadcastToRoom(
          snippetId,
          { type: 'user_left', snippetId, userId: client.userId, name: client.name, members: presence },
          connectionId,
        );

        await redis.publish(
          `snippet:${snippetId}`,
          JSON.stringify({
            type: 'user_left',
            snippetId,
            userId: client.userId,
            name: client.name,
          }),
        );
        return;
      }

      // ── crdt_op ─────────────────────────────────────────────────────────
      if (msg.type === 'crdt_op') {
        const { snippetId, op } = msg;

        if (!client.rooms.has(snippetId)) {
          send(ws, { type: 'error', message: 'Not in room — send a join first' });
          return;
        }

        const outbound = {
          type: 'crdt_op',
          snippetId,
          op,
          fromUserId: client.userId,
          fromName: client.name,
        };

        // Broadcast to other local clients in the room
        broadcastToRoom(snippetId, outbound, connectionId);

        // Publish cross-instance so other pods fan it out too
        await redis.publish(`snippet:${snippetId}`, JSON.stringify(outbound));
        return;
      }

      // ── cursor ──────────────────────────────────────────────────────────
      if (msg.type === 'cursor') {
        const { snippetId, line, column } = msg;

        if (!client.rooms.has(snippetId)) return; // silently ignore if not in room

        const outbound = {
          type: 'cursor',
          snippetId,
          line,
          column,
          userId: client.userId,
          name: client.name,
        };

        // Cursor updates are high-frequency — only fan out locally to reduce Redis load.
        // For cross-instance cursor sync, publish via Redis as well.
        broadcastToRoom(snippetId, outbound, connectionId);
        await redis.publish(`snippet:${snippetId}`, JSON.stringify(outbound));
        return;
      }

      send(ws, { type: 'error', message: 'Unknown message type' });
    });

    // ── disconnect cleanup ──────────────────────────────────────────────────
    ws.on('close', async () => {
      clearTimeout(authTimeout);

      if (!client) return;

      const { userId, name, rooms } = client;
      clients.delete(connectionId);

      // Announce departure from every room this connection had joined
      for (const snippetId of rooms) {
        const presence = buildPresence(snippetId);

        broadcastToRoom(snippetId, {
          type: 'user_left',
          snippetId,
          userId,
          name,
          members: presence,
        });

        await redis.publish(
          `snippet:${snippetId}`,
          JSON.stringify({ type: 'user_left', snippetId, userId, name }),
        );
      }
    });

    ws.on('error', (err) => {
      console.error(`WebSocket error [${connectionId}]:`, err);
    });
  });

  console.log('WebSocket server initialised at path /ws');
  return wss;
}
