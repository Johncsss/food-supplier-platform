'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CmsPageDoc {
  title: string;
  slug: string;
  content?: string;
  areas?: any;
  updatedAt?: any;
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
    mobileBanners: false,
    mobilePromotionalBanners: false,
    mobileLongBanners: false,
    mobileSquareBanners: false,
    mobilePopupBanner: false,
    mobileLogo: false,
    mobileCategories: false,
  });

  const pageRef = useMemo(() => doc(db, 'pages', slug), [slug]);
  const updateArea = (path: string[], value: any) => {
    setAreas((prev: any) => updateNested(prev, path, value));
  };

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setLoading(true);
        const snap = await getDoc(pageRef);
        if (!snap.exists()) {
          // Initialize if missing
          let defaultAreas: any = undefined;
          if (slug === 'homepage') {
            defaultAreas = defaultHomepageAreas();
          } else if (slug === 'about') {
            defaultAreas = defaultAboutAreas();
          } else if (slug === 'contact') {
            defaultAreas = defaultContactAreas();
          } else if (slug === 'pricing') {
            defaultAreas = defaultPricingAreas();
          } else if (slug === 'partners') {
            defaultAreas = defaultPartnersAreas();
          } else if (slug === 'mobile-app') {
            defaultAreas = defaultMobileAppAreas();
          }
          const init: CmsPageDoc = { title: slug, slug, content: '', areas: defaultAreas };
          setData(init);
          setTitle(init.title);
          setContent(init.content || '');
          setAreas(init.areas || null);
        } else {
          const d = snap.data() as any;
          let defaultAreas: any = undefined;
          if (slug === 'homepage') {
            defaultAreas = defaultHomepageAreas();
          } else if (slug === 'about') {
            defaultAreas = defaultAboutAreas();
          } else if (slug === 'contact') {
            defaultAreas = defaultContactAreas();
          } else if (slug === 'pricing') {
            defaultAreas = defaultPricingAreas();
          } else if (slug === 'partners') {
            defaultAreas = defaultPartnersAreas();
          } else if (slug === 'mobile-app') {
            defaultAreas = defaultMobileAppAreas();
          }
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
          setAreas(page.areas || defaultAreas || null);
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
      await setDoc(pageRef, {
        title: title || slug,
        slug,
        content,
        areas: slug === 'homepage' ? (areas || defaultHomepageAreas()) : slug === 'about' ? (areas || defaultAboutAreas()) : slug === 'contact' ? (areas || defaultContactAreas()) : slug === 'pricing' ? (areas || defaultPricingAreas()) : slug === 'partners' ? (areas || defaultPartnersAreas()) : slug === 'mobile-app' ? (areas || defaultMobileAppAreas()) : undefined,
        updatedAt: Timestamp.now(),
      }, { merge: true });
      setSaved(true);
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
            disabled={saving}
            className={`px-4 py-2 text-sm rounded-lg text-white ${saving ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-700'}`}
          >
            {saving ? '儲存中...' : saved ? '已儲存' : '儲存'}
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
                    />
                    <p className="mt-1 text-xs text-gray-500">建議尺寸: 1920x600px 或更高解析度</p>
                  </div>
                  <TextField label="主標題" value={areas?.hero?.title || ''} onChange={(v) => updateArea(['hero','title'], v)} placeholder="為餐廳提供優質食品供應" />
                  <TextField label="主標題強調文字 (span)" value={areas?.hero?.titleSpan || ''} onChange={(v) => updateArea(['hero','titleSpan'], v)} placeholder="餐廳" />
                  <TextArea label="描述" value={areas?.hero?.description || ''} onChange={(v) => updateArea(['hero','description'], v)} placeholder="透過我們的年度會員計劃，獲得新鮮食材、優質肉類以及經營餐廳所需的一切。" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField label="按鈕 1 文字" value={areas?.hero?.button1Text || ''} onChange={(v) => updateArea(['hero','button1Text'], v)} placeholder="開始您的會員資格" />
                    <TextField label="按鈕 1 連結" value={areas?.hero?.button1Link || ''} onChange={(v) => updateArea(['hero','button1Link'], v)} placeholder="/register" />
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
                    <TextField label="按鈕 1 連結" value={areas?.cta?.button1Link || ''} onChange={(v) => updateArea(['cta','button1Link'], v)} placeholder="/register" />
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
                  <TextField label="按鈕 1 連結" value={areas?.cta?.button1Link || ''} onChange={(v) => updateArea(['cta','button1Link'], v)} placeholder="/register" />
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
                  <TextField label="標題" value={areas?.hero?.title || ''} onChange={(v) => updateArea(['hero','title'], v)} placeholder="選擇您的會員方案" />
                  <TextArea label="描述" value={areas?.hero?.description || ''} onChange={(v) => updateArea(['hero','description'], v)} placeholder="加入數千個信任食品供應商專業版進行食品供應需求的餐廳。所有方案均包含年度計費，無隱藏費用。" />
                </div>
              </SectionCard>

              <SectionCard 
                title="方案卡片" 
                isExpanded={expandedSections.pricingPlans}
                onToggle={() => setExpandedSections(prev => ({ ...prev, pricingPlans: !prev.pricingPlans }))}
              >
                <div className="space-y-6">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">方案 1: 基本方案</h5>
                    <TextField label="方案名稱" value={areas?.plans?.plan1?.name || ''} onChange={(v) => updateArea(['plans','plan1','name'], v)} placeholder="基本方案" />
                    <TextField label="描述" value={areas?.plans?.plan1?.description || ''} onChange={(v) => updateArea(['plans','plan1','description'], v)} placeholder="適合小型餐廳" />
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <TextField label="價格" value={areas?.plans?.plan1?.price || ''} onChange={(v) => updateArea(['plans','plan1','price'], v)} placeholder="999" />
                      <TextField label="原價" value={areas?.plans?.plan1?.originalPrice || ''} onChange={(v) => updateArea(['plans','plan1','originalPrice'], v)} placeholder="1299" />
                    </div>
                    <div className="mt-3">
                      <label className="block mb-2 text-sm text-gray-600">功能列表 (每行一項)</label>
                      <textarea
                        value={(areas?.plans?.plan1?.features || []).join('\n')}
                        onChange={(e) => updateArea(['plans','plan1','features'], e.target.value.split('\n').filter(f => f.trim()))}
                        className="w-full rounded-md border px-3 py-2 min-h-[150px]"
                        placeholder="存取所有產品&#10;標準配送 (48-72小時)&#10;電子郵件支援&#10;訂單追蹤&#10;基本分析&#10;每月最多50筆訂單"
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">方案 2: 專業方案</h5>
                    <TextField label="方案名稱" value={areas?.plans?.plan2?.name || ''} onChange={(v) => updateArea(['plans','plan2','name'], v)} placeholder="專業方案" />
                    <TextField label="描述" value={areas?.plans?.plan2?.description || ''} onChange={(v) => updateArea(['plans','plan2','description'], v)} placeholder="適合成長中的餐廳" />
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <TextField label="價格" value={areas?.plans?.plan2?.price || ''} onChange={(v) => updateArea(['plans','plan2','price'], v)} placeholder="1999" />
                      <TextField label="原價" value={areas?.plans?.plan2?.originalPrice || ''} onChange={(v) => updateArea(['plans','plan2','originalPrice'], v)} placeholder="2499" />
                    </div>
                    <div className="mt-3">
                      <label className="block mb-2 text-sm text-gray-600">功能列表 (每行一項)</label>
                      <textarea
                        value={(areas?.plans?.plan2?.features || []).join('\n')}
                        onChange={(e) => updateArea(['plans','plan2','features'], e.target.value.split('\n').filter(f => f.trim()))}
                        className="w-full rounded-md border px-3 py-2 min-h-[150px]"
                        placeholder="包含基本方案所有功能&#10;優先配送 (24-48小時)&#10;電話和電子郵件支援&#10;進階分析&#10;無限制訂單&#10;大量訂購折扣&#10;自訂配送排程&#10;專屬客戶經理"
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">方案 3: 高級方案</h5>
                    <TextField label="方案名稱" value={areas?.plans?.plan3?.name || ''} onChange={(v) => updateArea(['plans','plan3','name'], v)} placeholder="高級方案" />
                    <TextField label="描述" value={areas?.plans?.plan3?.description || ''} onChange={(v) => updateArea(['plans','plan3','description'], v)} placeholder="適合大型餐廳連鎖" />
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <TextField label="價格" value={areas?.plans?.plan3?.price || ''} onChange={(v) => updateArea(['plans','plan3','price'], v)} placeholder="3999" />
                      <TextField label="原價" value={areas?.plans?.plan3?.originalPrice || ''} onChange={(v) => updateArea(['plans','plan3','originalPrice'], v)} placeholder="4999" />
                    </div>
                    <div className="mt-3">
                      <label className="block mb-2 text-sm text-gray-600">功能列表 (每行一項)</label>
                      <textarea
                        value={(areas?.plans?.plan3?.features || []).join('\n')}
                        onChange={(e) => updateArea(['plans','plan3','features'], e.target.value.split('\n').filter(f => f.trim()))}
                        className="w-full rounded-md border px-3 py-2 min-h-[150px]"
                        placeholder="包含專業方案所有功能&#10;當日配送服務&#10;24/7優先支援&#10;客製化產品採購&#10;進階庫存管理&#10;多據點支援&#10;白標訂購系統&#10;API存取&#10;客製化整合"
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
                    <TextField label="問題" value={areas?.faq?.q1?.question || ''} onChange={(v) => updateArea(['faq','q1','question'], v)} placeholder="我可以取消我的會員資格嗎？" />
                    <TextArea label="答案" value={areas?.faq?.q1?.answer || ''} onChange={(v) => updateArea(['faq','q1','answer'], v)} placeholder="是的，您可以隨時取消您的會員資格。您的存取權限將持續到當前計費期結束。" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">問題 2</h5>
                    <TextField label="問題" value={areas?.faq?.q2?.question || ''} onChange={(v) => updateArea(['faq','q2','question'], v)} placeholder="有免費試用嗎？" />
                    <TextArea label="答案" value={areas?.faq?.q2?.answer || ''} onChange={(v) => updateArea(['faq','q2','answer'], v)} placeholder="我們為所有新會員提供14天免費試用。開始試用無需信用卡。" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">問題 3</h5>
                    <TextField label="問題" value={areas?.faq?.q3?.question || ''} onChange={(v) => updateArea(['faq','q3','question'], v)} placeholder="您接受哪些付款方式？" />
                    <TextArea label="答案" value={areas?.faq?.q3?.answer || ''} onChange={(v) => updateArea(['faq','q3','answer'], v)} placeholder="我們接受所有主要信用卡、金融卡和銀行轉帳。所有付款都通過Stripe安全處理。" />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium mb-3">問題 4</h5>
                    <TextField label="問題" value={areas?.faq?.q4?.question || ''} onChange={(v) => updateArea(['faq','q4','question'], v)} placeholder="我可以升級或降級我的方案嗎？" />
                    <TextArea label="答案" value={areas?.faq?.q4?.answer || ''} onChange={(v) => updateArea(['faq','q4','answer'], v)} placeholder="是的，您可以隨時升級或降級您的方案。變更將根據您當前的計費週期按比例計算。" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard 
                title="行動呼籲區塊 (CTA)" 
                isExpanded={expandedSections.pricingCta}
                onToggle={() => setExpandedSections(prev => ({ ...prev, pricingCta: !prev.pricingCta }))}
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField label="標題" value={areas?.cta?.title || ''} onChange={(v) => updateArea(['cta','title'], v)} placeholder="準備開始了嗎？" />
                  <TextArea label="描述" value={areas?.cta?.description || ''} onChange={(v) => updateArea(['cta','description'], v)} placeholder="加入數千個信任食品供應商專業版的餐廳" />
                  <TextField label="按鈕 1 文字" value={areas?.cta?.button1Text || ''} onChange={(v) => updateArea(['cta','button1Text'], v)} placeholder="開始免費試用" />
                  <TextField label="按鈕 2 文字" value={areas?.cta?.button2Text || ''} onChange={(v) => updateArea(['cta','button2Text'], v)} placeholder="聯繫銷售" />
                  <TextField label="按鈕 2 連結" value={areas?.cta?.button2Link || ''} onChange={(v) => updateArea(['cta','button2Link'], v)} placeholder="/contact" />
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
                  <TextField label="標題" value={areas?.hero?.title || ''} onChange={(v) => updateArea(['hero','title'], v)} placeholder="成為我們的合作夥伴" />
                  <TextArea label="描述" value={areas?.hero?.description || ''} onChange={(v) => updateArea(['hero','description'], v)} placeholder="與高質食品供應商攜手合作，共同打造香港最優質的餐廳食品供應平台" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField label="按鈕 1 文字" value={areas?.hero?.button1Text || ''} onChange={(v) => updateArea(['hero','button1Text'], v)} placeholder="立即申請合作" />
                    <TextField label="按鈕 2 文字" value={areas?.hero?.button2Text || ''} onChange={(v) => updateArea(['hero','button2Text'], v)} placeholder="了解更多" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard 
                title="合作優勢區塊" 
                isExpanded={expandedSections.partnersBenefits}
                onToggle={() => setExpandedSections(prev => ({ ...prev, partnersBenefits: !prev.partnersBenefits }))}
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField label="區塊標題" value={areas?.benefits?.title || ''} onChange={(v) => updateArea(['benefits','title'], v)} placeholder="合作優勢" />
                  <TextArea label="區塊描述" value={areas?.benefits?.description || ''} onChange={(v) => updateArea(['benefits','description'], v)} placeholder="加入我們的合作夥伴網絡，享受專業支援和業務增長機會" />
                  <div className="space-y-4 mt-4">
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h5 className="text-sm font-medium mb-3">優勢 1: 業務增長</h5>
                      <TextField label="標題" value={areas?.benefits?.benefit1?.title || ''} onChange={(v) => updateArea(['benefits','benefit1','title'], v)} placeholder="業務增長" />
                      <TextArea label="描述" value={areas?.benefits?.benefit1?.description || ''} onChange={(v) => updateArea(['benefits','benefit1','description'], v)} placeholder="透過我們的平台擴大您的業務範圍，接觸更多餐廳客戶" />
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h5 className="text-sm font-medium mb-3">優勢 2: 信譽保障</h5>
                      <TextField label="標題" value={areas?.benefits?.benefit2?.title || ''} onChange={(v) => updateArea(['benefits','benefit2','title'], v)} placeholder="信譽保障" />
                      <TextArea label="描述" value={areas?.benefits?.benefit2?.description || ''} onChange={(v) => updateArea(['benefits','benefit2','description'], v)} placeholder="與知名食品供應商合作，提升您的品牌信譽和市場地位" />
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h5 className="text-sm font-medium mb-3">優勢 3: 市場擴展</h5>
                      <TextField label="標題" value={areas?.benefits?.benefit3?.title || ''} onChange={(v) => updateArea(['benefits','benefit3','title'], v)} placeholder="市場擴展" />
                      <TextArea label="描述" value={areas?.benefits?.benefit3?.description || ''} onChange={(v) => updateArea(['benefits','benefit3','description'], v)} placeholder="進入香港及周邊地區的餐廳市場，擴大您的業務版圖" />
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h5 className="text-sm font-medium mb-3">優勢 4: 專業支援</h5>
                      <TextField label="標題" value={areas?.benefits?.benefit4?.title || ''} onChange={(v) => updateArea(['benefits','benefit4','title'], v)} placeholder="專業支援" />
                      <TextArea label="描述" value={areas?.benefits?.benefit4?.description || ''} onChange={(v) => updateArea(['benefits','benefit4','description'], v)} placeholder="獲得專業的業務支援和技術指導，確保合作順利進行" />
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard 
                title="合作類型" 
                isExpanded={expandedSections.partnersTypes}
                onToggle={() => setExpandedSections(prev => ({ ...prev, partnersTypes: !prev.partnersTypes }))}
              >
                <div className="grid grid-cols-1 gap-4">
                  <TextField label="區塊標題" value={areas?.partnershipTypes?.title || ''} onChange={(v) => updateArea(['partnershipTypes','title'], v)} placeholder="合作類型" />
                  <TextArea label="區塊描述" value={areas?.partnershipTypes?.description || ''} onChange={(v) => updateArea(['partnershipTypes','description'], v)} placeholder="我們提供多種合作模式，滿足不同類型的合作夥伴需求" />
                  <div className="space-y-4 mt-4">
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h5 className="text-sm font-medium mb-3">類型 1: 供應商合作</h5>
                      <TextField label="標題" value={areas?.partnershipTypes?.type1?.title || ''} onChange={(v) => updateArea(['partnershipTypes','type1','title'], v)} placeholder="供應商合作" />
                      <TextArea label="描述" value={areas?.partnershipTypes?.type1?.description || ''} onChange={(v) => updateArea(['partnershipTypes','type1','description'], v)} placeholder="成為我們的優質供應商，為餐廳提供新鮮優質的食材" />
                      <div className="mt-3">
                        <label className="block mb-2 text-sm text-gray-600">功能列表 (每行一項)</label>
                        <textarea
                          value={(areas?.partnershipTypes?.type1?.features || []).join('\n')}
                          onChange={(e) => updateArea(['partnershipTypes','type1','features'], e.target.value.split('\n').filter(f => f.trim()))}
                          className="w-full rounded-md border px-3 py-2 min-h-[100px]"
                          placeholder="產品展示&#10;訂單管理&#10;物流支援&#10;品質保證"
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h5 className="text-sm font-medium mb-3">類型 2: 配送夥伴</h5>
                      <TextField label="標題" value={areas?.partnershipTypes?.type2?.title || ''} onChange={(v) => updateArea(['partnershipTypes','type2','title'], v)} placeholder="配送夥伴" />
                      <TextArea label="描述" value={areas?.partnershipTypes?.type2?.description || ''} onChange={(v) => updateArea(['partnershipTypes','type2','description'], v)} placeholder="加入我們的配送網絡，為餐廳提供快速可靠的配送服務" />
                      <div className="mt-3">
                        <label className="block mb-2 text-sm text-gray-600">功能列表 (每行一項)</label>
                        <textarea
                          value={(areas?.partnershipTypes?.type2?.features || []).join('\n')}
                          onChange={(e) => updateArea(['partnershipTypes','type2','features'], e.target.value.split('\n').filter(f => f.trim()))}
                          className="w-full rounded-md border px-3 py-2 min-h-[100px]"
                          placeholder="配送管理&#10;路線優化&#10;即時追蹤&#10;客戶服務"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard 
                title="合作要求與申請流程" 
                isExpanded={expandedSections.partnersRequirements}
                onToggle={() => setExpandedSections(prev => ({ ...prev, partnersRequirements: !prev.partnersRequirements }))}
              >
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <TextField label="要求區塊標題" value={areas?.requirements?.title || ''} onChange={(v) => updateArea(['requirements','title'], v)} placeholder="合作要求" />
                    <TextArea label="要求區塊描述" value={areas?.requirements?.description || ''} onChange={(v) => updateArea(['requirements','description'], v)} placeholder="我們尋求具有專業能力和良好信譽的合作夥伴，共同為餐廳提供優質服務" />
                    <div className="mt-3">
                      <label className="block mb-2 text-sm text-gray-600">要求列表 (每行一項)</label>
                      <textarea
                        value={(areas?.requirements?.requirementsList || []).join('\n')}
                        onChange={(e) => updateArea(['requirements','requirementsList'], e.target.value.split('\n').filter(f => f.trim()))}
                        className="w-full rounded-md border px-3 py-2 min-h-[150px]"
                        placeholder="具有相關行業經驗和專業資質&#10;提供優質的產品或服務&#10;遵守行業標準和法規要求&#10;具備良好的商業信譽和財務狀況&#10;願意與我們長期合作共同發展"
                      />
                    </div>
                  </div>
                  <div className="border-t pt-6">
                    <TextField label="申請流程標題" value={areas?.requirements?.processTitle || ''} onChange={(v) => updateArea(['requirements','processTitle'], v)} placeholder="申請流程" />
                    <div className="space-y-4 mt-4">
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <h5 className="text-sm font-medium mb-3">步驟 1</h5>
                        <TextField label="標題" value={areas?.requirements?.step1?.title || ''} onChange={(v) => updateArea(['requirements','step1','title'], v)} placeholder="提交申請" />
                        <TextArea label="描述" value={areas?.requirements?.step1?.description || ''} onChange={(v) => updateArea(['requirements','step1','description'], v)} placeholder="填寫合作申請表單" />
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <h5 className="text-sm font-medium mb-3">步驟 2</h5>
                        <TextField label="標題" value={areas?.requirements?.step2?.title || ''} onChange={(v) => updateArea(['requirements','step2','title'], v)} placeholder="資格審核" />
                        <TextArea label="描述" value={areas?.requirements?.step2?.description || ''} onChange={(v) => updateArea(['requirements','step2','description'], v)} placeholder="我們會審核您的申請資料" />
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <h5 className="text-sm font-medium mb-3">步驟 3</h5>
                        <TextField label="標題" value={areas?.requirements?.step3?.title || ''} onChange={(v) => updateArea(['requirements','step3','title'], v)} placeholder="面談協商" />
                        <TextArea label="描述" value={areas?.requirements?.step3?.description || ''} onChange={(v) => updateArea(['requirements','step3','description'], v)} placeholder="進行詳細的合作討論" />
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <h5 className="text-sm font-medium mb-3">步驟 4</h5>
                        <TextField label="標題" value={areas?.requirements?.step4?.title || ''} onChange={(v) => updateArea(['requirements','step4','title'], v)} placeholder="簽約合作" />
                        <TextArea label="描述" value={areas?.requirements?.step4?.description || ''} onChange={(v) => updateArea(['requirements','step4','description'], v)} placeholder="正式建立合作關係" />
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
                  <TextField label="標題" value={areas?.cta?.title || ''} onChange={(v) => updateArea(['cta','title'], v)} placeholder="準備好成為我們的合作夥伴了嗎？" />
                  <TextArea label="描述" value={areas?.cta?.description || ''} onChange={(v) => updateArea(['cta','description'], v)} placeholder="立即提交您的合作申請，與我們攜手打造香港最優質的餐廳食品供應平台" />
                  <TextField label="按鈕 1 文字" value={areas?.cta?.button1Text || ''} onChange={(v) => updateArea(['cta','button1Text'], v)} placeholder="立即申請合作" />
                  <TextField label="按鈕 2 文字" value={areas?.cta?.button2Text || ''} onChange={(v) => updateArea(['cta','button2Text'], v)} placeholder="下載合作資料" />
                </div>
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
                        onError={(err) => setUploadError(`分類 1 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 100x100px 或更高解析度</p>
                    </div>
                    <TextField label="標題" value={areas?.categories?.category1?.title || ''} onChange={(v) => updateArea(['categories','category1','title'], v)} placeholder="食材訂購" />
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
                        onError={(err) => setUploadError(`分類 2 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 100x100px 或更高解析度</p>
                    </div>
                    <TextField label="標題" value={areas?.categories?.category2?.title || ''} onChange={(v) => updateArea(['categories','category2','title'], v)} placeholder="餐廳工程" />
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
                        onError={(err) => setUploadError(`分類 3 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 100x100px 或更高解析度</p>
                    </div>
                    <TextField label="標題" value={areas?.categories?.category3?.title || ''} onChange={(v) => updateArea(['categories','category3','title'], v)} placeholder="餐廳傢具" />
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
                        onError={(err) => setUploadError(`分類 4 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 100x100px 或更高解析度</p>
                    </div>
                    <TextField label="標題" value={areas?.categories?.category4?.title || ''} onChange={(v) => updateArea(['categories','category4','title'], v)} placeholder="廚房設備" />
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
                        onError={(err) => setUploadError(`分類 5 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 100x100px 或更高解析度</p>
                    </div>
                    <TextField label="標題" value={areas?.categories?.category5?.title || ''} onChange={(v) => updateArea(['categories','category5','title'], v)} placeholder="宣傳" />
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
                        onError={(err) => setUploadError(`分類 6 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 100x100px 或更高解析度</p>
                    </div>
                    <TextField label="標題" value={areas?.categories?.category6?.title || ''} onChange={(v) => updateArea(['categories','category6','title'], v)} placeholder="餐碟餐具" />
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
                        onError={(err) => setUploadError(`分類 7 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 100x100px 或更高解析度</p>
                    </div>
                    <TextField label="標題" value={areas?.categories?.category7?.title || ''} onChange={(v) => updateArea(['categories','category7','title'], v)} placeholder="餐飲維修" />
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
                        onError={(err) => setUploadError(`分類 8 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 100x100px 或更高解析度</p>
                    </div>
                    <TextField label="標題" value={areas?.categories?.category8?.title || ''} onChange={(v) => updateArea(['categories','category8','title'], v)} placeholder="餐飲系統" />
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
                        onError={(err) => setUploadError(`促銷 Banner 1 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 600x300px</p>
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
                        onError={(err) => setUploadError(`促銷 Banner 2 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 600x300px</p>
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
                        onError={(err) => setUploadError(`促銷 Banner 3 圖片上傳失敗: ${err}`)}
                        className="w-full"
                        folder="app_images"
                      />
                      <p className="mt-1 text-xs text-gray-500">建議尺寸: 600x300px</p>
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
                            onError={(err) => setUploadError(`方形 Banner ${index + 1} 圖片上傳失敗: ${err}`)}
                            className="w-full"
                            folder="app_images"
                          />
                          <p className="mt-1 text-xs text-gray-500">建議尺寸: 400x400px 或更高解析度</p>
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
                      onError={(err) => setUploadError(`彈出式 Banner 圖片上傳失敗: ${err}`)}
                      className="w-full"
                      folder="app_images"
                    />
                    <p className="mt-1 text-xs text-gray-500">建議尺寸: 600x800px 或更高解析度</p>
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
      button1Link: '/register',
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
      title: '選擇您的會員方案',
      description: '加入數千個信任食品供應商專業版進行食品供應需求的餐廳。所有方案均包含年度計費，無隱藏費用。',
    },
    plans: {
      plan1: {
        name: '基本方案',
        description: '適合小型餐廳',
        price: '999',
        originalPrice: '1299',
        features: [
          '存取所有產品',
          '標準配送 (48-72小時)',
          '電子郵件支援',
          '訂單追蹤',
          '基本分析',
          '每月最多50筆訂單',
        ],
      },
      plan2: {
        name: '專業方案',
        description: '適合成長中的餐廳',
        price: '1999',
        originalPrice: '2499',
        features: [
          '包含基本方案所有功能',
          '優先配送 (24-48小時)',
          '電話和電子郵件支援',
          '進階分析',
          '無限制訂單',
          '大量訂購折扣',
          '自訂配送排程',
          '專屬客戶經理',
        ],
      },
      plan3: {
        name: '高級方案',
        description: '適合大型餐廳連鎖',
        price: '3999',
        originalPrice: '4999',
        features: [
          '包含專業方案所有功能',
          '當日配送服務',
          '24/7優先支援',
          '客製化產品採購',
          '進階庫存管理',
          '多據點支援',
          '白標訂購系統',
          'API存取',
          '客製化整合',
        ],
      },
    },
    faq: {
      q1: {
        question: '我可以取消我的會員資格嗎？',
        answer: '是的，您可以隨時取消您的會員資格。您的存取權限將持續到當前計費期結束。',
      },
      q2: {
        question: '有免費試用嗎？',
        answer: '我們為所有新會員提供14天免費試用。開始試用無需信用卡。',
      },
      q3: {
        question: '您接受哪些付款方式？',
        answer: '我們接受所有主要信用卡、金融卡和銀行轉帳。所有付款都通過Stripe安全處理。',
      },
      q4: {
        question: '我可以升級或降級我的方案嗎？',
        answer: '是的，您可以隨時升級或降級您的方案。變更將根據您當前的計費週期按比例計算。',
      },
    },
    cta: {
      title: '準備開始了嗎？',
      description: '加入數千個信任食品供應商專業版的餐廳',
      button1Text: '開始免費試用',
      button2Text: '聯繫銷售',
      button2Link: '/contact',
    },
  };
}

function defaultPartnersAreas() {
  return {
    hero: {
      title: '成為我們的合作夥伴',
      description: '與高質食品供應商攜手合作，共同打造香港最優質的餐廳食品供應平台',
      button1Text: '立即申請合作',
      button2Text: '了解更多',
    },
    benefits: {
      title: '合作優勢',
      description: '加入我們的合作夥伴網絡，享受專業支援和業務增長機會',
      benefit1: {
        title: '業務增長',
        description: '透過我們的平台擴大您的業務範圍，接觸更多餐廳客戶',
      },
      benefit2: {
        title: '信譽保障',
        description: '與知名食品供應商合作，提升您的品牌信譽和市場地位',
      },
      benefit3: {
        title: '市場擴展',
        description: '進入香港及周邊地區的餐廳市場，擴大您的業務版圖',
      },
      benefit4: {
        title: '專業支援',
        description: '獲得專業的業務支援和技術指導，確保合作順利進行',
      },
    },
    partnershipTypes: {
      title: '合作類型',
      description: '我們提供多種合作模式，滿足不同類型的合作夥伴需求',
      type1: {
        title: '供應商合作',
        description: '成為我們的優質供應商，為餐廳提供新鮮優質的食材',
        features: ['產品展示', '訂單管理', '物流支援', '品質保證'],
      },
      type2: {
        title: '配送夥伴',
        description: '加入我們的配送網絡，為餐廳提供快速可靠的配送服務',
        features: ['配送管理', '路線優化', '即時追蹤', '客戶服務'],
      },
    },
    requirements: {
      title: '合作要求',
      description: '我們尋求具有專業能力和良好信譽的合作夥伴，共同為餐廳提供優質服務',
      requirementsList: [
        '具有相關行業經驗和專業資質',
        '提供優質的產品或服務',
        '遵守行業標準和法規要求',
        '具備良好的商業信譽和財務狀況',
        '願意與我們長期合作共同發展',
      ],
      processTitle: '申請流程',
      step1: {
        title: '提交申請',
        description: '填寫合作申請表單',
      },
      step2: {
        title: '資格審核',
        description: '我們會審核您的申請資料',
      },
      step3: {
        title: '面談協商',
        description: '進行詳細的合作討論',
      },
      step4: {
        title: '簽約合作',
        description: '正式建立合作關係',
      },
    },
    cta: {
      title: '準備好成為我們的合作夥伴了嗎？',
      description: '立即提交您的合作申請，與我們攜手打造香港最優質的餐廳食品供應平台',
      button1Text: '立即申請合作',
      button2Text: '下載合作資料',
    },
  };
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
        title: '餐廳工程',
        icon: 'construct-outline',
        color: '#3B82F6',
      },
      category3: {
        title: '餐廳傢具',
        icon: 'bed-outline',
        color: '#8B5CF6',
      },
      category4: {
        title: '廚房設備',
        icon: 'hardware-chip-outline',
        color: '#F59E0B',
      },
      category5: {
        title: '宣傳',
        icon: 'megaphone-outline',
        color: '#EF4444',
      },
      category6: {
        title: '餐碟餐具',
        icon: 'restaurant-outline',
        color: '#06B6D4',
      },
      category7: {
        title: '餐飲維修',
        icon: 'construct-outline',
        color: '#8B5A2B',
      },
      category8: {
        title: '餐飲系統',
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
      description: '透過我們的年度會員計劃，獲得新鮮食材、優質肉類以及經營餐廳所需的一切。',
      button1Text: '開始您的會員資格',
      button1Link: '/register',
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
      button1Link: '/register',
      button2Text: '查看價格',
      button2Link: '/pricing',
    },
    seo: {
      title: '首頁 - FoodSupplier',
      description: 'FoodSupplier 提供餐飲採購一站式解決方案。',
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

function updateNested(obj: any, path: string[], value: any) {
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

