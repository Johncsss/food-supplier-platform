'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { HelpCircle, MessageCircle, Phone, Mail, Clock } from 'lucide-react';

export default function Support() {
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

  const supportTopics = [
    {
      title: '訂單問題',
      description: '訂單、配送或產品品質相關問題',
      icon: '📦',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: '帳戶與帳單',
      description: '會員資格、付款和帳戶設定',
      icon: '💳',
      color: 'bg-green-100 text-green-600'
    },
    {
      title: '技術支援',
      description: '網站問題、登入問題或應用程式錯誤',
      icon: '🔧',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      title: '產品資訊',
      description: '關於產品、庫存或價格的問題',
      icon: '📋',
      color: 'bg-orange-100 text-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">支援中心</h1>
        <p className="text-gray-600">獲得您的帳戶、訂單等相關協助</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">聯絡我們</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">電話支援</p>
                  <p className="font-medium text-gray-900">1-800-FOOD-SUP</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">電郵支援</p>
                  <p className="font-medium text-gray-900">support@foodsupplier.com</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">支援時間</p>
                  <p className="font-medium text-gray-900">24/7 全天候服務</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button className="w-full btn-primary">
                <MessageCircle className="w-4 h-4 mr-2" />
                開始即時聊天
              </button>
            </div>
          </div>
        </div>

        {/* Help Topics */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">我們如何協助您？</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supportTopics.map((topic, index) => (
                <div key={index} className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors cursor-pointer">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${topic.color}`}>
                      <span className="text-lg">{topic.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">{topic.title}</h3>
                      <p className="text-sm text-gray-600">{topic.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">常見問題</h2>
        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="font-medium text-gray-900 mb-2">如何下訂單？</h3>
            <p className="text-gray-600">瀏覽我們的產品目錄，將商品加入購物車，然後進行結帳。您可以透過我們的平台24/7下訂單。</p>
          </div>
          <div className="border-b border-gray-200 pb-4">
            <h3 className="font-medium text-gray-900 mb-2">配送時間是多久？</h3>
            <p className="text-gray-600">標準配送需要24-48小時。快速配送需額外費用，12小時內送達。</p>
          </div>
          <div className="border-b border-gray-200 pb-4">
            <h3 className="font-medium text-gray-900 mb-2">我可以取消會員資格嗎？</h3>
            <p className="text-gray-600">是的，您可以隨時取消會員資格。聯絡我們的支援團隊處理您的取消申請。</p>
          </div>
          <div className="pb-4">
            <h3 className="font-medium text-gray-900 mb-2">您們接受哪些付款方式？</h3>
            <p className="text-gray-600">我們接受所有主要信用卡、金融卡和銀行轉帳。所有付款都經過安全處理。</p>
          </div>
        </div>
      </div>
    </div>
  );
} 