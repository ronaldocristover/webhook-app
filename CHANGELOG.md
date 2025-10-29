# Changelog

## [Unreleased] - Complete Webhook Service

### Added
- **UUID-based webhook endpoints** - Direct `/:uuid` pattern for webhook delivery
- **IP Detection System** - Comprehensive IP detection from multiple headers:
  - X-Forwarded-For (with support for multiple IPs)
  - X-Real-IP
  - CF-Connecting-IP
  - X-Client-IP
  - True-Client-IP
  - Fallback to 127.0.0.1 for localhost
- **Drizzle ORM Integration** - Type-safe database operations
- **Structured Logging** - Pino logger with pretty printing in development
- **E2E Test Suite** - Comprehensive tests covering:
  - All HTTP methods (GET, POST, PUT, PATCH, DELETE)
  - JSON, form data, and text bodies
  - Custom headers and IP detection
  - Concurrent requests
  - Error handling
- **Multi-stage Dockerfile** - Optimized production builds with:
  - Separate builder, deps, and app stages
  - Non-root user for security
  - Health checks
  - Minimal image size
- **Enhanced Docker Compose** - Production-ready configuration with:
  - Health checks for MySQL and webhook-app
  - Custom bridge network
  - Volume management for logs
  - Environment variable support
  - Automatic migrations on startup
- **GitHub Actions CI/CD** - Automated testing and deployment:
  - Test workflow with MySQL service
  - Docker build workflow
  - Deployment automation
- **Admin API** - View and filter webhook requests:
  - GET /admin/requests - List all requests
  - GET /admin/requests?webhook_uuid=xxx - Filter by UUID
  - GET /admin/requests/:id - Get specific request
  - GET /admin/stats - Get statistics

### Changed
- **Database Schema** - Expanded webhook_uuid column to VARCHAR(500) for longer IDs
- **Removed webhook registration** - Now accepts any UUID without pre-registration
- **Improved error handling** - Better error messages and logging
- **Rate limiting** - Configurable via environment variables
- **Security middleware** - Enhanced CORS and API key authentication

### Fixed
- IP detection now properly captures real client IPs
- Long UUID support in database
- Proper handling of all HTTP methods
- Query parameter parsing
- Body parsing for different content types

### Removed
- Unused webhookManager service
- Console.log statements (replaced with structured logging)
- Complex webhook creation workflow

### Documentation
- Complete README with setup instructions
- API documentation with examples
- GitHub Actions deployment guide
- Troubleshooting section
- Environment variables documentation

### Technical Details
- **Stack**: Bun, Hono, Drizzle ORM, MySQL, Pino
- **Container**: Multi-stage Docker builds
- **Logging**: Structured JSON logs with Pino
- **Testing**: Bun test framework with E2E suite
- **CI/CD**: GitHub Actions workflows
- **Security**: Rate limiting, API key auth, CORS

### Files Modified
- src/index.ts - Added direct /:uuid endpoint with IP detection
- src/services/webhookService.ts - Updated to store requests with improved IP detection
- src/db/schema.ts - Expanded UUID field
- src/lib/logger.ts - Enhanced with proper configuration
- src/routes/webhook.ts - Simplified to only handle /:uuid
- src/routes/admin.ts - Added UUID filtering
- Dockerfile - Multi-stage build
- docker-compose.yml - Enhanced configuration
- package.json - Added test scripts
- README.md - Comprehensive documentation
- .github/workflows/* - CI/CD pipelines

