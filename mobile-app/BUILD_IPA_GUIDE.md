# Building IPA File for App Store Submission

Quick guide for building an IPA file using EAS Build.

## Prerequisites

1. **EAS CLI installed globally:**
   ```bash
   npm install -g eas-cli
   ```

2. **Logged into Expo:**
   ```bash
   cd mobile-app
   eas login
   ```

3. **Apple Developer Account** - Active membership required ($99/year)

## Step 1: Update Build Number (Required)

Before building, increment the build number in `app.json`:

```json
"ios": {
  "buildNumber": "8",  // Increment from current "7"
  ...
}
```

Each App Store submission requires a unique, incrementing build number.

## Step 2: Build the IPA File

### Option A: Cloud Build (Recommended - No macOS required)

```bash
cd mobile-app
eas build --platform ios --profile production
```

This will:
- Build your app on Expo's servers (10-20 minutes)
- Generate an IPA file ready for App Store submission
- Prompt for Apple Developer credentials (first time)
- Provide a download link when complete

### Option B: Local Build (Requires macOS with Xcode)

```bash
cd mobile-app
eas build --platform ios --profile production --local
```

## Step 3: Download the IPA File

After the build completes:

1. **Via CLI:** The build will provide a download URL
   ```bash
   # View build status and download URL
   eas build:list
   ```

2. **Via Expo Dashboard:**
   - Go to https://expo.dev
   - Navigate to your project
   - Click on the build
   - Download the `.ipa` file

## Step 4: Submit to App Store Connect

### Option A: Automatic Submission (Easiest)

```bash
eas submit --platform ios --profile production
```

This automatically uploads your latest build to App Store Connect.

### Option B: Manual Submission

1. **Using Transporter App:**
   - Download "Transporter" from Mac App Store
   - Open Transporter
   - Drag and drop your `.ipa` file
   - Click "Deliver"

2. **Using Xcode:**
   - Open Xcode → Window → Organizer
   - Drag and drop your `.ipa` file
   - Click "Distribute App" → "App Store Connect" → "Upload"

## Step 5: Wait for Processing

- App Store Connect will process your build (10-30 minutes)
- You'll receive an email when processing is complete
- The build will appear in App Store Connect → Your App → TestFlight

## Quick Commands Reference

```bash
# Build for production
eas build --platform ios --profile production

# Submit to App Store Connect
eas submit --platform ios --profile production

# Check build status
eas build:list

# View specific build details
eas build:view [BUILD_ID]

# Check submission status
eas submit:list
```

## Current App Configuration

- **Bundle ID:** `com.ifoodpulse.ifoodpulse`
- **Current Version:** `1.0.0`
- **Current Build Number:** `7` (increment before new build)
- **EAS Project ID:** `b92234a8-43c9-4793-86a9-b39f45d4b8f0`

## Troubleshooting

### Build Fails
- Check logs: `eas build:list` then `eas build:view [BUILD_ID]`
- Verify all dependencies are compatible
- Check for native module issues

### Credentials Issues
```bash
# Update credentials
eas credentials
```

### Need to Increment Version
Update in `app.json`:
```json
"version": "1.0.1",  // Increment version
"ios": {
  "buildNumber": "8"  // Increment build number
}
```

## Important Notes

- ✅ Build numbers must always increment
- ✅ Version can stay the same, but build number must increase
- ✅ First build takes longer (credentials setup)
- ✅ IPA files can be downloaded and submitted manually
- ✅ Builds expire after 90 days in TestFlight

