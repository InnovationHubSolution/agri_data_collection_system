# 📱 Mobile Data Collection App - Setup Guide

This guide will help you install and use the Agriculture Data System on Android tablets and phones, similar to Survey Solutions Interviewer app.

---

## 📲 Installation Options

### Option 1: Progressive Web App (PWA) - Recommended

The easiest way to use the app on mobile devices:

1. **Start the server** on your computer:
   ```powershell
   cd C:\agriculture-data-system
   npm run dev
   npm run server
   ```

2. **Find your computer's IP address**:
   ```powershell
   ipconfig
   # Look for "IPv4 Address" (e.g., 192.168.1.100)
   ```

3. **On your Android device**:
   - Connect to the **same WiFi network** as your computer
   - Open Chrome browser
   - Go to: `http://YOUR_COMPUTER_IP:5173`
   - Example: `http://192.168.1.100:5173`

4. **Install as App**:
   - Tap the **menu (⋮)** in Chrome
   - Select **"Add to Home screen"** or **"Install app"**
   - Choose a name (e.g., "Agri Survey")
   - Tap "Add"
   - The app icon will appear on your home screen

5. **Use Offline**:
   - Once installed, the app works completely offline
   - All data is stored on the device
   - Sync when you have internet

---

### Option 2: Direct Browser Access

If you don't want to install:

1. Simply open Chrome on Android
2. Navigate to `http://YOUR_COMPUTER_IP:5173`
3. Bookmark the page for easy access
4. Works offline after first visit

---

### Option 3: Build Android APK (Advanced)

For a native Android app experience:

1. **Install Capacitor** (on your development computer):
   ```powershell
   cd C:\agriculture-data-system
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init
   ```

2. **Build the web app**:
   ```powershell
   npm run build
   ```

3. **Add Android platform**:
   ```powershell
   npx cap add android
   npx cap sync
   ```

4. **Open in Android Studio**:
   ```powershell
   npx cap open android
   ```

5. **Build APK** in Android Studio and install on devices

---

## 🎯 Mobile App Features

### ✅ Core Capabilities

**Works Like Survey Solutions:**

- ✅ **Offline First** - Works without internet connection
- ✅ **GPS Capture** - Automatic location detection
- ✅ **Photo Capture** - Direct camera access
- ✅ **Skip Logic** - Conditional questions appear/hide
- ✅ **Validation Rules** - Real-time error checking
- ✅ **Dropdowns** - Easy selection for islands, severity, etc.
- ✅ **Checkboxes** - Multiple crop selection
- ✅ **Progress Indicator** - See % completion
- ✅ **Touch Optimized** - Large buttons for fingers
- ✅ **Data Sync** - Upload when online

---

## 📋 Using the Mobile App

### Starting a New Survey

1. **Open the app** from your home screen
2. You'll see the **"New Survey"** tab
3. A **progress bar** shows completion percentage
4. Fill out each section:

#### 👨‍🌾 Farmer Information
- Enter farmer name *(required)*
- Household size (1-50)
- Phone number
- Village *(required)*
- Select island from dropdown

#### 📍 Location
- Tap **"Get Current GPS Location"**
- Wait for accuracy (±10m is good)
- Or tap on map to set location
- Coordinates auto-fill

#### 🌱 Crops
- Enter farm size *(required)*
- Check all crop types grown
- Add other crops if needed
- Enter production quantity
- Set last harvest date

#### 🐄 Livestock
- Enter counts for each type
- Use 0 if none

#### 🐛 Pests & Diseases
- **Skip Logic Demo:**
  - Select "No Issues" → Details section hidden
  - Select "Pest/Disease/Both" → Details section appears
  - Details become *required* when issues present
- Describe issues (min 10 characters)
- Select severity level

#### 📷 Photos
- Tap **"Take Picture"** button
- Camera opens directly
- Take 2-3 clear photos
- Photos preview below

#### 📝 Notes
- Add any observations

---

### Validation & Error Handling

The app checks your data in real-time:

**Field Validation:**
- ❌ Empty required fields highlighted in red
- ❌ Out-of-range values rejected
- ❌ Invalid phone numbers caught
- ✅ Valid fields show no error

