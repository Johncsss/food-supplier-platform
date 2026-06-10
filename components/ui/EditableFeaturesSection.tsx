'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/AuthProvider';
import toast from 'react-hot-toast';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Truck, Shield, Clock, Users, Star, Check } from 'lucide-react';

interface FeatureBlock {
  title: string;
  description: string;
}

interface EditableFeaturesSectionProps {
  initialData?: {
    title?: string;
    description?: string;
    blocks?: FeatureBlock[];
  };
}

const DEFAULT_FEATURES = {
  title: '為什麼選擇高質食品供應商？',
  description: '我們以優質品質和可靠服務提供餐廳所需的一切。',
  blocks: [
    { title: '快速配送', description: '您的訂單將在24-48小時內送達餐廳門口。' },
    { title: '品質保證', description: '所有產品都經過精心挑選，符合最高品質標準。' },
    { title: '24/7 支援', description: '我們的客戶支援團隊全天候為您提供協助。' },
    { title: '餐廳網絡', description: '加入我們成功餐廳的網絡，獲得獨家優惠。' },
    { title: '優質產品', description: '獲得優質食材和特色產品，豐富您的菜單。' },
    { title: '簡易訂購', description: '簡易的線上訂購系統，具備訂單追蹤和管理功能。' },
  ],
};

const FEATURE_ICONS = [Truck, Shield, Clock, Users, Star, Check];

export default function EditableFeaturesSection({ initialData }: EditableFeaturesSectionProps) {
  const { isAdmin } = useAuth();
  const [features, setFeatures] = useState({
    title: initialData?.title || DEFAULT_FEATURES.title,
    description: initialData?.description || DEFAULT_FEATURES.description,
    blocks: initialData?.blocks || DEFAULT_FEATURES.blocks,
  });
  const [editing, setEditing] = useState(false);
  const [tempFeatures, setTempFeatures] = useState(features);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'pages', 'homepage'));
        if (!snap.exists() || cancelled) return;
        const data = snap.data() as any;
        if (data.areas?.features) {
          const featuresData = data.areas.features;
          const blocks: FeatureBlock[] = [];
          
          // Handle both block1-block6 format and array format
          if (featuresData.block1) {
            for (let i = 1; i <= 6; i++) {
              const block = featuresData[`block${i}`];
              if (block && block.title && block.description) {
                blocks.push({ title: block.title, description: block.description });
              }
            }
          } else if (Array.isArray(featuresData.blocks)) {
            blocks.push(...featuresData.blocks);
          }
          
          const loadedFeatures = {
            title: featuresData.title || DEFAULT_FEATURES.title,
            description: featuresData.description || DEFAULT_FEATURES.description,
            blocks: blocks.length > 0 ? blocks : DEFAULT_FEATURES.blocks,
          };
          
          if (!cancelled) {
            setFeatures(loadedFeatures);
            setTempFeatures(loadedFeatures);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load homepage features:', error);
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
    setTempFeatures({ ...features });
  };

  const cancelEditing = () => {
    setEditing(false);
    setTempFeatures({ ...features });
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      const pageRef = doc(db, 'pages', 'homepage');
      const snap = await getDoc(pageRef);
      const existingData = snap.exists() ? snap.data() : {};
      
      // Convert blocks array to block1-block6 format for compatibility
      const blocksObj: any = {};
      tempFeatures.blocks.forEach((block, index) => {
        blocksObj[`block${index + 1}`] = {
          title: block.title,
          description: block.description,
        };
      });
      
      await setDoc(pageRef, {
        ...existingData,
        areas: {
          ...existingData.areas,
          features: {
            title: tempFeatures.title,
            description: tempFeatures.description,
            ...blocksObj,
            blocks: tempFeatures.blocks, // Also save as array for future use
          },
        },
        updatedAt: Timestamp.now(),
      }, { merge: true });
      
      setFeatures({ ...tempFeatures });
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
    <section className="relative py-20 bg-[#fafafa]">
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
                value={tempFeatures.title}
                onChange={(e) => setTempFeatures({ ...tempFeatures, title: e.target.value })}
                className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 w-full border-2 border-blue-500 rounded p-2"
                placeholder="為什麼選擇高質食品供應商？"
              />
              <textarea
                value={tempFeatures.description}
                onChange={(e) => setTempFeatures({ ...tempFeatures, description: e.target.value })}
                className="text-xl text-gray-600 max-w-2xl mx-auto w-full border-2 border-blue-500 rounded p-2"
                rows={2}
                placeholder="我們以優質品質和可靠服務提供餐廳所需的一切。"
              />
            </>
          ) : (
            <>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {features.title}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {features.description}
              </p>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.blocks.map((block, index) => {
            const Icon = FEATURE_ICONS[index] || Truck;
            return (
              <div key={index} className="card p-8 text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Icon className="w-8 h-8 text-primary-600" />
                </div>
                {editing && isAdmin ? (
                  <>
                    <input
                      type="text"
                      value={tempFeatures.blocks[index].title}
                      onChange={(e) => {
                        const newBlocks = [...tempFeatures.blocks];
                        newBlocks[index] = { ...newBlocks[index], title: e.target.value };
                        setTempFeatures({ ...tempFeatures, blocks: newBlocks });
                      }}
                      className="text-xl font-semibold mb-4 w-full border-2 border-blue-500 rounded p-2"
                      placeholder="標題"
                    />
                    <textarea
                      value={tempFeatures.blocks[index].description}
                      onChange={(e) => {
                        const newBlocks = [...tempFeatures.blocks];
                        newBlocks[index] = { ...newBlocks[index], description: e.target.value };
                        setTempFeatures({ ...tempFeatures, blocks: newBlocks });
                      }}
                      className="text-gray-600 w-full border-2 border-blue-500 rounded p-2"
                      rows={3}
                      placeholder="描述"
                    />
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold mb-4">{block.title}</h3>
                    <p className="text-gray-600">
                      {block.description}
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

