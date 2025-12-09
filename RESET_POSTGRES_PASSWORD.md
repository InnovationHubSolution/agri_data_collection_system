# Reset PostgreSQL Password Guide

## Current Issue
Cannot connect to PostgreSQL database. Need to reset the password to `Admin123`.

## Steps to Reset Password

### Method 1: Using pgAdmin (Easiest)
1. Open **pgAdmin 4** from Start Menu
2. When prompted for "Master Password", try common passwords or click "Reset Master Password"
3. Once pgAdmin opens:
   - Right-click on **PostgreSQL 16** server
   - Click **Properties**
   - Go to **Connection** tab
   - Enter new password: `Admin123`
   - Click **Save**

### Method 2: Command Line (Run PowerShell as Administrator)
```powershell
# Stop PostgreSQL service
Stop-Service postgresql-x64-16

# Edit pg_hba.conf to allow trust authentication temporarily
$pgData = "C:\Program Files\PostgreSQL\16\data"
$hbaFile = "$pgData\pg_hba.conf"

# Backup original file
Copy-Item $hbaFile "$hbaFile.backup"

# Replace 'md5' or 'scram-sha-256' with 'trust' for local connections
(Get-Content $hbaFile) -replace 'md5', 'trust' -replace 'scram-sha-256', 'trust' | Set-Content $hbaFile

# Start PostgreSQL service
Start-Service postgresql-x64-16

# Now reset password (no password needed because we set trust)
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "ALTER USER postgres WITH PASSWORD 'Admin123';"

# Restore original pg_hba.conf
Copy-Item "$hbaFile.backup" $hbaFile

# Restart PostgreSQL
Restart-Service postgresql-x64-16

Write-Host "Password reset successfully to: Admin123" -ForegroundColor Green
```

### Method 3: PostgreSQL Stack Builder
1. Open **Start Menu**
2. Search for "Stack Builder"
3. This might help recover/reset password

## After Resetting Password

Once password is reset to `Admin123`, the server should start automatically.

Run: `node server-postgres.js` from `C:\agriculture-data-system\server` directory

## Verification

Test connection:
```powershell
$env:PGPASSWORD='Admin123'
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "SELECT 'Connection successful!' as status;"
```

If successful, you'll see:
```
      status
-------------------
 Connection successful!
```
