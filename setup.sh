#!/bin/bash

echo "Setting up Webhook Service..."

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp env.example .env
    echo "Please edit .env file with your configuration"
fi

# Install dependencies
echo "Installing dependencies with Bun..."
bun install

# Check if MySQL is running
echo "Checking for MySQL..."

# Run migrations (will fail if MySQL is not ready, but that's okay)
echo "Running database migrations..."
bun run db:migrate || echo "Warning: Could not run migrations. Make sure MySQL is running."

echo "Setup complete!"
echo "Run 'docker-compose up -d' to start the service with Docker,"
echo "or 'bun run dev' to start in development mode."

