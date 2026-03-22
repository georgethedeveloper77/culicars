// apps/api/src/lib/prisma.ts
// Re-export the singleton Prisma client from the database package

import { prisma } from '@culicars/database';
export default prisma;
