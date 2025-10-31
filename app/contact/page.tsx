'use client';

import { useState } from 'react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  MessageSquare,
  Send,
  CheckCircle,
  Building,
  Truck,
  Users
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        subject: '',
        message: ''
      });
      
      // Reset success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    }, 1000);
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: '總部地址',
      content: '香港九龍灣宏光道1號',
      subtitle: '九龍灣商貿中心15樓'
    },
    {
      icon: Phone,
      title: '客服熱線',
      content: '+852 2345 6789',
      subtitle: '週一至週五 9:00-18:00'
    },
    {
      icon: Mail,
      title: '電子郵件',
      content: 'info@foodsupplier.com',
      subtitle: '24小時內回覆'
    },
    {
      icon: Clock,
      title: '營業時間',
      content: '週一至週五 9:00-18:00',
      subtitle: '週六 9:00-14:00'
    }
  ];

  const departments = [
    {
      icon: Users,
      title: '客戶服務',
      phone: '+852 2345 6789',
      email: 'service@foodsupplier.com',
      description: '訂單查詢、配送安排、客戶支援'
    },
    {
      icon: Building,
      title: '採購部門',
      phone: '+852 2345 6790',
      email: 'procurement@foodsupplier.com',
      description: '供應商合作、產品採購、品質管理'
    },
    {
      icon: Truck,
      title: '配送中心',
      phone: '+852 2345 6791',
      email: 'logistics@foodsupplier.com',
      description: '配送安排、物流追蹤、倉儲管理'
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
              聯絡我們
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              我們隨時為您提供專業的服務支援，歡迎與我們聯繫
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactInfo.map((info, index) => (
              <div key={index} className="text-center p-6 bg-gray-50 rounded-lg">
                <div className="flex justify-center mb-4">
                  <info.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{info.title}</h3>
                <p className="text-gray-900 font-medium mb-1">{info.content}</p>
                <p className="text-sm text-gray-600">{info.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-16">
          
          {/* Contact Form */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">發送訊息</h2>
            
            {submitSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-800">訊息已成功發送！我們會盡快回覆您。</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    姓名 *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="請輸入您的姓名"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    電子郵件 *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="請輸入您的電子郵件"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    電話號碼
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="請輸入您的電話號碼"
                  />
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    公司名稱
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="請輸入您的公司名稱"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  主題 *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">請選擇主題</option>
                  <option value="general">一般查詢</option>
                  <option value="order">訂單查詢</option>
                  <option value="delivery">配送服務</option>
                  <option value="product">產品資訊</option>
                  <option value="partnership">合作提案</option>
                  <option value="complaint">投訴建議</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  訊息內容 *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="請詳細描述您的需求或問題..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    發送中...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    發送訊息
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">聯絡資訊</h2>
            
            {/* Department Contacts */}
            <div className="space-y-6 mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">各部門聯絡方式</h3>
              {departments.map((dept, index) => (
                <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <dept.icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">{dept.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{dept.description}</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{dept.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{dept.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Office Location */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">辦公室位置</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-primary-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">香港九龍灣宏光道1號</p>
                    <p className="text-sm text-gray-600">九龍灣商貿中心15樓</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-primary-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">營業時間</p>
                    <p className="text-sm text-gray-600">週一至週五 9:00-18:00</p>
                    <p className="text-sm text-gray-600">週六 9:00-14:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">我們的位置</h2>
          <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">地圖將在此顯示</p>
              <p className="text-sm text-gray-500 mt-2">香港九龍灣宏光道1號</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">常見問題</h2>
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">如何下訂單？</h3>
              <p className="text-gray-600">您可以通過我們的網站註冊帳戶，瀏覽產品目錄，將所需商品加入購物車，然後完成結帳流程。</p>
            </div>
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">配送時間是多久？</h3>
              <p className="text-gray-600">我們提供24小時內配送服務，具體時間取決於您的訂單時間和配送地址。</p>
            </div>
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">如何查詢訂單狀態？</h3>
              <p className="text-gray-600">登入您的帳戶後，在「我的訂單」頁面可以查看所有訂單的詳細狀態和配送進度。</p>
            </div>
            <div className="pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">是否提供退換貨服務？</h3>
              <p className="text-gray-600">是的，我們提供品質保證服務。如果收到的產品有品質問題，請在24小時內聯繫我們的客服團隊。</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <Footer />
    </div>
  );
} 