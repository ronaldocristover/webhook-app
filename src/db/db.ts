import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { config } from '../config';
import { logger } from '../lib/logger';
import * as schema from './schema';

const connection = mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});

export const db = drizzle(connection, { schema, mode: 'default', logger: config.env === 'development' });

export async function closeDb() {
    await connection.end();
}

