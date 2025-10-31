'use client';

import React from 'react';
import { 
  FireIcon, 
  CloudIcon, 
  BeakerIcon, 
  ScissorsIcon, 
  CakeIcon, 
  TruckIcon,
  WrenchScrewdriverIcon,
  CogIcon,
  PhoneIcon,
  CubeIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  HandRaisedIcon
} from '@heroicons/react/24/outline';

export default function KitchenEquipmentPage() {
  const equipmentCategories = [
    {
      id: 1,
      title: '烹飪設備',
      description: '專業烹飪設備，提升廚房效率',
      icon: FireIcon,
      color: 'bg-red-500',
      items: ['爐具', '烤箱', '蒸籠', '炸鍋', '烤架', '平底鍋']
    },
    {
      id: 2,
      title: '冷藏設備',
      description: '高效冷藏設備，保持食材新鮮',
      icon: CloudIcon,
      color: 'bg-blue-500',
      items: ['冰箱', '冷凍櫃', '冷藏櫃', '製冰機', '冷卻器', '保鮮櫃']
    },
    {
      id: 3,
      title: '清潔設備',
      description: '專業清潔設備，確保衛生標準',
      icon: BeakerIcon,
      color: 'bg-emerald-500',
      items: ['洗碗機', '消毒櫃', '清潔機', '烘乾機', '洗滌槽', '清潔劑']
    },
    {
      id: 4,
      title: '切配設備',
      description: '高效切配設備，提升備料效率',
      icon: ScissorsIcon,
      color: 'bg-amber-500',
      items: ['切菜機', '攪拌機', '榨汁機', '切片機', '絞肉機', '攪拌器']
    },
    {
      id: 5,
      title: '烘焙設備',
      description: '專業烘焙設備，製作精美糕點',
      icon: CakeIcon,
      color: 'bg-purple-500',
      items: ['烤箱', '發酵箱', '攪拌機', '壓麵機', '模具', '烘焙工具']
    },
    {
      id: 6,
      title: '通風設備',
      description: '高效通風設備，保持廚房空氣清新',
      icon: TruckIcon,
      color: 'bg-cyan-500',
      items: ['抽油煙機', '排風扇', '通風管', '空氣淨化器', '風扇', '通風系統']
    }
  ];

  const services = [
    {
      title: '專業安裝',
      description: '專業技術團隊提供設備安裝服務',
      icon: WrenchScrewdriverIcon
    },
    {
      title: '定期維護',
      description: '定期維護保養，確保設備正常運作',
      icon: CogIcon
    },
    {
      title: '技術支援',
      description: '24小時技術支援與故障排除',
      icon: PhoneIcon
    },
    {
      title: '零件供應',
      description: '原廠零件供應，確保設備品質',
      icon: CubeIcon
    }
  ];

  const features = [
    {
      title: '節能環保',
      description: '採用節能技術，降低營運成本',
      icon: SparklesIcon
    },
    {
      title: '安全可靠',
      description: '符合安全標準，保障使用安全',
      icon: ShieldCheckIcon
    },
    {
      title: '高效運作',
      description: '提升廚房工作效率',
      icon: ChartBarIcon
    },
    {
      title: '易於操作',
      description: '人性化設計，操作簡單方便',
      icon: HandRaisedIcon
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
                專業廚房設備
              </h1>
              <p className="text-xl text-emerald-100 mb-8 leading-relaxed">
                提供全套廚房設備解決方案，提升餐廳營運效率
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-white text-emerald-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  免費諮詢
                </button>
                <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-emerald-600 transition-colors">
                  查看設備
                </button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-80 h-80 bg-emerald-100 rounded-full flex items-center justify-center">
                <FireIcon className="w-40 h-40 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Equipment Categories Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              設備類別
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              我們提供多種廚房設備類別，滿足不同餐廳的需求
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {equipmentCategories.map((category) => (
              <div key={category.id} className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-6">
                  <div className={`w-16 h-16 ${category.color} rounded-xl flex items-center justify-center mr-4`}>
                    <category.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {category.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {category.description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {category.items.map((item, index) => (
                    <span key={index} className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm">
                      {item}
                    </span>
                  ))}
                </div>
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
              服務項目
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              我們提供完整的廚房設備服務，確保設備正常運作
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <service.icon className="w-8 h-8 text-emerald-600" />
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
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              設備特色
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              我們的設備具有多項特色，為您的餐廳帶來更多價值
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-green-600" />
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

      {/* Why Choose Us Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              為什麼選擇我們
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              我們擁有豐富的經驗和專業的團隊，為您提供最優質的服務
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-4">10+</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">年經驗</h3>
              <p className="text-gray-600">豐富的廚房設備安裝與維護經驗</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-4">500+</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">成功案例</h3>
              <p className="text-gray-600">為超過500家餐廳提供設備服務</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-4">24/7</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">技術支援</h3>
              <p className="text-gray-600">全天候技術支援與故障排除</p>
            </div>
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
            專業團隊為您提供廚房設備諮詢與報價服務
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

