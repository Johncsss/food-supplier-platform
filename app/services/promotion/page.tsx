'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { MegaphoneIcon, NewspaperIcon, CalendarIcon, PaintBrushIcon, CameraIcon, UserGroupIcon, PhoneIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/AuthProvider';
import toast from 'react-hot-toast';
import { ImageUploader } from '@/components/ui/ImageUploader';

const DEFAULT_AREAS = {
  banner: {
    imageUrl: '',
  },
  hero: {
    title: '餐廳宣傳服務',
    description: '專業行銷團隊為您的餐廳提供全方位宣傳解決方案',
    button1Text: '免費諮詢',
    button2Text: '查看案例',
  },
  promotionServices: {
    title: '宣傳服務',
    description: '點擊查看詳細資訊，我們提供多種宣傳服務滿足不同需求',
    items: [
      {
        title: '數位行銷',
        description: '全方位的數位行銷解決方案',
        items: ['社群媒體管理', 'Google廣告', 'Facebook廣告', 'Instagram行銷', 'LINE官方帳號', '網站優化'],
        priceRange: 'HKD$ 3,000 - 15,000/月',
      },
      {
        title: '傳統廣告',
        description: '傳統媒體廣告投放服務',
        items: ['報紙廣告', '雜誌廣告', '廣播廣告', '電視廣告', '戶外看板', '傳單設計'],
        priceRange: 'HKD$ 5,000 - 50,000/次',
      },
      {
        title: '活動策劃',
        description: '專業活動策劃與執行',
        items: ['開幕活動', '節慶活動', '促銷活動', '品嚐會', '記者會', '展覽活動'],
        priceRange: 'HKD$ 10,000 - 100,000/場',
      },
      {
        title: '品牌設計',
        description: '完整的品牌形象設計',
        items: ['Logo設計', '名片設計', '菜單設計', '包裝設計', '店面設計', '制服設計'],
        priceRange: 'HKD$ 2,000 - 20,000/項',
      },
      {
        title: '內容創作',
        description: '專業內容創作與製作',
        items: ['美食攝影', '影片製作', '文案撰寫', '產品介紹', '故事行銷', '內容企劃'],
        priceRange: 'HKD$ 1,500 - 8,000/項',
      },
      {
        title: '公關服務',
        description: '專業公關與媒體關係',
        items: ['媒體關係', '新聞發布', '危機處理', '口碑管理', 'KOL合作', '網紅行銷'],
        priceRange: 'HKD$ 8,000 - 30,000/月',
      },
    ],
  },
  features: {
    title: '服務特色',
    description: '我們提供全方位的宣傳服務，從策略到執行，確保最佳效果',
    items: [
      {
        title: '策略規劃',
        description: '根據餐廳特色制定專屬行銷策略',
      },
      {
        title: '創意設計',
        description: '專業設計團隊提供創意視覺設計',
      },
      {
        title: '數據分析',
        description: '詳細數據分析，優化行銷效果',
      },
      {
        title: '效果追蹤',
        description: '持續追蹤行銷效果，調整策略',
      },
    ],
  },
  contact: {
    title: '立即諮詢',
    description: '專業行銷團隊為您提供免費諮詢與方案規劃',
    button1Text: '聯絡我們',
  },
} as const;

const SERVICE_ICONS = [
  MegaphoneIcon,
  NewspaperIcon,
  CalendarIcon,
  PaintBrushIcon,
  CameraIcon,
  UserGroupIcon,
];

const SERVICE_COLORS = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-cyan-500',
];

