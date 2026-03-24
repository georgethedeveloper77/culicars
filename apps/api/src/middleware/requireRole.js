"use strict";
// apps/api/src/middleware/requireRole.ts
// Usage: router.use(auth, requireRole('admin'))
// Usage: router.use(auth, requireRole('admin', 'dealer'))
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'UNAUTHORIZED',
                message: 'Authentication required',
                statusCode: 401,
            });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'FORBIDDEN',
                message: `Requires role: ${roles.join(' or ')}`,
                statusCode: 403,
            });
        }
        next();
    };
}
