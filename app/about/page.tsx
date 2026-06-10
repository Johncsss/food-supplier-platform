'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { 
  Package, 
  Users, 
  Truck, 
  Shield, 
  Award, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Star,
  CheckCircle,
  Heart,
  Leaf,
  Target
} from 'lucide-react';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/AuthProvider';
import toast from 'react-hot-toast';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ImageUploader } from '@/components/ui/ImageUploader';

const DEFAULT_AREAS = {
  banner: {
    title: '關於我們 Banner',
    subtitle: 'Dummy Banner Image',
    imageUrl: '',
  },
  hero: {
    title: '關於我們',
    subtitle: '專業的餐廳食材供應商，為您的餐廳提供最優質的食材和服務',
  },
  stats: [
    { icon: 'Users', value: '500+', label: '餐廳客戶' },
    { icon: 'Package', value: '1000+', label: '產品種類' },
    { icon: 'Truck', value: '24小時', label: '配送服務' },
    { icon: 'Award', value: '10年+', label: '行業經驗' }
  ],
  story: {
    title: '我們的故事',
    paragraphs: [
      '成立於2014年，我們從一個小型的本地食材供應商開始，逐步發展成為香港領先的餐廳食材供應商。',
      '我們的使命是為餐廳提供最優質、最新鮮的食材，幫助餐廳提升菜品品質，為顧客提供更好的用餐體驗。',
      '十年來，我們已經服務超過500家餐廳，建立了完善的供應鏈體系和配送網絡，成為餐廳值得信賴的合作夥伴。'
    ] as string[]
  },
  values: [
    {
      icon: 'Heart',
      title: '品質至上',
      description: '我們只提供最優質的食材，確保每一件產品都符合最高標準。'
    },
    {
      icon: 'Leaf',
      title: '環保永續',
      description: '致力於可持續發展，支持本地農民，減少碳足跡。'
    },
    {
      icon: 'Target',
      title: '精準配送',
      description: '準時配送，確保食材新鮮度，讓您的餐廳運營無後顧之憂。'
    },
    {
      icon: 'Shield',
      title: '安全可靠',
      description: '所有產品都經過嚴格的安全檢測，確保食品安全。'
    }
  ],
  mission: {
    title: '我們的使命',
    description: '為餐廳提供最優質的食材和服務，幫助餐廳提升競爭力，為顧客創造更好的用餐體驗。'
  },
  vision: {
    title: '我們的願景',
    description: '成為香港最受信賴的餐廳食材供應商，推動餐飲行業的可持續發展。'
  },
  services: [
    {
      icon: 'Package',
      title: '新鮮食材供應',
      description: '提供各種新鮮蔬菜、水果、肉類和海鮮，確保品質和口感。'
    },
    {
      icon: 'Truck',
      title: '快速配送服務',
      description: '24小時內送達，專業冷鏈運輸，保持食材新鮮度。'
    },
    {
      icon: 'Users',
      title: '專屬客戶服務',
      description: '一對一客戶經理，為您的餐廳提供個性化解決方案。'
    },
    {
      icon: 'Award',
      title: '品質保證',
      description: '所有產品都有品質保證，不滿意可退換貨。'
    }
  ],
  team: [
    {
      name: '張志明',
      position: '創始人 & CEO',
      description: '擁有15年食品供應鏈經驗，致力於為餐廳提供最優質的食材。'
    },
    {
      name: '李美玲',
      position: '營運總監',
      description: '負責日常營運管理，確保服務品質和客戶滿意度。'
    },
    {
      name: '王建國',
      position: '採購經理',
      description: '專業的食材採購團隊，與優質供應商建立長期合作關係。'
    },
    {
      name: '陳雅芳',
      position: '客戶服務經理',
      description: '為客戶提供專業的服務支持，解決各種問題和需求。'
    }
  ],
  contact: {
    address: '香港九龍灣宏光道1號',
    phone: '+852 2345 6789',
    email: 'info@foodsupplier.com'
  },
  cta: {
    title: '準備好開始合作了嗎？',
    description: '加入我們的客戶網絡，享受專業的食材供應服務',
    button1Text: '立即註冊',
    button2Text: '聯絡我們'
  }
};

type AboutAreas = typeof DEFAULT_AREAS;

