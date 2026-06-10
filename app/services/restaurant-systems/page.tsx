'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { ComputerDesktopIcon, CreditCardIcon, ChartBarIcon, UserGroupIcon, PhoneIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
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
    title: '智能餐飲系統',
    description: '提升營運效率，優化客戶體驗，為餐廳提供一站式系統解決方案。',
  },
  categories: {
    title: '系統服務',
    items: [
      {
        title: '點餐系統',
        description: '支援桌邊點餐與手機點餐，提升點餐效率。',
      },
      {
        title: '收銀系統',
        description: '整合多種付款方式，簡化結帳流程。',
      },
      {
        title: '雲端報表',
        description: '即時查看營運數據，掌握營收狀況。',
      },
      {
        title: '會員系統',
        description: '管理會員資料與點數，提升顧客忠誠度。',
      },
    ],
  },
  features: {
    title: '服務特色',
    items: [
      {
        title: '提升營運效率',
        description: '透過系統整合，減少人手操作，降低出錯率。',
      },
      {
        title: '優化客戶體驗',
        description: '提供快速、準確的服務，提升顧客滿意度。',
      },
      {
        title: '安全可靠',
        description: '採用安全機制保護資料，符合相關法規。',
      },
      {
        title: '彈性擴充',
        description: '系統可依需求擴充模組，支援未來發展。',
      },
    ],
  },
  contact: {
    title: '立即聯繫我們',
    description: '專業團隊為您提供最優質的系統服務，提升餐廳營運效率。',
    button1Text: '聯絡我們',
  },
} as const;

const CATEGORY_ICONS = [
  ComputerDesktopIcon,
  CreditCardIcon,
  ChartBarIcon,
  UserGroupIcon,
];

const CATEGORY_COLORS = [
  'bg-purple-500',
  'bg-green-500',
  'bg-blue-500',
  'bg-pink-500',
];

export default function RestaurantSystemsPage() {
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
        const response = await fetch('/api/pages/restaurant-systems');
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
          console.error('Failed to load restaurant systems content:', error);
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
      const pageRef = doc(db, 'pages', 'restaurant-systems');
      await setDoc(pageRef, {
        title: 'restaurant-systems',
        slug: 'restaurant-systems',
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
              <div className="w-full h-full bg-gradient-to-r from-indigo-600 to-indigo-800">
                <div className="absolute inset-0 bg-black opacity-20"></div>
                <div className="relative h-full flex items-center justify-center">
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <div className="text-center text-gray-600">
                      <p className="text-lg font-semibold">餐飲系統 Banner</p>
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
        <EditButton section="categories" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            {editingSection === 'categories' && isAdmin ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={tempAreas.categories.title}
                  onChange={(e) => updateArea(['categories', 'title'], e.target.value)}
                  className="text-3xl lg:text-4xl font-bold mb-4 w-full border-2 border-blue-500 rounded p-2 text-gray-900"
                />
              </div>
            ) : (
              <>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  {areas.categories.title}
                </h2>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {areas.categories.items.map((category, index) => {
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow text-center relative"
                >
                  {editingSection === 'categories' && isAdmin ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center mb-6 mx-auto">
                      </div>
                      <input
                        type="text"
                        value={tempAreas.categories.items[index].title}
                        onChange={(e) => {
                          const newItems = [...tempAreas.categories.items];
                          newItems[index] = { ...newItems[index], title: e.target.value as any };
                          setTempAreas((prev) => ({ ...prev, categories: { ...prev.categories, items: newItems as unknown as typeof DEFAULT_AREAS.categories.items } }));
                        }}
                        className="text-xl font-semibold text-gray-900 mb-4 w-full border-2 border-blue-500 rounded p-2"
                      />
                      <textarea
                        value={tempAreas.categories.items[index].description}
                        onChange={(e) => {
                          const newItems = [...tempAreas.categories.items];
                          newItems[index] = { ...newItems[index], description: e.target.value as any };
                          setTempAreas((prev) => ({ ...prev, categories: { ...prev.categories, items: newItems as unknown as typeof DEFAULT_AREAS.categories.items } }));
                        }}
                        className="text-gray-600 leading-relaxed w-full border-2 border-blue-500 rounded p-2"
                        rows={3}
                      />
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        {category.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {category.description}
                      </p>
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
              </div>
            ) : (
              <>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  {areas.features.title}
                </h2>
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
              <input
                type="text"
                value={tempAreas.contact.button1Text}
                onChange={(e) => updateArea(['contact', 'button1Text'], e.target.value)}
                className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold border-2 border-blue-500 text-center"
              />
            </div>
          ) : (
            <>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                {areas.contact.title}
              </h2>
              <p className="text-xl text-purple-100 mb-8 max-w-3xl mx-auto">
                {areas.contact.description}
              </p>
              <div className="flex justify-center">
                <a
                  href="https://wa.me/85298636938?text=您好，我想查詢。"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
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
