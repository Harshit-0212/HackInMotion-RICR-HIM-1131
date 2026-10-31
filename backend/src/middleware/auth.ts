import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { requireJwtSecret } from '../config.js';
import { userStore, type StoredUser } from '../lib/users.js';

export interface AuthedRequest extends Request {
  userId?: string;
  user?: StoredUser;
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, requireJwtSecret(), { expiresIn: '7d', algorithm: 'HS256' });
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: { message: 'Missing authentication token.' } });
    return;
  }

  try {
    const payload = jwt.verify(token, requireJwtSecret(), { algorithms: ['HS256'] }) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: { message: 'Invalid or expired session. Please sign in again.' } });
  }
}

export async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: { message: 'Authentication required.' } });
    return;
  }

  const user = await userStore.findById(userId);
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: { message: 'Forbidden. Admin privileges required.' } });
    return;
  }

  req.user = user;
  next();
}
