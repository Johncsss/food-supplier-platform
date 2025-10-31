# Checkout Process Debugging Guide

## Issue: Checkout Stuck on "處理中..." (Processing...)

If the checkout process gets stuck on "處理中...", follow this debugging guide.

## What Was Fixed

### 1. **Invalid Timeout Option**
- **Problem**: The `fetch` API doesn't support a `timeout` option
- **Fix**: Implemented proper timeout using `AbortController` and `setTimeout`

### 2. **Connectivity Test Blocking**
- **Problem**: The connectivity test was hanging and blocking the checkout process
- **Fix**: Removed the connectivity test and go directly to order creation

### 3. **No Overall Timeout**
- **Problem**: No timeout for the entire checkout process
- **Fix**: Added 30-second overall timeout with proper cleanup

### 4. **Missing Error Handling**
- **Problem**: Errors could cause the process to hang indefinitely
- **Fix**: Added comprehensive error handling and cleanup

## Debugging Steps

### 1. Check Console Logs
Open the React Native debugger and look for these console logs:
```
Proceeding with checkout (skipping connectivity test)...
Starting checkout attempt 1/3
Making fetch request...
Fetch request completed
Response status: 200
```

### 2. Verify API Configuration
Check the API URL in `mobile-app/src/config/api.ts`:
```typescript
BASE_URL: __DEV__ 
  ? 'http://localhost:3000'  // For simulator/emulator
  : 'https://your-production-domain.com',
```

### 3. Test Backend Manually
Test if the backend is accessible:
```bash
# Test the API endpoint
curl http://localhost:3000/api/test

# Expected response:
{
  "success": true,
  "message": "Mobile app connectivity test successful",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "server": "Next.js API",
  "version": "1.0.0"
}
```

### 4. Check Network Configuration
If testing on a physical device:
1. Find your computer's IP address
2. Update `BASE_URL` in `api.ts` to use your IP
3. Ensure both devices are on the same network

## Common Issues and Solutions

### Issue 1: "無法連接到伺服器" (Cannot connect to server)
**Solution**: 
- Check if Next.js server is running (`npm run dev`)
- Verify the IP address in API configuration
- Check firewall settings

### Issue 2: "Request timeout"
**Solution**:
- Check network connection
- Increase timeout in `API_CONFIG.TIMEOUT`
- Verify server is responding

### Issue 3: "處理超時" (Processing timeout)
**Solution**:
- This is the 30-second safety timeout
- Check console logs to see where it's getting stuck
- Verify backend is working properly

## Testing the Fix

1. **Add items to cart**
2. **Click "進行結帳" (Proceed to Checkout)**
3. **Expected behavior**:
   - Shows "處理中..." for a few seconds
   - Either shows success message or error message
   - Never gets stuck indefinitely

## Configuration for Different Environments

### Development (Simulator/Emulator)
```typescript
BASE_URL: 'http://localhost:3000'
```

### Development (Physical Device)
```typescript
BASE_URL: 'http://192.168.1.100:3000'  // Replace with your IP
```

### Production
```typescript
BASE_URL: 'https://your-actual-domain.com'
```

## Additional Debugging Tools

### 1. Connectivity Indicator Component
Use the `ConnectivityIndicator` component to test API connectivity:
```typescript
import ConnectivityIndicator from '../components/ConnectivityIndicator';

// Add to your screen
<ConnectivityIndicator />
```

### 2. Test API Utility
Use the test utility functions:
```typescript
import { testApiConnection } from '../utils/testApi';

const result = await testApiConnection();
console.log('API Test Result:', result);
```

## If Issues Persist

1. **Check React Native logs** in Metro bundler
2. **Verify backend logs** in Next.js console
3. **Test API endpoints manually** with curl or Postman
4. **Check network connectivity** between mobile device and server
5. **Verify Firebase configuration** is correct

The checkout process should now work reliably without getting stuck on "處理中...".
