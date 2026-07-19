#!/bin/bash
set -e

echo "Kospintar - Setup Script"
echo "========================"

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker required. Install Docker first."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || command -v docker compose >/dev/null 2>&1 || { echo "Docker Compose required."; exit 1; }

# Copy env file
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — please edit with your keys"
fi

# Start services
echo "Starting services..."
docker compose up -d postgres redis
sleep 5

echo "Running migrations..."
docker compose run --rm api npx prisma migrate deploy
docker compose run --rm api npx prisma generate

echo "Starting all services..."
docker compose up -d

echo ""
echo "Kospintar is running!"
echo "  Frontend: http://localhost:3001"
echo "  API:      http://localhost:3000/api/health"
echo ""
