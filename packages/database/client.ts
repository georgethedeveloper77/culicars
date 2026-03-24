// packages/database/client.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { _prismaClient: PrismaClient };

export const prisma =
  globalForPrisma._prismaClient ??
  (globalForPrisma._prismaClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }));

export default prisma;
