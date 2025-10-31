'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Package, Calendar, User, MapPin, Clock, Search } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

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
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  deliveryDate: Date;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  notes?: string;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock orders data for demonstration
const mockOrders: Order[] = [
  {
    id: 'order_1234567890_abc123',
    userId: 'user_123',
    items: [
      {
        productId: '1',
        productName: '優質絞牛肉',
        quantity: 10,
        unitPrice: 8.99,
        totalPrice: 89.90,
        imageUrl: '/images/ground-beef.jpg'
      },
      {
        productId: '3',
        productName: '新鮮全脂牛奶',
        quantity: 5,
        unitPrice: 3.49,
        totalPrice: 17.45,
        imageUrl: '/images/milk.jpg'
      }
    ],
    totalAmount: 107.35,
    status: 'pending',
    deliveryDate: new Date('2025-10-24'),
    deliveryAddress: {
      street: '香港九龍彌敦道123號',
      city: '香港',
      state: '九龍',
      zipCode: '12345'
    },
    notes: '請在上午送貨',
    createdAt: new Date('2025-10-17'),
    updatedAt: new Date('2025-10-17')
  },
  {
    id: 'order_1234567891_def456',
    userId: 'user_456',
    items: [
      {
        productId: '2',
        productName: '新鮮有機番茄',
        quantity: 20,
        unitPrice: 2.99,
        totalPrice: 59.80,
        imageUrl: '/images/tomatoes.jpg'
      }
    ],
    totalAmount: 65.78,
    status: 'confirmed',
    deliveryDate: new Date('2025-10-22'),
    deliveryAddress: {
      street: '香港中環皇后大道中456號',
      city: '香港',
      state: '中環',
      zipCode: '67890'
    },
    notes: '',
    createdAt: new Date('2025-10-16'),
    updatedAt: new Date('2025-10-17')
  }
];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const statusLabels = {
  pending: '待處理',
  confirmed: '已確認',
  processing: '處理中',
  shipped: '已發貨',
  delivered: '已送達',
  cancelled: '已取消'
};

