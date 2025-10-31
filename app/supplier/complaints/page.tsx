'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Package, Store, LogOut, ShoppingCart, Menu, X, AlertCircle, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Complaint {
  id: string;
  orderId: string;
  userId: string;
  userEmail: string;
  restaurantName: string;
  supplierId: string;
  supplierCompanyName: string;
  message: string;
  status: 'pending' | 'read' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

export default function SupplierComplaints() {
  const { user, firebaseUser, loading, isSupplier, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      icon: Package,
    },
  ];

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.push('/login');
    } else if (!loading && firebaseUser && !isSupplier) {
      router.push('/dashboard');
    }
  }, [firebaseUser, loading, router, isSupplier]);

  const fetchComplaints = async (showLoading = true) => {
    if (!user || !isSupplier || loading) return;
    
    try {
      if (showLoading) {
        setComplaintsLoading(true);
      } else {
        setRefreshing(true);
      }

      const supplierId = user.id;
      
      console.log('Fetching complaints for supplier ID:', supplierId);
      
      const response = await fetch(`/api/complaints?supplierId=${encodeURIComponent(supplierId)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch complaints');
      }
      
      const data = await response.json();
      console.log('Complaints loaded:', data.complaints?.length || 0);
      
      setComplaints(data.complaints || []);
      
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('載入投訴時發生錯誤');
    } finally {
      if (showLoading) {
        setComplaintsLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };
  
  useEffect(() => {
    fetchComplaints(true);
  }, [user, isSupplier, loading]);

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      read: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800'
    };
    const labels = {
      pending: '待處理',
      read: '已讀',
      resolved: '已解決'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

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
              <h1 className="text-xl font-semibold text-gray-900">投訴管理</h1>
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
            {/* Complaints Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">投訴列表</h2>
                  <button
                    onClick={() => fetchComplaints(false)}
                    disabled={refreshing || complaintsLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="重新整理"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span className="text-sm font-medium">重新整理</span>
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  共 {complaints.length} 筆投訴
                </div>
              </div>
              
              {complaintsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">載入中...</p>
                  </div>
                </div>
              ) : complaints.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">目前沒有投訴</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {complaints.map((complaint) => (
                    <div key={complaint.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <h3 className="text-lg font-semibold text-gray-900">
                              訂單 #{complaint.orderId}
                            </h3>
                            {getStatusBadge(complaint.status)}
                          </div>
                          <p className="text-sm text-gray-600">
                            來自：{complaint.restaurantName || complaint.userEmail}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(complaint.createdAt), 'yyyy-MM-dd HH:mm')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">投訴內容</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                          {complaint.message}
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
