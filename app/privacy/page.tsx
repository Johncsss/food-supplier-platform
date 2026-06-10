'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PRIVACY_DEFAULT_CONTENT, PRIVACY_DEFAULT_TITLE } from '@/lib/static-pages';
import { useAuth } from '@/components/providers/AuthProvider';
import toast from 'react-hot-toast';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function PrivacyPolicyPage() {
  const { isAdmin } = useAuth();
  const [title, setTitle] = useState(PRIVACY_DEFAULT_TITLE);
  const [content, setContent] = useState(PRIVACY_DEFAULT_CONTENT);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [editing, setEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(PRIVACY_DEFAULT_TITLE);
  const [tempContent, setTempContent] = useState(PRIVACY_DEFAULT_CONTENT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'pages', 'privacy'));
        if (!snap.exists() || cancelled) {
          return;
        }
        const data = snap.data() as any;
        if (cancelled) {
          return;
        }
        setTitle(
          typeof data.title === 'string' && data.title.trim().length > 0
            ? data.title
            : PRIVACY_DEFAULT_TITLE,
        );
        const loadedContent = typeof data.content === 'string' && data.content.trim().length > 0
            ? data.content
          : PRIVACY_DEFAULT_CONTENT;
        setContent(loadedContent);
        setTempContent(loadedContent);
        setTempTitle(
          typeof data.title === 'string' && data.title.trim().length > 0
            ? data.title
            : PRIVACY_DEFAULT_TITLE,
        );
        if (data.updatedAt?.toDate) {
          setLastUpdated(data.updatedAt.toDate());
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load privacy content:', error);
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
    setTempTitle(title);
    setTempContent(content);
  };

  const cancelEditing = () => {
    setEditing(false);
    setTempTitle(title);
    setTempContent(content);
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      const pageRef = doc(db, 'pages', 'privacy');
      await setDoc(pageRef, {
        title: tempTitle,
        slug: 'privacy',
        content: tempContent,
        updatedAt: Timestamp.now(),
      }, { merge: true });
      
      setTitle(tempTitle);
      setContent(tempContent);
      setLastUpdated(new Date());
      setEditing(false);
      toast.success('內容已儲存');
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  const sections = content
    .split('\n\n')
    .map((section) => section.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 relative">
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
            <>
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                className="text-3xl font-bold text-gray-900 w-full border-2 border-blue-500 rounded p-2"
                placeholder="隱私政策"
              />
              <textarea
                value={tempContent}
                onChange={(e) => setTempContent(e.target.value)}
                className="text-gray-700 leading-relaxed w-full border-2 border-blue-500 rounded p-4"
                rows={30}
                placeholder="政策內容..."
              />
            </>
          ) : (
            <>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <div className="space-y-4">
            {sections.map((paragraph, index) => (
              <p key={index} className="text-gray-700 leading-relaxed whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
          <p className="text-sm text-gray-500">
            最後更新日期：{lastUpdated.toLocaleDateString('zh-TW')}
          </p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

