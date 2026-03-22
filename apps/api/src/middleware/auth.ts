// apps/api/src/middleware/auth.ts
// Strict auth — rejects if no valid JWT
// Looks up user role from DB, attaches to req.user

import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import prisma from '../lib/prisma';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function auth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Missing or invalid Authorization header',
        statusCode: 401,
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT with Supabase
    const { data: { user: supaUser }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !supaUser) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
        statusCode: 401,
      });
    }

    // Look up role from our users table
    const dbUser = await prisma.user.findUnique({
      where: { id: supaUser.id },
      select: { id: true, email: true, role: true },
    });

    if (!dbUser) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'User not found in database',
        statusCode: 401,
      });
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
    };

    next();
  } catch (err) {
    next(err);
  }
}
