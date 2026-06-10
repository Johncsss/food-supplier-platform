// Service page defaults matching the website DEFAULT_AREAS
// These ensure content always displays even if CMS data is missing

export const SERVICE_PAGE_DEFAULTS: Record<string, any> = {
  'restaurant-maintenance': {
    banner: {
      imageUrl: '',
    },
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
  },
  'kitchen-equipment': {
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
  },
  'dishes-tableware': {
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
  },
  'restaurant-furniture': {
    banner: {
      imageUrl: '',
    },
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
        },
        {
          title: '專業安裝',
          description: '專業團隊提供傢具安裝服務',
        },
        {
          title: '品質保證',
          description: '使用優質材料，提供品質保證',
        },
        {
          title: '售後服務',
          description: '完善的售後服務與維護保養',
        },
      ],
    },
    contact: {
      title: '立即諮詢',
      description: '專業團隊為您提供傢具諮詢與報價服務',
      button1Text: '聯絡我們',
      button2Text: '預約參觀',
    },
  },
  'promotion': {
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
      button2Text: '預約會議',
    },
  },
  'restaurant-systems': {
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
  },
  'restaurant-construction': {
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
  },
};

// Fetch page data from website API
// The API now handles merging defaults with CMS data, so we just return what it gives us
export async function fetchServicePageAreas(slug: string): Promise<any> {
  try {
    const API_CONFIG = require('../config/api').API_CONFIG;
    const buildApiUrl = require('../config/api').buildApiUrl;
    const apiUrl = buildApiUrl(`/api/pages/${slug}`);
    
    if (__DEV__) {
      console.log(`[fetchServicePageAreas] Fetching ${slug} from: ${apiUrl}`);
    }
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch page data: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (__DEV__) {
      console.log(`[fetchServicePageAreas] ${slug} API response:`, {
        success: result.success,
        hasAreas: !!result.page?.areas,
        categoriesTitle: result.page?.areas?.categories?.title,
        promotionServicesTitle: result.page?.areas?.promotionServices?.title,
        servicesTitle: result.page?.areas?.services?.title,
      });
    }
    
    if (result.success && result.page?.areas) {
      // API already merges defaults with CMS data, so just return it
      return result.page.areas;
    }
    
    // Fallback to defaults if API returns no areas
    if (__DEV__) {
      console.warn(`[fetchServicePageAreas] ${slug} API returned no areas, using defaults`);
    }
    return SERVICE_PAGE_DEFAULTS[slug] || {};
  } catch (error: any) {
    if (__DEV__) {
      console.error(`[fetchServicePageAreas] Error loading ${slug} page data:`, error);
      console.log(`[fetchServicePageAreas] Using defaults for ${slug}`);
    }
    // Return defaults on error
    return SERVICE_PAGE_DEFAULTS[slug] || {};
  }
}

// Fetch mobile-app page data from website API
// This ensures we can access the data even if Firestore security rules restrict direct reads
export async function fetchMobileAppData(): Promise<any> {
  try {
    const API_CONFIG = require('../config/api').API_CONFIG;
    const buildApiUrl = require('../config/api').buildApiUrl;
    const apiUrl = buildApiUrl('/api/pages/mobile-app');
    
    if (__DEV__) {
      console.log(`[fetchMobileAppData] Fetching mobile-app from: ${apiUrl}`);
    }
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch mobile-app data: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (__DEV__) {
      console.log(`[fetchMobileAppData] API response:`, {
        success: result.success,
        hasAreas: !!result.page?.areas,
        hasCategories: !!result.page?.areas?.categories,
        categoryCount: result.page?.areas?.categories ? Object.keys(result.page.areas.categories).length : 0,
      });
    }
    
    if (result.success && result.page?.areas) {
      return result.page.areas;
    }
    
    // Return empty object if no data
    if (__DEV__) {
      console.warn(`[fetchMobileAppData] API returned no areas`);
    }
    return {};
  } catch (error: any) {
    if (__DEV__) {
      console.error(`[fetchMobileAppData] Error loading mobile-app page data:`, error);
    }
    // Return empty object on error
    return {};
  }
}

