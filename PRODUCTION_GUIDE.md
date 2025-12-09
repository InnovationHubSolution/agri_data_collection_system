# Agriculture Data System - Complete Production Guide

## 🚀 Quick Start Options

### Option 1: Ubuntu VPS (Recommended - $5-10/month)

#### Prerequisites
- Ubuntu 20.04+ server
- Root or sudo access
- Domain name (optional but recommended)

#### Deployment Steps

```bash
# 1. Download deployment script
cd /tmp
wget https://your-repo/deploy/ubuntu-deploy.sh
chmod +x ubuntu-deploy.sh

# 2. Run deployment
./ubuntu-deploy.sh

# 3. Configure your domain
sudo nano /etc/nginx/sites-available/agriculture-system
# Change 'your-domain.com' to your actual domain

# 4. Setup SSL (highly recommended)
sudo certbot --nginx -d your-domain.com

# 5. Change default credentials
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Use the returned token to change password
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"currentPassword":"admin123","newPassword":"your_secure_password"}'
```

### Option 2: Docker (Easiest for Development)

```bash
# 1. Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 2. Setup application
cd deploy
./docker-setup.sh

# 3. Start services
docker-compose up -d

# 4. View logs
docker-compose logs -f

# 5. Access application
# Mobile App: http://localhost
# Dashboard: http://localhost/dashboard
# API: http://localhost/api
```

### Option 3: Local Government Server

#### Hardware Requirements
- CPU: 2+ cores
- RAM: 4GB minimum, 8GB recommended
- Storage: 50GB+ SSD
- OS: Ubuntu Server 20.04 LTS

#### Setup Steps

```bash
# 1. Install required software
sudo apt update
sudo apt install -y nodejs npm postgresql-14 postgresql-14-postgis-3 nginx

# 2. Clone/copy application files
cd /opt
sudo mkdir agriculture-system
sudo chown $USER:$USER agriculture-system
cd agriculture-system
# Copy your files here

# 3. Install dependencies
npm install
npm install pg pg-format jsonwebtoken bcrypt compression helmet express-rate-limit

# 4. Setup database
sudo -u postgres createdb agriculture_db
sudo -u postgres createuser -P agri_user
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE agriculture_db TO agri_user;"
sudo -u postgres psql agriculture_db -c "CREATE EXTENSION postgis;"

# 5. Configure environment
cp .env.example .env
nano .env
# Update database credentials

# 6. Start with PM2
npm install -g pm2
pm2 start server/server-postgres.js --name agriculture-api
pm2 save
pm2 startup

# 7. Configure Nginx (see ubuntu-deploy.sh for config)
```

---

## 📦 Technology Stack

### Backend
- **Node.js 18+** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL 14** - Database with PostGIS extension
- **JWT** - Authentication tokens
- **PM2** - Process manager

### Frontend (PWA)
- **Vanilla JavaScript** - No framework overhead
- **IndexedDB** - Offline storage
- **Service Workers** - PWA functionality
- **Leaflet.js** - Interactive maps

### Mobile App (Flutter)
- **Flutter 3.x** - Cross-platform framework
- **SQLite** - Local database
- **Provider** - State management
- **Geolocator** - GPS functionality

### Infrastructure
- **Nginx** - Web server & reverse proxy
- **Docker** - Containerization (optional)
- **Ubuntu** - Server OS

---

## 🔐 Security Checklist

### Before Production

- [ ] Change default admin password
- [ ] Update JWT_SECRET in .env
- [ ] Update DB_PASSWORD in .env
- [ ] Enable HTTPS with Let's Encrypt
- [ ] Configure firewall (UFW)
- [ ] Disable PostgreSQL remote access (unless needed)
- [ ] Review and restrict CORS origins
- [ ] Setup database backups
- [ ] Implement log rotation
- [ ] Add monitoring alerts

### Recommended Security Enhancements

```bash
# 1. Upgrade password hashing (install bcrypt)
npm install bcrypt

# 2. Enable stricter CORS
# In server-postgres.js, replace:
# app.use(cors());
# With:
app.use(cors({
  origin: 'https://your-domain.com',
  credentials: true
}));

# 3. Setup fail2ban for SSH protection
sudo apt install fail2ban
sudo systemctl enable fail2ban

# 4. Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 📊 Database Management

### PostgreSQL Operations

```bash
# Connect to database
sudo -u postgres psql agriculture_db

# Useful queries
SELECT COUNT(*) FROM surveys;
SELECT island, COUNT(*) FROM surveys GROUP BY island;
SELECT * FROM users;

# Backup database
pg_dump -U agri_user agriculture_db | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore database
gunzip < backup_20240101.sql.gz | psql -U agri_user agriculture_db

