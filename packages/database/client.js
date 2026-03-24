"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
// packages/database/client.ts
const client_1 = require("@prisma/client");
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma._prismaClient ??
    (globalForPrisma._prismaClient = new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    }));
exports.default = exports.prisma;
