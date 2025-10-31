'use client';

import React from 'react';
import { 
  WrenchScrewdriverIcon, 
  BoltIcon, 
  FireIcon, 
  CloudIcon, 
  ShieldCheckIcon, 
  WrenchScrewdriverIcon as HammerIcon,
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

export default function RestaurantConstructionPage() {
  const services = [
    {
      id: 1,
      title: '餐廳設計規劃',
      description: '專業的餐廳空間設計，從概念到實作全程服務',
      icon: WrenchScrewdriverIcon,
      color: 'bg-emerald-500'
    },
    {
      id: 2,
      title: '廚房設備安裝',
      description: '專業廚房設備安裝與配置，確保高效運作',
      icon: BoltIcon,
      color: 'bg-blue-500'
    },
    {
      id: 3,
      title: '水電工程',
      description: '餐廳專用水電系統設計與安裝',
      icon: FireIcon,
      color: 'bg-amber-500'
    },
    {
      id: 4,
      title: '空調通風系統',
      description: '專業空調與通風系統安裝，確保舒適環境',
      icon: CloudIcon,
      color: 'bg-purple-500'
    },
    {
      id: 5,
      title: '消防系統',
      description: '符合法規的消防系統設計與安裝',
      icon: ShieldCheckIcon,
      color: 'bg-red-500'
    },
    {
      id: 6,
      title: '裝修工程',
      description: '室內裝修、地板、牆面等整體裝修服務',
      icon: HammerIcon,
      color: 'bg-cyan-500'
    }
  ];

  const features = [
    {
      title: '專業團隊',
      description: '擁有豐富餐廳工程經驗的專業團隊',
      icon: UsersIcon
    },
    {
      title: '品質保證',
      description: '使用優質材料，提供品質保證',
      icon: CheckCircleIcon
    },
    {
      title: '快速施工',
      description: '高效施工流程，縮短營業中斷時間',
      icon: ClockIcon
    },
    {
      title: '售後服務',
      description: '完善的售後服務與維護保養',
      icon: CogIcon
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                專業餐廳工程服務
              </h1>
              <p className="text-xl text-emerald-100 mb-8 leading-relaxed">
                從設計規劃到施工完成，提供全方位的餐廳工程解決方案
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-white text-emerald-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  免費諮詢
                </button>
                <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-emerald-600 transition-colors">
                  查看案例
                </button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-80 h-80 bg-emerald-100 rounded-full flex items-center justify-center">
                <WrenchScrewdriverIcon className="w-40 h-40 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              服務項目
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              我們提供完整的餐廳工程服務，從設計到施工，確保每個環節都達到專業標準
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                <div className={`w-16 h-16 ${service.color} rounded-xl flex items-center justify-center mb-6`}>
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {service.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              服務特色
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              我們致力於為客戶提供最優質的工程服務，確保每個項目都能完美完成
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              施工流程
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              我們採用標準化的施工流程，確保每個項目都能按時、按質完成
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '01', title: '需求分析', description: '深入了解客戶需求，制定施工方案' },
              { step: '02', title: '設計規劃', description: '專業設計團隊進行空間規劃設計' },
              { step: '03', title: '施工執行', description: '專業施工團隊進行工程施作' },
              { step: '04', title: '驗收交付', description: '品質檢查驗收，確保工程品質' }
            ].map((process, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                  {process.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {process.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {process.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            立即諮詢
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-3xl mx-auto">
            專業團隊為您提供免費諮詢與報價服務，讓我們為您的餐廳工程提供最佳解決方案
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-emerald-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center">
              <PhoneIcon className="w-5 h-5 mr-2" />
              聯絡我們
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-emerald-600 transition-colors">
              免費報價
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

