# Database Setup Guide

## Quick Start

### 1. Install PostgreSQL

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Install with default settings
- Remember your postgres password

**Linux:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib postgis
```

### 2. Create Database

Open PostgreSQL command line (psql) and run:

```sql
CREATE DATABASE agriculture_db;
\c agriculture_db
CREATE EXTENSION IF NOT EXISTS postgis;
```

Or use command line:
```bash
psql -U postgres -c "CREATE DATABASE agriculture_db;"
psql -U postgres -d agriculture_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### 3. Configure Environment

The `.env` file is already created. Update these values if needed:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agriculture_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
```

### 4. Initialize Database

Run the initialization script:

```bash
npm run init-db
```

This will:
- Test database connection
- Create all tables and indexes
- Set up PostGIS for spatial queries
- Create default admin user

### 5. Start the Server

```bash
npm run server:postgres
```

The server will be available at:
- Main server: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard
- Designer: http://localhost:3000/designer

### 6. Start Frontend (in separate terminal)

```bash
npm run dev
```

Frontend will be available at: http://localhost:5173

## Default Credentials

- **Username:** admin
- **Password:** Admin@123456

⚠️ **IMPORTANT:** Change the default password immediately after first login!

## Database Schema

The system creates the following tables:

### Core Tables
- `users` - User accounts and authentication
- `surveys` - Farm survey data with PostGIS location
- `form_templates` - Custom survey forms
- `photos` - Survey photos (base64)
- `sync_logs` - Synchronization history
- `settings` - System settings
- `export_jobs` - Export job tracking

### Features
- PostGIS spatial indexing for location queries
- Full-text search on farmer names and villages
- JSONB for flexible crop/livestock data
- Survey workflow status tracking
- Form designer with dynamic questions

## API Routes

All routes are properly wired and authenticated. See the server startup log for complete API documentation.

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/verify`
- `POST /api/auth/change-password`

### Data Collection
- `POST /api/sync` - Sync surveys from mobile
- `GET /api/surveys` - Get all surveys (filtered)
- `GET /api/surveys/nearby` - Spatial proximity search
- `GET /api/statistics` - Dashboard statistics

### Form Designer
- `GET /api/forms` - List all forms
- `POST /api/forms` - Create new form
- `PUT /api/forms/:id` - Update form
- `POST /api/forms/:id/publish` - Publish to mobile

### User Management
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Export
- `GET /api/export/csv` - Export surveys as CSV
- `GET /api/export/json` - Export surveys as JSON
- `GET /api/export/geojson` - Export with spatial data

## Troubleshooting

### Database Connection Error

If you get `ECONNREFUSED`:
1. Check PostgreSQL is running: `pg_ctl status`
2. Verify credentials in `.env`
3. Check PostgreSQL is listening on port 5432

### PostGIS Extension Missing

Install PostGIS:
```bash
# Windows: Install from StackBuilder (included with PostgreSQL installer)
# Linux:
sudo apt-get install postgis
```

Then enable in your database:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Permission Denied

Make sure your PostgreSQL user has necessary permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE agriculture_db TO postgres;
```

## Migration from JSON Files

If you have existing data in JSON files (from the old server), you can migrate it:

```bash
npm run migrate
```

This will import data from:
- `server/data/surveys.json`
- `server/data/users.json`
- `server/data/sync_log.json`

## Testing

Test the database connection:
```bash
node -e "require('dotenv').config(); const {Pool} = require('pg'); const pool = new Pool({user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME, password: process.env.DB_PASSWORD, port: process.env.DB_PORT}); pool.query('SELECT NOW()', (err, res) => { console.log(err ? err : 'Connected!'); pool.end(); });"
```

## Next Steps

1. Change default admin password
2. Create user accounts for your team
3. Design your survey forms in the designer
4. Publish forms to make them available on mobile
5. Start collecting data!

## Security Best Practices

- Change `JWT_SECRET` in `.env` to a random string
- Use strong passwords for all accounts
- Enable HTTPS in production
- Keep PostgreSQL updated
- Regular database backups
- Restrict database access to localhost in production
