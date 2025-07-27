#!/bin/bash

# Sentinel AI Docker Setup Script
set -e

echo "🚀 Setting up Sentinel AI Docker environment..."

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed. Aborting." >&2; exit 1; }

# Create required directories
echo "📁 Creating required directories..."
mkdir -p docker/ssl
mkdir -p docker/grafana/dashboards
mkdir -p docker/grafana/datasources
mkdir -p automation/n8n-workflows
mkdir -p logs

# Set executable permissions
echo "🔒 Setting permissions..."
chmod +x docker/health-check.js
chmod +x scripts/docker-setup.sh

# Create environment file if it doesn't exist
if [ ! -f .env.docker ]; then
    echo "📝 Creating Docker environment file..."
    cat > .env.docker << EOF
# Sentinel AI Docker Configuration
NODE_ENV=development

# N8N Configuration
N8N_USER=admin
N8N_PASSWORD=sentinel123
N8N_HOST=localhost
WEBHOOK_URL=http://localhost:5678/

# Monitoring
GRAFANA_USER=admin
GRAFANA_PASSWORD=admin

# Supabase (use your existing values)
VITE_SUPABASE_URL=https://zysfnkbwyhrfnpvcnptp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c2Zua2J3eWhyZm5wdmNucHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4Mjc2MTYsImV4cCI6MjA2NDQwMzYxNn0.BpnfLcLqZ9J3FP8qZ6m968i5LJkgVRl5lm2ml_VQBag
EOF
    echo "✅ Created .env.docker file with default values"
else
    echo "✅ Using existing .env.docker file"
fi

# Build and start development environment
echo "🐳 Building and starting Docker containers..."
docker-compose --env-file .env.docker up -d --build

echo "⏳ Waiting for services to be ready..."
sleep 30

# Health checks
echo "🔍 Performing health checks..."

check_service() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo "✅ $service is healthy"
            return 0
        fi
        echo "⏳ Waiting for $service (attempt $attempt/$max_attempts)..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service failed to start"
    return 1
}

# Check services
check_service "Web Application" "http://localhost:3000/health"
check_service "Redis" "http://localhost:6379" || echo "⚠️  Redis check skipped (no HTTP endpoint)"
check_service "n8n" "http://localhost:5678/healthz"
check_service "Prometheus" "http://localhost:9090/-/healthy"
check_service "Grafana" "http://localhost:3001/api/health"

echo ""
echo "🎉 Sentinel AI Docker environment is ready!"
echo ""
echo "📋 Access points:"
echo "  🌐 Web Application: http://localhost:3000"
echo "  🔄 n8n Automation: http://localhost:5678 (admin/sentinel123)"
echo "  📊 Prometheus: http://localhost:9090"
echo "  📈 Grafana: http://localhost:3001 (admin/admin)"
echo "  🔍 Redis: localhost:6379"
echo ""
echo "🛠️  Useful commands:"
echo "  📊 View logs: docker-compose logs -f"
echo "  🔄 Restart: docker-compose restart"
echo "  🛑 Stop: docker-compose down"
echo "  🗑️  Clean: docker-compose down -v"
echo ""
echo "📖 Next steps:"
echo "  1. Configure n8n workflows for automation"
echo "  2. Set up Grafana dashboards for monitoring"
echo "  3. Test the application functionality"