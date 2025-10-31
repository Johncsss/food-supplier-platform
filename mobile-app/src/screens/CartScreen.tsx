import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { API_CONFIG, buildApiUrl, testApiConnectivity } from '../config/api';
import { getBestApiEndpoint } from '../utils/apiHelper';
import PointsPurchaseModal from '../components/PointsPurchaseModal';
import CheckoutPasswordModal from '../components/CheckoutPasswordModal';

const CartScreen: React.FC = () => {
  const { items, totalAmount, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user, firebaseUser, loading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showCheckoutPasswordModal, setShowCheckoutPasswordModal] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<number>(user?.memberPoints || 0);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(true);

  // Update currentPoints when user data changes
  useEffect(() => {
    if (user?.memberPoints !== undefined) {
      setCurrentPoints(user.memberPoints);
    }
  }, [user?.memberPoints]);

  // Fetch real points balance from API
  useEffect(() => {
    const fetchBalance = async () => {
      // Always start with user data as fallback
      const fallbackPoints = user?.memberPoints || 0;
      setCurrentPoints(fallbackPoints);
      
      if (!firebaseUser?.uid) {
        setLoadingBalance(false);
        return;
      }
      
      try {
        setLoadingBalance(true);
        const baseEndpoint = await getBestApiEndpoint();
        console.log('Fetching points balance from:', `${baseEndpoint}/api/purchase-points?userId=${firebaseUser.uid}`);
        
        const res = await fetch(`${baseEndpoint}/api/purchase-points?userId=${firebaseUser.uid}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Points balance response status:', res.status);
        
        if (res.ok) {
          const data = await res.json();
          console.log('Points balance response data:', data);
          
          if (typeof data.memberPoints === 'number') {
            setCurrentPoints(data.memberPoints);
            console.log('Successfully updated points balance:', data.memberPoints);
          } else {
            console.log('Invalid memberPoints data, using fallback:', data);
            setCurrentPoints(fallbackPoints);
          }
        } else {
          console.log('API request failed, using fallback points');
          setCurrentPoints(fallbackPoints);
        }
      } catch (err) {
        console.error('Failed to fetch points balance:', err);
        setCurrentPoints(fallbackPoints);
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [firebaseUser, user]);

  // Safely parse JSON from a fetch Response. Avoids crashes on empty/non-JSON bodies
  const parseResponseSafely = async (response: Response): Promise<any> => {
    // 204 No Content or Content-Length: 0
    if (response.status === 204) return {};

    const contentType = response.headers.get('content-type') || '';
    const contentLength = response.headers.get('content-length');
    if (contentLength === '0') return {};

    try {
      // Prefer text first to detect empty bodies
      const text = await response.text();
      if (!text) return {};
      if (!contentType.includes('application/json')) {
        // Attempt JSON parse; if it fails, return raw text for diagnostics
        try {
          return JSON.parse(text);
        } catch {
          return { raw: text };
        }
      }
      return JSON.parse(text);
    } catch (e) {
      // Fall back to empty object if parsing fails
      return {};
    }
  };

  // Cleanup effect to reset loading state if component unmounts during checkout
  useEffect(() => {
    return () => {
      if (isProcessing) {
        console.log('Component unmounting during checkout, resetting processing state');
        setIsProcessing(false);
      }
    };
  }, [isProcessing]);

  const handleRemoveItem = (productId: string) => {
    Alert.alert(
      '移除商品',
      '確定要從購物車中移除這個商品嗎？',
      [
        { text: '取消', style: 'cancel' },
        { text: '確定', onPress: () => removeFromCart(productId) }
      ]
    );
  };

  const handlePasswordIncorrect = () => {
    Alert.alert('密碼錯誤', '請重新輸入正確的結帳密碼');
  };

  const handleClearCart = () => {
    Alert.alert(
      '清空購物車',
      '確定要清空購物車嗎？',
      [
        { text: '取消', style: 'cancel' },
        { text: '確定', onPress: clearCart }
      ]
    );
  };

  const handleCheckout = async () => {
    if (loading) {
      Alert.alert('載入中', '正在取得帳戶資料，請稍候...');
      return;
    }

    if (!firebaseUser) {
      Alert.alert('錯誤', '請先登入');
      return;
    }

    if (items.length === 0) {
      Alert.alert('購物車為空', '請先添加商品到購物車');
      return;
    }

    // Test API connectivity first
    try {
      const baseEndpoint = await getBestApiEndpoint();
      console.log('Testing API connectivity before checkout:', baseEndpoint);
      
      const testResponse = await fetch(`${baseEndpoint}/api/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!testResponse.ok) {
        throw new Error(`API test failed: ${testResponse.status}`);
      }
      
      console.log('API connectivity test passed');
    } catch (error) {
      console.error('API connectivity test failed:', error);
      Alert.alert(
        '網路連接問題',
        '無法連接到伺服器，請檢查網路連接後重試。',
        [{ text: '確定' }]
      );
      return;
    }

    // Check if user has enough points
    const requiredPoints = totalAmount;
    const userPoints = currentPoints;

    if (userPoints < requiredPoints) {
      const shortfall = requiredPoints - userPoints;
      Alert.alert(
        '點數不足',
        `需要 ${requiredPoints} 點，您只有 ${userPoints} 點。\n還需要購買 ${shortfall} 點才能完成結帳。`,
        [
          { text: '確定', style: 'cancel' },
          { text: '購買點數', onPress: () => setShowPointsModal(true) }
        ]
      );
      return;
    }

    // Check if user has set up checkout password
    if (!user?.checkoutPassword) {
      Alert.alert(
        '需要設定結帳密碼',
        '請先到個人資料頁面設定結帳密碼',
        [
          { text: '確定', style: 'default' }
        ]
      );
      return;
    }

    // Show checkout password modal
    setShowCheckoutPasswordModal(true);
  };

  const handlePasswordVerified = async () => {
    setShowCheckoutPasswordModal(false);
    setIsProcessing(true);

    // Set an overall timeout for the entire checkout process
    const overallTimeout = setTimeout(() => {
      console.error('Checkout process timed out after 60 seconds');
      setIsProcessing(false);
      Alert.alert(
        '處理超時',
        '結帳處理時間過長，請稍後再試或檢查網路連接。',
        [{ text: '確定' }]
      );
    }, 60000); // 60 second overall timeout

    const authUser = user || {
      id: firebaseUser.uid,
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || '',
      restaurantName: firebaseUser.displayName || 'Mobile User',
      phone: '',
      address: { 
        street: '', 
        city: '', 
        state: '', 
        zipCode: '' 
      },
      membershipStatus: 'inactive',
      membershipExpiry: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Skip connectivity test to avoid AbortSignal issues
    console.log('Skipping connectivity test, proceeding directly to checkout...');
    
    console.log('Proceeding with checkout...');

    // Retry logic for server restarts - reduced for faster checkout
    let retries = 2; // Increased retries for better reliability
    let lastError = null;

    while (retries > 0) {
      try {
        console.log(`Starting checkout attempt ${3 - retries}/2`);
        
        // First, deduct points
        console.log('Deducting points first...');
        // Resolve best base endpoint at runtime (emulator/device friendly)
        const baseEndpoint = await getBestApiEndpoint();
        const deductUrl = `${baseEndpoint}/api/deduct-points`;
        
        console.log('Deducting points from URL:', deductUrl);
        console.log('Deducting points data:', {
          userId: firebaseUser.uid,
          amount: requiredPoints,
          description: `結帳購買商品，總金額 ${requiredPoints} 點`
        });
        
        // Add timeout for deduct points API call
        const deductController = new AbortController();
        const deductTimeout = setTimeout(() => deductController.abort(), 20000); // Increased to 20 second timeout
        
        const deductResponse = await fetch(deductUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: firebaseUser.uid,
            amount: requiredPoints,
            description: `結帳購買商品，總金額 ${requiredPoints} 點`
          }),
          signal: deductController.signal,
        });
        
        clearTimeout(deductTimeout);

        console.log('Deduct points response status:', deductResponse.status);
        console.log('Deduct points response headers:', Object.fromEntries(deductResponse.headers.entries()));

        const deductResult = await parseResponseSafely(deductResponse);
        console.log('Deduct points result:', deductResult);

        if (!deductResponse.ok) {
          const errorMsg = deductResult.error || deductResult.message || '點數扣除失敗';
          console.error('Points deduction failed:', errorMsg);
          throw new Error(errorMsg);
        }

        console.log('Points deducted successfully:', deductResult);

        // Create order items from cart items
        const orderItems = items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          imageUrl: item.imageUrl || '',
          supplier: item.supplier || ''
        }));

        const orderData = {
          items: orderItems,
          totalAmount: totalAmount,
          pointsUsed: requiredPoints,
          pointsTransactionId: deductResult.transactionId,
          user: authUser
        };

        // Send order to API
        console.log('Attempting to create order with data:', JSON.stringify(orderData, null, 2));
        const apiUrl = `${baseEndpoint}${API_CONFIG.ENDPOINTS.CREATE_ORDER}`;
        console.log('API URL:', apiUrl);
        console.log('Making fetch request...');
        
        // Add timeout for order creation API call
        const orderController = new AbortController();
        const orderTimeout = setTimeout(() => orderController.abort(), 20000); // 20 second timeout
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
          signal: orderController.signal,
        });
        
        clearTimeout(orderTimeout);
        
        console.log('Fetch request completed successfully');
        console.log('Response status:', response.status);
        console.log('Response statusText:', response.statusText);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        // If response is not ok, try to parse error details
        if (!response.ok) {
          console.log('Response not ok. Status:', response.status, response.statusText);
          let errorMessage = 'Failed to create order';
          let errorDetails = '';
          
          try {
            const errorData = await parseResponseSafely(response);
            console.log('Error data:', errorData);
            errorMessage = errorData.error || errorData.message || errorMessage;
            errorDetails = errorData.details || '';
          } catch (parseError) {
            console.log('Failed to parse error response:', parseError);
            // If we can't parse the error, use the status text
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          
          // Log detailed error information
          console.error('Order creation failed:', {
            status: response.status,
            statusText: response.statusText,
            errorMessage,
            errorDetails,
            endpoint: API_CONFIG.BASE_URL,
            retryAttempt: API_CONFIG.MAX_RETRIES + 1 - retries
          });
          
          // If it's a 404 or 500, it might be a server restart, so retry
          if (response.status === 404 || response.status === 500) {
            console.log(`Attempt ${3 - retries}/2: Server might be restarting, retrying...`);
            retries--;
            if (retries > 0) {
              Alert.alert('重試中', `訂單創建失敗，正在重試... (${3 - retries}/2)`);
              await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
              continue;
            }
          }
          
          throw new Error(`${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`);
        }

        const data = await parseResponseSafely(response);

        if (data.success) {
          clearTimeout(overallTimeout); // Clear the overall timeout
          setIsProcessing(false); // Reset loading state before showing alert
          // Update points balance after successful checkout
          setCurrentPoints(deductResult.newBalance);
          Alert.alert(
            '訂單已建立',
            `您的訂單已成功建立！\n訂單編號: ${data.orderId || 'N/A'}\n使用點數: ${requiredPoints} 點\n剩餘點數: ${deductResult.newBalance} 點\n\n可以在訂單頁面查看詳情。`,
            [
              {
                text: '確定',
                onPress: () => {
                  clearCart();
                  // Navigate to orders screen (you can implement navigation here)
                  console.log('Order created successfully, cart cleared');
                }
              }
            ]
          );
          return; // Success, exit the retry loop
        } else {
          throw new Error(data.message || 'Order creation failed');
        }
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${API_CONFIG.MAX_RETRIES + 1 - retries}/${API_CONFIG.MAX_RETRIES} failed:`, error);
        
        // Handle specific error types
        let errorMessage = 'Unknown error';
        let shouldRetry = true;
        
        if (error instanceof Error) {
          if (error.name === 'AbortError' || error.message === 'Request timeout') {
            errorMessage = '請求超時 - 請檢查網路連接或稍後再試';
            shouldRetry = false; // Don't retry on timeout
          } else if (error.message.includes('Network request failed')) {
            errorMessage = '網路連接失敗 - 請檢查網路設置';
          } else if (error.message.includes('Failed to fetch')) {
            errorMessage = '無法連接到伺服器 - 請檢查網路連接';
          } else if (error.message.includes('TypeError')) {
            errorMessage = '網路錯誤 - 請檢查網路連接';
          } else if (error.message.includes('The operation was aborted')) {
            errorMessage = '操作被取消 - 請檢查網路連接';
            shouldRetry = false; // Don't retry on abort
          } else {
            errorMessage = error.message;
          }
        }
        
        console.error('Error details:', {
          message: errorMessage,
          name: error instanceof Error ? error.name : 'Unknown',
          stack: error instanceof Error ? error.stack : undefined,
          endpoint: API_CONFIG.BASE_URL,
          retryAttempt: API_CONFIG.MAX_RETRIES + 1 - retries,
          orderData: {
            itemCount: orderItems.length,
            totalAmount,
            userId: authUser.id,
            userEmail: authUser.email
          }
        });
        
        retries--;
        if (retries > 0 && shouldRetry) {
          Alert.alert('重試中', `訂單創建失敗，正在重試... (${3 - retries}/2)`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        } else if (!shouldRetry) {
          // Don't retry for timeout errors
          break;
        }
      }
    }

    // All retries failed
    clearTimeout(overallTimeout); // Clear the overall timeout
    console.error('All retry attempts failed:', lastError);
    
    // Provide specific error message based on the last error
    let finalErrorMessage = '請稍後再試';
    if (lastError instanceof Error) {
      if (lastError.name === 'AbortError' || lastError.message === 'Request timeout') {
        finalErrorMessage = '網路連接超時，請檢查網路連接後重試';
      } else if (lastError.message.includes('Network request failed')) {
        finalErrorMessage = '網路連接失敗，請檢查網路設置';
      } else if (lastError.message.includes('Failed to fetch')) {
        finalErrorMessage = '無法連接到伺服器，請檢查網路連接';
      } else {
        finalErrorMessage = lastError.message;
      }
    }
    
    Alert.alert(
      '訂單創建失敗', 
      finalErrorMessage,
      [
        { text: '重試', onPress: () => handleCheckout() },
        { text: '取消', style: 'cancel' }
      ]
    );
    setIsProcessing(false);
  };

  const renderCartItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.productName}</Text>
        <Text style={styles.itemPrice}>HKD$ {item.unitPrice}</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.productId, item.quantity - 1)}
          disabled={item.quantity <= 1}
        >
          <Text style={[styles.quantityButtonText, item.quantity <= 1 && styles.disabledText]}>-</Text>
        </TouchableOpacity>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.productId, item.quantity + 1)}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item.productId)}
        >
          <Text style={styles.removeButtonText}>移除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <Text style={styles.title}>購物車</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={handleClearCart}>
            <Text style={styles.clearButton}>清空</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyCart}>
          <Text style={styles.emptyText}>購物車是空的</Text>
          <Text style={styles.emptySubtext}>去添加一些商品吧！</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.productId}
            contentContainerStyle={styles.cartList}
          />
          <View style={styles.footer}>
            {/* Points Balance Display */}
            <View style={styles.pointsContainer}>
              <Text style={styles.pointsLabel}>會員點數餘額:</Text>
              <Text style={styles.pointsAmount}>{loadingBalance ? '...' : currentPoints} 點</Text>
            </View>
            {currentPoints < totalAmount && (
              <View style={styles.insufficientPoints}>
                <Text style={styles.insufficientText}>
                  點數不足！需要 {totalAmount} 點
                </Text>
              </View>
            )}
            
            {/* Purchase Points Button */}
            <TouchableOpacity 
              style={styles.purchasePointsButton}
              onPress={() => setShowPointsModal(true)}
            >
              <Text style={styles.purchasePointsButtonText}>購買點數</Text>
            </TouchableOpacity>
            
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>總計:</Text>
              <Text style={styles.totalAmount}>HKD$ {totalAmount}</Text>
            </View>
            <Text style={styles.pointsUsage}>將使用 {totalAmount} 點進行結帳</Text>
            <TouchableOpacity 
              style={[styles.checkoutButton, (isProcessing || loading) && styles.checkoutButtonDisabled]} 
              onPress={handleCheckout}
              disabled={isProcessing || loading}
            >
              {isProcessing ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.checkoutButtonText}>處理中...</Text>
                </View>
              ) : (
                <Text style={styles.checkoutButtonText}>進行結帳</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
      
      {/* Points Purchase Modal */}
      <PointsPurchaseModal
        visible={showPointsModal}
        onClose={() => setShowPointsModal(false)}
        onPointsPurchased={(newBalance) => {
          if (typeof newBalance === 'number') {
            setCurrentPoints(newBalance);
            console.log('Points updated from purchase:', newBalance);
          } else if (firebaseUser?.uid) {
            // Fallback: refetch balance
            const fetchBalance = async () => {
              try {
                const baseEndpoint = await getBestApiEndpoint();
                const res = await fetch(`${baseEndpoint}/api/purchase-points?userId=${firebaseUser.uid}`, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                });
                const data = await res.json();
                if (res.ok && typeof data.memberPoints === 'number') {
                  setCurrentPoints(data.memberPoints);
                  console.log('Points refetched after purchase:', data.memberPoints);
                } else {
                  console.log('Failed to refetch points, using user data');
                  setCurrentPoints(user?.memberPoints || 0);
                }
              } catch (err) {
                console.error('Failed to refetch points balance', err);
                setCurrentPoints(user?.memberPoints || 0);
              }
            };
            fetchBalance();
          }
        }}
      />

      {/* Checkout Password Modal */}
      <CheckoutPasswordModal
        visible={showCheckoutPasswordModal}
        onClose={() => setShowCheckoutPasswordModal(false)}
        onPasswordVerified={handlePasswordVerified}
        onPasswordIncorrect={handlePasswordIncorrect}
        userCheckoutPassword={user?.checkoutPassword}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    color: '#EF4444',
    fontSize: 16,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  cartList: {
    padding: 20,
  },
  cartItem: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  itemInfo: {
    marginBottom: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 14,
    color: '#10B981',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityButton: {
    backgroundColor: '#F3F4F6',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  disabledText: {
    color: '#999',
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 15,
  },
  removeButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  pointsContainer: {
    backgroundColor: '#EBF8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsLabel: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
  },
  pointsAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  insufficientPoints: {
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
    marginBottom: 15,
  },
  insufficientText: {
    fontSize: 12,
    color: '#DC2626',
    textAlign: 'center',
  },
  pointsUsage: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 15,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  purchasePointsButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  purchasePointsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  checkoutButton: {
    backgroundColor: '#10B981',
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default CartScreen; 