export default function AdminOrders() {
  const { user, firebaseUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false); // Start with false to avoid infinite loading
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Memoized filtered orders to prevent unnecessary re-renders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Filter by status
      if (selectedStatus !== 'all' && order.status !== selectedStatus) {
        return false;
      }
      
      // Filter by search term (order ID)
      if (searchTerm && !order.id.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [orders, selectedStatus, searchTerm]);

  // Memoized statistics to prevent unnecessary calculations
  const stats = useMemo(() => {
    const pendingCount = orders.filter(order => order.status === 'pending').length;
    
    return { pendingCount };
  }, [orders]);

  // Fetch orders: try all (admin), fallback to own if permission denied
  const fetchOrders = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsUpdating(true);
      }

      // Use the API endpoint instead of direct Firestore access
      const response = await fetch('/api/orders?admin=true');
      const data = await response.json();
      
      if (response.ok && data.success) {
        const fetchedOrders: Order[] = data.orders.map((order: any) => ({
          id: order.id,
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
          deliveryDate: new Date(order.deliveryDate)
        }));

        // Check if there are changes
        const hasChanges =
          orders.length !== fetchedOrders.length ||
          fetchedOrders.some((order: any, idx: number) => {
            const prev = orders[idx];
            return !prev || prev.id !== order.id || prev.updatedAt.getTime() !== order.updatedAt.getTime() || prev.status !== order.status;
          });

        if (hasChanges) {
          setOrders(fetchedOrders);
          setLastUpdate(new Date());
        }
      } else {
        console.error('Failed to fetch orders:', data.error);
        // Fallback to empty orders if API fails
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Fallback to empty orders if there's an error
      setOrders([]);
    } finally {
      if (showLoading) {
        setLoading(false);
        setIsUpdating(false);
      }
    }
  }, [orders]);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch orders from Firestore with optimized polling
  useEffect(() => {
    const fetchOrdersImmediately = async () => {
      try {
        console.log('Fetching orders for admin...');
        const ordersRef = collection(db, 'orders');
        const snapshot = await getDocs(ordersRef);
        
        console.log('Orders fetched successfully:', snapshot.size);
        const fetchedOrders: Order[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId || '',
            firebaseUid: data.firebaseUid || '',
            userEmail: data.userEmail || '',
            restaurantName: data.restaurantName || '',
            items: data.items || [],
            totalAmount: data.totalAmount || 0,
            status: data.status || 'pending',
            deliveryDate: data.deliveryDate?.toDate?.() || new Date(),
            deliveryAddress: data.deliveryAddress || {
              street: '',
              city: '',
              state: '',
              zipCode: ''
            },
            notes: data.notes || '',
            source: data.source || '',
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date()
          };
        });
        
        setOrders(fetchedOrders);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
      } finally {
        setLoading(false);
        setIsUpdating(false);
      }
    };
    
    fetchOrdersImmediately();
    
    // Set up polling every 15 seconds
    const interval = setInterval(() => {
      fetchOrdersImmediately();
    }, 15000);
    
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      // Use the API endpoint to update order status
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
          status: newStatus
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Update local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, status: newStatus, updatedAt: new Date() }
              : order
          )
        );
      } else {
        console.error('Failed to update order status:', data.error);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">載入訂單中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">訂單管理</h1>
              <p className="text-gray-600">
                管理所有客戶訂單和配送狀態
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className={`w-2 h-2 rounded-full ${isUpdating ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
              <span>{isUpdating ? '更新中...' : '即時更新'}</span>
              <span className="text-xs text-gray-400">
                {isClient && lastUpdate ? lastUpdate.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </span>
              <span className="text-xs text-gray-400">
                • 15秒輪詢 • 智能緩存
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">總訂單</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">待處理訂單</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">狀態篩選:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">所有狀態</option>
                <option value="pending">待處理</option>
                <option value="confirmed">已確認</option>
                <option value="processing">處理中</option>
                <option value="shipped">已發貨</option>
                <option value="delivered">已送達</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜尋訂單 ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  清除
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900">訂單 #{order.id}</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    創建於 {typeof order.createdAt === 'string' ? new Date(order.createdAt).toLocaleDateString('zh-TW') : order.createdAt.toLocaleDateString('zh-TW')}
                    {order.userEmail && (
                      <span className="ml-2">• {order.userEmail}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="pending">待處理</option>
                    <option value="confirmed">已確認</option>
                    <option value="processing">處理中</option>
                    <option value="shipped">已發貨</option>
                    <option value="delivered">已送達</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">訂單項目:</h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => {
                    const totalPrice = item.totalPrice || (item.quantity * item.unitPrice) || 0;
                    return (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.productName}</p>
                            <p className="text-sm text-gray-600">數量: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="font-medium text-gray-900">${totalPrice.toFixed(2)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">配送資訊:</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    {order.restaurantName && (
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{order.restaurantName}</span>
                      </div>
                    )}
                    {order.deliveryAddress && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {order.deliveryAddress.street || ''} 
                          {order.deliveryAddress.city ? `, ${order.deliveryAddress.city}` : ''}
                          {order.deliveryAddress.state ? `, ${order.deliveryAddress.state}` : ''}
                          {order.deliveryAddress.zipCode ? ` ${order.deliveryAddress.zipCode}` : ''}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>預計送達: {typeof order.deliveryDate === 'string' ? new Date(order.deliveryDate).toLocaleDateString('zh-TW') : order.deliveryDate.toLocaleDateString('zh-TW')}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">訂單摘要:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between border-t pt-1">
                      <span className="font-medium">總計:</span>
                      <span className="font-bold text-lg">${(order.totalAmount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {order.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">備註:</h4>
                  <p className="text-sm text-gray-600">{order.notes}</p>
                </div>
              )}
            </div>
          ))}

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">沒有訂單</h3>
              <p className="text-gray-600">
                目前沒有符合篩選條件的訂單
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 