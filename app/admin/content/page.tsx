'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, setDoc, doc, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ImageUploader } from '@/components/ui/ImageUploader';
function defaultHomepageAreas() {
  return {
    hero: {
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


interface CmsPageDoc {
  title: string;
  slug: string;
  content?: string;
  areas?: any;
  updatedAt?: any;
}

const DEFAULT_PAGES: CmsPageDoc[] = [
  { title: '首頁', slug: 'homepage', areas: defaultHomepageAreas(), content: '' },
  { title: '關於我們', slug: 'about', content: '這是關於我們內容。' },
  { title: '聯絡我們', slug: 'contact', content: '這是聯絡我們內容。' },
  { title: '成為會員', slug: 'pricing', content: '這是成為會員頁面內容。' },
  { title: '合作夥伴', slug: 'partners', content: '這是合作夥伴頁面內容。' },
  { title: '餐廳工程', slug: 'restaurant-construction', content: '這是餐廳工程頁面內容。' },
  { title: '餐廳傢具', slug: 'restaurant-furniture', content: '這是餐廳傢具頁面內容。' },
  { title: '廚房設備', slug: 'kitchen-equipment', content: '這是廚房設備頁面內容。' },
  { title: '宣傳', slug: 'promotion', content: '這是宣傳頁面內容。' },
  { title: '手機APP', slug: 'mobile-app', areas: defaultMobileAppAreas(), content: '' },
];

export default function AdminContentListPage() {
  const [pages, setPages] = useState<CmsPageDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [seeding, setSeeding] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoLoading, setLogoLoading] = useState<boolean>(true);
  const [logoSaving, setLogoSaving] = useState<boolean>(false);

  const pagesRef = useMemo(() => collection(db, 'pages'), []);
  const settingsRef = useMemo(() => doc(db, 'settings', 'site'), []);

  const loadPages = async () => {
    try {
      setLoading(true);
      setError(null);
      const q = query(pagesRef);
      const snap = await getDocs(q);
      const docs: CmsPageDoc[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        docs.push({
          title: data.title || d.id || '未命名頁面',
          slug: data.slug || d.id || 'untitled',
          content: data.content || '',
          areas: data.areas || undefined,
          updatedAt: data.updatedAt,
        });
      });
      // Custom ordering
      const order = [
        'homepage',
        'mobile-app',
        'restaurant-construction',
        'restaurant-furniture',
        'kitchen-equipment',
        'promotion',
        'pricing',
        'partners',
        'about',
        'contact',
      ];
      docs.sort((a, b) => {
        const aIndex = order.indexOf(a.slug);
        const bIndex = order.indexOf(b.slug);
        // If both are in the order array, sort by their position
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        // If only one is in the order array, prioritize it
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        // If neither is in the order array, sort alphabetically by title
        return a.title.localeCompare(b.title, 'zh-Hant');
      });
      setPages(docs);
      if (docs.length === 0) {
        setError('目前沒有任何頁面。請點擊下方按鈕建立預設頁面。');
      }
    } catch (e: any) {
      console.error('Error loading pages:', e);
      setError(e?.message || '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  const loadLogo = async () => {
    try {
      setLogoLoading(true);
      const snap = await getDoc(settingsRef);
      if (snap.exists()) {
        const data = snap.data();
        setLogoUrl(data.logoUrl || '');
      }
    } catch (e: any) {
      console.error('Error loading logo:', e);
    } finally {
      setLogoLoading(false);
    }
  };

  const saveLogo = async (url: string) => {
    try {
      setLogoSaving(true);
      setLogoUrl(url);
      await setDoc(settingsRef, {
        logoUrl: url,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } catch (e: any) {
      console.error('Error saving logo:', e);
      setError('儲存 Logo 失敗: ' + (e?.message || '未知錯誤'));
    } finally {
      setLogoSaving(false);
    }
  };

  useEffect(() => {
    loadPages();
    loadLogo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seedDefaults = async () => {
    try {
      setError(null);
      setSeeding(true);
      const writes = DEFAULT_PAGES.map(async (p) => {
        await setDoc(doc(pagesRef, p.slug), {
          ...p,
          updatedAt: Timestamp.now(),
        }, { merge: true });
      });
      await Promise.all(writes);
      await loadPages();
    } catch (e: any) {
      setError(e?.message || '建立預設頁面失敗');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Logo Section */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">網站 Logo</h3>
        {logoLoading ? (
          <div className="text-gray-600 text-sm">載入中...</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Logo 圖片</label>
              <ImageUploader
                value={logoUrl}
                onChange={saveLogo}
                className="w-full"
                folder="images"
                disabled={logoSaving}
              />
              <p className="mt-2 text-xs text-gray-500">
                建議尺寸: 200x60px 或更高解析度，透明背景 PNG 格式為佳
              </p>
            </div>
            {logoUrl && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">預覽:</p>
                <div className="flex items-center space-x-2">
                  <img 
                    src={logoUrl} 
                    alt="Logo preview" 
                    className="h-12 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <span className="text-sm text-gray-600">Logo 將顯示在網站頂部</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pages Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">內容管理</h2>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200"
              onClick={loadPages}
            >
              重新整理
            </button>
            <button
              disabled={seeding}
              onClick={seedDefaults}
              className={`px-4 py-2 text-sm rounded-lg text-white ${seeding ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
            >
              {seeding ? '建立中...' : '建立預設頁面'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
        )}

      {loading ? (
        <div className="text-gray-600">載入中...</div>
      ) : pages.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="mb-3">目前沒有任何頁面。請點擊上方「建立預設頁面」按鈕。</p>
        </div>
      ) : (
        <div>
          <div className="mb-4 text-sm text-gray-600">
            共 {pages.length} 個頁面
          </div>
          <div className="divide-y rounded-lg border bg-white">
            {pages.map((p) => (
              <div key={p.slug} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-gray-500">/{p.slug}</div>
                  {p.updatedAt && (
                    <div className="text-xs text-gray-400 mt-1">
                      最後更新: {p.updatedAt?.toDate ? new Date(p.updatedAt.toDate()).toLocaleString('zh-TW') : '未知'}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/content/${p.slug}`}
                    className="px-3 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                  >
                    編輯
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}


