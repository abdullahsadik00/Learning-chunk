import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types';
import { verifyAccessToken } from '../lib/jwt';
import { ApiError } from './errorHandler';

export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;

    // Prefer Authorization header
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.cookies && typeof req.cookies['access_token'] === 'string') {
      // Fallback to httpOnly cookie
      token = req.cookies['access_token'] as string;
    }

    if (!token) {
      throw new ApiError(401, 'Unauthorized');
    }

    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    next();
  } catch (err) {
    if (err instanceof ApiError) {
      next(err);
    } else {
      next(new ApiError(401, 'Unauthorized'));
    }
  }
}
