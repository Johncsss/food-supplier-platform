'use client';

import { useState } from 'react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { 
  Package, 
  Users, 
  Truck, 
  Shield, 
  Award, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Star,
  CheckCircle,
  Heart,
  Leaf,
  Target
} from 'lucide-react';

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState('about');

  const stats = [
    { icon: Users, value: '500+', label: '餐廳客戶' },
    { icon: Package, value: '1000+', label: '產品種類' },
    { icon: Truck, value: '24小時', label: '配送服務' },
    { icon: Award, value: '10年+', label: '行業經驗' }
  ];

  const values = [
    {
      icon: Heart,
      title: '品質至上',
      description: '我們只提供最優質的食材，確保每一件產品都符合最高標準。'
    },
    {
      icon: Leaf,
      title: '環保永續',
      description: '致力於可持續發展，支持本地農民，減少碳足跡。'
    },
    {
      icon: Target,
      title: '精準配送',
      description: '準時配送，確保食材新鮮度，讓您的餐廳運營無後顧之憂。'
    },
    {
      icon: Shield,
      title: '安全可靠',
      description: '所有產品都經過嚴格的安全檢測，確保食品安全。'
    }
  ];

  const services = [
    {
      icon: Package,
      title: '新鮮食材供應',
      description: '提供各種新鮮蔬菜、水果、肉類和海鮮，確保品質和口感。'
    },
    {
      icon: Truck,
      title: '快速配送服務',
      description: '24小時內送達，專業冷鏈運輸，保持食材新鮮度。'
    },
    {
      icon: Users,
      title: '專屬客戶服務',
      description: '一對一客戶經理，為您的餐廳提供個性化解決方案。'
    },
    {
      icon: Award,
      title: '品質保證',
      description: '所有產品都有品質保證，不滿意可退換貨。'
    }
  ];

  const team = [
    {
      name: '張志明',
      position: '創始人 & CEO',
      description: '擁有15年食品供應鏈經驗，致力於為餐廳提供最優質的食材。'
    },
    {
      name: '李美玲',
      position: '營運總監',
      description: '負責日常營運管理，確保服務品質和客戶滿意度。'
    },
    {
      name: '王建國',
      position: '採購經理',
      description: '專業的食材採購團隊，與優質供應商建立長期合作關係。'
    },
    {
      name: '陳雅芳',
      position: '客戶服務經理',
      description: '為客戶提供專業的服務支持，解決各種問題和需求。'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              關於我們
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              專業的餐廳食材供應商，為您的餐廳提供最優質的食材和服務
            </p>
            <div className="flex justify-center space-x-8">
              <button
                onClick={() => setActiveTab('about')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'about' 
                    ? 'bg-white text-primary-600' 
                    : 'bg-transparent border border-white hover:bg-white hover:text-primary-600'
                }`}
              >
                公司介紹
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'services' 
                    ? 'bg-white text-primary-600' 
                    : 'bg-transparent border border-white hover:bg-white hover:text-primary-600'
                }`}
              >
                服務項目
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'team' 
                    ? 'bg-white text-primary-600' 
                    : 'bg-transparent border border-white hover:bg-white hover:text-primary-600'
                }`}
              >
                團隊介紹
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <stat.icon className="w-12 h-12 text-primary-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {activeTab === 'about' && (
          <div className="space-y-16">
            {/* Company Story */}
            <section>
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">我們的故事</h2>
                  <p className="text-lg text-gray-600 mb-6">
                    成立於2014年，我們從一個小型的本地食材供應商開始，逐步發展成為香港領先的餐廳食材供應商。
                  </p>
                  <p className="text-lg text-gray-600 mb-6">
                    我們的使命是為餐廳提供最優質、最新鮮的食材，幫助餐廳提升菜品品質，為顧客提供更好的用餐體驗。
                  </p>
                  <p className="text-lg text-gray-600">
                    十年來，我們已經服務超過500家餐廳，建立了完善的供應鏈體系和配送網絡，成為餐廳值得信賴的合作夥伴。
                  </p>
                </div>
                <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                  <Package className="w-24 h-24 text-gray-400" />
                </div>
              </div>
            </section>

            {/* Values */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">我們的價值觀</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {values.map((value, index) => (
                  <div key={index} className="text-center">
                    <div className="flex justify-center mb-4">
                      <value.icon className="w-12 h-12 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                    <p className="text-gray-600">{value.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Mission & Vision */}
            <section className="grid md:grid-cols-2 gap-12">
              <div className="bg-primary-50 p-8 rounded-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">我們的使命</h3>
                <p className="text-gray-600">
                  為餐廳提供最優質的食材和服務，幫助餐廳提升競爭力，為顧客創造更好的用餐體驗。
                </p>
              </div>
              <div className="bg-primary-50 p-8 rounded-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">我們的願景</h3>
                <p className="text-gray-600">
                  成為香港最受信賴的餐廳食材供應商，推動餐飲行業的可持續發展。
                </p>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-16">
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">我們的服務</h2>
              <div className="grid md:grid-cols-2 gap-8">
                {services.map((service, index) => (
                  <div key={index} className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center mb-4">
                      <service.icon className="w-8 h-8 text-primary-600 mr-3" />
                      <h3 className="text-xl font-semibold text-gray-900">{service.title}</h3>
                    </div>
                    <p className="text-gray-600">{service.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Service Features */}
            <section className="bg-gray-50 p-8 rounded-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">服務特色</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">品質保證</h4>
                    <p className="text-sm text-gray-600">所有產品都經過嚴格品質檢測</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="w-6 h-6 text-blue-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">準時配送</h4>
                    <p className="text-sm text-gray-600">24小時內送達，確保食材新鮮</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="w-6 h-6 text-purple-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">專屬服務</h4>
                    <p className="text-sm text-gray-600">一對一客戶經理服務</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-16">
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">我們的團隊</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {team.map((member, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                    <div className="w-20 h-20 bg-primary-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Users className="w-10 h-10 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{member.name}</h3>
                    <p className="text-primary-600 font-medium mb-3">{member.position}</p>
                    <p className="text-gray-600 text-sm">{member.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Contact Info */}
            <section className="bg-primary-50 p-8 rounded-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">聯絡我們</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-6 h-6 text-primary-600" />
                  <div>
                    <h4 className="font-semibold text-gray-900">地址</h4>
                    <p className="text-gray-600">香港九龍灣宏光道1號</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-6 h-6 text-primary-600" />
                  <div>
                    <h4 className="font-semibold text-gray-900">電話</h4>
                    <p className="text-gray-600">+852 2345 6789</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-6 h-6 text-primary-600" />
                  <div>
                    <h4 className="font-semibold text-gray-900">電郵</h4>
                    <p className="text-gray-600">info@foodsupplier.com</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">準備好開始合作了嗎？</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            加入我們的客戶網絡，享受專業的食材供應服務
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href="/register"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              立即註冊
            </a>
            <a
              href="/contact"
              className="border border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-primary-600 transition-colors"
            >
              聯絡我們
            </a>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <Footer />
    </div>
  );
} 