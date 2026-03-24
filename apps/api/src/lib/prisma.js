"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
// apps/api/src/lib/prisma.ts
// env.ts loads dotenv before this module is used
const database_1 = require("@culicars/database");
Object.defineProperty(exports, "prisma", { enumerable: true, get: function () { return database_1.prisma; } });
exports.default = database_1.prisma;
