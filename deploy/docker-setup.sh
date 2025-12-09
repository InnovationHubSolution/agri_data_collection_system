#!/bin/bash

echo "🐳 Agriculture Data System - Docker Deployment"
echo "=============================================="

# Create docker-compose.yml
cat > docker-compose.yml <<'DOCKER_EOF'
version: '3.8'

services:
  postgres:
    image: postgis/postgis:14-3.3
    container_name: agriculture-db
    environment:
      POSTGRES_DB: agriculture_db
      POSTGRES_USER: agri_user
      POSTGRES_PASSWORD: ${DB_PASSWORD:-change_this_password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    networks:
      - agriculture-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U agri_user -d agriculture_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: agriculture-api
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: agriculture_db
      DB_USER: agri_user
      DB_PASSWORD: ${DB_PASSWORD:-change_this_password}
      PORT: 3000
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - agriculture-network
    restart: unless-stopped
    volumes:
      - ./server/data:/app/server/data

  nginx:
    image: nginx:alpine
    container_name: agriculture-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./index.html:/usr/share/nginx/html/index.html:ro
      - ./dashboard:/usr/share/nginx/html/dashboard:ro
      - ./style.css:/usr/share/nginx/html/style.css:ro
      - ./main.js:/usr/share/nginx/html/main.js:ro
      - ./database.js:/usr/share/nginx/html/database.js:ro
      - ./manifest.json:/usr/share/nginx/html/manifest.json:ro
      - ./sw.js:/usr/share/nginx/html/sw.js:ro
    depends_on:
      - api
    networks:
      - agriculture-network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  agriculture-network:
    driver: bridge
DOCKER_EOF

# Create Dockerfile
cat > Dockerfile <<'DOCKERFILE_EOF'
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && \
    npm install pg pg-format jsonwebtoken

# Copy application files
COPY server/ ./server/
COPY *.js ./
COPY *.json ./
COPY *.html ./

# Create data directory
RUN mkdir -p /app/server/data

EXPOSE 3000

CMD ["node", "server/server-postgres.js"]
DOCKERFILE_EOF

# Create nginx.conf
cat > nginx.conf <<'NGINX_EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    sendfile on;
    keepalive_timeout 65;
    client_max_body_size 50M;

    upstream api_backend {
        server api:3000;
    }

    server {
        listen 80;
        server_name _;

        root /usr/share/nginx/html;
        index index.html;

        # Mobile app
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API proxy
        location /api/ {
            proxy_pass http://api_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_cache_bypass $http_upgrade;
        }

        # Dashboard
        location /dashboard {
            alias /usr/share/nginx/html/dashboard;
            try_files $uri $uri/ /dashboard/index.html;
        }
    }
}
NGINX_EOF

# Create .env file
if [ ! -f .env ]; then
    cat > .env <<ENV_EOF
DB_PASSWORD=$(openssl rand -base64 16)
JWT_SECRET=$(openssl rand -hex 32)
ENV_EOF
    echo "✅ Created .env file with random credentials"
fi

# Create backup script
cat > backup-docker.sh <<'BACKUP_DOCKER_EOF'
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="./backups/agriculture_db_$TIMESTAMP.sql.gz"

mkdir -p ./backups

docker exec agriculture-db pg_dump -U agri_user agriculture_db | gzip > $BACKUP_FILE

find ./backups -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
BACKUP_DOCKER_EOF

chmod +x backup-docker.sh

echo ""
echo "📦 Docker setup complete!"
echo ""
echo "🚀 To start the system:"
echo "   docker-compose up -d"
echo ""
echo "📊 To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 To stop the system:"
echo "   docker-compose down"
echo ""
echo "💾 To backup database:"
echo "   ./backup-docker.sh"
echo ""
echo "🔐 Your credentials are in .env file"
echo ""
