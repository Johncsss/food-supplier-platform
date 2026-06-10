'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  ShoppingCart, 
  TrendingUp,
  Plus,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  Calendar,
  CheckCircle,
  Shield,
  X,
  Mail,
  User
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { t } from '@/lib/translate';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  restaurantName?: string;
  status: string;
  totalAmount: number;
  items: any[];
  createdAt: any;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  firebaseUid?: string;
  permissions?: {
    dashboard?: boolean;
    orders?: boolean;
    products?: boolean;
    members?: boolean;
    suppliers?: boolean;
    salesTeam?: boolean;
    pointsApprovals?: boolean;
    inventory?: boolean;
    settings?: boolean;
    content?: boolean;
    system?: boolean;
  };
  createdAt?: any;
}

export default function AdminDashboard() {
  const { refreshUser } = useAuth();
  const router = useRouter();
  const [totalMembers, setTotalMembers] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    permissions: {
      dashboard: true,
      orders: false,
      products: false,
      members: false,
      suppliers: false,
      salesTeam: false,
      pointsApprovals: false,
      inventory: false,
      settings: false,
      content: false,
      system: false,
    },
  });
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  const adminPages = [
    { key: 'dashboard', label: '儀表板', href: '/admin' },
    { key: 'orders', label: '訂單管理', href: '/admin/orders' },
    { key: 'products', label: '產品管理', href: '/admin/products' },
    { key: 'members', label: '餐廳管理', href: '/admin/members' },
    { key: 'suppliers', label: '供應商', href: '/admin/suppliers' },
    { key: 'salesTeam', label: '銷售團隊', href: '/admin/sales-team' },
    { key: 'pointsApprovals', label: '點數審核', href: '/admin/points-approvals' },
    { key: 'inventory', label: '庫存管理', href: '/admin/inventory' },
    { key: 'settings', label: '設定', href: '/admin/settings' },
    { key: 'content', label: '內容管理', href: '/admin/content' },
    { key: 'system', label: '系統管理', href: '/admin/system' },
  ];

  const fetchAdminUsers = useCallback(async () => {
    try {
      setLoadingAdmins(true);
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      // Fetch admin users
      const adminUsersList: AdminUser[] = usersSnapshot.docs
        .filter(doc => {
          const data = doc.data();
          return data.role === 'admin';
        })
        .map(doc => {
          const data = doc.data();
          return {
            id: data.id || doc.id,
            name: data.name || '',
            email: data.email || '',
            firebaseUid: data.firebaseUid || '',
            permissions: data.permissions || {},
            createdAt: data.createdAt,
          };
        });
      
      // Sort by createdAt descending
      adminUsersList.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
        const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
        return bTime - aTime;
      });
      
      setAdminUsers(adminUsersList);
    } catch (error) {
      console.error('Error fetching admin users:', error);
    } finally {
      setLoadingAdmins(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch total members
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const membersCount = usersSnapshot.docs.filter(doc => {
          const data = doc.data();
          return data.role !== 'admin' && data.role !== 'supplier'; // Only count regular members
        }).length;
        setTotalMembers(membersCount);

        // Fetch admin users
        await fetchAdminUsers();

        // Fetch recent orders
        const ordersRef = collection(db, 'orders');
        const ordersSnapshot = await getDocs(ordersRef);
        const allOrders = ordersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            restaurantName: data.restaurantName || data.userEmail || 'Unknown',
            status: data.status || 'pending',
            totalAmount: data.totalAmount || 0,
            items: data.items || [],
            createdAt: data.createdAt
          };
        });
        
        // Sort by createdAt descending and take first 3
        const sortedOrders = allOrders.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
          const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
          return bTime - aTime;
        }).slice(0, 3);
        
        setRecentOrders(sortedOrders);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchAdminUsers]);

  const stats = [
    {
      title: t('Total Members'),
      value: totalMembers.toLocaleString(),
      change: '-',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: 'up',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-yellow-600 bg-yellow-100';
      case 'shipped':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleCreateAdmin = async () => {
    // Validate form
    if (!adminForm.name || !adminForm.email || !adminForm.password || !adminForm.confirmPassword) {
      toast.error('請填寫所有欄位');
      return;
    }

    if (adminForm.password !== adminForm.confirmPassword) {
      toast.error('密碼不一致');
      return;
    }

    if (adminForm.password.length < 6) {
      toast.error('密碼長度至少需要 6 個字元');
      return;
    }

    try {
      setIsCreatingAdmin(true);
      const response = await fetch('/api/admin/create-admin-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: adminForm.name,
          email: adminForm.email,
          password: adminForm.password,
          permissions: adminForm.permissions,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '建立管理員失敗');
      }

      toast.success('管理員帳號建立成功');
      setShowCreateAdminModal(false);
      setAdminForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        permissions: {
          dashboard: true,
          orders: false,
          products: false,
          members: false,
          suppliers: false,
          salesTeam: false,
          pointsApprovals: false,
          inventory: false,
          settings: false,
          content: false,
          system: false,
        },
      });
      // Refresh admin users list
      await fetchAdminUsers();
    } catch (error: any) {
      console.error('Error creating admin user:', error);
      toast.error(error.message || '建立管理員時發生錯誤');
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handlePermissionChange = (key: string) => {
    setAdminForm({
      ...adminForm,
      permissions: {
        ...adminForm.permissions,
        [key]: !adminForm.permissions[key as keyof typeof adminForm.permissions],
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <div className="flex items-center">
                  <TrendingUp className={`w-4 h-4 ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-sm ml-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Admin User Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">管理員帳號管理</h2>
              <p className="text-sm text-gray-600">建立新的管理員帳號</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateAdminModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            建立管理員
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Admin Users List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">管理員列表</h2>
              </div>
            </div>
            
            <div className="space-y-3">
              {loadingAdmins ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">{t('Loading...')}</p>
                </div>
              ) : adminUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">目前沒有管理員</p>
                </div>
              ) : (
                adminUsers.map((adminUser) => {
                  const createdDate = adminUser.createdAt?.toDate?.() 
                    ? adminUser.createdAt.toDate().toLocaleDateString('zh-TW')
                    : '-';
                  const enabledPermissions = adminUser.permissions 
                    ? Object.entries(adminUser.permissions).filter(([_, enabled]) => enabled).length
                    : 0;
                  const totalPermissions = adminPages.length;
                  
                  return (
                    <div key={adminUser.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="p-2 rounded-lg bg-purple-100">
                          <User className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{adminUser.name || '未命名管理員'}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Mail className="w-4 h-4" />
                              <span>{adminUser.email}</span>
                            </div>
                            <span className="text-xs text-gray-500">建立於: {createdDate}</span>
                          </div>
                          <div className="mt-2">
                            <span className="text-xs text-gray-600">
                              權限: {enabledPermissions} / {totalPermissions} 頁面
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          管理員
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{t('Recent Orders')}</h2>
              <Link href="/admin/orders" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                {t('View All Orders →')}
              </Link>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">{t('Loading...')}</p>
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">{t('No recent orders')}</p>
                </div>
              ) : (
                recentOrders.map((order) => {
                  const orderDate = order.createdAt?.toDate?.() ? 
                    order.createdAt.toDate().toLocaleDateString() : 
                    '-';
                  const itemsCount = order.items?.length || 0;
                  return (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${getStatusColor(order.status)}`}>
                          <ShoppingCart className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{order.id.substring(0, 12)}...</p>
                          <p className="text-sm text-gray-600">{order.restaurantName}</p>
                          <p className="text-sm text-gray-500">{orderDate}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">${order.totalAmount.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">{itemsCount} {t('items')}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {t(order.status)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Admin Modal */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 overflow-y-auto flex-1">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">建立管理員帳號</h3>
              <button
                onClick={() => {
                  setShowCreateAdminModal(false);
                  setAdminForm({
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    permissions: {
                      dashboard: true,
                      orders: false,
                      products: false,
                      members: false,
                      suppliers: false,
                      salesTeam: false,
                      pointsApprovals: false,
                      inventory: false,
                      settings: false,
                      content: false,
                      system: false,
                    },
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="輸入管理員姓名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  電子郵件 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  密碼 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="至少 6 個字元"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  確認密碼 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={adminForm.confirmPassword}
                  onChange={(e) => setAdminForm({ ...adminForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="再次輸入密碼"
                />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  頁面權限 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {adminPages.map((page) => (
                    <label
                      key={page.key}
                      className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        adminForm.permissions[page.key as keyof typeof adminForm.permissions]
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={adminForm.permissions[page.key as keyof typeof adminForm.permissions] || false}
                        onChange={() => handlePermissionChange(page.key)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{page.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            </div>

            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={handleCreateAdmin}
                  disabled={isCreatingAdmin}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreatingAdmin ? '建立中...' : '建立管理員'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateAdminModal(false);
                    setAdminForm({
                      name: '',
                      email: '',
                      password: '',
                      confirmPassword: '',
                      permissions: {
                        dashboard: true,
                        orders: false,
                        products: false,
                        members: false,
                        suppliers: false,
                        salesTeam: false,
                        pointsApprovals: false,
                        inventory: false,
                        settings: false,
                        content: false,
                        system: false,
                      },
                    });
                  }}
                  disabled={isCreatingAdmin}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 