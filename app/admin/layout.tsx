'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  LogOut,
  Menu,
  X,
  Home,
  AlertTriangle,
  Shield,
  Briefcase,
  Store,
  Settings,
  Cog
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { t } from '@/lib/translate';

interface SidebarItem {
  name: string;
  href: string;
  icon: any;
  badge?: number;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [loadingPendingCount, setLoadingPendingCount] = useState(true);
  const [sidebarConfig, setSidebarConfig] = useState<any>(null);
  const [loadingSidebarConfig, setLoadingSidebarConfig] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, isSupplier, loading, signOut } = useAuth();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not authenticated, redirect to login
        router.push('/login?redirect=/admin');
      } else if (isSupplier) {
        // If supplier tries to access admin, redirect to supplier dashboard
        router.push('/supplier');
      } else if (!isAdmin && user.firebaseUid !== 'kMOVDljmF8a1N8WVwQYYjfBMmNd2') {
        // Authenticated but not admin, redirect to home with error
        // Exception: allow admin@test.com (kMOVDljmF8a1N8WVwQYYjfBMmNd2) temporarily
        router.push('/?error=unauthorized');
      }
    }
  }, [user, isAdmin, isSupplier, loading, router]);

  // Optimized fetch function with caching
  const fetchPendingOrdersCount = useCallback(async () => {
    try {
      setLoadingPendingCount(true);
      // Admin view: count all orders with status pending
      const ordersRef = collection(db, 'orders');
      const snapshot = await getDocs(ordersRef);
      let pending = 0;
      snapshot.forEach((doc) => {
        const data: any = doc.data();
        if (data.status === 'pending') pending++;
      });
      setPendingOrders((prev) => (prev !== pending ? pending : prev));
    } catch (error: any) {
      // Silently handle permission errors - user may not have admin claim yet
      if (error?.code === 'permission-denied') {
        setPendingOrders(0);
      } else {
        console.error('Error fetching pending orders count:', error);
      }
    } finally {
      setLoadingPendingCount(false);
    }
  }, []);

  // Fetch pending orders count with optimized polling
  useEffect(() => {
    // Fetch immediately
    fetchPendingOrdersCount();
    
    // Set up polling every 20 seconds (reduced frequency for better performance)
    const interval = setInterval(fetchPendingOrdersCount, 20000);
    
    return () => clearInterval(interval);
  }, [fetchPendingOrdersCount]);

  // Load sidebar configuration
  useEffect(() => {
    const fetchSidebarConfig = async () => {
      try {
        setLoadingSidebarConfig(true);
        const configRef = doc(db, 'admin', 'sidebarConfig');
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          const data = configSnap.data();
          setSidebarConfig(data);
        } else {
          // Use default config if none exists
          setSidebarConfig({ menus: [] });
        }
      } catch (err: any) {
        console.error('Error loading sidebar config:', err);
        setSidebarConfig({ menus: [] });
      } finally {
        setLoadingSidebarConfig(false);
      }
    };
    fetchSidebarConfig();
  }, []);

  const allSidebarItems: SidebarItem[] = [
    {
      name: t('Dashboard'),
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      name: t('Orders'),
      href: '/admin/orders',
      icon: ShoppingCart,
      badge: pendingOrders > 0 ? pendingOrders : undefined,
    },
    {
      name: '餐廳會員',
      href: '/admin/members',
      icon: Users,
    },
    {
      name: '銷售團隊',
      href: '/admin/sales-team',
      icon: Briefcase,
    },
    {
      name: '供應商',
      href: '/admin/suppliers',
      icon: Store,
    },
    {
      name: t('Products'),
      href: '/admin/products',
      icon: Package,
    },
    {
      name: t('Inventory'),
      href: '/admin/inventory',
      icon: BarChart3,
      badge: 5,
    },
    {
      name: t('Settings'),
      href: '/admin/settings',
      icon: Settings,
    },
    {
      name: '內容管理',
      href: '/admin/content',
      icon: Home,
    },
  ];

  // Filter sidebar items based on configuration
  const sidebarItems = allSidebarItems.filter(item => {
    if (!sidebarConfig || !sidebarConfig.menus) return true; // Show all by default if no config
    const menuConfig = sidebarConfig.menus.find((m: any) => {
      // Match by href (more reliable than name/icon)
      return m.href === item.href;
    });
    // If config exists for this menu, use its enabled status; otherwise show it
    return menuConfig ? menuConfig.enabled !== false : true;
  });

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

  // For demo purposes, allow access even without authentication
  // In production, this should be removed and proper authentication should be enforced
  if (!user) {
    // Create a demo admin user for demonstration
    const demoUser = {
      id: 'demo-admin',
      firebaseUid: 'demo-admin',
      email: 'admin@demo.com',
      name: 'Demo Admin',
      isAdmin: true
    };
    
    // Use demo user for the layout
    const effectiveUser = demoUser;
    const effectiveIsAdmin = true;
    
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
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0B8628] text-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-white/20">
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-lg font-bold text-white">{t('FoodSupplier')}</h1>
                <p className="text-xs text-white/80">{t('Admin Panel')} (Demo)</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5 text-white" />
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
                        ? 'bg-white/20 text-white border-r-2 border-white'
                        : 'text-white hover:bg-white/10 hover:text-white'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={`w-5 h-5 mr-3 ${
                      isActive ? 'text-white' : 'text-white/70 group-hover:text-white'
                    }`} />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                        {loadingPendingCount ? '...' : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Admin Info */}
          <div className="p-4 border-t border-white/20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {effectiveUser?.name?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{effectiveUser?.name || t('Admin User')}</p>
                <p className="text-xs text-white/80">{effectiveUser?.email} (Demo)</p>
              </div>
            </div>
          </div>
        </div>

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
                <h1 className="text-xl font-semibold text-gray-900">Admin Panel (Demo Mode)</h1>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1 p-4">
            <div className="w-full">
              {children}
            </div>
          </main>
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
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0B8628] text-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-lg font-bold text-white">{t('FoodSupplier')}</h1>
              <p className="text-xs text-white/80">{t('Admin Panel')}</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5 text-white" />
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
                      ? 'bg-white/20 text-white border-r-2 border-white'
                      : 'text-white hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${
                    isActive ? 'text-white' : 'text-white/70 group-hover:text-white'
                  }`} />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                      {loadingPendingCount ? '...' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Admin Info */}
        <div className="p-4 border-t border-white/20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{user?.name || t('Admin User')}</p>
              <p className="text-xs text-white/80">{user?.email}</p>
            </div>
            <button
              className="p-1 rounded-lg hover:bg-white/10"
              onClick={async () => {
                try {
                  await signOut();
                  window.location.href = '/login';
                } catch (err) {
                  console.error('Sign out failed:', err);
                }
              }}
            >
              <LogOut className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col ml-0">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mr-2"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">{t('Admin Panel')}</h1>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 