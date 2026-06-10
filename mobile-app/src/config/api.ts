// API Configuration for Mobile App
// Next.js dev server (from `yarn dev` in project root) runs on port 3010.
// - Simulator: localhost works (same machine as dev server).
// - Real device: use your computer's LAN IP below.
const DEV_SERVER_PORT = 3010;
// Use localhost in dev so simulator and same-machine testing hit the dev server.
// For testing on a physical device, change to your Mac's LAN IP e.g. 'http://192.168.31.161:3010'
const DEV_BASE_URL = `http://localhost:${DEV_SERVER_PORT}`;

export const API_CONFIG = {
  // Base URLs for different environments
  BASE_URL: __DEV__
    ? DEV_BASE_URL
    : 'https://www.ifoodpulse.com',  // Production
  
  // API Endpoints
  ENDPOINTS: {
    CREATE_ORDER: '/api/create-order',
    TEST: '/api/test',
    ORDERS: '/api/orders',
    USER_CLAIMS: '/api/check-user-claims',
    CREATE_COMPLAINT: '/api/create-complaint',
  },
  
  // Request timeout in milliseconds - increased for mobile networks
  TIMEOUT: 10000,
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
};

// Helper function to build full API URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to test API connectivity without AbortController
export const testApiConnectivity = async (): Promise<boolean> => {
  try {
    const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.TEST), {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.error('API connectivity test failed:', error);
    return false;
  }
};
