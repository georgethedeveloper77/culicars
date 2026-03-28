// apps/api/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
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
