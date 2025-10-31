'use client';

import React, { useState } from 'react';
import { 
  DevicePhoneMobileIcon, 
  NewspaperIcon, 
  CalendarIcon, 
  PaintBrushIcon, 
  CameraIcon, 
  UsersIcon,
  ChartBarIcon,
  PaintBrushIcon as BrushIcon,
  ChartBarSquareIcon,
  ArrowTrendingUpIcon,
  MegaphoneIcon,
  UserGroupIcon,
  StarIcon,
  BanknotesIcon,
  PhoneIcon,
  CalendarDaysIcon,
  StarIcon as StarOutlineIcon
} from '@heroicons/react/24/outline';

export default function PromotionPage() {
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const promotionServices = [
    {
      id: 1,
      title: '數位行銷',
      description: '全方位的數位行銷解決方案',
      icon: DevicePhoneMobileIcon,
      color: 'bg-emerald-500',
      items: ['社群媒體管理', 'Google廣告', 'Facebook廣告', 'Instagram行銷', 'LINE官方帳號', '網站優化'],
      priceRange: 'HKD$ 3,000 - 15,000/月',
      popular: true,
      features: ['數據分析', 'A/B測試', 'ROI追蹤', '24/7監控']
    },
    {
      id: 2,
      title: '傳統廣告',
      description: '傳統媒體廣告投放服務',
      icon: NewspaperIcon,
      color: 'bg-blue-500',
      items: ['報紙廣告', '雜誌廣告', '廣播廣告', '電視廣告', '戶外看板', '傳單設計'],
      priceRange: 'HKD$ 5,000 - 50,000/次',
      popular: false,
      features: ['媒體規劃', '創意設計', '投放執行', '效果評估']
    },
    {
      id: 3,
      title: '活動策劃',
      description: '專業活動策劃與執行',
      icon: CalendarIcon,
      color: 'bg-amber-500',
      items: ['開幕活動', '節慶活動', '促銷活動', '品嚐會', '記者會', '展覽活動'],
      priceRange: 'HKD$ 10,000 - 100,000/場',
      popular: true,
      features: ['全程策劃', '現場執行', '媒體邀請', '效果追蹤']
    },
    {
      id: 4,
      title: '品牌設計',
      description: '完整的品牌形象設計',
      icon: PaintBrushIcon,
      color: 'bg-purple-500',
      items: ['Logo設計', '名片設計', '菜單設計', '包裝設計', '店面設計', '制服設計'],
      priceRange: 'HKD$ 2,000 - 20,000/項',
      popular: true,
      features: ['品牌策略', '視覺設計', '應用規範', '品牌手冊']
    },
    {
      id: 5,
      title: '內容創作',
      description: '專業內容創作與製作',
      icon: CameraIcon,
      color: 'bg-red-500',
      items: ['美食攝影', '影片製作', '文案撰寫', '產品介紹', '故事行銷', '內容企劃'],
      priceRange: 'HKD$ 1,500 - 8,000/項',
      popular: false,
      features: ['專業攝影', '後製剪輯', '文案創作', '多平台發布']
    },
    {
      id: 6,
      title: '公關服務',
      description: '專業公關與媒體關係',
      icon: UsersIcon,
      color: 'bg-cyan-500',
      items: ['媒體關係', '新聞發布', '危機處理', '口碑管理', 'KOL合作', '網紅行銷'],
      priceRange: 'HKD$ 8,000 - 30,000/月',
      popular: false,
      features: ['媒體監測', '危機預警', 'KOL配對', '效果報告']
    }
  ];

  const services = [
    {
      title: '策略規劃',
      description: '根據餐廳特色制定專屬行銷策略',
      icon: ChartBarIcon,
      features: ['市場分析', '競爭分析', '目標設定', '策略制定']
    },
    {
      title: '創意設計',
      description: '專業設計團隊提供創意視覺設計',
      icon: BrushIcon,
      features: ['視覺設計', '創意企劃', '品牌識別', '多媒體製作']
    },
    {
      title: '數據分析',
      description: '詳細數據分析，優化行銷效果',
      icon: ChartBarSquareIcon,
      features: ['數據收集', '效果分析', '優化建議', '報告製作']
    },
    {
      title: '效果追蹤',
      description: '持續追蹤行銷效果，調整策略',
      icon: ArrowTrendingUpIcon,
      features: ['效果監測', '策略調整', '績效報告', '持續優化']
    }
  ];

  const benefits = [
    {
      title: '提升知名度',
      description: '有效提升餐廳在市場的知名度',
      icon: MegaphoneIcon,
      percentage: '85%'
    },
    {
      title: '增加客流量',
      description: '吸引更多顧客到店消費',
      icon: UserGroupIcon,
      percentage: '120%'
    },
    {
      title: '建立品牌',
      description: '建立獨特的餐廳品牌形象',
      icon: StarIcon,
      percentage: '95%'
    },
    {
      title: '提高營收',
      description: '透過有效行銷提高餐廳營收',
      icon: BanknotesIcon,
      percentage: '150%'
    }
  ];

  const testimonials = [
    {
      id: 1,
      name: '陳老闆',
      restaurant: '日式料理店',
      rating: 5,
      comment: '數位行銷效果很好，客流量明顯增加，ROI超出預期！',
      service: '數位行銷'
    },
    {
      id: 2,
      name: '林經理',
      restaurant: '義式餐廳',
      rating: 5,
      comment: '品牌設計很專業，整體形象提升很多，客人反應很好。',
      service: '品牌設計'
    },
    {
      id: 3,
      name: '黃店長',
      restaurant: '咖啡廳',
      rating: 5,
      comment: '活動策劃很成功，開幕活動吸引了很多媒體關注。',
      service: '活動策劃'
    }
  ];

  const handleServicePress = (service: any) => {
    setSelectedService(selectedService === service.title ? null : service.title);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                餐廳宣傳服務
              </h1>
              <p className="text-xl text-emerald-100 mb-8 leading-relaxed">
                專業行銷團隊為您的餐廳提供全方位宣傳解決方案
              </p>
              <div className="grid grid-cols-3 gap-8 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-200">200+</div>
                  <div className="text-emerald-100">成功案例</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-200">95%</div>
                  <div className="text-emerald-100">客戶滿意度</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-200">3年</div>
                  <div className="text-emerald-100">平均合作</div>
                </div>
              </div>
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
                <MegaphoneIcon className="w-40 h-40 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Promotion Services Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              宣傳服務
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              點擊查看詳細資訊，我們提供多種宣傳服務滿足不同需求
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {promotionServices.map((service) => (
              <div 
                key={service.id} 
                className={`bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all cursor-pointer ${
                  selectedService === service.title ? 'ring-2 ring-emerald-500' : ''
                }`}
                onClick={() => handleServicePress(service)}
              >
                <div className="flex items-center mb-6">
                  <div className={`w-16 h-16 ${service.color} rounded-xl flex items-center justify-center mr-4`}>
                    <service.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {service.title}
                      </h3>
                      {service.popular && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full">
                          熱門
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      {service.description}
                    </p>
                    <p className="text-emerald-600 font-semibold text-sm">
                      {service.priceRange}
                    </p>
                  </div>
                </div>
                
                {selectedService === service.title && (
                  <div className="border-t pt-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {service.items.map((item, index) => (
                        <span key={index} className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">服務特色：</h4>
                      <div className="flex flex-wrap gap-2">
                        {service.features.map((feature, index) => (
                          <span key={index} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button className="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors">
                      查看詳細方案
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              服務特色
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              我們提供全方位的宣傳服務，從策略到執行，確保最佳效果
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <service.icon className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {service.description}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {service.features.map((feature, featureIndex) => (
                    <span key={featureIndex} className="bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              宣傳效益
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              透過專業的宣傳服務，為您的餐廳帶來顯著的效益提升
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <benefit.icon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {benefit.description}
                </p>
                <div className="text-2xl font-bold text-emerald-600">
                  {benefit.percentage} 提升
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              客戶評價
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              聽聽我們的客戶怎麼說
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-gray-50 rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {testimonial.restaurant}
                    </p>
                    <p className="text-emerald-600 text-sm font-medium">
                      {testimonial.service}
                    </p>
                  </div>
                  <div className="flex">
                    {[...Array(testimonial.rating)].map((_, index) => (
                      <StarIcon key={index} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 italic leading-relaxed">
                  "{testimonial.comment}"
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
            專業行銷團隊為您提供免費諮詢與方案規劃
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-emerald-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center">
              <PhoneIcon className="w-5 h-5 mr-2" />
              聯絡我們
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-emerald-600 transition-colors flex items-center justify-center">
              <CalendarDaysIcon className="w-5 h-5 mr-2" />
              預約會議
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

