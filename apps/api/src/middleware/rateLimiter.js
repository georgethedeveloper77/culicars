"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRateLimiter = exports.ipRateLimiter = void 0;
// apps/api/src/middleware/rateLimiter.ts
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Global IP rate limit — 100 requests per minute
exports.ipRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'RATE_LIMITED',
        message: 'Too many requests. Please try again in a minute.',
        statusCode: 429,
    },
});
// Per-user rate limit — 30 requests per minute (attach after auth middleware)
exports.userRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id ?? req.ip ?? 'unknown',
    message: {
        error: 'RATE_LIMITED',
        message: 'Too many requests for this account. Please slow down.',
        statusCode: 429,
    },
});
