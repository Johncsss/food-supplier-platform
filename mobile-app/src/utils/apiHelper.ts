import { API_CONFIG, buildApiUrl } from '../config/api';

// Helper function to test different API endpoints
export const testApiEndpoints = async (): Promise<{
  success: boolean;
  workingEndpoint?: string;
  errors: string[];
}> => {
  const endpoints = [
    API_CONFIG.BASE_URL,
    'http://localhost:3000',
    'http://10.0.2.2:3000', // Android emulator localhost
    'http://127.0.0.1:3000',
  ];

  const errors: string[] = [];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing endpoint: ${endpoint}`);
      
      const response = await fetch(`${endpoint}/api/test`, {
        method: 'GET',
      });
      
      if (response.ok) {
        console.log(`✅ Endpoint ${endpoint} is working`);
        return {
          success: true,
          workingEndpoint: endpoint,
          errors: [],
        };
      } else {
        errors.push(`${endpoint}: HTTP ${response.status}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${endpoint}: ${errorMsg}`);
      console.log(`❌ Endpoint ${endpoint} failed: ${errorMsg}`);
    }
  }
  
  return {
    success: false,
    errors,
  };
};

// Helper function to get the best API endpoint for the current environment
export const getBestApiEndpoint = async (): Promise<string> => {
  const testResult = await testApiEndpoints();
  
  if (testResult.success && testResult.workingEndpoint) {
    console.log(`Using working endpoint: ${testResult.workingEndpoint}`);
    return testResult.workingEndpoint;
  }
  
  console.warn('No working endpoints found, using default:', API_CONFIG.BASE_URL);
  console.warn('Errors:', testResult.errors);
  
  return API_CONFIG.BASE_URL;
};
