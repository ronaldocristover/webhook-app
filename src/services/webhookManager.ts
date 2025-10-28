import { db } from '../db/db';
import { webhooks, type NewWebhook } from '../db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../lib/logger';
import { randomUUID } from 'crypto';

export class WebhookManager {
    async createWebhook(data: { name?: string; description?: string }) {
        try {
            const uuid = randomUUID();
            const newWebhook: NewWebhook = {
                uuid,
                name: data.name || `Webhook ${uuid.substring(0, 8)}`,
                description: data.description,
                isActive: true,
            };

            const result = await db.insert(webhooks).values(newWebhook);
            const webhookId = result[0].insertId;

            logger.info({ webhookId, uuid, name: newWebhook.name }, 'Webhook created');

            const [webhook] = await db.select().from(webhooks).where(eq(webhooks.id, Number(webhookId))).limit(1);

            return webhook;
        } catch (error) {
            logger.error({ error }, 'Error creating webhook');
            throw error;
        }
    }

    async getWebhookByUuid(uuid: string) {
        try {
            const [webhook] = await db.select().from(webhooks).where(eq(webhooks.uuid, uuid)).limit(1);
            return webhook;
        } catch (error) {
            logger.error({ error, uuid }, 'Error fetching webhook');
            throw error;
        }
    }

    async getAllWebhooks(limit: number = 100, offset: number = 0) {
        try {
            const allWebhooks = await db
                .select()
                .from(webhooks)
                .orderBy(webhooks.createdAt)
                .limit(limit)
                .offset(offset);

            return allWebhooks;
        } catch (error) {
            logger.error({ error }, 'Error fetching webhooks');
            throw error;
        }
    }

    async updateWebhookStatus(uuid: string, isActive: boolean) {
        try {
            await db
                .update(webhooks)
                .set({ isActive, updatedAt: new Date() })
                .where(eq(webhooks.uuid, uuid));

            logger.info({ uuid, isActive }, 'Webhook status updated');
        } catch (error) {
            logger.error({ error, uuid }, 'Error updating webhook status');
            throw error;
        }
    }

    async deleteWebhook(uuid: string) {
        try {
            await db.delete(webhooks).where(eq(webhooks.uuid, uuid));
            logger.info({ uuid }, 'Webhook deleted');
        } catch (error) {
            logger.error({ error, uuid }, 'Error deleting webhook');
            throw error;
        }
    }
}

