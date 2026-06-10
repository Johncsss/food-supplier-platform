import { API_CONFIG, buildApiUrl } from '../config/api';

// Helper function to test different API endpoints
export const testApiEndpoints = async (): Promise<{
  success: boolean;
  workingEndpoint?: string;
  errors: string[];
}> => {
  // Try multiple endpoints in development, but keep production lean.
  // In production builds we only test the primary BASE_URL so that
  // offline/blocked connections fail fast instead of hanging while
  // probing localhost-style dev endpoints that can never work.
  const endpoints = __DEV__
    ? Array.from(
        new Set([
          API_CONFIG.BASE_URL,            // Primary (DEV_BASE_URL in dev)
          'https://www.ifoodpulse.com',   // Explicit production fallback for dev builds
          'http://localhost:3000',        // iOS simulator on same machine
          'http://10.0.2.2:3000',         // Android emulator localhost
          'http://127.0.0.1:3000',        // Fallback localhost
        ]),
      )
    : [API_CONFIG.BASE_URL];             // Production: only the real domain

  const errors: string[] = [];
  
  for (const endpoint of endpoints) {
    // Add a per-endpoint timeout so we never hang indefinitely when testing.
    // This is critical for mobile networks where failed DNS/TLS handshakes
    // can otherwise block the entire checkout/cart flow.
    const controller = new AbortController();
    const timeoutMs = API_CONFIG.TIMEOUT || 10000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`Testing endpoint: ${endpoint}`);
      
      const response = await fetch(`${endpoint}/api/test`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
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
      clearTimeout(timeoutId);
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
