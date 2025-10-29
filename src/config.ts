interface Config {
    port: number;
    env: string;
    db: {
        host: string;
        port: number;
        user: string;
        password: string;
        name: string;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    security: {
        allowedOrigins: string[];
        apiKey: string;
    };
}

function loadConfig(): Config {
    const env = process.env.NODE_ENV || 'development';

    return {
        port: parseInt(process.env.PORT || '3000', 10),
        env,
        db: {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306', 10),
            user: process.env.DB_USER || 'webhook_user',
            password: process.env.DB_PASSWORD || 'webhook_password',
            name: process.env.DB_NAME || 'webhook_db',
        },
        rateLimit: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
            maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
        },
        security: {
            allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean),
            apiKey: process.env.API_KEY || '',
        },
    };
}

export const config = loadConfig();

