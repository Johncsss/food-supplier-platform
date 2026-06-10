'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { BeakerIcon, SparklesIcon, WrenchScrewdriverIcon, GiftIcon, ArchiveBoxIcon, PhoneIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
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
    title: '專業餐碟餐具',
    description: '提升用餐體驗，展現餐廳品味，提供多款高品質餐碟餐具選擇。',
  },
  categories: {
    title: '產品分類',
    description: '我們提供多種餐碟餐具產品，從基本款到高級款一應俱全。',
    items: [
      {
        title: '餐具套裝',
        description: '精美餐具套裝，提升用餐體驗',
        priceRange: 'HKD$ 200 - 2,000',
        items: ['陶瓷餐具', '骨瓷餐具', '不鏽鋼餐具', '木製餐具', '竹製餐具'],
      },
      {
        title: '玻璃器皿',
        description: '高品質玻璃器皿，透明美觀',
        priceRange: 'HKD$ 50 - 800',
        items: ['酒杯', '水杯', '咖啡杯', '茶具', '玻璃碗', '玻璃盤'],
      },
      {
        title: '廚房用具',
        description: '實用廚房用具，提升烹飪效率',
        priceRange: 'HKD$ 100 - 1,500',
        items: ['刀具', '砧板', '鍋具', '鏟子', '勺子', '量杯'],
      },
      {
        title: '餐桌用品',
        description: '精美餐桌用品，營造用餐氛圍',
        priceRange: 'HKD$ 30 - 500',
        items: ['桌布', '餐墊', '餐巾', '花瓶', '蠟燭', '裝飾品'],
      },
      {
        title: '清潔用品',
        description: '專業清潔用品，保持餐具衛生',
        priceRange: 'HKD$ 20 - 200',
        items: ['洗碗精', '清潔劑', '消毒液', '抹布', '海綿', '刷子'],
      },
      {
        title: '儲存用品',
        description: '實用儲存用品，保持餐具整潔',
        priceRange: 'HKD$ 50 - 800',
        items: ['餐具盒', '保鮮盒', '密封罐', '收納架', '餐具櫃', '防塵罩'],
      },
    ],
  },
  services: {
    title: '服務特色',
    items: [
      {
        title: '客製化設計',
        description: '根據餐廳風格提供客製化餐具設計',
      },
      {
        title: '品質保證',
        description: '使用優質材料，提供品質保證',
      },
      {
        title: '批量採購',
        description: '提供批量採購優惠價格',
      },
      {
        title: '售後服務',
        description: '完善的售後服務與維護保養',
      },
    ],
  },
  contact: {
    title: '立即聯繫我們',
    description: '專業團隊為您提供最優質的服務',
    button1Text: '聯絡我們',
  },
} as const;

export default function DishesTablewarePage() {
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
        const response = await fetch('/api/pages/dishes-tableware');
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
          console.error('Failed to load dishes tableware content:', error);
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
      const pageRef = doc(db, 'pages', 'dishes-tableware');
      await setDoc(pageRef, {
        title: 'dishes-tableware',
        slug: 'dishes-tableware',
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
              <div className="w-full h-full bg-gradient-to-r from-purple-600 to-purple-800">
                <div className="absolute inset-0 bg-black opacity-20"></div>
                <div className="relative h-full flex items-center justify-center">
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <div className="text-center text-gray-600">
                      <p className="text-lg font-semibold">餐碟餐具 Banner</p>
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
                <textarea
                  value={tempAreas.categories.description}
                  onChange={(e) => updateArea(['categories', 'description'], e.target.value)}
                  className="text-xl text-gray-600 max-w-3xl mx-auto w-full border-2 border-blue-500 rounded p-2"
                  rows={2}
                />
              </div>
            ) : (
              <>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  {areas.categories.title}
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  {areas.categories.description}
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {areas.categories.items.map((category, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow relative"
              >
                {editingSection === 'categories' && isAdmin ? (
                  <div className="space-y-4">
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
                      className="text-gray-600 leading-relaxed mb-4 w-full border-2 border-blue-500 rounded p-2"
                      rows={3}
                    />
                    <input
                      type="text"
                      value={tempAreas.categories.items[index].priceRange}
                      onChange={(e) => {
                        const newItems = [...tempAreas.categories.items];
                        newItems[index] = { ...newItems[index], priceRange: e.target.value as any };
                        setTempAreas((prev) => ({ ...prev, categories: { ...prev.categories, items: newItems as unknown as typeof DEFAULT_AREAS.categories.items } }));
                      }}
                      className="text-purple-600 font-semibold mb-4 w-full border-2 border-blue-500 rounded p-2"
                    />
                    <textarea
                      value={tempAreas.categories.items[index].items?.join(', ') || ''}
                      onChange={(e) => {
                        const newItems = [...tempAreas.categories.items];
                        newItems[index] = { ...newItems[index], items: e.target.value.split(',').map(s => s.trim()).filter(s => s) as any };
                        setTempAreas((prev) => ({ ...prev, categories: { ...prev.categories, items: newItems as unknown as typeof DEFAULT_AREAS.categories.items } }));
                      }}
                      className="w-full border-2 border-blue-500 rounded p-2"
                      rows={2}
                      placeholder="輸入項目，用逗號分隔"
                    />
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      {category.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      {category.description}
                    </p>
                    <p className="text-purple-600 font-semibold mb-4">
                      {category.priceRange}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {category.items?.map((item, i) => (
                        <span key={i} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                          {item}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-20 bg-white">
        <EditButton section="services" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            {editingSection === 'services' && isAdmin ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={tempAreas.services.title}
                  onChange={(e) => updateArea(['services', 'title'], e.target.value)}
                  className="text-3xl lg:text-4xl font-bold mb-4 w-full border-2 border-blue-500 rounded p-2 text-gray-900"
                />
              </div>
            ) : (
              <>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  {areas.services.title}
                </h2>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {areas.services.items.map((service, index) => (
              <div key={index} className="text-center relative">
                {editingSection === 'services' && isAdmin ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={tempAreas.services.items[index].title}
                      onChange={(e) => {
                        const newItems = [...tempAreas.services.items];
                        newItems[index] = { ...newItems[index], title: e.target.value as any };
                        setTempAreas((prev) => ({ ...prev, services: { ...prev.services, items: newItems as unknown as typeof DEFAULT_AREAS.services.items } }));
                      }}
                      className="text-xl font-semibold text-gray-900 mb-4 w-full border-2 border-blue-500 rounded p-2"
                    />
                    <textarea
                      value={tempAreas.services.items[index].description}
                      onChange={(e) => {
                        const newItems = [...tempAreas.services.items];
                        newItems[index] = { ...newItems[index], description: e.target.value as any };
                        setTempAreas((prev) => ({ ...prev, services: { ...prev.services, items: newItems as unknown as typeof DEFAULT_AREAS.services.items } }));
                      }}
                      className="text-gray-600 leading-relaxed w-full border-2 border-blue-500 rounded p-2"
                      rows={3}
                    />
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {service.description}
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
