'use client';

import React, { useState } from 'react';
import { 
  BuildingStorefrontIcon, 
  HomeIcon, 
  ArchiveBoxIcon, 
  BeakerIcon, 
  SparklesIcon, 
  SunIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  CogIcon,
  PhoneIcon,
  CalendarIcon,
  StarIcon
} from '@heroicons/react/24/outline';

export default function RestaurantFurniturePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const furnitureCategories = [
    {
      id: 1,
      title: '餐桌椅組合',
      description: '各式餐桌椅組合，適合不同餐廳風格',
      icon: BuildingStorefrontIcon,
      color: 'bg-emerald-500',
      items: ['圓桌', '方桌', '吧台椅', '餐椅', '長桌'],
      priceRange: 'HKD$ 2,000 - 15,000',
      popular: true
    },
    {
      id: 2,
      title: '沙發座椅',
      description: '舒適的沙發座椅，提升用餐體驗',
      icon: HomeIcon,
      color: 'bg-blue-500',
      items: ['單人沙發', '雙人沙發', 'L型沙發', '貴妃椅', '腳凳'],
      priceRange: 'HKD$ 3,000 - 25,000',
      popular: true
    },
    {
      id: 3,
      title: '收納櫃',
      description: '實用的收納櫃，保持餐廳整潔',
      icon: ArchiveBoxIcon,
      color: 'bg-amber-500',
      items: ['餐具櫃', '酒櫃', '展示櫃', '文件櫃', '雜物櫃'],
      priceRange: 'HKD$ 1,500 - 12,000',
      popular: false
    },
    {
      id: 4,
      title: '吧台設備',
      description: '專業吧台設備，打造完美酒吧區',
      icon: BeakerIcon,
      color: 'bg-purple-500',
      items: ['吧台桌', '高腳椅', '酒架', '冰櫃', '調酒台'],
      priceRange: 'HKD$ 5,000 - 30,000',
      popular: true
    },
    {
      id: 5,
      title: '裝飾傢具',
      description: '精美裝飾傢具，營造餐廳氛圍',
      icon: SparklesIcon,
      color: 'bg-red-500',
      items: ['屏風', '花架', '裝飾櫃', '鏡子', '藝術品'],
      priceRange: 'HKD$ 800 - 8,000',
      popular: false
    },
    {
      id: 6,
      title: '戶外傢具',
      description: '耐用戶外傢具，適合露天用餐區',
      icon: SunIcon,
      color: 'bg-cyan-500',
      items: ['戶外桌椅', '遮陽傘', '戶外沙發', '燒烤桌', '花園椅'],
      priceRange: 'HKD$ 2,500 - 20,000',
      popular: false
    }
  ];

  const services = [
    {
      title: '客製化設計',
      description: '根據餐廳風格提供客製化傢具設計',
      icon: WrenchScrewdriverIcon,
      features: ['免費設計諮詢', '3D效果圖', '材質選擇', '尺寸客製']
    },
    {
      title: '專業安裝',
      description: '專業團隊提供傢具安裝服務',
      icon: CogIcon,
      features: ['免費安裝', '現場組裝', '品質檢查', '使用指導']
    },
    {
      title: '品質保證',
      description: '使用優質材料，提供品質保證',
      icon: ShieldCheckIcon,
      features: ['原廠保固', '品質認證', '售後服務', '維修保養']
    },
    {
      title: '售後服務',
      description: '完善的售後服務與維護保養',
      icon: CogIcon,
      features: ['定期保養', '故障維修', '零件更換', '技術支援']
    }
  ];

  const testimonials = [
    {
      id: 1,
      name: '張老闆',
      restaurant: '港式茶餐廳',
      rating: 5,
      comment: '傢具品質很好，安裝服務也很專業，客人反應都很滿意！'
    },
    {
      id: 2,
      name: '李經理',
      restaurant: '西式餐廳',
      rating: 5,
      comment: '客製化設計很符合我們的需求，整體效果超出預期。'
    },
    {
      id: 3,
      name: '王店長',
      restaurant: '咖啡廳',
      rating: 5,
      comment: '售後服務很到位，有任何問題都能快速解決。'
    }
  ];

  const handleCategoryPress = (category: any) => {
    setSelectedCategory(selectedCategory === category.title ? null : category.title);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                專業餐廳傢具
              </h1>
              <p className="text-xl text-emerald-100 mb-8 leading-relaxed">
                提供各式餐廳傢具，打造舒適優雅的用餐環境
              </p>
              <div className="grid grid-cols-3 gap-8 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-200">500+</div>
                  <div className="text-emerald-100">傢具款式</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-200">1000+</div>
                  <div className="text-emerald-100">滿意客戶</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-200">5年</div>
                  <div className="text-emerald-100">品質保固</div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-white text-emerald-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  免費諮詢
                </button>
                <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-emerald-600 transition-colors">
                  預約參觀
                </button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-80 h-80 bg-emerald-100 rounded-full flex items-center justify-center">
                <HomeIcon className="w-40 h-40 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Furniture Categories Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              傢具類別
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              點擊查看詳細資訊，我們提供多種傢具類別滿足不同需求
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {furnitureCategories.map((category) => (
              <div 
                key={category.id} 
                className={`bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all cursor-pointer ${
                  selectedCategory === category.title ? 'ring-2 ring-emerald-500' : ''
                }`}
                onClick={() => handleCategoryPress(category)}
              >
                <div className="flex items-center mb-6">
                  <div className={`w-16 h-16 ${category.color} rounded-xl flex items-center justify-center mr-4`}>
                    <category.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {category.title}
                      </h3>
                      {category.popular && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full">
                          熱門
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      {category.description}
                    </p>
                    <p className="text-emerald-600 font-semibold text-sm">
                      {category.priceRange}
                    </p>
                  </div>
                </div>
                
                {selectedCategory === category.title && (
                  <div className="border-t pt-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {category.items.map((item, index) => (
                        <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                    <button className="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors">
                      查看詳細資訊
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
              我們提供全方位的傢具服務，從設計到安裝，確保客戶滿意
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-8">
                <div className="flex items-start mb-6">
                  <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center mr-6">
                    <service.icon className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {service.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {service.features.map((feature, featureIndex) => (
                        <span key={featureIndex} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm flex items-center">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
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
              <div key={testimonial.id} className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {testimonial.restaurant}
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
            專業團隊為您提供傢具諮詢與報價服務
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-emerald-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center">
              <PhoneIcon className="w-5 h-5 mr-2" />
              聯絡我們
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-emerald-600 transition-colors flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              預約參觀
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

