'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/AuthProvider';
import toast from 'react-hot-toast';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface EditableHeroSectionProps {
  initialData?: {
    title?: string;
    titleSpan?: string;
    description?: string;
    button1Text?: string;
    button1Link?: string;
    bannerImageUrl?: string;
  };
}

export default function EditableHeroSection({ initialData = {} }: EditableHeroSectionProps) {
  const { isAdmin } = useAuth();
  const [heroData, setHeroData] = useState({
    title: initialData.title || '為餐廳提供優質食品供應',
    titleSpan: initialData.titleSpan || '餐廳',
    description: initialData.description || '透過iFoodPulse，獲得新鮮食材、優質肉類以及經營餐廳所需的一切。',
    button1Text: initialData.button1Text || '開始您的會員資格',
    button1Link: initialData.button1Link || '/partners/apply',
    bannerImageUrl: initialData.bannerImageUrl || '',
  });
  const [editing, setEditing] = useState(false);
  const [tempData, setTempData] = useState(heroData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'pages', 'homepage'));
        if (!snap.exists() || cancelled) return;
        const data = snap.data() as any;
        if (data.areas?.hero) {
          const loadedData = {
            title: data.areas.hero.title || heroData.title,
            titleSpan: data.areas.hero.titleSpan || heroData.titleSpan,
            description: data.areas.hero.description || heroData.description,
            button1Text: data.areas.hero.button1Text || heroData.button1Text,
            button1Link: data.areas.hero.button1Link || heroData.button1Link,
            bannerImageUrl: data.areas.hero.bannerImageUrl || heroData.bannerImageUrl,
          };
          if (!cancelled) {
            setHeroData(loadedData);
            setTempData(loadedData);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load homepage hero:', error);
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
    setTempData({ ...heroData });
  };

  const cancelEditing = () => {
    setEditing(false);
    setTempData({ ...heroData });
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      const pageRef = doc(db, 'pages', 'homepage');
      const snap = await getDoc(pageRef);
      const existingData = snap.exists() ? snap.data() : {};
      
      await setDoc(pageRef, {
        ...existingData,
        areas: {
          ...existingData.areas,
          hero: {
            ...existingData.areas?.hero,
            ...tempData,
          },
        },
        updatedAt: Timestamp.now(),
      }, { merge: true });
      
      setHeroData({ ...tempData });
      setEditing(false);
      toast.success('內容已儲存');
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section 
      className="relative bg-white text-black py-24"
    >
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
        <div className="text-center">
          {editing && isAdmin ? (
            <>
              <input
                type="text"
                value={tempData.title}
                onChange={(e) => setTempData({ ...tempData, title: e.target.value })}
                className="text-4xl md:text-6xl font-bold mb-2 w-full border-2 border-gray-300 rounded p-2 text-black bg-white placeholder-gray-500"
                placeholder="為餐廳提供優質食品供應"
              />
              <input
                type="text"
                value={tempData.titleSpan}
                onChange={(e) => setTempData({ ...tempData, titleSpan: e.target.value })}
                className="text-4xl md:text-6xl font-bold mb-6 w-full border-2 border-gray-300 rounded p-2 text-black bg-white placeholder-gray-500"
                placeholder="餐廳"
              />
              <textarea
                value={tempData.description}
                onChange={(e) => setTempData({ ...tempData, description: e.target.value })}
                className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto w-full border-2 border-gray-300 rounded p-2 text-black bg-white placeholder-gray-500"
                rows={3}
                placeholder="透過iFoodPulse，獲得新鮮食材、優質肉類以及經營餐廳所需的一切。"
              />
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <input
                  type="text"
                  value={tempData.button1Text}
                  onChange={(e) => setTempData({ ...tempData, button1Text: e.target.value })}
                  className="bg-[#0B8628] hover:bg-[#0a6f21] text-white text-lg px-8 py-4 rounded-lg border-2 border-blue-500"
                  placeholder="開始您的會員資格"
                />
                <input
                  type="text"
                  value={tempData.button1Link}
                  onChange={(e) => setTempData({ ...tempData, button1Link: e.target.value })}
                  className="bg-gray-100 text-gray-900 text-lg px-8 py-4 rounded-lg border-2 border-blue-500"
                  placeholder="/partners/apply"
                />
              </div>
            </>
          ) : (
            <>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-black">
                {heroData.titleSpan && heroData.title.includes(heroData.titleSpan) ? (
                  <>
                    {heroData.title.split(heroData.titleSpan)[0]}
                    <span className="text-[#0B8628]">{heroData.titleSpan}</span>
                    {heroData.title.split(heroData.titleSpan)[1]}
                  </>
                ) : (
                  <>
                    {heroData.title}
                    {heroData.titleSpan && <span className="text-[#0B8628]"> {heroData.titleSpan}</span>}
                  </>
                )}
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-black">
                {heroData.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={heroData.button1Link} className="bg-[#0B8628] hover:bg-[#0a6f21] text-white text-lg px-8 py-4 rounded-lg transition-colors">
                  {heroData.button1Text}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

