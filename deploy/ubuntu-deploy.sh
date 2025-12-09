#!/bin/bash

echo "🚀 Agriculture Data System - Ubuntu VPS Deployment Script"
echo "=========================================================="

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 14 with PostGIS
echo "📦 Installing PostgreSQL with PostGIS..."
sudo apt install -y postgresql-14 postgresql-contrib-14 postgis postgresql-14-postgis-3

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Create database and user
echo "🗄️  Setting up PostgreSQL database..."
sudo -u postgres psql <<EOF
CREATE DATABASE agriculture_db;
CREATE USER agri_user WITH ENCRYPTED PASSWORD 'change_this_password';
GRANT ALL PRIVILEGES ON DATABASE agriculture_db TO agri_user;
\c agriculture_db
CREATE EXTENSION IF NOT EXISTS postgis;
EOF

# Create application directory
APP_DIR="/var/www/agriculture-system"
echo "📁 Creating application directory at $APP_DIR..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Clone or copy application files
echo "📥 Setting up application files..."
# If using git:
# git clone <your-repo-url> $APP_DIR
# Or copy files manually

# Navigate to app directory
cd $APP_DIR

# Install dependencies
echo "📦 Installing application dependencies..."
npm install
npm install pg pg-format jsonwebtoken

# Create .env file
echo "⚙️  Creating environment configuration..."
cat > .env <<EOL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agriculture_db
DB_USER=agri_user
DB_PASSWORD=change_this_password
PORT=3000
NODE_ENV=production
JWT_SECRET=$(openssl rand -hex 32)
EOL

# Set permissions
chmod 600 .env

# Setup PM2
echo "🔧 Setting up PM2 process manager..."
pm2 start server/server-postgres.js --name agriculture-api
pm2 save
pm2 startup

# Configure Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/agriculture-system > /dev/null <<'NGINX_EOF'
server {
    listen 80;
    server_name your-domain.com;  # Change this to your domain

    client_max_body_size 50M;

    # Serve static files
    location / {
        root /var/www/agriculture-system;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # Dashboard
    location /dashboard/ {
        root /var/www/agriculture-system;
        try_files $uri $uri/ /dashboard/index.html;
    }
}
NGINX_EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/agriculture-system /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# Setup firewall
echo "🔒 Configuring firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw --force enable

# Setup SSL with Let's Encrypt (optional but recommended)
echo "🔐 Would you like to setup SSL certificate? (y/n)"
read -r setup_ssl
if [ "$setup_ssl" = "y" ]; then
    sudo apt install -y certbot python3-certbot-nginx
    echo "Enter your domain name:"
    read -r domain_name
    sudo certbot --nginx -d $domain_name
fi

# Setup database backups
echo "💾 Setting up automated database backups..."
sudo mkdir -p /var/backups/agriculture-db
sudo chown postgres:postgres /var/backups/agriculture-db

# Create backup script
sudo tee /usr/local/bin/backup-agriculture-db.sh > /dev/null <<'BACKUP_EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/agriculture-db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/agriculture_db_$TIMESTAMP.sql.gz"

# Perform backup
sudo -u postgres pg_dump agriculture_db | gzip > $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
BACKUP_EOF

sudo chmod +x /usr/local/bin/backup-agriculture-db.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-agriculture-db.sh") | crontab -

# Create monitoring script
cat > $APP_DIR/monitor.sh <<'MONITOR_EOF'
#!/bin/bash
# Check if application is running
if ! pm2 list | grep -q "agriculture-api.*online"; then
    echo "Application is down! Restarting..."
    pm2 restart agriculture-api
    echo "$(date): Application restarted" >> /var/log/agriculture-monitor.log
fi
MONITOR_EOF

chmod +x $APP_DIR/monitor.sh

# Add monitoring to crontab (every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * $APP_DIR/monitor.sh") | crontab -

echo ""
echo "✅ Deployment Complete!"
echo "======================="
echo "📍 Application URL: http://your-server-ip"
echo "📊 Dashboard: http://your-server-ip/dashboard"
echo "🔐 Default login: admin / admin123 (CHANGE THIS!)"
echo ""
echo "🔧 Useful commands:"
echo "   pm2 status              - Check application status"
echo "   pm2 logs agriculture-api - View application logs"
echo "   pm2 restart agriculture-api - Restart application"
echo "   sudo systemctl status nginx - Check Nginx status"
echo "   sudo -u postgres psql agriculture_db - Access database"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "   1. Change default admin password"
echo "   2. Update DB_PASSWORD in .env file"
echo "   3. Configure your domain in Nginx config"
echo "   4. Setup SSL certificate"
echo "   5. Review firewall rules"
echo ""
