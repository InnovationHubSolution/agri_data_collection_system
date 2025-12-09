# 🖥️ Server Dashboard & Management System

Complete guide for the server-side dashboard and administrative features.

---

## 📊 Dashboard Features

### Real-Time Monitoring
- **Live Statistics** - Total surveys, farm area, active users
- **Interactive Map** - GPS points of all farms with popups
- **Data Visualizations** - Charts for crops, islands, livestock
- **Recent Activity** - Latest surveys and sync events
- **Auto-Refresh** - Updates every 30 seconds

### Data Management
- **Farmer Database** - Searchable, paginated list of all farmers
- **Export to Excel** - Download complete dataset as CSV
- **Backup System** - Create and restore data backups
- **Sync Logs** - View synchronization history

### User Management
- **Multi-Role System** - Admin, Supervisor, Enumerator
- **User CRUD** - Create, read, update, delete users
- **Access Control** - Role-based permissions
- **Activity Tracking** - Who synced what and when

---

## 🚀 Accessing the Dashboard

### Start the Server
```powershell
cd C:\agriculture-data-system
npm run server
```

### Open Dashboard
Open browser to: **http://localhost:3000/dashboard**

---

## 👥 User Management

### Default Admin Account
```
Username: admin
Password: admin123
```
⚠️ **Change this immediately in production!**

### User Roles

**Admin**
- Full system access
- Manage all users
- View all data
- Create backups
- System configuration

**Supervisor**
- View all surveys
- Manage enumerators
- Export data
- View reports
- Cannot delete data

**Enumerator**
- Create surveys
- Sync own data
- View own surveys
- Basic statistics

---

## 🔐 User Management API

### List All Users
```bash
GET http://localhost:3000/api/users
```

Response:
```json
{
  "users": [
    {
      "id": "user-001",
      "username": "john_doe",
      "role": "enumerator",
      "fullName": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-12-09T10:00:00Z",
      "active": true
    }
  ],
  "count": 1
}
```

### Create New User
```bash
POST http://localhost:3000/api/users
Content-Type: application/json

{
  "username": "jane_smith",
  "password": "secure123",
  "role": "enumerator",
  "fullName": "Jane Smith",
  "email": "jane@example.com"
}
```

### Update User
```bash
PUT http://localhost:3000/api/users/user-001
Content-Type: application/json

{
  "fullName": "John Updated",
  "active": false
}
```

### Delete User
```bash
DELETE http://localhost:3000/api/users/user-001
```

---

## 📈 Dashboard API Endpoints

### Get Dashboard Data
```bash
GET http://localhost:3000/api/dashboard
```

Returns:
- Total surveys and farmers
- Farm area statistics
- User counts
- Crop distribution
- Island distribution
- Livestock totals
- Village distribution
- Pest issue counts
- GPS points for map
- Recent surveys (last 10)
- Recent syncs (last 10)

### Get Farmer Database
```bash
GET http://localhost:3000/api/farmers?page=1&limit=50&search=john
```

Parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `search` - Search term for farmer name, village, or island

Response:
```json
{
  "farmers": [...],
  "total": 150,
  "page": 1,
  "limit": 50,
  "totalPages": 3
}
```

---

## 🔄 Enhanced Synchronization

### Conflict Handling

The system automatically handles conflicts when:
- Same survey synced from multiple devices
- Survey updated after initial sync
- Network issues cause duplicate submissions

**Resolution Strategy:**
1. **Newer Wins** - Most recent timestamp takes precedence
2. **Server Authority** - Server version kept if same timestamp
3. **Logged** - All conflicts logged for review

### Sync with Conflict Info
```bash
POST http://localhost:3000/api/sync
Content-Type: application/json

{
  "surveys": [...],
  "deviceId": "device-12345",
  "userId": "user-001"
}
```

Response:
```json
{
  "success": true,
  "syncedCount": 10,
  "conflictCount": 2,
  "conflicts": [
    {
      "clientId": 5,
      "resolution": "client-newer"
    }
  ],
  "message": "Synced with 2 conflict(s) resolved"
}
```

### Sync Logs

View detailed sync history:
```bash
GET http://localhost:3000/api/sync-logs?limit=100
```

Response:
```json
{
  "logs": [
    {
      "timestamp": "2025-12-09T14:30:00Z",
      "type": "sync",
      "userId": "user-001",
      "deviceId": "device-12345",
      "surveyCount": 10,
      "syncedCount": 10,
      "conflictCount": 2,
      "success": true
    }
  ]
}
```

---

## 💾 Backup & Recovery

### Create Backup
```bash
POST http://localhost:3000/api/backup
```

Creates timestamped backup file:
- **Location:** `server/data/backups/`
- **Format:** `backup_2025-12-09T14-30-00.json`
- **Contains:** All surveys, users, sync logs

Response:
```json
{
  "success": true,
  "message": "Backup created successfully",
  "filename": "backup_2025-12-09T14-30-00.json",
  "recordCount": 150
}
```

### List All Backups
```bash
GET http://localhost:3000/api/backups
```

Response:
```json
{
  "backups": [
    {
      "filename": "backup_2025-12-09T14-30-00.json",
      "size": 1048576,
      "created": "2025-12-09T14:30:00Z"
    }
  ]
}
```

### Restore from Backup
```bash
POST http://localhost:3000/api/restore/backup_2025-12-09T14-30-00.json
```

⚠️ **Warning:** This will overwrite current data!

Response:
```json
{
  "success": true,
  "message": "Data restored successfully",
  "recordCount": 150
}
```

---

## 📊 Export to Excel/Power BI