# Check database size
SELECT pg_size_pretty(pg_database_size('agriculture_db'));
```

### Migration from JSON to PostgreSQL

```bash
# 1. Export existing data
node -e "
const fs = require('fs');
const surveys = JSON.parse(fs.readFileSync('server/data/surveys.json'));
console.log(JSON.stringify(surveys));
" > export.json

# 2. Import to PostgreSQL (create import script)
node server/scripts/import-from-json.js export.json
```

---

## 📱 Mobile App Setup

### Flutter App Build

```bash
cd mobile-flutter

# Install dependencies
flutter pub get

# Build for Android
flutter build apk --release

# Build for Android (split ABIs for smaller size)
flutter build apk --split-per-abi

# Output: build/app/outputs/flutter-apk/app-release.apk
```

### Distribution Options

1. **Direct APK Distribution**
   - Copy APK to device via USB
   - Share via file sharing apps
   - Host on local web server

2. **Enterprise MDM**
   - Upload to organization's MDM system
   - Push to field devices

3. **Google Play Store** (for wider distribution)
   - Requires developer account ($25 one-time)
   - Follow Play Store guidelines

---

## 🔧 Maintenance Tasks

### Daily
- Monitor sync logs
- Check disk space
- Review error logs

### Weekly
- Database backup verification
- Performance metrics review
- User access audit

### Monthly
- Security updates: `sudo apt update && sudo apt upgrade`
- Database optimization: `VACUUM ANALYZE;`
- Log rotation check

---

## 📈 Performance Optimization

### Server Optimization

```javascript
// Install optimization packages
npm install compression helmet express-rate-limit

// Already included in server/middleware.js
// Enables gzip compression, security headers, rate limiting
```

### Database Indexing

```sql
-- Already created during initialization
-- Additional indexes if needed:
CREATE INDEX idx_surveys_farm_size ON surveys(farm_size);
CREATE INDEX idx_surveys_crops ON surveys USING gin(crops);
```

### Nginx Caching

```nginx
# Add to nginx.conf
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m;

location /api/dashboard {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_pass http://localhost:3000;
}
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check credentials in .env
cat .env | grep DB_

# Test connection
psql -h localhost -U agri_user -d agriculture_db
```

**2. API Not Responding**
```bash
# Check if server is running
pm2 status

# View logs
pm2 logs agriculture-api

# Restart server
pm2 restart agriculture-api
```

**3. Sync Failing from Mobile**
```bash
# Check firewall allows port 3000 (or 80/443)
sudo ufw status

# Check server URL in mobile app settings
# Ensure it's http://YOUR_SERVER_IP:3000 or https://your-domain.com
```

**4. GPS Not Working**
- Ensure location permissions granted
- Check device GPS is enabled
- For emulator, use mock locations

---

## 📞 Support Resources

### Documentation Files
- `README.md` - Project overview
- `QUICKSTART.md` - Quick setup guide
- `MOBILE_SETUP.md` - PWA mobile guide
- `COMPARISON.md` - Feature comparison
- `DASHBOARD_GUIDE.md` - Dashboard documentation
- `PRODUCTION_GUIDE.md` - This file

### Monitoring

```bash
# System resources
htop

# Disk usage
df -h

# Application logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

---

## 💰 Cost Estimates

### Monthly Costs (Assuming 100 surveys/day)

**Option 1: Ubuntu VPS**
- VPS (DigitalOcean/Vultr): $5-10/month
- Domain: $1-2/month
- SSL: Free (Let's Encrypt)
- **Total: $6-12/month**

**Option 2: Local Server**
- One-time hardware: $300-500
- Electricity: ~$10/month
- Internet: Existing cost
- **Total: $10/month (after initial investment)**

**Option 3: Cloud (Azure/AWS)**
- VM: $20-40/month
- Database: $20-30/month
- Storage: $5/month
- **Total: $45-75/month**

### Recommendation
**Ubuntu VPS** provides the best balance of cost, simplicity, and reliability for agricultural data collection.

---

## 🎯 Next Steps After Deployment

1. **Change default credentials** ✅
2. **Setup HTTPS** ✅
3. **Configure backups** ✅
4. **Train enumerators** 
5. **Test sync process**
6. **Deploy mobile apps**
7. **Monitor first week closely**
8. **Gather feedback and iterate**

---

## 📝 Version History

- **v1.0.0** - Initial release with PostgreSQL, Flutter app, JWT auth
- Offline-first data collection
- Real-time dashboard
- GPS mapping with PostGIS
- Role-based access control

---

For technical support or questions, contact your system administrator.
