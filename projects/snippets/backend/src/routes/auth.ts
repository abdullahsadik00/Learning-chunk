import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import type { AuthRequest } from '../types';
import type { Request, Response, NextFunction } from 'express';

export const authRouter = Router();

// ─── Schemas ─────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Cookie helper ────────────────────────────────────────────────────────────

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

// ─── POST /auth/register ──────────────────────────────────────────────────────

authRouter.post(
  '/register',
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, name } = req.body as z.infer<typeof registerSchema>;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new ApiError(409, 'Email already in use');
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: { email, name, passwordHash },
        select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
      });

      res.status(201).json({ user });
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /auth/login ─────────────────────────────────────────────────────────

authRouter.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body as z.infer<typeof loginSchema>;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new ApiError(401, 'Invalid credentials');
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        throw new ApiError(401, 'Invalid credentials');
      }

      const accessToken = signAccessToken(user.id);
      const refreshToken = signRefreshToken(user.id);

      res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        },
        accessToken,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /auth/refresh ───────────────────────────────────────────────────────

authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token: string | undefined = req.cookies?.refresh_token;
    if (!token) {
      throw new ApiError(401, 'No refresh token');
    }

    const payload = verifyRefreshToken(token);
    const accessToken = signAccessToken(payload.sub);

    res.json({ accessToken });
  } catch (err) {
    if (err instanceof ApiError) {
      next(err);
    } else {
      next(new ApiError(401, 'Invalid or expired refresh token'));
    }
  }
});

// ─── DELETE /auth/logout ──────────────────────────────────────────────────────

authRouter.delete('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.status(204).send();
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────

authRouter.get(
  '/me',
  requireAuth as unknown as (req: Request, res: Response, next: NextFunction) => void,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req as AuthRequest;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      res.json({ user });
    } catch (err) {
      next(err);
    }
  },
);
