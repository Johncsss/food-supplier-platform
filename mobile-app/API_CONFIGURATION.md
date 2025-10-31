# Mobile App API Configuration

## Overview
The mobile app connects to the backend API to create orders and manage data. This document explains how to configure the API connection.

## Configuration File
The API configuration is located in `src/config/api.ts`.

## Development Setup

### 1. Local Development
For local development, the app connects to `http://localhost:3000` by default.

### 2. Network Development (Testing on Physical Device)
If you're testing on a physical device or emulator that can't access `localhost`, you need to:

1. Find your computer's IP address:
   ```bash
   # On macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # On Windows
   ipconfig | findstr "IPv4"
   ```

2. Update the API configuration in `mobile-app/src/config/api.ts`:
   ```typescript
   BASE_URL: __DEV__ 
     ? 'http://YOUR_IP_ADDRESS:3000'  // Replace YOUR_IP_ADDRESS with your actual IP
     : 'https://your-production-domain.com',
   ```

3. Make sure your Next.js development server is running:
   ```bash
   cd /path/to/your/project
   npm run dev
   # or
   yarn dev
   ```

4. Ensure your computer and mobile device are on the same network.

## Production Setup
Update the production URL in `mobile-app/src/config/api.ts`:
```typescript
BASE_URL: __DEV__ 
  ? 'http://localhost:3000'
  : 'https://your-actual-domain.com',  // Replace with your production domain
```

## Testing API Connectivity

### 1. Using the Connectivity Indicator
The app includes a `ConnectivityIndicator` component that automatically tests API connectivity.

### 2. Manual Testing
You can test the API manually by:
1. Adding items to cart
2. Attempting checkout
3. Checking the console logs for connectivity status

### 3. Using Test Utils
The `src/utils/testApi.ts` file contains utility functions for testing API connectivity:
```typescript
import { testApiConnection } from '../utils/testApi';

// Test basic connectivity
const result = await testApiConnection();
console.log('API Test Result:', result);
```

## Troubleshooting

### Common Issues

1. **"無法連接到伺服器" (Cannot connect to server)**
   - Check if the Next.js server is running
   - Verify the IP address in the configuration
   - Ensure devices are on the same network

2. **"Request timeout"**
   - Check network connection
   - Verify the server is accessible
   - Try increasing the timeout in `API_CONFIG.TIMEOUT`

3. **"Failed to fetch"**
   - Usually indicates network connectivity issues
   - Check firewall settings
   - Verify the server is running on the correct port

### Debug Steps

1. **Check Server Status**
   ```bash
   curl http://localhost:3000/api/test
   ```

2. **Check Network Connectivity**
   ```bash
   ping YOUR_IP_ADDRESS
   ```

3. **Check Mobile App Logs**
   - Use React Native debugger
   - Check Metro bundler logs
   - Use `console.log` statements in the app

## API Endpoints

The mobile app uses the following API endpoints:

- `GET /api/test` - Health check
- `POST /api/create-order` - Create new order
- `GET /api/orders` - Get user orders
- `POST /api/check-user-claims` - Verify user authentication

## Security Notes

- The API configuration is client-side, so sensitive information should not be stored here
- Use HTTPS in production
- Consider implementing API key authentication for production use
