// API Configuration for Mobile App
export const API_CONFIG = {
  // Base URLs for different environments
  // For development, you can change this to your local machine's IP address
  // Example: 'http://192.168.1.100:3000' (replace with your actual IP)
  BASE_URL: __DEV__ 
    ? 'http://localhost:3000'  // Development - using localhost for development
    : 'https://your-production-domain.com',  // Production - update this with your actual domain
  
  // API Endpoints
  ENDPOINTS: {
    CREATE_ORDER: '/api/create-order',
    TEST: '/api/test',
    ORDERS: '/api/orders',
    USER_CLAIMS: '/api/check-user-claims',
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
