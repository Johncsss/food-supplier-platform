'use client';

import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

export default function PartnerApplyThankYouPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <section className="bg-[#0B8628] text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">感謝您的申請</h1>
          <p className="text-lg text-green-50">
            我們已收到您的合作申請，專人將會盡快與您聯繫，協助完成帳戶設定及後續安排。
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <p className="text-gray-700">
            Thank you for submitting your application. Our team will contact you shortly to follow up on the details.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}


