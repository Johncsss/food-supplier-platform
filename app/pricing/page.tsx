'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { Check, Star, Crown, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const membershipPlans = [
  {
    id: 'basic',
    name: '基本方案',
    price: 999,
    originalPrice: 1299,
    description: '適合小型餐廳',
    features: [
      '存取所有產品',
      '標準配送 (48-72小時)',
      '電子郵件支援',
      '訂單追蹤',
      '基本分析',
      '每月最多50筆訂單',
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
    popular: false,
  },
  {
    id: 'pro',
    name: '專業方案',
    price: 1999,
    originalPrice: 2499,
    description: '適合成長中的餐廳',
    features: [
      '包含基本方案所有功能',
      '優先配送 (24-48小時)',
      '電話和電子郵件支援',
      '進階分析',
      '無限制訂單',
      '大量訂購折扣',
      '自訂配送排程',
      '專屬客戶經理',
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    popular: true,
  },
  {
    id: 'premium',
    name: '高級方案',
    price: 3999,
    originalPrice: 4999,
    description: '適合大型餐廳連鎖',
    features: [
      '包含專業方案所有功能',
      '當日配送服務',
      '24/7優先支援',
      '客製化產品採購',
      '進階庫存管理',
      '多據點支援',
      '白標訂購系統',
      'API存取',
      '客製化整合',
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
    popular: false,
  },
];

export default function Pricing() {
  const { user, firebaseUser } = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  // Check for URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('canceled') === 'true') {
      toast.error('訂閱已取消');
    }
  }, []);

  const handleSubscribe = async (planId: string, stripePriceId: string) => {
    if (!firebaseUser) {
      toast.error('請先登入以訂閱');
      return;
    }

    // Check if price ID is configured
    if (!stripePriceId || stripePriceId.includes('_here')) {
      // Enable demo mode for testing
      setDemoMode(true);
      toast.success('演示模式：此方案功能已啟用');
      return;
    }

    setIsLoading(planId);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: stripePriceId,
          customerId: user?.stripeCustomerId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('處理訂閱時發生錯誤，請稍後再試');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            選擇您的會員方案
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            加入數千個信任食品供應商專業版進行食品供應需求的餐廳。
            所有方案均包含年度計費，無隱藏費用。
          </p>
          {demoMode && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
              <p className="text-yellow-800 font-medium">
                🎯 演示模式已啟用 - 您可以測試所有功能
              </p>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {membershipPlans.map((plan) => (
            <div
              key={plan.id}
              className={`card p-8 relative ${
                plan.popular ? 'ring-2 ring-primary-500 shadow-xl' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    最受歡迎
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  {plan.id === 'basic' && <Zap className="w-8 h-8 text-gray-600" />}
                  {plan.id === 'pro' && <Crown className="w-8 h-8 text-primary-600" />}
                  {plan.id === 'premium' && <Star className="w-8 h-8 text-secondary-500" />}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                
                <div className="mb-6">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-500 ml-2">/年</span>
                  </div>
                  {plan.originalPrice > plan.price && (
                    <p className="text-gray-500 line-through text-sm">
                      ${plan.originalPrice}/年
                    </p>
                  )}
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id, plan.stripePriceId!)}
                disabled={isLoading === plan.id}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                  plan.popular
                    ? 'bg-primary-600 hover:bg-primary-700 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
              >
                {isLoading === plan.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    處理中...
                  </>
                ) : demoMode ? (
                  '開始免費試用'
                ) : (
                  '選擇方案'
                )}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            常見問題
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                我可以取消我的會員資格嗎？
              </h3>
              <p className="text-gray-600">
                是的，您可以隨時取消您的會員資格。您的存取權限將持續到當前計費期結束。
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                有免費試用嗎？
              </h3>
              <p className="text-gray-600">
                我們為所有新會員提供14天免費試用。開始試用無需信用卡。
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                您接受哪些付款方式？
              </h3>
              <p className="text-gray-600">
                我們接受所有主要信用卡、金融卡和銀行轉帳。所有付款都通過Stripe安全處理。
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                我可以升級或降級我的方案嗎？
              </h3>
              <p className="text-gray-600">
                是的，您可以隨時升級或降級您的方案。變更將根據您當前的計費週期按比例計算。
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            準備開始了嗎？
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            加入數千個信任食品供應商專業版的餐廳
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleSubscribe('pro', membershipPlans[1].stripePriceId!)}
              className="btn-primary px-8 py-4 text-lg"
            >
              {demoMode ? '開始演示' : '開始免費試用'}
            </button>
            <a href="/contact" className="btn-outline px-8 py-4 text-lg">
              聯繫銷售
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
} 