'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { doc, getDoc, getDocs, query, where, collection, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Menu, X, Store, ShoppingCart, AlertCircle, Calendar, User as UserIcon, LogOut, Home } from 'lucide-react';

interface SupplierForm {
  companyName: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
}

export default function SupplierProfile() {
  const { user, firebaseUser, isSupplier, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [form, setForm] = useState<SupplierForm>({
    companyName: '',
    name: '',
    email: '',
    phone: '',
    address: { street: '', city: '', state: '', zipCode: '' },
  });
  const [saving, setSaving] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [docId, setDocId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  useEffect(() => {
    if (!loading) {
      if (!firebaseUser || !isSupplier) {
        router.replace('/login');
        return;
      }
      const load = async () => {
        try {
          setLoadingDoc(true);
          let foundDocId: string | null = null;
          // Try user.id document
          if (user?.id) {
            const d = await getDoc(doc(db, 'users', user.id));
            if (d.exists()) {
              foundDocId = d.id;
              const data = d.data() as any;
              setForm({
                companyName: data.companyName || '',
                name: data.name || '',
                email: data.email || firebaseUser.email || '',
                phone: data.phone || '',
                address: {
                  street: data.address?.street || '',
                  city: data.address?.city || '',
                  state: data.address?.state || '',
                  zipCode: data.address?.zipCode || '',
                },
              });
            }
          }
          // Fallback by firebaseUid query
          if (!foundDocId) {
            const snap = await getDocs(
              query(collection(db, 'users'), where('firebaseUid', '==', firebaseUser.uid)),
            );
            if (!snap.empty) {
              const d = snap.docs[0];
              foundDocId = d.id;
              const data = d.data() as any;
              setForm({
                companyName: data.companyName || '',
                name: data.name || '',
                email: data.email || firebaseUser.email || '',
                phone: data.phone || '',
                address: {
                  street: data.address?.street || '',
                  city: data.address?.city || '',
                  state: data.address?.state || '',
                  zipCode: data.address?.zipCode || '',
                },
              });
            }
          }
          // Last fallback: create a doc id from firebase uid (will be merged on save)
          if (!foundDocId) {
            foundDocId = firebaseUser.uid;
            setForm((prev) => ({
              ...prev,
              email: prev.email || firebaseUser.email || '',
            }));
          }
          setDocId(foundDocId);
        } catch (e) {
          console.error('Failed to load supplier profile', e);
        } finally {
          setLoadingDoc(false);
        }
      };
      load();
    }
  }, [loading, firebaseUser, isSupplier, router, user?.id]);

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


  const handleChange = (field: keyof SupplierForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  const handleAddressChange = (field: keyof SupplierForm['address'], value: string) => {
    setForm((prev) => ({ ...prev, address: { ...prev.address, [field]: value } }));
  };

  const handleSave = async () => {
    if (!docId) return;
    try {
      setSaving(true);
      const ref = doc(db, 'users', docId);
      const payload = {
        companyName: form.companyName,
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: {
          street: form.address.street || '',
          city: form.address.city || '',
          state: form.address.state || '',
          zipCode: form.address.zipCode || '',
        },
        firebaseUid: firebaseUser?.uid || null,
        updatedAt: new Date(),
        role: 'supplier',
      };
      const exists = (await getDoc(ref)).exists();
      if (exists) {
        await updateDoc(ref, payload as any);
      } else {
        await setDoc(ref, payload as any, { merge: true });
      }
      toast.success('供應商資料已更新');
    } catch (e) {
      console.error('Failed to save supplier profile', e);
      toast.error('儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingDoc) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
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
                  <item.icon className={`w-5 h-5 mr-3 ${
                    isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  <span className="flex-1">{item.name}</span>
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
              <h1 className="text-xl font-semibold text-gray-900">供應商資料</h1>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-sm text-gray-600">{user?.companyName || '供應商'}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>

        <main className="flex-1 p-8">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">供應商資料</h1>
              <p className="text-gray-600">更新您的公司資料與聯絡資訊</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">公司名稱</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="輸入公司名稱"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">聯絡人姓名</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">電郵</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">電話</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">地址</label>
                <input
                  type="text"
                  placeholder="地址"
                  value={form.address.street || ''}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? '儲存中...' : '儲存'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

