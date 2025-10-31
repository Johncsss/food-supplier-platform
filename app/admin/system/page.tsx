'use client';

import { useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { t } from '@/lib/translate';
import { 
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  Briefcase,
  Store,
  Settings,
  Cog
} from 'lucide-react';

interface MenuConfig {
  id: string;
  name: string;
  href: string;
  icon: string;
  enabled: boolean;
}

const DEFAULT_MENU_CONFIG: MenuConfig[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    href: '/admin',
    icon: 'LayoutDashboard',
    enabled: true,
  },
  {
    id: 'orders',
    name: 'Orders',
    href: '/admin/orders',
    icon: 'ShoppingCart',
    enabled: true,
  },
  {
    id: 'members',
    name: '餐廳會員',
    href: '/admin/members',
    icon: 'Users',
    enabled: true,
  },
  {
    id: 'sales-team',
    name: '銷售團隊',
    href: '/admin/sales-team',
    icon: 'Briefcase',
    enabled: true,
  },
  {
    id: 'suppliers',
    name: '供應商',
    href: '/admin/suppliers',
    icon: 'Store',
    enabled: true,
  },
  {
    id: 'products',
    name: 'Products',
    href: '/admin/products',
    icon: 'Package',
    enabled: true,
  },
  {
    id: 'inventory',
    name: 'Inventory',
    href: '/admin/inventory',
    icon: 'BarChart3',
    enabled: true,
  },
  {
    id: 'settings',
    name: 'Settings',
    href: '/admin/settings',
    icon: 'Settings',
    enabled: true,
  },
  {
    id: 'system',
    name: '系統設定',
    href: '/admin/system',
    icon: 'Cog',
    enabled: true,
  },
];

export default function AdminSystem() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menus, setMenus] = useState<MenuConfig[]>(DEFAULT_MENU_CONFIG);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const settingsRef = useMemo(() => doc(db, 'admin', 'sidebarConfig'), []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const snap = await getDoc(settingsRef);
        if (snap.exists()) {
          const data = snap.data() as any;
          if (Array.isArray(data.menus) && data.menus.length > 0) {
            setMenus(data.menus as MenuConfig[]);
          } else {
            // Initialize with defaults if empty
            await setDoc(settingsRef, { menus: DEFAULT_MENU_CONFIG });
            setMenus(DEFAULT_MENU_CONFIG);
          }
        } else {
          // Initialize document with defaults
          await setDoc(settingsRef, { menus: DEFAULT_MENU_CONFIG });
          setMenus(DEFAULT_MENU_CONFIG);
        }
      } catch (err: any) {
        console.error('Error loading settings:', err);
        setError(err?.message || '載入設定失敗');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [settingsRef]);

  const toggleMenu = (id: string) => {
    setMenus(prev => prev.map(menu => 
      menu.id === id ? { ...menu, enabled: !menu.enabled } : menu
    ));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await setDoc(settingsRef, { menus });
      setSuccess('設定已儲存');
      // Reload page to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err?.message || '儲存設定失敗');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!confirm('確定要重置為預設值嗎？')) {
      return;
    }
    setMenus(DEFAULT_MENU_CONFIG);
    await setDoc(settingsRef, { menus: DEFAULT_MENU_CONFIG });
    setSuccess('已重置為預設值');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const getIcon = (iconName: string) => {
    const IconMap: { [key: string]: any } = {
      LayoutDashboard,
      ShoppingCart,
      Users,
      Package,
      BarChart3,
      Briefcase,
      Store,
      Settings,
      Cog,
    };
    return IconMap[iconName] || LayoutDashboard;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">系統設定</h1>
        <p className="text-gray-600">管理後台側邊欄選單的顯示/隱藏。</p>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-lg border border-green-200 bg-green-50 text-green-700">
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">側邊欄選單管理</h2>
          <button
            onClick={resetToDefaults}
            disabled={loading || saving}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            重置為預設值
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">載入中...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {menus.map((menu) => {
              const IconComponent = getIcon(menu.icon);
              return (
                <div
                  key={menu.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <IconComponent className="w-5 h-5 text-gray-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{menu.name}</p>
                      <p className="text-sm text-gray-500">{menu.href}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={menu.enabled}
                      onChange={() => toggleMenu(menu.id)}
                      className="sr-only peer"
                      disabled={saving}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {menu.enabled ? '顯示' : '隱藏'}
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={saveSettings}
            disabled={saving || loading}
            className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {saving ? '儲存中...' : '儲存設定'}
          </button>
        </div>
      </div>
    </div>
  );
}

