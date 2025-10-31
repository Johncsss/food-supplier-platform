'use client';

import { useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/components/providers/AuthProvider';

type LinkType = 'internal' | 'external';

interface QuickActionConfig {
  id: number;
  title: string;
  icon: string; // Ionicons name used by mobile app
  color: string; // hex color string
  linkType: LinkType;
  internalScreen?: string; // Mobile screen name for internal navigation
  externalUrl?: string; // Absolute URL for external navigation
  enabled: boolean;
}

const DEFAULT_QUICK_ACTIONS: QuickActionConfig[] = [
  {
    id: 1,
    title: '食材訂購',
    icon: 'restaurant-outline',
    color: '#10B981',
    linkType: 'internal',
    internalScreen: 'Products',
    externalUrl: '',
    enabled: true,
  },
  {
    id: 2,
    title: '餐廳工程',
    icon: 'construct-outline',
    color: '#3B82F6',
    linkType: 'external',
    internalScreen: '',
    externalUrl: 'https://example.com/engineering',
    enabled: true,
  },
  {
    id: 3,
    title: '餐廳傢具',
    icon: 'bed-outline',
    color: '#8B5CF6',
    linkType: 'external',
    internalScreen: '',
    externalUrl: 'https://example.com/furniture',
    enabled: true,
  },
  {
    id: 4,
    title: '廚房設備',
    icon: 'hardware-chip-outline',
    color: '#F59E0B',
    linkType: 'external',
    internalScreen: '',
    externalUrl: 'https://example.com/kitchen',
    enabled: true,
  },
  {
    id: 5,
    title: '宣傳',
    icon: 'megaphone-outline',
    color: '#EF4444',
    linkType: 'external',
    internalScreen: '',
    externalUrl: 'https://example.com/marketing',
    enabled: true,
  },
];

export default function AdminSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actions, setActions] = useState<QuickActionConfig[]>(DEFAULT_QUICK_ACTIONS);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const settingsRef = useMemo(() => doc(db, 'admin', 'quickActions'), []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const snap = await getDoc(settingsRef);
        if (snap.exists()) {
          const data = snap.data() as any;
          if (Array.isArray(data.actions) && data.actions.length > 0) {
            setActions(data.actions as QuickActionConfig[]);
          } else {
            // Initialize with defaults if empty
            await setDoc(settingsRef, { actions: DEFAULT_QUICK_ACTIONS });
            setActions(DEFAULT_QUICK_ACTIONS);
          }
        } else {
          // Initialize document with defaults
          await setDoc(settingsRef, { actions: DEFAULT_QUICK_ACTIONS });
          setActions(DEFAULT_QUICK_ACTIONS);
        }
      } catch (err: any) {
        console.error('Error loading settings:', err);
        setError(err?.message || '載入設定失敗');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [settingsRef]);

  const updateAction = (index: number, patch: Partial<QuickActionConfig>) => {
    setActions(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const saveAll = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      // Basic validation for external URLs
      const normalized = actions.map(a => ({
        ...a,
        externalUrl: a.linkType === 'external' ? (a.externalUrl || '') : '',
        internalScreen: a.linkType === 'internal' ? (a.internalScreen || '') : '',
      }));
      await setDoc(settingsRef, { actions: normalized });
      setSuccess('設定已儲存');
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err?.message || '儲存設定失敗');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">行動應用快速動作設定</h1>
          <p className="text-gray-600">管理行動應用首頁的 5 個快速動作按鈕的導向目標。</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded border border-green-200 bg-green-50 text-green-700">{success}</div>
        )}

        <div className="space-y-4">
          {actions.map((action, index) => (
            <div key={action.id} className="card p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">標題</label>
                    <input
                      type="text"
                      value={action.title}
                      onChange={(e) => updateAction(index, { title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                    <input
                      type="text"
                      value={action.icon}
                      onChange={(e) => updateAction(index, { icon: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">顏色</label>
                    <input
                      type="text"
                      value={action.color}
                      onChange={(e) => updateAction(index, { color: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">連結類型</label>
                    <select
                      value={action.linkType}
                      onChange={(e) => updateAction(index, { linkType: e.target.value as LinkType })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="internal">內部導向 (App 畫面)</option>
                      <option value="external">外部連結 (URL)</option>
                    </select>
                  </div>

                  {action.linkType === 'internal' ? (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">App 畫面名稱</label>
                      <input
                        type="text"
                        placeholder="例如: Products 或 Orders"
                        value={action.internalScreen || ''}
                        onChange={(e) => updateAction(index, { internalScreen: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">外部 URL</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={action.externalUrl || ''}
                        onChange={(e) => updateAction(index, { externalUrl: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      id={`enabled-${action.id}`}
                      type="checkbox"
                      checked={action.enabled}
                      onChange={(e) => updateAction(index, { enabled: e.target.checked })}
                    />
                    <label htmlFor={`enabled-${action.id}`} className="text-sm text-gray-700">啟用</label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <button
            onClick={saveAll}
            disabled={saving || loading}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg"
          >
            {saving ? '儲存中...' : '儲存所有設定'}
          </button>
        </div>
      </div>
    </div>
  );
}


