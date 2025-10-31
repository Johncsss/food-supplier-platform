'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { Users, TrendingUp, ShoppingCart, Award, DollarSign } from 'lucide-react';

export default function SalesTeamDashboard() {
  const { user } = useAuth();

  // Format currency
  const formatCurrency = (amount: number) => {
    return `HKD$ ${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">歡迎回來！</h1>
        <p className="mt-1 text-sm text-gray-500">
          {user?.name || '銷售團隊'} - 這是您的儀表板
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">團隊成員</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
              <p className="mt-1 text-sm text-gray-500">活躍成員</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">本月訂單</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
              <p className="mt-1 text-sm text-green-600">+0% 較上月</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <ShoppingCart className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">本月業績</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{formatCurrency(0)}</p>
              <p className="mt-1 text-sm text-green-600">+0% 較上月</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">總業績</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{formatCurrency(0)}</p>
              <p className="mt-1 text-sm text-gray-500">累計銷售</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center space-x-4">
          <div className="p-4 bg-white/20 rounded-lg">
            <Award className="w-12 h-12" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">歡迎來到銷售團隊管理面板</h2>
            <p className="text-blue-100">
              在這裡您可以管理團隊成員、追蹤訂單、查看業績統計等。
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <Users className="w-6 h-6 text-blue-600 mb-2" />
            <h4 className="font-medium text-gray-900">管理成員</h4>
            <p className="text-sm text-gray-500 mt-1">新增或編輯團隊成員</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <ShoppingCart className="w-6 h-6 text-green-600 mb-2" />
            <h4 className="font-medium text-gray-900">查看訂單</h4>
            <p className="text-sm text-gray-500 mt-1">追蹤和管理訂單</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <TrendingUp className="w-6 h-6 text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-900">業績報告</h4>
            <p className="text-sm text-gray-500 mt-1">查看詳細業績數據</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">最近活動</h3>
        <div className="text-center py-8 text-gray-500">
          <p>目前沒有活動記錄</p>
        </div>
      </div>
    </div>
  );
}

