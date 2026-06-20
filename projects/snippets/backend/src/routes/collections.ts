import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { ApiError } from '../middleware/errorHandler';
import type { UserRole, AuthRequest } from '../types';
import type { Request, Response, NextFunction } from 'express';

export const collectionsRouter = Router();

// All routes require authentication
const auth = requireAuth as unknown as (req: Request, res: Response, next: NextFunction) => void;

// ─── Permission helper ────────────────────────────────────────────────────────

async function checkPermission(
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

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createCollectionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

const updateCollectionSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
});

const memberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['editor', 'viewer']),
});

// ─── GET / — list user's collections ─────────────────────────────────────────

collectionsRouter.get('/', auth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req as AuthRequest;

    const permissions = await prisma.permission.findMany({
      where: { userId },
      include: {
        collection: {
          include: {
            _count: { select: { snippets: true } },
          },
        },
      },
      orderBy: { grantedAt: 'desc' },
    });

    const collections = permissions.map((p) => ({
      ...p.collection,
      role: p.role,
    }));

    res.json({ collections });
  } catch (err) {
    next(err);
  }
});

// ─── POST / — create collection ───────────────────────────────────────────────

collectionsRouter.post(
  '/',
  auth,
  validate(createCollectionSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req as AuthRequest;
      const { name, description, isPublic } = req.body as z.infer<typeof createCollectionSchema>;

      const collection = await prisma.$transaction(async (tx) => {
        const col = await tx.collection.create({
          data: { ownerId: userId, name, description, isPublic },
        });

        // Auto-grant owner permission
        await tx.permission.create({
          data: { userId, collectionId: col.id, role: 'owner' },
        });

        return col;
      });

      res.status(201).json({ collection });
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /:id — get collection with snippets ──────────────────────────────────

collectionsRouter.get('/:id', auth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req as AuthRequest;
    const { id } = req.params;

    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        snippets: {
          select: {
            id: true,
            title: true,
            language: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: 'desc' },
        },
        _count: { select: { snippets: true } },
      },
    });

    if (!collection) {
      throw new ApiError(404, 'Collection not found');
    }

    // Allow access if public OR if user has a permission entry
    if (!collection.isPublic) {
      await checkPermission(userId, id, ['owner', 'editor', 'viewer']);
    }

    // Attach the caller's role if they have one
    const permission = await prisma.permission.findUnique({
      where: { userId_collectionId: { userId, collectionId: id } },
    });

    res.json({ collection, role: permission?.role ?? null });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /:id — update collection ──────────────────────────────────────────

collectionsRouter.patch(
  '/:id',
  auth,
  validate(updateCollectionSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req as AuthRequest;
      const { id } = req.params;
      const data = req.body as z.infer<typeof updateCollectionSchema>;

      await checkPermission(userId, id, ['owner']);

      const collection = await prisma.collection.update({
        where: { id },
        data,
      });

      res.json({ collection });
    } catch (err) {
      next(err);
    }
  },
);

// ─── DELETE /:id — delete collection ─────────────────────────────────────────

collectionsRouter.delete('/:id', auth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req as AuthRequest;
    const { id } = req.params;

    await checkPermission(userId, id, ['owner']);

    await prisma.collection.delete({ where: { id } });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ─── POST /:id/members — add / update member ──────────────────────────────────

collectionsRouter.post(
  '/:id/members',
  auth,
  validate(memberSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req as AuthRequest;
      const { id: collectionId } = req.params;
      const { userId: targetUserId, role } = req.body as z.infer<typeof memberSchema>;

      await checkPermission(userId, collectionId, ['owner']);

      // Ensure the target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, email: true, name: true },
      });
      if (!targetUser) {
        throw new ApiError(404, 'User not found');
      }

      const permission = await prisma.permission.upsert({
        where: { userId_collectionId: { userId: targetUserId, collectionId } },
        create: { userId: targetUserId, collectionId, role },
        update: { role },
      });

      res.json({ permission, user: targetUser });
    } catch (err) {
      next(err);
    }
  },
);

// ─── DELETE /:id/members/:userId — remove member ──────────────────────────────

collectionsRouter.delete(
  '/:id/members/:memberId',
  auth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req as AuthRequest;
      const { id: collectionId, memberId } = req.params;

      await checkPermission(userId, collectionId, ['owner']);

      if (memberId === userId) {
        throw new ApiError(400, 'Cannot remove yourself from a collection you own');
      }

      await prisma.permission.delete({
        where: { userId_collectionId: { userId: memberId, collectionId } },
      });

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
