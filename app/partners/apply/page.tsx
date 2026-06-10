'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import PartnerApplicationForm from '@/components/partners/PartnerApplicationForm';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/AuthProvider';
import toast from 'react-hot-toast';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const DEFAULT_AREAS = {
  hero: {
    badge: '立即申請合作',
    title: '加入 iFoodPulse 食材採購平台',
    description: '填寫簡單資料即可啟動餐廳採購帳戶，我們的專員會在 3 個工作天內與您聯繫，協助完成設定。',
  },
} as const;

type PartnerApplyAreas = typeof DEFAULT_AREAS;

export default function PartnerApplyPage() {
  const { isAdmin } = useAuth();
  const [areas, setAreas] = useState<PartnerApplyAreas>(DEFAULT_AREAS);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [tempAreas, setTempAreas] = useState<PartnerApplyAreas>(DEFAULT_AREAS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'pages', 'partners-apply'));
        if (!snap.exists() || cancelled) return;
        const data = snap.data() as any;
        if (data.areas) {
          const loadedAreas = { ...DEFAULT_AREAS, ...data.areas };
          setAreas(loadedAreas as PartnerApplyAreas);
          setTempAreas(loadedAreas as PartnerApplyAreas);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load partners apply content:', error);
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
      const pageRef = doc(db, 'pages', 'partners-apply');
      await setDoc(pageRef, {
        title: 'partners-apply',
        slug: 'partners-apply',
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

      <section className="relative bg-[#0B8628] text-white">
        <EditButton section="hero" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          {editingSection === 'hero' && isAdmin ? (
            <>
              <input
                type="text"
                value={tempAreas.hero.badge}
                onChange={(e) => updateArea(['hero', 'badge'], e.target.value)}
                className="inline-flex items-center px-4 py-1 mb-4 rounded-full bg-white/10 text-white text-sm font-semibold w-full border-2 border-white rounded p-2 mb-4"
                placeholder="立即申請合作"
              />
              <input
                type="text"
                value={tempAreas.hero.title}
                onChange={(e) => updateArea(['hero', 'title'], e.target.value)}
                className="text-3xl md:text-4xl font-bold mb-4 w-full bg-white/10 border-2 border-white rounded p-2 text-white placeholder-white/70"
                placeholder="加入 iFoodPulse 食材採購平台"
              />
              <textarea
                value={tempAreas.hero.description}
                onChange={(e) => updateArea(['hero', 'description'], e.target.value)}
                className="text-lg text-green-50 w-full bg-white/10 border-2 border-white rounded p-2 text-white placeholder-white/70"
                rows={3}
                placeholder="填寫簡單資料即可啟動餐廳採購帳戶，我們的專員會在 3 個工作天內與您聯繫，協助完成設定。"
              />
            </>
          ) : (
            <>
          <span className="inline-flex items-center px-4 py-1 mb-4 rounded-full bg-white/10 text-white text-sm font-semibold">
                {areas.hero.badge}
          </span>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{areas.hero.title}</h1>
          <p className="text-lg text-green-50">
                {areas.hero.description}
          </p>
            </>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-8 md:p-10">
            <PartnerApplicationForm />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