**Submission Validation:**
- If errors exist, form won't submit
- Error message appears
- Automatically scrolls to first error
- Fix errors and try again

**Progress Tracking:**
- Green progress bar at top
- Shows percentage complete
- Shows filled/total fields count
- Updates as you type

---

### Saving Surveys

1. Fill all required fields (marked with *)
2. Progress bar should show good completion
3. Tap **"Save Survey"**
4. Dialog asks: Create another survey?
   - **Yes** → Form clears, start new survey
   - **No** → Switch to Records tab

Data is saved instantly to device storage!

---

### Working Offline

**First Time Setup:**
- Connect to WiFi
- Open app once
- App downloads all resources

**After Setup:**
- ✅ Works with airplane mode on
- ✅ Works in remote areas
- ✅ No internet needed
- ✅ Unlimited surveys offline

**Data Storage:**
- Saved in browser's IndexedDB
- Persists even if app closed
- Can store 1000+ surveys
- Photos stored as compressed data

---

### Syncing Data

When you have internet:

1. Ensure **"Online"** badge is green (top right)
2. Tap **"Sync Data"** button
3. Progress shown for upload
4. "Synced" badge appears on records
5. Data now on server

**Sync Tips:**
- Sync daily if possible
- WiFi recommended for photos
- Mobile data works but uses bandwidth
- Sync before clearing records

---

### Viewing Records

1. Tap **"Records"** tab
2. See all saved surveys
3. **Badges show sync status:**
   - 🟢 Green "Synced" = On server
   - 🟠 Orange "Pending" = Local only
4. Tap **"View Details"** to see full survey
5. Tap **"Delete"** to remove (with confirmation)

---

### Dashboard Statistics

1. Tap **"Dashboard"** tab
2. See quick stats:
   - Total surveys
   - Total farm area
   - Pending sync count
   - Most common crop

Updates automatically!

---

## 📱 Mobile Best Practices

### Battery Management
- Turn off GPS when not capturing location
- Reduce screen brightness in field
- Close other apps
- Bring power bank for long days

### Data Quality
- **GPS:** Wait for good accuracy (<20m)
- **Photos:** Take in good lighting
- **Names:** Use full names
- **Units:** Double-check measurements
- **Review:** Check before saving

### Field Operations
- **Morning:** Sync previous day's data
- **During Day:** Collect surveys offline
- **Evening:** Sync when back online
- **Weekly:** Export CSV backup

### Device Care
- Use protective case
- Screen protector recommended
- Keep device dry
- Charge overnight

---

## 🔧 Troubleshooting Mobile

### GPS Not Working

**Problem:** Can't get location
**Solutions:**
1. Enable Location Services in Android Settings
2. Grant location permission to Chrome/app
3. Go outside for better signal
4. Use WiFi + GPS for better accuracy
5. Manually enter coordinates if needed

### Camera Not Opening

**Problem:** Camera button doesn't work
**Solutions:**
1. Grant camera permission to browser/app
2. Check if another app uses camera
3. Restart the app
4. Try from browser directly

### Can't Install PWA

**Problem:** "Add to Home Screen" not showing
**Solutions:**
1. Use Chrome browser (not Firefox/others)
2. Visit via HTTPS or localhost
3. Clear browser cache
4. Check manifest.json loads

### Offline Not Working

**Problem:** App needs internet
**Solutions:**
1. Visit app while online first
2. Wait for service worker to install
3. Check browser supports Service Workers
4. Try incognito mode to test

### Form Doesn't Submit

**Problem:** Save button does nothing
**Solutions:**
1. Check for red error fields
2. Fill all required fields (*)
3. Fix validation errors
4. Check browser console (USB debug)

### Sync Failing

**Problem:** Data won't upload
**Solutions:**
1. Verify internet connection
2. Check server is running
3. Try on WiFi instead of mobile data
4. Export CSV as backup

---

## 🌐 Network Setup for Field Teams

### Local Server Setup (No Internet Required)

For field operations without internet:

1. **Setup Laptop as Server:**
   - Laptop runs the server
   - Creates WiFi hotspot
   - Tablets connect to laptop's hotspot

