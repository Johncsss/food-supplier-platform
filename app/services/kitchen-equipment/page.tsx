'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { CloudIcon, ScissorsIcon, CakeIcon, ArrowPathIcon, PhoneIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
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
    title: '專業廚房設備',
    description: '提供全套廚房設備解決方案，提升餐廳營運效率',
    button1Text: '免費諮詢',
    button2Text: '查看設備',
  },
  categories: {
    title: '設備類別',
    description: '我們提供多種廚房設備類別，滿足不同餐廳的需求',
    items: [
      {
        title: '烹飪設備',
        description: '專業烹飪設備，提升廚房效率',
        items: ['爐具', '烤箱', '蒸籠', '炸鍋', '烤架', '平底鍋'],
      },
      {
        title: '冷藏設備',
        description: '高效冷藏設備，保持食材新鮮',
        items: ['冰箱', '冷凍櫃', '冷藏櫃', '製冰機', '冷卻器', '保鮮櫃'],
      },
      {
        title: '清潔設備',
        description: '專業清潔設備，確保衛生標準',
        items: ['洗碗機', '消毒櫃', '清潔機', '烘乾機', '洗滌槽', '清潔劑'],
      },
      {
        title: '切配設備',
        description: '高效切配設備，提升備料效率',
        items: ['切菜機', '攪拌機', '榨汁機', '切片機', '絞肉機', '攪拌器'],
      },
      {
        title: '烘焙設備',
        description: '專業烘焙設備，製作精美糕點',
        items: ['烤箱', '發酵箱', '攪拌機', '壓麵機', '模具', '烘焙工具'],
      },
      {
        title: '通風設備',
        description: '高效通風設備，保持廚房空氣清新',
        items: ['抽油煙機', '排風扇', '通風管', '空氣淨化器', '風扇', '通風系統'],
      },
    ],
  },
  services: {
    title: '服務項目',
    description: '我們提供完整的廚房設備服務，確保設備正常運作',
    items: [
      {
        title: '專業安裝',
        description: '專業技術團隊提供設備安裝服務',
      },
      {
        title: '定期維護',
        description: '定期維護保養，確保設備正常運作',
      },
      {
        title: '技術支援',
        description: '24小時技術支援與故障排除',
      },
      {
        title: '零件供應',
        description: '原廠零件供應，確保設備品質',
      },
    ],
  },
  features: {
    title: '設備特色',
    description: '我們的設備具有多項特色，為您的餐廳帶來更多價值',
    items: [
      {
        title: '節能環保',
        description: '採用節能技術，降低營運成本',
      },
      {
        title: '安全可靠',
        description: '符合安全標準，保障使用安全',
      },
      {
        title: '高效運作',
        description: '提升廚房工作效率',
      },
      {
        title: '易於操作',
        description: '人性化設計，操作簡單方便',
      },
    ],
  },
  contact: {
    title: '立即諮詢',
    description: '專業團隊為您提供廚房設備諮詢與報價服務',
    button1Text: '聯絡我們',
    button2Text: '免費報價',
  },
} as const;

const CATEGORY_ICONS = [
  CloudIcon,
  ScissorsIcon,
  CakeIcon,
  ArrowPathIcon,
];

const CATEGORY_COLORS = [
  'bg-red-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-cyan-500',
];

export default function KitchenEquipmentPage() {
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
        const response = await fetch('/api/pages/kitchen-equipment');
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
          console.error('Failed to load kitchen equipment content:', error);
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
      const pageRef = doc(db, 'pages', 'kitchen-equipment');
      await setDoc(pageRef, {
        title: 'kitchen-equipment',
        slug: 'kitchen-equipment',
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
              <div className="w-full h-full bg-gradient-to-r from-amber-600 to-amber-800">
                <div className="absolute inset-0 bg-black opacity-20"></div>
                <div className="relative h-full flex items-center justify-center">
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <div className="text-center text-gray-600">
                      <p className="text-lg font-semibold">廚房設備 Banner</p>
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
            {areas.categories.items.map((category, index) => {
              return (
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
              );
            })}
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
                <textarea
                  value={tempAreas.services.description}
                  onChange={(e) => updateArea(['services', 'description'], e.target.value)}
                  className="text-xl text-gray-600 max-w-3xl mx-auto w-full border-2 border-blue-500 rounded p-2"
                  rows={2}
                />
              </div>
            ) : (
              <>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  {areas.services.title}
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  {areas.services.description}
                </p>
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

      <section className="relative py-20">
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
                  className="bg-white text-amber-600 px-8 py-4 rounded-lg font-semibold border-2 border-blue-500 text-center"
                />
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                {areas.contact.title}
              </h2>
              <p className="text-xl text-amber-100 mb-8 max-w-3xl mx-auto">
                {areas.contact.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://wa.me/85298636938?text=您好，我想查詢。"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-amber-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center"
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
