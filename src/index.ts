import { Hono } from 'hono';
import { config } from './config';
import { logger } from './lib/logger';
import { rateLimiter } from './middleware/rateLimiter';
import { corsMiddleware, apiKeyAuth } from './middleware/security';
import webhookRoutes from './routes/webhook';
import adminRoutes from './routes/admin';

const app = new Hono();

app.use('*', async (c, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;

    c.res.headers.set('X-Response-Time', `${ms}ms`);
    logger.info({ method: c.req.method, path: c.req.path, status: c.res.status, ms }, 'Request processed');
});

app.use('*', corsMiddleware());
app.use('/webhook', rateLimiter());
app.use('/admin', apiKeyAuth());

app.get('/', (c) => {
    return c.json({
        service: 'Webhook Service',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            webhook: '/webhook',
            admin: '/admin',
        },
    });
});

app.get('/health', (c) => {
    return c.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
    });
});

app.route('/webhook', webhookRoutes);
app.route('/admin', adminRoutes);

app.notFound((c) => {
    logger.warn({ path: c.req.path }, 'Route not found');
    return c.json({ error: 'Not Found' }, 404);
});

app.onError((err, c) => {
    logger.error({ error: err, method: c.req.method, path: c.req.path }, 'Unhandled error');
    return c.json({ error: 'Internal Server Error' }, 500);
});

const port = config.port;

export default {
    port,
    fetch: app.fetch,
};

logger.info({ port, env: config.env }, 'Webhook service starting');
logger.info(`Server is running on http://localhost:${port}`);
logger.info(`Environment: ${config.env}`);
logger.info(`Webhook endpoint: http://localhost:${port}/webhook`);
logger.info(`Admin endpoint: http://localhost:${port}/admin`);
