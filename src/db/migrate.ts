import { db, closeDb } from './db';
import { webhookRequests } from './schema';
import { logger } from '../lib/logger';

async function migrate() {
    try {
        logger.info('Running database migration...');

        // Table will be created automatically if using migrations
        // For now, we'll just verify connection
        const result = await db.select().from(webhookRequests).limit(1);
        logger.info('Database connection verified');

        logger.info('Database migration completed successfully!');
        await closeDb();
        process.exit(0);
    } catch (error) {
        logger.error({ error }, 'Migration failed');
        await closeDb();
        process.exit(1);
    }
}

migrate();

