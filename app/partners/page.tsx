'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import PartnerApplicationForm from '@/components/partners/PartnerApplicationForm';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/AuthProvider';
import toast from 'react-hot-toast';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ImageUploader } from '@/components/ui/ImageUploader';

const DEFAULT_AREAS = {
  banner: {
    title: '合作夥伴 Banner',
    subtitle: 'Dummy Banner Image',
    imageUrl: '',
  },
  hero: {
    title: '餐廳食材採購，一站式完成',
    description: 'iFoodPulse 食材採購平台，讓餐廳主管與主廚可以在數分鐘內完成補貨、掌握成本，並獲得專人支援與點數回饋。',
    button1Text: '立即申請合作',
    button2Text: '了解平台優勢',
  },
  benefits: {
    badge: '餐廳專屬採購優勢',
    title: '加入 iFoodPulse，讓廚房運作更有效率',
    description: '我們整合熱門食材、耗材與飲品供應商，並透過點數結帳與補貨提醒，協助餐廳團隊減少溝通成本、專注料理品質。',
    items: [
  {
    title: '一鍵補貨，節省時間',
    description: '集中管理常用食材清單，快速加入購物車即可完成補貨，免去逐一聯絡供應商的麻煩。',
  },
  {
    title: '透明價格與點數結帳',
    description: '平台提供即時價格與點數結帳功能，協助餐廳掌握採購預算並享受回饋方案。',
  },
  {
    title: '多品類食材一次搞定',
    description: '從新鮮食材、乾貨到調味配料，餐廳可以在同一平台完成採購，降低庫存壓力。',
  },
  {
    title: '營運數據與提醒',
    description: '系統提供採購紀錄、常用品項提醒與即將缺貨通知，協助廚房穩定運作。',
  },
    ],
  },
  orderingExperience: {
    badge: '智慧採購流程',
    title: '量身打造的採購體驗',
    description: '無論是中央廚房或獨立餐廳，iFoodPulse 讓管理者、主廚與採購人員可以在同一平台搜尋食材、比價與下單，過程清楚、快速且可追蹤。',
    tipTitle: '貼心小提醒',
    tipText: '任何時間都可以登入平台追蹤下單進度、補充備貨或下載統計報表，餐廳營運更安心。',
    items: [
  {
    title: '個人化主頁',
    points: [
      '登入後立即看到餐廳常用食材與優惠資訊。',
      '依據餐廳菜單與季節推薦適合的採購項目。',
      '支援多分店切換，集中管理採購需求。',
    ],
  },
  {
    title: '直覺式下單流程',
    points: [
      '快速搜尋品項、瀏覽圖片與規格說明。',
      '收藏、常用清單與一鍵補貨功能讓下單更順手。',
      '系統自動計算點數與金額，結帳流程不到三分鐘。',
    ],
  },
  {
    title: '採購歷史與報表',
    points: [
      '查看每週、每月採購統計，掌握食材成本走勢。',
      '匯出訂單紀錄，方便內部對帳與成本分析。',
      '設定補貨提醒，避免缺料影響營運。',
    ],
  },
    ],
    steps: [
  {
        number: '1',
        title: '查找與收藏更簡單',
        description: '依菜色、品類或關鍵字快速搜尋食材，將常用品加入收藏或常用清單，備貨時一鍵加購即可完成。',
  },
  {
        number: '2',
        title: '透明結帳與點數回饋',
        description: '清楚看到單價、總額與點數折抵，支援多種支付方式並可設定預算上限，確保成本掌握在手。',
  },
  {
        number: '3',
        title: '提醒、報表與協作',
        description: '系統提供補貨提醒、採購報表與權限設定，讓團隊協作、審批與庫存調整更有依據。',
  },
    ],
  },
  requirements: {
    title: '加入資格',
    description: '歡迎香港各類餐廳、咖啡館、中央廚房與連鎖品牌加入，與我們一起打造更順暢的食材採購體驗。',
    items: [
  '註冊公司並持有有效的餐飲相關營業或食品處理牌照',
  '同意遵守平台採購與支付規範，維護良好交易信用',
  '提供餐廳基本資料與聯絡方式，以便平台確認會員資格',
  '願意配合平台的點數與結帳機制，享受整合採購服務',
  '致力於長期合作與營運成長，共同提升用餐體驗',
    ],
  },
  applicationSteps: {
    title: '加入步驟',
    items: [
  {
    title: '提交申請',
    description: '填寫餐廳與採購需求資訊，建立平台帳戶。',
  },
  {
    title: '資格審核',
    description: '專員確認餐廳營運資料並完成會員驗證。',
  },
  {
    title: '開始採購',
    description: '登入平台挑選食材、使用點數結帳並追蹤訂單。',
  },
    ],
  },
  cta: {
    title: '幫助餐廳更快找到好食材，就從 iFoodPulse 開始',
    description: '立即加入食材採購平台，體驗快速補貨、清楚結帳與專人支援帶來的效率提升。',
    button1Text: '立即申請合作',
    button2Text: '取得專人協助',
    button2Link: 'mailto:partners@ifoodpulse.com',
  },
} as const;

