'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { getDefaultFooterAreas } from '@/lib/static-pages';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CmsPageDoc {
  title: string;
  slug: string;
  content?: string;
  areas?: any;
  updatedAt?: any;
}

function getDefaultAreasForSlug(slug: string) {
  if (slug === 'homepage') {
    return defaultHomepageAreas();
  }
  if (slug === 'about') {
    return defaultAboutAreas();
  }
  if (slug === 'contact') {
    return defaultContactAreas();
  }
  if (slug === 'pricing') {
    return defaultPricingAreas();
  }
  if (slug === 'partners') {
    return defaultPartnersAreas();
  }
  if (slug === 'faq') {
    return defaultFaqAreas();
  }
  if (slug === 'restaurant-construction') {
    return defaultRestaurantConstructionAreas();
  }
  if (slug === 'restaurant-furniture') {
    return defaultRestaurantFurnitureAreas();
  }
  if (slug === 'kitchen-equipment') {
    return defaultKitchenEquipmentAreas();
  }
  if (slug === 'dishes-tableware') {
    return defaultDishesTablewareAreas();
  }
  if (slug === 'promotion') {
    return defaultPromotionAreas();
  }
  if (slug === 'restaurant-maintenance') {
    return defaultRestaurantMaintenanceAreas();
  }
  if (slug === 'restaurant-systems') {
    return defaultRestaurantSystemsAreas();
  }
  if (slug === 'mobile-app') {
    return defaultMobileAppAreas();
  }
  if (slug === 'footer') {
    return defaultFooterAreas();
  }
  return undefined;
}