2. **Windows Hotspot:**
   ```powershell
   # Start mobile hotspot in Windows Settings
   # Network & Internet → Mobile hotspot → On
   ```

3. **Start Server:**
   ```powershell
   cd C:\agriculture-data-system
   npm run dev
   npm run server
   ```

4. **Connect Tablets:**
   - Connect to laptop's hotspot WiFi
   - Open `http://192.168.137.1:5173`
   - Install PWA

5. **Field Collection:**
   - All tablets work offline
   - Sync to laptop when needed
   - Laptop stores all data

6. **Later Sync to Cloud:**
   - When laptop gets internet
   - Export data from laptop
   - Upload to cloud/central server

---

## 📊 Multi-Device Workflow

**Team of Field Officers:**

```
Day 1 (Field):
- 5 officers with tablets
- All connect to supervisor's laptop hotspot
- Download app offline
- Disconnect and spread out
- Collect data independently (offline)

Evening:
- Return to supervisor
- Connect to laptop hotspot
- All tablets sync to laptop
- Supervisor reviews data
- Export CSV from laptop

Week End:
- Supervisor's laptop gets internet
- Uploads consolidated data to central server
- Ministry reviews all field data
```

---

## 📸 Photo Best Practices

**Taking Good Photos:**

1. **Lighting:** Midday sun is best
2. **Angle:** Take from multiple sides
3. **Focus:** Tap screen to focus
4. **Distance:** Not too close, not too far
5. **Quantity:** 2-3 photos per farm

**Photo Types to Capture:**
- Wide shot of farm
- Close-up of crops
- Pest/disease damage
- Farmer with crops (optional)

**File Size:**
- Photos auto-compress
- Each ~200-500KB
- 3 photos = ~1.5MB per survey
- 100 surveys = ~150MB

---

## ✅ Pre-Field Checklist

Before going to field:

- [ ] Device fully charged
- [ ] App installed on home screen
- [ ] Test GPS functionality
- [ ] Test camera works
- [ ] Verify offline mode works
- [ ] Clear old surveys if needed
- [ ] Bring power bank
- [ ] Have paper backup form
- [ ] Know supervisor's contact
- [ ] Understand skip logic rules

---

## 🎓 Training Tips

**For Field Officers:**

1. **Practice Session:**
   - Create 5 test surveys
   - Test all features
   - Learn skip logic behavior
   - Practice GPS capture

2. **Common Mistakes:**
   - Forgetting to save before closing
   - Not waiting for GPS accuracy
   - Skipping required fields
   - Not syncing regularly

3. **Efficiency Tips:**
   - Pre-fill dropdown values mentally
   - Take photos at end
   - Use tab key to move fields
   - Learn keyboard shortcuts

---

## 📞 Support Contacts

**Technical Issues:**
- System Administrator: [Contact Info]
- Help Desk: [Number]

**Field Supervisor:**
- Name: [Supervisor]
- Phone: [Number]

**Emergency:**
- If app fails, use paper forms
- Record farmer name, GPS, farm size minimum
- Transfer to app when working

---

## 🔄 Version Updates

**Updating the App:**

1. Delete current PWA from home screen
2. Connect to WiFi
3. Visit app URL in browser
4. Browser downloads new version
5. Re-install PWA
6. Old data remains safe

Or simply:
- Open app while online
- Automatic update check
- Refresh if update available

---

## 📈 Success Metrics

**Good Data Collection:**
- 90%+ fields completed
- GPS accuracy <20m
- 2+ photos per farm
- Daily sync rate >80%
- <5% validation errors

**Monitor:**
- Surveys per officer per day
- Average completion time
- Error rates
- Sync success rate

---

## 🌟 Advanced Features

### Keyboard Shortcuts (when connected to keyboard)
- `Tab` - Next field
- `Shift+Tab` - Previous field
- `Enter` - Submit form (if at end)

### Voice Input (Android)
- Tap microphone on keyboard
- Speak field contents
- Works for text fields

### Share Location
- Some devices can share GPS between apps
- Useful if external GPS device available

---

**Ready to start collecting data! 🚀**

For more details, see README.md and QUICKSTART.md
