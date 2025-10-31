'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  User,
  LogOut,
  Menu,
  X,
  Home,
  UtensilsCrossed,
  Coins
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface Order {
  id: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

interface SidebarItem {
  name: string;
  href: string;
  icon: any;
  badge?: number;
}



export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [loadingPendingCount, setLoadingPendingCount] = useState(true);
  const pathname = usePathname();
  const { user, firebaseUser, signOut } = useAuth();

  useEffect(() => {
    const fetchPendingOrdersCount = async () => {
      if (!firebaseUser?.uid) return;
      try {
        setLoadingPendingCount(true);
        const ordersRef = collection(db, 'orders');
        const qOrders = query(ordersRef, where('userId', '==', firebaseUser.uid));
        const snapshot = await getDocs(qOrders);
        let pending = 0;
        snapshot.forEach((doc) => {
          const data: any = doc.data();
          if (data.status === 'pending') pending++;
        });
        setPendingOrders((prev) => (prev !== pending ? pending : prev));
      } catch (error) {
        console.error('Error fetching pending orders count:', error);
      } finally {
        setLoadingPendingCount(false);
      }
    };

    fetchPendingOrdersCount();
    const interval = setInterval(fetchPendingOrdersCount, 20000);
    return () => clearInterval(interval);
  }, [firebaseUser]);

  const sidebarItems: SidebarItem[] = [
    { name: '儀表板', href: '/dashboard', icon: LayoutDashboard },
    { name: '我的訂單', href: '/dashboard/orders', icon: ShoppingCart, badge: pendingOrders > 0 ? pendingOrders : undefined },
    { name: '會員點數', href: '/dashboard/points', icon: Coins },
    { name: '帳戶資料', href: '/dashboard/profile', icon: User },
  ];

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
            <div className="p-2 rounded-lg bg-primary-100">
              <UtensilsCrossed className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{user?.restaurantName || '餐廳'}</h1>
              <p className="text-xs text-gray-500">會員</p>
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

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-sm font-medium text-primary-700">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
                          <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{user?.name || '使用者'}</p>
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
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Quick actions */}
              <Link href="/products" className="btn-outline text-sm">
                去訂貨
              </Link>
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