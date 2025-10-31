'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Package, TrendingUp, Store, LogOut, ShoppingCart, Menu, X, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function SupplierDashboard() {
  const { user, firebaseUser, loading, isSupplier, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
              <h1 className="text-xl font-semibold text-gray-900">供應商儀表板</h1>
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">待處理訂單</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">本月銷售額</p>
                <p className="text-3xl font-bold text-gray-900">$0</p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">歡迎使用供應商系統</h2>
          <div className="space-y-4 text-gray-600">
            <p>這是一個供應商專用的儀表板。您可以在此管理您的訂單、產品和客戶。</p>
            <p>功能正在開發中，敬請期待。</p>
          </div>
        </div>
          </div>
        </main>
      </div>
    </div>
  );
}
