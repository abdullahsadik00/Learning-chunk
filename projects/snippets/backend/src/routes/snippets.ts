import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { ApiError } from '../middleware/errorHandler';
import type { UserRole, AuthRequest } from '../types';
import type { Request, Response, NextFunction } from 'express';

export const snippetsRouter = Router();

const auth = requireAuth as unknown as (req: Request, res: Response, next: NextFunction) => void;

const MAX_VERSIONS = 50;

// ─── Permission helpers ───────────────────────────────────────────────────────

async function checkCollectionPermission(
  userId: string,
  collectionId: string,
  requiredRoles: UserRole[],
): Promise<void> {
  const permission = await prisma.permission.findUnique({
    where: { userId_collectionId: { userId, collectionId } },
  });
  if (!permission || !requiredRoles.includes(permission.role as UserRole)) {
    throw new ApiError(403, 'Forbidden');
  }
}

async function getSnippetWithPermission(
  snippetId: string,
  userId: string,
  requiredRoles: UserRole[],
) {
  const snippet = await prisma.snippet.findUnique({
    where: { id: snippetId },
    include: { collection: { select: { id: true, isPublic: true } } },
  });

  if (!snippet) {
    throw new ApiError(404, 'Snippet not found');
  }

  // Allow if collection is public and no write access required
  const readOnlyRoles: UserRole[] = ['owner', 'editor', 'viewer'];
  const needsWrite = !requiredRoles.every((r) => readOnlyRoles.includes(r));

  if (!snippet.collection.isPublic || needsWrite) {
    await checkCollectionPermission(userId, snippet.collectionId, requiredRoles);
  }

  return snippet;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createSnippetSchema = z.object({
  collectionId: z.string().uuid(),
  title: z.string().min(1),
  content: z.string(),
  language: z.string().default('plain'),
  description: z.string().optional(),
});

const updateSnippetSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  language: z.string().optional(),
  description: z.string().optional(),
});

const createCommentSchema = z.object({
  content: z.string().min(1),
  lineStart: z.number().int().positive().optional(),
  lineEnd: z.number().int().positive().optional(),
});

// ─── POST / — create snippet ──────────────────────────────────────────────────

snippetsRouter.post(
  '/',
  auth,
  validate(createSnippetSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req as AuthRequest;
      const { collectionId, title, content, language, description } = req.body as z.infer<
        typeof createSnippetSchema
      >;

      await checkCollectionPermission(userId, collectionId, ['owner', 'editor']);

      const snippet = await prisma.$transaction(async (tx) => {
        const s = await tx.snippet.create({
          data: { collectionId, title, content, language, description },
        });

        // Create the first version
        await tx.snippetVersion.create({
          data: { snippetId: s.id, content, createdById: userId },
        });

        return s;
      });

      res.status(201).json({ snippet });
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /:id — get snippet with comments ─────────────────────────────────────

snippetsRouter.get('/:id', auth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req as AuthRequest;
    const { id } = req.params;

    // Fetch the raw snippet first to get collectionId for permission check
    const bare = await prisma.snippet.findUnique({
      where: { id },
      select: { collectionId: true, collection: { select: { isPublic: true } } },
    });

    if (!bare) {
      throw new ApiError(404, 'Snippet not found');
    }

    if (!bare.collection.isPublic) {
      await checkCollectionPermission(userId, bare.collectionId, ['owner', 'editor', 'viewer']);
    }

    const snippet = await prisma.snippet.findUnique({
      where: { id },
      include: {
        comments: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { versions: true } },
      },
    });

    res.json({ snippet });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /:id — update snippet, create version, pub/sub ────────────────────

snippetsRouter.patch(
  '/:id',
  auth,
  validate(updateSnippetSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req as AuthRequest;
      const { id } = req.params;
      const updates = req.body as z.infer<typeof updateSnippetSchema>;

      await getSnippetWithPermission(id, userId, ['owner', 'editor']);

      const snippet = await prisma.$transaction(async (tx) => {
        const s = await tx.snippet.update({
          where: { id },
          data: { ...updates, updatedAt: new Date() },
        });

        // Create a new version when content changed
        if (updates.content !== undefined) {
          await tx.snippetVersion.create({
            data: { snippetId: id, content: updates.content, createdById: userId },
          });

          // Trim to MAX_VERSIONS: delete the oldest if over the cap
          const count = await tx.snippetVersion.count({ where: { snippetId: id } });
          if (count > MAX_VERSIONS) {
            const oldest = await tx.snippetVersion.findMany({
              where: { snippetId: id },
              orderBy: { createdAt: 'asc' },
              take: count - MAX_VERSIONS,
              select: { id: true },
            });
            await tx.snippetVersion.deleteMany({
              where: { id: { in: oldest.map((v) => v.id) } },
            });
          }
        }

        return s;
      });

      // Publish real-time update to Redis pub/sub for WebSocket fan-out
      await redis.publish(
        `snippet:${id}`,
        JSON.stringify({ type: 'update', snippetId: id, updates, updatedBy: userId }),
      );

      res.json({ snippet });
    } catch (err) {
      next(err);
    }
  },
);

// ─── DELETE /:id — delete snippet ─────────────────────────────────────────────

snippetsRouter.delete('/:id', auth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req as AuthRequest;
    const { id } = req.params;

    await getSnippetWithPermission(id, userId, ['owner']);

    await prisma.snippet.delete({ where: { id } });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ─── GET /:id/history — list versions ─────────────────────────────────────────

snippetsRouter.get('/:id/history', auth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req as AuthRequest;
    const { id } = req.params;

    await getSnippetWithPermission(id, userId, ['owner', 'editor', 'viewer']);

    const versions = await prisma.snippetVersion.findMany({
      where: { snippetId: id },
      include: {
        createdBy: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ versions });
  } catch (err) {
    next(err);
  }
});

// ─── POST /:id/comments — add comment ────────────────────────────────────────

snippetsRouter.post(
  '/:id/comments',
  auth,
  validate(createCommentSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req as AuthRequest;
      const { id: snippetId } = req.params;
      const { content, lineStart, lineEnd } = req.body as z.infer<typeof createCommentSchema>;

      await getSnippetWithPermission(snippetId, userId, ['owner', 'editor', 'viewer']);

      const comment = await prisma.comment.create({
        data: { snippetId, userId, content, lineStart, lineEnd },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      });

      res.status(201).json({ comment });
    } catch (err) {
      next(err);
    }
  },
);