export default function AdminContentEditPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || '';

  const [data, setData] = useState<CmsPageDoc | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [areas, setAreas] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const uploadingCountRef = useRef(0);

  const handleUploadingChange = (uploading: boolean) => {
    if (uploading) {
      uploadingCountRef.current += 1;
    } else {
      uploadingCountRef.current = Math.max(0, uploadingCountRef.current - 1);
    }
    setIsUploading(uploadingCountRef.current > 0);
  };

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    hero: false,
    features: false,
    testimonials: false,
    cta: false,
    seo: false,
    aboutHero: false,
    aboutStats: false,
    aboutStory: false,
    aboutValues: false,
    aboutMission: false,
    aboutServices: false,
    aboutTeam: false,
    aboutContact: false,
    aboutCta: false,
    contactHero: false,
    contactInfo: false,
    contactForm: false,
    contactDepartments: false,
    contactOffice: false,
    contactMap: false,
    contactFaq: false,
    pricingHero: false,
    pricingPlans: false,
    pricingFaq: false,
    pricingCta: false,
    partnersHero: false,
    partnersBenefits: false,
    partnersTypes: false,
    partnersRequirements: false,
    partnersCta: false,
    faqHero: false,
    faqQuestions: false,
    mobileBanners: false,
    mobilePromotionalBanners: false,
    mobileLongBanners: false,
    mobileCartBanner: false,
    mobileOrdersBanner: false,
    mobilePaymentMethods: false,
    mobileSquareBanners: false,
    mobilePopupBanner: false,
    mobileLogo: false,
    mobileCategories: false,
    footerCompany: false,
    footerQuickLinks: false,
    footerContact: false,
    footerBottom: false,
  });

  const pageRef = useMemo(() => doc(db, 'pages', slug), [slug]);
  const updateArea = (path: (string | number)[], value: any) => {
    setAreas((prev: any) => updateNested(prev, path, value));
  };

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setLoading(true);
        const snap = await getDoc(pageRef);
        const defaultAreas = getDefaultAreasForSlug(slug);
        if (!snap.exists()) {
          const init: CmsPageDoc = { title: slug, slug, content: '', areas: defaultAreas };
          setData(init);
          setTitle(init.title);
          setContent(init.content || '');
          setAreas(init.areas || null);
        } else {
          const d = snap.data() as any;
          const page: CmsPageDoc = {
            title: d.title || slug,
            slug: d.slug || slug,
            content: d.content || '',
            areas: d.areas || defaultAreas,
            updatedAt: d.updatedAt,
          };
          setData(page);
          setTitle(page.title);
          setContent(page.content || '');
          // Ensure paymentMethods is initialized for mobile-app
          const areasToSet = page.areas || defaultAreas;
          if (slug === 'mobile-app' && (!areasToSet?.paymentMethods || !Array.isArray(areasToSet.paymentMethods))) {
            areasToSet.paymentMethods = [];
          }
          setAreas(areasToSet || null);
        }
      } catch (e: any) {
        setError(e?.message || '載入失敗');
      } finally {
        setLoading(false);
      }
    };
    if (slug) load();
  }, [pageRef, slug]);

  const save = async () => {
    try {
      setError(null);
      setSaving(true);
      const defaultAreas = getDefaultAreasForSlug(slug);
      await setDoc(pageRef, {
        title: title || slug,
        slug,
        content,
        areas: defaultAreas ? (areas || defaultAreas) : undefined,
        updatedAt: Timestamp.now(),
      }, { merge: true });
      setSaved(true);
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('cms-updates');
          bc.postMessage({ type: 'pageSaved', slug });
          bc.close();
        }
      } catch {
        // ignore broadcast failures
      }
      setTimeout(() => setSaved(false), 1500);
    } catch (e: any) {
      setError(e?.message || '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">編輯頁面</h2>
          <div className="text-sm text-gray-500">/{slug}</div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/content" className="px-3 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200">返回</Link>
          <button
            onClick={save}
            disabled={saving || isUploading}
            className={`px-4 py-2 text-sm rounded-lg text-white ${saving || isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
          >
            {isUploading ? '上傳中...' : saving ? '儲存中...' : saved ? '已儲存' : '儲存'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
      )}
      {uploadError && (
        <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">
          {uploadError}
          <button
            onClick={() => setUploadError(null)}
            className="ml-2 text-red-800 hover:text-red-900 underline"
          >
            關閉
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-gray-600">載入中...</div>
      ) : (
        <div className="space-y-6">
          <div>
            <label className="block mb-1 text-sm text-gray-600">標題</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
              placeholder="請輸入標題"
            />
          </div>
          {slug === 'homepage' ? (
            <div className="space-y-6">
              <SectionCard 
                title="Hero 區塊" 
                isExpanded={expandedSections.hero}
                onToggle={() => setExpandedSections(prev => ({ ...prev, hero: !prev.hero }))}
              >
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Hero Banner 圖片</label>
                    <ImageUploader
                      value={areas?.hero?.bannerImageUrl || ''}
                      onChange={(url) => updateArea(['hero','bannerImageUrl'], url)}
                      className="w-full"
                      folder="homepage_banners"
                      onUploadingChange={handleUploadingChange}
                    />
                    <p className="mt-1 text-xs text-gray-500">建議尺寸: 1920x600px 或更高解析度</p>
                  </div>
                  <TextField label="主標題" value={areas?.hero?.title || ''} onChange={(v) => updateArea(['hero','title'], v)} placeholder="為餐廳提供優質食品供應" />
                  <TextField label="主標題強調文字 (span)" value={areas?.hero?.titleSpan || ''} onChange={(v) => updateArea(['hero','titleSpan'], v)} placeholder="餐廳" />
                  <TextArea label="描述" value={areas?.hero?.description || ''} onChange={(v) => updateArea(['hero','description'], v)} placeholder="透過iFoodPulse，獲得新鮮食材、優質肉類以及經營餐廳所需的一切。" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField label="按鈕 1 文字" value={areas?.hero?.button1Text || ''} onChange={(v) => updateArea(['hero','button1Text'], v)} placeholder="開始您的會員資格" />
                    <TextField label="按鈕 1 連結" value={areas?.hero?.button1Link || ''} onChange={(v) => updateArea(['hero','button1Link'], v)} placeholder="/partners/apply" />
                    <TextField label="按鈕 2 文字" value={areas?.hero?.button2Text || ''} onChange={(v) => updateArea(['hero','button2Text'], v)} placeholder="瀏覽產品" />
                    <TextField label="按鈕 2 連結" value={areas?.hero?.button2Link || ''} onChange={(v) => updateArea(['hero','button2Link'], v)} placeholder="/products" />
                  </div>
                </div>
              </SectionCard>
              <SectionCard 
                title="特色區塊 (Features)" 
                isExpanded={expandedSections.features}
                onToggle={() => setExpandedSections(prev => ({ ...prev, features: !prev.features }))}
              >
                <div className="grid grid-cols-1 gap-6">
                  <TextField label="區塊標題" value={areas?.features?.title || ''} onChange={(v) => updateArea(['features','title'], v)} placeholder="為什麼選擇高質食品供應商？" />
                  <TextArea label="區塊描述" value={areas?.features?.description || ''} onChange={(v) => updateArea(['features','description'], v)} placeholder="我們以優質品質和可靠服務提供餐廳所需的一切。" />
                  
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold mb-4 text-gray-700">特色項目</h4>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <h5 className="text-sm font-medium mb-3">特色 1: 快速配送</h5>
                        <TextField label="標題" value={areas?.features?.block1?.title || ''} onChange={(v) => updateArea(['features','block1','title'], v)} placeholder="快速配送" />
                        <TextArea label="描述" value={areas?.features?.block1?.description || ''} onChange={(v) => updateArea(['features','block1','description'], v)} placeholder="您的訂單將在24-48小時內送達餐廳門口。" />
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <h5 className="text-sm font-medium mb-3">特色 2: 品質保證</h5>
                        <TextField label="標題" value={areas?.features?.block2?.title || ''} onChange={(v) => updateArea(['features','block2','title'], v)} placeholder="品質保證" />
                        <TextArea label="描述" value={areas?.features?.block2?.description || ''} onChange={(v) => updateArea(['features','block2','description'], v)} placeholder="所有產品都經過精心挑選，符合最高品質標準。" />
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <h5 className="text-sm font-medium mb-3">特色 3: 24/7 支援</h5>
                        <TextField label="標題" value={areas?.features?.block3?.title || ''} onChange={(v) => updateArea(['features','block3','title'], v)} placeholder="24/7 支援" />
                        <TextArea label="描述" value={areas?.features?.block3?.description || ''} onChange={(v) => updateArea(['features','block3','description'], v)} placeholder="我們的客戶支援團隊全天候為您提供協助。" />
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <h5 className="text-sm font-medium mb-3">特色 4: 餐廳網絡</h5>
                        <TextField label="標題" value={areas?.features?.block4?.title || ''} onChange={(v) => updateArea(['features','block4','title'], v)} placeholder="餐廳網絡" />
                        <TextArea label="描述" value={areas?.features?.block4?.description || ''} onChange={(v) => updateArea(['features','block4','description'], v)} placeholder="加入我們成功餐廳的網絡，獲得獨家優惠。" />
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <h5 className="text-sm font-medium mb-3">特色 5: 優質產品</h5>
                        <TextField label="標題" value={areas?.features?.block5?.title || ''} onChange={(v) => updateArea(['features','block5','title'], v)} placeholder="優質產品" />
                        <TextArea label="描述" value={areas?.features?.block5?.description || ''} onChange={(v) => updateArea(['features','block5','description'], v)} placeholder="獲得優質食材和特色產品，豐富您的菜單。" />
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <h5 className="text-sm font-medium mb-3">特色 6: 簡易訂購</h5>
                        <TextField label="標題" value={areas?.features?.block6?.title || ''} onChange={(v) => updateArea(['features','block6','title'], v)} placeholder="簡易訂購" />
                        <TextArea label="描述" value={areas?.features?.block6?.description || ''} onChange={(v) => updateArea(['features','block6','description'], v)} placeholder="簡易的線上訂購系統，具備訂單追蹤和管理功能。" />
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
              <SectionCard 
                title="客戶見證區塊 (Testimonials)" 
                isExpanded={expandedSections.testimonials}
                onToggle={() => setExpandedSections(prev => ({ ...prev, testimonials: !prev.testimonials }))}
              >
                <div className="grid grid-cols-1 gap-6">
                  <TextField label="區塊標題" value={areas?.testimonials?.title || ''} onChange={(v) => updateArea(['testimonials','title'], v)} placeholder="我們的會員怎麼說" />
                  <TextArea label="區塊描述" value={areas?.testimonials?.description || ''} onChange={(v) => updateArea(['testimonials','description'], v)} placeholder="加入全國數千間滿意的餐廳。" />
                  
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold mb-4 text-gray-700">客戶見證項目</h4>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <h5 className="text-sm font-medium mb-3">見證 1</h5>
                        <TextField label="姓名" value={areas?.testimonials?.item1?.name || ''} onChange={(v) => updateArea(['testimonials','item1','name'], v)} placeholder="莎拉·約翰遜" />
                        <TextField label="餐廳名稱" value={areas?.testimonials?.item1?.restaurant || ''} onChange={(v) => updateArea(['testimonials','item1','restaurant'], v)} placeholder="花園小館" />
                        <TextArea label="見證內容" value={areas?.testimonials?.item1?.text || ''} onChange={(v) => updateArea(['testimonials','item1','text'], v)} placeholder="高質食品供應商改變了我們的餐廳營運。品質和可靠性無與倫比。" />
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <h5 className="text-sm font-medium mb-3">見證 2</h5>
                        <TextField label="姓名" value={areas?.testimonials?.item2?.name || ''} onChange={(v) => updateArea(['testimonials','item2','name'], v)} placeholder="陳邁克" />
                        <TextField label="餐廳名稱" value={areas?.testimonials?.item2?.restaurant || ''} onChange={(v) => updateArea(['testimonials','item2','restaurant'], v)} placeholder="金龍餐廳" />
                        <TextArea label="見證內容" value={areas?.testimonials?.item2?.text || ''} onChange={(v) => updateArea(['testimonials','item2','text'], v)} placeholder="優質服務和頂級產品。我們的顧客喜愛我們使用的食材品質。" />
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <h5 className="text-sm font-medium mb-3">見證 3</h5>
                        <TextField label="姓名" value={areas?.testimonials?.item3?.name || ''} onChange={(v) => updateArea(['testimonials','item3','name'], v)} placeholder="艾米莉·羅德里格斯" />
                        <TextField label="餐廳名稱" value={areas?.testimonials?.item3?.restaurant || ''} onChange={(v) => updateArea(['testimonials','item3','restaurant'], v)} placeholder="月神咖啡廳" />
                        <TextArea label="見證內容" value={areas?.testimonials?.item3?.text || ''} onChange={(v) => updateArea(['testimonials','item3','text'], v)} placeholder="會員計劃物超所值。我們在獲得更好產品的同時節省時間和金錢。" />
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
              <SectionCard 
                title="行動呼籲區塊 (CTA)" 
                isExpanded={expandedSections.cta}
                onToggle={() => setExpandedSections(prev => ({ ...prev, cta: !prev.cta }))}
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField label="標題" value={areas?.cta?.title || ''} onChange={(v) => updateArea(['cta','title'], v)} placeholder="準備好改變您的餐廳了嗎？" />
                  <TextArea label="描述" value={areas?.cta?.description || ''} onChange={(v) => updateArea(['cta','description'], v)} placeholder="今天就加入我們的會員計劃，開始享受優質食品供應服務。" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField label="按鈕 1 文字" value={areas?.cta?.button1Text || ''} onChange={(v) => updateArea(['cta','button1Text'], v)} placeholder="開始免費試用" />
                    <TextField label="按鈕 1 連結" value={areas?.cta?.button1Link || ''} onChange={(v) => updateArea(['cta','button1Link'], v)} placeholder="/partners/apply" />
                    <TextField label="按鈕 2 文字" value={areas?.cta?.button2Text || ''} onChange={(v) => updateArea(['cta','button2Text'], v)} placeholder="查看價格" />
                    <TextField label="按鈕 2 連結" value={areas?.cta?.button2Link || ''} onChange={(v) => updateArea(['cta','button2Link'], v)} placeholder="/pricing" />
                  </div>
                </div>
              </SectionCard>
              <SectionCard 
                title="SEO 設定" 
                isExpanded={expandedSections.seo}
                onToggle={() => setExpandedSections(prev => ({ ...prev, seo: !prev.seo }))}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField label="SEO 標題" value={areas?.seo?.title || ''} onChange={(v) => updateArea(['seo','title'], v)} />
                  <TextArea label="SEO 描述" value={areas?.seo?.description || ''} onChange={(v) => updateArea(['seo','description'], v)} />
                </div>
              </SectionCard>
            </div>
          ) : slug === 'about' ? (
            <div className="space-y-6">
              <SectionCard 
                title="Hero 區塊" 
                isExpanded={expandedSections.aboutHero}
                onToggle={() => setExpandedSections(prev => ({ ...prev, aboutHero: !prev.aboutHero }))}
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField label="標題" value={areas?.hero?.title || ''} onChange={(v) => updateArea(['hero','title'], v)} placeholder="關於我們" />
                  <TextArea label="描述" value={areas?.hero?.description || ''} onChange={(v) => updateArea(['hero','description'], v)} placeholder="專業的餐廳食材供應商，為您的餐廳提供最優質的食材和服務" />
                </div>
              </SectionCard>

              <SectionCard 
                title="統計數據區塊" 
                isExpanded={expandedSections.aboutStats}
                onToggle={() => setExpandedSections(prev => ({ ...prev, aboutStats: !prev.aboutStats }))}
              >
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">統計 1: 餐廳客戶</h5>
                    <TextField label="數值" value={areas?.stats?.stat1?.value || ''} onChange={(v) => updateArea(['stats','stat1','value'], v)} placeholder="500+" />
                    <TextField label="標籤" value={areas?.stats?.stat1?.label || ''} onChange={(v) => updateArea(['stats','stat1','label'], v)} placeholder="餐廳客戶" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">統計 2: 產品種類</h5>
                    <TextField label="數值" value={areas?.stats?.stat2?.value || ''} onChange={(v) => updateArea(['stats','stat2','value'], v)} placeholder="1000+" />
                    <TextField label="標籤" value={areas?.stats?.stat2?.label || ''} onChange={(v) => updateArea(['stats','stat2','label'], v)} placeholder="產品種類" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">統計 3: 配送服務</h5>
                    <TextField label="數值" value={areas?.stats?.stat3?.value || ''} onChange={(v) => updateArea(['stats','stat3','value'], v)} placeholder="24小時" />
                    <TextField label="標籤" value={areas?.stats?.stat3?.label || ''} onChange={(v) => updateArea(['stats','stat3','label'], v)} placeholder="配送服務" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">統計 4: 行業經驗</h5>
                    <TextField label="數值" value={areas?.stats?.stat4?.value || ''} onChange={(v) => updateArea(['stats','stat4','value'], v)} placeholder="10年+" />
                    <TextField label="標籤" value={areas?.stats?.stat4?.label || ''} onChange={(v) => updateArea(['stats','stat4','label'], v)} placeholder="行業經驗" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard 
                title="我們的故事" 
                isExpanded={expandedSections.aboutStory}
                onToggle={() => setExpandedSections(prev => ({ ...prev, aboutStory: !prev.aboutStory }))}
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField label="標題" value={areas?.story?.title || ''} onChange={(v) => updateArea(['story','title'], v)} placeholder="我們的故事" />
                  <TextArea label="段落 1" value={areas?.story?.paragraph1 || ''} onChange={(v) => updateArea(['story','paragraph1'], v)} placeholder="成立於2014年，我們從一個小型的本地食材供應商開始，逐步發展成為香港領先的餐廳食材供應商。" />
                  <TextArea label="段落 2" value={areas?.story?.paragraph2 || ''} onChange={(v) => updateArea(['story','paragraph2'], v)} placeholder="我們的使命是為餐廳提供最優質、最新鮮的食材，幫助餐廳提升菜品品質，為顧客提供更好的用餐體驗。" />
                  <TextArea label="段落 3" value={areas?.story?.paragraph3 || ''} onChange={(v) => updateArea(['story','paragraph3'], v)} placeholder="十年來，我們已經服務超過500家餐廳，建立了完善的供應鏈體系和配送網絡，成為餐廳值得信賴的合作夥伴。" />
                </div>
              </SectionCard>

              <SectionCard 
                title="我們的價值觀" 
                isExpanded={expandedSections.aboutValues}
                onToggle={() => setExpandedSections(prev => ({ ...prev, aboutValues: !prev.aboutValues }))}
              >
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">價值 1: 品質至上</h5>
                    <TextField label="標題" value={areas?.values?.value1?.title || ''} onChange={(v) => updateArea(['values','value1','title'], v)} placeholder="品質至上" />
                    <TextArea label="描述" value={areas?.values?.value1?.description || ''} onChange={(v) => updateArea(['values','value1','description'], v)} placeholder="我們只提供最優質的食材，確保每一件產品都符合最高標準。" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">價值 2: 環保永續</h5>
                    <TextField label="標題" value={areas?.values?.value2?.title || ''} onChange={(v) => updateArea(['values','value2','title'], v)} placeholder="環保永續" />
                    <TextArea label="描述" value={areas?.values?.value2?.description || ''} onChange={(v) => updateArea(['values','value2','description'], v)} placeholder="致力於可持續發展，支持本地農民，減少碳足跡。" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">價值 3: 精準配送</h5>
                    <TextField label="標題" value={areas?.values?.value3?.title || ''} onChange={(v) => updateArea(['values','value3','title'], v)} placeholder="精準配送" />
                    <TextArea label="描述" value={areas?.values?.value3?.description || ''} onChange={(v) => updateArea(['values','value3','description'], v)} placeholder="準時配送，確保食材新鮮度，讓您的餐廳運營無後顧之憂。" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">價值 4: 安全可靠</h5>
                    <TextField label="標題" value={areas?.values?.value4?.title || ''} onChange={(v) => updateArea(['values','value4','title'], v)} placeholder="安全可靠" />
                    <TextArea label="描述" value={areas?.values?.value4?.description || ''} onChange={(v) => updateArea(['values','value4','description'], v)} placeholder="所有產品都經過嚴格的安全檢測，確保食品安全。" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard 
                title="使命與願景" 
                isExpanded={expandedSections.aboutMission}
                onToggle={() => setExpandedSections(prev => ({ ...prev, aboutMission: !prev.aboutMission }))}
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField label="使命標題" value={areas?.mission?.missionTitle || ''} onChange={(v) => updateArea(['mission','missionTitle'], v)} placeholder="我們的使命" />
                  <TextArea label="使命內容" value={areas?.mission?.missionText || ''} onChange={(v) => updateArea(['mission','missionText'], v)} placeholder="為餐廳提供最優質的食材和服務，幫助餐廳提升競爭力，為顧客創造更好的用餐體驗。" />
                  <TextField label="願景標題" value={areas?.mission?.visionTitle || ''} onChange={(v) => updateArea(['mission','visionTitle'], v)} placeholder="我們的願景" />
                  <TextArea label="願景內容" value={areas?.mission?.visionText || ''} onChange={(v) => updateArea(['mission','visionText'], v)} placeholder="成為香港最受信賴的餐廳食材供應商，推動餐飲行業的可持續發展。" />
                </div>
              </SectionCard>

              <SectionCard 
                title="服務項目" 
                isExpanded={expandedSections.aboutServices}
                onToggle={() => setExpandedSections(prev => ({ ...prev, aboutServices: !prev.aboutServices }))}
              >
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">服務 1: 新鮮食材供應</h5>
                    <TextField label="標題" value={areas?.services?.service1?.title || ''} onChange={(v) => updateArea(['services','service1','title'], v)} placeholder="新鮮食材供應" />
                    <TextArea label="描述" value={areas?.services?.service1?.description || ''} onChange={(v) => updateArea(['services','service1','description'], v)} placeholder="提供各種新鮮蔬菜、水果、肉類和海鮮，確保品質和口感。" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">服務 2: 快速配送服務</h5>
                    <TextField label="標題" value={areas?.services?.service2?.title || ''} onChange={(v) => updateArea(['services','service2','title'], v)} placeholder="快速配送服務" />
                    <TextArea label="描述" value={areas?.services?.service2?.description || ''} onChange={(v) => updateArea(['services','service2','description'], v)} placeholder="24小時內送達，專業冷鏈運輸，保持食材新鮮度。" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">服務 3: 專屬客戶服務</h5>
                    <TextField label="標題" value={areas?.services?.service3?.title || ''} onChange={(v) => updateArea(['services','service3','title'], v)} placeholder="專屬客戶服務" />
                    <TextArea label="描述" value={areas?.services?.service3?.description || ''} onChange={(v) => updateArea(['services','service3','description'], v)} placeholder="一對一客戶經理，為您的餐廳提供個性化解決方案。" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">服務 4: 品質保證</h5>
                    <TextField label="標題" value={areas?.services?.service4?.title || ''} onChange={(v) => updateArea(['services','service4','title'], v)} placeholder="品質保證" />
                    <TextArea label="描述" value={areas?.services?.service4?.description || ''} onChange={(v) => updateArea(['services','service4','description'], v)} placeholder="所有產品都有品質保證，不滿意可退換貨。" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard 
                title="團隊介紹" 
                isExpanded={expandedSections.aboutTeam}
                onToggle={() => setExpandedSections(prev => ({ ...prev, aboutTeam: !prev.aboutTeam }))}
              >
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">成員 1</h5>
                    <TextField label="姓名" value={areas?.team?.member1?.name || ''} onChange={(v) => updateArea(['team','member1','name'], v)} placeholder="張志明" />
                    <TextField label="職位" value={areas?.team?.member1?.position || ''} onChange={(v) => updateArea(['team','member1','position'], v)} placeholder="創始人 & CEO" />
                    <TextArea label="描述" value={areas?.team?.member1?.description || ''} onChange={(v) => updateArea(['team','member1','description'], v)} placeholder="擁有15年食品供應鏈經驗，致力於為餐廳提供最優質的食材。" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">成員 2</h5>
                    <TextField label="姓名" value={areas?.team?.member2?.name || ''} onChange={(v) => updateArea(['team','member2','name'], v)} placeholder="李美玲" />
                    <TextField label="職位" value={areas?.team?.member2?.position || ''} onChange={(v) => updateArea(['team','member2','position'], v)} placeholder="營運總監" />
                    <TextArea label="描述" value={areas?.team?.member2?.description || ''} onChange={(v) => updateArea(['team','member2','description'], v)} placeholder="負責日常營運管理，確保服務品質和客戶滿意度。" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">成員 3</h5>
                    <TextField label="姓名" value={areas?.team?.member3?.name || ''} onChange={(v) => updateArea(['team','member3','name'], v)} placeholder="王建國" />
                    <TextField label="職位" value={areas?.team?.member3?.position || ''} onChange={(v) => updateArea(['team','member3','position'], v)} placeholder="採購經理" />
                    <TextArea label="描述" value={areas?.team?.member3?.description || ''} onChange={(v) => updateArea(['team','member3','description'], v)} placeholder="專業的食材採購團隊，與優質供應商建立長期合作關係。" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">成員 4</h5>
                    <TextField label="姓名" value={areas?.team?.member4?.name || ''} onChange={(v) => updateArea(['team','member4','name'], v)} placeholder="陳雅芳" />
                    <TextField label="職位" value={areas?.team?.member4?.position || ''} onChange={(v) => updateArea(['team','member4','position'], v)} placeholder="客戶服務經理" />
                    <TextArea label="描述" value={areas?.team?.member4?.description || ''} onChange={(v) => updateArea(['team','member4','description'], v)} placeholder="為客戶提供專業的服務支持，解決各種問題和需求。" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard 
                title="聯絡資訊" 
                isExpanded={expandedSections.aboutContact}
                onToggle={() => setExpandedSections(prev => ({ ...prev, aboutContact: !prev.aboutContact }))}
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField label="地址標題" value={areas?.contact?.addressLabel || ''} onChange={(v) => updateArea(['contact','addressLabel'], v)} placeholder="地址" />
                  <TextField label="地址內容" value={areas?.contact?.address || ''} onChange={(v) => updateArea(['contact','address'], v)} placeholder="香港九龍灣宏光道1號" />
                  <TextField label="電話標題" value={areas?.contact?.phoneLabel || ''} onChange={(v) => updateArea(['contact','phoneLabel'], v)} placeholder="電話" />
                  <TextField label="電話號碼" value={areas?.contact?.phone || ''} onChange={(v) => updateArea(['contact','phone'], v)} placeholder="+852 2345 6789" />
                  <TextField label="電郵標題" value={areas?.contact?.emailLabel || ''} onChange={(v) => updateArea(['contact','emailLabel'], v)} placeholder="電郵" />
                  <TextField label="電郵地址" value={areas?.contact?.email || ''} onChange={(v) => updateArea(['contact','email'], v)} placeholder="info@foodsupplier.com" />
                </div>
              </SectionCard>

              <SectionCard 
                title="行動呼籲區塊 (CTA)" 
                isExpanded={expandedSections.aboutCta}
                onToggle={() => setExpandedSections(prev => ({ ...prev, aboutCta: !prev.aboutCta }))}
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField label="標題" value={areas?.cta?.title || ''} onChange={(v) => updateArea(['cta','title'], v)} placeholder="準備好開始合作了嗎？" />
                  <TextArea label="描述" value={areas?.cta?.description || ''} onChange={(v) => updateArea(['cta','description'], v)} placeholder="加入我們的客戶網絡，享受專業的食材供應服務" />
                  <TextField label="按鈕 1 文字" value={areas?.cta?.button1Text || ''} onChange={(v) => updateArea(['cta','button1Text'], v)} placeholder="立即註冊" />
                  <TextField label="按鈕 1 連結" value={areas?.cta?.button1Link || ''} onChange={(v) => updateArea(['cta','button1Link'], v)} placeholder="/partners/apply" />
                  <TextField label="按鈕 2 文字" value={areas?.cta?.button2Text || ''} onChange={(v) => updateArea(['cta','button2Text'], v)} placeholder="聯絡我們" />
                  <TextField label="按鈕 2 連結" value={areas?.cta?.button2Link || ''} onChange={(v) => updateArea(['cta','button2Link'], v)} placeholder="/contact" />
                </div>
              </SectionCard>
            </div>
          ) : slug === 'contact' ? (
            <div className="space-y-6">
              <SectionCard 
                title="Hero 區塊" 
                isExpanded={expandedSections.contactHero}
                onToggle={() => setExpandedSections(prev => ({ ...prev, contactHero: !prev.contactHero }))}
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField label="標題" value={areas?.hero?.title || ''} onChange={(v) => updateArea(['hero','title'], v)} placeholder="聯絡我們" />
                  <TextArea label="描述" value={areas?.hero?.description || ''} onChange={(v) => updateArea(['hero','description'], v)} placeholder="我們隨時為您提供專業的服務支援，歡迎與我們聯繫" />
                </div>
              </SectionCard>

              <SectionCard 
                title="聯絡資訊卡片" 
                isExpanded={expandedSections.contactInfo}
                onToggle={() => setExpandedSections(prev => ({ ...prev, contactInfo: !prev.contactInfo }))}
              >
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">卡片 1: 總部地址</h5>
                    <TextField label="標題" value={areas?.contactInfo?.card1?.title || ''} onChange={(v) => updateArea(['contactInfo','card1','title'], v)} placeholder="總部地址" />
                    <TextField label="主要內容" value={areas?.contactInfo?.card1?.content || ''} onChange={(v) => updateArea(['contactInfo','card1','content'], v)} placeholder="香港九龍灣宏光道1號" />
                    <TextField label="副標題" value={areas?.contactInfo?.card1?.subtitle || ''} onChange={(v) => updateArea(['contactInfo','card1','subtitle'], v)} placeholder="九龍灣商貿中心15樓" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">卡片 2: 客服熱線</h5>
                    <TextField label="標題" value={areas?.contactInfo?.card2?.title || ''} onChange={(v) => updateArea(['contactInfo','card2','title'], v)} placeholder="客服熱線" />
                    <TextField label="主要內容" value={areas?.contactInfo?.card2?.content || ''} onChange={(v) => updateArea(['contactInfo','card2','content'], v)} placeholder="+852 2345 6789" />
                    <TextField label="副標題" value={areas?.contactInfo?.card2?.subtitle || ''} onChange={(v) => updateArea(['contactInfo','card2','subtitle'], v)} placeholder="週一至週五 9:00-18:00" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">卡片 3: 電子郵件</h5>
                    <TextField label="標題" value={areas?.contactInfo?.card3?.title || ''} onChange={(v) => updateArea(['contactInfo','card3','title'], v)} placeholder="電子郵件" />
                    <TextField label="主要內容" value={areas?.contactInfo?.card3?.content || ''} onChange={(v) => updateArea(['contactInfo','card3','content'], v)} placeholder="info@foodsupplier.com" />
                    <TextField label="副標題" value={areas?.contactInfo?.card3?.subtitle || ''} onChange={(v) => updateArea(['contactInfo','card3','subtitle'], v)} placeholder="24小時內回覆" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">卡片 4: 營業時間</h5>
                    <TextField label="標題" value={areas?.contactInfo?.card4?.title || ''} onChange={(v) => updateArea(['contactInfo','card4','title'], v)} placeholder="營業時間" />
                    <TextField label="主要內容" value={areas?.contactInfo?.card4?.content || ''} onChange={(v) => updateArea(['contactInfo','card4','content'], v)} placeholder="週一至週五 9:00-18:00" />
                    <TextField label="副標題" value={areas?.contactInfo?.card4?.subtitle || ''} onChange={(v) => updateArea(['contactInfo','card4','subtitle'], v)} placeholder="週六 9:00-14:00" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard 
                title="聯絡表單" 
                isExpanded={expandedSections.contactForm}
                onToggle={() => setExpandedSections(prev => ({ ...prev, contactForm: !prev.contactForm }))}
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField label="表單標題" value={areas?.form?.title || ''} onChange={(v) => updateArea(['form','title'], v)} placeholder="發送訊息" />
                </div>
              </SectionCard>

              <SectionCard 
                title="部門聯絡方式" 
                isExpanded={expandedSections.contactDepartments}
                onToggle={() => setExpandedSections(prev => ({ ...prev, contactDepartments: !prev.contactDepartments }))}
              >
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">部門 1: 客戶服務</h5>
                    <TextField label="標題" value={areas?.departments?.dept1?.title || ''} onChange={(v) => updateArea(['departments','dept1','title'], v)} placeholder="客戶服務" />
                    <TextField label="電話" value={areas?.departments?.dept1?.phone || ''} onChange={(v) => updateArea(['departments','dept1','phone'], v)} placeholder="+852 2345 6789" />
                    <TextField label="電子郵件" value={areas?.departments?.dept1?.email || ''} onChange={(v) => updateArea(['departments','dept1','email'], v)} placeholder="service@foodsupplier.com" />
                    <TextArea label="描述" value={areas?.departments?.dept1?.description || ''} onChange={(v) => updateArea(['departments','dept1','description'], v)} placeholder="訂單查詢、配送安排、客戶支援" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">部門 2: 採購部門</h5>
                    <TextField label="標題" value={areas?.departments?.dept2?.title || ''} onChange={(v) => updateArea(['departments','dept2','title'], v)} placeholder="採購部門" />
                    <TextField label="電話" value={areas?.departments?.dept2?.phone || ''} onChange={(v) => updateArea(['departments','dept2','phone'], v)} placeholder="+852 2345 6790" />
                    <TextField label="電子郵件" value={areas?.departments?.dept2?.email || ''} onChange={(v) => updateArea(['departments','dept2','email'], v)} placeholder="procurement@foodsupplier.com" />
                    <TextArea label="描述" value={areas?.departments?.dept2?.description || ''} onChange={(v) => updateArea(['departments','dept2','description'], v)} placeholder="供應商合作、產品採購、品質管理" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">部門 3: 配送中心</h5>
                    <TextField label="標題" value={areas?.departments?.dept3?.title || ''} onChange={(v) => updateArea(['departments','dept3','title'], v)} placeholder="配送中心" />
                    <TextField label="電話" value={areas?.departments?.dept3?.phone || ''} onChange={(v) => updateArea(['departments','dept3','phone'], v)} placeholder="+852 2345 6791" />
                    <TextField label="電子郵件" value={areas?.departments?.dept3?.email || ''} onChange={(v) => updateArea(['departments','dept3','email'], v)} placeholder="logistics@foodsupplier.com" />
                    <TextArea label="描述" value={areas?.departments?.dept3?.description || ''} onChange={(v) => updateArea(['departments','dept3','description'], v)} placeholder="配送安排、物流追蹤、倉儲管理" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard 
                title="辦公室位置" 
                isExpanded={expandedSections.contactOffice}
                onToggle={() => setExpandedSections(prev => ({ ...prev, contactOffice: !prev.contactOffice }))}
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField label="標題" value={areas?.office?.title || ''} onChange={(v) => updateArea(['office','title'], v)} placeholder="辦公室位置" />
                  <TextField label="地址主要內容" value={areas?.office?.addressMain || ''} onChange={(v) => updateArea(['office','addressMain'], v)} placeholder="香港九龍灣宏光道1號" />
                  <TextField label="地址詳細" value={areas?.office?.addressDetail || ''} onChange={(v) => updateArea(['office','addressDetail'], v)} placeholder="九龍灣商貿中心15樓" />
                  <TextField label="營業時間標題" value={areas?.office?.hoursTitle || ''} onChange={(v) => updateArea(['office','hoursTitle'], v)} placeholder="營業時間" />
                  <TextField label="營業時間平日" value={areas?.office?.hoursWeekday || ''} onChange={(v) => updateArea(['office','hoursWeekday'], v)} placeholder="週一至週五 9:00-18:00" />
                  <TextField label="營業時間週六" value={areas?.office?.hoursSaturday || ''} onChange={(v) => updateArea(['office','hoursSaturday'], v)} placeholder="週六 9:00-14:00" />
                </div>
              </SectionCard>

              <SectionCard 
                title="地圖區塊" 
                isExpanded={expandedSections.contactMap}
                onToggle={() => setExpandedSections(prev => ({ ...prev, contactMap: !prev.contactMap }))}
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField label="標題" value={areas?.map?.title || ''} onChange={(v) => updateArea(['map','title'], v)} placeholder="我們的位置" />
                  <TextField label="地址" value={areas?.map?.address || ''} onChange={(v) => updateArea(['map','address'], v)} placeholder="香港九龍灣宏光道1號" />
                </div>
              </SectionCard>

              <SectionCard 
                title="常見問題 (FAQ)" 
                isExpanded={expandedSections.contactFaq}
                onToggle={() => setExpandedSections(prev => ({ ...prev, contactFaq: !prev.contactFaq }))}
              >
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">問題 1</h5>
                    <TextField label="問題" value={areas?.faq?.q1?.question || ''} onChange={(v) => updateArea(['faq','q1','question'], v)} placeholder="如何下訂單？" />
                    <TextArea label="答案" value={areas?.faq?.q1?.answer || ''} onChange={(v) => updateArea(['faq','q1','answer'], v)} placeholder="您可以通過我們的網站註冊帳戶，瀏覽產品目錄，將所需商品加入購物車，然後完成結帳流程。" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">問題 2</h5>
                    <TextField label="問題" value={areas?.faq?.q2?.question || ''} onChange={(v) => updateArea(['faq','q2','question'], v)} placeholder="配送時間是多久？" />
                    <TextArea label="答案" value={areas?.faq?.q2?.answer || ''} onChange={(v) => updateArea(['faq','q2','answer'], v)} placeholder="我們提供24小時內配送服務，具體時間取決於您的訂單時間和配送地址。" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">問題 3</h5>
                    <TextField label="問題" value={areas?.faq?.q3?.question || ''} onChange={(v) => updateArea(['faq','q3','question'], v)} placeholder="如何查詢訂單狀態？" />
                    <TextArea label="答案" value={areas?.faq?.q3?.answer || ''} onChange={(v) => updateArea(['faq','q3','answer'], v)} placeholder="登入您的帳戶後，在「我的訂單」頁面可以查看所有訂單的詳細狀態和配送進度。" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">問題 4</h5>
                    <TextField label="問題" value={areas?.faq?.q4?.question || ''} onChange={(v) => updateArea(['faq','q4','question'], v)} placeholder="是否提供退換貨服務？" />
                    <TextArea label="答案" value={areas?.faq?.q4?.answer || ''} onChange={(v) => updateArea(['faq','q4','answer'], v)} placeholder="是的，我們提供品質保證服務。如果收到的產品有品質問題，請在24小時內聯繫我們的客服團隊。" />
                  </div>
                </div>
              </SectionCard>
            </div>
          ) : slug === 'pricing' ? (
            <div className="space-y-6">
              <SectionCard 
                title="Hero 區塊" 
                isExpanded={expandedSections.pricingHero}
                onToggle={() => setExpandedSections(prev => ({ ...prev, pricingHero: !prev.pricingHero }))}
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField label="標題" value={areas?.hero?.title || ''} onChange={(v) => updateArea(['hero','title'], v)} placeholder="會員點數方案" />
                  <TextArea label="描述" value={areas?.hero?.description || ''} onChange={(v) => updateArea(['hero','description'], v)} placeholder="透過購買會員點數，快速補充貨品採購所需的預付餘額。每一點會員點數等同港幣，可在平台上立即使用。" />
                </div>
              </SectionCard>

              <SectionCard 
                title="點數方案卡片" 
                isExpanded={expandedSections.pricingPlans}
                onToggle={() => setExpandedSections(prev => ({ ...prev, pricingPlans: !prev.pricingPlans }))}
              >
                <div className="space-y-6">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">方案 1: HK$500 方案</h5>
                    <TextField label="方案名稱" value={areas?.plans?.plan1?.name || ''} onChange={(v) => updateArea(['plans','plan1','name'], v)} placeholder="HK$500 方案" />
                    <TextField label="描述" value={areas?.plans?.plan1?.description || ''} onChange={(v) => updateArea(['plans','plan1','description'], v)} placeholder="適合首次補貨或測試平台使用" />
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <TextField label="點數 / 金額" value={areas?.plans?.plan1?.price || ''} onChange={(v) => updateArea(['plans','plan1','price'], v)} placeholder="500" />
                      <TextField label="適用情境" value={areas?.plans?.plan1?.originalPrice || ''} onChange={(v) => updateArea(['plans','plan1','originalPrice'], v)} placeholder="適合首次補貨" />
                    </div>
                    <div className="mt-3">
                      <label className="block mb-2 text-sm text-gray-600">亮點 (每行一項)</label>
                      <textarea
                        value={(areas?.plans?.plan1?.features || []).join('\n')}
                        onChange={(e) => updateArea(['plans','plan1','features'], e.target.value.split('\n').filter(f => f.trim()))}
                        className="w-full rounded-md border px-3 py-2 min-h-[150px]"
                        placeholder="一次購買 500 點會員點數&#10;點數審核通過即時入帳&#10;支援平台內所有品項"
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">方案 2: HK$1,000 方案</h5>
                    <TextField label="方案名稱" value={areas?.plans?.plan2?.name || ''} onChange={(v) => updateArea(['plans','plan2','name'], v)} placeholder="HK$1,000 方案" />
                    <TextField label="描述" value={areas?.plans?.plan2?.description || ''} onChange={(v) => updateArea(['plans','plan2','description'], v)} placeholder="適合穩定每週補貨的餐廳" />
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <TextField label="點數 / 金額" value={areas?.plans?.plan2?.price || ''} onChange={(v) => updateArea(['plans','plan2','price'], v)} placeholder="1000" />
                      <TextField label="適用情境" value={areas?.plans?.plan2?.originalPrice || ''} onChange={(v) => updateArea(['plans','plan2','originalPrice'], v)} placeholder="適合每週例行採購" />
                    </div>
                    <div className="mt-3">
                      <label className="block mb-2 text-sm text-gray-600">亮點 (每行一項)</label>
                      <textarea
                        value={(areas?.plans?.plan2?.features || []).join('\n')}
                        onChange={(e) => updateArea(['plans','plan2','features'], e.target.value.split('\n').filter(f => f.trim()))}
                        className="w-full rounded-md border px-3 py-2 min-h-[150px]"
                        placeholder="建議每週例行採購的預算&#10;支援多筆訂單與分店使用&#10;享有點數回饋與專人支援"
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">方案 3: HK$3,000 方案</h5>
                    <TextField label="方案名稱" value={areas?.plans?.plan3?.name || ''} onChange={(v) => updateArea(['plans','plan3','name'], v)} placeholder="HK$3,000 方案" />
                    <TextField label="描述" value={areas?.plans?.plan3?.description || ''} onChange={(v) => updateArea(['plans','plan3','description'], v)} placeholder="適合集中採購或多分店營運" />
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <TextField label="點數 / 金額" value={areas?.plans?.plan3?.price || ''} onChange={(v) => updateArea(['plans','plan3','price'], v)} placeholder="3000" />
                      <TextField label="適用情境" value={areas?.plans?.plan3?.originalPrice || ''} onChange={(v) => updateArea(['plans','plan3','originalPrice'], v)} placeholder="支援多分店共同使用" />
                    </div>
                    <div className="mt-3">
                      <label className="block mb-2 text-sm text-gray-600">亮點 (每行一項)</label>
                      <textarea
                        value={(areas?.plans?.plan3?.features || []).join('\n')}
                        onChange={(e) => updateArea(['plans','plan3','features'], e.target.value.split('\n').filter(f => f.trim()))}
                        className="w-full rounded-md border px-3 py-2 min-h-[150px]"
                        placeholder="一次補充大量採購額度&#10;點數餘額可隨時查詢與共享&#10;專員協助採購與物流安排"
                      />
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard 
                title="常見問題 (FAQ)" 
                isExpanded={expandedSections.pricingFaq}
                onToggle={() => setExpandedSections(prev => ({ ...prev, pricingFaq: !prev.pricingFaq }))}
              >
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">問題 1</h5>
                    <TextField label="問題" value={areas?.faq?.q1?.question || ''} onChange={(v) => updateArea(['faq','q1','question'], v)} placeholder="點數如何購買與使用？" />
                    <TextArea label="答案" value={areas?.faq?.q1?.answer || ''} onChange={(v) => updateArea(['faq','q1','answer'], v)} placeholder="登入帳戶後前往「購買點數」，選擇方案並匯款，上傳收據後待審核通過，點數即會入帳供下單使用。" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">問題 2</h5>
                    <TextField label="問題" value={areas?.faq?.q2?.question || ''} onChange={(v) => updateArea(['faq','q2','question'], v)} placeholder="點數可以共享或轉移嗎？" />
                    <TextArea label="答案" value={areas?.faq?.q2?.answer || ''} onChange={(v) => updateArea(['faq','q2','answer'], v)} placeholder="同一公司底下的授權帳號都可以共用點數餘額，方便管理採購預算與分店需求。" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">問題 3</h5>
                    <TextField label="問題" value={areas?.faq?.q3?.question || ''} onChange={(v) => updateArea(['faq','q3','question'], v)} placeholder="審核需要多久時間？" />
                    <TextArea label="答案" value={areas?.faq?.q3?.answer || ''} onChange={(v) => updateArea(['faq','q3','answer'], v)} placeholder="我們的專員會在收到收據後 1-2 個工作日內完成審核並啟用點數。" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">問題 4</h5>
                    <TextField label="問題" value={areas?.faq?.q4?.question || ''} onChange={(v) => updateArea(['faq','q4','question'], v)} placeholder="未使用的點數會過期嗎？" />
                    <TextArea label="答案" value={areas?.faq?.q4?.answer || ''} onChange={(v) => updateArea(['faq','q4','answer'], v)} placeholder="會員點數不會過期，可在需要時隨時使用。如需退款，請聯絡客戶服務團隊。" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard 
                title="行動呼籲區塊 (CTA)" 
                isExpanded={expandedSections.pricingCta}
                onToggle={() => setExpandedSections(prev => ({ ...prev, pricingCta: !prev.pricingCta }))}
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField label="標題" value={areas?.cta?.title || ''} onChange={(v) => updateArea(['cta','title'], v)} placeholder="準備好補充會員點數了嗎？" />
                  <TextArea label="描述" value={areas?.cta?.description || ''} onChange={(v) => updateArea(['cta','description'], v)} placeholder="登入會員即可在「購買點數」頁面提交收據，快速完成點數儲值並開始採購。" />
                  <TextField label="按鈕 1 文字" value={areas?.cta?.button1Text || ''} onChange={(v) => updateArea(['cta','button1Text'], v)} placeholder="前往購買點數" />
                  <TextField label="按鈕 2 文字" value={areas?.cta?.button2Text || ''} onChange={(v) => updateArea(['cta','button2Text'], v)} placeholder="了解使用流程" />
                  <TextField label="按鈕 2 連結" value={areas?.cta?.button2Link || ''} onChange={(v) => updateArea(['cta','button2Link'], v)} placeholder="/partners/apply" />
                </div>
              </SectionCard>
            </div>
          ) : slug === 'partners' ? (
            <div className="space-y-6">
              <SectionCard 
                title="Hero 區塊" 
                isExpanded={expandedSections.partnersHero}
                onToggle={() => setExpandedSections(prev => ({ ...prev, partnersHero: !prev.partnersHero }))}
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField label="標題" value={areas?.hero?.title || ''} onChange={(v) => updateArea(['hero','title'], v)} placeholder="餐廳食材採購，一站式完成" />
                  <TextArea label="描述" value={areas?.hero?.description || ''} onChange={(v) => updateArea(['hero','description'], v)} placeholder="iFoodPulse 食材採購平台，讓餐廳主管與主廚可以在數分鐘內完成補貨、掌握成本，並獲得專人支援與點數回饋。" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField label="按鈕 1 文字" value={areas?.hero?.button1Text || ''} onChange={(v) => updateArea(['hero','button1Text'], v)} placeholder="立即申請合作" />
                    <TextField label="按鈕 2 文字" value={areas?.hero?.button2Text || ''} onChange={(v) => updateArea(['hero','button2Text'], v)} placeholder="了解平台優勢" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard 
                title="合作優勢區塊" 
                isExpanded={expandedSections.partnersBenefits}
                onToggle={() => setExpandedSections(prev => ({ ...prev, partnersBenefits: !prev.partnersBenefits }))}
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField label="區塊標題" value={areas?.benefits?.title || ''} onChange={(v) => updateArea(['benefits','title'], v)} placeholder="餐廳專屬採購優勢" />
                  <TextArea label="區塊描述" value={areas?.benefits?.description || ''} onChange={(v) => updateArea(['benefits','description'], v)} placeholder="我們整合熱門食材、耗材與飲品供應商，並透過點數結帳與補貨提醒，協助餐廳團隊減少溝通成本、專注料理品質。" />
                  <div className="space-y-4 mt-4">
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h5 className="text-sm font-medium mb-3">優勢 1</h5>
                      <TextField label="標題" value={areas?.benefits?.benefit1?.title || ''} onChange={(v) => updateArea(['benefits','benefit1','title'], v)} placeholder="一鍵補貨，節省時間" />
                      <TextArea label="描述" value={areas?.benefits?.benefit1?.description || ''} onChange={(v) => updateArea(['benefits','benefit1','description'], v)} placeholder="集中管理常用食材清單，快速加入購物車即可完成補貨，免去逐一聯絡供應商的麻煩。" />
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h5 className="text-sm font-medium mb-3">優勢 2</h5>
                      <TextField label="標題" value={areas?.benefits?.benefit2?.title || ''} onChange={(v) => updateArea(['benefits','benefit2','title'], v)} placeholder="透明價格與點數結帳" />
                      <TextArea label="描述" value={areas?.benefits?.benefit2?.description || ''} onChange={(v) => updateArea(['benefits','benefit2','description'], v)} placeholder="平台提供即時價格與點數結帳功能，協助餐廳掌握採購預算並享受回饋方案。" />
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h5 className="text-sm font-medium mb-3">優勢 3</h5>
                      <TextField label="標題" value={areas?.benefits?.benefit3?.title || ''} onChange={(v) => updateArea(['benefits','benefit3','title'], v)} placeholder="多品類食材一次搞定" />
                      <TextArea label="描述" value={areas?.benefits?.benefit3?.description || ''} onChange={(v) => updateArea(['benefits','benefit3','description'], v)} placeholder="從新鮮食材、乾貨到調味配料，餐廳可以在同一平台完成採購，降低庫存壓力。" />
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h5 className="text-sm font-medium mb-3">優勢 4</h5>
                      <TextField label="標題" value={areas?.benefits?.benefit4?.title || ''} onChange={(v) => updateArea(['benefits','benefit4','title'], v)} placeholder="營運數據與提醒" />
                      <TextArea label="描述" value={areas?.benefits?.benefit4?.description || ''} onChange={(v) => updateArea(['benefits','benefit4','description'], v)} placeholder="系統提供採購紀錄、常用品項提醒與即將缺貨通知，協助廚房穩定運作。" />
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard 
                title="採購體驗特色" 
                isExpanded={expandedSections.partnersTypes}
                onToggle={() => setExpandedSections(prev => ({ ...prev, partnersTypes: !prev.partnersTypes }))}
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField label="區塊標題" value={areas?.partnershipTypes?.title || ''} onChange={(v) => updateArea(['partnershipTypes','title'], v)} placeholder="量身打造的採購體驗" />
                  <TextArea label="區塊描述" value={areas?.partnershipTypes?.description || ''} onChange={(v) => updateArea(['partnershipTypes','description'], v)} placeholder="登入後即可查看常用食材與採購提醒，流程清楚快速，支援多分店協作與權限管理。" />
                  <div className="space-y-4 mt-4">
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h5 className="text-sm font-medium mb-3">重點 1</h5>
                      <TextField label="標題" value={areas?.partnershipTypes?.type1?.title || ''} onChange={(v) => updateArea(['partnershipTypes','type1','title'], v)} placeholder="個人化主頁" />
                      <TextArea label="描述" value={areas?.partnershipTypes?.type1?.description || ''} onChange={(v) => updateArea(['partnershipTypes','type1','description'], v)} placeholder="登入後立即看到餐廳常用食材與優惠資訊，支援多分店切換與快速補貨。" />
                      <div className="mt-3">
                        <label className="block mb-2 text-sm text-gray-600">重點列表 (每行一項)</label>
                        <textarea
                          value={(areas?.partnershipTypes?.type1?.features || []).join('\n')}
                          onChange={(e) => updateArea(['partnershipTypes','type1','features'], e.target.value.split('\n').filter(f => f.trim()))}
                          className="w-full rounded-md border px-3 py-2 min-h-[100px]"
                          placeholder="常用品項即時顯示&#10;依菜單推薦採購項目&#10;支援多店面切換"
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h5 className="text-sm font-medium mb-3">重點 2</h5>
                      <TextField label="標題" value={areas?.partnershipTypes?.type2?.title || ''} onChange={(v) => updateArea(['partnershipTypes','type2','title'], v)} placeholder="直覺式下單流程" />
                      <TextArea label="描述" value={areas?.partnershipTypes?.type2?.description || ''} onChange={(v) => updateArea(['partnershipTypes','type2','description'], v)} placeholder="快速搜尋品項、瀏覽圖片與規格說明，系統自動計算點數與金額，三分鐘內完成結帳。" />
                      <div className="mt-3">
                        <label className="block mb-2 text-sm text-gray-600">重點列表 (每行一項)</label>
                        <textarea
                          value={(areas?.partnershipTypes?.type2?.features || []).join('\n')}
                          onChange={(e) => updateArea(['partnershipTypes','type2','features'], e.target.value.split('\n').filter(f => f.trim()))}
                          className="w-full rounded-md border px-3 py-2 min-h-[100px]"
                          placeholder="快速搜尋與圖片比對&#10;收藏與常用清單一鍵補貨&#10;自動計算點數與金額"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard 
                title="申請條件與流程" 
                isExpanded={expandedSections.partnersRequirements}
                onToggle={() => setExpandedSections(prev => ({ ...prev, partnersRequirements: !prev.partnersRequirements }))}
              >
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <TextField label="要求區塊標題" value={areas?.requirements?.title || ''} onChange={(v) => updateArea(['requirements','title'], v)} placeholder="申請條件" />
                    <TextArea label="要求區塊描述" value={areas?.requirements?.description || ''} onChange={(v) => updateArea(['requirements','description'], v)} placeholder="我們尋求具有專業能力和良好信譽的餐廳合作夥伴，攜手提升採購效率與用餐體驗。" />
                    <div className="mt-3">
                      <label className="block mb-2 text-sm text-gray-600">要求列表 (每行一項)</label>
                      <textarea
                        value={(areas?.requirements?.requirementsList || []).join('\n')}
                        onChange={(e) => updateArea(['requirements','requirementsList'], e.target.value.split('\n').filter(f => f.trim()))}
                        className="w-full rounded-md border px-3 py-2 min-h-[150px]"
                        placeholder="註冊公司並持有有效的餐飲相關營業或食品處理牌照&#10;同意遵守平台採購與支付規範，維護良好交易信用&#10;提供餐廳基本資料與聯絡方式，以便平台確認會員資格&#10;願意配合平台的點數與結帳機制，享受整合採購服務&#10;致力於長期合作與營運成長，共同提升用餐體驗"
                      />
                    </div>
                  </div>
                  <div className="border-t pt-6">
                    <TextField label="申請流程標題" value={areas?.requirements?.processTitle || ''} onChange={(v) => updateArea(['requirements','processTitle'], v)} placeholder="加入流程" />
                    <div className="space-y-4 mt-4">
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <h5 className="text-sm font-medium mb-3">步驟 1</h5>
                        <TextField label="標題" value={areas?.requirements?.step1?.title || ''} onChange={(v) => updateArea(['requirements','step1','title'], v)} placeholder="提交申請" />
                        <TextArea label="描述" value={areas?.requirements?.step1?.description || ''} onChange={(v) => updateArea(['requirements','step1','description'], v)} placeholder="填寫餐廳與採購需求資訊，建立平台帳戶。" />
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <h5 className="text-sm font-medium mb-3">步驟 2</h5>
                        <TextField label="標題" value={areas?.requirements?.step2?.title || ''} onChange={(v) => updateArea(['requirements','step2','title'], v)} placeholder="資格審核" />
                        <TextArea label="描述" value={areas?.requirements?.step2?.description || ''} onChange={(v) => updateArea(['requirements','step2','description'], v)} placeholder="專員確認餐廳營運資料並完成會員驗證。" />
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <h5 className="text-sm font-medium mb-3">步驟 3</h5>
                        <TextField label="標題" value={areas?.requirements?.step3?.title || ''} onChange={(v) => updateArea(['requirements','step3','title'], v)} placeholder="開始採購" />
                        <TextArea label="描述" value={areas?.requirements?.step3?.description || ''} onChange={(v) => updateArea(['requirements','step3','description'], v)} placeholder="登入平台挑選食材、使用點數結帳並追蹤訂單。" />
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <h5 className="text-sm font-medium mb-3">步驟 4</h5>
                        <TextField label="標題" value={areas?.requirements?.step4?.title || ''} onChange={(v) => updateArea(['requirements','step4','title'], v)} placeholder="長期合作" />
                        <TextArea label="描述" value={areas?.requirements?.step4?.description || ''} onChange={(v) => updateArea(['requirements','step4','description'], v)} placeholder="與專員保持聯繫，持續優化採購流程與營運效率。" />
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard 
                title="行動呼籲區塊 (CTA)" 
                isExpanded={expandedSections.partnersCta}
                onToggle={() => setExpandedSections(prev => ({ ...prev, partnersCta: !prev.partnersCta }))}
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField label="標題" value={areas?.cta?.title || ''} onChange={(v) => updateArea(['cta','title'], v)} placeholder="準備好加入 iFoodPulse 嗎？" />
                  <TextArea label="描述" value={areas?.cta?.description || ''} onChange={(v) => updateArea(['cta','description'], v)} placeholder="立即提交申請，讓我們的團隊協助您加速採購流程、提升餐廳營運效率。" />
                  <TextField label="按鈕 1 文字" value={areas?.cta?.button1Text || ''} onChange={(v) => updateArea(['cta','button1Text'], v)} placeholder="立即申請合作" />
                  <TextField label="按鈕 2 文字" value={areas?.cta?.button2Text || ''} onChange={(v) => updateArea(['cta','button2Text'], v)} placeholder="預約顧問諮詢" />
                </div>
              </SectionCard>
            </div>
      ) : slug === 'faq' ? (
            <div className="space-y-6">
              <SectionCard 
                title="Hero 區塊" 
                isExpanded={expandedSections.faqHero}
                onToggle={() => setExpandedSections(prev => ({ ...prev, faqHero: !prev.faqHero }))}
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField label="標題" value={areas?.hero?.title || ''} onChange={(v) => updateArea(['hero','title'], v)} placeholder="F&Q" />
                  <TextArea label="描述" value={areas?.hero?.description || ''} onChange={(v) => updateArea(['hero','description'], v)} placeholder="常見問題解答" />
                </div>
              </SectionCard>

              <SectionCard 
                title="常見問題 (FAQ)" 
                isExpanded={expandedSections.faqQuestions}
                onToggle={() => setExpandedSections(prev => ({ ...prev, faqQuestions: !prev.faqQuestions }))}
              >
                <div className="grid grid-cols-1 gap-6">
                  {Array.isArray(areas?.faq) ? (
                    areas.faq.map((item: any, index: number) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border relative">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="text-sm font-medium">問題 {index + 1}</h5>
                          <button
                            type="button"
                            onClick={() => {
                              const newFaqs = [...(areas.faq || [])];
                              newFaqs.splice(index, 1);
                              updateArea(['faq'], newFaqs);
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            刪除
                          </button>
                        </div>
                        <TextField 
                          label="問題" 
                          value={item?.question || ''} 
                          onChange={(v) => {
                            const newFaqs = [...(areas.faq || [])];
                            newFaqs[index] = { ...newFaqs[index], question: v };
                            updateArea(['faq'], newFaqs);
                          }} 
                          placeholder="輸入問題" 
                        />
                        <TextArea 
                          label="答案" 
                          value={item?.answer || ''} 
                          onChange={(v) => {
                            const newFaqs = [...(areas.faq || [])];
                            newFaqs[index] = { ...newFaqs[index], answer: v };
                            updateArea(['faq'], newFaqs);
                          }} 
                          placeholder="輸入答案" 
                        />
                      </div>
                    ))
                  ) : areas?.faq && typeof areas.faq === 'object' ? (
                    // Handle legacy format (q1, q2, q3, etc.) - show convert button
                    (() => {
                      const legacyFaqs: any[] = [];
                      for (let i = 1; i <= 8; i++) {
                        const q = areas.faq[`q${i}`];
                        if (q && (q.question || q.answer)) {
                          legacyFaqs.push({
                            question: q.question || '',
                            answer: q.answer || '',
                          });
                        }
                      }
                      return (
                        <>
                          {legacyFaqs.length > 0 ? (
                            <>
                              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                                <p className="text-sm text-yellow-800 mb-2">
                                  偵測到舊版格式，請點擊下方按鈕轉換為新格式以繼續編輯。
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateArea(['faq'], legacyFaqs);
                                  }}
                                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium"
                                >
                                  轉換為新格式
                                </button>
                              </div>
                              {legacyFaqs.map((item: any, index: number) => (
                                <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                                  <h5 className="text-sm font-medium mb-3">問題 {index + 1} (舊格式)</h5>
                                  <div className="text-sm text-gray-600 mb-2">
                                    <strong>問題：</strong> {item.question || '(空白)'}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    <strong>答案：</strong> {item.answer || '(空白)'}
                                  </div>
                                </div>
                              ))}
                            </>
                          ) : (
                            <div className="text-sm text-gray-500 p-4">尚未設定問題</div>
                          )}
                        </>
                      );
                    })()
                  ) : (
                    <div className="text-sm text-gray-500 p-4">尚未設定問題</div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const currentFaqs = Array.isArray(areas?.faq) 
                        ? areas.faq 
                        : [];
                      updateArea(['faq'], [...currentFaqs, { question: '', answer: '' }]);
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    + 添加問題
                  </button>
                </div>
              </SectionCard>
            </div>
      ) : slug === 'restaurant-construction' ? (
            <div className="space-y-6">
              <SectionCard
                title="Hero 區塊"
                isExpanded={expandedSections.hero}
                onToggle={() =>
                  setExpandedSections((prev) => ({ ...prev, hero: !prev.hero }))
                }
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField
                    label="主標題"
                    value={areas?.hero?.title || ''}
                    onChange={(v) => updateArea(['hero', 'title'], v)}
                    placeholder="專業餐廳工程服務"
                  />
                  <TextArea
                    label="描述"
                    value={areas?.hero?.description || ''}
                    onChange={(v) => updateArea(['hero', 'description'], v)}
                    placeholder="從設計規劃到施工完成，提供全方位的餐廳工程解決方案"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      label="按鈕 1 文字"
                      value={areas?.hero?.button1Text || ''}
                      onChange={(v) => updateArea(['hero', 'button1Text'], v)}
                      placeholder="免費諮詢"
                    />
                    <TextField
                      label="按鈕 2 文字"
                      value={areas?.hero?.button2Text || ''}
                      onChange={(v) => updateArea(['hero', 'button2Text'], v)}
                      placeholder="查看案例"
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="服務項目"
                isExpanded={expandedSections.features}
                onToggle={() =>
                  setExpandedSections((prev) => ({ ...prev, features: !prev.features }))
                }
              >
                <div className="space-y-4">
                  <TextField
                    label="區塊標題"
                    value={areas?.services?.title || ''}
                    onChange={(v) => updateArea(['services', 'title'], v)}
                    placeholder="服務項目"
                  />
                  <TextArea
                    label="區塊描述"
                    value={areas?.services?.description || ''}
                    onChange={(v) => updateArea(['services', 'description'], v)}
                    placeholder="我們提供完整的餐廳工程服務，從設計到施工，確保每個環節都達到專業標準"
                  />

                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border space-y-3">
                      <h5 className="text-sm font-medium text-gray-700">
                        服務 {index + 1}
                      </h5>
                      <TextField
                        label="標題"
                        value={areas?.services?.items?.[index]?.title || ''}
                        onChange={(v) =>
                          updateArea(['services', 'items', index.toString(), 'title'], v)
                        }
                        placeholder={
                          ['餐廳設計規劃', '廚房設備安裝', '水電工程', '空調通風系統', '消防系統', '裝修工程'][
                            index
                          ] || ''
                        }
                      />
                      <TextArea
                        label="描述"
                        value={areas?.services?.items?.[index]?.description || ''}
                        onChange={(v) =>
                          updateArea(
                            ['services', 'items', index.toString(), 'description'],
                            v,
                          )
                        }
                        placeholder={
                          [
                            '專業的餐廳空間設計，從概念到實作全程服務',
                            '專業廚房設備安裝與配置，確保高效運作',
                            '餐廳專用水電系統設計與安裝',
                            '專業空調與通風系統安裝，確保舒適環境',
                            '符合法規的消防系統設計與安裝',
                            '室內裝修、地板、牆面等整體裝修服務',
                          ][index] || ''
                        }
                      />
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                title="服務特色"
                isExpanded={expandedSections.testimonials}
                onToggle={() =>
                  setExpandedSections((prev) => ({
                    ...prev,
                    testimonials: !prev.testimonials,
                  }))
                }
              >
                <div className="space-y-4">
                  <TextField
                    label="區塊標題"
                    value={areas?.features?.title || ''}
                    onChange={(v) => updateArea(['features', 'title'], v)}
                    placeholder="服務特色"
                  />
                  <TextArea
                    label="區塊描述"
                    value={areas?.features?.description || ''}
                    onChange={(v) => updateArea(['features', 'description'], v)}
                    placeholder="我們致力於為客戶提供最優質的工程服務，確保每個項目都能完美完成"
                  />

                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border space-y-3">
                      <h5 className="text-sm font-medium text-gray-700">
                        特色 {index + 1}
                      </h5>
                      <TextField
                        label="標題"
                        value={areas?.features?.items?.[index]?.title || ''}
                        onChange={(v) =>
                          updateArea(['features', 'items', index.toString(), 'title'], v)
                        }
                        placeholder={
                          ['專業團隊', '品質保證', '快速施工', '售後服務'][index] || ''
                        }
                      />
                      <TextArea
                        label="描述"
                        value={areas?.features?.items?.[index]?.description || ''}
                        onChange={(v) =>
                          updateArea(
                            ['features', 'items', index.toString(), 'description'],
                            v,
                          )
                        }
                        placeholder={
                          [
                            '擁有豐富餐廳工程經驗的專業團隊',
                            '使用優質材料，提供品質保證',
                            '高效施工流程，縮短營業中斷時間',
                            '完善的售後服務與維護保養',
                          ][index] || ''
                        }
                      />
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                title="聯絡區塊"
                isExpanded={expandedSections.cta}
                onToggle={() =>
                  setExpandedSections((prev) => ({ ...prev, cta: !prev.cta }))
                }
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField
                    label="標題"
                    value={areas?.contact?.title || ''}
                    onChange={(v) => updateArea(['contact', 'title'], v)}
                    placeholder="立即諮詢"
                  />
                  <TextArea
                    label="描述"
                    value={areas?.contact?.description || ''}
                    onChange={(v) => updateArea(['contact', 'description'], v)}
                    placeholder="專業團隊為您提供免費諮詢與報價服務，讓我們為您的餐廳工程提供最佳解決方案"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      label="按鈕 1 文字"
                      value={areas?.contact?.button1Text || ''}
                      onChange={(v) => updateArea(['contact', 'button1Text'], v)}
                      placeholder="聯絡我們"
                    />
                    <TextField
                      label="按鈕 2 文字"
                      value={areas?.contact?.button2Text || ''}
                      onChange={(v) => updateArea(['contact', 'button2Text'], v)}
                      placeholder="免費報價"
                    />
                  </div>
                </div>
              </SectionCard>
        </div>
      ) : slug === 'restaurant-furniture' ? (
            <div className="space-y-6">
              <SectionCard
                title="Hero 區塊"
                isExpanded={expandedSections.hero}
                onToggle={() =>
                  setExpandedSections((prev) => ({ ...prev, hero: !prev.hero }))
                }
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField
                    label="主標題"
                    value={areas?.hero?.title || ''}
                    onChange={(v) => updateArea(['hero', 'title'], v)}
                    placeholder="專業餐廳傢具"
                  />
                  <TextArea
                    label="描述"
                    value={areas?.hero?.description || ''}
                    onChange={(v) => updateArea(['hero', 'description'], v)}
                    placeholder="提供各式餐廳傢具，打造舒適優雅的用餐環境"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      label="按鈕 1 文字"
                      value={areas?.hero?.button1Text || ''}
                      onChange={(v) => updateArea(['hero', 'button1Text'], v)}
                      placeholder="免費諮詢"
                    />
                    <TextField
                      label="按鈕 2 文字"
                      value={areas?.hero?.button2Text || ''}
                      onChange={(v) => updateArea(['hero', 'button2Text'], v)}
                      placeholder="預約參觀"
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="傢具類別"
                isExpanded={expandedSections.features}
                onToggle={() =>
                  setExpandedSections((prev) => ({ ...prev, features: !prev.features }))
                }
              >
                <div className="space-y-4">
                  <TextField
                    label="區塊標題"
                    value={areas?.categories?.title || ''}
                    onChange={(v) => updateArea(['categories', 'title'], v)}
                    placeholder="傢具類別"
                  />
                  <TextArea
                    label="區塊描述"
                    value={areas?.categories?.description || ''}
                    onChange={(v) => updateArea(['categories', 'description'], v)}
                    placeholder="點擊查看詳細資訊，我們提供多種傢具類別滿足不同需求"
                  />

                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border space-y-3">
                      <h5 className="text-sm font-medium text-gray-700">
                        類別 {index + 1}
                      </h5>
                      <TextField
                        label="標題"
                        value={areas?.categories?.items?.[index]?.title || ''}
                        onChange={(v) =>
                          updateArea(['categories', 'items', index.toString(), 'title'], v)
                        }
                        placeholder={
                          ['餐桌椅組合', '沙發座椅', '收納櫃', '吧台設備', '裝飾傢具', '戶外傢具'][
                            index
                          ] || ''
                        }
                      />
                      <TextArea
                        label="描述"
                        value={areas?.categories?.items?.[index]?.description || ''}
                        onChange={(v) =>
                          updateArea(
                            ['categories', 'items', index.toString(), 'description'],
                            v,
                          )
                        }
                        placeholder={
                          [
                            '各式餐桌椅組合，適合不同餐廳風格',
                            '舒適的沙發座椅，提升用餐體驗',
                            '實用的收納櫃，保持餐廳整潔',
                            '專業吧台設備，打造完美酒吧區',
                            '精美裝飾傢具，營造餐廳氛圍',
                            '耐用戶外傢具，適合露天用餐區',
                          ][index] || ''
                        }
                      />
                      <TextField
                        label="價格範圍"
                        value={areas?.categories?.items?.[index]?.priceRange || ''}
                        onChange={(v) =>
                          updateArea(
                            ['categories', 'items', index.toString(), 'priceRange'],
                            v,
                          )
                        }
                        placeholder={
                          [
                            'HKD$ 2,000 - 15,000',
                            'HKD$ 3,000 - 25,000',
                            'HKD$ 1,500 - 12,000',
                            'HKD$ 5,000 - 30,000',
                            'HKD$ 800 - 8,000',
                            'HKD$ 2,500 - 20,000',
                          ][index] || ''
                        }
                      />
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                title="服務特色"
                isExpanded={expandedSections.testimonials}
                onToggle={() =>
                  setExpandedSections((prev) => ({
                    ...prev,
                    testimonials: !prev.testimonials,
                  }))
                }
              >
                <div className="space-y-4">
                  <TextField
                    label="區塊標題"
                    value={areas?.services?.title || ''}
                    onChange={(v) => updateArea(['services', 'title'], v)}
                    placeholder="服務特色"
                  />
                  <TextArea
                    label="區塊描述"
                    value={areas?.services?.description || ''}
                    onChange={(v) => updateArea(['services', 'description'], v)}
                    placeholder="提供客製化設計、專業安裝、品質保證與完善售後服務"
                  />

                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border space-y-3">
                      <h5 className="text-sm font-medium text-gray-700">
                        服務 {index + 1}
                      </h5>
                      <TextField
                        label="標題"
                        value={areas?.services?.items?.[index]?.title || ''}
                        onChange={(v) =>
                          updateArea(['services', 'items', index.toString(), 'title'], v)
                        }
                        placeholder={
                          ['客製化設計', '專業安裝', '品質保證', '售後服務'][index] || ''
                        }
                      />
                      <TextArea
                        label="描述"
                        value={areas?.services?.items?.[index]?.description || ''}
                        onChange={(v) =>
                          updateArea(
                            ['services', 'items', index.toString(), 'description'],
                            v,
                          )
                        }
                        placeholder={
                          [
                            '根據餐廳風格提供客製化傢具設計',
                            '專業團隊提供傢具安裝服務',
                            '使用優質材料，提供品質保證',
                            '完善的售後服務與維護保養',
                          ][index] || ''
                        }
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Array.from({ length: 4 }).map((__, fIndex) => (
                          <TextField
                            key={fIndex}
                            label={`特色標籤 ${fIndex + 1}`}
                            value={
                              areas?.services?.items?.[index]?.features?.[fIndex] || ''
                            }
                            onChange={(v) =>
                              updateArea(
                                [
                                  'services',
                                  'items',
                                  index.toString(),
                                  'features',
                                  fIndex.toString(),
                                ],
                                v,
                              )
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                title="聯絡區塊"
                isExpanded={expandedSections.cta}
                onToggle={() =>
                  setExpandedSections((prev) => ({ ...prev, cta: !prev.cta }))
                }
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField
                    label="標題"
                    value={areas?.contact?.title || ''}
                    onChange={(v) => updateArea(['contact', 'title'], v)}
                    placeholder="立即諮詢"
                  />
                  <TextArea
                    label="描述"
                    value={areas?.contact?.description || ''}
                    onChange={(v) => updateArea(['contact', 'description'], v)}
                    placeholder="專業團隊為您提供傢具諮詢與報價服務"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      label="按鈕 1 文字"
                      value={areas?.contact?.button1Text || ''}
                      onChange={(v) => updateArea(['contact', 'button1Text'], v)}
                      placeholder="聯絡我們"
                    />
                    <TextField
                      label="按鈕 2 文字"
                      value={areas?.contact?.button2Text || ''}
                      onChange={(v) => updateArea(['contact', 'button2Text'], v)}
                      placeholder="預約參觀"
                    />
                  </div>
                </div>
              </SectionCard>
            </div>
          ) : slug === 'kitchen-equipment' ? (
        <div className="space-y-6">
          <SectionCard
            title="Hero 區塊"
            isExpanded={expandedSections.hero}
            onToggle={() =>
              setExpandedSections(prev => ({ ...prev, hero: !prev.hero }))
            }
          >
            <TextField
              label="主標題"
              value={areas?.hero?.title || ''}
              onChange={v => updateArea(['hero', 'title'], v)}
              placeholder="專業廚房設備"
            />
            <TextArea
              label="描述"
              value={areas?.hero?.description || ''}
              onChange={v => updateArea(['hero', 'description'], v)}
              placeholder="提供全套廚房設備解決方案，提升餐廳營運效率"
            />
            <TextField
              label="按鈕 1 文字"
              value={areas?.hero?.button1Text || ''}
              onChange={v => updateArea(['hero', 'button1Text'], v)}
              placeholder="免費諮詢"
            />
            <TextField
              label="按鈕 2 文字"
              value={areas?.hero?.button2Text || ''}
              onChange={v => updateArea(['hero', 'button2Text'], v)}
              placeholder="查看設備"
            />
          </SectionCard>

          <SectionCard
            title="設備類別區塊"
            isExpanded={expandedSections.categories}
            onToggle={() =>
              setExpandedSections(prev => ({
                ...prev,
                categories: !prev.categories,
              }))
            }
          >
            <TextField
              label="區塊標題"
              value={areas?.categories?.title || ''}
              onChange={v => updateArea(['categories', 'title'], v)}
              placeholder="設備類別"
            />
            <TextArea
              label="區塊描述"
              value={areas?.categories?.description || ''}
              onChange={v => updateArea(['categories', 'description'], v)}
              placeholder="我們提供多種廚房設備類別，滿足不同餐廳的需求"
            />
            {areas?.categories?.items?.map((item: any, index: number) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                <h5 className="text-sm font-medium mb-3">
                  設備類別 {index + 1}
                </h5>
                <TextField
                  label="標題"
                  value={item.title || ''}
                  onChange={v =>
                    updateArea(['categories', 'items', index, 'title'], v)
                  }
                  placeholder={`設備類別 ${index + 1} 標題`}
                />
                <TextArea
                  label="描述"
                  value={item.description || ''}
                  onChange={v =>
                    updateArea(['categories', 'items', index, 'description'], v)
                  }
                  placeholder={`設備類別 ${index + 1} 描述`}
                />
                <TextArea
                  label="設備項目（以逗號分隔）"
                  value={(item.items || []).join(', ')}
                  onChange={v =>
                    updateArea(
                      ['categories', 'items', index, 'items'],
                      v
                        .split(',')
                        .map((s: string) => s.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder="爐具, 烤箱, 蒸籠, 炸鍋, 烤架, 平底鍋"
                />
              </div>
            ))}
          </SectionCard>

          <SectionCard
            title="服務項目"
            isExpanded={expandedSections.services}
            onToggle={() =>
              setExpandedSections(prev => ({
                ...prev,
                services: !prev.services,
              }))
            }
          >
            <TextField
              label="區塊標題"
              value={areas?.services?.title || ''}
              onChange={v => updateArea(['services', 'title'], v)}
              placeholder="服務項目"
            />
            <TextArea
              label="區塊描述"
              value={areas?.services?.description || ''}
              onChange={v => updateArea(['services', 'description'], v)}
              placeholder="我們提供完整的廚房設備服務，確保設備正常運作"
            />
            {areas?.services?.items?.map((item: any, index: number) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                <h5 className="text-sm font-medium mb-3">
                  服務 {index + 1}
                </h5>
                <TextField
                  label="標題"
                  value={item.title || ''}
                  onChange={v =>
                    updateArea(['services', 'items', index, 'title'], v)
                  }
                  placeholder={`服務 ${index + 1} 標題`}
                />
                <TextArea
                  label="描述"
                  value={item.description || ''}
                  onChange={v =>
                    updateArea(['services', 'items', index, 'description'], v)
                  }
                  placeholder={`服務 ${index + 1} 描述`}
                />
              </div>
            ))}
          </SectionCard>

          <SectionCard
            title="設備特色"
            isExpanded={expandedSections.features}
            onToggle={() =>
              setExpandedSections(prev => ({
                ...prev,
                features: !prev.features,
              }))
            }
          >
            <TextField
              label="區塊標題"
              value={areas?.features?.title || ''}
              onChange={v => updateArea(['features', 'title'], v)}
              placeholder="設備特色"
            />
            <TextArea
              label="區塊描述"
              value={areas?.features?.description || ''}
              onChange={v => updateArea(['features', 'description'], v)}
              placeholder="我們的設備具有多項特色，為您的餐廳帶來更多價值"
            />
            {areas?.features?.items?.map((item: any, index: number) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                <h5 className="text-sm font-medium mb-3">
                  特色 {index + 1}
                </h5>
                <TextField
                  label="標題"
                  value={item.title || ''}
                  onChange={v =>
                    updateArea(['features', 'items', index, 'title'], v)
                  }
                  placeholder={`特色 ${index + 1} 標題`}
                />
                <TextArea
                  label="描述"
                  value={item.description || ''}
                  onChange={v =>
                    updateArea(['features', 'items', index, 'description'], v)
                  }
                  placeholder={`特色 ${index + 1} 描述`}
                />
              </div>
            ))}
          </SectionCard>

          <SectionCard
            title="聯絡區塊"
            isExpanded={expandedSections.contact}
            onToggle={() =>
              setExpandedSections(prev => ({
                ...prev,
                contact: !prev.contact,
              }))
            }
          >
            <TextField
              label="主標題"
              value={areas?.contact?.title || ''}
              onChange={v => updateArea(['contact', 'title'], v)}
              placeholder="立即諮詢"
            />
            <TextArea
              label="描述"
              value={areas?.contact?.description || ''}
              onChange={v => updateArea(['contact', 'description'], v)}
              placeholder="專業團隊為您提供廚房設備諮詢與報價服務"
            />
            <TextField
              label="按鈕 1 文字"
              value={areas?.contact?.button1Text || ''}
              onChange={v => updateArea(['contact', 'button1Text'], v)}
              placeholder="聯絡我們"
            />
            <TextField
              label="按鈕 2 文字"
              value={areas?.contact?.button2Text || ''}
              onChange={v => updateArea(['contact', 'button2Text'], v)}
              placeholder="免費報價"
            />
          </SectionCard>
        </div>
      ) : slug === 'promotion' ? (
        <div className="space-y-6">
          <SectionCard
            title="Hero 區塊"
            isExpanded={expandedSections.hero}
            onToggle={() =>
              setExpandedSections(prev => ({ ...prev, hero: !prev.hero }))
            }
          >
            <TextField
              label="主標題"
              value={areas?.hero?.title || ''}
              onChange={v => updateArea(['hero', 'title'], v)}
              placeholder="餐廳宣傳服務"
            />
            <TextArea
              label="描述"
              value={areas?.hero?.description || ''}
              onChange={v => updateArea(['hero', 'description'], v)}
              placeholder="專業行銷團隊為您的餐廳提供全方位宣傳解決方案"
            />
            <TextField
              label="按鈕 1 文字"
              value={areas?.hero?.button1Text || ''}
              onChange={v => updateArea(['hero', 'button1Text'], v)}
              placeholder="免費諮詢"
            />
            <TextField
              label="按鈕 2 文字"
              value={areas?.hero?.button2Text || ''}
              onChange={v => updateArea(['hero', 'button2Text'], v)}
              placeholder="查看案例"
            />
          </SectionCard>

          <SectionCard
            title="宣傳服務卡片"
            isExpanded={expandedSections.promotionServices}
            onToggle={() =>
              setExpandedSections(prev => ({
                ...prev,
                promotionServices: !prev.promotionServices,
              }))
            }
          >
            <TextField
              label="區塊標題"
              value={areas?.promotionServices?.title || ''}
              onChange={v => updateArea(['promotionServices', 'title'], v)}
              placeholder="宣傳服務"
            />
            <TextArea
              label="區塊描述"
              value={areas?.promotionServices?.description || ''}
              onChange={v => updateArea(['promotionServices', 'description'], v)}
              placeholder="點擊查看詳細資訊，我們提供多種宣傳服務滿足不同需求"
            />
            {areas?.promotionServices?.items?.map((item: any, index: number) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border space-y-3">
                <h5 className="text-sm font-medium text-gray-700">
                  宣傳服務 {index + 1}
                </h5>
                <TextField
                  label="標題"
                  value={item.title || ''}
                  onChange={v =>
                    updateArea(['promotionServices', 'items', index, 'title'], v)
                  }
                  placeholder={`宣傳服務 ${index + 1} 標題`}
                />
                <TextArea
                  label="描述"
                  value={item.description || ''}
                  onChange={v =>
                    updateArea(
                      ['promotionServices', 'items', index, 'description'],
                      v,
                    )
                  }
                  placeholder={`宣傳服務 ${index + 1} 描述`}
                />
                <TextField
                  label="價格範圍"
                  value={item.priceRange || ''}
                  onChange={v =>
                    updateArea(
                      ['promotionServices', 'items', index, 'priceRange'],
                      v,
                    )
                  }
                  placeholder="HKD$ 3,000 - 15,000/月"
                />
                <TextField
                  label="是否熱門 (true / false)"
                  value={item.popular ? 'true' : 'false'}
                  onChange={v =>
                    updateArea(
                      ['promotionServices', 'items', index, 'popular'],
                      v === 'true',
                    )
                  }
                  placeholder="true 或 false"
                />
                <TextArea
                  label="服務項目（以逗號分隔）"
                  value={(item.items || []).join(', ')}
                  onChange={v =>
                    updateArea(
                      ['promotionServices', 'items', index, 'items'],
                      v
                        .split(',')
                        .map((s: string) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder="社群媒體管理, Google廣告, Facebook廣告..."
                />
                <TextArea
                  label="服務特色（以逗號分隔）"
                  value={(item.features || []).join(', ')}
                  onChange={v =>
                    updateArea(
                      ['promotionServices', 'items', index, 'features'],
                      v
                        .split(',')
                        .map((s: string) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder="數據分析, A/B測試, ROI追蹤..."
                />
              </div>
            ))}
          </SectionCard>

          <SectionCard
            title="服務特色區塊"
            isExpanded={expandedSections.services}
            onToggle={() =>
              setExpandedSections(prev => ({
                ...prev,
                services: !prev.services,
              }))
            }
          >
            <TextField
              label="區塊標題"
              value={areas?.services?.title || ''}
              onChange={v => updateArea(['services', 'title'], v)}
              placeholder="服務特色"
            />
            <TextArea
              label="區塊描述"
              value={areas?.services?.description || ''}
              onChange={v => updateArea(['services', 'description'], v)}
              placeholder="我們提供全方位的宣傳服務，從策略到執行，確保最佳效果"
            />
            {areas?.services?.items?.map((item: any, index: number) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border space-y-3">
                <h5 className="text-sm font-medium text-gray-700">
                  服務 {index + 1}
                </h5>
                <TextField
                  label="標題"
                  value={item.title || ''}
                  onChange={v =>
                    updateArea(['services', 'items', index, 'title'], v)
                  }
                  placeholder={`服務 ${index + 1} 標題`}
                />
                <TextArea
                  label="描述"
                  value={item.description || ''}
                  onChange={v =>
                    updateArea(['services', 'items', index, 'description'], v)
                  }
                  placeholder={`服務 ${index + 1} 描述`}
                />
                <TextArea
                  label="特色標籤（以逗號分隔）"
                  value={(item.features || []).join(', ')}
                  onChange={v =>
                    updateArea(
                      ['services', 'items', index, 'features'],
                      v
                        .split(',')
                        .map((s: string) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder="市場分析, 競爭分析, 目標設定..."
                />
              </div>
            ))}
          </SectionCard>

          <SectionCard
            title="聯絡區塊"
            isExpanded={expandedSections.contact}
            onToggle={() =>
              setExpandedSections(prev => ({
                ...prev,
                contact: !prev.contact,
              }))
            }
          >
            <TextField
              label="主標題"
              value={areas?.contact?.title || ''}
              onChange={v => updateArea(['contact', 'title'], v)}
              placeholder="立即諮詢"
            />
            <TextArea
              label="描述"
              value={areas?.contact?.description || ''}
              onChange={v => updateArea(['contact', 'description'], v)}
              placeholder="專業行銷團隊為您提供免費諮詢與方案規劃"
            />
            <TextField
              label="按鈕 1 文字"
              value={areas?.contact?.button1Text || ''}
              onChange={v => updateArea(['contact', 'button1Text'], v)}
              placeholder="聯絡我們"
            />
            <TextField
              label="按鈕 2 文字"
              value={areas?.contact?.button2Text || ''}
              onChange={v => updateArea(['contact', 'button2Text'], v)}
              placeholder="預約會議"
            />
          </SectionCard>
        </div>
      ) : slug === 'dishes-tableware' ? (
        <div className="space-y-6">
          <SectionCard
            title="Hero 區塊"
            isExpanded={expandedSections.hero}
            onToggle={() =>
              setExpandedSections(prev => ({ ...prev, hero: !prev.hero }))
            }
          >
            <TextField
              label="主標題"
              value={areas?.hero?.title || ''}
              onChange={v => updateArea(['hero', 'title'], v)}
              placeholder="專業餐碟餐具"
            />
            <TextArea
              label="描述"
              value={areas?.hero?.description || ''}
              onChange={v => updateArea(['hero', 'description'], v)}
              placeholder="提升用餐體驗，展現餐廳品味，提供多款高品質餐碟餐具選擇。"
            />
          </SectionCard>

          <SectionCard
            title="產品分類區塊"
            isExpanded={expandedSections.categories}
            onToggle={() =>
              setExpandedSections(prev => ({
                ...prev,
                categories: !prev.categories,
              }))
            }
          >
            <TextField
              label="區塊標題"
              value={areas?.categories?.title || ''}
              onChange={v => updateArea(['categories', 'title'], v)}
              placeholder="產品分類"
            />
            <TextArea
              label="區塊描述"
              value={areas?.categories?.description || ''}
              onChange={v => updateArea(['categories', 'description'], v)}
              placeholder="我們提供多種餐碟餐具產品，從基本款到高級款一應俱全。"
            />
            {areas?.categories?.items?.map((item: any, index: number) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border space-y-3">
                <h5 className="text-sm font-medium text-gray-700">
                  產品分類 {index + 1}
                </h5>
                <TextField
                  label="標題"
                  value={item.title || ''}
                  onChange={v =>
                    updateArea(['categories', 'items', index, 'title'], v)
                  }
                  placeholder={`產品分類 ${index + 1} 標題`}
                />
                <TextArea
                  label="描述"
                  value={item.description || ''}
                  onChange={v =>
                    updateArea(
                      ['categories', 'items', index, 'description'],
                      v,
                    )
                  }
                  placeholder={`產品分類 ${index + 1} 描述`}
                />
                <TextField
                  label="價格範圍"
                  value={item.priceRange || ''}
                  onChange={v =>
                    updateArea(
                      ['categories', 'items', index, 'priceRange'],
                      v,
                    )
                  }
                  placeholder="HKD$ 200 - 2,000"
                />
                <TextField
                  label="是否熱門 (true / false)"
                  value={item.popular ? 'true' : 'false'}
                  onChange={v =>
                    updateArea(
                      ['categories', 'items', index, 'popular'],
                      v === 'true',
                    )
                  }
                  placeholder="true 或 false"
                />
                <TextArea
                  label="產品項目（以逗號分隔）"
                  value={(item.items || []).join(', ')}
                  onChange={v =>
                    updateArea(
                      ['categories', 'items', index, 'items'],
                      v
                        .split(',')
                        .map((s: string) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder="陶瓷餐具, 骨瓷餐具, 不鏽鋼餐具..."
                />
              </div>
            ))}
          </SectionCard>

          <SectionCard
            title="服務特色區塊"
            isExpanded={expandedSections.services}
            onToggle={() =>
              setExpandedSections(prev => ({
                ...prev,
                services: !prev.services,
              }))
            }
          >
            <TextField
              label="區塊標題"
              value={areas?.services?.title || ''}
              onChange={v => updateArea(['services', 'title'], v)}
              placeholder="服務特色"
            />
            {areas?.services?.items?.map((item: any, index: number) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border space-y-3">
                <h5 className="text-sm font-medium text-gray-700">
                  服務 {index + 1}
                </h5>
                <TextField
                  label="標題"
                  value={item.title || ''}
                  onChange={v =>
                    updateArea(['services', 'items', index, 'title'], v)
                  }
                  placeholder={`服務 ${index + 1} 標題`}
                />
                <TextArea
                  label="描述"
                  value={item.description || ''}
                  onChange={v =>
                    updateArea(['services', 'items', index, 'description'], v)
                  }
                  placeholder={`服務 ${index + 1} 描述`}
                />
                <TextArea
                  label="特色標籤（以逗號分隔）"
                  value={(item.features || []).join(', ')}
                  onChange={v =>
                    updateArea(
                      ['services', 'items', index, 'features'],
                      v
                        .split(',')
                        .map((s: string) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder="免費設計諮詢, 品牌定制, 材質選擇..."
                />
              </div>
            ))}
          </SectionCard>

          <SectionCard
            title="聯絡區塊"
            isExpanded={expandedSections.contact}
            onToggle={() =>
              setExpandedSections(prev => ({
                ...prev,
                contact: !prev.contact,
              }))
            }
          >
            <TextField
              label="主標題"
              value={areas?.contact?.title || ''}
              onChange={v => updateArea(['contact', 'title'], v)}
              placeholder="立即聯繫我們"
            />
            <TextArea
              label="描述"
              value={areas?.contact?.description || ''}
              onChange={v => updateArea(['contact', 'description'], v)}
              placeholder="專業團隊為您提供最優質的服務"
            />
            <TextField
              label="按鈕 1 文字"
              value={areas?.contact?.button1Text || ''}
              onChange={v => updateArea(['contact', 'button1Text'], v)}
              placeholder="聯絡我們"
            />
          </SectionCard>
        </div>
      ) : slug === 'restaurant-maintenance' ? (
        <div className="space-y-6">
          <SectionCard
            title="Hero 區塊"
            isExpanded={expandedSections.hero}
            onToggle={() =>
              setExpandedSections(prev => ({ ...prev, hero: !prev.hero }))
            }
          >
            <TextField
              label="主標題"
              value={areas?.hero?.title || ''}
              onChange={v => updateArea(['hero', 'title'], v)}
              placeholder="專業餐飲維修"
            />
            <TextArea
              label="描述"
              value={areas?.hero?.description || ''}
              onChange={v => updateArea(['hero', 'description'], v)}
              placeholder="24小時服務，快速解決問題，確保餐廳營運不中斷。"
            />
          </SectionCard>

          <SectionCard
            title="維修服務區塊"
            isExpanded={expandedSections.categories}
            onToggle={() =>
              setExpandedSections(prev => ({
                ...prev,
                categories: !prev.categories,
              }))
            }
          >
            <TextField
              label="區塊標題"
              value={areas?.categories?.title || ''}
              onChange={v => updateArea(['categories', 'title'], v)}
              placeholder="維修服務"
            />
            {areas?.categories?.items?.map((item: any, index: number) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border space-y-3">
                <h5 className="text-sm font-medium text-gray-700">
                  維修服務 {index + 1}
                </h5>
                <TextField
                  label="標題"
                  value={item.title || ''}
                  onChange={v =>
                    updateArea(['categories', 'items', index, 'title'], v)
                  }
                  placeholder={`維修服務 ${index + 1} 標題`}
                />
                <TextArea
                  label="描述"
                  value={item.description || ''}
                  onChange={v =>
                    updateArea(
                      ['categories', 'items', index, 'description'],
                      v,
                    )
                  }
                  placeholder={`維修服務 ${index + 1} 描述`}
                />
                <TextArea
                  label="服務項目（以逗號分隔）"
                  value={(item.items || []).join(', ')}
                  onChange={v =>
                    updateArea(
                      ['categories', 'items', index, 'items'],
                      v
                        .split(',')
                        .map((s: string) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder="廚房設備, 空調系統, 冰箱維修..."
                />
              </div>
            ))}
          </SectionCard>

          <SectionCard
            title="服務特色區塊"
            isExpanded={expandedSections.features}
            onToggle={() =>
              setExpandedSections(prev => ({
                ...prev,
                features: !prev.features,
              }))
            }
          >
            <TextField
              label="區塊標題"
              value={areas?.features?.title || ''}
              onChange={v => updateArea(['features', 'title'], v)}
              placeholder="服務特色"
            />
            {areas?.features?.items?.map((item: any, index: number) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border space-y-3">
                <h5 className="text-sm font-medium text-gray-700">
                  特色 {index + 1}
                </h5>
                <TextField
                  label="標題"
                  value={item.title || ''}
                  onChange={v =>
                    updateArea(['features', 'items', index, 'title'], v)
                  }
                  placeholder={`特色 ${index + 1} 標題`}
                />
                <TextArea
                  label="描述"
                  value={item.description || ''}
                  onChange={v =>
                    updateArea(['features', 'items', index, 'description'], v)
                  }
                  placeholder={`特色 ${index + 1} 描述`}
                />
              </div>
            ))}
          </SectionCard>

          <SectionCard
            title="聯絡區塊"
            isExpanded={expandedSections.contact}
            onToggle={() =>
              setExpandedSections(prev => ({
                ...prev,
                contact: !prev.contact,
              }))
            }
          >
            <TextField
              label="主標題"
              value={areas?.contact?.title || ''}
              onChange={v => updateArea(['contact', 'title'], v)}
              placeholder="立即聯繫我們"
            />
            <TextArea
              label="描述"
              value={areas?.contact?.description || ''}
              onChange={v => updateArea(['contact', 'description'], v)}
              placeholder="專業團隊為您提供最優質的維修服務，保持設備運作順暢。"
            />
            <TextField
              label="按鈕 1 文字"
              value={areas?.contact?.button1Text || ''}
              onChange={v => updateArea(['contact', 'button1Text'], v)}
              placeholder="聯絡我們"
            />
          </SectionCard>
        </div>
      ) : slug === 'restaurant-systems' ? (
        <div className="space-y-6">
          <SectionCard
            title="Hero 區塊"
            isExpanded={expandedSections.hero}
            onToggle={() =>
              setExpandedSections(prev => ({ ...prev, hero: !prev.hero }))
            }
          >
            <TextField
              label="主標題"
              value={areas?.hero?.title || ''}
              onChange={v => updateArea(['hero', 'title'], v)}
              placeholder="智能餐飲系統"
            />
            <TextArea
              label="描述"
              value={areas?.hero?.description || ''}
              onChange={v => updateArea(['hero', 'description'], v)}
              placeholder="提升營運效率，優化客戶體驗，為餐廳提供一站式系統解決方案。"
            />
          </SectionCard>

          <SectionCard
            title="系統服務區塊"
            isExpanded={expandedSections.categories}
            onToggle={() =>
              setExpandedSections(prev => ({
                ...prev,
                categories: !prev.categories,
              }))
            }
          >
            <TextField
              label="區塊標題"
              value={areas?.categories?.title || ''}
              onChange={v => updateArea(['categories', 'title'], v)}
              placeholder="系統服務"
            />
            {areas?.categories?.items?.map((item: any, index: number) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border space-y-3">
                <h5 className="text-sm font-medium text-gray-700">
                  系統服務 {index + 1}
                </h5>
                <TextField
                  label="標題"
                  value={item.title || ''}
                  onChange={v =>
                    updateArea(['categories', 'items', index, 'title'], v)
                  }
                  placeholder={`系統服務 ${index + 1} 標題`}
                />
                <TextArea
                  label="描述"
                  value={item.description || ''}
                  onChange={v =>
                    updateArea(
                      ['categories', 'items', index, 'description'],
                      v,
                    )
                  }
                  placeholder={`系統服務 ${index + 1} 描述`}
                />
              </div>
            ))}
          </SectionCard>

          <SectionCard
            title="服務特色區塊"
            isExpanded={expandedSections.features}
            onToggle={() =>
              setExpandedSections(prev => ({
                ...prev,
                features: !prev.features,
              }))
            }
          >
            <TextField
              label="區塊標題"
              value={areas?.features?.title || ''}
              onChange={v => updateArea(['features', 'title'], v)}
              placeholder="服務特色"
            />
            {areas?.features?.items?.map((item: any, index: number) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border space-y-3">
                <h5 className="text-sm font-medium text-gray-700">
                  特色 {index + 1}
                </h5>
                <TextField
                  label="標題"
                  value={item.title || ''}
                  onChange={v =>
                    updateArea(['features', 'items', index, 'title'], v)
                  }
                  placeholder={`特色 ${index + 1} 標題`}
                />
                <TextArea
                  label="描述"
                  value={item.description || ''}
                  onChange={v =>
                    updateArea(['features', 'items', index, 'description'], v)
                  }
                  placeholder={`特色 ${index + 1} 描述`}
                />
              </div>
            ))}
          </SectionCard>

          <SectionCard
            title="聯絡區塊"
            isExpanded={expandedSections.contact}
            onToggle={() =>
              setExpandedSections(prev => ({
                ...prev,
                contact: !prev.contact,
              }))
            }
          >
            <TextField
              label="主標題"
              value={areas?.contact?.title || ''}
              onChange={v => updateArea(['contact', 'title'], v)}
              placeholder="立即聯繫我們"
            />
            <TextArea
              label="描述"
              value={areas?.contact?.description || ''}
              onChange={v => updateArea(['contact', 'description'], v)}
              placeholder="專業團隊為您提供最優質的系統規劃與導入服務。"
            />
            <TextField
              label="按鈕 1 文字"
              value={areas?.contact?.button1Text || ''}
              onChange={v => updateArea(['contact', 'button1Text'], v)}
              placeholder="聯絡我們"
            />
          </SectionCard>
        </div>
          ) : slug === 'mobile-app' ? (
            <div className="space-y-6">
              <SectionCard 
                title="Logo 區域" 
                isExpanded={expandedSections.mobileLogo}
                onToggle={() => setExpandedSections(prev => ({ ...prev, mobileLogo: !prev.mobileLogo }))}
              >
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Logo 圖片</label>
                    <ImageUploader
                      value={areas?.logo?.image || ''}
                      onChange={(url) => {
                        updateArea(['logo','image'], url);
                        setUploadError(null);
                      }}
                      onUploadingChange={handleUploadingChange}
                      onError={(err) => setUploadError(`Logo 圖片上傳失敗: ${err}`)}
                      className="w-full"
                      folder="app_images"
                    />
                    <p className="mt-1 text-xs text-gray-500">建議尺寸: 200x60px 或更高解析度，透明背景 PNG 格式為佳</p>
                  </div>
                  {areas?.logo?.image && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">預覽:</p>
                      <div>
                        <img 
                          src={areas.logo.image} 
                          alt="Logo preview" 
                          className="h-12 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard 
                title="首頁輪播 Banner" 
                isExpanded={expandedSections.mobileBanners}
                onToggle={() => setExpandedSections(prev => ({ ...prev, mobileBanners: !prev.mobileBanners }))}
              >
                <div className="grid grid-cols-1 gap-6">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">Banner 1</h5>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Banner 圖片</label>
                      <ImageUploader
                        value={areas?.banners?.banner1?.image || ''}
                        onChange={(url) => {
                          updateArea(['banners','banner1','image'], url);
                          setUploadError(null);
                        }}
                        onUploadingChange={handleUploadingChange}
                        onError={(err) => setUploadError(`Banner 1 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 800x400px 或更高解析度</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">Banner 2</h5>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Banner 圖片</label>
                      <ImageUploader
                        value={areas?.banners?.banner2?.image || ''}
                        onChange={(url) => {
                          updateArea(['banners','banner2','image'], url);
                          setUploadError(null);
                        }}
                        onUploadingChange={handleUploadingChange}
                        onError={(err) => setUploadError(`Banner 2 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 800x400px 或更高解析度</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">Banner 3</h5>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Banner 圖片</label>
                      <ImageUploader
                        value={areas?.banners?.banner3?.image || ''}
                        onChange={(url) => {
                          updateArea(['banners','banner3','image'], url);
                          setUploadError(null);
                        }}
                        onUploadingChange={handleUploadingChange}
                        onError={(err) => setUploadError(`Banner 3 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 800x400px 或更高解析度</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">Banner 4</h5>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Banner 圖片</label>
                      <ImageUploader
                        value={areas?.banners?.banner4?.image || ''}
                        onChange={(url) => {
                          updateArea(['banners','banner4','image'], url);
                          setUploadError(null);
                        }}
                        onUploadingChange={handleUploadingChange}
                        onError={(err) => setUploadError(`Banner 4 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 800x400px 或更高解析度</p>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard 
                title="分類" 
                isExpanded={expandedSections.mobileCategories}
                onToggle={() => setExpandedSections(prev => ({ ...prev, mobileCategories: !prev.mobileCategories }))}
              >
                <div className="grid grid-cols-1 gap-6">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">分類 1</h5>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">圖標圖片</label>
                      <ImageUploader
                        value={areas?.categories?.category1?.image || ''}
                        onChange={(url) => {
                          updateArea(['categories','category1','image'], url);
                          setUploadError(null);
                        }}
                        onUploadingChange={handleUploadingChange}
                        onError={(err) => setUploadError(`分類 1 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 100x100px 或更高解析度</p>
                    </div>
                    <TextField label="標題" value={areas?.categories?.category1?.title || ''} onChange={(v) => updateArea(['categories','category1','title'], v)} placeholder="食材訂購" />
                    <TextField 
                      label="畫面導向 (Screen Redirect)" 
                      value={areas?.categories?.category1?.screenRedirect || ''} 
                      onChange={(v) => updateArea(['categories','category1','screenRedirect'], v)} 
                      placeholder="Categories"
                    />
                    <p className="mt-1 text-xs text-gray-500">可用選項: Categories, RestaurantConstruction, RestaurantFurniture, KitchenEquipment, Promotion, DishesTableware, RestaurantMaintenance, RestaurantSystems</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">分類 2</h5>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">圖標圖片</label>
                      <ImageUploader
                        value={areas?.categories?.category2?.image || ''}
                        onChange={(url) => {
                          updateArea(['categories','category2','image'], url);
                          setUploadError(null);
                        }}
                        onUploadingChange={handleUploadingChange}
                        onError={(err) => setUploadError(`分類 2 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 100x100px 或更高解析度</p>
                    </div>
                    <TextField label="標題" value={areas?.categories?.category2?.title || ''} onChange={(v) => updateArea(['categories','category2','title'], v)} placeholder="商業維修" />
                    <TextField 
                      label="畫面導向 (Screen Redirect)" 
                      value={areas?.categories?.category2?.screenRedirect || ''} 
                      onChange={(v) => updateArea(['categories','category2','screenRedirect'], v)} 
                      placeholder="RestaurantConstruction"
                    />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">分類 3</h5>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">圖標圖片</label>
                      <ImageUploader
                        value={areas?.categories?.category3?.image || ''}
                        onChange={(url) => {
                          updateArea(['categories','category3','image'], url);
                          setUploadError(null);
                        }}
                        onUploadingChange={handleUploadingChange}
                        onError={(err) => setUploadError(`分類 3 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 100x100px 或更高解析度</p>
                    </div>
                    <TextField label="標題" value={areas?.categories?.category3?.title || ''} onChange={(v) => updateArea(['categories','category3','title'], v)} placeholder="廚房設備" />
                    <TextField 
                      label="畫面導向 (Screen Redirect)" 
                      value={areas?.categories?.category3?.screenRedirect || ''} 
                      onChange={(v) => updateArea(['categories','category3','screenRedirect'], v)} 
                      placeholder="RestaurantFurniture"
                    />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">分類 4</h5>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">圖標圖片</label>
                      <ImageUploader
                        value={areas?.categories?.category4?.image || ''}
                        onChange={(url) => {
                          updateArea(['categories','category4','image'], url);
                          setUploadError(null);
                        }}
                        onUploadingChange={handleUploadingChange}
                        onError={(err) => setUploadError(`分類 4 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 100x100px 或更高解析度</p>
                    </div>
                    <TextField label="標題" value={areas?.categories?.category4?.title || ''} onChange={(v) => updateArea(['categories','category4','title'], v)} placeholder="餐碟餐具" />
                    <TextField 
                      label="畫面導向 (Screen Redirect)" 
                      value={areas?.categories?.category4?.screenRedirect || ''} 
                      onChange={(v) => updateArea(['categories','category4','screenRedirect'], v)} 
                      placeholder="KitchenEquipment"
                    />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">分類 5</h5>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">圖標圖片</label>
                      <ImageUploader
                        value={areas?.categories?.category5?.image || ''}
                        onChange={(url) => {
                          updateArea(['categories','category5','image'], url);
                          setUploadError(null);
                        }}
                        onUploadingChange={handleUploadingChange}
                        onError={(err) => setUploadError(`分類 5 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 100x100px 或更高解析度</p>
                    </div>
                    <TextField label="標題" value={areas?.categories?.category5?.title || ''} onChange={(v) => updateArea(['categories','category5','title'], v)} placeholder="傢俬訂製" />
                    <TextField 
                      label="畫面導向 (Screen Redirect)" 
                      value={areas?.categories?.category5?.screenRedirect || ''} 
                      onChange={(v) => updateArea(['categories','category5','screenRedirect'], v)} 
                      placeholder="Promotion"
                    />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">分類 6</h5>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">圖標圖片</label>
                      <ImageUploader
                        value={areas?.categories?.category6?.image || ''}
                        onChange={(url) => {
                          updateArea(['categories','category6','image'], url);
                          setUploadError(null);
                        }}
                        onUploadingChange={handleUploadingChange}
                        onError={(err) => setUploadError(`分類 6 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 100x100px 或更高解析度</p>
                    </div>
                    <TextField label="標題" value={areas?.categories?.category6?.title || ''} onChange={(v) => updateArea(['categories','category6','title'], v)} placeholder="廣告宣傳" />
                    <TextField 
                      label="畫面導向 (Screen Redirect)" 
                      value={areas?.categories?.category6?.screenRedirect || ''} 
                      onChange={(v) => updateArea(['categories','category6','screenRedirect'], v)} 
                      placeholder="DishesTableware"
                    />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">分類 7</h5>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">圖標圖片</label>
                      <ImageUploader
                        value={areas?.categories?.category7?.image || ''}
                        onChange={(url) => {
                          updateArea(['categories','category7','image'], url);
                          setUploadError(null);
                        }}
                        onUploadingChange={handleUploadingChange}
                        onError={(err) => setUploadError(`分類 7 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 100x100px 或更高解析度</p>
                    </div>
                    <TextField label="標題" value={areas?.categories?.category7?.title || ''} onChange={(v) => updateArea(['categories','category7','title'], v)} placeholder="系統保安" />
                    <TextField 
                      label="畫面導向 (Screen Redirect)" 
                      value={areas?.categories?.category7?.screenRedirect || ''} 
                      onChange={(v) => updateArea(['categories','category7','screenRedirect'], v)} 
                      placeholder="RestaurantMaintenance"
                    />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">分類 8</h5>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">圖標圖片</label>
                      <ImageUploader
                        value={areas?.categories?.category8?.image || ''}
                        onChange={(url) => {
                          updateArea(['categories','category8','image'], url);
                          setUploadError(null);
                        }}
                        onUploadingChange={handleUploadingChange}
                        onError={(err) => setUploadError(`分類 8 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 100x100px 或更高解析度</p>
                    </div>
                    <TextField label="標題" value={areas?.categories?.category8?.title || ''} onChange={(v) => updateArea(['categories','category8','title'], v)} placeholder="商業工程" />
                    <TextField 
                      label="畫面導向 (Screen Redirect)" 
                      value={areas?.categories?.category8?.screenRedirect || ''} 
                      onChange={(v) => updateArea(['categories','category8','screenRedirect'], v)} 
                      placeholder="RestaurantSystems"
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard 
                title="長型 Banner" 
                isExpanded={expandedSections.mobileLongBanners}
                onToggle={() => setExpandedSections(prev => ({ ...prev, mobileLongBanners: !prev.mobileLongBanners }))}
              >
                <div className="grid grid-cols-1 gap-6">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">長型 Banner</h5>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Banner 圖片</label>
                      <ImageUploader
                        value={areas?.longBanners?.long1?.image || ''}
                        onChange={(url) => {
                          updateArea(['longBanners','long1','image'], url);
                          setUploadError(null);
                        }}
                        onUploadingChange={handleUploadingChange}
                        onError={(err) => setUploadError(`長型 Banner 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 800x200px 或更高解析度</p>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard 
                title="促銷 Banner" 
                isExpanded={expandedSections.mobilePromotionalBanners}
                onToggle={() => setExpandedSections(prev => ({ ...prev, mobilePromotionalBanners: !prev.mobilePromotionalBanners }))}
              >
                <div className="grid grid-cols-1 gap-6">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">促銷 Banner 1</h5>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Banner 圖片</label>
                      <ImageUploader
                        value={areas?.promotionalBanners?.promo1?.image || ''}
                        onChange={(url) => {
                          updateArea(['promotionalBanners','promo1','image'], url);
                          setUploadError(null);
                        }}
                        onUploadingChange={handleUploadingChange}
                        onError={(err) => setUploadError(`促銷 Banner 1 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 600x300px</p>
                    </div>
                    <div className="mt-4">
                      <label className="block mb-2 text-sm font-medium text-gray-700">詳情圖片</label>
                      <ImageUploader
                        value={areas?.promotionalBanners?.promo1?.detailImage || ''}
                        onChange={(url) => {
                          updateArea(['promotionalBanners','promo1','detailImage'], url);
                          setUploadError(null);
                        }}
                        onUploadingChange={handleUploadingChange}
                        onError={(err) => setUploadError(`促銷 Banner 1 詳情圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 800x400px 或更高解析度（用於詳情頁顯示）</p>
                    </div>
                    <div className="mt-4">
                      <TextField
                        label="詳情URL"
                        value={areas?.promotionalBanners?.promo1?.detailUrl || ''}
                        onChange={(v) => {
                          updateArea(['promotionalBanners','promo1','detailUrl'], v);
                        }}
                        placeholder="https://example.com"
                      />
                      <p className="mt-1 text-xs text-gray-500">此連結將顯示在詳情圖片下方</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">促銷 Banner 2</h5>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Banner 圖片</label>
                      <ImageUploader
                        value={areas?.promotionalBanners?.promo2?.image || ''}
                        onChange={(url) => {
                          updateArea(['promotionalBanners','promo2','image'], url);
                          setUploadError(null);
                        }}
                        onUploadingChange={handleUploadingChange}
                        onError={(err) => setUploadError(`促銷 Banner 2 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 600x300px</p>
                    </div>
                    <div className="mt-4">
                      <label className="block mb-2 text-sm font-medium text-gray-700">詳情圖片</label>
                      <ImageUploader
                        value={areas?.promotionalBanners?.promo2?.detailImage || ''}
                        onChange={(url) => {
                          updateArea(['promotionalBanners','promo2','detailImage'], url);
                          setUploadError(null);
                        }}
                        onUploadingChange={handleUploadingChange}
                        onError={(err) => setUploadError(`促銷 Banner 2 詳情圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 800x400px 或更高解析度（用於詳情頁顯示）</p>
                    </div>
                    <div className="mt-4">
                      <TextField
                        label="詳情URL"
                        value={areas?.promotionalBanners?.promo2?.detailUrl || ''}
                        onChange={(v) => {
                          updateArea(['promotionalBanners','promo2','detailUrl'], v);
                        }}
                        placeholder="https://example.com"
                      />
                      <p className="mt-1 text-xs text-gray-500">此連結將顯示在詳情圖片下方</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">促銷 Banner 3</h5>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Banner 圖片</label>
                      <ImageUploader
                        value={areas?.promotionalBanners?.promo3?.image || ''}
                        onChange={(url) => {
                          updateArea(['promotionalBanners','promo3','image'], url);
                          setUploadError(null);
                        }}
                        onUploadingChange={handleUploadingChange}
                        onError={(err) => setUploadError(`促銷 Banner 3 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 600x300px</p>
                    </div>
                    <div className="mt-4">
                      <label className="block mb-2 text-sm font-medium text-gray-700">詳情圖片</label>
                      <ImageUploader
                        value={areas?.promotionalBanners?.promo3?.detailImage || ''}
                        onChange={(url) => {
                          updateArea(['promotionalBanners','promo3','detailImage'], url);
                          setUploadError(null);
                        }}
                        onUploadingChange={handleUploadingChange}
                        onError={(err) => setUploadError(`促銷 Banner 3 詳情圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 800x400px 或更高解析度（用於詳情頁顯示）</p>
                    </div>
                    <div className="mt-4">
                      <TextField
                        label="詳情URL"
                        value={areas?.promotionalBanners?.promo3?.detailUrl || ''}
                        onChange={(v) => {
                          updateArea(['promotionalBanners','promo3','detailUrl'], v);
                        }}
                        placeholder="https://example.com"
                      />
                      <p className="mt-1 text-xs text-gray-500">此連結將顯示在詳情圖片下方</p>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard 
                title="方形 Banner" 
                isExpanded={expandedSections.mobileSquareBanners}
                onToggle={() => setExpandedSections(prev => ({ ...prev, mobileSquareBanners: !prev.mobileSquareBanners }))}
              >
                <div className="grid grid-cols-1 gap-6">
                  {Array.isArray(areas?.squareBanners) ? (
                    areas.squareBanners.map((banner: any, index: number) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border relative">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="text-sm font-medium">方形 Banner {index + 1}</h5>
                          <button
                            type="button"
                            onClick={() => {
                              const newBanners = [...(areas.squareBanners || [])];
                              newBanners.splice(index, 1);
                              updateArea(['squareBanners'], newBanners);
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            刪除
                          </button>
                        </div>
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-700">Banner 圖片</label>
                          <ImageUploader
                            value={banner?.image || ''}
                            onChange={(url) => {
                              const newBanners = [...(areas.squareBanners || [])];
                              newBanners[index] = { ...newBanners[index], image: url };
                              updateArea(['squareBanners'], newBanners);
                              setUploadError(null);
                            }}
                            onUploadingChange={handleUploadingChange}
                            onError={(err) => setUploadError(`方形 Banner ${index + 1} 圖片上傳失敗: ${err}`)}
                            className="w-full"
                            folder="app_images"
                          />
                          <p className="mt-1 text-xs text-gray-500">建議尺寸: 400x400px 或更高解析度</p>
                        </div>
                        <div className="mt-4">
                          <TextField
                            label="重定向 URL"
                            value={banner?.url || ''}
                            onChange={(v) => {
                              const newBanners = [...(areas.squareBanners || [])];
                              newBanners[index] = { ...newBanners[index], url: v };
                              updateArea(['squareBanners'], newBanners);
                            }}
                            placeholder="https://example.com"
                          />
                          <p className="mt-1 text-xs text-gray-500">點擊 Banner 時將重定向到此外部網站 URL（選填）</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      {areas?.squareBanners?.square1 && (
                        <div className="p-4 bg-gray-50 rounded-lg border">
                          <h5 className="text-sm font-medium mb-3">方形 Banner 1</h5>
                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">Banner 圖片</label>
                            <ImageUploader
                              value={areas.squareBanners.square1.image || ''}
                              onChange={(url) => {
                                const newBanners = [{ image: url }];
                                if (areas.squareBanners.square2?.image) {
                                  newBanners.push({ image: areas.squareBanners.square2.image });
                                }
                                updateArea(['squareBanners'], newBanners);
                                setUploadError(null);
                              }}
                              onUploadingChange={handleUploadingChange}
                              onError={(err) => setUploadError(`方形 Banner 1 圖片上傳失敗: ${err}`)}
                              className="w-full"
                              folder="app_images"
                            />
                            <p className="mt-1 text-xs text-gray-500">建議尺寸: 400x400px 或更高解析度</p>
                          </div>
                        </div>
                      )}
                      {areas?.squareBanners?.square2 && (
                        <div className="p-4 bg-gray-50 rounded-lg border">
                          <h5 className="text-sm font-medium mb-3">方形 Banner 2</h5>
                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">Banner 圖片</label>
                            <ImageUploader
                              value={areas.squareBanners.square2.image || ''}
                              onChange={(url) => {
                                const newBanners = [];
                                if (areas.squareBanners.square1?.image) {
                                  newBanners.push({ image: areas.squareBanners.square1.image });
                                }
                                newBanners.push({ image: url });
                                updateArea(['squareBanners'], newBanners);
                                setUploadError(null);
                              }}
                              onUploadingChange={handleUploadingChange}
                              onError={(err) => setUploadError(`方形 Banner 2 圖片上傳失敗: ${err}`)}
                              className="w-full"
                              folder="app_images"
                            />
                            <p className="mt-1 text-xs text-gray-500">建議尺寸: 400x400px 或更高解析度</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const currentBanners = Array.isArray(areas?.squareBanners) 
                        ? areas.squareBanners 
                        : (areas?.squareBanners?.square1 || areas?.squareBanners?.square2 
                            ? [
                                areas.squareBanners.square1?.image ? { image: areas.squareBanners.square1.image } : null,
                                areas.squareBanners.square2?.image ? { image: areas.squareBanners.square2.image } : null
                              ].filter(Boolean)
                            : []);
                      updateArea(['squareBanners'], [...currentBanners, { image: '' }]);
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    + 添加方形 Banner
                  </button>
                </div>
              </SectionCard>

              <SectionCard 
                title="彈出式 Banner" 
                isExpanded={expandedSections.mobilePopupBanner}
                onToggle={() => setExpandedSections(prev => ({ ...prev, mobilePopupBanner: !prev.mobilePopupBanner }))}
              >
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">彈出式 Banner 圖片</label>
                    <ImageUploader
                      value={areas?.popupBanner?.image || ''}
                      onChange={(url) => {
                        updateArea(['popupBanner','image'], url);
                        setUploadError(null);
                      }}
                      onUploadingChange={handleUploadingChange}
                      onError={(err) => setUploadError(`彈出式 Banner 圖片上傳失敗: ${err}`)}
                      className="w-full"
                      folder="app_images"
                    />
                    <p className="mt-1 text-xs text-gray-500">建議尺寸: 600x800px 或更高解析度</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard 
                title="購物車 Banner" 
                isExpanded={expandedSections.mobileCartBanner}
                onToggle={() => setExpandedSections(prev => ({ ...prev, mobileCartBanner: !prev.mobileCartBanner }))}
              >
                <div className="grid grid-cols-1 gap-6">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">購物車 Banner</h5>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Banner 圖片</label>
                      <ImageUploader
                        value={areas?.cartBanner?.image || ''}
                        onChange={(url) => {
                          updateArea(['cartBanner','image'], url);
                          setUploadError(null);
                        }}
                        onUploadingChange={handleUploadingChange}
                        onError={(err) => setUploadError(`購物車 Banner 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 800x200px 或更高解析度（與長型 Banner 相同尺寸）</p>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard 
                title="我的訂單 Banner" 
                isExpanded={expandedSections.mobileOrdersBanner}
                onToggle={() => setExpandedSections(prev => ({ ...prev, mobileOrdersBanner: !prev.mobileOrdersBanner }))}
              >
                <div className="grid grid-cols-1 gap-6">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">我的訂單 Banner</h5>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Banner 圖片</label>
                      <ImageUploader
                        value={areas?.ordersBanner?.image || ''}
                        onChange={(url) => {
                          updateArea(['ordersBanner','image'], url);
                          setUploadError(null);
                        }}
                        onUploadingChange={handleUploadingChange}
                        onError={(err) => setUploadError(`我的訂單 Banner 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 800x200px 或更高解析度（與長型 Banner 相同尺寸）</p>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard 
                title="付款方式" 
                isExpanded={expandedSections.mobilePaymentMethods}
                onToggle={() => setExpandedSections(prev => ({ ...prev, mobilePaymentMethods: !prev.mobilePaymentMethods }))}
              >
                <div className="grid grid-cols-1 gap-6">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-4">管理付款方式資訊，這些資訊將顯示在手機APP的購買點數頁面。</p>
                    {Array.isArray(areas?.paymentMethods) && areas.paymentMethods.length > 0 ? (
                      areas.paymentMethods.map((method: any, index: number) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg border mb-4 relative">
                          <div className="flex justify-between items-center mb-3">
                            <h5 className="text-sm font-medium">付款方式 {index + 1}</h5>
                            <button
                              type="button"
                              onClick={() => {
                                const newMethods = [...(areas.paymentMethods || [])];
                                newMethods.splice(index, 1);
                                updateArea(['paymentMethods'], newMethods);
                              }}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              刪除
                            </button>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            <TextField
                              label="付款方式名稱"
                              value={method?.name || ''}
                              onChange={(v) => {
                                const newMethods = [...(areas.paymentMethods || [])];
                                newMethods[index] = { ...newMethods[index], name: v };
                                updateArea(['paymentMethods'], newMethods);
                              }}
                              placeholder="例如: FPS 轉數快"
                            />
                            <TextField
                              label="帳號/號碼"
                              value={method?.number || ''}
                              onChange={(v) => {
                                const newMethods = [...(areas.paymentMethods || [])];
                                newMethods[index] = { ...newMethods[index], number: v };
                                updateArea(['paymentMethods'], newMethods);
                              }}
                              placeholder="例如: 106 280 399"
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-lg border mb-4 text-center text-gray-500 text-sm">
                        目前沒有付款方式，請點擊下方按鈕新增。
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const currentMethods = Array.isArray(areas?.paymentMethods) ? areas.paymentMethods : [];
                        updateArea(['paymentMethods'], [...currentMethods, { name: '', number: '' }]);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      + 新增付款方式
                    </button>
                  </div>
                </div>
              </SectionCard>
            </div>
          ) : slug === 'footer' ? (
            <div className="space-y-6">
              <SectionCard
                title="公司資訊"
                isExpanded={expandedSections.footerCompany}
                onToggle={() =>
                  setExpandedSections((prev) => ({ ...prev, footerCompany: !prev.footerCompany }))
                }
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField
                    label="公司名稱"
                    value={areas?.company?.name || ''}
                    onChange={(v) => updateArea(['company', 'name'], v)}
                    placeholder="iFoodPulse"
                  />
                  <TextArea
                    label="公司描述"
                    value={areas?.company?.description || ''}
                    onChange={(v) => updateArea(['company', 'description'], v)}
                    placeholder="Premium food supplier platform for restaurants..."
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="快速連結"
                isExpanded={expandedSections.footerQuickLinks}
                onToggle={() =>
                  setExpandedSections((prev) => ({
                    ...prev,
                    footerQuickLinks: !prev.footerQuickLinks,
                  }))
                }
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField
                    label="區塊標題"
                    value={areas?.quickLinks?.heading || ''}
                    onChange={(v) => updateArea(['quickLinks', 'heading'], v)}
                    placeholder="快速連結"
                  />
                  <div className="space-y-4">
                    {['link1', 'link2', 'link3', 'link4', 'link5'].map((key, index) => (
                      <div key={key} className="p-4 bg-gray-50 rounded-lg border space-y-3">
                        <h5 className="text-sm font-medium text-gray-700">連結 {index + 1}</h5>
                        <TextField
                          label="連結標題"
                          value={areas?.quickLinks?.[key]?.label || ''}
                          onChange={(v) => updateArea(['quickLinks', key, 'label'], v)}
                          placeholder="請輸入連結標題"
                        />
                        <TextField
                          label="連結網址"
                          value={areas?.quickLinks?.[key]?.url || ''}
                          onChange={(v) => updateArea(['quickLinks', key, 'url'], v)}
                          placeholder="/products"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="聯絡資訊"
                isExpanded={expandedSections.footerContact}
                onToggle={() =>
                  setExpandedSections((prev) => ({
                    ...prev,
                    footerContact: !prev.footerContact,
                  }))
                }
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField
                    label="區塊標題"
                    value={areas?.contact?.title || ''}
                    onChange={(v) => updateArea(['contact', 'title'], v)}
                    placeholder="聯絡資訊"
                  />
                  <TextField
                    label="地址"
                    value={areas?.contact?.address || ''}
                    onChange={(v) => updateArea(['contact', 'address'], v)}
                    placeholder="香港九龍彌敦道700"
                  />
                  <TextField
                    label="電話"
                    value={areas?.contact?.phone || ''}
                    onChange={(v) => updateArea(['contact', 'phone'], v)}
                    placeholder="(852) 9890-9890"
                  />
                  <TextField
                    label="電子郵件"
                    value={areas?.contact?.email || ''}
                    onChange={(v) => updateArea(['contact', 'email'], v)}
                    placeholder="info@ifoodpulse.com"
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="底部資訊"
                isExpanded={expandedSections.footerBottom}
                onToggle={() =>
                  setExpandedSections((prev) => ({
                    ...prev,
                    footerBottom: !prev.footerBottom,
                  }))
                }
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextArea
                    label="版權文字"
                    value={areas?.bottom?.copyright || ''}
                    onChange={(v) => updateArea(['bottom', 'copyright'], v)}
                    placeholder="© 2025 iFoodPulse 保留所有權利。"
                  />
                  <div className="space-y-4">
                    {['link1', 'link2', 'link3'].map((key, index) => (
                      <div key={key} className="p-4 bg-gray-50 rounded-lg border space-y-3">
                        <h5 className="text-sm font-medium text-gray-700">底部連結 {index + 1}</h5>
                        <TextField
                          label="連結標題"
                          value={areas?.bottom?.links?.[key]?.label || ''}
                          onChange={(v) => updateArea(['bottom', 'links', key, 'label'], v)}
                          placeholder="請輸入底部連結標題"
                        />
                        <TextField
                          label="連結網址"
                          value={areas?.bottom?.links?.[key]?.url || ''}
                          onChange={(v) => updateArea(['bottom', 'links', key, 'url'], v)}
                          placeholder="/privacy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>
            </div>
          ) : (
            <div>
              <label className="block mb-1 text-sm text-gray-600">內容</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full rounded-md border px-3 py-2 min-h-[300px]"
                placeholder="請輸入內容"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function defaultAboutAreas() {
  return {
    hero: {
      title: '關於我們',
      description: '專業的餐廳食材供應商，為您的餐廳提供最優質的食材和服務',
    },
    stats: {
      stat1: { value: '500+', label: '餐廳客戶' },
      stat2: { value: '1000+', label: '產品種類' },
      stat3: { value: '24小時', label: '配送服務' },
      stat4: { value: '10年+', label: '行業經驗' },
    },
    story: {
      title: '我們的故事',
      paragraph1: '成立於2014年，我們從一個小型的本地食材供應商開始，逐步發展成為香港領先的餐廳食材供應商。',
      paragraph2: '我們的使命是為餐廳提供最優質、最新鮮的食材，幫助餐廳提升菜品品質，為顧客提供更好的用餐體驗。',
      paragraph3: '十年來，我們已經服務超過500家餐廳，建立了完善的供應鏈體系和配送網絡，成為餐廳值得信賴的合作夥伴。',
    },
    values: {
      value1: {
        title: '品質至上',
        description: '我們只提供最優質的食材，確保每一件產品都符合最高標準。',
      },
      value2: {
        title: '環保永續',
        description: '致力於可持續發展，支持本地農民，減少碳足跡。',
      },
      value3: {
        title: '精準配送',
        description: '準時配送，確保食材新鮮度，讓您的餐廳運營無後顧之憂。',
      },
      value4: {
        title: '安全可靠',
        description: '所有產品都經過嚴格的安全檢測，確保食品安全。',
      },
    },
    mission: {
      missionTitle: '我們的使命',
      missionText: '為餐廳提供最優質的食材和服務，幫助餐廳提升競爭力，為顧客創造更好的用餐體驗。',
      visionTitle: '我們的願景',
      visionText: '成為香港最受信賴的餐廳食材供應商，推動餐飲行業的可持續發展。',
    },
    services: {
      service1: {
        title: '新鮮食材供應',
        description: '提供各種新鮮蔬菜、水果、肉類和海鮮，確保品質和口感。',
      },
      service2: {
        title: '快速配送服務',
        description: '24小時內送達，專業冷鏈運輸，保持食材新鮮度。',
      },
      service3: {
        title: '專屬客戶服務',
        description: '一對一客戶經理，為您的餐廳提供個性化解決方案。',
      },
      service4: {
        title: '品質保證',
        description: '所有產品都有品質保證，不滿意可退換貨。',
      },
    },
    team: {
      member1: {
        name: '張志明',
        position: '創始人 & CEO',
        description: '擁有15年食品供應鏈經驗，致力於為餐廳提供最優質的食材。',
      },
      member2: {
        name: '李美玲',
        position: '營運總監',
        description: '負責日常營運管理，確保服務品質和客戶滿意度。',
      },
      member3: {
        name: '王建國',
        position: '採購經理',
        description: '專業的食材採購團隊，與優質供應商建立長期合作關係。',
      },
      member4: {
        name: '陳雅芳',
        position: '客戶服務經理',
        description: '為客戶提供專業的服務支持，解決各種問題和需求。',
      },
    },
    contact: {
      addressLabel: '地址',
      address: '香港九龍灣宏光道1號',
      phoneLabel: '電話',
      phone: '+852 2345 6789',
      emailLabel: '電郵',
      email: 'info@foodsupplier.com',
    },
    cta: {
      title: '準備好開始合作了嗎？',
      description: '加入我們的客戶網絡，享受專業的食材供應服務',
      button1Text: '立即註冊',
      button1Link: '/partners/apply',
      button2Text: '聯絡我們',
      button2Link: '/contact',
    },
  };
}

function defaultContactAreas() {
  return {
    hero: {
      title: '聯絡我們',
      description: '我們隨時為您提供專業的服務支援，歡迎與我們聯繫',
    },
    contactInfo: {
      card1: {
        title: '總部地址',
        content: '香港九龍灣宏光道1號',
        subtitle: '九龍灣商貿中心15樓',
      },
      card2: {
        title: '客服熱線',
        content: '+852 2345 6789',
        subtitle: '週一至週五 9:00-18:00',
      },
      card3: {
        title: '電子郵件',
        content: 'info@foodsupplier.com',
        subtitle: '24小時內回覆',
      },
      card4: {
        title: '營業時間',
        content: '週一至週五 9:00-18:00',
        subtitle: '週六 9:00-14:00',
      },
    },
    form: {
      title: '發送訊息',
    },
    departments: {
      dept1: {
        title: '客戶服務',
        phone: '+852 2345 6789',
        email: 'service@foodsupplier.com',
        description: '訂單查詢、配送安排、客戶支援',
      },
      dept2: {
        title: '採購部門',
        phone: '+852 2345 6790',
        email: 'procurement@foodsupplier.com',
        description: '供應商合作、產品採購、品質管理',
      },
      dept3: {
        title: '配送中心',
        phone: '+852 2345 6791',
        email: 'logistics@foodsupplier.com',
        description: '配送安排、物流追蹤、倉儲管理',
      },
    },
    office: {
      title: '辦公室位置',
      addressMain: '香港九龍灣宏光道1號',
      addressDetail: '九龍灣商貿中心15樓',
      hoursTitle: '營業時間',
      hoursWeekday: '週一至週五 9:00-18:00',
      hoursSaturday: '週六 9:00-14:00',
    },
    map: {
      title: '我們的位置',
      address: '香港九龍灣宏光道1號',
    },
    faq: {
      q1: {
        question: '如何下訂單？',
        answer: '您可以通過我們的網站註冊帳戶，瀏覽產品目錄，將所需商品加入購物車，然後完成結帳流程。',
      },
      q2: {
        question: '配送時間是多久？',
        answer: '我們提供24小時內配送服務，具體時間取決於您的訂單時間和配送地址。',
      },
      q3: {
        question: '如何查詢訂單狀態？',
        answer: '登入您的帳戶後，在「我的訂單」頁面可以查看所有訂單的詳細狀態和配送進度。',
      },
      q4: {
        question: '是否提供退換貨服務？',
        answer: '是的，我們提供品質保證服務。如果收到的產品有品質問題，請在24小時內聯繫我們的客服團隊。',
      },
    },
  };
}

function defaultPricingAreas() {
  return {
    hero: {
      title: '會員點數方案',
      description: '透過購買會員點數，快速補充貨品採購所需的預付餘額。每一點會員點數等同港幣，可在平台上立即使用。',
    },
    plans: {
      plan1: {
        name: 'HK$500 方案',
        description: '適合首次補貨或測試平台使用',
        price: '500',
        originalPrice: '適合首次補貨',
        features: [
          '一次購買 500 點會員點數',
          '點數審核通過即時入帳',
          '支援平台內所有品項',
        ],
      },
      plan2: {
        name: 'HK$1,000 方案',
        description: '適合穩定每週補貨的餐廳',
        price: '1000',
        originalPrice: '適合每週例行採購',
        features: [
          '建議每週例行採購的預算',
          '支援多筆訂單與分店使用',
          '享有點數回饋與專人支援',
        ],
      },
      plan3: {
        name: 'HK$3,000 方案',
        description: '適合集中採購或多分店營運',
        price: '3000',
        originalPrice: '支援多分店共同使用',
        features: [
          '一次補充大量採購額度',
          '點數餘額可隨時查詢與共享',
          '專員協助採購與物流安排',
        ],
      },
    },
    faq: {
      q1: {
        question: '點數如何購買與使用？',
        answer: '登入帳戶後前往「購買點數」，選擇方案並匯款，上傳收據後待審核通過，點數即會入帳供下單使用。',
      },
      q2: {
        question: '點數可以共享或轉移嗎？',
        answer: '同一公司底下的授權帳號都可以共用點數餘額，方便管理採購預算與分店需求。',
      },
      q3: {
        question: '審核需要多久時間？',
        answer: '我們的專員會在收到收據後 1-2 個工作日內完成審核並啟用點數。',
      },
      q4: {
        question: '未使用的點數會過期嗎？',
        answer: '會員點數不會過期，可在需要時隨時使用。如需退款，請聯絡客戶服務團隊。',
      },
    },
    cta: {
      title: '準備好補充會員點數了嗎？',
      description: '登入會員即可在「購買點數」頁面提交收據，快速完成點數儲值並開始採購。',
      button1Text: '前往購買點數',
      button2Text: '了解使用流程',
      button2Link: '/partners/apply',
    },
  };
}

function defaultPartnersAreas() {
  return {
    hero: {
      title: '餐廳食材採購，一站式完成',
      description: 'iFoodPulse 食材採購平台，讓餐廚團隊可以在數分鐘內完成補貨、掌握成本，並獲得專人支援與點數回饋。',
      button1Text: '立即申請合作',
      button2Text: '了解平台優勢',
    },
    benefits: {
      title: '餐廳專屬採購優勢',
      description: '我們整合熱門食材、耗材與飲品供應商，並透過點數結帳與補貨提醒，協助餐廳團隊減少溝通成本、專注料理品質。',
      benefit1: {
        title: '一鍵補貨，節省時間',
        description: '集中管理常用食材清單，快速加入購物車即可完成補貨，免去逐一聯絡供應商的麻煩。',
      },
      benefit2: {
        title: '透明價格與點數結帳',
        description: '平台提供即時價格與點數結帳功能，協助餐廳掌握採購預算並享受回饋方案。',
      },
      benefit3: {
        title: '多品類食材一次搞定',
        description: '從新鮮食材、乾貨到調味配料，餐廳可以在同一平台完成採購，降低庫存壓力。',
      },
      benefit4: {
        title: '營運數據與提醒',
        description: '系統提供採購紀錄、常用品項提醒與即將缺貨通知，協助廚房穩定運作。',
      },
    },
    partnershipTypes: {
      title: '量身打造的採購體驗',
      description: '登入後即可查看常用食材與採購提醒，流程清楚快速，支援多分店協作與權限管理。',
      type1: {
        title: '個人化主頁',
        description: '登入後立即看到餐廳常用食材與優惠資訊，支援多分店切換與快速補貨。',
        features: ['常用品項即時顯示', '依菜單推薦採購項目', '支援多店面切換'],
      },
      type2: {
        title: '直覺式下單流程',
        description: '快速搜尋品項、瀏覽圖片與規格說明，系統自動計算點數與金額，三分鐘內完成結帳。',
        features: ['快速搜尋與圖片比對', '收藏與常用清單一鍵補貨', '自動計算點數與金額'],
      },
    },
    requirements: {
      title: '申請條件',
      description: '我們尋求具有專業能力和良好信譽的餐廳合作夥伴，攜手提升採購效率與用餐體驗。',
      requirementsList: [
        '註冊公司並持有有效的餐飲相關營業或食品處理牌照',
        '同意遵守平台採購與支付規範，維護良好交易信用',
        '提供餐廳基本資料與聯絡方式，以便平台確認會員資格',
        '願意配合平台的點數與結帳機制，享受整合採購服務',
        '致力於長期合作與營運成長，共同提升用餐體驗',
      ],
      processTitle: '加入流程',
      step1: {
        title: '提交申請',
        description: '填寫餐廳與採購需求資訊，建立平台帳戶。',
      },
      step2: {
        title: '資格審核',
        description: '專員確認餐廳營運資料並完成會員驗證。',
      },
      step3: {
        title: '開始採購',
        description: '登入平台挑選食材、使用點數結帳並追蹤訂單。',
      },
      step4: {
        title: '長期合作',
        description: '與專員保持聯繫，持續優化採購流程與營運效率。',
      },
    },
    cta: {
      title: '準備好加入 iFoodPulse 嗎？',
      description: '立即提交申請，讓我們的團隊協助您加速採購流程、提升餐廳營運效率。',
      button1Text: '立即申請合作',
      button2Text: '預約顧問諮詢',
    },
  };
}

function defaultFaqAreas() {
  return {
    hero: {
      title: 'F&Q',
      description: '常見問題解答',
    },
    faq: [
      {
        question: '如何成為會員？',
        answer: '您可以前往「成為會員」頁面，選擇適合的點數方案並完成註冊。註冊後即可開始使用我們的服務。',
      },
      {
        question: '點數如何購買？',
        answer: '登入後，前往「會員點數」頁面，選擇您需要的點數方案並完成付款。我們支援多種付款方式。',
      },
      {
        question: '配送時間需要多久？',
        answer: '一般訂單會在24-48小時內送達。具體配送時間會根據您的地址和訂單內容而定，您可以在下單時查看預計配送時間。',
      },
      {
        question: '如何追蹤訂單？',
        answer: '登入後，前往「我的訂單」頁面即可查看所有訂單狀態。您也可以查看訂單詳情以獲取配送資訊。',
      },
      {
        question: '可以退換貨嗎？',
        answer: '我們提供7天退換貨服務。如產品有品質問題，請聯繫客服，我們會為您處理退換貨事宜。',
      },
      {
        question: '如何聯繫客服？',
        answer: '您可以透過「聯絡我們」頁面填寫表單，或直接撥打客服熱線。我們的客服團隊會盡快為您處理。',
      },
      {
        question: '產品品質如何保證？',
        answer: '我們嚴格篩選供應商，所有產品都經過品質檢驗。我們只提供符合最高標準的優質食材。',
      },
      {
        question: '有最低訂購金額嗎？',
        answer: '部分產品可能有最低訂購數量要求，具體請查看產品詳情頁面。我們會清楚標示最低訂購要求。',
      },
    ],
  };
}

function defaultFooterAreas() {
  return getDefaultFooterAreas();
}

function defaultMobileAppAreas() {
  return {
    logo: {
      image: '',
      appTitle: 'iFoodPulse',
      welcomeText: '歡迎選購',
    },
    banners: {
      banner1: {
        image: '',
        title: '優質美食',
        subtitle: '新鮮直送',
      },
      banner2: {
        image: '',
        title: '進口海產類',
        subtitle: '每日現撈',
      },
      banner3: {
        image: '',
        title: '蔬菜/淨菜加工類',
        subtitle: '有機栽培',
      },
      banner4: {
        image: '',
        title: '進口凍肉類',
        subtitle: '嚴選品質',
      },
    },
    promotionalBanners: {
      promo1: {
        image: '',
        title: '今日特價',
        subtitle: '全場8折優惠',
        color: '#FF6B6B',
      },
      promo2: {
        image: '',
        title: '快速配送',
        subtitle: '1小時內送達',
        color: '#4ECDC4',
      },
      promo3: {
        image: '',
        title: '會員專享',
        subtitle: '額外9折優惠',
        color: '#45B7D1',
      },
    },
    longBanners: {
      long1: {
        image: '',
      },
    },
    squareBanners: [
      { image: '' },
      { image: '' },
    ],
    popupBanner: {
      image: '',
    },
    categories: {
      category1: {
        title: '食材訂購',
        icon: 'restaurant-outline',
        color: '#10B981',
      },
      category2: {
        title: '商業維修',
        icon: 'construct-outline',
        color: '#3B82F6',
      },
      category3: {
        title: '廚房設備',
        icon: 'bed-outline',
        color: '#8B5CF6',
      },
      category4: {
        title: '餐碟餐具',
        icon: 'hardware-chip-outline',
        color: '#F59E0B',
      },
      category5: {
        title: '傢俬訂製',
        icon: 'megaphone-outline',
        color: '#EF4444',
      },
      category6: {
        title: '廣告宣傳',
        icon: 'restaurant-outline',
        color: '#06B6D4',
      },
      category7: {
        title: '系統保安',
        icon: 'construct-outline',
        color: '#8B5A2B',
      },
      category8: {
        title: '商業工程',
        icon: 'laptop-outline',
        color: '#9C27B0',
      },
    },
  };
}

function defaultHomepageAreas() {
  return {
    hero: {
      bannerImageUrl: '',
      title: '為餐廳提供優質食品供應',
      titleSpan: '餐廳',
      description: '透過iFoodPulse，獲得新鮮食材、優質肉類以及經營餐廳所需的一切。',
      button1Text: '開始您的會員資格',
      button1Link: '/partners/apply',
      button2Text: '瀏覽產品',
      button2Link: '/products',
    },
    features: {
      title: '為什麼選擇高質食品供應商？',
      description: '我們以優質品質和可靠服務提供餐廳所需的一切。',
      block1: {
        title: '快速配送',
        description: '您的訂單將在24-48小時內送達餐廳門口。',
      },
      block2: {
        title: '品質保證',
        description: '所有產品都經過精心挑選，符合最高品質標準。',
      },
      block3: {
        title: '24/7 支援',
        description: '我們的客戶支援團隊全天候為您提供協助。',
      },
      block4: {
        title: '餐廳網絡',
        description: '加入我們成功餐廳的網絡，獲得獨家優惠。',
      },
      block5: {
        title: '優質產品',
        description: '獲得優質食材和特色產品，豐富您的菜單。',
      },
      block6: {
        title: '簡易訂購',
        description: '簡易的線上訂購系統，具備訂單追蹤和管理功能。',
      },
    },
    testimonials: {
      title: '我們的會員怎麼說',
      description: '加入全國數千間滿意的餐廳。',
      item1: {
        name: '莎拉·約翰遜',
        restaurant: '花園小館',
        text: '高質食品供應商改變了我們的餐廳營運。品質和可靠性無與倫比。',
      },
      item2: {
        name: '陳邁克',
        restaurant: '金龍餐廳',
        text: '優質服務和頂級產品。我們的顧客喜愛我們使用的食材品質。',
      },
      item3: {
        name: '艾米莉·羅德里格斯',
        restaurant: '月神咖啡廳',
        text: '會員計劃物超所值。我們在獲得更好產品的同時節省時間和金錢。',
      },
    },
    cta: {
      title: '準備好改變您的餐廳了嗎？',
      description: '今天就加入我們的會員計劃，開始享受優質食品供應服務。',
      button1Text: '開始免費試用',
      button1Link: '/partners/apply',
      button2Text: '查看價格',
      button2Link: '/pricing',
    },
    seo: {
      title: '首頁 - FoodSupplier',
      description: 'FoodSupplier 提供餐飲採購一站式解決方案。',
    },
  };
}

function defaultRestaurantConstructionAreas() {
  return {
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
  };
}

function defaultRestaurantFurnitureAreas() {
  return {
    hero: {
      title: '專業餐廳傢具',
      description: '提供各式餐廳傢具，打造舒適優雅的用餐環境',
      button1Text: '免費諮詢',
      button2Text: '預約參觀',
    },
    categories: {
      title: '傢具類別',
      description: '點擊查看詳細資訊，我們提供多種傢具類別滿足不同需求',
      items: [
        {
          title: '餐桌椅組合',
          description: '各式餐桌椅組合，適合不同餐廳風格',
          priceRange: 'HKD$ 2,000 - 15,000',
        },
        {
          title: '沙發座椅',
          description: '舒適的沙發座椅，提升用餐體驗',
          priceRange: 'HKD$ 3,000 - 25,000',
        },
        {
          title: '收納櫃',
          description: '實用的收納櫃，保持餐廳整潔',
          priceRange: 'HKD$ 1,500 - 12,000',
        },
        {
          title: '吧台設備',
          description: '專業吧台設備，打造完美酒吧區',
          priceRange: 'HKD$ 5,000 - 30,000',
        },
        {
          title: '裝飾傢具',
          description: '精美裝飾傢具，營造餐廳氛圍',
          priceRange: 'HKD$ 800 - 8,000',
        },
        {
          title: '戶外傢具',
          description: '耐用戶外傢具，適合露天用餐區',
          priceRange: 'HKD$ 2,500 - 20,000',
        },
      ],
    },
    services: {
      title: '服務特色',
      description: '提供客製化設計、專業安裝、品質保證與完善售後服務',
      items: [
        {
          title: '客製化設計',
          description: '根據餐廳風格提供客製化傢具設計',
          features: ['免費設計諮詢', '3D效果圖', '材質選擇', '尺寸客製'],
        },
        {
          title: '專業安裝',
          description: '專業團隊提供傢具安裝服務',
          features: ['免費安裝', '現場組裝', '品質檢查', '使用指導'],
        },
        {
          title: '品質保證',
          description: '使用優質材料，提供品質保證',
          features: ['原廠保固', '品質認證', '售後服務', '維修保養'],
        },
        {
          title: '售後服務',
          description: '完善的售後服務與維護保養',
          features: ['定期保養', '故障維修', '零件更換', '技術支援'],
        },
      ],
    },
    contact: {
      title: '立即諮詢',
      description: '專業團隊為您提供傢具諮詢與報價服務',
      button1Text: '聯絡我們',
      button2Text: '預約參觀',
    },
  };
}

function defaultKitchenEquipmentAreas() {
  return {
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
  };
}

function defaultPromotionAreas() {
  return {
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
          popular: true,
          features: ['數據分析', 'A/B測試', 'ROI追蹤', '24/7監控'],
        },
        {
          title: '傳統廣告',
          description: '傳統媒體廣告投放服務',
          items: ['報紙廣告', '雜誌廣告', '廣播廣告', '電視廣告', '戶外看板', '傳單設計'],
          priceRange: 'HKD$ 5,000 - 50,000/次',
          popular: false,
          features: ['媒體規劃', '創意設計', '投放執行', '效果評估'],
        },
        {
          title: '活動策劃',
          description: '專業活動策劃與執行',
          items: ['開幕活動', '節慶活動', '促銷活動', '品嚐會', '記者會', '展覽活動'],
          priceRange: 'HKD$ 10,000 - 100,000/場',
          popular: true,
          features: ['全程策劃', '現場執行', '媒體邀請', '效果追蹤'],
        },
        {
          title: '品牌設計',
          description: '完整的品牌形象設計',
          items: ['Logo設計', '名片設計', '菜單設計', '包裝設計', '店面設計', '制服設計'],
          priceRange: 'HKD$ 2,000 - 20,000/項',
          popular: true,
          features: ['品牌策略', '視覺設計', '應用規範', '品牌手冊'],
        },
        {
          title: '內容創作',
          description: '專業內容創作與製作',
          items: ['美食攝影', '影片製作', '文案撰寫', '產品介紹', '故事行銷', '內容企劃'],
          priceRange: 'HKD$ 1,500 - 8,000/項',
          popular: false,
          features: ['專業攝影', '後製剪輯', '文案創作', '多平台發布'],
        },
        {
          title: '公關服務',
          description: '專業公關與媒體關係',
          items: ['媒體關係', '新聞發布', '危機處理', '口碑管理', 'KOL合作', '網紅行銷'],
          priceRange: 'HKD$ 8,000 - 30,000/月',
          popular: false,
          features: ['媒體監測', '危機預警', 'KOL配對', '效果報告'],
        },
      ],
    },
    services: {
      title: '服務特色',
      description: '我們提供全方位的宣傳服務，從策略到執行，確保最佳效果',
      items: [
        {
          title: '策略規劃',
          description: '根據餐廳特色制定專屬行銷策略',
          features: ['市場分析', '競爭分析', '目標設定', '策略制定'],
        },
        {
          title: '創意設計',
          description: '專業設計團隊提供創意視覺設計',
          features: ['視覺設計', '創意企劃', '品牌識別', '多媒體製作'],
        },
        {
          title: '數據分析',
          description: '詳細數據分析，優化行銷效果',
          features: ['數據收集', '效果分析', '優化建議', '報告製作'],
        },
        {
          title: '效果追蹤',
          description: '持續追蹤行銷效果，調整策略',
          features: ['效果監測', '策略調整', '績效報告', '持續優化'],
        },
      ],
    },
    contact: {
      title: '立即諮詢',
      description: '專業行銷團隊為您提供免費諮詢與方案規劃',
      button1Text: '聯絡我們',
      button2Text: '預約會議',
    },
  };
}

function defaultDishesTablewareAreas() {
  return {
    hero: {
      title: '專業餐碟餐具',
      description:
        '提升用餐體驗，展現餐廳品味，提供多款高品質餐碟餐具選擇。',
    },
    categories: {
      title: '產品分類',
      description:
        '我們提供多種餐碟餐具產品，從基本款到高級款一應俱全。',
      items: [
        {
          title: '餐具套裝',
          description: '精美餐具套裝，提升用餐體驗',
          priceRange: 'HKD$ 200 - 2,000',
          items: ['陶瓷餐具', '骨瓷餐具', '不鏽鋼餐具', '木製餐具', '竹製餐具'],
          popular: true,
        },
        {
          title: '玻璃器皿',
          description: '高品質玻璃器皿，透明美觀',
          priceRange: 'HKD$ 50 - 800',
          items: ['酒杯', '水杯', '咖啡杯', '茶具', '玻璃碗', '玻璃盤'],
          popular: true,
        },
        {
          title: '廚房用具',
          description: '實用廚房用具，提升烹飪效率',
          priceRange: 'HKD$ 100 - 1,500',
          items: ['刀具', '砧板', '鍋具', '鏟子', '勺子', '量杯'],
          popular: false,
        },
        {
          title: '餐桌用品',
          description: '精美餐桌用品，營造用餐氛圍',
          priceRange: 'HKD$ 30 - 500',
          items: ['桌布', '餐墊', '餐巾', '花瓶', '蠟燭', '裝飾品'],
          popular: false,
        },
        {
          title: '清潔用品',
          description: '專業清潔用品，保持餐具衛生',
          priceRange: 'HKD$ 20 - 200',
          items: ['洗碗精', '清潔劑', '消毒液', '抹布', '海綿', '刷子'],
          popular: false,
        },
        {
          title: '儲存用品',
          description: '實用儲存用品，保持餐具整潔',
          priceRange: 'HKD$ 50 - 800',
          items: ['餐具盒', '保鮮盒', '密封罐', '收納架', '餐具櫃', '防塵罩'],
          popular: false,
        },
      ],
    },
    services: {
      title: '服務特色',
      items: [
        {
          title: '客製化設計',
          description: '根據餐廳風格提供客製化餐具設計',
          features: ['免費設計諮詢', '品牌定制', '材質選擇', '尺寸客製'],
        },
        {
          title: '品質保證',
          description: '使用優質材料，提供品質保證',
          features: ['原廠保固', '品質認證', '售後服務', '維修保養'],
        },
        {
          title: '批量採購',
          description: '提供批量採購優惠價格',
          features: ['批量折扣', '免費配送', '庫存管理', '定期補貨'],
        },
        {
          title: '售後服務',
          description: '完善的售後服務與維護保養',
          features: ['定期保養', '故障維修', '零件更換', '技術支援'],
        },
      ],
    },
    contact: {
      title: '立即聯繫我們',
      description: '專業團隊為您提供最優質的服務',
      button1Text: '聯絡我們',
    },
  };
}

function defaultRestaurantMaintenanceAreas() {
  return {
    hero: {
      title: '專業餐飲維修',
      description: '24小時服務，快速解決問題，確保餐廳營運不中斷。',
    },
    categories: {
      title: '維修服務',
      items: [
        {
          title: '設備維修',
          description: '專業設備維修服務，確保正常運作',
          items: ['廚房設備', '空調系統', '冰箱維修', '爐具維修', '洗碗機維修'],
        },
        {
          title: '水電維修',
          description: '專業水電維修，解決各種水電問題',
          items: ['水管維修', '電路維修', '燈具更換', '插座維修', '水龍頭維修'],
        },
        {
          title: '清潔保養',
          description: '專業清潔保養服務，保持環境衛生',
          items: ['深度清潔', '設備保養', '管道清潔', '通風清潔', '定期保養'],
        },
        {
          title: '傢具維修',
          description: '專業傢具維修，延長使用壽命',
          items: ['桌椅維修', '櫃子維修', '沙發維修', '門窗維修', '裝飾維修'],
        },
        {
          title: '緊急維修',
          description: '24小時緊急維修服務，快速解決問題',
          items: ['緊急搶修', '故障排除', '應急處理', '臨時修復', '緊急支援'],
        },
      ],
    },
    features: {
      title: '服務特色',
      items: [
        {
          title: '24小時服務',
          description: '提供24小時緊急維修服務',
        },
        {
          title: '專業技術',
          description: '擁有專業技術團隊和先進設備',
        },
        {
          title: '原廠零件',
          description: '使用原廠零件，確保維修品質',
        },
        {
          title: '合理價格',
          description: '提供合理透明的維修價格',
        },
      ],
    },
    contact: {
      title: '立即聯繫我們',
      description: '專業團隊為您提供最優質的維修服務，保持設備運作順暢。',
      button1Text: '聯絡我們',
    },
  };
}

function defaultRestaurantSystemsAreas() {
  return {
    hero: {
      title: '智能餐飲系統',
      description:
        '提升營運效率，優化客戶體驗，為餐廳提供一站式系統解決方案。',
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
      description: '專業團隊為您提供最優質的系統規劃與導入服務。',
      button1Text: '聯絡我們',
    },
  };
}

function SectionCard(props: { 
  title: string; 
  children: React.ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
}) {
  const isExpanded = props.isExpanded !== false; // Default to true if not provided
  
  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <button
        onClick={props.onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="font-medium text-left">{props.title}</div>
        {props.onToggle && (
          isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )
        )}
      </button>
      {isExpanded && (
        <div className="px-4 pb-4">
          {props.children}
        </div>
      )}
    </div>
  );
}

function TextField(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block mb-1 text-sm text-gray-600">{props.label}</label>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full rounded-md border px-3 py-2"
        placeholder={props.placeholder}
      />
    </div>
  );
}

function TextArea(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="md:col-span-2">
      <label className="block mb-1 text-sm text-gray-600">{props.label}</label>
      <textarea
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full rounded-md border px-3 py-2 min-h-[120px]"
        placeholder={props.placeholder}
      />
    </div>
  );
}

function updateNested(obj: any, path: (string | number)[], value: any) {
  const copy = { ...(obj || {}) };
  let cur = copy;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    cur[key] = { ...(cur[key] || {}) };
    cur = cur[key];
  }
  cur[path[path.length - 1]] = value;
  return copy;
}

