# Webhook Service

A production-ready webhook service built with Bun, Hono, and MySQL. This service allows you to create unique webhook endpoints with UUID identifiers to capture and store webhook requests with comprehensive information.

## Features

- **UUID-Based Webhook Endpoints**: Generate unique UUIDs for each webhook endpoint
- **Complete Request Logging**: Captures method, path, headers, query params, body, IP address, and user agent
- **MySQL Storage**: All webhooks are stored in a MySQL database with Drizzle ORM
- **Structured Logging**: Pino-based logging with pretty printing in development
- **Rate Limiting**: Configurable rate limiting to prevent abuse
- **Security Features**: CORS support, API key authentication for admin endpoints
- **RESTful Admin API**: View and manage stored webhooks by UUID
- **Docker Support**: Easy deployment with Docker and Docker Compose
- **GitHub Actions CI/CD**: Automated deployment pipeline

## Tech Stack

- **Runtime**: Bun
- **Framework**: Hono
- **ORM**: Drizzle ORM
- **Database**: MySQL
- **Logging**: Pino
- **Deployment**: Docker, Docker Compose
- **CI/CD**: GitHub Actions

## Quick Start

### Prerequisites

- Bun installed (https://bun.sh)
- Docker and Docker Compose (for containerized deployment)

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd webhook-app
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your configuration
```

4. Start MySQL (using Docker):
```bash
docker-compose up -d mysql
```

5. Wait for MySQL to be ready (about 10 seconds), then push database schema:
```bash
bunx drizzle-kit push
```

6. Start the development server:
```bash
bun run dev
```

The server will be running at `http://localhost:3000`

### Docker Deployment

1. Build and start all services:
```bash
docker-compose up -d
```

2. Check logs:
```bash
docker-compose logs -f webhook-app
```

3. Stop services:
```bash
docker-compose down
```

## How It Works

### 1. Use Any UUID as Your Webhook Endpoint

Simply use any identifier (UUID, name, or ID) as your webhook endpoint. There's no need to create or register webhooks first.

### 2. Send Requests to Your Webhook Endpoint

Use any identifier to send webhook requests:

```bash
# GET request
curl http://localhost:3000/webhook/my-custom-id

# POST request with JSON body
curl -X POST http://localhost:3000/webhook/my-custom-id \
  -H "Content-Type: application/json" \
  -d '{
    "event": "user.created",
    "data": {
      "id": 123,
      "name": "John Doe"
    }
  }'
```

The service will capture and store:
- HTTP method (GET, POST, PUT, DELETE, PATCH, etc.)
- Request path
- All headers
- Query parameters
- Request body (both parsed and raw)
- IP address
- User agent
- Timestamp

### 3. View Stored Requests

Get all requests for a specific webhook ID:

```bash
curl "http://localhost:3000/admin/requests?webhook_uuid=my-custom-id"
```

## API Reference

### Webhook Endpoint

#### Send Webhook Request to Any ID
```http
GET /webhook/{id}
POST /webhook/{id}
PUT /webhook/{id}
PATCH /webhook/{id}
DELETE /webhook/{id}
```

Replace `{id}` with any identifier (UUID, name, or custom ID). All HTTP methods are supported. The endpoint will capture and store the complete request including:
- HTTP method
- Path and query parameters
- Headers
- Request body (parsed and raw)
- IP address
- User agent
- Timestamp

**Examples:**
```bash
# Simple GET request
curl http://localhost:3000/webhook/order-123

# POST with JSON data
curl -X POST http://localhost:3000/webhook/order-123 \
  -H "Content-Type: application/json" \
  -d '{"status": "shipped"}'

# POST with query parameters
curl -X POST "http://localhost:3000/webhook/order-123?status=paid&amount=99.99"
```

### Admin Endpoints

**Note**: Admin endpoints require API key authentication. Include it in the header:
```bash
-H "X-API-Key: your-secret-api-key"
```

#### Get All Webhook Requests
```http
GET /admin/requests?limit=100&offset=0
```

#### Get Requests for Specific Webhook
```http
GET /admin/requests?webhook_uuid={uuid}&limit=100&offset=0
```

#### Get Specific Request by ID
```http
GET /admin/requests/{id}
```

#### Get Statistics
```http
GET /admin/stats
```

Response:
```json
{
  "success": true,
  "data": {
    "totalWebhooks": 150
  }
}
```

### Other Endpoints

#### Service Information
```http
GET /
```

#### Health Check
```http
GET /health
```

## Configuration

Environment variables (`.env`):

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=webhook_user
DB_PASSWORD=webhook_password
DB_NAME=webhook_db

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Security
ALLOWED_ORIGINS=http://localhost:3000
API_KEY=your-secret-api-key-change-in-production

# Logging
LOG_LEVEL=debug
```

## Database Schema

### webhooks Table
Stores webhook endpoint metadata:
- `id`: Auto-increment primary key
- `uuid`: Unique UUID for the webhook endpoint
- `name`: Webhook name (optional)
- `description`: Webhook description (optional)
- `isActive`: Whether the webhook is active
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### webhook_requests Table
Stores individual webhook requests:
- `id`: Auto-increment primary key
- `webhookId`: Reference to webhooks table
- `webhookUuid`: UUID of the webhook
- `method`: HTTP method
- `path`: Request path
- `headers`: JSON object of all headers
- `queryParams`: JSON object of query parameters
- `body`: Parsed request body
- `rawBody`: Raw request body
- `ipAddress`: Client IP address
- `userAgent`: User agent string
- `timestamp`: Request timestamp
- `createdAt`: Record creation timestamp

## Security Features

1. **Rate Limiting**: Prevents abuse with configurable limits
   - Default: 100 requests per minute per IP
   - Configurable via `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW_MS`

2. **API Key Authentication**: Required for admin endpoints
   - Set in `API_KEY` environment variable
   - Include in header: `X-API-Key: your-key`

3. **CORS Support**: Configurable allowed origins
   - Set in `ALLOWED_ORIGINS` environment variable

4. **IP Tracking**: Captures real client IP from various headers
   - Checks `x-forwarded-for`, `x-real-ip`, `cf-connecting-ip`

5. **Webhook Status**: Can deactivate webhooks without deleting them

## Development

### Scripts

```bash
bun run dev          # Start development server with hot reload
bun run start        # Start production server
bun run build        # Build the application
bun run db:push      # Push database schema changes
bun run db:generate  # Generate database migrations
bun run db:studio    # Open Drizzle Studio (database GUI)
```

### Project Structure

```
webhook-app/
├── src/
│   ├── config.ts              # Configuration management
│   ├── index.ts                # Main server entry point
│   ├── lib/
│   │   └── logger.ts          # Pino logger setup
│   ├── db/
│   │   ├── schema.ts          # Drizzle database schema
│   │   ├── db.ts              # Database connection
│   │   └── migrate.ts         # Database migrations
│   ├── middleware/
│   │   ├── rateLimiter.ts     # Rate limiting middleware
│   │   └── security.ts        # Security middleware
│   ├── routes/
│   │   ├── webhook.ts          # Webhook endpoints
│   │   └── admin.ts            # Admin API endpoints
│   └── services/
│       ├── webhookService.ts   # Request storage logic
│       └── webhookManager.ts   # Webhook management
├── src/db/migrations/          # Auto-generated migrations
├── Dockerfile
├── docker-compose.yml
├── drizzle.config.ts
├── .github/
│   └── workflows/
│       ├── deploy.yml           # Deployment workflow
│       └── docker-build.yml      # Docker build workflow
├── package.json
├── tsconfig.json
└── README.md
```

### Running Tests

```bash
# Check health
curl http://localhost:3000/health

# Create a webhook
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"Testing"}'

