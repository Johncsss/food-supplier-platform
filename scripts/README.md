# Test User Password Setup

## Current Status
The test account `test@test.com` exists but the password needs to be reset to `test123`.

## Solutions to Set Password

### Option 1: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `foodbooking-3ccec`
3. Navigate to **Authentication** > **Users**
4. Find the user with email `test@test.com`
5. Click the three dots menu next to the user
6. Select **Reset password**
7. The user will receive a password reset email
8. Or click **Edit** and manually set the password to `test123`

### Option 2: Using Firebase Admin SDK
1. Download the service account key from Firebase Console:
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save it as `serviceAccountKey.json` in the project root
2. Install Firebase Admin SDK:
   ```bash
   npm install firebase-admin
   ```
3. Run the reset script:
   ```bash
   node scripts/reset-test-password.js
   ```

### Option 3: Manual Registration
1. Delete the existing `test@test.com` user from Firebase Console
2. Use the registration form in your app to create a new account
3. Use email: `test@test.com` and password: `test123`

## Test Account Credentials
- **Email**: `test@test.com`
- **Password**: `test123`

## Verification
After setting the password, you can test the login by:
1. Going to the login page
2. Entering `test@test.com` as email
3. Entering `test123` as password
4. Clicking the login button

The account should successfully log in and redirect to the dashboard.
