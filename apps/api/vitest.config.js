"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/vitest.config.ts
const config_1 = require("vitest/config");
exports.default = (0, config_1.defineConfig)({
    test: {
        include: ['src/**/*.test.ts'],
        exclude: [
            'src/**/*.test.js',
            'src/**/*.spec.js',
            'dist/**',
            'node_modules/**',
        ],
    },
});
