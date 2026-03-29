// apps/api/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { prisma } from '../lib/prisma';

type Role = 'guest' | 'user' | 'admin' | 'dealer' | 'employee';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
      };
    }
  }
}

/**
 * Strict auth — validates JWT, looks up role from users table, attaches user.
 * Returns 401 if no valid token.
 */
export async function auth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid or expired token' });
    }

    // Role lives on users table, not profiles
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    const role = (dbUser?.role ?? 'user') as Role;

    req.user = { id: user.id, email: user.email ?? '', role };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional auth — attaches user if token present, continues silently if not.
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) return next();

    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) return next();

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    const role = (dbUser?.role ?? 'user') as Role;
    req.user = { id: user.id, email: user.email ?? '', role };
    next();
  } catch {
    next();
  }
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}
