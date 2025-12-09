# Agriculture Data System - Quick Start Guide

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- A modern web browser (Chrome, Firefox, Edge, Safari)

### Step 1: Install Dependencies

Open PowerShell and navigate to the project directory:

```powershell
cd C:\agriculture-data-system
npm install
```

### Step 2: Start the Development Server

In one PowerShell window:
```powershell
npm run dev
```

This will start the frontend at `http://localhost:5173`

### Step 3: Start the Backend Server

In a **second** PowerShell window:
```powershell
cd C:\agriculture-data-system
npm run server
```

This will start the backend at `http://localhost:3000`

### Step 4: Open the Application

Open your browser and go to: `http://localhost:5173`

---

## 📱 Using the System

### 1. **Creating a New Survey**

- Click the **"New Survey"** tab
- Fill out the farmer information
- Click **"Get Current GPS Location"** to capture coordinates (or enter manually)
- Select crop types from the checkboxes
- Enter farm size and production data
- Add livestock numbers
- Report any pest/disease issues
- Take photos using the file upload
- Click **"Save Survey"** when complete

### 2. **Working Offline**

The app works completely offline:
- The status badge will show "Offline" when no internet
- All surveys are saved to your browser's local database (IndexedDB)
- You can continue collecting data without internet
- Data will remain safe in local storage

### 3. **Syncing Data**

When internet is available:
- The status badge will show "Online"
- Click the **"Sync Data"** button in the header
- All unsynced surveys will upload to the server
- Records will be marked as "Synced"

### 4. **Viewing Records**

- Click the **"Records"** tab to see all saved surveys
- View details or delete individual records
- Click **"Export CSV"** to download all data

### 5. **Dashboard**

- Click the **"Dashboard"** tab to see statistics:
  - Total surveys collected
  - Total farm area
  - Pending sync count
  - Most common crop

---

## 🔧 Advanced Features

### GPS Functionality
- **Auto-detect**: Click "Get Current GPS Location" button
- **Manual entry**: Type latitude/longitude directly
- **Map selection**: Click on the map to set location
- The map will center on the selected coordinates

### Photo Capture
- Click "Choose Files" to select photos
- Take photos directly with device camera
- Multiple photos per survey supported
- Photos are stored as base64 in local database

### Export Data
- Click "Export CSV" in Records tab
- Downloads all survey data as CSV file
- Can be opened in Excel or other tools

---

## 🌐 Server API Endpoints

The backend server provides these endpoints:

- `POST /api/sync` - Sync surveys from client
- `GET /api/surveys` - Get all surveys
- `GET /api/statistics` - Get aggregated statistics
- `GET /api/export/csv` - Export data to CSV
- `GET /api/health` - Health check

---

## 📂 Data Storage

### Client-Side (Browser)
- **IndexedDB** stores all survey data locally
- Data persists even when offline
- Can store thousands of records
- Photos stored as base64 strings

### Server-Side
- Synced data saved to `server/data/surveys.json`
- JSON format for easy viewing/editing
- Can be imported to databases later

---

## 🔒 Data Fields Collected

**Farmer Information:**
- Name (required)
- Household size
- Phone number
- Village/Community

**Location:**
- GPS coordinates (latitude/longitude)
- Interactive map

**Crops:**
- Multiple selection: Copra, Kava, Cocoa, Taro, Yam, Cassava, Banana, Vegetables
- Other crops (text field)
- Farm size in hectares (required)
- Production quantity (kg)
- Last harvest date

**Livestock:**
- Cattle count
- Pigs count
- Poultry count
- Goats count

**Pests & Diseases:**
- Issue type (None/Pests/Disease/Both)
- Detailed description

**Additional:**
- Photos (multiple)
- Notes/observations

---

## 🛠️ Troubleshooting

### GPS Not Working
- Enable location permissions in browser
- Works better on mobile devices
- May not work in some desktop browsers

### Sync Failing
- Ensure backend server is running (`npm run server`)
- Check that you're online
- Verify server is at `http://localhost:3000`

### Photos Not Uploading
- Large photos may take time to process
- Reduce photo size if needed
- Photos are compressed automatically

### Data Not Saving
- Check browser console for errors (F12)
- Ensure IndexedDB is not disabled
- Try incognito/private mode to test

---

## 📊 Use Cases

1. **Ministry of Agriculture**: Field officers collecting farmer data
2. **Agricultural Census**: Systematic data collection across regions
3. **NGO Projects**: Development program monitoring
4. **Research**: Agricultural studies and surveys
5. **Cooperatives**: Member farm documentation

---

## 🔄 Future Enhancements

Possible additions:
- User authentication
- Multi-language support (Bislama, French)
- Batch photo compression
- Cloud storage integration
- PDF report generation
- Data visualization charts
- Export to Excel with formatting
- Offline map tiles
- Voice notes

---

## 📞 Support

For issues or questions, check:
- Browser console (F12) for error messages
- Server logs in PowerShell window
- README.md for technical details

---

## ✅ Quick Checklist

Before going to field:
- [ ] Install dependencies (`npm install`)
- [ ] Test both frontend and backend work
- [ ] Test offline functionality
- [ ] Test GPS capture works
- [ ] Test photo capture works
- [ ] Ensure device is charged
- [ ] Download offline maps if needed

After field work:
- [ ] Connect to internet
- [ ] Click "Sync Data"
- [ ] Verify all records synced
- [ ] Export CSV backup
- [ ] Clear old records if needed

---

## 🎯 Tips for Field Officers

1. **Battery Management**: App works offline, save battery by turning off internet
2. **Photo Tips**: Take clear photos in good lighting
3. **GPS Accuracy**: Wait for GPS to stabilize (±10m accuracy is good)
4. **Regular Sync**: Sync data daily when internet available
5. **Backup**: Export CSV regularly as backup
6. **Device Care**: Keep device protected from weather

---

Enjoy using the Agriculture Data System! 🌾📊
