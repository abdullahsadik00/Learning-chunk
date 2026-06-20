import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { alertQueue } from './alertQueue';

const FLUSH_INTERVAL_MS = 5000;
const BATCH_SIZE = 1000;

interface RawEvent {
  projectId: string;
  type: string;
  page: string;
  referrer: string | null;
  country: string | null;
  deviceType: string | null;
  eventName: string | null;
  eventProps: Record<string, unknown> | null;
  sessionId: string | null;
  createdAt: string;
}

function startOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function flushProject(projectId: string): Promise<void> {
  const lockKey = `flushing:${projectId}`;
  const eventsKey = `events:${projectId}`;

  // Acquire lock — SET NX with 30s expiry to prevent double-flush
  const locked = await redis.set(lockKey, '1', 'EX', 30, 'NX');
  if (!locked) {
    console.log(`[Worker] Skipping ${projectId} — already flushing`);
    return;
  }

  try {
    // Atomically grab events and trim
    const rawEvents = await redis.lrange(eventsKey, 0, BATCH_SIZE - 1);
    if (rawEvents.length === 0) {
      return;
    }

    await redis.ltrim(eventsKey, rawEvents.length, -1);

    const events: RawEvent[] = rawEvents.map(raw => JSON.parse(raw) as RawEvent);

    // Insert events in bulk
    await prisma.event.createMany({
      data: events.map(e => ({
        projectId: e.projectId,
        type: e.type,
        page: e.page,
        referrer: e.referrer,
        country: e.country,
        deviceType: e.deviceType,
        eventName: e.eventName,
        eventProps: e.eventProps ?? undefined,
        sessionId: e.sessionId,
        createdAt: new Date(e.createdAt),
      })),
      skipDuplicates: true,
    });

    console.log(`[Worker] Flushed ${events.length} events for project ${projectId}`);

    // Aggregate for daily_stats
    const today = startOfDayUTC(new Date());
    const todayEvents = events.filter(e => {
      const d = startOfDayUTC(new Date(e.createdAt));
      return d.getTime() === today.getTime();
    });

    if (todayEvents.length > 0) {
      const uniqueVisitors = new Set(todayEvents.map(e => e.sessionId).filter(Boolean)).size;
      const uniqueSessions = new Set(todayEvents.map(e => e.sessionId).filter(Boolean)).size;

      await prisma.dailyStat.upsert({
        where: { projectId_date: { projectId, date: today } },
        create: {
          projectId,
          date: today,
          views: todayEvents.length,
          visitors: uniqueVisitors,
          sessions: uniqueSessions,
        },
        update: {
          views: { increment: todayEvents.length },
          visitors: { increment: uniqueVisitors },
          sessions: { increment: uniqueSessions },
        },
      });
    }

    // Check alerts
    await checkAlerts(projectId);
  } finally {
    await redis.del(lockKey);
  }
}

async function checkAlerts(projectId: string): Promise<void> {
  const alerts = await prisma.alert.findMany({ where: { projectId } });
  if (alerts.length === 0) return;

  const today = startOfDayUTC(new Date());
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  const [todayStat, yesterdayStat] = await Promise.all([
    prisma.dailyStat.findUnique({ where: { projectId_date: { projectId, date: today } } }),
    prisma.dailyStat.findUnique({ where: { projectId_date: { projectId, date: yesterday } } }),
  ]);

  if (!todayStat || !yesterdayStat || yesterdayStat.views === 0) return;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return;

  const changePct = ((todayStat.views - yesterdayStat.views) / yesterdayStat.views) * 100;

  for (const alert of alerts) {
    // Avoid spamming — only trigger once per hour
    if (alert.lastTriggered) {
      const hourAgo = Date.now() - 60 * 60 * 1000;
      if (alert.lastTriggered.getTime() > hourAgo) continue;
    }

    const shouldTrigger =
      (alert.type === 'spike' && changePct >= alert.thresholdPct) ||
      (alert.type === 'drop' && changePct <= -alert.thresholdPct);

    if (shouldTrigger) {
      await alertQueue.add('send-alert', {
        projectName: project.name,
        emails: alert.emails,
        type: alert.type as 'spike' | 'drop',
        currentViews: todayStat.views,
        previousViews: yesterdayStat.views,
        changePct: Math.round(changePct),
      });

      await prisma.alert.update({
        where: { id: alert.id },
        data: { lastTriggered: new Date() },
      });
    }
  }
}

async function flush(): Promise<void> {
  try {
    const projectIds = await redis.smembers('active_projects');
    if (projectIds.length === 0) return;

    console.log(`[Worker] Flushing ${projectIds.length} active project(s)`);
    await Promise.all(projectIds.map(flushProject));
  } catch (err) {
    console.error('[Worker] Flush error:', err);
  }
}

console.log('[Worker] Starting event flush worker (interval: 5s)');
setInterval(() => {
  void flush();
}, FLUSH_INTERVAL_MS);

// Run once immediately on startup
void flush();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Worker] SIGTERM received, running final flush...');
  await flush();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Worker] SIGINT received, running final flush...');
  await flush();
  process.exit(0);
});
