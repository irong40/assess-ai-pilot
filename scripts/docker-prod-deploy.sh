#!/bin/bash

# Sentinel AI Production Deployment Script
set -e

echo "🚀 Deploying Sentinel AI to production..."

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed. Aborting." >&2; exit 1; }

# Check if production environment file exists
if [ ! -f .env.prod ]; then
    echo "❌ .env.prod file not found. Creating template..."
    cat > .env.prod << EOF
# Sentinel AI Production Configuration
NODE_ENV=production

# Application
VITE_SUPABASE_URL=https://zysfnkbwyhrfnpvcnptp.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# N8N Configuration
N8N_USER=admin
N8N_PASSWORD=CHANGE_THIS_SECURE_PASSWORD
N8N_HOST=n8n.yourdomain.com
WEBHOOK_URL=https://n8n.yourdomain.com/

# Monitoring
GRAFANA_USER=admin
GRAFANA_PASSWORD=CHANGE_THIS_SECURE_PASSWORD

# SSL/TLS (if using custom certificates)
SSL_CERT_PATH=/etc/ssl/certs/sentinel-ai.crt
SSL_KEY_PATH=/etc/ssl/private/sentinel-ai.key
EOF
    echo "❌ Please configure .env.prod with your production values and run again."
    exit 1
fi

# Source production environment
source .env.prod

# Validate required environment variables
if [ -z "$N8N_PASSWORD" ] || [ "$N8N_PASSWORD" = "CHANGE_THIS_SECURE_PASSWORD" ]; then
    echo "❌ Please set a secure N8N_PASSWORD in .env.prod"
    exit 1
fi

if [ -z "$GRAFANA_PASSWORD" ] || [ "$GRAFANA_PASSWORD" = "CHANGE_THIS_SECURE_PASSWORD" ]; then
    echo "❌ Please set a secure GRAFANA_PASSWORD in .env.prod"
    exit 1
fi

# Create SSL directory if it doesn't exist
mkdir -p docker/ssl

# Check for SSL certificates in production
if [ "$NODE_ENV" = "production" ] && [ ! -f "docker/ssl/sentinel-ai.crt" ]; then
    echo "⚠️  SSL certificates not found. Setting up self-signed certificates for testing..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout docker/ssl/sentinel-ai.key \
        -out docker/ssl/sentinel-ai.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    echo "⚠️  Self-signed certificates created. Replace with proper certificates for production!"
fi

# Build production images
echo "🔨 Building production Docker images..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod build --no-cache

# Pull latest images
echo "⬇️  Pulling latest base images..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod pull

# Start production services
echo "🚀 Starting production services..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

echo "⏳ Waiting for services to be ready..."
sleep 60

# Health checks for production
echo "🔍 Performing production health checks..."

check_service() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s -f -k "$url" > /dev/null 2>&1; then
            echo "✅ $service is healthy"
            return 0
        fi
        echo "⏳ Waiting for $service (attempt $attempt/$max_attempts)..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service failed to start"
    docker-compose -f docker-compose.prod.yml logs "$service"
    return 1
}

# Check production services
check_service "web" "https://localhost/health"
check_service "nginx-proxy" "http://localhost:8080/health"

echo ""
echo "🎉 Sentinel AI production deployment complete!"
echo ""
echo "📋 Production access points:"
echo "  🌐 Web Application: https://localhost (or your domain)"
echo "  🔄 n8n Automation: Internal access only"
echo "  📊 Prometheus: Internal monitoring"
echo "  📈 Grafana: Internal monitoring"
echo "  🔍 Reverse Proxy: http://localhost:8080"
echo ""
echo "🔒 Security notes:"
echo "  ✅ SSL/TLS enabled"
echo "  ✅ Security headers configured"
echo "  ✅ Rate limiting enabled"
echo "  ✅ CORS policies enforced"
echo ""
echo "🛠️  Production commands:"
echo "  📊 View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  🔄 Restart: docker-compose -f docker-compose.prod.yml restart"
echo "  📈 Scale web: docker-compose -f docker-compose.prod.yml up -d --scale web=3"
echo "  🛑 Stop: docker-compose -f docker-compose.prod.yml down"
echo ""
echo "📖 Post-deployment checklist:"
echo "  1. Configure proper SSL certificates"
echo "  2. Set up monitoring alerts"
echo "  3. Configure backup procedures"
echo "  4. Test all functionality"
echo "  5. Update DNS records"