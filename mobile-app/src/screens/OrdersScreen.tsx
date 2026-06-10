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
  Alert,
  Modal,
  TextInput,
  Image
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { getBestApiEndpoint } from '../utils/apiHelper';
import { db } from '../services/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl: string;
  unit?: string;
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
  supplier?: string;
  supplierId?: string;
  supplierName?: string;
  supplierCompanyName?: string;
  supplierLogo?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

const OrdersScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [submittingContact, setSubmittingContact] = useState(false);
  const [ordersBannerImage, setOrdersBannerImage] = useState<string | null>(null);
  const [supplierCache, setSupplierCache] = useState<Map<string, string>>(new Map());
  const [supplierLogoCache, setSupplierLogoCache] = useState<Map<string, string>>(new Map());
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Check authentication every time screen is focused - show alert and redirect to login if not authenticated
  useFocusEffect(
    React.useCallback(() => {
      if (!authLoading && !firebaseUser) {
        // Show alert immediately when screen is focused
        Alert.alert(
          '需要登入',
          '此功能需要登入後才能使用，是否前往登入？',
          [
            { 
              text: '取消', 
              style: 'cancel', 
              onPress: () => (navigation as any).navigate('Home') 
            },
            {
              text: '前往登入',
              onPress: () => (navigation as any).navigate('Login'),
            },
          ]
        );
        // Navigate back to home immediately
        (navigation as any).navigate('Home');
      }
    }, [firebaseUser, authLoading, navigation])
  );

  // Show loading or redirect if not authenticated
  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={{ marginTop: 10, color: '#666' }}>載入中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!firebaseUser) {
    // This should not be reached due to navigation redirect, but show empty screen as fallback
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, color: '#666', textAlign: 'center' }}>
            請先登入以查看訂單
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Fetch supplier company name from Firestore
  const fetchSupplierName = async (supplierId: string): Promise<string | null> => {
    // Check cache first
    if (supplierCache.has(supplierId)) {
      return supplierCache.get(supplierId) || null;
    }

    try {
      // Try to get supplier by document ID first
      const supplierDoc = await getDoc(doc(db, 'users', supplierId));
      if (supplierDoc.exists()) {
        const data = supplierDoc.data();
        const companyName = data.companyName || data.name || null;
        if (companyName) {
          setSupplierCache(prev => new Map(prev).set(supplierId, companyName));
          return companyName;
        }
      }

      // If not found by ID, try searching by firebaseUid or id field
      const usersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'supplier')
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      for (const userDoc of usersSnapshot.docs) {
        const data = userDoc.data();
        if (data.id === supplierId || userDoc.id === supplierId || data.firebaseUid === supplierId) {
          const companyName = data.companyName || data.name || null;
          if (companyName) {
            setSupplierCache(prev => new Map(prev).set(supplierId, companyName));
            return companyName;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching supplier name:', error);
      return null;
    }
  };

  // Fetch supplier logo from Firestore
  const fetchSupplierLogo = async (supplierId: string): Promise<string | null> => {
    // Check cache first
    if (supplierLogoCache.has(supplierId)) {
      return supplierLogoCache.get(supplierId) || null;
    }

    try {
      // Try to get supplier by document ID first
      const supplierDoc = await getDoc(doc(db, 'users', supplierId));
      if (supplierDoc.exists()) {
        const data = supplierDoc.data();
        const logo = data.logo || null;
        if (logo) {
          setSupplierLogoCache(prev => new Map(prev).set(supplierId, logo));
          return logo;
        }
      }

      // If not found by ID, try searching by firebaseUid or id field
      const usersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'supplier')
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      for (const userDoc of usersSnapshot.docs) {
        const data = userDoc.data();
        if (data.id === supplierId || userDoc.id === supplierId || data.firebaseUid === supplierId) {
          const logo = data.logo || null;
          if (logo) {
            setSupplierLogoCache(prev => new Map(prev).set(supplierId, logo));
            return logo;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching supplier logo:', error);
      return null;
    }
  };

  // Check if a string looks like an ID (vs a readable company name)
  const looksLikeId = (str: string): boolean => {
    if (!str) return false;
    // IDs are typically: short alphanumeric, UUIDs, or don't contain spaces/Chinese characters
    // Company names typically: contain spaces, Chinese characters, or are longer descriptive strings
    const hasSpaces = /\s/.test(str);
    const hasChinese = /[\u4e00-\u9fa5]/.test(str);
    const isShortAlphanumeric = /^[a-zA-Z0-9_-]{1,20}$/.test(str) && str.length < 30;
    
    // If it has spaces or Chinese, it's likely a name
    if (hasSpaces || hasChinese) return false;
    // If it's a short alphanumeric string, it might be an ID
    if (isShortAlphanumeric) return true;
    // Otherwise, assume it's a name if it's longer
    return false;
  };

  // Enrich orders with supplier names and logos
  const enrichOrdersWithSupplierNames = async (orders: Order[]): Promise<Order[]> => {
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        // Get supplier identifier
        const supplierId = order.supplierId || order.supplier;
        if (!supplierId) {
          return order;
        }

        let enrichedOrder = { ...order };

        // Enrich supplier name if not already present
        if (!order.supplierCompanyName && !order.supplierName) {
          // If supplier field looks like a readable name (not an ID), use it directly
          if (!looksLikeId(supplierId)) {
            enrichedOrder.supplierCompanyName = supplierId;
          } else {
            // Otherwise, fetch supplier name from Firestore
            const supplierName = await fetchSupplierName(supplierId);
            if (supplierName) {
              enrichedOrder.supplierCompanyName = supplierName;
            }
          }
        }

        // Enrich supplier logo if not already present
        if (!order.supplierLogo && looksLikeId(supplierId)) {
          const supplierLogo = await fetchSupplierLogo(supplierId);
          if (supplierLogo) {
            enrichedOrder.supplierLogo = supplierLogo;
          }
        }

        return enrichedOrder;
      })
    );

    return enrichedOrders;
  };

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
      
      // Enrich orders with supplier names
      const enrichedOrders = await enrichOrdersWithSupplierNames(fetchedOrders);
      
      console.log(`✅ Successfully loaded ${enrichedOrders.length} orders from Firestore`);
      return enrichedOrders;
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
              // Enrich orders with supplier names
              const enrichedOrders = await enrichOrdersWithSupplierNames(processedOrders);
              setOrders(enrichedOrders);
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

  // Fetch orders banner from mobile-app content
  useEffect(() => {
    const fetchOrdersBanner = async () => {
      try {
        const pageDoc = await getDoc(doc(db, 'pages', 'mobile-app'));
        if (pageDoc.exists()) {
          const data = pageDoc.data();
          const areasData = data.areas || null;
          if (areasData?.ordersBanner?.image) {
            setOrdersBannerImage(areasData.ordersBanner.image);
          } else {
            setOrdersBannerImage(null);
          }
        }
      } catch (error) {
        console.error('Error fetching orders banner:', error);
        setOrdersBannerImage(null);
      }
    };
    fetchOrdersBanner();
  }, []);

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

  const formatAddressValue = (address: { street?: string; city?: string; state?: string; zipCode?: string } | undefined) => {
    if (!address) return '';
    const line1 = [address.street].filter(Boolean).join(' ');
    const cityState = [address.city, address.state].filter((p) => p && String(p).trim().length > 0)
      .join(address.city && address.state ? ', ' : '');
    const line2 = [cityState, address.zipCode].filter((p) => p && String(p).trim().length > 0).join(' ');
    const lines = [];
    if (line1) lines.push(line1);
    if (line2) lines.push(line2);
    return lines.join('\n');
  };

  const renderOrderItem = ({ item }: { item: OrderItem }) => (
    <View style={styles.orderItem}>
      <Text style={styles.itemName}>{item.productName}</Text>
      <View style={styles.itemDetails}>
        <Text style={styles.itemQuantity}>數量: {item.quantity} / {item.unit || '單位'}</Text>
        <Text style={styles.itemPrice}>{formatCurrency(item.unitPrice)}</Text>
      </View>
    </View>
  );

  const getSupplierName = (order: Order): string => {
    // First try to get from enriched fields
    if (order.supplierCompanyName) {
      return order.supplierCompanyName;
    }
    if (order.supplierName) {
      return order.supplierName;
    }
    // Check cache for supplier ID
    const supplierId = order.supplierId || order.supplier;
    if (supplierId && supplierCache.has(supplierId)) {
      return supplierCache.get(supplierId) || supplierId;
    }
    // If supplier field doesn't look like an ID, use it directly
    if (supplierId && !looksLikeId(supplierId)) {
      return supplierId;
    }
    // Fallback
    return supplierId || '未知供應商';
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const supplierName = getSupplierName(item);
    const isExpanded = expandedOrders.has(item.id);

    return (
      <View style={styles.orderCard}>
        <TouchableOpacity
          onPress={() => toggleOrderExpansion(item.id)}
          style={styles.orderHeader}
          activeOpacity={0.7}
        >
          <View style={styles.orderHeaderContent}>
            <Text style={styles.orderId}>訂單 #{item.id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <>
            {/* Supplier Name and Logo */}
            <View style={styles.supplierInfo}>
              {item.supplierLogo && (
                <Image
                  source={{ uri: item.supplierLogo }}
                  style={styles.supplierLogo}
                  resizeMode="contain"
                />
              )}
              <View style={styles.supplierTextContainer}>
                <Text style={styles.supplierLabel}>供應商:</Text>
                <Text style={styles.supplierName}>{supplierName}</Text>
              </View>
            </View>
            
            <View style={styles.orderItems}>
              <Text style={styles.itemsTitle}>商品清單</Text>
              {item.items.map((orderItem, index) => (
                <View key={`${item.id}-${orderItem.productId}-${index}`} style={styles.orderItem}>
                  <Text style={styles.itemName}>{orderItem.productName}</Text>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemQuantity}>數量: {orderItem.quantity} / {orderItem.unit || '單位'}</Text>
                    <Text style={styles.itemPrice}>{formatCurrency(orderItem.unitPrice)}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Delivery Information */}
            <View style={styles.deliveryInfo}>
              <View style={styles.deliveryRow}>
                <Text style={styles.deliveryLabel}>送貨地址:</Text>
                <Text style={styles.deliveryValue}>{formatAddressValue(item.deliveryAddress)}</Text>
              </View>
            </View>

            {item.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.notesLabel}>備註:</Text>
                <Text style={styles.notesValue}>{item.notes}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedOrder(item);
                  setContactMessage('');
                  setContactModalVisible(true);
                }}
                style={styles.contactButton}
              >
                <Text style={styles.contactButtonText}>聯絡供應商</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.orderFooter}>
              <Text style={styles.orderDate}>下單時間: {formatDate(item.createdAt)}</Text>
              <Text style={styles.orderTotal}>總計: {formatCurrency(item.totalAmount)}</Text>
            </View>
          </>
        )}
      </View>
    );
  };

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
      </View>

      {/* Orders Banner */}
      {ordersBannerImage && (
        <View style={styles.ordersBannerContainer}>
          <Image
            source={{ uri: ordersBannerImage }}
            style={styles.ordersBannerImage}
            resizeMode="cover"
          />
        </View>
      )}

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

      {/* 聯絡供應商 Modal */}
      <Modal
        transparent
        visible={contactModalVisible}
        animationType="fade"
        onRequestClose={() => setContactModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>聯絡供應商</Text>
            <Text style={styles.modalSubtitle}>訂單編號：{selectedOrder?.id || ''}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="請輸入訊息給供應商"
              placeholderTextColor="#9CA3AF"
              value={contactMessage}
              onChangeText={setContactMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#E5E7EB' }]}
                onPress={() => setContactModalVisible(false)}
                disabled={submittingContact}
              >
                <Text style={[styles.modalButtonText, { color: '#111827' }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#10B981' }]}
                onPress={async () => {
                  if (!selectedOrder) return;
                  const message = contactMessage.trim();
                  if (!message) {
                    Alert.alert('提醒', '請輸入訊息內容');
                    return;
                  }
                  if (!firebaseUser?.uid) {
                    Alert.alert('錯誤', '請先登入');
                    return;
                  }
                  try {
                    setSubmittingContact(true);
                    const baseEndpoint = await getBestApiEndpoint();
                    // Derive supplier information similar to website logic
                    const anyOrder: any = selectedOrder as any;
                    const supplierIdentifier =
                      anyOrder.supplierId ||
                      anyOrder.supplier ||
                      (anyOrder.items || []).find((it: any) => it?.supplierId)?.supplierId ||
                      (anyOrder.items || []).find((it: any) => it?.supplier)?.supplier ||
                      '';
                    if (!supplierIdentifier) {
                      Alert.alert('錯誤', '無法判定供應商資訊，請聯絡客服協助');
                      setSubmittingContact(false);
                      return;
                    }
                    const supplierCompanyName =
                      anyOrder.supplierCompanyName ||
                      anyOrder.supplierName ||
                      anyOrder.restaurantName ||
                      supplierIdentifier;
                    const payload = {
                      orderId: selectedOrder.id,
                      message,
                      userId: firebaseUser.uid,
                      userEmail: user?.email || '',
                      restaurantName: user?.restaurantName || '',
                      supplierId: supplierIdentifier,
                      supplierCompanyName,
                    };
                    const url = `${baseEndpoint}/api/create-complaint`;
                    const resp = await fetch(url, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    });
                    if (!resp.ok) {
                      const data = await resp.json().catch(() => ({}));
                      throw new Error(data?.error || '提交失敗');
                    }
                    setContactModalVisible(false);
                    setSelectedOrder(null);
                    setContactMessage('');
                    Alert.alert('成功', '訊息已送出');
                  } catch (err: any) {
                    console.error('Contact supplier failed:', err);
                    Alert.alert('錯誤', err?.message || '提交時發生錯誤');
                  } finally {
                    setSubmittingContact(false);
                  }
                }}
                disabled={submittingContact}
              >
                <Text style={styles.modalButtonText}>{submittingContact ? '送出中...' : '送出'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  ordersBannerContainer: {
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 15,
  },
  ordersBannerImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
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
    marginBottom: 10,
  },
  orderHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  supplierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  supplierLogo: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: '#f5f5f5',
  },
  supplierTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  supplierLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginRight: 6,
  },
  supplierName: {
    fontSize: 14,
    fontWeight: '500',
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
  contactButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  contactButtonText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    padding: 10,
    minHeight: 100,
    fontSize: 14,
    color: '#111827',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 10,
  },
  modalButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default OrdersScreen; 