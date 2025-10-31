import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { getBestApiEndpoint } from '../utils/apiHelper';
import { db } from '../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl: string;
}

interface Order {
  id: string;
  userId: string;
  firebaseUid?: string;
  userEmail?: string;
  restaurantName?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  deliveryDate: Date;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  notes?: string;
  source?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

const OrdersScreen: React.FC = () => {
  const { user, firebaseUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrdersFromFirestore = async (userId: string): Promise<Order[]> => {
    try {
      console.log('🔄 Trying to fetch orders directly from Firestore...');
      
      // First try with Firebase UID (matches website logic)
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', userId)
      );
      
      console.log('Executing Firestore query for orders...');
      const querySnapshot = await getDocs(ordersQuery);
      console.log('Query completed. Found', querySnapshot.docs.length, 'orders with userId:', userId);
      
      let fetchedOrders: Order[] = [];
      
      // If no orders found with Firebase UID, try searching with user's custom ID
      if (querySnapshot.docs.length === 0 && user?.id && user.id !== userId) {
        console.log('No orders found with Firebase UID, trying with user custom ID:', user.id);
        const alternateQuery = query(
          collection(db, 'orders'),
          where('userId', '==', user.id)
        );
        const alternateSnapshot = await getDocs(alternateQuery);
        console.log('Alternate query found', alternateSnapshot.docs.length, 'orders with userId:', user.id);
        
        if (alternateSnapshot.docs.length > 0) {
          const alternateOrders: Order[] = alternateSnapshot.docs.map(doc => {
            const data = doc.data();
            console.log('Processing alternate order:', doc.id, 'userId:', data.userId);
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              updatedAt: data.updatedAt?.toDate?.() || new Date(),
              deliveryDate: data.deliveryDate?.toDate?.() || new Date()
            } as Order;
          });
          console.log('Using alternate orders:', alternateOrders.length);
          fetchedOrders = [...alternateOrders];
        } else {
          console.log('No orders found with either user ID');
        }
      } else {
        // Process orders found with Firebase UID
        const firestoreOrders: Order[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Processing order:', doc.id, 'userId:', data.userId);
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
            deliveryDate: data.deliveryDate?.toDate?.() || new Date()
          } as Order;
        });

        console.log('Firestore orders loaded:', firestoreOrders.length);
        console.log('Order details:', firestoreOrders.map(o => ({ id: o.id, userId: o.userId, status: o.status })));
        fetchedOrders = [...firestoreOrders];
      }
      
      // Sort by createdAt descending
      fetchedOrders.sort((a, b) => (b.createdAt as any) - (a.createdAt as any));
      
