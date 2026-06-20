import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { createServer } from 'http';
import { rateLimit } from 'express-rate-limit';

import { initWebSocketServer } from './websocket/server';
import { authRouter } from './routes/auth';
import { collectionsRouter } from './routes/collections';
import { snippetsRouter } from './routes/snippets';
import { searchRouter } from './routes/search';
import { errorHandler } from './middleware/errorHandler';
import { redis } from './lib/redis';

const app = express();

// ─── Security & compression ───────────────────────────────────────────────────

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true, // allow cookies
  }),
);
app.use(compression());

// ─── Body parsing ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Rate limiting ────────────────────────────────────────────────────────────

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // stricter limit for auth endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth attempts, please try again later.' },
});

app.use(globalLimiter);

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/snippets', snippetsRouter);
app.use('/api/search', searchRouter);

// ─── 404 fallthrough ──────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// ─── Error handler ────────────────────────────────────────────────────────────

app.use(errorHandler);

// ─── HTTP + WebSocket server ──────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const httpServer = createServer(app);

// Attach WebSocket server to the same HTTP server
initWebSocketServer(httpServer);

// Connect Redis before accepting traffic
redis
  .connect()
  .then(() => {
    console.log('Redis connected');
  })
  .catch((err: unknown) => {
    console.error('Redis connection failed:', err);
    // Non-fatal: app can run without Redis (WebSocket pub/sub and cache will degrade)
  });

httpServer.listen(PORT, () => {
  console.log(`Snippets API running on port ${PORT}`);
});

export { app, httpServer };
