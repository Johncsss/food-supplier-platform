'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User, Building2, MapPin, Phone, Mail, Edit, Save, X, Lock, Shield } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, firebaseUser, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [isChangingCheckoutPassword, setIsChangingCheckoutPassword] = useState(false);
  const [checkoutPasswordData, setCheckoutPasswordData] = useState({
    oldCheckoutPassword: '',
    newCheckoutPassword: '',
    confirmCheckoutPassword: ''
  });
  const [changingCheckoutPassword, setChangingCheckoutPassword] = useState(false);
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
        // checkoutPassword is now managed separately via handleChangeCheckoutPassword
        updatedAt: new Date()
      });

      await refreshUser();
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
    setIsChangingPassword(false);
    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setIsChangingCheckoutPassword(false);
    setCheckoutPasswordData({ oldCheckoutPassword: '', newCheckoutPassword: '', confirmCheckoutPassword: '' });
  };

  const handleChangePassword = async () => {
    if (!firebaseUser || !firebaseUser.email) {
      toast.error('無法更改密碼，請先登入');
      return;
    }

    // Validation
    if (!passwordData.oldPassword) {
      toast.error('請輸入舊密碼');
      return;
    }

    if (!passwordData.newPassword) {
      toast.error('請輸入新密碼');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('新密碼長度至少需要 6 個字元');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('新密碼與確認密碼不一致');
      return;
    }

    if (passwordData.oldPassword === passwordData.newPassword) {
      toast.error('新密碼不能與舊密碼相同');
      return;
    }

    setChangingPassword(true);
    try {
      // Re-authenticate user with old password
      const credential = EmailAuthProvider.credential(
        firebaseUser.email,
        passwordData.oldPassword
      );
      await reauthenticateWithCredential(firebaseUser, credential);

      // Update password
      await updatePassword(firebaseUser, passwordData.newPassword);

      toast.success('密碼已成功更改');
      setIsChangingPassword(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('舊密碼不正確');
      } else if (error.code === 'auth/weak-password') {
        toast.error('新密碼強度不足');
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error('為了安全，請重新登入後再更改密碼');
      } else {
        toast.error('更改密碼失敗：' + (error.message || '未知錯誤'));
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleChangeCheckoutPassword = async () => {
    if (!firebaseUser) {
      toast.error('無法更改結帳密碼，請先登入');
      return;
    }

    // Validation
    if (!checkoutPasswordData.oldCheckoutPassword) {
      toast.error('請輸入舊結帳密碼');
      return;
    }

    // Verify old checkout password
    if (user?.checkoutPassword) {
      if (checkoutPasswordData.oldCheckoutPassword !== user.checkoutPassword) {
        toast.error('舊結帳密碼不正確');
        return;
      }
    } else {
      // If no checkout password is set, old password should be empty
      if (checkoutPasswordData.oldCheckoutPassword !== '') {
        toast.error('您尚未設定結帳密碼，舊密碼應為空');
        return;
      }
    }

    if (!checkoutPasswordData.newCheckoutPassword) {
      toast.error('請輸入新結帳密碼');
      return;
    }

    if (checkoutPasswordData.newCheckoutPassword.length < 4) {
      toast.error('結帳密碼長度至少需要 4 個字元');
      return;
    }

    if (checkoutPasswordData.newCheckoutPassword !== checkoutPasswordData.confirmCheckoutPassword) {
      toast.error('新結帳密碼與確認密碼不一致');
      return;
    }

    if (checkoutPasswordData.oldCheckoutPassword === checkoutPasswordData.newCheckoutPassword) {
      toast.error('新結帳密碼不能與舊密碼相同');
      return;
    }

    setChangingCheckoutPassword(true);
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userDocRef, {
        checkoutPassword: checkoutPasswordData.newCheckoutPassword,
        updatedAt: new Date()
      });

      await refreshUser();
      toast.success('結帳密碼已成功更改');
      setIsChangingCheckoutPassword(false);
      setCheckoutPasswordData({ oldCheckoutPassword: '', newCheckoutPassword: '', confirmCheckoutPassword: '' });
    } catch (error: any) {
      console.error('Error changing checkout password:', error);
      toast.error('更改結帳密碼失敗：' + (error.message || '未知錯誤'));
    } finally {
      setChangingCheckoutPassword(false);
    }
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

  const membershipStatus = user?.membershipStatus ?? 'inactive';

  const resolveDate = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    if (typeof value === 'object' && typeof value?.toDate === 'function') {
      try {
        return value.toDate();
      } catch {
        return null;
      }
    }
    if (typeof value === 'object' && typeof value?._seconds === 'number') {
      return new Date(value._seconds * 1000);
    }
    return null;
  };

  const membershipExpiry = resolveDate(user?.membershipExpiry);

  const getMembershipMeta = () => {
    switch (membershipStatus) {
      case 'active':
        return {
          label: '有效',
          ringClass: 'border-green-200 bg-green-50 text-green-700',
          dotClass: 'bg-green-500',
          description: '會員資格有效，可享用平台提供的全部服務與優惠。',
        };
      case 'expired':
        return {
          label: '已到期',
          ringClass: 'border-red-200 bg-red-50 text-red-700',
          dotClass: 'bg-red-500',
          description: '會員資格已到期，如需續期請聯絡客服協助。',
        };
      case 'inactive':
      default:
        return {
          label: '未啟用',
          ringClass: 'border-yellow-200 bg-yellow-50 text-yellow-700',
          dotClass: 'bg-yellow-500',
          description: '會員資格尚未啟用，請完成相關申請或洽詢客服。',
        };
    }
  };

  const membershipMeta = getMembershipMeta();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">帳戶資料</h1>
              <p className="text-gray-600">管理您的帳戶資訊</p>
              {user?.restaurantName && (
                <p className="text-sm text-primary-600 mt-1">
                  餐廳名稱：{user.restaurantName}
                </p>
              )}
        </div>
        <div className="flex items-center space-x-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#0B8628' }}
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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">聯絡人資訊</h2>
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
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={formData.address.street}
                      onChange={(e) => handleInputChange('address.street', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="街道地址"
                    />
                  </div>
                ) : (
                  <p className="font-medium text-gray-900">
                    {user?.address?.street ? 
                      user.address.street : 
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
          <div className="space-y-6">
            {/* Change Password Section */}
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Lock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">登入密碼</p>
                    <p className="text-xs text-gray-500">更改您的登入密碼</p>
                  </div>
                </div>
                {!isChangingPassword && (
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    更改密碼
                  </button>
                )}
              </div>
              
              {isChangingPassword && (
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      舊密碼 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, oldPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="請輸入舊密碼"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      新密碼 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="請輸入新密碼（至少 6 個字元）"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      確認新密碼 <span className="text-red-500">*</span>
                    </label>
                  <input
                    type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="請再次輸入新密碼"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleChangePassword}
                      disabled={changingPassword}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                      {changingPassword ? '更改中...' : '確認更改'}
                    </button>
                    <button
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      disabled={changingPassword}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Checkout Password Section */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Lock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">結帳密碼</p>
                    <p className="text-xs text-gray-500">設定後，每次結帳時都需要輸入此密碼進行驗證</p>
                  </div>
                </div>
                {!isChangingCheckoutPassword && (
                  <button
                    onClick={() => setIsChangingCheckoutPassword(true)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    {user?.checkoutPassword ? '更改密碼' : '設定密碼'}
                  </button>
                )}
              </div>

              {!isChangingCheckoutPassword && (
                <div>
                  <p className="font-medium text-gray-900">
                    {user?.checkoutPassword ? '••••••••' : '未設定'}
                  </p>
                </div>
              )}

              {isChangingCheckoutPassword && (
                <div className="space-y-4 mt-4">
                  {user?.checkoutPassword && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        舊結帳密碼 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={checkoutPasswordData.oldCheckoutPassword}
                        onChange={(e) => setCheckoutPasswordData(prev => ({ ...prev, oldCheckoutPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="請輸入舊結帳密碼"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {user?.checkoutPassword ? '新結帳密碼' : '結帳密碼'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={checkoutPasswordData.newCheckoutPassword}
                      onChange={(e) => setCheckoutPasswordData(prev => ({ ...prev, newCheckoutPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="請輸入結帳密碼（至少 4 個字元）"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      確認結帳密碼 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={checkoutPasswordData.confirmCheckoutPassword}
                      onChange={(e) => setCheckoutPasswordData(prev => ({ ...prev, confirmCheckoutPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="請再次輸入結帳密碼"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleChangeCheckoutPassword}
                      disabled={changingCheckoutPassword}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                      {changingCheckoutPassword ? '更改中...' : '確認更改'}
                    </button>
                    <button
                      onClick={() => {
                        setIsChangingCheckoutPassword(false);
                        setCheckoutPasswordData({ oldCheckoutPassword: '', newCheckoutPassword: '', confirmCheckoutPassword: '' });
                      }}
                      disabled={changingCheckoutPassword}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                      取消
                    </button>
                  </div>
              </div>
              )}
            </div>
          </div>
        </div>

        {/* Membership Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">會員狀態</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${membershipMeta.ringClass}`}>
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${membershipMeta.ringClass}`}>
                    <span className={`inline-block w-2 h-2 rounded-full mr-1 ${membershipMeta.dotClass}`} />
                    {membershipMeta.label}
                  </span>
                  {membershipExpiry && (
                    <span className="text-xs text-gray-500">
                      到期日：{membershipExpiry.toLocaleDateString('zh-TW')}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  {membershipMeta.description}
                </p>
                {membershipStatus === 'inactive' && (
                <p className="mt-2 text-xs text-gray-500">
                  小提醒：若已完成相關申請，請聯絡客服協助開通會員資格。
                </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 