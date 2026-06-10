'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  MessageSquare,
  Send,
  CheckCircle,
  Building,
  Truck,
  Users
} from 'lucide-react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/AuthProvider';
import toast from 'react-hot-toast';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ImageUploader } from '@/components/ui/ImageUploader';

const DEFAULT_AREAS = {
  banner: {
    title: 'Contact Banner',
    subtitle: 'Dummy Banner Image',
    imageUrl: '',
  },
  hero: {
    title: '聯絡我們',
    description: '我們隨時為您提供專業的服務支援，歡迎與我們聯繫',
  },
  contactInfo: {
    title: '聯絡資訊',
    items: [
      {
        icon: 'MapPin',
        title: '總部地址',
        content: '香港九龍灣宏光道1號',
        subtitle: '九龍灣商貿中心15樓',
      },
      {
        icon: 'Phone',
        title: '客服熱線',
        content: '+852 2345 6789',
        subtitle: '週一至週五 9:00-18:00',
      },
      {
        icon: 'Mail',
        title: '電子郵件',
        content: 'info@foodsupplier.com',
        subtitle: '24小時內回覆',
      },
      {
        icon: 'Clock',
        title: '營業時間',
        content: '週一至週五 9:00-18:00',
        subtitle: '週六 9:00-14:00',
      },
    ],
  },
  faq: {
    title: '常見問題',
    items: [
      {
        question: '如何下訂單？',
        answer: '您可以通過我們的網站註冊帳戶，瀏覽產品目錄，將所需商品加入購物車，然後完成結帳流程。',
      },
      {
        question: '配送時間是多久？',
        answer: '我們提供24小時內配送服務，具體時間取決於您的訂單時間和配送地址。',
      },
      {
        question: '如何查詢訂單狀態？',
        answer: '登入您的帳戶後，在「我的訂單」頁面可以查看所有訂單的詳細狀態和配送進度。',
      },
      {
        question: '是否提供退換貨服務？',
        answer: '是的，我們提供品質保證服務。如果收到的產品有品質問題，請在24小時內聯繫我們的客服團隊。',
      },
    ],
  },
} as const;

type ContactAreas = typeof DEFAULT_AREAS;

