"use strict";
// apps/api/src/index.ts
// Server entry — starts Express, handles graceful shutdown
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./config/env");
const app_1 = __importDefault(require("./app"));
const prisma_1 = __importDefault(require("./lib/prisma"));
const PORT = env_1.env.PORT;
const server = app_1.default.listen(PORT, () => {
    console.log(`\n🚗 CuliCars API running on port ${PORT}`);
    console.log(`   Environment: ${env_1.env.NODE_ENV}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   Search: http://localhost:${PORT}/search?q=KCA123A\n`);
});
// Graceful shutdown
async function shutdown(signal) {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
        await prisma_1.default.$disconnect();
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
