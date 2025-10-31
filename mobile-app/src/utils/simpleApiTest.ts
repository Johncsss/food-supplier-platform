// Simple API test without any AbortController or timeout mechanisms
export const testSimpleApi = async (): Promise<{
  success: boolean;
  message: string;
  url: string;
}> => {
  const baseUrl = __DEV__ ? 'http://localhost:3000' : 'https://your-production-domain.com';
  const testUrl = `${baseUrl}/api/test`;
  
  try {
    console.log('Testing simple API call to:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
    });
    
    console.log('Simple API test response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Simple API test successful:', data);
      return {
        success: true,
        message: 'API is accessible',
        url: testUrl,
      };
    } else {
      return {
        success: false,
        message: `API returned status ${response.status}`,
        url: testUrl,
      };
    }
  } catch (error) {
    console.error('Simple API test failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      url: testUrl,
    };
  }
};

// Test order creation endpoint
export const testSimpleOrderCreation = async (): Promise<{
  success: boolean;
  message: string;
  url: string;
}> => {
  const baseUrl = __DEV__ ? 'http://localhost:3000' : 'https://your-production-domain.com';
  const orderUrl = `${baseUrl}/api/create-order`;
  
  try {
    console.log('Testing simple order creation to:', orderUrl);
    
    // Minimal test data
    const testData = {
      items: [{
        productId: 'test-1',
        productName: 'Test Product',
        quantity: 1,
        unitPrice: 10,
        totalPrice: 10,
        imageUrl: ''
      }],
      totalAmount: 10,
      user: {
        id: 'test-user',
        email: 'test@example.com',
        restaurantName: 'Test Restaurant',
        address: {
          street: 'Test Street',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345'
        }
      }
    };
    
    const response = await fetch(orderUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    console.log('Simple order creation test response status:', response.status);
    
    const responseText = await response.text();
    console.log('Simple order creation test response:', responseText);
    
    return {
      success: response.ok,
      message: response.ok ? 'Order creation endpoint accessible' : `Order creation failed with status ${response.status}`,
      url: orderUrl,
    };
  } catch (error) {
    console.error('Simple order creation test failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      url: orderUrl,
    };
  }
};
