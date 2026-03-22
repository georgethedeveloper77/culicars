// apps/api/src/middleware/optionalAuth.ts
// Attaches user if token present, continues silently if not
// Used for public routes that optionally personalize (e.g., search)

import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import prisma from '../lib/prisma';

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(); // No token — continue as guest
    }

    const token = authHeader.split(' ')[1];
    const { data: { user: supaUser }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !supaUser) {
      return next(); // Invalid token — continue as guest, don't reject
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: supaUser.id },
      select: { id: true, email: true, role: true },
    });

    if (dbUser) {
      req.user = {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
      };
    }

    next();
  } catch {
    next(); // On any error, continue as guest
  }
}
