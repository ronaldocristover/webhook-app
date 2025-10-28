import { Hono } from 'hono';
import { WebhookService } from '../services/webhookService';
import { WebhookManager } from '../services/webhookManager';
import { logger } from '../lib/logger';

const app = new Hono();
const webhookService = new WebhookService();
const webhookManager = new WebhookManager();

// POST /webhook - Create a new webhook endpoint
app.post('/', async (c) => {
    try {
        const body = await c.req.json().catch(() => ({}));
        const webhook = await webhookManager.createWebhook({
            name: body.name,
            description: body.description,
        });

        return c.json({
            success: true,
            data: webhook,
            webhook_url: `${c.req.url.split('/webhook')[0]}/webhook/${webhook.uuid}`,
        }, 201);
    } catch (error: any) {
        logger.error({ error }, 'Error creating webhook');
        return c.json({
            success: false,
            error: 'Failed to create webhook',
            message: error.message,
        }, 500);
    }
});

// GET /webhook - List all webhooks
app.get('/', async (c) => {
    try {
        const limit = parseInt(c.req.query('limit') || '100', 10);
        const offset = parseInt(c.req.query('offset') || '0', 10);

        const webhooksList = await webhookManager.getAllWebhooks(limit, offset);

        return c.json({
            success: true,
            data: webhooksList,
        });
    } catch (error: any) {
        logger.error({ error }, 'Error fetching webhooks');
        return c.json({
            success: false,
            error: 'Failed to fetch webhooks',
            message: error.message,
        }, 500);
    }
});

// All requests to /:uuid - Handle webhook delivery
app.all('/:uuid', async (c) => {
    try {
        const uuid = c.req.param('uuid');

        // Check if webhook exists and is active
        const webhook = await webhookManager.getWebhookByUuid(uuid);

        if (!webhook) {
            return c.json({
                success: false,
                error: 'Webhook not found',
            }, 404);
        }

        if (!webhook.isActive) {
            return c.json({
                success: false,
                error: 'Webhook is inactive',
            }, 403);
        }

        const ipAddress =
            c.req.header('x-forwarded-for') ||
            c.req.header('x-real-ip') ||
            c.req.header('cf-connecting-ip') ||
            'unknown';

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
            webhookId: webhook.id,
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
            'Webhook delivered'
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

export default app;
