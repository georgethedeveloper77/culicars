// apps/api/src/config/cors.ts
import { env } from './env';
import type { CorsOptions } from 'cors';

const allowedOrigins = [
  env.WEB_URL,                    // culicars.com
  env.ADMIN_URL,                  // admin.culicars.com
  'http://localhost:3001',        // web dev
  'http://localhost:3002',        // admin dev
  'http://localhost:8081',        // Flutter web dev
  'capacitor://localhost',        // mobile
  'http://localhost',             // mobile
];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