export default function AboutPage() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('about');
  const [areas, setAreas] = useState<AboutAreas>(DEFAULT_AREAS);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [tempAreas, setTempAreas] = useState<AboutAreas>(DEFAULT_AREAS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // Use API route which uses admin SDK and works for non-logged-in users
        const response = await fetch('/api/pages/about');
        if (cancelled) return;
        
        if (!response.ok) {
          throw new Error('Failed to fetch page data');
        }
        
        const result = await response.json();
        if (result.success && result.page?.areas) {
          const loadedAreas = { ...DEFAULT_AREAS, ...result.page.areas };
          setAreas(loadedAreas as AboutAreas);
          setTempAreas(loadedAreas as AboutAreas);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load about content:', error);
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
      const pageRef = doc(db, 'pages', 'about');
      await setDoc(pageRef, {
        title: 'about',
        slug: 'about',
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

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      Users, Package, Truck, Award, Heart, Leaf, Target, Shield
    };
    return icons[iconName] || Package;
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
                      <p className="text-lg font-semibold">關於我們 Banner</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {activeTab === 'about' && (
          <div className="space-y-16">
            {/* Company Story */}
            <section className="relative">
              <EditButton section="story" />
              <div>
                {editingSection === 'story' && isAdmin ? (
                  <>
                    <input
                      type="text"
                      value={tempAreas.story.title}
                      onChange={(e) => updateArea(['story', 'title'], e.target.value)}
                      className="text-3xl font-bold text-gray-900 mb-6 w-full border-2 border-blue-500 rounded p-2"
                    />
                    {tempAreas.story.paragraphs.map((para, idx) => (
                      <textarea
                        key={idx}
                        value={para}
                        onChange={(e) => {
                          const newParas = [...tempAreas.story.paragraphs];
                          newParas[idx] = e.target.value;
                          setTempAreas((prev) => ({ ...prev, story: { ...prev.story, paragraphs: newParas } }));
                        }}
                        className="text-lg text-gray-600 mb-6 w-full border-2 border-blue-500 rounded p-2"
                        rows={3}
                      />
                    ))}
                  </>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">{areas.story.title}</h2>
                    {areas.story.paragraphs.map((para, idx) => (
                      <p key={idx} className="text-lg text-gray-600 mb-6">
                        {para}
                      </p>
                    ))}
                  </>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-16">
            <section className="relative">
              <EditButton section="services" />
              <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">我們的服務</h2>
              <div className="grid md:grid-cols-2 gap-8">
                {areas.services.map((service, index) => {
                  const Icon = getIcon(service.icon);
                  return (
                    <div key={index} className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center mb-4">
                        <Icon className="w-8 h-8 text-primary-600 mr-3" />
                        {editingSection === 'services' && isAdmin ? (
                          <input
                            type="text"
                            value={tempAreas.services[index].title}
                            onChange={(e) => {
                              const newServices = [...tempAreas.services];
                              newServices[index] = { ...newServices[index], title: e.target.value };
                              setTempAreas((prev) => ({ ...prev, services: newServices }));
                            }}
                            className="text-xl font-semibold text-gray-900 w-full border-2 border-blue-500 rounded p-2"
                          />
                        ) : (
                          <h3 className="text-xl font-semibold text-gray-900">{service.title}</h3>
                        )}
                      </div>
                      {editingSection === 'services' && isAdmin ? (
                        <textarea
                          value={tempAreas.services[index].description}
                          onChange={(e) => {
                            const newServices = [...tempAreas.services];
                            newServices[index] = { ...newServices[index], description: e.target.value };
                            setTempAreas((prev) => ({ ...prev, services: newServices }));
                          }}
                          className="text-gray-600 w-full border-2 border-blue-500 rounded p-2"
                          rows={3}
                        />
                      ) : (
                        <p className="text-gray-600">{service.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Service Features */}
            <section className="bg-gray-50 p-8 rounded-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">服務特色</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">品質保證</h4>
                    <p className="text-sm text-gray-600">所有產品都經過嚴格品質檢測</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="w-6 h-6 text-blue-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">準時配送</h4>
                    <p className="text-sm text-gray-600">24小時內送達，確保食材新鮮</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="w-6 h-6 text-purple-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">專屬服務</h4>
                    <p className="text-sm text-gray-600">一對一客戶經理服務</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-16">
            <section className="relative">
              <EditButton section="team" />
              <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">我們的團隊</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {areas.team.map((member, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                    <div className="w-20 h-20 bg-primary-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Users className="w-10 h-10 text-primary-600" />
                    </div>
                    {editingSection === 'team' && isAdmin ? (
                      <>
                        <input
                          type="text"
                          value={tempAreas.team[index].name}
                          onChange={(e) => {
                            const newTeam = [...tempAreas.team];
                            newTeam[index] = { ...newTeam[index], name: e.target.value };
                            setTempAreas((prev) => ({ ...prev, team: newTeam }));
                          }}
                          className="text-lg font-semibold text-gray-900 mb-2 w-full border-2 border-blue-500 rounded p-2"
                        />
                        <input
                          type="text"
                          value={tempAreas.team[index].position}
                          onChange={(e) => {
                            const newTeam = [...tempAreas.team];
                            newTeam[index] = { ...newTeam[index], position: e.target.value };
                            setTempAreas((prev) => ({ ...prev, team: newTeam }));
                          }}
                          className="text-primary-600 font-medium mb-3 w-full border-2 border-blue-500 rounded p-2"
                        />
                        <textarea
                          value={tempAreas.team[index].description}
                          onChange={(e) => {
                            const newTeam = [...tempAreas.team];
                            newTeam[index] = { ...newTeam[index], description: e.target.value };
                            setTempAreas((prev) => ({ ...prev, team: newTeam }));
                          }}
                          className="text-gray-600 text-sm w-full border-2 border-blue-500 rounded p-2"
                          rows={3}
                        />
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{member.name}</h3>
                        <p className="text-primary-600 font-medium mb-3">{member.position}</p>
                        <p className="text-gray-600 text-sm">{member.description}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Contact Info */}
            <section className="relative bg-primary-50 p-8 rounded-lg">
              <EditButton section="contact" />
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">聯絡我們</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-6 h-6 text-primary-600" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">地址</h4>
                    {editingSection === 'contact' && isAdmin ? (
                      <input
                        type="text"
                        value={tempAreas.contact.address}
                        onChange={(e) => updateArea(['contact', 'address'], e.target.value)}
                        className="text-gray-600 w-full border-2 border-blue-500 rounded p-2"
                      />
                    ) : (
                      <p className="text-gray-600">{areas.contact.address}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-6 h-6 text-primary-600" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">電話</h4>
                    {editingSection === 'contact' && isAdmin ? (
                      <input
                        type="text"
                        value={tempAreas.contact.phone}
                        onChange={(e) => updateArea(['contact', 'phone'], e.target.value)}
                        className="text-gray-600 w-full border-2 border-blue-500 rounded p-2"
                      />
                    ) : (
                      <p className="text-gray-600">{areas.contact.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-6 h-6 text-primary-600" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">電郵</h4>
                    {editingSection === 'contact' && isAdmin ? (
                      <input
                        type="text"
                        value={tempAreas.contact.email}
                        onChange={(e) => updateArea(['contact', 'email'], e.target.value)}
                        className="text-gray-600 w-full border-2 border-blue-500 rounded p-2"
                      />
                    ) : (
                      <p className="text-gray-600">{areas.contact.email}</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <section className="relative text-white py-16" style={{ backgroundColor: '#0B8628' }}>
        <EditButton section="cta" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {editingSection === 'cta' && isAdmin ? (
            <>
              <input
                type="text"
                value={tempAreas.cta.title}
                onChange={(e) => updateArea(['cta', 'title'], e.target.value)}
                className="text-3xl font-bold mb-6 w-full bg-white/10 border-2 border-white rounded p-2 text-white placeholder-white/70"
                placeholder="準備好開始合作了嗎？"
              />
              <textarea
                value={tempAreas.cta.description}
                onChange={(e) => updateArea(['cta', 'description'], e.target.value)}
                className="text-xl mb-8 max-w-2xl mx-auto w-full bg-white/10 border-2 border-white rounded p-2 text-white placeholder-white/70"
                rows={2}
                placeholder="加入我們的客戶網絡，享受專業的食材供應服務"
              />
              <div className="flex justify-center space-x-4">
                <input
                  type="text"
                  value={tempAreas.cta.button1Text}
                  onChange={(e) => updateArea(['cta', 'button1Text'], e.target.value)}
                  className="bg-white text-primary-600 px-8 py-3 rounded-lg font-medium border-2 border-blue-500 text-center"
                />
              </div>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold mb-6">{areas.cta.title}</h2>
              <p className="text-xl mb-8 max-w-2xl mx-auto">
                {areas.cta.description}
              </p>
              <div className="flex justify-center space-x-4">
                <a
                  href="/partners/apply"
                  className="bg-white text-primary-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  {areas.cta.button1Text}
                </a>
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