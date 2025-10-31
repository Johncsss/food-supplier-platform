# Manual Test User Setup for Mobile App

## Current Issue
The mobile app login is failing because the test user `test@test.com` doesn't exist in Firestore, and the Firestore rules need to be updated.

## Step-by-Step Solution

### Step 1: Update Firestore Rules (CRITICAL)

**You must update the Firestore rules first:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `foodbooking-3ccec`
3. Navigate to **Firestore Database** > **Rules**
4. Replace the current rules with this:

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

### Step 2: Create Test User in Firestore

After updating the rules, create the test user:

1. Go to **Firestore Database** > **Data**
2. Click **Start collection**
3. Collection ID: `users`
4. Document ID: `USER-TEST-0001-0001`
5. Add these fields:

```json
{
  "id": "USER-TEST-0001-0001",
  "firebaseUid": "USER-TEST-0001-0001",
  "email": "test@test.com",
  "name": "Test User",
  "restaurantName": "Test Restaurant",
  "phone": "+1234567890",
  "address": {
    "street": "123 Test Street",
    "city": "Test City",
    "state": "TS",
    "zipCode": "12345"
  },
  "membershipStatus": "active",
  "membershipExpiry": "2025-12-31T23:59:59.999Z",
  "createdAt": "2024-12-19T00:00:00.000Z",
  "updatedAt": "2024-12-19T00:00:00.000Z"
}
```

6. Click **Save**

### Step 3: Test Mobile App Login

Now try logging in with:
- **Email**: `test@test.com`
- **Password**: `testtest` (or any password - mobile app doesn't validate passwords)

## Important Notes

1. **Mobile app doesn't validate passwords** - it only checks if the user exists in Firestore
2. **Email must match exactly** - `test@test.com`
3. **User must exist in Firestore** - that's why we're creating it manually
4. **Firestore rules must allow reading** - that's why we updated the rules

## Troubleshooting

If login still fails after following these steps:

1. **Check Firestore rules were published** - go back to Rules tab and verify they're saved
2. **Verify user exists** - check the users collection in Firestore Data tab
3. **Check email spelling** - make sure it's exactly `test@test.com`
4. **Restart mobile app** - close and reopen the app after changes

## Alternative: Use Script After Rules Update

Once the Firestore rules are updated, you can also run:

```bash
cd /Users/john/dev-FoodBuyer-2
node scripts/create-test-user-firestore.js
```

This will automatically create the test user.
