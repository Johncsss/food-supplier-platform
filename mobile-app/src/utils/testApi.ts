import { API_CONFIG, buildApiUrl } from '../config/api';

// Test function to verify API connectivity
export const testApiConnection = async (): Promise<{
  success: boolean;
  message: string;
  endpoint: string;
}> => {
  const endpoint = buildApiUrl(API_CONFIG.ENDPOINTS.TEST);
  
  try {
    console.log('Testing API connection to:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('API test successful:', data);
      return {
        success: true,
        message: 'API connection successful',
        endpoint: endpoint,
      };
    } else {
      console.error('API test failed with status:', response.status);
      return {
        success: false,
        message: `API test failed with status: ${response.status}`,
        endpoint: endpoint,
      };
    }
  } catch (error) {
    console.error('API test error:', error);
    return {
      success: false,
      message: `API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      endpoint: endpoint,
    };
  }
};

// Test function to verify order creation endpoint
export const testOrderCreation = async (testData: any): Promise<{
  success: boolean;
  message: string;
  endpoint: string;
}> => {
  const endpoint = buildApiUrl(API_CONFIG.ENDPOINTS.CREATE_ORDER);
  
  try {
    console.log('Testing order creation endpoint:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const responseText = await response.text();
    console.log('Order creation test response:', responseText);

    return {
      success: response.ok,
      message: response.ok ? 'Order creation endpoint accessible' : `Order creation failed: ${response.status}`,
      endpoint: endpoint,
    };
  } catch (error) {
    console.error('Order creation test error:', error);
    return {
      success: false,
      message: `Order creation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      endpoint: endpoint,
    };
  }
};
