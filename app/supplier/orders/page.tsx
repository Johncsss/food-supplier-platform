'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Package, Users, TrendingUp, Store, LogOut, ShoppingCart, Menu, X, Clock, CheckCircle, XCircle, RefreshCw, AlertCircle, Search, Download, Calendar, User as UserIcon, ChevronDown, ChevronUp, Home } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import zhTW from 'date-fns/locale/zh-TW';
import { generateInvoicePDF, InvoiceData } from '@/lib/pdf-generator';

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
  const [pendingMessages, setPendingMessages] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingQuantity, setEditingQuantity] = useState<{orderId: string, itemIndex: number} | null>(null);
  const [tempQuantities, setTempQuantities] = useState<Record<string, Record<number, number>>>({});
  const [tempQuantityInputs, setTempQuantityInputs] = useState<Record<string, Record<number, string>>>({});
  const editableUnits = ['斤', '公斤', '磅'];
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | Order['status']>('all');
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

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
      name: '銷售報告',
      href: '/supplier',
      icon: Store,
    },
    {
      name: '訂單',
      href: '/supplier/orders',
      icon: ShoppingCart,
    },
    {
      name: '訊息',
      href: '/supplier/messages',
      icon: AlertCircle,
    },
    {
      name: '送貨日期管理',
      href: '/supplier/delivery-dates',
      icon: Calendar,
    },
    {
      name: '供應商資料',
      href: '/supplier/profile',
      icon: UserIcon,
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

  useEffect(() => {
    const fetchPending = async () => {
      if (!user || !isSupplier || loading) return;
      try {
        const res = await fetch(`/api/complaints?supplierId=${encodeURIComponent(user.id)}`);
        if (!res.ok) return;
        const data = await res.json();
        const list: any[] = Array.isArray(data.complaints) ? data.complaints : [];
        let count = 0;
        for (const c of list) {
          const status = c?.status === 'pending' ? 'pending' : 'processed';
          if (status === 'pending') count += 1;
        }
        setPendingMessages(count);
      } catch {
        // ignore errors
      }
    };
    fetchPending();
  }, [user, isSupplier, loading]);
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
      const fetchedOrders = data.orders || [];
      setOrders(fetchedOrders);
      
      // Calculate new orders count (pending or confirmed status)
      const newOrders = fetchedOrders.filter((order: Order) => 
        order.status === 'pending' || order.status === 'confirmed'
      );
      setNewOrdersCount(newOrders.length);
        
      console.log(`Loaded ${fetchedOrders.length} orders`);
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
      setTempQuantities((prev) => {
        const copy = { ...prev };
        if (copy[orderId]) {
          delete copy[orderId][itemIndex];
          if (Object.keys(copy[orderId]).length === 0) delete copy[orderId];
        }
        return copy;
      });
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      toast.error(error.message || '更新數量時發生錯誤');
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      setUpdatingStatus(orderId);
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          status: newStatus,
          supplierId: user?.id,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || '更新訂單狀態失敗');
      }

      toast.success('訂單狀態已更新');
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
                updatedAt: new Date(),
              }
            : order,
        ),
      );
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error(error.message || '更新訂單狀態時發生錯誤');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Load orders on mount
  useEffect(() => {
    fetchOrders(true);
  }, [user, isSupplier, loading]);

  const handleDownloadInvoice = async (order: Order) => {
    if (!order) return;
    try {
      setDownloadingInvoice(order.id);
      const orderDate = order.createdAt ? new Date(order.createdAt as any) : new Date();
      const safeAddress = order.deliveryAddress && (order.deliveryAddress as any)
        ? {
            street: (order.deliveryAddress as any).street || '',
            city: (order.deliveryAddress as any).city || '',
            state: (order.deliveryAddress as any).state || '',
            zipCode: (order.deliveryAddress as any).zipCode || '',
          }
        : { street: '', city: '', state: '', zipCode: '' };
      const subtotal = (order.items || []).reduce((sum, it) => {
        const qty = typeof it.quantity === 'number' ? it.quantity : Number(it.quantity) || 0;
        const unit = typeof it.unitPrice === 'number' ? it.unitPrice : Number(it.unitPrice) || 0;
        const total = it.totalPrice ?? qty * unit;
        return sum + (typeof total === 'number' ? total : Number(total) || 0);
      }, 0);
      const invoiceData: InvoiceData = {
        orderId: order.id,
        orderDate: orderDate,
        customerName: order.restaurantName || order.userEmail || 'Customer',
        customerEmail: order.userEmail || '',
        items: (order.items || []).map((it) => ({
          productName: it.productName,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.totalPrice ?? it.quantity * it.unitPrice,
        })),
        subtotal,
        tax: 0,
        total: subtotal,
        deliveryAddress: safeAddress,
      };
      await generateInvoicePDF(invoiceData);
    } catch (err) {
      console.error('Failed to generate invoice:', err);
      toast.error('發票生成失敗');
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const handleComplaintClick = (order: Order) => {
    setSelectedOrder(order);
    router.push(`/supplier/messages?orderId=${order.id}`);
  };

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch =
        term.length === 0 ||
        order.id.toLowerCase().includes(term) ||
        (order.restaurantName || '').toLowerCase().includes(term);
      const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, selectedStatus]);

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
            {/* Back to Home Link */}
            <Link
              href="/"
              className="group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900 mb-2"
              onClick={() => setSidebarOpen(false)}
            >
              <Home className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-500" />
              <span className="flex-1">返回首頁</span>
            </Link>
            
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
                  {item.name === '訊息' && pendingMessages > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs px-2 py-0.5 min-w-[1.25rem]">
                      {pendingMessages}
                    </span>
                  )}
                  {item.name === '訂單' && newOrdersCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs px-2 py-0.5 min-w-[1.25rem]">
                      {newOrdersCount}
                    </span>
                  )}
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
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="重新整理"
                    style={{ backgroundColor: '#0B8628' }}
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span className="text-sm font-medium">重新整理</span>
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  共 {filteredOrders.length} 筆訂單
                </div>
              </div>
              
              <div className="mb-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    搜尋訂單
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="輸入訂單編號或餐廳名稱"
                      className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-300"
                      >
                        清除
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    支援輸入完整或部分的訂單編號 / 餐廳名稱。
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    訂單狀態
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as typeof selectedStatus)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  >
                    <option value="all">全部狀態</option>
                    <option value="pending">待處理</option>
                    <option value="confirmed">已確認</option>
                    <option value="processing">處理中</option>
                    <option value="shipped">已出貨</option>
                    <option value="delivered">已完成</option>
                    <option value="cancelled">已取消</option>
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    篩選僅顯示指定狀態的訂單。
                  </p>
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
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">沒有符合搜尋或篩選條件的訂單</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const isExpanded = expandedOrderId === order.id;
                    return (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              訂單 #{order.id}
                            </h3>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                              disabled={updatingStatus === order.id}
                              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <option value="pending">待處理</option>
                              <option value="confirmed">已確認</option>
                              <option value="processing">處理中</option>
                              <option value="shipped">已出貨</option>
                              <option value="delivered">已完成</option>
                              <option value="cancelled">已取消</option>
                            </select>
                            {updatingStatus === order.id && (
                              <span className="text-xs text-gray-500">更新中...</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {order.restaurantName || order.userEmail}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary-600">
                            {(() => {
                              const displayTotal = order.items.reduce((sum, item, idx) => {
                                const q = tempQuantities[order.id]?.[idx] ?? item.quantity;
                                return sum + q * item.unitPrice;
                              }, 0);
                              return `HKD$ ${displayTotal.toFixed(2)}`;
                            })()}
                          </p>
                          {order.createdAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              {format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm')}
                            </p>
                          )}
                            <div className="mt-2 flex justify-end gap-2">
                            <button
                              onClick={() => handleDownloadInvoice(order)}
                              disabled={downloadingInvoice === order.id}
                              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
                              title="下載發票"
                            >
                              {downloadingInvoice === order.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                              <span>發票</span>
                            </button>
                              <button
                                onClick={() =>
                                  setExpandedOrderId((current) => (current === order.id ? null : order.id))
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-4 h-4" />
                                    <span>收合</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4" />
                                    <span>查看詳情</span>
                                  </>
                                )}
                              </button>
                          </div>
                        </div>
                      </div>
                      
                        {isExpanded && (
                          <>
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">訂單項目</h4>
                        <div className="space-y-4">
                          {order.items.map((item, index) => {
                            const canEdit = editableUnits.includes(item.unit || '');
                            const isEditing = editingQuantity?.orderId === order.id && editingQuantity?.itemIndex === index;
                            const currentQuantity = tempQuantities[order.id]?.[index] ?? item.quantity;
                            const inputValue = tempQuantityInputs[order.id]?.[index] ?? String(currentQuantity);
                            return (
                              <div
                                key={index}
                                className="rounded-xl border border-gray-100 bg-gray-50/80 p-5 transition-all hover:border-primary-200 hover:bg-primary-50/40"
                              >
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="flex items-start gap-3">
                                  {item.imageUrl && (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.productName}
                                        className="w-16 h-16 rounded-lg border border-gray-200 object-cover"
                                    />
                                  )}
                                    <div className="space-y-2">
                                      <p className="text-lg font-semibold text-gray-900">{item.productName}</p>
                                    {isEditing ? (
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                          <div className="flex items-center gap-2">
                                            <label className="text-sm font-medium text-gray-700">數量</label>
                                        <input
                                              type="text"
                                              inputMode="decimal"
                                              value={inputValue}
                                              onChange={(e) => {
                                                let value = e.target.value.replace(/[^0-9.]/g, '');
                                                const parts = value.split('.');
                                                if (parts.length > 2) {
                                                  value = `${parts[0]}.${parts.slice(1).join('')}`;
                                                }
                                                setTempQuantityInputs((prev) => ({
                                                  ...prev,
                                                  [order.id]: {
                                                    ...(prev[order.id] || {}),
                                                    [index]: value,
                                                  },
                                                }));
                                                if (value !== '' && value !== '.') {
                                                  const val = parseFloat(value);
                                                  const finalVal = Number.isFinite(val) && val > 0 ? val : 0;
                                                  setTempQuantities((prev) => ({
                                                    ...prev,
                                                    [order.id]: {
                                                      ...(prev[order.id] || {}),
                                                      [index]: finalVal,
                                                    },
                                                  }));
                                              }
                                              }}
                                              className="w-28 rounded-md border border-gray-300 px-3 py-1.5 text-base font-semibold text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                                          autoFocus
                                        />
                                            <span className="text-sm text-gray-500">{item.unit || '單位'}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const raw = tempQuantityInputs[order.id]?.[index];
                                                const parsed = raw && raw !== '.' ? parseFloat(raw) : NaN;
                                                const quantityToSave = Number.isFinite(parsed) && parsed > 0
                                                  ? parsed
                                                  : currentQuantity > 0
                                                    ? currentQuantity
                                                    : 1;
                                                setTempQuantities((prev) => ({
                                                  ...prev,
                                                  [order.id]: {
                                                    ...(prev[order.id] || {}),
                                                    [index]: quantityToSave,
                                                  },
                                                }));
                                                setTempQuantityInputs((prev) => {
                                                  const copy = { ...prev };
                                                  if (!copy[order.id]) copy[order.id] = {};
                                                  copy[order.id][index] = String(quantityToSave);
                                                  return copy;
                                                });
                                                if (canEdit) {
                                                  handleQuantityUpdate(order.id, index, quantityToSave);
                                                }
                                              }}
                                              className="rounded-md bg-primary-600 px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                                            >
                                              儲存
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingQuantity(null);
                                                setTempQuantities((prev) => {
                                                  const copy = { ...prev };
                                                  if (copy[order.id]) {
                                                    delete copy[order.id][index];
                                                    if (Object.keys(copy[order.id]).length === 0) delete copy[order.id];
                                                  }
                                                  return copy;
                                                });
                                                setTempQuantityInputs((prev) => {
                                                  const copy = { ...prev };
                                                  if (copy[order.id]) {
                                                    delete copy[order.id][index];
                                                    if (Object.keys(copy[order.id]).length === 0) delete copy[order.id];
                                                  }
                                                  return copy;
                                                });
                                              }}
                                              className="rounded-md border border-gray-300 px-3.5 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
                                            >
                                              取消
                                            </button>
                                          </div>
                                      </div>
                                    ) : (
                                        <div className="flex flex-wrap items-center gap-3">
                                          <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm">
                                                數量: {(() => {
                                                  const raw = tempQuantityInputs[order.id]?.[index];
                                                  if (typeof raw === 'string') {
                                                    return `${raw || '0'} ${item.unit || '單位'}`;
                                                  }
                                                  return `${currentQuantity} ${item.unit || '單位'}`;
                                                })()}
                                          </span>
                                          {canEdit ? (
                                        <button
                                              type="button"
                                              onClick={() => {
                                                setTempQuantities((prev) => ({
                                                  ...prev,
                                                  [order.id]: {
                                                    ...(prev[order.id] || {}),
                                                    [index]: item.quantity,
                                                  },
                                                }));
                                                    setTempQuantityInputs((prev) => ({
                                                      ...prev,
                                                      [order.id]: {
                                                        ...(prev[order.id] || {}),
                                                        [index]: String(item.quantity),
                                                      },
                                                    }));
                                                setEditingQuantity({ orderId: order.id, itemIndex: index });
                                              }}
                                              className="inline-flex items-center rounded-full border border-primary-200 px-3.5 py-1 text-base font-medium text-primary-600 transition-colors hover:bg-primary-50"
                                        >
                                              調整數量
                                        </button>
                                          ) : (
                                            <span className="text-xs text-gray-400">(此單位不可調整)</span>
                                          )}
                                      </div>
                                    )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-start gap-2 sm:items-end">
                                    <span className="inline-flex items-center rounded-full bg-blue-50 px-4 py-1.5 text-base font-semibold text-blue-700">
                                      單價 HKD$ {item.unitPrice.toFixed(2)} / {item.unit || '單位'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <div className="text-base">
                          <p className="text-gray-900 font-semibold mb-1">送貨地址</p>
                          <p className="text-gray-900 text-base">
                            {order.deliveryAddress?.street || order.deliveryAddress?.city
                              ? `${order.deliveryAddress?.street ?? ''} ${order.deliveryAddress?.city ?? ''}`.trim()
                              : '未填寫'}
                          </p>
                        </div>
                      <div className="text-base mt-3">
                        <p className="text-gray-900 font-semibold mb-1 flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          送貨日期
                        </p>
                        <p className="text-gray-900 text-base">
                          {order.deliveryDate
                            ? format(new Date(order.deliveryDate as any), 'MM-dd-yyyy, EEEE', { locale: zhTW })
                            : '未指定'}
                          </p>
                        </div>
                      </div>
                        </>
                      )}
                    </div>
                  );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
