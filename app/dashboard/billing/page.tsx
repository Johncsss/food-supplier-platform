'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CreditCard, Calendar, DollarSign, CheckCircle } from 'lucide-react';

export default function Billing() {
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

  const mockBillingHistory = [
    {
      id: 'INV-001',
      date: '2024-01-15',
      amount: 299.00,
      status: 'paid',
      description: '專業方案 - 月費訂閱'
    },
    {
      id: 'INV-002',
      date: '2023-12-15',
      amount: 299.00,
      status: 'paid',
      description: '專業方案 - 月費訂閱'
    },
    {
      id: 'INV-003',
      date: '2023-11-15',
      amount: 299.00,
      status: 'paid',
      description: '專業方案 - 月費訂閱'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">帳單與付款</h1>
        <p className="text-gray-600">管理您的訂閱和付款歷史</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">目前方案</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">方案:</span>
                <span className="font-medium text-gray-900">專業方案</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">狀態:</span>
                <span className="text-green-600 font-medium">有效</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">下次收費:</span>
                <span className="font-medium text-gray-900">2025年1月15日</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">金額:</span>
                <span className="font-medium text-gray-900">$299.00/月</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button className="w-full btn-outline">
                <CreditCard className="w-4 h-4 mr-2" />
                更新付款方式
              </button>
            </div>
          </div>
        </div>

        {/* Billing History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">帳單歷史</h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {mockBillingHistory.map((invoice) => (
                <div key={invoice.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-full bg-green-100">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{invoice.id}</p>
                        <p className="text-sm text-gray-600">{invoice.description}</p>
                        <p className="text-sm text-gray-500">{invoice.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${invoice.amount.toFixed(2)}</p>
                      <p className="text-sm text-green-600 capitalize">{invoice.status === 'paid' ? '已付款' : invoice.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 