export default function PromotionPage() {
  const { isAdmin } = useAuth();
  const [areas, setAreas] = useState(DEFAULT_AREAS);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [tempAreas, setTempAreas] = useState(DEFAULT_AREAS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // Use API route which uses admin SDK and works for non-logged-in users
        const response = await fetch('/api/pages/promotion');
        if (cancelled) return;
        
        if (!response.ok) {
          throw new Error('Failed to fetch page data');
        }
        
        const result = await response.json();
        if (result.success && result.page?.areas) {
          // API already merges defaults with CMS data, use it directly
          setAreas(result.page.areas);
          setTempAreas(result.page.areas);
        } else {
          // Fallback to defaults if API returns no areas
          setAreas(DEFAULT_AREAS);
          setTempAreas(DEFAULT_AREAS);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load promotion content:', error);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const startEditing = (section: string) => {
    setEditingSection(section);
    setTempAreas(JSON.parse(JSON.stringify(areas)));
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setTempAreas(JSON.parse(JSON.stringify(areas)));
  };

  const saveChanges = async () => {
    if (!editingSection) return;
    
    try {
      setSaving(true);
      const pageRef = doc(db, 'pages', 'promotion');
      await setDoc(pageRef, {
        title: 'promotion',
        slug: 'promotion',
        areas: tempAreas,
        updatedAt: Timestamp.now(),
      }, { merge: true });
      
      setAreas(JSON.parse(JSON.stringify(tempAreas)));
      setEditingSection(null);
      toast.success('內容已儲存');
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  const updateArea = (path: string[], value: any) => {
    setTempAreas((prev) => {
      const newAreas = JSON.parse(JSON.stringify(prev));
      let current: any = newAreas;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newAreas;
    });
  };

  const EditButton = ({ section }: { section: string }) => {
    if (!isAdmin) return null;
    
    const isEditing = editingSection === section;
    
    if (isEditing) {
      return (
        <div className="flex gap-2 absolute top-4 right-4 z-10">
          <button
            onClick={saveChanges}
            disabled={saving}
            className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
            title="儲存"
          >
            <CheckIcon className="w-4 h-4" />
            {saving ? '儲存中...' : '儲存'}
          </button>
          <button
            onClick={cancelEditing}
            className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 flex items-center gap-1"
            title="取消"
          >
            <XMarkIcon className="w-4 h-4" />
            取消
          </button>
        </div>
      );
    }
    
    return (
      <button
        onClick={() => startEditing(section)}
        className="absolute top-4 right-4 bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 z-10 flex items-center gap-1"
        title="編輯"
      >
        <PencilIcon className="w-4 h-4" />
        編輯
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Hero Banner Section */}
      <section className="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden">
        <EditButton section="banner" />
        {editingSection === 'banner' && isAdmin ? (
          <div className="w-full h-full bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Banner 圖片</label>
                <ImageUploader
                  value={tempAreas.banner?.imageUrl || ''}
                  onChange={(url) => updateArea(['banner', 'imageUrl'], url)}
                  folder="homepage_banners"
                  onError={(error) => toast.error(error)}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {areas.banner?.imageUrl ? (
              <div className="relative w-full h-full">
                <img
                  src={areas.banner.imageUrl}
                  alt="Banner"
                  className="w-full h-full object-cover"
                  style={{ width: '100%', maxWidth: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-600 to-blue-800">
                <div className="absolute inset-0 bg-black opacity-20"></div>
                <div className="relative h-full flex items-center justify-center">
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <div className="text-center text-gray-600">
                      <p className="text-lg font-semibold">廣告宣傳 Banner</p>
                      <p className="text-sm mt-2">Dummy Banner Image</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <section className="relative py-20">
        <EditButton section="promotionServices" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            {editingSection === 'promotionServices' && isAdmin ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={tempAreas.promotionServices.title}
                  onChange={(e) => updateArea(['promotionServices', 'title'], e.target.value)}
                  className="text-3xl lg:text-4xl font-bold mb-4 w-full border-2 border-blue-500 rounded p-2 text-gray-900"
                />
                <textarea
                  value={tempAreas.promotionServices.description}
                  onChange={(e) => updateArea(['promotionServices', 'description'], e.target.value)}
                  className="text-xl text-gray-600 max-w-3xl mx-auto w-full border-2 border-blue-500 rounded p-2"
                  rows={2}
                />
              </div>
            ) : (
              <>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  {areas.promotionServices.title}
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  {areas.promotionServices.description}
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {areas.promotionServices.items.map((service, index) => {
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow relative"
                >
                  {editingSection === 'promotionServices' && isAdmin ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={tempAreas.promotionServices.items[index].title}
                        onChange={(e) => {
                          const newItems = [...tempAreas.promotionServices.items];
                          newItems[index] = { ...newItems[index], title: e.target.value as any };
                          setTempAreas((prev) => ({ ...prev, promotionServices: { ...prev.promotionServices, items: newItems as unknown as typeof DEFAULT_AREAS.promotionServices.items } }));
                        }}
                        className="text-xl font-semibold text-gray-900 mb-4 w-full border-2 border-blue-500 rounded p-2"
                      />
                      <textarea
                        value={tempAreas.promotionServices.items[index].description}
                        onChange={(e) => {
                          const newItems = [...tempAreas.promotionServices.items];
                          newItems[index] = { ...newItems[index], description: e.target.value as any };
                          setTempAreas((prev) => ({ ...prev, promotionServices: { ...prev.promotionServices, items: newItems as unknown as typeof DEFAULT_AREAS.promotionServices.items } }));
                        }}
                        className="text-gray-600 leading-relaxed mb-4 w-full border-2 border-blue-500 rounded p-2"
                        rows={3}
                      />
                      <input
                        type="text"
                        value={tempAreas.promotionServices.items[index].priceRange}
                        onChange={(e) => {
                          const newItems = [...tempAreas.promotionServices.items];
                          newItems[index] = { ...newItems[index], priceRange: e.target.value as any };
                          setTempAreas((prev) => ({ ...prev, promotionServices: { ...prev.promotionServices, items: newItems as unknown as typeof DEFAULT_AREAS.promotionServices.items } }));
                        }}
                        className="text-blue-600 font-semibold mb-4 w-full border-2 border-blue-500 rounded p-2"
                      />
                      <textarea
                        value={tempAreas.promotionServices.items[index].items?.join(', ') || ''}
                        onChange={(e) => {
                          const newItems = [...tempAreas.promotionServices.items];
                          newItems[index] = { ...newItems[index], items: e.target.value.split(',').map(s => s.trim()).filter(s => s) as any };
                          setTempAreas((prev) => ({ ...prev, promotionServices: { ...prev.promotionServices, items: newItems as unknown as typeof DEFAULT_AREAS.promotionServices.items } }));
                        }}
                        className="w-full border-2 border-blue-500 rounded p-2"
                        rows={2}
                        placeholder="輸入項目，用逗號分隔"
                      />
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        {service.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed mb-4">
                        {service.description}
                      </p>
                      <p className="text-blue-600 font-semibold mb-4">
                        {service.priceRange}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {service.items?.map((item, i) => (
                          <span key={i} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                            {item}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative py-20 bg-white">
        <EditButton section="features" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            {editingSection === 'features' && isAdmin ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={tempAreas.features.title}
                  onChange={(e) => updateArea(['features', 'title'], e.target.value)}
                  className="text-3xl lg:text-4xl font-bold mb-4 w-full border-2 border-blue-500 rounded p-2 text-gray-900"
                />
                <textarea
                  value={tempAreas.features.description}
                  onChange={(e) => updateArea(['features', 'description'], e.target.value)}
                  className="text-xl text-gray-600 max-w-3xl mx-auto w-full border-2 border-blue-500 rounded p-2"
                  rows={2}
                />
              </div>
            ) : (
              <>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  {areas.features.title}
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  {areas.features.description}
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {areas.features.items.map((feature, index) => (
              <div key={index} className="text-center relative">
                {editingSection === 'features' && isAdmin ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={tempAreas.features.items[index].title}
                      onChange={(e) => {
                        const newItems = [...tempAreas.features.items];
                        newItems[index] = { ...newItems[index], title: e.target.value as any };
                        setTempAreas((prev) => ({ ...prev, features: { ...prev.features, items: newItems as unknown as typeof DEFAULT_AREAS.features.items } }));
                      }}
                      className="text-xl font-semibold text-gray-900 mb-4 w-full border-2 border-blue-500 rounded p-2"
                    />
                    <textarea
                      value={tempAreas.features.items[index].description}
                      onChange={(e) => {
                        const newItems = [...tempAreas.features.items];
                        newItems[index] = { ...newItems[index], description: e.target.value as any };
                        setTempAreas((prev) => ({ ...prev, features: { ...prev.features, items: newItems as unknown as typeof DEFAULT_AREAS.features.items } }));
                      }}
                      className="text-gray-600 leading-relaxed w-full border-2 border-blue-500 rounded p-2"
                      rows={3}
                    />
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-20" style={{backgroundColor: 'rgb(11, 134, 40)'}}>
        <EditButton section="contact" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {editingSection === 'contact' && isAdmin ? (
            <div className="space-y-4">
              <input
                type="text"
                value={tempAreas.contact.title}
                onChange={(e) => updateArea(['contact', 'title'], e.target.value)}
                className="text-3xl lg:text-4xl font-bold mb-6 w-full border-2 border-blue-500 rounded p-2 text-gray-900"
              />
              <textarea
                value={tempAreas.contact.description}
                onChange={(e) => updateArea(['contact', 'description'], e.target.value)}
                className="text-xl mb-8 max-w-3xl mx-auto w-full border-2 border-blue-500 rounded p-2 text-gray-900"
                rows={3}
              />
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <input
                  type="text"
                  value={tempAreas.contact.button1Text}
                  onChange={(e) => updateArea(['contact', 'button1Text'], e.target.value)}
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold border-2 border-blue-500 text-center"
                />
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                {areas.contact.title}
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
                {areas.contact.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://wa.me/85298636938?text=您好，我想查詢。"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center"
                >
                  <PhoneIcon className="w-5 h-5 mr-2" />
                  {areas.contact.button1Text}
                </a>
              </div>
            </>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
