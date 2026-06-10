'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Package, 
  BarChart3, 
  Settings, 
  Home,
  Briefcase,
  Store,
  ClipboardCheck,
  Cog,
  ArrowRight,
  Shield,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface AdminPage {
  key: string;
  label: string;
  href: string;
  icon: any;
  enabled: boolean;
}

export default function AdminWelcome() {
  const { user, isAdmin, loading, adminPermissions } = useAuth();
  const router = useRouter();
  const [availablePages, setAvailablePages] = useState<AdminPage[]>([]);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/login');
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin && adminPermissions) {
      const allPages: AdminPage[] = [
        { key: 'dashboard', label: '儀表板', href: '/admin', icon: LayoutDashboard, enabled: true },
        { key: 'orders', label: '訂單管理', href: '/admin/orders', icon: ShoppingCart, enabled: true },
        { key: 'products', label: '產品管理', href: '/admin/products', icon: Package, enabled: true },
        { key: 'members', label: '餐廳管理', href: '/admin/members', icon: Users, enabled: true },
        { key: 'suppliers', label: '供應商', href: '/admin/suppliers', icon: Store, enabled: true },
        { key: 'salesTeam', label: '銷售團隊', href: '/admin/sales-team', icon: Briefcase, enabled: true },
        { key: 'pointsApprovals', label: '點數審核', href: '/admin/points-approvals', icon: ClipboardCheck, enabled: true },
        { key: 'inventory', label: '庫存管理', href: '/admin/inventory', icon: BarChart3, enabled: true },
        { key: 'settings', label: '設定', href: '/admin/settings', icon: Settings, enabled: true },
        { key: 'content', label: '內容管理', href: '/admin/content', icon: Home, enabled: true },
        { key: 'system', label: '系統管理', href: '/admin/system', icon: Cog, enabled: true },
      ];

      const enabledPages = allPages.filter(page => {
        // If no permissions object, show all (backward compatibility)
        if (!adminPermissions) return true;
        // Only show pages that are explicitly enabled
        return adminPermissions[page.key as keyof typeof adminPermissions] === true;
      });

      setAvailablePages(enabledPages);
    } else if (isAdmin && !adminPermissions) {
      // If admin but no permissions object, show all pages
      setAvailablePages([
        { key: 'dashboard', label: '儀表板', href: '/admin', icon: LayoutDashboard, enabled: true },
        { key: 'orders', label: '訂單管理', href: '/admin/orders', icon: ShoppingCart, enabled: true },
        { key: 'products', label: '產品管理', href: '/admin/products', icon: Package, enabled: true },
        { key: 'members', label: '餐廳管理', href: '/admin/members', icon: Users, enabled: true },
        { key: 'suppliers', label: '供應商', href: '/admin/suppliers', icon: Store, enabled: true },
        { key: 'salesTeam', label: '銷售團隊', href: '/admin/sales-team', icon: Briefcase, enabled: true },
        { key: 'pointsApprovals', label: '點數審核', href: '/admin/points-approvals', icon: ClipboardCheck, enabled: true },
        { key: 'inventory', label: '庫存管理', href: '/admin/inventory', icon: BarChart3, enabled: true },
        { key: 'settings', label: '設定', href: '/admin/settings', icon: Settings, enabled: true },
        { key: 'content', label: '內容管理', href: '/admin/content', icon: Home, enabled: true },
        { key: 'system', label: '系統管理', href: '/admin/system', icon: Cog, enabled: true },
      ]);
    }
  }, [isAdmin, adminPermissions]);

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

  if (!isAdmin) {
    return null;
  }

  const userName = user?.name || user?.email?.split('@')[0] || '管理員';
  const greeting = '您好';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-full mb-6 shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {greeting}，{userName}！
          </h1>
          <p className="text-xl text-gray-600">
            歡迎回到管理後台
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">可用功能</p>
                <p className="text-3xl font-bold text-primary-600">{availablePages.length}</p>
                <p className="text-xs text-gray-500 mt-1">個管理頁面</p>
              </div>
              <div className="p-3 rounded-lg bg-primary-100">
                <LayoutDashboard className="w-8 h-8 text-primary-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">帳號類型</p>
                <p className="text-2xl font-bold text-gray-900">管理員</p>
                <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">登入時間</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleDateString('zh-TW')}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Access Pages */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">快速進入</h2>
          
          {availablePages.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">您目前沒有可用的管理頁面權限</p>
              <p className="text-sm text-gray-400 mt-2">請聯繫系統管理員以獲得權限</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availablePages.map((page) => {
                const IconComponent = page.icon;
                return (
                  <Link
                    key={page.key}
                    href={page.href}
                    className="group flex items-center p-4 bg-gray-50 rounded-lg hover:bg-primary-50 hover:border-primary-300 border-2 border-transparent transition-all"
                  >
                    <div className="p-3 rounded-lg bg-primary-100 group-hover:bg-primary-200 transition-colors mr-4">
                      <IconComponent className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 group-hover:text-primary-700">
                        {page.label}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Button - Only show if user has dashboard permission and there are available pages */}
        {availablePages.length > 0 && (!adminPermissions || adminPermissions.dashboard === true) && (
          <div className="mt-8 text-center">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
            >
              <LayoutDashboard className="w-5 h-5" />
              前往儀表板
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
