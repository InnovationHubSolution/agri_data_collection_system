# Flutter Mobile App - Setup & Build Guide

## 🚀 Quick Start

### Prerequisites

1. **Install Flutter SDK**
   ```bash
   # Windows (using Chocolatey)
   choco install flutter
   
   # macOS (using Homebrew)
   brew install flutter
   
   # Linux
   snap install flutter --classic
   ```

2. **Verify Installation**
   ```bash
   flutter doctor
   ```

3. **Install Android Studio** (for Android development)
   - Download from: https://developer.android.com/studio
   - Install Android SDK
   - Setup Android emulator or connect physical device

---

## 📦 Project Setup

```bash
# Navigate to Flutter project
cd mobile-flutter

# Get dependencies
flutter pub get

# Verify everything works
flutter doctor -v
```

---

## 🔨 Building the App

### Development Build

```bash
# Run on connected device or emulator
flutter run

# Run with hot reload
flutter run --hot
```

### Production Build

#### Android APK

```bash
# Build release APK (single file, larger)
flutter build apk --release

# Build split APKs (smaller size, recommended)
flutter build apk --split-per-abi

# Output locations:
# build/app/outputs/flutter-apk/app-release.apk (universal)
# build/app/outputs/flutter-apk/app-armeabi-v7a-release.apk (32-bit ARM)
# build/app/outputs/flutter-apk/app-arm64-v8a-release.apk (64-bit ARM)
# build/app/outputs/flutter-apk/app-x86_64-release.apk (64-bit x86)
```

#### Android App Bundle (for Play Store)

```bash
flutter build appbundle --release

# Output: build/app/outputs/bundle/release/app-release.aab
```

---

## 📱 App Configuration

### Change App Name

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<application
    android:label="Your Custom Name"
    ...>
```

### Change App Icon

1. Create icon files (1024x1024 PNG)
2. Use online tool: https://romannurik.github.io/AndroidAssetStudio/
3. Replace files in `android/app/src/main/res/mipmap-*/`

### Change Package Name

Edit `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        applicationId "com.yourorg.agriculture"
    }
}
```

---

## 🌐 Server Configuration

### In-App Settings

Users can configure the server URL in the app:
1. Open app
2. Go to Settings tab
3. Enter server URL (e.g., `http://192.168.1.100:3000`)
4. Click "Test Connection"
5. Click "Save"

### Default Server URL

Edit `lib/services/sync_service.dart`:

```dart
static const String defaultBaseUrl = 'http://your-server-ip:3000';
```

---

## 📋 Permissions

The app requires these permissions (already configured):

- **Location**: For GPS data collection
- **Camera**: For photo capture
- **Storage**: For saving photos
- **Internet**: For syncing data

---

## 🧪 Testing

### Run Tests

```bash
flutter test
```

### Debug on Device

```bash
# List connected devices
flutter devices

# Run on specific device
flutter run -d <device-id>

# Enable verbose logging
flutter run -v
```

---

## 📤 Distribution

### Method 1: Direct APK Installation

```bash
# 1. Build APK
flutter build apk --release

# 2. Copy to device
adb install build/app/outputs/flutter-apk/app-release.apk

# Or share APK file via:
# - USB cable
# - Email
# - Cloud storage (Dropbox, Google Drive)
# - WhatsApp/Telegram
# - Local web server
```

### Method 2: QR Code Distribution

```bash
# 1. Host APK on web server
python3 -m http.server 8000

# 2. Generate QR code linking to:
http://your-ip:8000/app-release.apk

# 3. Users scan QR code and download
```

### Method 3: Enterprise MDM

Upload APK to your organization's Mobile Device Management system.

---

## 🔐 Signing (for Production)

### Generate Keystore

```bash
keytool -genkey -v -keystore ~/agriculture-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias agriculture
```

### Configure Signing

Create `android/key.properties`:

```properties
storePassword=your-store-password
keyPassword=your-key-password
keyAlias=agriculture
storeFile=/path/to/agriculture-key.jks
```

Edit `android/app/build.gradle`:

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

---

## 🐛 Common Issues

### Issue: "Flutter SDK not found"

```bash
# Add Flutter to PATH
export PATH="$PATH:`pwd`/flutter/bin"

# Windows: Add to Environment Variables
# PATH: C:\flutter\bin
```

### Issue: "Android licenses not accepted"

```bash
flutter doctor --android-licenses
```

### Issue: "Unable to locate Android SDK"

```bash
# Set ANDROID_HOME environment variable
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### Issue: GPS not working

- Enable location permissions in device settings
- For emulator: Use extended controls to set mock location

### Issue: Camera not working

- Grant camera permission
- Check AndroidManifest.xml has camera permission
- For emulator: Configure camera in AVD settings

---

## 📊 App Features

### Offline Capabilities
- ✅ Create surveys offline
- ✅ Store data locally (SQLite)
- ✅ Capture GPS coordinates
- ✅ Take photos
- ✅ Automatic sync when online

### Data Collection
- ✅ Farmer information
- ✅ GPS location with accuracy
- ✅ Farm details (size, crops, livestock)
- ✅ Pest/disease reporting
- ✅ Photo documentation
- ✅ Notes and observations

### Sync Features
- ✅ Manual sync button
- ✅ Shows unsynced count
- ✅ Conflict handling
- ✅ Connection testing
- ✅ Configurable server URL

---

## 🔄 Updates & Maintenance

### Update Dependencies

```bash
flutter pub upgrade
```

### Check for Outdated Packages

```bash
flutter pub outdated
```

### Update Flutter SDK

```bash
flutter upgrade
```

---

## 📈 Performance Tips

1. **Enable R8/ProGuard** (already enabled in release builds)
2. **Optimize images** before capture (already set to 1920x1080, 85% quality)
3. **Batch sync** instead of syncing individual surveys
4. **Clean build** if experiencing issues:
   ```bash
   flutter clean
   flutter pub get
   flutter build apk --release
   ```

---

## 📱 Device Requirements

### Minimum Requirements
- Android 5.0 (API 21) or higher
- 100MB free storage
- GPS capability
- Camera (optional)

### Recommended
- Android 8.0+ (API 26)
- 500MB free storage
- 2GB RAM
- Good GPS accuracy

---

## 🎯 Field Deployment Checklist

- [ ] Build production APK
- [ ] Test on actual devices
- [ ] Configure server URL
- [ ] Test sync functionality
- [ ] Grant all permissions
- [ ] Train field staff
- [ ] Provide user manual
- [ ] Setup support channel
- [ ] Monitor first week
- [ ] Collect feedback

---

## 📞 Support

For issues or questions:
1. Check `flutter doctor`
2. Review app logs: `flutter logs`
3. Test server connection in Settings
4. Verify server is running and accessible
5. Check firewall/network settings

---

## 🎓 Training Materials

### For Field Staff

**Basic Usage:**
1. Open app
2. Tap "New Survey" tab
3. Fill farmer information
4. Tap "Get GPS Location"
5. Select crops and enter livestock
6. Take photos if needed
7. Tap "Save Survey"
8. When back online, go to "Surveys" tab
9. Tap sync icon

**Troubleshooting:**
- If GPS not working: Go outside, wait 30 seconds
- If sync fails: Check Settings > Test Connection
- If app crashes: Restart and try again

---

## 📝 Version Information

- Flutter SDK: 3.x
- Dart: 3.x
- Android: API 21+ (Android 5.0+)
- iOS: Not yet configured (can be added)

---

For more information, see the main project documentation.
