import { Context, Next } from 'hono';
import { config } from '../config';

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

const store: RateLimitStore = {};

export function rateLimiter() {
    return async (c: Context, next: Next) => {
        const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
        const now = Date.now();
        const windowMs = config.rateLimit.windowMs;

        if (!store[ip] || now > store[ip].resetTime) {
            store[ip] = {
                count: 1,
                resetTime: now + windowMs,
            };
            return next();
        }

        if (store[ip].count >= config.rateLimit.maxRequests) {
            return c.json(
                { error: 'Rate limit exceeded. Please try again later.' },
                429
            );
        }

        store[ip].count++;

        c.header('X-RateLimit-Limit', config.rateLimit.maxRequests.toString());
        c.header('X-RateLimit-Remaining', Math.max(0, config.rateLimit.maxRequests - store[ip].count).toString());
        c.header('X-RateLimit-Reset', new Date(store[ip].resetTime).toISOString());

        return next();
    };
}

