# iOS TestFlight Submission Guide

This guide will walk you through submitting your Expo app to iOS TestFlight.

## Prerequisites

1. **Apple Developer Account** ($99/year)
   - Sign up at https://developer.apple.com
   - Enroll in the Apple Developer Program

2. **App Store Connect Access**
   - Access at https://appstoreconnect.apple.com
   - You'll need to create an app record here

3. **Expo Account** (free tier works)
   - Sign up at https://expo.dev
   - Install EAS CLI: `npm install -g eas-cli`

## Step 1: Configure Your App

### 1.1 Update app.json

Update the `bundleIdentifier` in `app.json`:
- Change `com.yourcompany.foodsupplier` to your unique bundle identifier
- Format: `com.yourcompany.appname` (reverse domain notation)
- This must be unique and match what you register in App Store Connect

### 1.2 Update eas.json

Update the `submit` section in `eas.json` with your Apple credentials:
- `appleId`: Your Apple ID email
- `ascAppId`: Your App Store Connect App ID (get this after creating the app)
- `appleTeamId`: Your Apple Team ID (found in Apple Developer account)

## Step 2: Install EAS CLI

```bash
npm install -g eas-cli
```

## Step 3: Login to Expo

```bash
cd mobile-app
eas login
```

## Step 4: Configure EAS Build

```bash
eas build:configure
```

This will create/update your `eas.json` file.

## Step 5: Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - Platform: iOS
   - Name: FoodSupplier Mobile (or your preferred name)
   - Primary Language: Your language
   - Bundle ID: Create new or select existing (must match app.json)
   - SKU: A unique identifier (e.g., foodsupplier-mobile-001)
   - User Access: Full Access
4. Click "Create"
5. Note your App ID (you'll need this for eas.json)

## Step 6: Build iOS App

### Option A: Build on Expo's Servers (Recommended)

```bash
eas build --platform ios --profile production
```

This will:
- Build your app in the cloud
- Take 10-20 minutes
- Require you to provide your Apple credentials

### Option B: Build Locally (Requires macOS)

```bash
eas build --platform ios --profile production --local
```

## Step 7: Submit to TestFlight

### Option A: Automatic Submission (Easiest)

```bash
eas submit --platform ios --profile production
```

This will automatically upload your build to App Store Connect.

### Option B: Manual Submission

1. After build completes, download the `.ipa` file
2. Use **Transporter** app (from Mac App Store) or **Xcode**:
   - Open Transporter
   - Drag and drop the `.ipa` file
   - Click "Deliver"
3. Wait for processing (can take 10-30 minutes)

## Step 8: Configure TestFlight

1. Go to App Store Connect → Your App → TestFlight
2. Wait for build processing to complete (you'll get an email)
3. Add Internal Testers:
   - Go to "Internal Testing"
   - Add testers (up to 100)
   - They'll receive an email invitation
4. Add External Testers (optional):
   - Go to "External Testing"
   - Create a group
   - Add testers (up to 10,000)
   - Submit for Beta App Review (first time only)

## Step 9: Testers Install App

Testers will:
1. Receive an email invitation
2. Install "TestFlight" app from App Store (if not already installed)
3. Open the invitation link or open TestFlight app
4. Install your app

## Common Issues & Solutions

### Issue: "Bundle identifier already exists"
**Solution**: Change the bundle identifier in `app.json` to something unique

### Issue: "No provisioning profile found"
**Solution**: EAS will create this automatically, but you may need to:
- Ensure your Apple Developer account is active
- Check that your bundle identifier is registered in App Store Connect

### Issue: "Build failed"
**Solution**: 
- Check build logs: `eas build:list`
- Ensure all dependencies are compatible
- Check for any native module issues

### Issue: "Submission failed"
**Solution**:
- Verify your Apple credentials in `eas.json`
- Ensure the build was successful
- Check App Store Connect for any compliance issues

## Updating Your App

For subsequent updates:

1. Update version in `app.json`:
   ```json
   "version": "1.0.1",
   "ios": {
     "buildNumber": "2"
   }
   ```

2. Build and submit:
   ```bash
   eas build --platform ios --profile production
   eas submit --platform ios --profile production
   ```

## Useful Commands

```bash
# Check build status
eas build:list

# View build details
eas build:view [BUILD_ID]

# Check submission status
eas submit:list

# Update credentials
eas credentials
```

## Resources

- [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [EAS Submit Docs](https://docs.expo.dev/submit/introduction/)
- [Apple Developer Portal](https://developer.apple.com)
- [App Store Connect](https://appstoreconnect.apple.com)

## Notes

- First build takes longer (10-20 minutes)
- TestFlight builds expire after 90 days
- You can have up to 100 internal testers
- External testers require Beta App Review (first time)
- Each build needs a unique build number (increment in app.json)

