'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/AuthProvider';
import toast from 'react-hot-toast';
import { PencilIcon, CheckIcon, XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface TestimonialItem {
  name: string;
  restaurant: string;
  text: string;
}

interface EditableTestimonialsSectionProps {
  initialData?: {
    title?: string;
    description?: string;
    items?: TestimonialItem[];
  };
}

const DEFAULT_TESTIMONIALS = {
  title: '我們的會員怎麼說',
  description: '加入全國數千間滿意的餐廳。',
  items: [
    {
      name: '莎拉·約翰遜',
      restaurant: '花園小館',
      text: '高質食品供應商改變了我們的餐廳營運。品質和可靠性無與倫比。',
    },
    {
      name: '陳邁克',
      restaurant: '金龍餐廳',
      text: '優質服務和頂級產品。我們的顧客喜愛我們使用的食材品質。',
    },
    {
      name: '艾米莉·羅德里格斯',
      restaurant: '月神咖啡廳',
      text: '會員計劃物超所值。我們在獲得更好產品的同時節省時間和金錢。',
    },
  ],
};

export default function EditableTestimonialsSection({ initialData }: EditableTestimonialsSectionProps) {
  const { isAdmin } = useAuth();
  const [testimonials, setTestimonials] = useState({
    title: initialData?.title || DEFAULT_TESTIMONIALS.title,
    description: initialData?.description || DEFAULT_TESTIMONIALS.description,
    items: initialData?.items || DEFAULT_TESTIMONIALS.items,
  });
  const [editing, setEditing] = useState(false);
  const [tempTestimonials, setTempTestimonials] = useState(testimonials);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'pages', 'homepage'));
        if (!snap.exists() || cancelled) return;
        const data = snap.data() as any;
        if (data.areas?.testimonials) {
          const testimonialsData = data.areas.testimonials;
          const items: TestimonialItem[] = [];
          
          // Handle both item1-item3 format and array format
          if (testimonialsData.item1) {
            for (let i = 1; i <= 3; i++) {
              const item = testimonialsData[`item${i}`];
              if (item && item.name && item.restaurant && item.text) {
                items.push({ name: item.name, restaurant: item.restaurant, text: item.text });
              }
            }
          } else if (Array.isArray(testimonialsData.items)) {
            items.push(...testimonialsData.items);
          }
          
          const loadedTestimonials = {
            title: testimonialsData.title || DEFAULT_TESTIMONIALS.title,
            description: testimonialsData.description || DEFAULT_TESTIMONIALS.description,
            items: items.length > 0 ? items : DEFAULT_TESTIMONIALS.items,
          };
          
          if (!cancelled) {
            setTestimonials(loadedTestimonials);
            setTempTestimonials(loadedTestimonials);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load homepage testimonials:', error);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const startEditing = () => {
    setEditing(true);
    setTempTestimonials({ ...testimonials });
  };

  const cancelEditing = () => {
    setEditing(false);
    setTempTestimonials({ ...testimonials });
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      const pageRef = doc(db, 'pages', 'homepage');
      const snap = await getDoc(pageRef);
      const existingData = snap.exists() ? snap.data() : {};
      
      // Convert items array to item1-item3 format for compatibility
      const itemsObj: any = {};
      tempTestimonials.items.forEach((item, index) => {
        itemsObj[`item${index + 1}`] = {
          name: item.name,
          restaurant: item.restaurant,
          text: item.text,
        };
      });
      
      await setDoc(pageRef, {
        ...existingData,
        areas: {
          ...existingData.areas,
          testimonials: {
            title: tempTestimonials.title,
            description: tempTestimonials.description,
            ...itemsObj,
            items: tempTestimonials.items, // Also save as array for future use
          },
        },
        updatedAt: Timestamp.now(),
      }, { merge: true });
      
      setTestimonials({ ...tempTestimonials });
      setEditing(false);
      toast.success('內容已儲存');
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  const addTestimonial = () => {
    setTempTestimonials({
      ...tempTestimonials,
      items: [...tempTestimonials.items, { name: '', restaurant: '', text: '' }],
    });
  };

  const removeTestimonial = (index: number) => {
    const newItems = tempTestimonials.items.filter((_, i) => i !== index);
    setTempTestimonials({ ...tempTestimonials, items: newItems });
  };

  return (
    <section className="relative py-20 bg-white">
      {isAdmin && (
        <>
          {editing ? (
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
              onClick={startEditing}
              className="absolute top-4 right-4 bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 z-10 flex items-center gap-1"
              title="編輯"
            >
              <PencilIcon className="w-4 h-4" />
              編輯
            </button>
          )}
        </>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          {editing && isAdmin ? (
            <>
              <input
                type="text"
                value={tempTestimonials.title}
                onChange={(e) => setTempTestimonials({ ...tempTestimonials, title: e.target.value })}
                className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 w-full border-2 border-blue-500 rounded p-2"
                placeholder="我們的會員怎麼說"
              />
              <textarea
                value={tempTestimonials.description}
                onChange={(e) => setTempTestimonials({ ...tempTestimonials, description: e.target.value })}
                className="text-xl text-gray-600 max-w-2xl mx-auto w-full border-2 border-blue-500 rounded p-2"
                rows={2}
                placeholder="加入全國數千間滿意的餐廳。"
              />
            </>
          ) : (
            <>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {testimonials.title}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {testimonials.description}
              </p>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {editing && isAdmin ? (
            <>
              {tempTestimonials.items.map((item, index) => (
                <div key={index} className="card p-8">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-sm font-medium text-gray-700">推薦 {index + 1}</h4>
                    {tempTestimonials.items.length > 1 && (
                      <button
                        onClick={() => removeTestimonial(index)}
                        className="text-red-500 hover:text-red-700"
                        title="刪除"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={item.text}
                    onChange={(e) => {
                      const newItems = [...tempTestimonials.items];
                      newItems[index] = { ...newItems[index], text: e.target.value };
                      setTempTestimonials({ ...tempTestimonials, items: newItems });
                    }}
                    className="text-gray-600 mb-6 italic w-full border-2 border-blue-500 rounded p-2"
                    rows={4}
                    placeholder="推薦內容"
                  />
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        const newItems = [...tempTestimonials.items];
                        newItems[index] = { ...newItems[index], name: e.target.value };
                        setTempTestimonials({ ...tempTestimonials, items: newItems });
                      }}
                      className="font-semibold text-gray-900 w-full border-2 border-blue-500 rounded p-2"
                      placeholder="姓名"
                    />
                    <input
                      type="text"
                      value={item.restaurant}
                      onChange={(e) => {
                        const newItems = [...tempTestimonials.items];
                        newItems[index] = { ...newItems[index], restaurant: e.target.value };
                        setTempTestimonials({ ...tempTestimonials, items: newItems });
                      }}
                      className="text-gray-500 text-sm w-full border-2 border-blue-500 rounded p-2"
                      placeholder="餐廳名稱"
                    />
                  </div>
                </div>
              ))}
              <div className="card p-8 flex items-center justify-center border-2 border-dashed border-gray-300">
                <button
                  onClick={addTestimonial}
                  className="flex flex-col items-center gap-2 text-gray-500 hover:text-gray-700"
                  title="新增推薦"
                >
                  <PlusIcon className="w-8 h-8" />
                  <span>新增推薦</span>
                </button>
              </div>
            </>
          ) : (
            testimonials.items.map((testimonial, index) => (
              <div key={index} className="card p-8">
                <p className="text-gray-600 mb-6 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-gray-500 text-sm">{testimonial.restaurant}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

