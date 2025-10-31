'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Package, Users, TrendingUp, Store, LogOut, ShoppingCart, Menu, X, Clock, CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
  unit?: string;
}

interface Order {
  id: string;
  userId: string;
  firebaseUid?: string;
  userEmail: string;
  restaurantName: string;
  supplier: string;
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
  createdAt: Date | null;
  updatedAt: Date | null;
}

export default function SupplierOrders() {
  const { user, firebaseUser, loading, isSupplier, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingQuantity, setEditingQuantity] = useState<{orderId: string, itemIndex: number} | null>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('已成功登出');
      router.push('/login');
    } catch (error) {
      toast.error('登出時發生錯誤');
    }
  };

  const sidebarItems = [
    {
      name: '儀表板',
      href: '/supplier',
      icon: Store,
    },
    {
      name: '訂單',
      href: '/supplier/orders',
      icon: ShoppingCart,
    },
    {
      name: '投訴',
      href: '/supplier/complaints',
      icon: AlertCircle,
    },
  ];

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.push('/login');
    } else if (!loading && firebaseUser && !isSupplier) {
      // Not a supplier, redirect based on their role
      router.push('/dashboard');
    }
  }, [firebaseUser, loading, router, isSupplier]);

  // Fetch orders for the logged-in supplier
  const fetchOrders = async (showLoading = true) => {
    if (!user || !isSupplier || loading) return;
    
    try {
      if (showLoading) {
        setOrdersLoading(true);
      } else {
        setRefreshing(true);
      }
        // Send both ID and companyName to the API to handle both old and new order formats
        const supplierIdentifier = user.id;
        const supplierCompanyName = user.companyName;
        
        console.log('User data:', { 
          id: user.id,
          companyName: user.companyName, 
          restaurantName: user.restaurantName, 
          name: user.name,
          email: user.email,
          role: user.role
        });
        
        if (!supplierIdentifier || !supplierCompanyName) {
          console.error('No supplier identifier found in user data');
          console.error('User object:', JSON.stringify(user, null, 2));
          toast.error('無法識別供應商資料，請確認供應商資料已正確設定');
          setOrdersLoading(false);
          return;
        }

        console.log('Fetching orders for supplier ID:', supplierIdentifier);
        console.log('And company name:', supplierCompanyName);
        
        // Pass both ID and company name to the API
        const response = await fetch(`/api/orders?supplier=${encodeURIComponent(supplierIdentifier)}&companyName=${encodeURIComponent(supplierCompanyName)}`);
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('API error response:', errorData);
          throw new Error(errorData.error || errorData.details || 'Failed to fetch orders');
        }
        
        const data = await response.json();
        console.log('API response data:', data);
        setOrders(data.orders || []);
        
        console.log(`Loaded ${data.orders?.length || 0} orders`);
      } catch (error) {
        console.error('Error fetching orders:', error);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
        toast.error('載入訂單時發生錯誤');
      } finally {
        if (showLoading) {
          setOrdersLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    };
  
  // Handle quantity update
  const handleQuantityUpdate = async (orderId: string, itemIndex: number, newQuantity: number) => {
    try {
      const response = await fetch('/api/update-order-quantity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          itemIndex,
          newQuantity
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update quantity');
      }

      toast.success('數量已更新');
      
      // Refresh orders to show the updated data
      fetchOrders(false);
      setEditingQuantity(null);
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      toast.error(error.message || '更新數量時發生錯誤');
    }
  };

  // Load orders on mount
  useEffect(() => {
    fetchOrders(true);
  }, [user, isSupplier, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser || !isSupplier) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900">供應商系統</h1>
              <p className="text-xs text-gray-500">Supplier Panel</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="mt-6 px-3 flex-1">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${
                    isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  <span className="flex-1">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Supplier Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-sm font-medium text-primary-700">
                {user?.name?.charAt(0).toUpperCase() || 'S'}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{user?.name || '供應商'}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              className="p-1 rounded-lg hover:bg-gray-100"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col ml-0">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mr-2"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">訂單管理</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden md:block">
                <p className="text-sm text-gray-600">{user?.companyName || '供應商'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Orders Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">訂單列表</h2>
                  <button
                    onClick={() => fetchOrders(false)}
                    disabled={refreshing || ordersLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="重新整理"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span className="text-sm font-medium">重新整理</span>
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  共 {orders.length} 筆訂單
                </div>
              </div>
              
              {ordersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">載入中...</p>
                  </div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">目前沒有訂單</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              訂單 #{order.id}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'processing' ? 'bg-purple-100 text-purple-800' :
                              order.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {order.status === 'pending' && '待處理'}
                              {order.status === 'confirmed' && '已確認'}
                              {order.status === 'processing' && '處理中'}
                              {order.status === 'shipped' && '已出貨'}
                              {order.status === 'delivered' && '已完成'}
                              {order.status === 'cancelled' && '已取消'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {order.restaurantName || order.userEmail}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary-600">
                            HKD$ {order.totalAmount.toFixed(2)}
                          </p>
                          {order.createdAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              {format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm')}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">訂單項目</h4>
                        <div className="space-y-2">
                          {order.items.map((item, index) => {
                            const isEditing = editingQuantity?.orderId === order.id && editingQuantity?.itemIndex === index;
                            return (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-3">
                                  {item.imageUrl && (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.productName}
                                      className="w-12 h-12 object-cover rounded"
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium text-gray-900">{item.productName}</p>
                                    {isEditing ? (
                                      <div className="flex items-center space-x-2 mt-1">
                                        <input
                                          type="number"
                                          min="1"
                                          defaultValue={item.quantity}
                                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              const input = e.target as HTMLInputElement;
                                              const newQuantity = parseInt(input.value);
                                              if (newQuantity > 0) {
                                                handleQuantityUpdate(order.id, index, newQuantity);
                                              }
                                            } else if (e.key === 'Escape') {
                                              setEditingQuantity(null);
                                            }
                                          }}
                                          autoFocus
                                        />
                                        <span className="text-gray-500">{item.unit || '單位'}</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center space-x-2 mt-1">
                                        <p className="text-gray-500">數量: {item.quantity} {item.unit || '單位'}</p>
                                        <button
                                          onClick={() => setEditingQuantity({ orderId: order.id, itemIndex: index })}
                                          className="text-primary-600 hover:text-primary-700 text-xs ml-1"
                                        >
                                          編輯
                                        </button>
                                      </div>
                                    )}
                                    <p className="text-xs text-gray-500">
                                      HKD$ {item.unitPrice.toFixed(2)} / {item.unit || '單位'}
                                    </p>
                                  </div>
                                </div>
                                <p className="font-medium text-gray-900">
                                  HKD$ {item.totalPrice.toFixed(2)}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <div className="text-sm">
                          <p className="text-gray-600 mb-1">配送地址</p>
                          <p className="text-gray-900">
                            {order.deliveryAddress?.street} {order.deliveryAddress?.city}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
