"use strict";
// apps/api/src/middleware/auth.ts
// Strict auth — rejects if no valid JWT
// Looks up user role from DB, attaches to req.user
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = auth;
const supabase_1 = require("../config/supabase");
const prisma_1 = __importDefault(require("../lib/prisma"));
async function auth(req, res, next) {
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
        const { data: { user: supaUser }, error } = await supabase_1.supabaseAdmin.auth.getUser(token);
        if (error || !supaUser) {
            return res.status(401).json({
                error: 'UNAUTHORIZED',
                message: 'Invalid or expired token',
                statusCode: 401,
            });
        }
        // Look up role from our users table
        const dbUser = await prisma_1.default.user.findUnique({
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
    }
    catch (err) {
        next(err);
    }
}
