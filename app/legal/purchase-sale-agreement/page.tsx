'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  PURCHASE_SALE_DEFAULT_CONTENT,
  PURCHASE_SALE_DEFAULT_TITLE,
} from '@/lib/static-pages';

export default function PurchaseSaleAgreementPage() {
  const [title, setTitle] = useState(PURCHASE_SALE_DEFAULT_TITLE);
  const [content, setContent] = useState(PURCHASE_SALE_DEFAULT_CONTENT);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'pages', 'purchase-sale-agreement'));
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
            : PURCHASE_SALE_DEFAULT_TITLE,
        );
        setContent(
          typeof data.content === 'string' && data.content.trim().length > 0
            ? data.content
            : PURCHASE_SALE_DEFAULT_CONTENT,
        );
        if (data.updatedAt?.toDate) {
          setLastUpdated(data.updatedAt.toDate());
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load purchase-sale-agreement content:', error);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const sections = content
    .split('\n\n')
    .map((section) => section.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
