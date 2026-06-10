'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import {
  WrenchScrewdriverIcon,
  BoltIcon,
  FireIcon,
  CloudIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon as HammerIcon,
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  PhoneIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/AuthProvider';
import toast from 'react-hot-toast';
import { ImageUploader } from '@/components/ui/ImageUploader';

const DEFAULT_AREAS = {
  banner: {
    title: '商業工程 Banner',
    subtitle: 'Dummy Banner Image',
    imageUrl: '',
  },
  hero: {
    title: '專業餐廳工程服務',
    description: '從設計規劃到施工完成，提供全方位的餐廳工程解決方案',
    button1Text: '免費諮詢',
    button2Text: '查看案例',
  },
  services: {
    title: '服務項目',
    description:
      '我們提供完整的餐廳工程服務，從設計到施工，確保每個環節都達到專業標準',
    items: [
      {
        title: '餐廳設計規劃',
        description: '專業的餐廳空間設計，從概念到實作全程服務',
      },
      {
        title: '廚房設備安裝',
        description: '專業廚房設備安裝與配置，確保高效運作',
      },
      {
        title: '水電工程',
        description: '餐廳專用水電系統設計與安裝',
      },
      {
        title: '空調通風系統',
        description: '專業空調與通風系統安裝，確保舒適環境',
      },
      {
        title: '消防系統',
        description: '符合法規的消防系統設計與安裝',
      },
      {
        title: '裝修工程',
        description: '室內裝修、地板、牆面等整體裝修服務',
      },
    ],
  },
  features: {
    title: '服務特色',
    description: '我們致力於為客戶提供最優質的工程服務，確保每個項目都能完美完成',
    items: [
      {
        title: '專業團隊',
        description: '擁有豐富餐廳工程經驗的專業團隊',
      },
      {
        title: '品質保證',
        description: '使用優質材料，提供品質保證',
      },
      {
        title: '快速施工',
        description: '高效施工流程，縮短營業中斷時間',
      },
      {
        title: '售後服務',
        description: '完善的售後服務與維護保養',
      },
    ],
  },
  contact: {
    title: '立即諮詢',
    description:
      '專業團隊為您提供免費諮詢與報價服務，讓我們為您的餐廳工程提供最佳解決方案',
    button1Text: '聯絡我們',
    button2Text: '免費報價',
  },
} as const;

type RestaurantConstructionAreas = typeof DEFAULT_AREAS;

const SERVICE_ICON_CONFIG = [
  { icon: WrenchScrewdriverIcon, color: 'bg-emerald-500' },
  { icon: BoltIcon, color: 'bg-blue-500' },
  { icon: FireIcon, color: 'bg-amber-500' },
  { icon: CloudIcon, color: 'bg-purple-500' },
  { icon: ShieldCheckIcon, color: 'bg-red-500' },
  { icon: HammerIcon, color: 'bg-cyan-500' },
] as const;

const FEATURE_ICON_CONFIG = [
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
] as const;

export default function RestaurantConstructionPage() {
  const { isAdmin } = useAuth();
  const [areas, setAreas] = useState<RestaurantConstructionAreas>(DEFAULT_AREAS);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [tempAreas, setTempAreas] = useState<RestaurantConstructionAreas>(DEFAULT_AREAS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // Use API route which uses admin SDK and works for non-logged-in users
        const response = await fetch('/api/pages/restaurant-construction');
        if (cancelled) return;
        
        if (!response.ok) {
          throw new Error('Failed to fetch page data');
        }
        
        const result = await response.json();
        if (result.success && result.page?.areas) {
          // API already merges defaults with CMS data, use it directly
          setAreas(result.page.areas as RestaurantConstructionAreas);
          setTempAreas(result.page.areas as RestaurantConstructionAreas);
        } else {
          // Fallback to defaults if API returns no areas
          setAreas(DEFAULT_AREAS);
          setTempAreas(DEFAULT_AREAS);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load restaurant construction content:', error);
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
      const pageRef = doc(db, 'pages', 'restaurant-construction');
      await setDoc(pageRef, {
        title: 'restaurant-construction',
        slug: 'restaurant-construction',
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

  const EditableText = ({ 
    value, 
    path, 
    className = '',
    as: Component = 'p',
    multiline = false 
  }: { 
    value: string; 
    path: string[]; 
    className?: string;
    as?: keyof JSX.IntrinsicElements;
    multiline?: boolean;
  }) => {
    const isEditing = editingSection === path[0];
    const displayValue = isEditing ? (tempAreas as any)[path[0]]?.[path[1]] || value : value;

    if (isEditing && isAdmin) {
      return multiline ? (
        <textarea
          value={displayValue}
          onChange={(e) => updateArea(path, e.target.value)}
          className={`w-full ${className} border-2 border-blue-500 rounded p-2`}
          rows={3}
        />
      ) : (
        <input
          type="text"
          value={displayValue}
          onChange={(e) => updateArea(path, e.target.value)}
          className={`w-full ${className} border-2 border-blue-500 rounded p-2`}
        />
      );
    }

    return <Component className={className}>{value}</Component>;
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
              <div className="w-full h-full bg-gradient-to-r from-emerald-600 to-emerald-800">
                <div className="absolute inset-0 bg-black opacity-20"></div>
                <div className="relative h-full flex items-center justify-center">
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <div className="text-center text-gray-600">
                      <p className="text-lg font-semibold">商業工程 Banner</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Services Section */}
      <section className="relative py-20">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {areas.services.items.map((service, index) => {
              return (
                <div
                  key={`${service.title}-${index}`}
                  className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow relative"
                >
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
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
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
            {areas.features.items.map((feature, index) => {
              return (
                <div key={`${feature.title}-${index}`} className="text-center relative">
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
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
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
                  className="bg-white text-emerald-600 px-8 py-4 rounded-lg font-semibold border-2 border-blue-500 text-center"
                />
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                {areas.contact.title}
              </h2>
              <p className="text-xl text-emerald-100 mb-8 max-w-3xl mx-auto">
                {areas.contact.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://wa.me/85298636938?text=您好，我想查詢。"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-emerald-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center"
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
