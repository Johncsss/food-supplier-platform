# Mobile App Order Integration Test

## Overview
This document describes how to test that orders created through the mobile app appear correctly in both the admin orders page and the user dashboard orders page.

## What Was Fixed

### 1. **User ID Mapping**
- **Issue**: Mobile app was sending `user.id` but dashboard was filtering by `firebaseUser.uid`
- **Fix**: API now stores both `userId` and `firebaseUid` fields for compatibility

### 2. **Order Data Structure**
- **Added**: `firebaseUid` field to match web app expectations
- **Added**: `userEmail` field for better tracking
- **Added**: `source: 'mobile-app'` to identify mobile orders
- **Enhanced**: Better user data structure in mobile app

### 3. **Dashboard Query Enhancement**
- **Issue**: Dashboard was only querying by `userId`
- **Fix**: Now queries by both `userId` and `firebaseUid` to catch all orders

### 4. **Visual Indicators**
- **Added**: Mobile app badge (📱 手機應用) in both admin and dashboard
- **Added**: User email display in admin orders
- **Enhanced**: Better order tracking and identification

## Testing Steps

### 1. **Create Order via Mobile App**
1. Open mobile app
2. Add items to cart
3. Complete checkout process
4. Note the order ID from success message

### 2. **Verify in Admin Orders** (`/admin/orders`)
1. Login as admin user
2. Navigate to `/admin/orders`
3. Look for the new order with:
   - Order ID matching mobile app
   - "📱 手機應用" badge
   - User email displayed
   - Status: "pending"

### 3. **Verify in Dashboard Orders** (`/dashboard/orders`)
1. Login with the same user account used in mobile app
2. Navigate to `/dashboard/orders`
3. Look for the new order with:
   - Order ID matching mobile app
   - "📱 手機應用" badge
   - All order details visible

## Expected Behavior

### Order Creation Flow
1. **Mobile App** → Creates order with `userId: firebaseUser.uid` and `firebaseUid: firebaseUser.uid`
2. **API** → Stores order in Firestore with both fields
3. **Admin Page** → Shows all orders (no filtering by user)
4. **Dashboard Page** → Shows orders filtered by `userId` OR `firebaseUid`

### Order Data Structure
```javascript
{
  id: "ORDER-1234-5678-9012",
  userId: "firebase_user_uid",
  firebaseUid: "firebase_user_uid",
  userEmail: "user@example.com",
  restaurantName: "Mobile User",
  items: [...],
  totalAmount: 80.00,
  status: "pending",
  source: "mobile-app",
  createdAt: timestamp,
  updatedAt: timestamp,
  // ... other fields
}
```

## Troubleshooting

### Issue 1: Order not appearing in dashboard
**Check**:
- User logged in with same Firebase account as mobile app
- Firebase UID matches between mobile app and web app
- Check browser console for Firestore permission errors

### Issue 2: Order not appearing in admin
**Check**:
- Admin user has proper permissions
- Firestore security rules allow admin to read all orders
- Check server logs for order creation confirmation

### Issue 3: Missing mobile app badge
**Check**:
- Order was created after the fix was implemented
- `source` field is set to "mobile-app"
- Admin/dashboard pages have been updated

## Debugging Commands

### Check Order in Firestore
```javascript
// In browser console on admin/dashboard page
const orderId = "ORDER-1234-5678-9012";
const orderRef = firebase.firestore().collection('orders').doc(orderId);
orderRef.get().then(doc => {
  if (doc.exists) {
    console.log('Order data:', doc.data());
  } else {
    console.log('Order not found');
  }
});
```

### Check User ID Consistency
```javascript
// In mobile app console
console.log('Firebase UID:', firebaseUser.uid);
console.log('User ID:', user.id);

// In web app console
console.log('Firebase UID:', firebaseUser.uid);
console.log('User ID:', user.id);
```

## Success Criteria
✅ Order appears in admin orders page with mobile app badge  
✅ Order appears in dashboard orders page with mobile app badge  
✅ Order has correct user information and email  
✅ Order status is "pending" initially  
✅ All order details (items, total, address) are correct  

The integration should now work seamlessly between mobile app and web admin/dashboard! 🎉
