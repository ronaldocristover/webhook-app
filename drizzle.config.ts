import type { Config } from 'drizzle-kit';

export default {
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
    dialect: 'mysql',
    dbCredentials: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        user: process.env.DB_USER || 'webhook_user',
        password: process.env.DB_PASSWORD || 'webhook_password',
        database: process.env.DB_NAME || 'webhook_db',
    },
} satisfies Config;
