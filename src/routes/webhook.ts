import { Hono } from 'hono';
import { WebhookService } from '../services/webhookService';
import { logger } from '../lib/logger';

const app = new Hono();
const webhookService = new WebhookService();

app.all('/:uuid', async (c) => {
    try {
        const uuid = c.req.param('uuid');

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
            webhookId: 0, // Not using webhook management table
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

export default app;
