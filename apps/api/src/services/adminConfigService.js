"use strict";
// apps/api/src/services/adminConfigService.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateCache = invalidateCache;
exports.getConfig = getConfig;
exports.setConfig = setConfig;
exports.getAllConfig = getAllConfig;
exports.getEnabledProvidersForPlatform = getEnabledProvidersForPlatform;
exports.getCreditPacks = getCreditPacks;
const prisma_1 = __importDefault(require("../lib/prisma"));
const CACHE_TTL_MS = 60000; // 1 minute
const cache = new Map();
function cacheGet(key) {
    const entry = cache.get(key);
    if (!entry || Date.now() > entry.expiresAt)
        return null;
    return entry.value;
}
function cacheSet(key, value) {
    cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}
function invalidateCache(key) {
    if (key) {
        cache.delete(key);
    }
    else {
        cache.clear();
    }
}
// ─── Public API ────────────────────────────────────────────────────────────
async function getConfig(key) {
    const cached = cacheGet(key);
    if (cached !== null)
        return cached;
    const row = await prisma_1.default.admin_config.findUnique({
        where: { key },
    });
    if (!row) {
        throw new Error(`Config key not found: ${key}`);
    }
    const value = row.value;
    cacheSet(key, value);
    return value;
}
async function setConfig(key, value, updatedBy) {
    const row = await prisma_1.default.admin_config.upsert({
        where: { key },
        update: {
            value,
            updated_by: updatedBy,
            updated_at: new Date(),
        },
        create: {
            key,
            value,
            updated_by: updatedBy,
            updated_at: new Date(),
        },
    });
    invalidateCache(key);
    return {
        key: row.key,
        value: row.value,
        updated_by: row.updated_by,
        updated_at: row.updated_at.toISOString(),
    };
}
async function getAllConfig() {
    const rows = await prisma_1.default.admin_config.findMany({
        orderBy: { key: 'asc' },
    });
    return rows.map((row) => ({
        key: row.key,
        value: row.value,
        updated_by: row.updated_by,
        updated_at: row.updated_at.toISOString(),
    }));
}
// Convenience helpers used by payments routes
async function getEnabledProvidersForPlatform(platform) {
    const key = platform === 'web' ? 'payment_providers_web' : 'payment_providers_app';
    return getConfig(key);
}
async function getCreditPacks(platform) {
    const key = platform === 'web' ? 'credit_packs_web' : 'credit_packs_app';
    return getConfig(key);
}
