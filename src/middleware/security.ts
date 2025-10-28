import { Context, Next } from 'hono';
import { config } from '../config';

export function corsMiddleware() {
    return async (c: Context, next: Next) => {
        const origin = c.req.header('Origin');

        if (origin && config.security.allowedOrigins.includes(origin)) {
            c.res.headers.set('Access-Control-Allow-Origin', origin);
            c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
            c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
            c.res.headers.set('Access-Control-Max-Age', '86400');
        }

        if (c.req.method === 'OPTIONS') {
            return c.text('', 204);
        }

        return next();
    };
}

export function apiKeyAuth() {
    return async (c: Context, next: Next) => {
        const providedKey = c.req.header('x-api-key');

        if (!config.security.apiKey) {
            return next();
        }

        if (!providedKey || providedKey !== config.security.apiKey) {
            return c.json({ error: 'Invalid or missing API key' }, 401);
        }

        return next();
    };
}