export default function ContactPage() {
  const { isAdmin } = useAuth();
  const [areas, setAreas] = useState<ContactAreas>({
    ...DEFAULT_AREAS,
    banner: DEFAULT_AREAS.banner,
    contactInfo: {
      title: DEFAULT_AREAS.contactInfo.title,
      items: DEFAULT_AREAS.contactInfo.items || []
    },
    faq: {
      title: DEFAULT_AREAS.faq.title,
      items: DEFAULT_AREAS.faq.items || []
    }
  });
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [tempAreas, setTempAreas] = useState<ContactAreas>({
    ...DEFAULT_AREAS,
    banner: DEFAULT_AREAS.banner,
    contactInfo: {
      title: DEFAULT_AREAS.contactInfo.title,
      items: DEFAULT_AREAS.contactInfo.items || []
    },
    faq: {
      title: DEFAULT_AREAS.faq.title,
      items: DEFAULT_AREAS.faq.items || []
    }
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'pages', 'contact'));
        if (!snap.exists() || cancelled) return;
        const data = snap.data() as any;
        if (data.areas) {
          const loadedAreas = { 
            ...DEFAULT_AREAS, 
            ...data.areas,
            banner: data.areas.banner || DEFAULT_AREAS.banner,
            contactInfo: {
              title: data.areas.contactInfo?.title || DEFAULT_AREAS.contactInfo.title,
              items: Array.isArray(data.areas.contactInfo?.items) ? data.areas.contactInfo.items : (DEFAULT_AREAS.contactInfo.items || [])
            },
            faq: {
              title: data.areas.faq?.title || DEFAULT_AREAS.faq.title,
              items: Array.isArray(data.areas.faq?.items) ? data.areas.faq.items : (DEFAULT_AREAS.faq.items || [])
            }
          };
          setAreas(loadedAreas as ContactAreas);
          setTempAreas(loadedAreas as ContactAreas);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load contact content:', error);
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
      const pageRef = doc(db, 'pages', 'contact');
      await setDoc(pageRef, {
        title: 'contact',
        slug: 'contact',
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
                      <p className="text-lg font-semibold">聯絡我們 Banner</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Contact Info Section */}
      <section className="relative py-16 bg-white">
        <EditButton section="contactInfo" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            {editingSection === 'contactInfo' && isAdmin ? (
              <input
                type="text"
                value={tempAreas.contactInfo?.title || ''}
                onChange={(e) => updateArea(['contactInfo', 'title'], e.target.value)}
                className="text-3xl font-bold text-gray-900 mb-4 w-full border-2 border-blue-500 rounded p-2 text-center"
                placeholder="聯絡資訊"
              />
            ) : (
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {areas.contactInfo?.title || '聯絡資訊'}
              </h2>
            )}
          </div>
          {editingSection === 'contactInfo' && isAdmin ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(tempAreas.contactInfo?.items || []).map((item, index) => {
                const Icon = item.icon === 'MapPin' ? MapPin :
                            item.icon === 'Phone' ? Phone :
                            item.icon === 'Mail' ? Mail :
                            item.icon === 'Clock' ? Clock : MapPin;
                return (
                  <div key={index} className="bg-gray-50 rounded-lg p-6 text-center relative">
                    <button
                      onClick={() => {
                        const newItems = (tempAreas.contactInfo?.items || []).filter((_, i) => i !== index) as unknown as ContactAreas['contactInfo']['items'];
                        setTempAreas((prev) => ({ 
                          ...prev, 
                          contactInfo: { 
                            ...prev.contactInfo, 
                            title: prev.contactInfo?.title || '聯絡資訊',
                            items: newItems 
                          } 
                        }));
                      }}
                      className="absolute top-2 right-2 text-red-600 hover:text-red-800 text-sm"
                      title="刪除"
                    >
                      ✕
                    </button>
                    <div className="space-y-3">
                      <div className="flex justify-center mb-4">
                        <Icon className="w-8 h-8 text-[#0B8628]" />
                      </div>
                      <input
                        type="text"
                        value={item.title || ''}
                        onChange={(e) => {
                          const newItems = [...(tempAreas.contactInfo?.items || [])];
                          newItems[index] = { ...newItems[index], title: e.target.value as any };
                          setTempAreas((prev) => ({ 
                            ...prev, 
                            contactInfo: { 
                              ...prev.contactInfo, 
                              title: prev.contactInfo?.title || '聯絡資訊',
                              items: newItems as unknown as ContactAreas['contactInfo']['items']
                            } 
                          }));
                        }}
                        className="text-lg font-semibold text-gray-900 mb-2 w-full border-2 border-blue-500 rounded p-2"
                        placeholder="標題"
                      />
                      <input
                        type="text"
                        value={item.content || ''}
                        onChange={(e) => {
                          const newItems = [...(tempAreas.contactInfo?.items || [])];
                          newItems[index] = { ...newItems[index], content: e.target.value as any };
                          setTempAreas((prev) => ({ 
                            ...prev, 
                            contactInfo: { 
                              ...prev.contactInfo, 
                              title: prev.contactInfo?.title || '聯絡資訊',
                              items: newItems as unknown as ContactAreas['contactInfo']['items']
                            } 
                          }));
                        }}
                        className="text-gray-700 mb-2 w-full border-2 border-blue-500 rounded p-2"
                        placeholder="內容"
                      />
                      <input
                        type="text"
                        value={item.subtitle || ''}
                        onChange={(e) => {
                          const newItems = [...(tempAreas.contactInfo?.items || [])];
                          newItems[index] = { ...newItems[index], subtitle: e.target.value as any };
                          setTempAreas((prev) => ({ 
                            ...prev, 
                            contactInfo: { 
                              ...prev.contactInfo, 
                              title: prev.contactInfo?.title || '聯絡資訊',
                              items: newItems as unknown as ContactAreas['contactInfo']['items']
                            } 
                          }));
                        }}
                        className="text-sm text-gray-500 w-full border-2 border-blue-500 rounded p-2"
                        placeholder="副標題"
                      />
                    </div>
                  </div>
                );
              })}
              <button
                onClick={() => {
                  const newItems = [...(tempAreas.contactInfo?.items || []), { icon: 'MapPin', title: '', content: '', subtitle: '' }];
                  setTempAreas((prev) => ({ 
                    ...prev, 
                    contactInfo: { 
                      ...prev.contactInfo, 
                      title: prev.contactInfo?.title || '聯絡資訊',
                      items: newItems as unknown as ContactAreas['contactInfo']['items']
                    } 
                  }));
                }}
                className="bg-gray-50 rounded-lg p-6 text-center border-2 border-dashed border-gray-300 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center"
              >
                + 新增聯絡資訊
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(areas.contactInfo?.items || []).map((item, index) => {
                const Icon = item.icon === 'MapPin' ? MapPin :
                            item.icon === 'Phone' ? Phone :
                            item.icon === 'Mail' ? Mail :
                            item.icon === 'Clock' ? Clock : MapPin;
                return (
                  <div key={index} className="bg-gray-50 rounded-lg p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <Icon className="w-8 h-8 text-[#0B8628]" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-700 mb-1">
                      {item.content}
                    </p>
                    {item.subtitle && (
                      <p className="text-sm text-gray-500">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-16 bg-white">
        <EditButton section="faq" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {editingSection === 'faq' && isAdmin ? (
            <>
              <input
                type="text"
                value={tempAreas.faq?.title || ''}
                onChange={(e) => updateArea(['faq', 'title'], e.target.value)}
                className="text-3xl font-bold text-gray-900 mb-8 w-full border-2 border-blue-500 rounded p-2 text-center"
                placeholder="常見問題"
              />
              <div className="space-y-6">
                {(tempAreas.faq?.items || []).map((item, index) => (
                  <div key={index} className="border-b border-gray-200 pb-6">
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => {
                        const newItems = [...(tempAreas.faq?.items || [])];
                        newItems[index] = { ...newItems[index], question: e.target.value as any };
                        setTempAreas((prev) => ({ ...prev, faq: { ...prev.faq, title: prev.faq?.title || '常見問題', items: newItems as unknown as ContactAreas['faq']['items'] } }));
                      }}
                      className="text-lg font-semibold text-gray-900 mb-2 w-full border-2 border-blue-500 rounded p-2"
                      placeholder="問題"
                    />
                    <textarea
                      value={item.answer}
                      onChange={(e) => {
                        const newItems = [...(tempAreas.faq?.items || [])];
                        newItems[index] = { ...newItems[index], answer: e.target.value as any };
                        setTempAreas((prev) => ({ ...prev, faq: { ...prev.faq, title: prev.faq?.title || '常見問題', items: newItems as unknown as ContactAreas['faq']['items'] } }));
                      }}
                      className="text-gray-600 w-full border-2 border-blue-500 rounded p-2"
                      rows={3}
                      placeholder="答案"
                    />
                    <button
                      onClick={() => {
                        const newItems = (tempAreas.faq?.items || []).filter((_, i) => i !== index) as unknown as ContactAreas['faq']['items'];
                        setTempAreas((prev) => ({ ...prev, faq: { ...prev.faq, title: prev.faq?.title || '常見問題', items: newItems } }));
                      }}
                      className="mt-2 text-red-600 hover:text-red-800 text-sm"
                    >
                      刪除
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newItems = [...(tempAreas.faq?.items || []), { question: '', answer: '' }];
                    setTempAreas((prev) => ({ ...prev, faq: { ...prev.faq, title: prev.faq?.title || '常見問題', items: newItems as unknown as ContactAreas['faq']['items'] } }));
                  }}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors"
                >
                  + 新增問題
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{areas.faq?.title || '常見問題'}</h2>
              <div className="space-y-6">
                {(!areas.faq?.items || (areas.faq.items as unknown as any[]).length === 0) ? (
                  <div className="text-center py-12 text-gray-500">
                    尚未設定常見問題
                  </div>
                ) : (
                  areas.faq.items.map((item, index) => (
                  <div key={index} className={index < (areas.faq.items?.length || 0) - 1 ? "border-b border-gray-200 pb-6" : "pb-6"}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.question}</h3>
                    <p className="text-gray-600">{item.answer}</p>
                  </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </section>
      
      {/* Footer */}
      <Footer />
    </div>
  );
} 