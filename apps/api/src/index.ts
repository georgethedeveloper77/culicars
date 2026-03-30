import 'dotenv/config';
// apps/api/src/index.ts
// Server entry — starts Express, handles graceful shutdown

import { env } from './config/env';
import app from './app';
import { prisma } from './lib/prisma';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log(`\n🚗 CuliCars API running on port ${PORT}`);
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Search: http://localhost:${PORT}/search?q=KCA123A\n`);
});

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('✅ Database disconnected. Goodbye.');
    process.exit(0);
  });

  // Force kill after 10s
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after 10s timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
