import { Hono } from 'hono';
import { WebhookService } from '../services/webhookService';
import { logger } from '../lib/logger';

const app = new Hono();
const webhookService = new WebhookService();

app.get('/requests/:uuid', async (c) => {
    try {
        const uuid = c.req.param('uuid');
        const limit = parseInt(c.req.query('limit') || '100', 10);
        const offset = parseInt(c.req.query('offset') || '0', 10);

        const requests = await webhookService.getAllWebhookRequests(limit, offset, uuid);
        const totalCount = await webhookService.getWebhookRequestCount();

        return c.json({
            success: true,
            data: requests,
            webhook_uuid: uuid,
            pagination: {
                total: totalCount,
                limit,
                offset,
                hasMore: (offset + limit) < totalCount,
            },
        });
    } catch (error: any) {
        logger.error({ error }, 'Error fetching webhook requests by UUID');
        return c.json({
            success: false,
            error: 'Failed to fetch webhook requests',
            message: error.message,
        }, 500);
    }
});

app.get('/requests', async (c) => {
    try {
        const limit = parseInt(c.req.query('limit') || '100', 10);
        const offset = parseInt(c.req.query('offset') || '0', 10);

        const requests = await webhookService.getAllWebhookRequests(limit, offset);
        const totalCount = await webhookService.getWebhookRequestCount();

        return c.json({
            success: true,
            data: requests,
            pagination: {
                total: totalCount,
                limit,
                offset,
                hasMore: (offset + limit) < totalCount,
            },
        });
    } catch (error: any) {
        logger.error({ error }, 'Error fetching webhook requests');
        return c.json({
            success: false,
            error: 'Failed to fetch webhook requests',
            message: error.message,
        }, 500);
    }
});

app.get('/requests/:id', async (c) => {
    try {
        const id = parseInt(c.req.param('id'), 10);
        const request = await webhookService.getWebhookRequest(id);

        if (!request) {
            return c.json({
                success: false,
                error: 'Webhook request not found',
            }, 404);
        }

        return c.json({
            success: true,
            data: request,
        });
    } catch (error: any) {
        const requestId = c.req.param('id');
        logger.error({ error, requestId }, 'Error fetching webhook request');
        return c.json({
            success: false,
            error: 'Failed to fetch webhook request',
            message: error.message,
        }, 500);
    }
});

app.get('/stats', async (c) => {
    try {
        const totalCount = await webhookService.getWebhookRequestCount();

        logger.debug({ totalCount }, 'Stats requested');
        return c.json({
            success: true,
            data: {
                totalWebhooks: totalCount,
            },
        });
    } catch (error: any) {
        logger.error({ error }, 'Error fetching stats');
        return c.json({
            success: false,
            error: 'Failed to fetch stats',
            message: error.message,
        }, 500);
    }
});

export default app;
