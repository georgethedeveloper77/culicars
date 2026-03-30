// apps/api/src/middleware/requireRole.ts
// Accepts both legacy single-string and new array form:
//   requireRole('admin')
//   requireRole(['admin', 'employee'])

import { Request, Response, NextFunction } from 'express';

export function requireRole(roles: string | string[]) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;
    if (!userRole || !allowed.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
  };
}