      console.log(`✅ Successfully loaded ${fetchedOrders.length} orders from Firestore`);
      return fetchedOrders;
    } catch (error) {
      console.error('Error fetching orders from Firestore:', error);
      return [];
    }
  };

  const fetchOrders = async () => {
    console.log('=== OrdersScreen fetchOrders called ===');
    console.log('User object:', user);
    console.log('User ID:', user?.id);
    console.log('Firebase User:', firebaseUser);
    console.log('Firebase User UID:', firebaseUser?.uid);
    
    // Check for Firebase user authentication
    if (!firebaseUser?.uid) {
      console.log('❌ No Firebase user found, skipping orders fetch');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const userId = firebaseUser.uid;
    console.log('✅ Fetching orders for Firebase user:', userId);
    
    try {
      // Use direct Firestore access (matches website approach)
      console.log('🔄 Fetching orders directly from Firestore...');
      const firestoreOrders = await fetchOrdersFromFirestore(userId);
      setOrders(firestoreOrders);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Fallback: try API endpoint if Firestore fails
      try {
        console.log('🔄 Firestore failed, trying API as fallback...');
        const baseEndpoint = await getBestApiEndpoint();
        if (baseEndpoint) {
          const ordersUrl = `${baseEndpoint}/api/orders?userId=${userId}`;
          console.log('Fetching orders from API:', ordersUrl);
          
          const response = await fetch(ordersUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          console.log('Orders API response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Orders API response:', data);
            if (data.success && data.orders) {
              console.log(`✅ Successfully loaded ${data.orders.length} orders from API`);
              // Convert date strings to Date objects for proper display
              const processedOrders = data.orders.map((order: any) => ({
                ...order,
                createdAt: new Date(order.createdAt),
                updatedAt: new Date(order.updatedAt),
                deliveryDate: order.deliveryDate ? new Date(order.deliveryDate) : new Date()
              }));
              setOrders(processedOrders);
              return;
            }
          }
        }
        
        // If both Firestore and API fail, show empty orders
        setOrders([]);
      } catch (apiError) {
        console.error('API fallback also failed:', apiError);
        setOrders([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [firebaseUser]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'confirmed':
        return '#3B82F6';
      case 'processing':
        return '#8B5CF6';
      case 'shipped':
        return '#10B981';
      case 'delivered':
        return '#059669';
      case 'completed':
        return '#059669';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待處理';
      case 'confirmed':
        return '已確認';
      case 'processing':
        return '處理中';
      case 'shipped':
        return '已出貨';
      case 'delivered':
        return '已送達';
      case 'completed':
        return '已完成';
      case 'cancelled':
        return '已取消';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateInput: Date | string) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${month} ${day}, ${year} at ${displayHours}:${minutes} ${ampm}`;
  };

  const renderOrderItem = ({ item }: { item: OrderItem }) => (
    <View style={styles.orderItem}>
      <Text style={styles.itemName}>{item.productName}</Text>
      <View style={styles.itemDetails}>
        <Text style={styles.itemQuantity}>數量: {item.quantity}</Text>
        <Text style={styles.itemPrice}>{formatCurrency(item.unitPrice)}</Text>
      </View>
    </View>
  );

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>訂單 #{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.orderItems}>
        <Text style={styles.itemsTitle}>商品清單</Text>
        {item.items.map((orderItem, index) => (
          <View key={`${item.id}-${orderItem.productId}-${index}`} style={styles.orderItem}>
            <Text style={styles.itemName}>{orderItem.productName}</Text>
            <View style={styles.itemDetails}>
              <Text style={styles.itemQuantity}>數量: {orderItem.quantity}</Text>
              <Text style={styles.itemPrice}>{formatCurrency(orderItem.unitPrice)}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Delivery Information */}
      <View style={styles.deliveryInfo}>
        <View style={styles.deliveryRow}>
          <Text style={styles.deliveryLabel}>送貨日期:</Text>
          <Text style={styles.deliveryValue}>{formatDate(item.deliveryDate)}</Text>
        </View>
        <View style={styles.deliveryRow}>
          <Text style={styles.deliveryLabel}>送貨地址:</Text>
          <Text style={styles.deliveryValue}>
            {item.deliveryAddress.street}{'\n'}
            {item.deliveryAddress.city}, {item.deliveryAddress.state} {item.deliveryAddress.zipCode}
          </Text>
        </View>
      </View>

      {item.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>備註:</Text>
          <Text style={styles.notesValue}>{item.notes}</Text>
        </View>
      )}

      <View style={styles.orderFooter}>
        <Text style={styles.orderDate}>下單時間: {formatDate(item.createdAt)}</Text>
        <Text style={styles.orderTotal}>總計: {formatCurrency(item.totalAmount)}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <Text style={styles.title}>我的訂單</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>載入中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <Text style={styles.title}>我的訂單</Text>
        {firebaseUser && (
          <Text style={styles.debugText}>用戶ID: {firebaseUser.uid}</Text>
        )}
        <TouchableOpacity 
          style={styles.testButton}
          onPress={async () => {
            console.log('=== Manual Test Button Pressed ===');
            console.log('User:', user);
            console.log('Firebase User:', firebaseUser);
            
            // Test API connectivity
            try {
              const baseEndpoint = await getBestApiEndpoint();
              console.log('Base endpoint:', baseEndpoint);
              
              if (baseEndpoint && firebaseUser?.uid) {
                const testUrl = `${baseEndpoint}/api/orders?userId=${firebaseUser.uid}`;
                console.log('Testing API with URL:', testUrl);
                
                const response = await fetch(testUrl);
                console.log('Test response status:', response.status);
                
                if (response.ok) {
                  const data = await response.json();
                  console.log('Test API response:', data);
                  Alert.alert('API測試', `API連接成功！找到 ${data.orders?.length || 0} 個訂單`);
                } else {
                  const errorText = await response.text();
                  console.log('Test API error:', errorText);
                  Alert.alert('API測試', `API錯誤: ${response.status} - ${errorText}`);
                }
              } else {
                Alert.alert('API測試', '無法獲取API端點或用戶ID');
              }
            } catch (error) {
              console.error('Test error:', error);
              Alert.alert('API測試', `測試失敗: ${error}`);
            }
            
            fetchOrders();
          }}
        >
          <Text style={styles.testButtonText}>測試連接</Text>
        </TouchableOpacity>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>尚無訂單</Text>
          <Text style={styles.emptySubtext}>開始購物來建立您的第一個訂單吧！</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.ordersList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  testButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  ordersList: {
    padding: 20,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderItems: {
    marginBottom: 15,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  orderItem: {
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
  },
  itemPrice: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  deliveryInfo: {
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  deliveryRow: {
    marginBottom: 8,
  },
  deliveryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  deliveryValue: {
    fontSize: 12,
    color: '#666',
  },
  notesSection: {
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  notesValue: {
    fontSize: 12,
    color: '#666',
  },
});

export default OrdersScreen; 