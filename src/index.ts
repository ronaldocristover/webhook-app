import { Hono } from 'hono';
import { config } from './config';
import { logger } from './lib/logger';
import { rateLimiter } from './middleware/rateLimiter';
import { corsMiddleware, apiKeyAuth } from './middleware/security';
import { WebhookService } from './services/webhookService';
import { checkDbConnection } from './db/db';
import webhookRoutes from './routes/webhook';
import adminRoutes from './routes/admin';

const app = new Hono();
const webhookService = new WebhookService();

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
            root_endpoint: '/{uuid}',
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

// Direct webhook endpoint at root level (/:uuid)
app.all('/:uuid', async (c) => {
    try {
        const uuid = c.req.param('uuid');

        // Skip if it's a known route
        if (uuid === 'admin' || uuid === 'health' || uuid === 'webhook' || uuid === 'favicon.ico') {
            return;
        }

        // Get IP from various sources with improved detection
        let ipAddress = '';

        // Try x-forwarded-for first
        const forwardedFor = c.req.header('x-forwarded-for');
        if (forwardedFor) {
            // Handle multiple IPs (from proxies)
            ipAddress = forwardedFor.includes(',')
                ? forwardedFor.split(',')[0].trim()
                : forwardedFor.trim();
        }

        // Fallback to other proxy headers
        if (!ipAddress) {
            ipAddress = c.req.header('x-real-ip') ||
                c.req.header('cf-connecting-ip') ||
                c.req.header('x-client-ip') ||
                c.req.header('true-client-ip') ||
                '';
        }

        // For Bun/Hono, try to get from request connection
        if (!ipAddress || ipAddress === '' || ipAddress === 'unknown') {
            // Try to extract from request URL if available
            const host = c.req.header('host');
            if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
                ipAddress = host;
            }
        }

        // Final fallback
        if (!ipAddress || ipAddress === '' || ipAddress === 'unknown') {
            // Log all headers for debugging
            const allHeaders: Record<string, string> = {};
            c.req.raw.headers.forEach((value, key) => {
                allHeaders[key] = value;
            });
            logger.debug({ headers: allHeaders }, 'No IP detected, using fallback');
            ipAddress = '127.0.0.1';
        }

        const userAgent = c.req.header('user-agent') || 'unknown';
        const path = c.req.path;
        const method = c.req.method;
        const headers: Record<string, string> = {};
        const queryParams: Record<string, string> = {};

        c.req.raw.headers.forEach((value, key) => {
            headers[key] = value;
        });

        new URL(c.req.url).searchParams.forEach((value, key) => {
            queryParams[key] = value;
        });

        const contentType = c.req.header('content-type') || '';
        let body = null;
        let rawBody = '';

        if (method !== 'GET' && method !== 'HEAD') {
            try {
                if (contentType.includes('application/json')) {
                    body = await c.req.json();
                    rawBody = JSON.stringify(body);
                } else if (contentType.includes('application/x-www-form-urlencoded')) {
                    body = await c.req.parseBody();
                    rawBody = new URLSearchParams(body as any).toString();
                } else {
                    rawBody = await c.req.text();
                    body = rawBody;
                }
            } catch (error) {
                logger.warn({ error }, 'Unable to parse request body');
                rawBody = 'Unable to parse body';
                body = null;
            }
        }

        const requestId = await webhookService.saveWebhookRequest({
            webhookUuid: uuid,
            webhookId: 0,
            method,
            path,
            headers,
            queryParams,
            body,
            rawBody,
            ipAddress,
            userAgent,
        });

        logger.info(
            { requestId, uuid, method, path, ipAddress },
            'Webhook request stored'
        );

        return c.json({
            success: true,
            message: 'Webhook received',
            requestId,
            method,
            path,
            webhook_uuid: uuid,
        }, 201);
    } catch (error: any) {
        logger.error({ error }, 'Error processing webhook');
        return c.json({
            success: false,
            error: 'Failed to process webhook',
            message: error.message,
        }, 500);
    }
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

async function startServer() {
    logger.info({ port: config.port, env: config.env }, 'Webhook service starting');

    // Check database connection
    logger.info('Checking database connection...');
    const dbConnected = await checkDbConnection();

    if (!dbConnected) {
        logger.error('Failed to connect to database. Exiting...');
        process.exit(1);
    }

    logger.info(`Server is running on http://localhost:${config.port}`);
    logger.info(`Environment: ${config.env}`);
    logger.info(`Webhook endpoint: http://localhost:${config.port}/webhook`);
    logger.info(`Root webhook endpoint: http://localhost:${config.port}/{uuid}`);
    logger.info(`Admin endpoint: http://localhost:${config.port}/admin`);

    return {
        port: config.port,
        fetch: app.fetch,
    };
}

const port = config.port;

export default await startServer();
