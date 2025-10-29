import { db } from '../db/db';
import { webhookRequests, type NewWebhookRequest } from '../db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../lib/logger';

export interface WebhookRequestData {
    webhookUuid: string;
    webhookId: number;
    method: string;
    path: string;
    headers: Record<string, string>;
    queryParams: Record<string, string>;
    body: any;
    rawBody: string;
    ipAddress: string;
    userAgent: string;
}

export class WebhookService {
    async saveWebhookRequest(data: WebhookRequestData): Promise<number> {
        try {
            const insertData: NewWebhookRequest = {
                webhookId: data.webhookId || 0,
                webhookUuid: data.webhookUuid,
                method: data.method,
                path: data.path,
                headers: data.headers as any,
                queryParams: data.queryParams as any,
                body: typeof data.body === 'string' ? data.body : JSON.stringify(data.body),
                rawBody: data.rawBody,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
            };

            const result = await db.insert(webhookRequests).values(insertData);
            const requestId = result[0].insertId;

            logger.info({ requestId, webhookUuid: data.webhookUuid, method: data.method, path: data.path }, 'Webhook request saved');
            return Number(requestId);
        } catch (error) {
            logger.error({ error, data }, 'Error saving webhook request');
            throw error;
        }
    }

    async getWebhookRequest(id: number) {
        try {
            const [request] = await db.select().from(webhookRequests).where(eq(webhookRequests.id, id)).limit(1);
            return request;
        } catch (error) {
            logger.error({ error, id }, 'Error fetching webhook request');
            throw error;
        }
    }

    async getAllWebhookRequests(limit: number = 100, offset: number = 0, webhookUuid?: string) {
        try {
            const query = db.select().from(webhookRequests);

            if (webhookUuid) {
                const requests = await query
                    .where(eq(webhookRequests.webhookUuid, webhookUuid))
                    .orderBy(webhookRequests.timestamp)
                    .limit(limit)
                    .offset(offset);
                return requests;
            }

            const requests = await query
                .orderBy(webhookRequests.timestamp)
                .limit(limit)
                .offset(offset);

            logger.debug({ count: requests.length, limit, offset, webhookUuid }, 'Fetched webhook requests');
            return requests;
        } catch (error) {
            logger.error({ error }, 'Error fetching webhook requests');
            throw error;
        }
    }

    async getWebhookRequestCount(): Promise<number> {
        try {
            const [result] = await db
                .select({ count: webhookRequests.id })
                .from(webhookRequests);

            return result?.count || 0;
        } catch (error) {
            logger.error({ error }, 'Error counting webhook requests');
            throw error;
        }
    }
}
