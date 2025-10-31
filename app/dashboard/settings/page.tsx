'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Settings, Bell, Shield, Globe, User } from 'lucide-react';

export default function SettingsPage() {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();

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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">設定</h1>
        <p className="text-gray-600">管理您的帳戶偏好設定</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">帳戶設定</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">個人資料</p>
                  <p className="text-sm text-gray-600">更新您的個人資料</p>
                </div>
              </div>
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                編輯
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">安全性</p>
                  <p className="text-sm text-gray-600">更改密碼和安全設定</p>
                </div>
              </div>
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                管理
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">語言</p>
                  <p className="text-sm text-gray-600">繁體中文</p>
                </div>
              </div>
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                更改
              </button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">通知</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">訂單更新</p>
                <p className="text-sm text-gray-600">接收訂單狀態變更通知</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">促銷電郵</p>
                <p className="text-sm text-gray-600">接收特別優惠和更新</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">簡訊通知</p>
                <p className="text-sm text-gray-600">接收緊急更新的簡訊</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">偏好設定</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">預設配送地址</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option>123 示範街, 示範市, DC 12345</option>
                <option>新增地址</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">偏好配送時間</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option>上午 (8:00 - 12:00)</option>
                <option>下午 (12:00 - 16:00)</option>
                <option>晚上 (16:00 - 20:00)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">貨幣</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option>USD ($)</option>
                <option>EUR (€)</option>
                <option>GBP (£)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">資料與隱私</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">下載我的資料</p>
                <p className="text-sm text-gray-600">取得您的個人資料副本</p>
              </div>
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                下載
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">刪除帳戶</p>
                <p className="text-sm text-gray-600">永久刪除您的帳戶</p>
              </div>
              <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                刪除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 