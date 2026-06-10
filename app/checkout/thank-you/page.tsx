'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { CheckCircle, Package, Calendar, Hash, Coins } from 'lucide-react';
import Link from 'next/link';

function ThankYouContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderInfo] = useState({
    orderId: searchParams?.get('orderId') || '',
    deliveryDate: searchParams?.get('deliveryDate') || '',
    pointsUsed: searchParams?.get('pointsUsed') || '',
    remainingPoints: searchParams?.get('remainingPoints') || '',
  });

  useEffect(() => {
    // Only redirect if completely missing order info (not even 'N/A')
    // 'N/A' is acceptable and we should still show the thank you page
    if (!orderInfo.orderId && !orderInfo.deliveryDate && !orderInfo.pointsUsed) {
      // If no order info at all, redirect to orders page after a delay
      const timer = setTimeout(() => {
        router.push('/dashboard/orders');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [orderInfo.orderId, orderInfo.deliveryDate, orderInfo.pointsUsed, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <section className="bg-[#0B8628] text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">訂單已成功建立！</h1>
          <p className="text-lg text-green-50">
            感謝您的訂購，我們已收到您的訂單，將盡快為您處理。
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">訂單詳情</h2>
            
            <div className="space-y-4">
              {orderInfo.orderId && (
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <Hash className="w-5 h-5 text-[#0B8628] mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">訂單編號</p>
                    <p className="text-lg font-semibold text-gray-900">{orderInfo.orderId}</p>
                  </div>
                </div>
              )}

              {orderInfo.deliveryDate && (
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-[#0B8628] mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">送貨日期</p>
                    <p className="text-lg font-semibold text-gray-900">{orderInfo.deliveryDate}</p>
                  </div>
                </div>
              )}

              {orderInfo.pointsUsed && (
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <Coins className="w-5 h-5 text-[#0B8628] mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">使用點數</p>
                    <p className="text-lg font-semibold text-gray-900">{orderInfo.pointsUsed} 點</p>
                  </div>
                </div>
              )}

              {orderInfo.remainingPoints && (
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <Package className="w-5 h-5 text-[#0B8628] mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">剩餘點數</p>
                    <p className="text-lg font-semibold text-gray-900">{orderInfo.remainingPoints} 點</p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 space-y-4">
              <p className="text-sm text-gray-600">
                您可以在「我的訂單」頁面查看訂單狀態和詳細資訊。
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/dashboard/orders"
                  className="flex-1 px-6 py-3 bg-[#0B8628] text-white rounded-lg hover:bg-[#0a6e23] transition-colors text-center font-medium"
                >
                  查看我的訂單
                </Link>
                <Link
                  href="/products"
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-center font-medium"
                >
                  繼續購物
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function CheckoutThankYouPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  );
}

