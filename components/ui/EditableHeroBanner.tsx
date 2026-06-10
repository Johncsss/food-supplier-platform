'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/AuthProvider';
import toast from 'react-hot-toast';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ImageUploader } from '@/components/ui/ImageUploader';

interface EditableHeroBannerProps {
  initialBannerUrl?: string;
}

export default function EditableHeroBanner({ initialBannerUrl = '' }: EditableHeroBannerProps) {
  const { isAdmin } = useAuth();
  const [bannerUrl, setBannerUrl] = useState(initialBannerUrl);
  const [editing, setEditing] = useState(false);
  const [tempBannerUrl, setTempBannerUrl] = useState(initialBannerUrl);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'pages', 'homepage'));
        if (!snap.exists() || cancelled) return;
        const data = snap.data() as any;
        if (data.areas?.hero?.bannerImageUrl) {
          const url = data.areas.hero.bannerImageUrl;
          if (!cancelled) {
            setBannerUrl(url);
            setTempBannerUrl(url);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load homepage banner:', error);
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
    setTempBannerUrl(bannerUrl);
  };

  const cancelEditing = () => {
    setEditing(false);
    setTempBannerUrl(bannerUrl);
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
            bannerImageUrl: tempBannerUrl,
          },
        },
        updatedAt: Timestamp.now(),
      }, { merge: true });
      
      setBannerUrl(tempBannerUrl);
      setEditing(false);
      toast.success('內容已儲存');
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  if (!bannerUrl && !editing && !isAdmin) {
    return null;
  }

  return (
    <section className="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden">
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
      
      {editing && isAdmin ? (
        <div className="w-full h-full bg-gray-100 p-8">
          <div className="max-w-4xl mx-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Banner 圖片</label>
              <ImageUploader
                value={tempBannerUrl || ''}
                onChange={(url) => setTempBannerUrl(url)}
                folder="homepage_banners"
                onError={(error) => toast.error(error)}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          {bannerUrl ? (
            <div className="relative w-full h-full">
              <img
                src={bannerUrl}
                alt="Banner"
                className="w-full h-full object-cover"
                style={{ width: '100%', maxWidth: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none"></div>
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-emerald-600 to-emerald-800">
              <div className="absolute inset-0 bg-black opacity-20"></div>
              <div className="relative h-full flex items-center justify-center">
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <div className="text-center text-gray-600">
                    <p className="text-lg font-semibold">首頁 Banner</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

