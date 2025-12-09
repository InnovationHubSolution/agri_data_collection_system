# Agriculture Data System v2.0 🌾

Complete agricultural data collection system with offline-first capabilities, PostgreSQL backend with PostGIS, JWT authentication, and native Flutter mobile app.

## ✨ What's New in v2.0

### 🗄️ PostgreSQL with PostGIS
- Production-ready database with spatial queries
- Find farms within radius (proximity search)
- Optimized indexes and ACID compliance
- Scalable for thousands of surveys

### 📱 Flutter Mobile App
- Native Android application
- Better offline SQLite storage
- Professional UI/UX
- Superior camera and GPS integration

### 🔐 JWT Authentication
- Secure token-based authentication
- Role-based access control (Admin, Supervisor, Enumerator)
- Password management
- Session tracking

### 🚀 Deployment Ready
- Ubuntu VPS deployment script (1-click setup)
- Docker containerization
- Production optimization middleware
- Automated backups and monitoring

## 🎯 Quick Start

### Option 1: Quick Test (Original JSON Backend)

```bash
# 1. Install dependencies
npm install

# 2. Start server
npm run server

# 3. Access applications
# Mobile App: http://localhost:3000
# Dashboard: http://localhost:3000/dashboard
```

### Option 2: Production PostgreSQL Backend

```bash
# 1. Install PostgreSQL with PostGIS
sudo apt install postgresql-14 postgresql-14-postgis-3

# 2. Setup environment
cp .env.example .env
nano .env  # Update database credentials

# 3. Install dependencies
npm install

# 4. Start PostgreSQL server
npm run server:postgres

# Default login: admin / admin123 (CHANGE IN PRODUCTION!)
```

### Option 3: Docker (Easiest)

```bash
cd deploy
./docker-setup.sh
docker-compose up -d

# Access: http://localhost
```

## 📱 Mobile Applications

### PWA (Progressive Web App)
- Works on any device
- Install to home screen
- **Best for**: Quick deployment, iOS support

### Flutter Native App
```bash
cd mobile-flutter
flutter pub get
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```
- **Best for**: Android tablets, field workers
- See `FLUTTER_GUIDE.md` for details

## 🏗️ Architecture

```
Mobile Devices → Nginx → Node.js API → PostgreSQL + PostGIS
(Offline First)    (SSL)    (JWT Auth)    (Spatial Data)
```

## 🌟 Features

### Data Collection
✅ Farmer information & GPS location  
✅ Farm details (size, crops, livestock)  
✅ Pest/disease reporting with photos  
✅ Skip logic & field validation  
✅ Progress tracking  
✅ Offline-first with auto-sync  

### Dashboard & Analytics
✅ Real-time statistics  
✅ Interactive GPS maps (Leaflet.js)  
✅ Crop/livestock distribution charts  
✅ Export to CSV/Excel  
✅ Sync activity logs  

### User Management
✅ Role-based access (Admin, Supervisor, Enumerator)  
✅ User CRUD operations  
✅ Activity tracking  

### Spatial Features (PostGIS)
✅ Find nearby farms (radius search)  
✅ Distance calculations  
✅ Spatial indexing  

## 🛠️ Tech Stack

**Backend:** Node.js, Express, PostgreSQL 14, PostGIS, JWT  
**Frontend:** Vanilla JS, IndexedDB, Service Workers, Leaflet.js  
**Mobile:** Flutter 3.x, SQLite, Provider, Geolocator  
**Infrastructure:** Nginx, Docker, Ubuntu, Let's Encrypt  

## 📚 Documentation

- **PRODUCTION_GUIDE.md** - Complete deployment guide
- **FLUTTER_GUIDE.md** - Flutter mobile app
- **QUICKSTART.md** - Quick setup
- **DASHBOARD_GUIDE.md** - Dashboard features
- **MOBILE_SETUP.md** - PWA installation
- Crop types and quantities
- Farm size (hectares)
- Production data
- Livestock counts
- Pest/disease reports
- Harvest dates
- Photos
