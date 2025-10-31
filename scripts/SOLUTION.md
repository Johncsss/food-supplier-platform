# Solution for Mobile App Authentication Error

## Problem
The mobile app is getting "Missing or insufficient permissions" error when trying to sign in with `test@test.com` because:

1. **Mobile app uses custom authentication** (not Firebase Auth)
2. **Firestore security rules** require authentication for user collection access
3. **Test user doesn't exist** in Firestore yet

## Solution Steps

### Step 1: Deploy Updated Firestore Rules

The Firestore rules have been updated to allow reading users collection for mobile app authentication. You need to deploy them:

**Option A: Using Firebase Console (Recommended)**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `foodbooking-3ccec`
3. Navigate to **Firestore Database** > **Rules**
4. Replace the current rules with:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection - allow read for email-based queries (mobile app authentication)
    match /users/{userId} {
      allow read: if true; // Allow reading users for email-based authentication
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Orders collection - users can read their own orders, admins can read all
    match /orders/{orderId} {
      allow read: if request.auth != null && (
        resource.data.userId == request.auth.uid || 
        request.auth.token.admin == true
      );
      allow write: if request.auth != null && (
        request.resource.data.userId == request.auth.uid || 
        request.auth.token.admin == true
      );
    }

    // Products collection - anyone can read, only admins can write
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }

    // Inventory collection - only admins can access
    match /inventory/{itemId} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }

    // Admin settings - only admins can access
    match /admin/{document=**} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }

    // Analytics collection - only admins can access
    match /analytics/{document=**} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }

    // Default rule - deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

5. Click **Publish**

**Option B: Using Firebase CLI**
```bash
# Login to Firebase (you'll need to do this in a terminal with browser access)
firebase login

# Deploy the rules
firebase deploy --only firestore:rules
```

### Step 2: Create Test User in Firestore

After deploying the rules, create the test user:

```bash
node scripts/create-test-user-firestore.js
```

### Step 3: Test Mobile App Login

Now the mobile app should be able to sign in with:
- **Email**: `test@test.com`
- **Password**: `test123` (or any password - mobile app doesn't validate this)

## How Mobile App Authentication Works

The mobile app uses a **custom authentication system**:

1. **No Firebase Auth**: It doesn't use Firebase Authentication
2. **Firestore-based**: It searches for users in Firestore by email
3. **Session Storage**: It stores user session in AsyncStorage
4. **Password Ignored**: The mobile app doesn't validate passwords

## Security Note

The updated rules allow reading all users for email-based authentication. This is necessary for the mobile app's custom auth system, but you may want to implement additional security measures in production.

## Test Credentials

- **Email**: `test@test.com`
- **Password**: `test123` (for reference only - mobile app doesn't validate)
- **User ID**: `USER-TEST-0001-0001`
