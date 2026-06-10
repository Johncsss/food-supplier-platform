'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/AuthProvider';
import toast from 'react-hot-toast';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ImageUploader } from '@/components/ui/ImageUploader';

interface FAQItem {
  question: string;
  answer: string;
}

const DEFAULT_AREAS = {
  banner: {
    title: 'FAQ Banner',
    subtitle: 'Dummy Banner Image',
    imageUrl: '',
  },
  hero: {
    title: 'F&Q',
    description: '常見問題解答',
  },
  faq: [] as FAQItem[],
  cta: {
    title: '還有其他問題？',
    description: '如果以上問題無法解答您的疑問，歡迎聯繫我們的客服團隊。',
    buttonText: '聯絡我們',
  },
} as const;

type FAQAreas = typeof DEFAULT_AREAS;

export default function FAQPage() {
  const { isAdmin } = useAuth();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [areas, setAreas] = useState<FAQAreas>({ ...DEFAULT_AREAS, faq: [] });
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [tempAreas, setTempAreas] = useState<FAQAreas>({ ...DEFAULT_AREAS, faq: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'pages', 'faq'));
        if (!snap.exists() || cancelled) {
          return;
        }
        const data = snap.data() as any;
        if (cancelled) {
          return;
        }
        
        if (data.areas) {
          let faqList: FAQItem[] = [];
          
          // Handle different possible structures
          const faqData = data.areas.faq;
          
          if (faqData) {
            // Handle array format (direct array or items array)
            if (Array.isArray(faqData)) {
              faqList = faqData
                .filter((q: any) => q && q.question && q.answer)
                .map((q: any) => ({
                  question: q.question,
                  answer: q.answer,
                }));
            } else if (faqData.items && Array.isArray(faqData.items)) {
              // Handle structure with items property
              faqList = faqData.items
                .filter((q: any) => q && q.question && q.answer)
                .map((q: any) => ({
                  question: q.question,
                  answer: q.answer,
                }));
            } else {
              // Handle legacy format (q1, q2, q3, etc.)
              for (let i = 1; i <= 8; i++) {
                const q = faqData[`q${i}`];
                if (q && q.question && q.answer) {
                  faqList.push({
                    question: q.question,
                    answer: q.answer,
                  });
                }
              }
            }
          }

          const loadedAreas = {
            banner: data.areas.banner || DEFAULT_AREAS.banner,
            hero: data.areas.hero || DEFAULT_AREAS.hero,
            faq: Array.isArray(faqList) ? faqList : [],
            cta: data.areas.cta || DEFAULT_AREAS.cta,
          };
          
          setAreas(loadedAreas as FAQAreas);
          setTempAreas(loadedAreas as FAQAreas);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load FAQ content:', error);
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
      const pageRef = doc(db, 'pages', 'faq');
      await setDoc(pageRef, {
        title: 'faq',
        slug: 'faq',
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

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
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
                      <p className="text-lg font-semibold">FAQ Banner</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* FAQ Section */}
      <section className="relative py-16 bg-white">
        <EditButton section="faq" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {editingSection === 'faq' && isAdmin ? (
              <>
                {(tempAreas.faq || []).map((faq, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg overflow-hidden p-4 bg-gray-50"
                  >
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => {
                        const newFaqs = [...tempAreas.faq];
                        newFaqs[index] = { ...newFaqs[index], question: e.target.value };
                        setTempAreas((prev) => ({ ...prev, faq: newFaqs }));
                      }}
                      className="w-full mb-3 px-4 py-2 border-2 border-blue-500 rounded p-2 font-semibold text-gray-900"
                      placeholder="問題"
                    />
                    <textarea
                      value={faq.answer}
                      onChange={(e) => {
                        const newFaqs = [...tempAreas.faq];
                        newFaqs[index] = { ...newFaqs[index], answer: e.target.value };
                        setTempAreas((prev) => ({ ...prev, faq: newFaqs }));
                      }}
                      className="w-full px-4 py-2 border-2 border-blue-500 rounded p-2 text-gray-700"
                      rows={4}
                      placeholder="答案"
                    />
                    <button
                      onClick={() => {
                        const newFaqs = tempAreas.faq.filter((_, i) => i !== index);
                        setTempAreas((prev) => ({ ...prev, faq: newFaqs }));
                      }}
                      className="mt-2 text-red-600 hover:text-red-800 text-sm"
                    >
                      刪除
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newFaqs = [...tempAreas.faq, { question: '', answer: '' }];
                    setTempAreas((prev) => ({ ...prev, faq: newFaqs }));
                  }}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors"
                >
                  + 新增問題
                </button>
              </>
            ) : !areas.faq || areas.faq.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                尚未設定常見問題
              </div>
            ) : (
              (areas.faq || []).map((faq, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-900 text-lg">
                      {faq.question}
                    </span>
                    {openIndex === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>
                  {openIndex === index && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <p className="text-gray-700 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Contact CTA */}
          <div className="relative mt-12 p-6 bg-primary-50 rounded-lg border border-primary-200">
            {isAdmin && (
              <>
                {editingSection === 'cta' ? (
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
                    onClick={() => startEditing('cta')}
                    className="absolute top-4 right-4 bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 z-10 flex items-center gap-1"
                    title="編輯"
                  >
                    <PencilIcon className="w-4 h-4" />
                    編輯
                  </button>
                )}
              </>
            )}
            {editingSection === 'cta' && isAdmin ? (
              <>
                <input
                  type="text"
                  value={tempAreas.cta.title}
                  onChange={(e) => updateArea(['cta', 'title'], e.target.value)}
                  className="text-xl font-semibold text-gray-900 mb-2 w-full border-2 border-blue-500 rounded p-2"
                  placeholder="還有其他問題？"
                />
                <textarea
                  value={tempAreas.cta.description}
                  onChange={(e) => updateArea(['cta', 'description'], e.target.value)}
                  className="text-gray-600 mb-4 w-full border-2 border-blue-500 rounded p-2"
                  rows={2}
                  placeholder="如果以上問題無法解答您的疑問，歡迎聯繫我們的客服團隊。"
                />
                <input
                  type="text"
                  value={tempAreas.cta.buttonText}
                  onChange={(e) => updateArea(['cta', 'buttonText'], e.target.value)}
                  className="inline-block bg-[#0B8628] hover:bg-[#0a6f21] text-white font-medium py-2 px-6 rounded-lg border-2 border-blue-500 text-center"
                  placeholder="聯絡我們"
                />
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {areas.cta.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {areas.cta.description}
                </p>
                <a
                  href="https://wa.me/85298636938?text=您好，我想查詢。"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[#0B8628] hover:bg-[#0a6f21] text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
                >
                  {areas.cta.buttonText}
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

