// apps/api/src/middleware/requireRole.ts
import { Request, Response, NextFunction } from 'express';

type Role = 'guest' | 'user' | 'admin' | 'dealer' | 'employee';

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role as Role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Requires role: ${roles.join(' or ')}`,
      });
    }
    next();
  };
}
