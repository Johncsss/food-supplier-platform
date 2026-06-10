'use client';

import { useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, runTransaction, setDoc } from 'firebase/firestore';
import { useAuth } from '@/components/providers/AuthProvider';
import { normalizePointsPlans, NormalizedPointsPlan, DEFAULT_POINTS_PLANS } from '@/lib/points-plans';
import ImageUploader from '@/components/ui/ImageUploader';
import {
  createSocialLink,
  DEFAULT_SOCIAL_LINKS,
  getPlatformLabel,
  ensureHttpsPrefix,
  sanitizeSocialLinks,
  SocialLinkConfig,
  SOCIAL_PLATFORM_OPTIONS,
  validateSocialLinkUrl,
} from '@/lib/social-links';

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
  {
    id: 6,
    title: '成為會員',
    icon: '',
    color: '',
    linkType: 'external',
    internalScreen: '',
    externalUrl: '',
    enabled: true,
  },
  {
    id: 7,
    title: '合作夥伴',
    icon: '',
    color: '',
    linkType: 'external',
    internalScreen: '',
    externalUrl: '',
    enabled: true,
  },
  {
    id: 8,
    title: '關於我們',
    icon: '',
    color: '',
    linkType: 'external',
    internalScreen: '',
    externalUrl: '',
    enabled: true,
  },
  {
    id: 9,
    title: '聯絡我們',
    icon: '',
    color: '',
    linkType: 'external',
    internalScreen: '',
    externalUrl: '',
    enabled: true,
  },
];

const mergeWithDefaults = (stored: QuickActionConfig[]): QuickActionConfig[] => {
  const existingById = new Map(stored.map((action) => [action.id, action]));
  const merged = [...stored];

  DEFAULT_QUICK_ACTIONS.forEach((defaultAction) => {
    if (!existingById.has(defaultAction.id)) {
      merged.push(defaultAction);
    }
  });

  return merged;
};

