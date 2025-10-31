'use client';

import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

export default function Partners() {
  const partnerBenefits = [
    {
      title: '業務增長',
      description: '透過我們的平台擴大您的業務範圍，接觸更多餐廳客戶'
    },
    {
      title: '信譽保障',
      description: '與知名食品供應商合作，提升您的品牌信譽和市場地位'
    },
    {
      title: '市場擴展',
      description: '進入香港及周邊地區的餐廳市場，擴大您的業務版圖'
    },
    {
      title: '專業支援',
      description: '獲得專業的業務支援和技術指導，確保合作順利進行'
    }
  ];

  const partnershipTypes = [
    {
      title: '供應商合作',
      description: '成為我們的優質供應商，為餐廳提供新鮮優質的食材',
      features: ['產品展示', '訂單管理', '物流支援', '品質保證']
    },
    {
      title: '配送夥伴',
      description: '加入我們的配送網絡，為餐廳提供快速可靠的配送服務',
      features: ['配送管理', '路線優化', '即時追蹤', '客戶服務']
    }
  ];

  const requirements = [
    '具有相關行業經驗和專業資質',
    '提供優質的產品或服務',
    '遵守行業標準和法規要求',
    '具備良好的商業信譽和財務狀況',
    '願意與我們長期合作共同發展'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              成為我們的合作夥伴
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              與高質食品供應商攜手合作，共同打造香港最優質的餐廳食品供應平台
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                立即申請合作
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors">
                了解更多
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              合作優勢
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              加入我們的合作夥伴網絡，享受專業支援和業務增長機會
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {partnerBenefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600">{index + 1}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Partnership Types */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              合作類型
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              我們提供多種合作模式，滿足不同類型的合作夥伴需求
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {partnershipTypes.map((type, index) => (
              <div key={index} className="card p-8 text-center hover:shadow-lg transition-shadow">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-bold text-primary-600">
                    {type.title.charAt(0)}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {type.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {type.description}
                </p>
                <ul className="space-y-2 text-left">
                  {type.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-600">
                      <div className="w-2 h-2 bg-primary-600 rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className="mt-6 w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors">
                  了解詳情
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Requirements Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                合作要求
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                我們尋求具有專業能力和良好信譽的合作夥伴，共同為餐廳提供優質服務
              </p>
              <ul className="space-y-4">
                {requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center mr-4 mt-0.5">
                      <span className="text-white text-sm font-bold">{index + 1}</span>
                    </div>
                    <span className="text-gray-700">{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                申請流程
              </h3>
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">提交申請</h4>
                    <p className="text-gray-600 text-sm">填寫合作申請表單</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">資格審核</h4>
                    <p className="text-gray-600 text-sm">我們會審核您的申請資料</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">面談協商</h4>
                    <p className="text-gray-600 text-sm">進行詳細的合作討論</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">簽約合作</h4>
                    <p className="text-gray-600 text-sm">正式建立合作關係</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            準備好成為我們的合作夥伴了嗎？
          </h2>
          <p className="text-xl mb-8 text-primary-100 max-w-3xl mx-auto">
            立即提交您的合作申請，與我們攜手打造香港最優質的餐廳食品供應平台
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              立即申請合作
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors">
              下載合作資料
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}