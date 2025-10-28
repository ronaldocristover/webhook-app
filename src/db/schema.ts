import { mysqlTable, int, varchar, json, text, timestamp, index } from 'drizzle-orm/mysql-core';

export const webhooks = mysqlTable(
    'webhooks',
    {
        id: int('id').primaryKey().autoincrement(),
        uuid: varchar('uuid', { length: 36 }).notNull().unique(),
        name: varchar('name', { length: 255 }),
        description: text('description'),
        isActive: int('is_active', { mode: 'boolean' }).default(true).notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    },
    (table) => ({
        uuidIdx: index('idx_uuid').on(table.uuid),
        isActiveIdx: index('idx_is_active').on(table.isActive),
    })
);

export const webhookRequests = mysqlTable(
    'webhook_requests',
    {
        id: int('id').primaryKey().autoincrement(),
        webhookId: int('webhook_id').notNull(),
        webhookUuid: varchar('webhook_uuid', { length: 36 }).notNull(),
        method: varchar('method', { length: 10 }).notNull(),
        path: varchar('path', { length: 500 }).notNull(),
        headers: json('headers'),
        queryParams: json('query_params'),
        body: text('body'),
        rawBody: text('raw_body'),
        ipAddress: varchar('ip_address', { length: 45 }),
        userAgent: varchar('user_agent', { length: 500 }),
        timestamp: timestamp('timestamp').defaultNow().notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (table) => ({
        timestampIdx: index('idx_timestamp').on(table.timestamp),
        webhookUuidIdx: index('idx_webhook_uuid').on(table.webhookUuid),
        webhookIdIdx: index('idx_webhook_id').on(table.webhookId),
    })
);

export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;
export type WebhookRequest = typeof webhookRequests.$inferSelect;
export type NewWebhookRequest = typeof webhookRequests.$inferInsert;

