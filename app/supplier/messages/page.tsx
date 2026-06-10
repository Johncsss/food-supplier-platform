'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Package, Store, LogOut, ShoppingCart, Menu, X, AlertCircle, RefreshCw, Calendar, User as UserIcon, Search, Home } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface SupplierMessage {
  id: string;
  orderId: string;
  userId: string;
  userEmail: string;
  restaurantName: string;
  restaurantPhone?: string;
  supplierId: string;
  supplierCompanyName: string;
  message: string;
  status: 'pending' | 'processed' | 'read' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

export default function SupplierMessages() {
  const { user, firebaseUser, loading, isSupplier, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<SupplierMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processed'>('all');
  const normalizeStatus = (status: string): 'pending' | 'processed' => {
    if (status === 'read' || status === 'resolved' || status === 'processed') return 'processed';
    return 'pending';
  };
  const pendingCount = useMemo(() => {
    const list = Array.isArray(messages) ? messages : [];
    let count = 0;
    for (const m of list) {
      if (normalizeStatus(m.status) === 'pending') count += 1;
    }
    return count;
  }, [messages]);

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
      router.push('/dashboard');
    }
  }, [firebaseUser, loading, router, isSupplier]);

  const fetchMessages = async (showLoading = true) => {
    if (!user || !isSupplier || loading) return;

    try {
      if (showLoading) {
        setMessagesLoading(true);
      } else {
        setRefreshing(true);
      }

      const supplierId = user.id;
      const response = await fetch(`/api/complaints?supplierId=${encodeURIComponent(supplierId)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.complaints || []);
    } catch (error) {
      console.error('Error fetching supplier messages:', error);
      toast.error('載入訊息時發生錯誤');
    } finally {
      if (showLoading) {
        setMessagesLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchMessages(true);
  }, [user, isSupplier, loading]);

  useEffect(() => {
    const fetchNewOrdersCount = async () => {
      if (!user || !isSupplier || loading) return;
      try {
        const supplierIdentifier = user.id;
        const supplierCompanyName = user.companyName;
        if (!supplierIdentifier || !supplierCompanyName) return;
        
        const response = await fetch(`/api/orders?supplier=${encodeURIComponent(supplierIdentifier)}&companyName=${encodeURIComponent(supplierCompanyName)}`);
        if (!response.ok) return;
        
        const data = await response.json();
        const orders = data.orders || [];
        const newOrders = orders.filter((order: any) => 
          order.status === 'pending' || order.status === 'confirmed'
        );
        setNewOrdersCount(newOrders.length);
      } catch {
        // ignore errors
      }
    };
    fetchNewOrdersCount();
  }, [user, isSupplier, loading]);

  const getStatusBadge = (status: string) => {
    const normalized = normalizeStatus(status);
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      processed: 'bg-green-100 text-green-800',
    };
    const labels = {
      pending: '待處理',
      processed: '已處理',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[normalized as keyof typeof styles]}`}>
        {labels[normalized as keyof typeof labels]}
      </span>
    );
  };

  const handleStatusChange = async (id: string, newStatus: 'pending' | 'processed') => {
    // Optimistic update
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
    );
    try {
      const res = await fetch('/api/complaints', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaintId: id, status: newStatus }),
      });
      if (!res.ok) {
        throw new Error('Failed to update status');
      }
      toast.success('狀態已更新');
    } catch (e) {
      toast.error('更新狀態失敗');
      // revert on failure
      setMessages((prev) => prev); // no-op, could refetch instead
      // Better: refetch to ensure consistency
      fetchMessages(false);
    }
  };

  const filteredMessages = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const byStatus = (m: SupplierMessage) =>
      statusFilter === 'all' ? true : normalizeStatus(m.status) === statusFilter;
    const bySearch = (m: SupplierMessage) => {
      if (!term) return true;
      const orderId = (m.orderId || '').toLowerCase();
      const name = (m.restaurantName || '').toLowerCase();
      const phone = (m.restaurantPhone || '').toLowerCase();
      return orderId.includes(term) || name.includes(term) || phone.includes(term);
    };
    const list = Array.isArray(messages) ? messages : [];
    return list.filter((m) => byStatus(m) && bySearch(m));
  }, [messages, searchTerm, statusFilter]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(inputValue), 300);
    return () => clearTimeout(t);
  }, [inputValue]);

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
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
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
                  <item.icon
                    className={`w-5 h-5 mr-3 ${
                      isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  <span className="flex-1">{item.name}</span>
                  {item.name === '訊息' && pendingCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs px-2 py-0.5 min-w-[1.25rem]">
                      {pendingCount}
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

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col ml-0">
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mr-2"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">訊息中心</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden md:block">
                <p className="text-sm text-gray-600">{user?.companyName || '供應商'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">訊息列表</h2>
                  <button
                    onClick={() => fetchMessages(false)}
                    disabled={refreshing || messagesLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="重新整理"
                    style={{ backgroundColor: '#0B8628' }}
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span className="text-sm font-medium">重新整理</span>
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  共 {filteredMessages.length} 筆訊息
                </div>
              </div>
              <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="搜尋：訂單編號、電話、餐廳名稱"
                    className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                  {inputValue && (
                    <button
                      aria-label="清除搜尋"
                      onClick={() => {
                        setInputValue('');
                        setSearchTerm('');
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center">
                  <div className="inline-flex rounded-lg border border-gray-300 p-1 bg-white">
                    {([
                      { key: 'all', label: '全部' },
                      { key: 'pending', label: '待處理' },
                      { key: 'processed', label: '已處理' },
                    ] as const).map((opt) => {
                      const active = statusFilter === opt.key;
                      return (
                        <button
                          key={opt.key}
                          aria-pressed={active}
                          onClick={() => setStatusFilter(opt.key)}
                          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                            active
                              ? 'bg-primary-600 text-white shadow'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {messagesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">載入中...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">目前沒有訊息</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMessages.map((message) => (
                    <div key={message.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <h3 className="text-lg font-semibold text-gray-900">
                              訂單 #{message.orderId}
                            </h3>
                            {getStatusBadge(message.status)}
                          </div>
                          <p className="text-sm text-gray-600">
                            來自：{message.restaurantName || message.userEmail}
                          </p>
                          <p className="text-sm text-gray-600">
                            電話：{message.restaurantPhone || '未填寫'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(message.createdAt), 'yyyy-MM-dd HH:mm')}
                          </p>
                        </div>
                        <div className="ml-4">
                          <label className="block text-xs text-gray-500 mb-1">狀態</label>
                          <select
                            value={normalizeStatus(message.status)}
                            onChange={(e) =>
                              handleStatusChange(
                                message.id,
                                e.target.value as 'pending' | 'processed'
                              )
                            }
                            className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white"
                          >
                            <option value="pending">待處理</option>
                            <option value="processed">已處理</option>
                          </select>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">訊息內容</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                          {message.message}
                        </p>
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