export default function AdminSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actions, setActions] = useState<QuickActionConfig[]>(DEFAULT_QUICK_ACTIONS);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'標題設定' | '點數方案' | '社交媒體' | '聯絡我們'>('標題設定');
  const [pointPlans, setPointPlans] = useState<NormalizedPointsPlan[]>([]);
  const [pointsLoading, setPointsLoading] = useState(true);
  const [pointsSaving, setPointsSaving] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLinkConfig[]>(DEFAULT_SOCIAL_LINKS);
  const [socialLoading, setSocialLoading] = useState(true);
  const [socialSaving, setSocialSaving] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState<string>('85298636938');
  const [contactLoading, setContactLoading] = useState(true);
  const [contactSaving, setContactSaving] = useState(false);

  const settingsRef = useMemo(() => doc(db, 'admin', 'quickActions'), []);
  const pointsSettingsRef = useMemo(() => doc(db, 'admin', 'pointsSettings'), []);
  const socialLinksRef = useMemo(() => doc(db, 'admin', 'socialLinks'), []);
  const contactSettingsRef = useMemo(() => doc(db, 'admin', 'contactSettings'), []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const snap = await getDoc(settingsRef);
        if (snap.exists()) {
          const data = snap.data() as any;
          if (Array.isArray(data.actions) && data.actions.length > 0) {
            const merged = mergeWithDefaults(data.actions as QuickActionConfig[]);
            setActions(merged);
            if (merged.length !== data.actions.length) {
              await setDoc(settingsRef, { actions: merged });
            }
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

  useEffect(() => {
    const fetchPointPlans = async () => {
      try {
        setPointsLoading(true);
        const snap = await getDoc(pointsSettingsRef);
        if (snap.exists()) {
          const data = snap.data() as any;
          if (Array.isArray(data.plans) && data.plans.length > 0) {
            const normalized = normalizePointsPlans(data.plans, { includeDisabled: true });
            if (normalized.length > 0) {
              setPointPlans(normalized);
              if (typeof window !== 'undefined') {
                try {
                  window.localStorage.setItem('points-plans-cache', JSON.stringify(normalized));
                } catch {
                  // ignore storage errors
                }
              }
              return;
            }
          }
          await setDoc(pointsSettingsRef, { plans: DEFAULT_POINTS_PLANS });
          setPointPlans(DEFAULT_POINTS_PLANS);
          if (typeof window !== 'undefined') {
            try {
              window.localStorage.setItem('points-plans-cache', JSON.stringify(DEFAULT_POINTS_PLANS));
            } catch {
              // ignore storage errors
            }
          }
        } else {
          await setDoc(pointsSettingsRef, { plans: DEFAULT_POINTS_PLANS });
          setPointPlans(DEFAULT_POINTS_PLANS);
          if (typeof window !== 'undefined') {
            try {
              window.localStorage.setItem('points-plans-cache', JSON.stringify(DEFAULT_POINTS_PLANS));
            } catch {
              // ignore storage errors
            }
          }
        }
      } catch (err: any) {
        console.error('Error loading point plans:', err);
        setError(err?.message || '載入點數方案失敗');
        setPointPlans(DEFAULT_POINTS_PLANS);
      } finally {
        setPointsLoading(false);
      }
    };

    fetchPointPlans();
  }, [pointsSettingsRef]);

  useEffect(() => {
    const fetchSocialLinks = async () => {
      try {
        setSocialLoading(true);
        const snap = await getDoc(socialLinksRef);
        if (snap.exists()) {
          const data = snap.data() as any;
          if (Array.isArray(data.links) && data.links.length > 0) {
            const sanitized = sanitizeSocialLinks(data.links);
            setSocialLinks(sanitized);
            return;
          }
        }

        await setDoc(socialLinksRef, { links: DEFAULT_SOCIAL_LINKS });
        setSocialLinks(DEFAULT_SOCIAL_LINKS);
      } catch (err: any) {
        console.error('Error loading social links:', err);
        setError(err?.message || '載入社交媒體連結失敗');
        setSocialLinks(DEFAULT_SOCIAL_LINKS);
      } finally {
        setSocialLoading(false);
      }
    };

    fetchSocialLinks();
  }, [socialLinksRef]);

  useEffect(() => {
    const fetchContactSettings = async () => {
      try {
        setContactLoading(true);
        const snap = await getDoc(contactSettingsRef);
        if (snap.exists()) {
          const data = snap.data() as any;
          if (data.whatsappNumber) {
            setWhatsappNumber(data.whatsappNumber);
          }
        } else {
          // Initialize with default
          await setDoc(contactSettingsRef, { whatsappNumber: '85298636938' });
          setWhatsappNumber('85298636938');
        }
      } catch (err: any) {
        console.error('Error loading contact settings:', err);
        setError(err?.message || '載入聯絡設定失敗');
      } finally {
        setContactLoading(false);
      }
    };

    fetchContactSettings();
  }, [contactSettingsRef]);

  const updateAction = (index: number, patch: Partial<QuickActionConfig>) => {
    setActions(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const updatePointPlan = (index: number, patch: Partial<NormalizedPointsPlan>) => {
    setPointPlans(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const addPointPlan = () => {
    const newPlan: NormalizedPointsPlan = {
      id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: '新方案',
      points: 100,
      enabled: true,
      qrCodeUrl: '',
    };
    setPointPlans(prev => [...prev, newPlan]);
  };

  const removePointPlan = (index: number) => {
    setPointPlans(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateSocialLink = (id: string, patch: Partial<SocialLinkConfig>) => {
    setSocialLinks(prev =>
      prev.map(link => (link.id === id ? { ...link, ...patch } : link)),
    );
  };

  const handlePlatformChange = (id: string, platform: SocialLinkConfig['platform']) => {
    setSocialLinks(prev =>
      prev.map(link => {
        if (link.id !== id) {
          return link;
        }
        const defaultLabel = getPlatformLabel(platform);
        const shouldUpdateLabel =
          link.label === getPlatformLabel(link.platform) || !link.label.trim();
        return {
          ...link,
          platform,
          label: shouldUpdateLabel ? defaultLabel : link.label,
        };
      }),
    );
  };

  const addSocialLink = () => {
    setSocialLinks(prev => [
      ...prev,
      {
        ...createSocialLink(),
        order: prev.length,
      },
    ]);
  };

  const removeSocialLink = (id: string) => {
    setSocialLinks(prev => prev.filter(link => link.id !== id));
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

  const savePointPlans = async () => {
    try {
      setPointsSaving(true);
      setError(null);
      setSuccess(null);

      if (pointPlans.length === 0) {
        setError('請至少保留一個點數方案');
        return;
      }

      const invalidPlan = pointPlans.find(plan => !plan.points || plan.points <= 0);
      if (invalidPlan) {
        setError('每個點數方案的點數必須為正整數');
        return;
      }

      const missingQr = pointPlans.find(plan => plan.enabled && !plan.qrCodeUrl);
      if (missingQr) {
        setError('請為每個點數方案上傳 QR Code 圖片');
        return;
      }

      const normalized = normalizePointsPlans(pointPlans, { includeDisabled: true });

      await runTransaction(db, async (tx) => {
        const ref = pointsSettingsRef;
        tx.set(ref, { plans: normalized });
      });

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('points-plans-cache', JSON.stringify(normalized));
        } catch {
          // ignore storage errors
        }
        window.dispatchEvent(
          new CustomEvent('points-plans-updated', {
            detail: normalized,
          }),
        );
      }

      setPointPlans(normalized);
      setSuccess('點數方案已儲存');
    } catch (err: any) {
      console.error('Error saving point plans:', err);
      setError(err?.message || '儲存點數方案失敗');
    } finally {
      setPointsSaving(false);
    }
  };

  const saveSocialLinks = async () => {
    try {
      setSocialSaving(true);
      setError(null);
      setSuccess(null);

      if (socialLinks.length === 0) {
        setError('請至少保留一個社交媒體項目');
        return;
      }

      const normalized = socialLinks.map((link, index) => {
        const trimmedLabel = (link.label || '').trim();
        const trimmedUrl = (link.url || '').trim();
        const normalizedUrl = trimmedUrl ? ensureHttpsPrefix(trimmedUrl) : '';
        return {
          ...link,
          label: trimmedLabel || getPlatformLabel(link.platform),
          url: normalizedUrl,
          order: index,
        };
      });

      const missingUrl = normalized.find(link => link.enabled && !link.url);
      if (missingUrl) {
        setError(`請為 ${missingUrl.label} 填寫連結網址`);
        return;
      }

      const invalidUrl = normalized.find(link => link.url && !validateSocialLinkUrl(link.url));
      if (invalidUrl) {
        setError(`請輸入有效的網址（${invalidUrl.label}）`);
        return;
      }

      await setDoc(socialLinksRef, { links: normalized });
      setSocialLinks(normalized);
      setSuccess('社交媒體連結已儲存');
    } catch (err: any) {
      console.error('Error saving social links:', err);
      setError(err?.message || '儲存社交媒體連結失敗');
    } finally {
      setSocialSaving(false);
    }
  };

  const saveContactSettings = async () => {
    try {
      setContactSaving(true);
      setError(null);
      setSuccess(null);

      // Validate WhatsApp number (should be digits only, optionally with country code)
      const cleanedNumber = whatsappNumber.replace(/\D/g, '');
      if (!cleanedNumber || cleanedNumber.length < 8) {
        setError('請輸入有效的 WhatsApp 號碼（至少 8 位數字）');
        return;
      }

      await setDoc(contactSettingsRef, { whatsappNumber: cleanedNumber });
      setWhatsappNumber(cleanedNumber);
      setSuccess('聯絡設定已儲存');
    } catch (err: any) {
      console.error('Error saving contact settings:', err);
      setError(err?.message || '儲存聯絡設定失敗');
    } finally {
      setContactSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">管理設定</h1>
          <p className="text-gray-600">針對不同功能模組調整系統設定。</p>
        </div>

        <div className="mb-8">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white shadow-sm">
            {(['標題設定', '點數方案', '社交媒體', '聯絡我們'] as const).map((tab, index) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                } ${
                  index === 0
                    ? 'rounded-l-lg'
                    : index === (['標題設定', '點數方案', '社交媒體', '聯絡我們'] as const).length - 1
                      ? 'rounded-r-lg'
                      : ''
                }`}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded border border-green-200 bg-green-50 text-green-700">{success}</div>
        )}

        {activeTab === '標題設定' && (
          <>
            <div className="space-y-4">
              {actions.map((action, index) => (
                <div key={action.id} className="card p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">標題</label>
                        <input
                          type="text"
                          value={action.title}
                          onChange={(e) => updateAction(index, { title: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>

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
          </>
        )}

        {activeTab === '點數方案' && (
          <div className="space-y-4">
            {pointsLoading ? (
              <div className="card p-6 text-center text-gray-500">點數方案載入中...</div>
            ) : pointPlans.length === 0 ? (
              <div className="card p-6 text-center text-gray-500">
                目前沒有點數方案，請新增方案後儲存。
              </div>
            ) : (
              <>
                {pointPlans.map((plan, index) => (
                  <div key={plan.id} className="card p-4">
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">方案標題</label>
                              <input
                                type="text"
                                value={plan.title}
                                onChange={(e) => updatePointPlan(index, { title: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">點數</label>
                              <input
                                type="number"
                                min={1}
                                value={plan.points}
                                onChange={(e) => {
                                  const nextValue = Math.max(1, Math.round(Number(e.target.value) || 0));
                                  updatePointPlan(index, { points: nextValue });
                                }}
                                className="w-full px-3 py-2 border rounded-lg"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">金額 (HKD)</label>
                              <div className="px-3 py-2 border rounded-lg bg-gray-50 text-gray-700">
                                ${plan.points.toLocaleString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <input
                                  id={`point-enabled-${plan.id}`}
                                  type="checkbox"
                                  checked={plan.enabled}
                                  onChange={(e) => updatePointPlan(index, { enabled: e.target.checked })}
                                />
                                <label htmlFor={`point-enabled-${plan.id}`} className="text-sm text-gray-700">啟用</label>
                              </div>
                              <button
                                type="button"
                                onClick={() => removePointPlan(index)}
                                disabled={pointPlans.length <= 1}
                                className="text-sm text-red-600 hover:text-red-700 disabled:text-gray-300"
                              >
                                刪除
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="w-full lg:w-80">
                          <label className="block text-sm font-medium text-gray-700 mb-2">收款 QR Code 圖片</label>
                          <ImageUploader
                            value={plan.qrCodeUrl}
                            folder="images"
                            onChange={(url) => {
                              setError(null);
                              updatePointPlan(index, { qrCodeUrl: url });
                            }}
                            onError={(message) => setError(message)}
                          />
                          <p className="mt-2 text-xs text-gray-500">
                            會員購買此方案時將顯示該 QR Code。
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        1 港元 = 1 點；購買頁面會依此設定顯示方案、金額與 QR Code。
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={addPointPlan}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  >
                    新增點數方案
                  </button>
                  <button
                    onClick={savePointPlans}
                    disabled={pointsSaving || pointsLoading}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg"
                  >
                    {pointsSaving ? '儲存中...' : '儲存點數方案'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === '社交媒體' && (
          <div className="space-y-4">
            {socialLoading ? (
              <div className="card p-6 text-center text-gray-500">社交媒體設定載入中...</div>
            ) : (
              <>
                {socialLinks.map((link, index) => (
                  <div key={link.id} className="card p-4">
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">平台</label>
                          <select
                            value={link.platform}
                            onChange={(e) => handlePlatformChange(link.id, e.target.value as SocialLinkConfig['platform'])}
                            className="w-full px-3 py-2 border rounded-lg"
                          >
                            {SOCIAL_PLATFORM_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">連結網址</label>
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => updateSocialLink(link.id, { url: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder={
                              SOCIAL_PLATFORM_OPTIONS.find(option => option.value === link.platform)?.placeholder ||
                              'https://'
                            }
                          />
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <input
                            id={`social-enabled-${link.id}`}
                            type="checkbox"
                            checked={link.enabled}
                            onChange={(e) => updateSocialLink(link.id, { enabled: e.target.checked })}
                          />
                          <label htmlFor={`social-enabled-${link.id}`} className="text-sm text-gray-700">顯示於頁尾</label>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">排序：{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeSocialLink(link.id)}
                            disabled={socialLinks.length <= 1}
                            className="text-sm text-red-600 hover:text-red-700 disabled:text-gray-300"
                          >
                            刪除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={addSocialLink}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  >
                    新增社交媒體
                  </button>
                  <button
                    onClick={saveSocialLinks}
                    disabled={socialSaving || socialLoading}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg"
                  >
                    {socialSaving ? '儲存中...' : '儲存社交媒體'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === '聯絡我們' && (
          <div className="space-y-4">
            {contactLoading ? (
              <div className="card p-6 text-center text-gray-500">聯絡設定載入中...</div>
            ) : (
              <div className="card p-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">WhatsApp 號碼設定</h2>
                    <p className="text-sm text-gray-600 mb-4">
                      設定用於所有「聯絡我們」功能的 WhatsApp 號碼。此號碼將用於網站和行動應用程式中的所有聯絡功能。
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          WhatsApp 號碼
                        </label>
                        <input
                          type="text"
                          value={whatsappNumber}
                          onChange={(e) => setWhatsappNumber(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="85298636938"
                        />
                        <p className="mt-2 text-xs text-gray-500">
                          請輸入 WhatsApp 號碼（僅數字，包含國家代碼，例如：85298636938）
                        </p>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                          <strong>預覽：</strong> WhatsApp 連結將使用此格式：{' '}
                          <code className="bg-blue-100 px-2 py-1 rounded">
                            https://wa.me/{whatsappNumber || '85298636938'}?text=您好，我想查詢。
                          </code>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      onClick={saveContactSettings}
                      disabled={contactSaving || contactLoading}
                      className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg"
                    >
                      {contactSaving ? '儲存中...' : '儲存設定'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


