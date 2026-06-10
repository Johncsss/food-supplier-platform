'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { ArrowRight, Coins, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { DEFAULT_POINTS_PLANS, NormalizedPointsPlan } from '@/lib/points-plans';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ImageUploader } from '@/components/ui/ImageUploader';

const DEFAULT_AREAS = {
  banner: {
    title: 'Pricing Banner',
    subtitle: 'Dummy Banner Image',
    imageUrl: '',
  },
  hero: {
    title: '會員點數方案',
    description: '透過購買會員點數，快速補充貨品採購所需的預付餘額。每一點會員點數等同港幣，可在平台上立即使用。',
  },
  infoCard: {
    title: '一個會員點數 = 一港元',
    description: '所有會員點數方案皆以 1 點 = HK$1 計算。選擇適合餐廳規模的點數組合，自由安排採購。',
    buttonText: '前往購買點數',
  },
  features: [
    {
      icon: 'Sparkles',
      title: '彈性購買',
      description: '依需求自由選擇會員點數方案，沒有綁約。點數立即入帳，隨時可用於採購。',
    },
    {
      icon: 'ShieldCheck',
      title: '專人審核保障',
      description: '上傳轉帳收據後，由專員快速審核，確保資金安全並立即啟用會員點數。',
    },
    {
      icon: 'RefreshCw',
      title: '即時同步',
      description: '點數餘額會在審核通過後同步顯示於「帳戶」與「購買點數」介面，方便後續訂購。',
    },
  ],
  faq: {
    title: '常見問題',
    items: [
      {
        question: '點數如何購買與使用？',
        answer: '登入帳戶後前往「購買點數」，選擇方案並匯款，上傳收據後待審核通過，點數即會入帳供下單使用。',
      },
      {
        question: '點數有使用期限嗎？',
        answer: '點數目前無到期日，可在任何時候使用。若有未使用點數，可隨時在「帳戶」頁面查看餘額。',
      },
      {
        question: '可以一次購買大量點數嗎？',
        answer: '可以。若需要自訂金額或大量採購，歡迎聯繫客服，我們將協助安排專屬方案。',
      },
      {
        question: '審核需要多久？',
        answer: '工作日內通常於 1 小時內完成審核。完成後點數會立即更新，並以電子郵件通知。',
      },
    ],
  },
  cta: {
    title: '準備好補充點數了嗎？',
    description: '登入帳戶後即可選擇方案並上傳收據，快速完成付款與點數入帳。',
    button1Text: '前往購買點數',
    button2Text: '聯絡客服',
  },
} as const;

type PricingAreas = typeof DEFAULT_AREAS;