### Export as CSV
**Via Dashboard:** Click "Export to Excel" button

**Via API:**
```bash
GET http://localhost:3000/api/export/csv
```

Downloads: `agriculture_data_YYYY-MM-DD.csv`

### CSV Format
Includes all fields:
- Server/Client IDs
- Timestamps
- Farmer information
- Location data
- Crop details
- Livestock counts
- Pest information
- Sync metadata

### Import to Excel
1. Download CSV file
2. Open Excel
3. File → Open → Select CSV
4. Data will auto-format

### Import to Power BI
1. Download CSV file
2. Open Power BI Desktop
3. Get Data → Text/CSV
4. Select the downloaded file
5. Transform Data (if needed)
6. Load

**Power BI Tips:**
- Set data types (numbers, dates, text)
- Create relationships if multiple tables
- Use GPS coordinates for map visualizations
- Create measures for calculations

---

## 🗺️ Interactive Map Features

The dashboard includes a **Leaflet.js map** showing:

**Features:**
- All farm locations as markers
- Click marker for popup with:
  - Farmer name
  - Village
  - Farm size
  - Crops grown
- Auto-zoom to fit all markers
- OpenStreetMap base layer

**Technical:**
- Updates every 30 seconds
- Filters out surveys without GPS
- Centers on Vanuatu by default
- Responsive for mobile

---

## 📊 Data Visualizations

### Crop Distribution Chart
- Horizontal bar chart
- Shows top 10 crops
- Sortedby frequency
- Auto-scales to max value

### Island Distribution Chart
- Shows farms per island
- Helps identify coverage gaps
- Quick regional overview

### Livestock Totals Table
- Aggregated counts
- All animal types
- Real-time updates

---

## 🔒 Security Best Practices

### Production Deployment

1. **Change Default Password**
   ```bash
   # Edit server/data/users.json
   # Update admin password hash
   ```

2. **Use HTTPS**
   - Configure SSL certificate
   - Redirect HTTP to HTTPS
   - Use secure cookies

3. **Implement Authentication**
   - Add login system
   - Use JWT tokens
   - Session management
   - Password reset flow

4. **Database Security**
   - Move to PostgreSQL/MongoDB
   - Encrypt sensitive data
   - Regular backups
   - Access control

5. **API Security**
   - Add API keys
   - Rate limiting
   - Input validation
   - CORS restrictions

---

## 📱 Multi-Device Workflow

### Typical Setup

**Central Office:**
- Server running 24/7
- Dashboard for monitoring
- Supervisors viewing data
- Daily backups

**Field Teams:**
- Tablets with mobile app
- Collect data offline
- Sync when internet available
- View own statistics

**Workflow:**
```
Field Officer → Collects surveys offline
              ↓
              Syncs to server (conflicts resolved)
              ↓
Supervisor    → Views on dashboard
              → Exports reports
              → Monitors quality
```

---

## 🚨 Troubleshooting

### Dashboard Not Loading
```bash
# Check server is running
npm run server

# Check URL
http://localhost:3000/dashboard

# Check browser console for errors
```

### Map Not Showing
- Ensure surveys have GPS coordinates
- Check Leaflet.js loaded
- Verify internet for map tiles

### Export Failing
- Check disk space
- Verify write permissions
- Check data integrity

### Sync Conflicts
- Review sync logs
- Check timestamps
- Verify device IDs unique

### Backup/Restore Issues
- Check disk space
- Verify JSON format
- Test with small backup first

---

## 📊 Statistics Explained

### Total Surveys
- Count of all synced surveys
- Includes active and archived

### Total Farm Area
- Sum of all farm sizes (hectares)
- Useful for coverage metrics

### Active Enumerators
- Users with role="enumerator" and active=true
- Shows field team size

### Crop Distribution
- Frequency of each crop type
- Helps identify popular crops
- Agricultural planning data

### Island Distribution
- Geographic spread
- Coverage analysis
- Resource allocation

---

## 🔧 Customization

### Dashboard Styling
Edit `dashboard/index.html`:
- Change colors
- Modify layout
- Add new charts
- Custom branding

### API Extensions
Edit `server/index.js`:
- Add new endpoints
- Custom queries
- Advanced filtering
- Report generation

### Auto-Refresh Interval
```javascript
// In dashboard/index.html
// Change from 30 seconds to 60 seconds
setInterval(loadDashboard, 60000);
```

---

## 📈 Performance Optimization

### Large Datasets (1000+ surveys)

1. **Implement Pagination**
   - Already in farmer API
   - Add to other endpoints

2. **Database Indexing**
   - Switch to proper database
   - Index on common queries

3. **Caching**
   - Cache dashboard stats
   - Refresh every 5 minutes

4. **Lazy Loading**
   - Load map points on demand
   - Paginate tables

---

## 🎯 Next Steps

### Recommended Enhancements

**Priority 1:**
- [ ] Login authentication
- [ ] Password hashing (bcrypt)
- [ ] Session management
- [ ] Access control enforcement

**Priority 2:**
- [ ] Advanced reports
- [ ] Data validation rules
- [ ] Quality score system
- [ ] Email notifications

**Priority 3:**
- [ ] Mobile dashboard view
- [ ] Real-time websockets
- [ ] Advanced filters
- [ ] Custom report builder
- [ ] Power BI connector

---

## 📞 Support

**Dashboard Issues:**
- Check server logs
- Verify API responses
- Browser developer tools

**Data Issues:**
- Review sync logs
- Check backup files
- Verify JSON format

**Performance Issues:**
- Monitor server resources
- Check database size
- Optimize queries

---

**Dashboard is now live at http://localhost:3000/dashboard** 🎉
