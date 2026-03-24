"use strict";
// apps/api/src/middleware/optionalAuth.ts
// Attaches user if token present, continues silently if not
// Used for public routes that optionally personalize (e.g., search)
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = optionalAuth;
const supabase_1 = require("../config/supabase");
const prisma_1 = __importDefault(require("../lib/prisma"));
async function optionalAuth(req, _res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return next(); // No token — continue as guest
        }
        const token = authHeader.split(' ')[1];
        const { data: { user: supaUser }, error } = await supabase_1.supabaseAdmin.auth.getUser(token);
        if (error || !supaUser) {
            return next(); // Invalid token — continue as guest, don't reject
        }
        const dbUser = await prisma_1.default.user.findUnique({
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
    }
    catch {
        next(); // On any error, continue as guest
    }
}