type PartnersAreas = typeof DEFAULT_AREAS;

export default function Partners() {
  const { isAdmin } = useAuth();
  const [areas, setAreas] = useState<PartnersAreas>(DEFAULT_AREAS);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [tempAreas, setTempAreas] = useState<PartnersAreas>(DEFAULT_AREAS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // Use API route which uses admin SDK and works for non-logged-in users
        const response = await fetch('/api/pages/partners');
        if (cancelled) return;
        
        if (!response.ok) {
          throw new Error('Failed to fetch page data');
        }
        
        const result = await response.json();
        if (result.success && result.page?.areas) {
          const loadedAreas = { ...DEFAULT_AREAS, ...result.page.areas };
          setAreas(loadedAreas as PartnersAreas);
          setTempAreas(loadedAreas as PartnersAreas);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load partners content:', error);
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
      const pageRef = doc(db, 'pages', 'partners');
      await setDoc(pageRef, {
        title: 'partners',
        slug: 'partners',
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
              <div className="w-full h-full bg-gradient-to-r from-emerald-600 to-emerald-800">
                <div className="absolute inset-0 bg-black opacity-20"></div>
                <div className="relative h-full flex items-center justify-center">
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <div className="text-center text-gray-600">
                      <p className="text-lg font-semibold">合作夥伴 Banner</p>
            </div>
          </div>
        </div>
      </div>
            )}
          </>
        )}
      </section>

      {/* Core Benefits */}
      <section id="benefits" className="relative py-20">
        <EditButton section="benefits" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            {editingSection === 'benefits' && isAdmin ? (
              <>
                <input
                  type="text"
                  value={tempAreas.benefits.badge}
                  onChange={(e) => updateArea(['benefits', 'badge'], e.target.value)}
                  className="inline-flex items-center px-4 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold mb-4 w-full border-2 border-blue-500 rounded p-2"
                  placeholder="餐廳專屬採購優勢"
                />
                <input
                  type="text"
                  value={tempAreas.benefits.title}
                  onChange={(e) => updateArea(['benefits', 'title'], e.target.value)}
                  className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 w-full border-2 border-blue-500 rounded p-2"
                  placeholder="加入 iFoodPulse，讓廚房運作更有效率"
                />
                <textarea
                  value={tempAreas.benefits.description}
                  onChange={(e) => updateArea(['benefits', 'description'], e.target.value)}
                  className="text-lg text-gray-600 max-w-3xl mx-auto w-full border-2 border-blue-500 rounded p-2"
                  rows={2}
                  placeholder="我們整合熱門食材、耗材與飲品供應商，並透過點數結帳與補貨提醒，協助餐廳團隊減少溝通成本、專注料理品質。"
                />
                <div className="mt-6">
                  <a href="/partners/apply" className="inline-block bg-[#0B8628] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#0a6f21] transition-colors">
                    立即申請合作
                  </a>
                </div>
              </>
            ) : (
              <>
            <span className="inline-flex items-center px-4 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold mb-4">
                  {areas.benefits.badge}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {areas.benefits.title}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  {areas.benefits.description}
            </p>
            <div className="mt-6">
              <a href="/partners/apply" className="inline-block bg-[#0B8628] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#0a6f21] transition-colors">
                立即申請合作
              </a>
            </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {areas.benefits.items.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                {editingSection === 'benefits' && isAdmin ? (
                  <>
                    <input
                      type="text"
                      value={tempAreas.benefits.items[index].title}
                      onChange={(e) => {
                        const newItems = [...tempAreas.benefits.items];
                        newItems[index] = { ...newItems[index], title: e.target.value as any };
                        setTempAreas((prev) => ({ ...prev, benefits: { ...prev.benefits, items: newItems as unknown as PartnersAreas['benefits']['items'] } }));
                      }}
                      className="text-xl font-semibold text-gray-900 mb-3 w-full border-2 border-blue-500 rounded p-2"
                    />
                    <textarea
                      value={tempAreas.benefits.items[index].description}
                      onChange={(e) => {
                        const newItems = [...tempAreas.benefits.items];
                        newItems[index] = { ...newItems[index], description: e.target.value as any };
                        setTempAreas((prev) => ({ ...prev, benefits: { ...prev.benefits, items: newItems as unknown as PartnersAreas['benefits']['items'] } }));
                      }}
                      className="text-gray-600 leading-relaxed w-full border-2 border-blue-500 rounded p-2"
                      rows={3}
                    />
                  </>
                ) : (
                  <>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements & Process */}
      <section className="relative py-20 bg-gray-50">
        <EditButton section="requirements" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              {editingSection === 'requirements' && isAdmin ? (
                <>
                  <input
                    type="text"
                    value={tempAreas.requirements.title}
                    onChange={(e) => updateArea(['requirements', 'title'], e.target.value)}
                    className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 w-full border-2 border-blue-500 rounded p-2"
                    placeholder="加入資格"
                  />
                  <textarea
                    value={tempAreas.requirements.description}
                    onChange={(e) => updateArea(['requirements', 'description'], e.target.value)}
                    className="text-lg text-gray-600 mb-6 w-full border-2 border-blue-500 rounded p-2"
                    rows={3}
                    placeholder="歡迎香港各類餐廳、咖啡館、中央廚房與連鎖品牌加入，與我們一起打造更順暢的食材採購體驗。"
                  />
                  <ul className="space-y-4">
                    {tempAreas.requirements.items.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <div className="flex-shrink-0 w-6 h-6 bg-[#0B8628] text-white rounded-full flex items-center justify-center text-sm font-bold mr-4">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const newItems = [...tempAreas.requirements.items];
                            newItems[index] = e.target.value as any;
                            setTempAreas((prev) => ({ ...prev, requirements: { ...prev.requirements, items: newItems as unknown as PartnersAreas['requirements']['items'] } }));
                          }}
                          className="text-gray-700 leading-relaxed flex-1 border-2 border-blue-500 rounded p-2"
                        />
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{areas.requirements.title}</h2>
              <p className="text-lg text-gray-600 mb-6">
                    {areas.requirements.description}
              </p>
              <ul className="space-y-4">
                    {areas.requirements.items.map((item, index) => (
                      <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-[#0B8628] text-white rounded-full flex items-center justify-center text-sm font-bold mr-4">
                      {index + 1}
                    </div>
                    <span className="text-gray-700 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
                </>
              )}
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 relative">
              {isAdmin && (
                <>
                  {editingSection === 'applicationSteps' ? (
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
                  ) : (
                    <button
                      onClick={() => startEditing('applicationSteps')}
                      className="absolute top-4 right-4 bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 z-10 flex items-center gap-1"
                      title="編輯"
                    >
                      <PencilIcon className="w-4 h-4" />
                      編輯
                    </button>
                  )}
                </>
              )}
              {editingSection === 'applicationSteps' && isAdmin ? (
                <>
                  <input
                    type="text"
                    value={tempAreas.applicationSteps.title}
                    onChange={(e) => updateArea(['applicationSteps', 'title'], e.target.value)}
                    className="text-2xl font-bold text-gray-900 mb-6 w-full border-2 border-blue-500 rounded p-2"
                    placeholder="加入步驟"
                  />
                  <div className="space-y-6">
                    {tempAreas.applicationSteps.items.map((step, index) => (
                      <div key={index} className="flex items-start">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-100 text-[#0B8628] rounded-full flex items-center justify-center font-bold mr-4">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => {
                              const newItems = [...tempAreas.applicationSteps.items];
                              newItems[index] = { ...newItems[index], title: e.target.value as any };
                              setTempAreas((prev) => ({ ...prev, applicationSteps: { ...prev.applicationSteps, items: newItems as unknown as PartnersAreas['applicationSteps']['items'] } }));
                            }}
                            className="font-semibold text-gray-900 w-full border-2 border-blue-500 rounded p-2 mb-2"
                          />
                          <textarea
                            value={step.description}
                            onChange={(e) => {
                              const newItems = [...tempAreas.applicationSteps.items];
                              newItems[index] = { ...newItems[index], description: e.target.value as any };
                              setTempAreas((prev) => ({ ...prev, applicationSteps: { ...prev.applicationSteps, items: newItems as unknown as PartnersAreas['applicationSteps']['items'] } }));
                            }}
                            className="text-sm text-gray-600 mt-1 leading-relaxed w-full border-2 border-blue-500 rounded p-2"
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">{areas.applicationSteps.title}</h3>
              <div className="space-y-6">
                    {areas.applicationSteps.items.map((step, index) => (
                      <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 text-[#0B8628] rounded-full flex items-center justify-center font-bold mr-4">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{step.title}</h4>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 bg-[#0B8628] text-white">
        <EditButton section="cta" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {editingSection === 'cta' && isAdmin ? (
            <>
              <input
                type="text"
                value={tempAreas.cta.title}
                onChange={(e) => updateArea(['cta', 'title'], e.target.value)}
                className="text-3xl md:text-4xl font-bold mb-4 w-full bg-white/10 border-2 border-white rounded p-2 text-white placeholder-white/70"
                placeholder="幫助餐廳更快找到好食材，就從 iFoodPulse 開始"
              />
              <textarea
                value={tempAreas.cta.description}
                onChange={(e) => updateArea(['cta', 'description'], e.target.value)}
                className="text-lg text-green-50 mb-8 w-full bg-white/10 border-2 border-white rounded p-2 text-white placeholder-white/70"
                rows={2}
                placeholder="立即加入食材採購平台，體驗快速補貨、清楚結帳與專人支援帶來的效率提升。"
              />
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <input
                  type="text"
                  value={tempAreas.cta.button1Text}
                  onChange={(e) => updateArea(['cta', 'button1Text'], e.target.value)}
                  className="bg-white text-[#0B8628] px-8 py-3 rounded-lg font-semibold border-2 border-blue-500 text-center"
                  placeholder="立即申請合作"
                />
              </div>
            </>
          ) : (
            <>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{areas.cta.title}</h2>
          <p className="text-lg text-green-50 mb-8">
                {areas.cta.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/partners/apply" className="bg-white text-[#0B8628] px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  {areas.cta.button1Text}
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