'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Package, CheckCircle, Coins } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();
  // Removed demo points overlay for real balance consistency

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.push('/login');
    }
  }, [firebaseUser, loading, router]);

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

  if (!firebaseUser) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              歡迎回來，{user?.name || '餐廳老闆'}！
            </h1>
            <p className="text-gray-600">
              以下是您的 {user?.restaurantName || '餐廳'} 帳戶的最新狀況。
            </p>
          </div>
          {/* Demo banner removed */}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6">
        <Link href="/dashboard/points" className="block">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">會員點數</p>
                <p className="text-2xl font-bold text-gray-900">{user?.memberPoints || 0}</p>
                <p className="text-sm text-blue-600">點數餘額</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Coins className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/products"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">開始購物</h3>
              <p className="text-sm text-gray-600">瀏覽產品並下訂單</p>
            </div>
          </Link>
          
          <Link
            href="/dashboard/orders"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">查看訂單</h3>
              <p className="text-sm text-gray-600">管理您的訂單狀態</p>
            </div>
          </Link>
          
          <Link
            href="/dashboard/points"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Coins className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">管理點數</h3>
              <p className="text-sm text-gray-600">查看餘額並購買點數</p>
            </div>
          </Link>
        </div>
      </div>

    </div>
  );
} 