# Send a webhook request (replace UUID)
curl -X POST http://localhost:3000/webhook/{uuid} \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# View requests (replace UUID and add API key if needed)
curl "http://localhost:3000/admin/requests?webhook_uuid={uuid}"
```

## Deployment

### GitHub Actions

The service includes GitHub Actions workflows for CI/CD:

1. **Test Workflow** (`.github/workflows/deploy.yml`):
   - Runs on every push and pull request
   - Tests the application with MySQL service
   - Runs database migrations
   - Lints the code

2. **Docker Build Workflow** (`.github/workflows/docker-build.yml`):
   - Builds Docker images on push to main or tags
   - Pushes to GitHub Container Registry
   - Automatically tags images with version information

3. **Deploy Workflow**:
   - Deploys to production on push to main
   - Builds Docker image
   - Transfers image to production server
   - Runs database migrations
   - Restarts services

### Required Secrets

Set the following secrets in your GitHub repository:

- `DEPLOY_HOST`: Production server IP or hostname
- `DEPLOY_USER`: SSH username for deployment
- `DEPLOY_KEY`: Private SSH key for deployment
- `DEPLOY_PATH`: (Optional) Deployment path on server (default: `/opt/webhook-app`)
- `DOCKER_USERNAME`: (Optional) Docker Hub username
- `DOCKER_PASSWORD`: (Optional) Docker Hub password

### Manual Deployment

1. Build Docker image:
```bash
docker build -t webhook-app .
```

2. Run with Docker Compose:
```bash
docker-compose up -d
```

## Monitoring

- Health check: `GET /health`
- Check logs: `docker-compose logs -f webhook-app` or view `webhook-server.log`
- View statistics: `GET /admin/stats`
- Logs are structured JSON with Pino, pretty-printed in development

## Logging

The service uses Pino for structured logging. Log levels in development vs production:

- **Development**: Pretty-printed, colorized logs with debug level
- **Production**: JSON logs, info level by default

Configure log level via `LOG_LEVEL` environment variable:
- `debug`: Detailed debug information
- `info`: General information (default)
- `warn`: Warning messages
- `error`: Error messages only

## Examples

### Example 1: Order Notifications

```bash
# Create webhook for order notifications
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Order Notifications",
    "description": "Receive order status updates"
  }'

# Response contains UUID: "abc-123-..."
# Send order notification
curl -X POST http://localhost:3000/webhook/abc-123-... \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": 12345,
    "status": "shipped",
    "timestamp": "2025-10-28T10:00:00Z"
  }'
```

### Example 2: Payment Webhooks

```bash
# Create payment webhook
curl -X POST http://localhost:3000/webhook \
  -d '{"name": "Stripe Webhooks"}'

# Stripe sends notification to your UUID endpoint
# Your server captures: headers (Stripe signature), body, IP, etc.
```

### Example 3: View Webhook History

```bash
# Get last 50 requests for a webhook
curl "http://localhost:3000/admin/requests?webhook_uuid=abc-123-...&limit=50&offset=0"
```

## Troubleshooting

### Database Connection Issues
```bash
# Check MySQL is running
docker-compose ps mysql

# View MySQL logs
docker-compose logs mysql

# Test connection
mysql -h localhost -u webhook_user -p webhook_db
```

### Port Already in Use
```bash
# Use a different port
PORT=3001 bun run dev
```

### Schema Changes
```bash
# Push new schema to database
bunx drizzle-kit push

# Generate migration files
bunx drizzle-kit generate
```

## License

MIT
