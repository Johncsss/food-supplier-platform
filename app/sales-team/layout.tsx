'use client';

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard,
  Users,
  ShoppingCart,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

interface SidebarItem {
  name: string;
  href: string;
  icon: any;
}

export default function SalesTeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isSalesTeam, loading, signOut } = useAuth();

  // Redirect if not authenticated or not sales team
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not authenticated, redirect to login
        router.push('/login?redirect=/sales-team');
      } else if (!isSalesTeam) {
        // Authenticated but not sales team, redirect to home
        router.push('/?error=unauthorized');
      }
    }
  }, [user, isSalesTeam, loading, router]);

  const sidebarItems: SidebarItem[] = [
    {
      name: '儀表板',
      href: '/sales-team',
      icon: LayoutDashboard,
    },
    {
      name: '團隊成員',
      href: '/sales-team/members',
      icon: Users,
    },
    {
      name: '業績統計',
      href: '/sales-team/performance',
      icon: TrendingUp,
    },
  ];

  // Show loading state while checking authentication
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

  // Show unauthorized message if not authenticated or not sales team
  if (!user || !isSalesTeam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">存取被拒</h2>
          <p className="text-gray-600 mb-6">
            {!user 
              ? '您必須登入才能訪問銷售團隊面板。'
              : '您沒有權限訪問此頁面。'}
          </p>
          <Link
            href={!user ? '/login' : '/'}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {!user ? '登入' : '返回首頁'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">銷售團隊</h1>
              <p className="text-xs text-gray-500">管理面板</p>
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
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${
                    isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  <span className="flex-1">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-700">
                {user?.name?.charAt(0).toUpperCase() || 'S'}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{user?.name || '銷售團隊'}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              className="p-1 rounded-lg hover:bg-gray-100"
              onClick={async () => {
                try {
                  await signOut();
                  window.location.href = '/login';
                } catch (err) {
                  console.error('Sign out failed:', err);
                }
              }}
            >
              <LogOut className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar for mobile */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

