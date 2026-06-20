import type { Request } from 'express';

export interface AuthRequest extends Request {
  userId: string;
}

export type UserRole = 'owner' | 'editor' | 'viewer';
