# 🚀 Quick Reference Card

## Start Development (5 minutes)

```bash
cd agriculture-data-system
npm install
npm run server:postgres  # or npm run server for JSON
# Open: http://localhost:3000
# Dashboard: http://localhost:3000/dashboard
# Login: admin / admin123
```

---

## Deploy to Production (30 minutes)

### Ubuntu VPS (Recommended - $5-10/month)

```bash
# 1. Copy files to server
scp -r agriculture-data-system user@your-server:/tmp/

# 2. SSH to server
ssh user@your-server

# 3. Run deployment
cd /tmp/agriculture-data-system/deploy
chmod +x ubuntu-deploy.sh
./ubuntu-deploy.sh

# 4. Access application
# http://your-server-ip or https://your-domain.com
```

### Docker (Easiest)

```bash
cd deploy
./docker-setup.sh
docker-compose up -d

# Access: http://localhost
# Stop: docker-compose down
# Logs: docker-compose logs -f
```

---

## Build Flutter App (10 minutes)

```bash
cd mobile-flutter
flutter pub get
flutter build apk --release

# APK location:
# build/app/outputs/flutter-apk/app-release.apk

# Install on device:
adb install build/app/outputs/flutter-apk/app-release.apk
```

---

## Important Commands

### Server Management (PM2)
```bash
pm2 status                  # Check status
pm2 logs agriculture-api    # View logs
pm2 restart agriculture-api # Restart
pm2 stop agriculture-api    # Stop
pm2 start agriculture-api   # Start
```

### Database Operations
```bash
# Connect to database
sudo -u postgres psql agriculture_db

# Backup
pg_dump -U agri_user agriculture_db | gzip > backup.sql.gz

# Restore
gunzip < backup.sql.gz | psql -U agri_user agriculture_db

# Check size
SELECT pg_size_pretty(pg_database_size('agriculture_db'));
```

### Docker Commands
```bash
docker-compose up -d        # Start
docker-compose down         # Stop
docker-compose logs -f      # View logs
docker-compose restart      # Restart all
./backup-docker.sh          # Backup database
```

---

## API Endpoints

### Authentication
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Change password (requires token)
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"admin123","newPassword":"newpass"}'
```

### Data Operations
```bash
# Sync surveys
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -H "X-Device-ID: my-device" \
  -d '[{"farmerName":"John","crops":["Copra"],...}]'

# Get dashboard data
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"

# Export to CSV
curl http://localhost:3000/api/export/csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o surveys.csv
```

---

## Default Credentials

**Username:** `admin`  
**Password:** `admin123`  

⚠️ **CHANGE IN PRODUCTION!**

---

## File Locations

### Server Files
- Config: `C:\agriculture-data-system\.env`
- Server: `C:\agriculture-data-system\server\server-postgres.js`
- Database helper: `C:\agriculture-data-system\server\database.js`
- Auth: `C:\agriculture-data-system\server\auth.js`

### Mobile App (PWA)
- Main: `C:\agriculture-data-system\index.html`
- Logic: `C:\agriculture-data-system\main.js`
- Database: `C:\agriculture-data-system\database.js`

### Flutter App
- Main: `C:\agriculture-data-system\mobile-flutter\lib\main.dart`
- Screens: `C:\agriculture-data-system\mobile-flutter\lib\screens\`
- Services: `C:\agriculture-data-system\mobile-flutter\lib\services\`

### Deployment
- Ubuntu: `C:\agriculture-data-system\deploy\ubuntu-deploy.sh`
- Docker: `C:\agriculture-data-system\deploy\docker-setup.sh`

---

## Troubleshooting

### Server won't start
```bash
# Check logs
pm2 logs agriculture-api

# Check PostgreSQL
sudo systemctl status postgresql

# Test database connection
psql -h localhost -U agri_user -d agriculture_db
```

### Can't connect from mobile
```bash
# Check firewall
sudo ufw status

# Test API
curl http://YOUR_SERVER_IP:3000/api/health

# In mobile app: Settings > Update server URL
```

### GPS not working
- Enable location permissions
- Go outside for better signal
- Wait 30 seconds for GPS lock

### Flutter build errors
```bash
flutter clean
flutter pub get
flutter doctor
flutter build apk --release
```

---

## Port Configuration

| Service | Port | URL |
|---------|------|-----|
| Web/Mobile | 80 | http://server |
| HTTPS | 443 | https://server |
| API | 3000 | http://server:3000 |
| PostgreSQL | 5432 | localhost only |

---

## Documentation Files

- `README.md` - Project overview
- `PRODUCTION_GUIDE.md` - Complete deployment guide (500+ lines)
- `FLUTTER_GUIDE.md` - Flutter app guide (400+ lines)
- `IMPLEMENTATION_SUMMARY.md` - What was built
- `DASHBOARD_GUIDE.md` - Dashboard features
- `MOBILE_SETUP.md` - PWA setup
- `QUICKSTART.md` - Quick start
- `COMPARISON.md` - vs Survey Solutions

---

## Quick Links

**Access Points:**
- Mobile App: http://your-server/
- Dashboard: http://your-server/dashboard
- API Health: http://your-server/api/health

**Support:**
- Check documentation files
- Review logs: `pm2 logs` or `docker-compose logs`
- Test connection: Settings > Test Connection

---

## Technology Stack

**Backend:** Node.js + Express + PostgreSQL 14 + PostGIS  
**Frontend:** Vanilla JS + IndexedDB + Service Workers  
**Mobile:** Flutter 3.x + SQLite + Provider  
**Infrastructure:** Nginx + PM2 + Docker + Ubuntu  
**Security:** JWT + Helmet + Rate Limiting  

---

## Features Checklist

✅ PostgreSQL with PostGIS (spatial queries)  
✅ Flutter native mobile app  
✅ JWT authentication + roles  
✅ Ubuntu VPS deployment script  
✅ Docker containerization  
✅ Performance optimizations  
✅ Automated backups  
✅ Real-time dashboard  
✅ Offline-first data collection  
✅ GPS mapping with Leaflet  
✅ User management (Admin/Supervisor/Enumerator)  
✅ Export to CSV/Excel  
✅ Comprehensive documentation  

---

## Need Help?

1. Check relevant documentation file
2. Review troubleshooting section
3. Check logs (`pm2 logs` or `docker logs`)
4. Verify server URL in mobile settings
5. Test API endpoint: `/api/health`

---

**Version 2.0.0** - Production-ready agricultural data collection system

For detailed instructions, see `PRODUCTION_GUIDE.md` or `FLUTTER_GUIDE.md`
