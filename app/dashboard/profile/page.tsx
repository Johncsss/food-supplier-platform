'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User, Building2, MapPin, Phone, Mail, Edit, Save, X, Lock } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    restaurantName: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    checkoutPassword: ''
  });

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.push('/login');
    }
  }, [firebaseUser, loading, router]);

  // Initialize form data when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        restaurantName: user.restaurantName || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || ''
        },
        checkoutPassword: user.checkoutPassword || ''
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => {
        const parentValue = prev[parent as keyof typeof prev];
        if (typeof parentValue === 'object' && parentValue !== null && !Array.isArray(parentValue)) {
          return {
            ...prev,
            [parent]: {
              ...parentValue,
              [child]: value
            }
          };
        }
        return prev;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    if (!firebaseUser) return;

    setSaving(true);
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userDocRef, {
        name: formData.name,
        phone: formData.phone,
        restaurantName: formData.restaurantName,
        address: formData.address,
        checkoutPassword: formData.checkoutPassword,
        updatedAt: new Date()
      });

      toast.success('個人資料已更新');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('更新失敗，請重試');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original user data
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        restaurantName: user.restaurantName || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || ''
        },
        checkoutPassword: user.checkoutPassword || ''
      });
    }
    setIsEditing(false);
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

  if (!firebaseUser) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">帳戶資料</h1>
          <p className="text-gray-600">管理您的帳戶資訊</p>
        </div>
        <div className="flex items-center space-x-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>編輯</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCancel}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>取消</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? '儲存中...' : '儲存'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">個人資訊</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">姓名</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="請輸入姓名"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{user?.name || '未設定'}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">電郵</p>
                <p className="font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500">電郵地址無法修改</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">電話</p>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="請輸入電話號碼"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{user?.phone || '未設定'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Restaurant Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">餐廳資訊</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Building2 className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">餐廳名稱</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.restaurantName}
                    onChange={(e) => handleInputChange('restaurantName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="請輸入餐廳名稱"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{user?.restaurantName || '未設定'}</p>
                )}
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">地址</p>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.address.street}
                      onChange={(e) => handleInputChange('address.street', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="街道地址"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={formData.address.city}
                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="城市"
                      />
                      <input
                        type="text"
                        value={formData.address.state}
                        onChange={(e) => handleInputChange('address.state', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="州/省"
                      />
                    </div>
                    <input
                      type="text"
                      value={formData.address.zipCode}
                      onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="郵遞區號"
                    />
                  </div>
                ) : (
                  <p className="font-medium text-gray-900">
                    {user?.address?.street ? 
                      `${user.address.street}, ${user.address.city}, ${user.address.state} ${user.address.zipCode}` : 
                      '未設定'
                    }
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">安全設定</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Lock className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">結帳密碼</p>
                {isEditing ? (
                  <input
                    type="password"
                    value={formData.checkoutPassword}
                    onChange={(e) => handleInputChange('checkoutPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="請輸入結帳密碼"
                  />
                ) : (
                  <p className="font-medium text-gray-900">
                    {user?.checkoutPassword ? '••••••••' : '未設定'}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  設定後，每次結帳時都需要輸入此密碼進行驗證
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Membership Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">會員資格</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5"></div>
              <div>
                <p className="text-sm text-gray-600">狀態</p>
                <p className="font-medium text-green-600">有效</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5"></div>
              <div>
                <p className="text-sm text-gray-600">下次收費</p>
                <p className="font-medium text-gray-900">2025年1月15日</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 