export default function Pricing() {
  const router = useRouter();
  const { firebaseUser, isAdmin } = useAuth();
  const [plans, setPlans] = useState<NormalizedPointsPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [areas, setAreas] = useState<PricingAreas>(DEFAULT_AREAS);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [tempAreas, setTempAreas] = useState<PricingAreas>(DEFAULT_AREAS);
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/points-plans');
      if (!response.ok) {
        throw new Error(`Failed to load plans (${response.status})`);
      }
      const data = await response.json();
      const normalized: NormalizedPointsPlan[] = Array.isArray(data.plans)
        ? data.plans.filter((plan: NormalizedPointsPlan) => plan.enabled !== false)
        : [];

      setPlans(normalized.length > 0 ? normalized : DEFAULT_POINTS_PLANS);
    } catch (error) {
      console.error('Failed to fetch points plans:', error);
      setFetchError('目前無法載入點數方案，已顯示預設方案。');
      toast.error('載入點數方案時發生錯誤，已使用預設值');
      setPlans(DEFAULT_POINTS_PLANS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'pages', 'pricing'));
        if (!snap.exists() || cancelled) return;
        const data = snap.data() as any;
        if (data.areas) {
          const loadedAreas = { 
            ...DEFAULT_AREAS, 
            ...data.areas,
            banner: data.areas.banner || DEFAULT_AREAS.banner,
          };
          setAreas(loadedAreas as PricingAreas);
          setTempAreas(loadedAreas as PricingAreas);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load pricing content:', error);
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
      const pageRef = doc(db, 'pages', 'pricing');
      await setDoc(pageRef, {
        title: 'pricing',
        slug: 'pricing',
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

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      Sparkles, ShieldCheck, RefreshCw
    };
    return icons[iconName] || Sparkles;
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

  const enabledPlans = useMemo(
    () => plans.filter((plan) => plan.enabled !== false),
    [plans],
  );

  const displayPlans = enabledPlans.length > 0 ? enabledPlans : DEFAULT_POINTS_PLANS;

  const handleGoToPoints = () => {
    if (firebaseUser) {
      router.push('/dashboard/points');
    } else {
      toast.error('請先登入以購買會員點數');
      router.push('/login?redirect=/dashboard/points');
    }
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
                      <p className="text-lg font-semibold">Pricing Banner</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="relative text-center mb-16">
          <EditButton section="hero" />
          {editingSection === 'hero' && isAdmin ? (
            <>
              <input
                type="text"
                value={tempAreas.hero.title}
                onChange={(e) => updateArea(['hero', 'title'], e.target.value)}
                className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 w-full border-2 border-blue-500 rounded p-2"
                placeholder="會員點數方案"
              />
              <textarea
                value={tempAreas.hero.description}
                onChange={(e) => updateArea(['hero', 'description'], e.target.value)}
                className="text-xl text-gray-600 max-w-3xl mx-auto w-full border-2 border-blue-500 rounded p-2"
                rows={3}
                placeholder="透過購買會員點數，快速補充貨品採購所需的預付餘額。每一點會員點數等同港幣，可在平台上立即使用。"
              />
            </>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {areas.hero.title}
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {areas.hero.description}
              </p>
            </>
          )}
          {fetchError && (
            <div className="mt-4 inline-flex items-center space-x-3 px-4 py-3 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800 text-sm">
              <RefreshCw className="w-4 h-4" />
              <span>{fetchError}</span>
              <button
                onClick={fetchPlans}
                className="underline font-semibold hover:text-yellow-900"
              >
                重新整理
              </button>
            </div>
          )}
        </div>

        <div className="relative bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-16">
          <EditButton section="infoCard" />
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Coins className="w-7 h-7 text-primary-600" />
              </div>
              <div className="text-left flex-1">
                {editingSection === 'infoCard' && isAdmin ? (
                  <>
                    <input
                      type="text"
                      value={tempAreas.infoCard.title}
                      onChange={(e) => updateArea(['infoCard', 'title'], e.target.value)}
                      className="text-2xl font-semibold text-gray-900 mb-2 w-full border-2 border-blue-500 rounded p-2"
                      placeholder="一個會員點數 = 一港元"
                    />
                    <textarea
                      value={tempAreas.infoCard.description}
                      onChange={(e) => updateArea(['infoCard', 'description'], e.target.value)}
                      className="text-gray-600 w-full border-2 border-blue-500 rounded p-2"
                      rows={3}
                      placeholder="所有會員點數方案皆以 1 點 = HK$1 計算。選擇適合餐廳規模的點數組合，自由安排採購。"
                    />
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">{areas.infoCard.title}</h2>
                    <p className="text-gray-600">
                      {areas.infoCard.description}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {loading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="card p-8 border border-gray-100 rounded-xl shadow-sm animate-pulse space-y-6"
              >
                <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto" />
                <div className="h-12 bg-gray-200 rounded w-2/3 mx-auto" />
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded" />
                </div>
                <div className="h-10 bg-gray-200 rounded" />
              </div>
            ))
          ) : (
            displayPlans.map((plan) => (
              <div
                key={plan.id}
                className="card p-8 border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-shadow bg-white flex flex-col"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">{plan.title}</h3>
                  <div className="p-2 bg-primary-50 rounded-full">
                    <Coins className="w-5 h-5 text-primary-600" />
                  </div>
                </div>
                <p className="text-gray-600 mb-6">
                  適合單次購買 {plan.points.toLocaleString()} 點會員點數的餐廳，立即可用於下單。
                </p>
                <div className="mb-8">
                  <div className="text-center">
                    <span className="text-4xl font-bold text-gray-900">
                      HK$ {plan.points.toLocaleString()}
                    </span>
                    <p className="text-gray-500 mt-2 text-sm">
                      每點會員點數相當於 HK$1，可於平台訂購任何產品
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <EditButton section="features" />
          {areas.features.map((feature, index) => {
            const Icon = getIcon(feature.icon);
            return (
              <div key={index} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <Icon className="w-6 h-6 text-primary-600 mb-4" />
                {editingSection === 'features' && isAdmin ? (
                  <>
                    <input
                      type="text"
                      value={tempAreas.features[index].title}
                      onChange={(e) => {
                        const newFeatures = [...tempAreas.features];
                        newFeatures[index] = { ...newFeatures[index], title: e.target.value as any };
                        setTempAreas((prev) => ({ ...prev, features: newFeatures as unknown as PricingAreas['features'] }));
                      }}
                      className="text-lg font-semibold text-gray-900 mb-2 w-full border-2 border-blue-500 rounded p-2"
                    />
                    <textarea
                      value={tempAreas.features[index].description}
                      onChange={(e) => {
                        const newFeatures = [...tempAreas.features];
                        newFeatures[index] = { ...newFeatures[index], description: e.target.value as any };
                        setTempAreas((prev) => ({ ...prev, features: newFeatures as unknown as PricingAreas['features'] }));
                      }}
                      className="text-gray-600 w-full border-2 border-blue-500 rounded p-2"
                      rows={3}
                    />
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="relative bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
          <EditButton section="faq" />
          {editingSection === 'faq' && isAdmin ? (
            <>
              <input
                type="text"
                value={tempAreas.faq.title}
                onChange={(e) => updateArea(['faq', 'title'], e.target.value)}
                className="text-2xl font-bold text-gray-900 mb-8 w-full border-2 border-blue-500 rounded p-2 text-center"
                placeholder="常見問題"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                {tempAreas.faq.items.map((item, index) => (
                  <div key={index}>
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => {
                        const newItems = [...tempAreas.faq.items];
                        newItems[index] = { ...newItems[index], question: e.target.value as any };
                        setTempAreas((prev) => ({ ...prev, faq: { ...prev.faq, items: newItems as unknown as PricingAreas['faq']['items'] } }));
                      }}
                      className="text-lg font-semibold text-gray-900 mb-3 w-full border-2 border-blue-500 rounded p-2"
                      placeholder="問題"
                    />
                    <textarea
                      value={item.answer}
                      onChange={(e) => {
                        const newItems = [...tempAreas.faq.items];
                        newItems[index] = { ...newItems[index], answer: e.target.value as any };
                        setTempAreas((prev) => ({ ...prev, faq: { ...prev.faq, items: newItems as unknown as PricingAreas['faq']['items'] } }));
                      }}
                      className="text-gray-600 w-full border-2 border-blue-500 rounded p-2"
                      rows={3}
                      placeholder="答案"
                    />
                    <button
                      onClick={() => {
                        const newItems = tempAreas.faq.items.filter((_, i) => i !== index) as unknown as PricingAreas['faq']['items'];
                        setTempAreas((prev) => ({ ...prev, faq: { ...prev.faq, items: newItems } }));
                      }}
                      className="mt-2 text-red-600 hover:text-red-800 text-sm"
                    >
                      刪除
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const newItems = [...tempAreas.faq.items, { question: '', answer: '' }];
                  setTempAreas((prev) => ({ ...prev, faq: { ...prev.faq, items: newItems as unknown as PricingAreas['faq']['items'] } }));
                }}
                className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors"
              >
                + 新增問題
              </button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{areas.faq.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                {areas.faq.items.map((item, index) => (
                  <div key={index}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {item.question}
                    </h3>
                    <p className="text-gray-600">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
} 