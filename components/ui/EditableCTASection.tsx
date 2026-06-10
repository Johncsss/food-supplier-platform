'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/AuthProvider';
import toast from 'react-hot-toast';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface EditableCTASectionProps {
  initialData?: {
    title?: string;
    description?: string;
  };
}

const DEFAULT_CTA = {
  title: '準備好改變您的餐廳了嗎？',
  description: '今天就加入我們的會員計劃，開始享受優質食品供應服務。',
};

export default function EditableCTASection({ initialData }: EditableCTASectionProps) {
  const { isAdmin } = useAuth();
  const [cta, setCta] = useState({
    title: initialData?.title || DEFAULT_CTA.title,
    description: initialData?.description || DEFAULT_CTA.description,
  });
  const [editing, setEditing] = useState(false);
  const [tempCta, setTempCta] = useState(cta);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'pages', 'homepage'));
        if (!snap.exists() || cancelled) return;
        const data = snap.data() as any;
        if (data.areas?.cta) {
          const ctaData = data.areas.cta;
          const loadedCta = {
            title: ctaData.title || DEFAULT_CTA.title,
            description: ctaData.description || DEFAULT_CTA.description,
          };
          if (!cancelled) {
            setCta(loadedCta);
            setTempCta(loadedCta);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load homepage CTA:', error);
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
    setTempCta({ ...cta });
  };

  const cancelEditing = () => {
    setEditing(false);
    setTempCta({ ...cta });
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
          cta: {
            ...existingData.areas?.cta,
            title: tempCta.title,
            description: tempCta.description,
          },
        },
        updatedAt: Timestamp.now(),
      }, { merge: true });
      
      setCta({ ...tempCta });
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
    <section className="relative py-20 bg-[#0B8628] text-white">
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
      
      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        {editing && isAdmin ? (
          <>
            <input
              type="text"
              value={tempCta.title}
              onChange={(e) => setTempCta({ ...tempCta, title: e.target.value })}
              className="text-3xl md:text-4xl font-bold mb-6 w-full border-2 border-white rounded p-2 text-gray-900"
              placeholder="準備好改變您的餐廳了嗎？"
            />
            <textarea
              value={tempCta.description}
              onChange={(e) => setTempCta({ ...tempCta, description: e.target.value })}
              className="text-xl mb-8 w-full border-2 border-white rounded p-2 text-gray-900"
              rows={3}
              placeholder="今天就加入我們的會員計劃，開始享受優質食品供應服務。"
            />
          </>
        ) : (
          <>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {cta.title}
            </h2>
            <p className="text-xl mb-8 text-primary-100">
              {cta.description}
            </p>
          </>
        )}
      </div>
    </section>
  );
}

