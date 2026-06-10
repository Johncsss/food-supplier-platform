'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  MessageCircle,
  MessageSquare,
  Share2,
  Music2,
  MapPin,
  Mail,
  Phone,
} from 'lucide-react';
import { doc, onSnapshot, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { t } from '@/lib/translate';
import { sanitizeSocialLinks, SocialLinkConfig } from '@/lib/social-links';
import { db } from '@/lib/firebase';
import { getDefaultFooterAreas } from '@/lib/static-pages';
import { useAuth } from '@/components/providers/AuthProvider';
import toast from 'react-hot-toast';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const socialIconMap: Record<SocialLinkConfig['platform'], LucideIcon> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  youtube: Youtube,
  tiktok: Music2,
  whatsapp: MessageCircle,
  wechat: MessageCircle,
  line: MessageSquare,
  custom: Share2,
};

type FooterLink = {
  label?: string;
  url?: string;
};

type FooterQuickLinks = {
  heading?: string;
  link1?: FooterLink;
  link2?: FooterLink;
  link3?: FooterLink;
  link4?: FooterLink;
  link5?: FooterLink;
};

type FooterBottomLinks = {
  link1?: FooterLink;
  link2?: FooterLink;
  link3?: FooterLink;
};

type FooterAreas = {
  company: {
    name?: string;
    description?: string;
  };
  quickLinks: FooterQuickLinks;
  contact: {
    title?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  bottom: {
    copyright?: string;
    links: FooterBottomLinks;
  };
};

const mergeFooterAreas = (areas?: Partial<FooterAreas> | null): FooterAreas => {
  const defaults = getDefaultFooterAreas() as FooterAreas;

  return {
    company: {
      name: (areas?.company?.name ?? defaults.company?.name)?.trim() || defaults.company?.name || '',
      description:
        (areas?.company?.description ?? defaults.company?.description)?.trim() ||
        defaults.company?.description ||
        '',
    },
    quickLinks: {
      heading:
        (areas?.quickLinks?.heading ?? defaults.quickLinks?.heading)?.trim() ||
        defaults.quickLinks?.heading ||
        '',
      link1: { ...defaults.quickLinks?.link1, ...areas?.quickLinks?.link1 },
      link2: { ...defaults.quickLinks?.link2, ...areas?.quickLinks?.link2 },
      link3: { ...defaults.quickLinks?.link3, ...areas?.quickLinks?.link3 },
      link4: { ...defaults.quickLinks?.link4, ...areas?.quickLinks?.link4 },
      link5: { ...defaults.quickLinks?.link5, ...areas?.quickLinks?.link5 },
    },
    contact: {
      title:
        (areas?.contact?.title ?? defaults.contact?.title)?.trim() ||
        defaults.contact?.title ||
        '',
      address:
        (areas?.contact?.address ?? defaults.contact?.address)?.trim() ||
        defaults.contact?.address ||
        '',
      phone:
        (areas?.contact?.phone ?? defaults.contact?.phone)?.trim() ||
        defaults.contact?.phone ||
        '',
      email:
        (areas?.contact?.email ?? defaults.contact?.email)?.trim() ||
        defaults.contact?.email ||
        '',
    },
    bottom: {
      copyright:
        (areas?.bottom?.copyright ?? defaults.bottom?.copyright)?.trim() ||
        defaults.bottom?.copyright ||
        '',
      links: {
        link1: { ...defaults.bottom?.links?.link1, ...areas?.bottom?.links?.link1 },
        link2: { ...defaults.bottom?.links?.link2, ...areas?.bottom?.links?.link2 },
        link3: { ...defaults.bottom?.links?.link3, ...areas?.bottom?.links?.link3 },
      },
    },
  };
};

export default function Footer() {
  const { isAdmin } = useAuth();
  const [footerAreas, setFooterAreas] = useState<FooterAreas>(() => mergeFooterAreas());
  const [socialLinks, setSocialLinks] = useState<SocialLinkConfig[]>([]);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [tempAreas, setTempAreas] = useState<FooterAreas>(() => mergeFooterAreas());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const footerDocRef = doc(db, 'pages', 'footer');
    let bc: BroadcastChannel | null = null;

    const unsubscribe = onSnapshot(
      footerDocRef,
      (snap) => {
        if (!snap.exists()) {
          if (!cancelled) {
            setFooterAreas(mergeFooterAreas());
          }
          return;
        }
        const data = snap.data() as any;
        if (!cancelled) {
          setFooterAreas(mergeFooterAreas(data?.areas));
        }
      },
      (error) => {
        if (!cancelled) {
          console.error('Error fetching footer content:', error);
        }
      },
    );

    // Fallback: fetch via API (works even if Firestore client read is restricted)
    const fetchViaApi = async () => {
      try {
        const res = await fetch('/api/pages/footer', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        const areas = json?.page?.areas;
        if (!cancelled && areas) {
          setFooterAreas(mergeFooterAreas(areas));
        }
      } catch {
        /* noop */
      }
    };
    fetchViaApi();

    // Listen to dashboard saves to refresh immediately on same client
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('cms-updates');
      bc.onmessage = (evt) => {
        if (evt?.data?.type === 'pageSaved' && evt.data.slug === 'footer') {
          fetchViaApi();
        }
      };
    }

    const fetchSocialLinks = async () => {
      try {
        const response = await fetch('/api/social-links', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to load social links: ${response.status}`);
        }
        const data = await response.json();
        if (!cancelled && Array.isArray(data.links)) {
          setSocialLinks(sanitizeSocialLinks(data.links));
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching social links:', error);
        }
      }
    };

    fetchSocialLinks();

    return () => {
      cancelled = true;
      unsubscribe();
      if (bc) {
        bc.close();
      }
    };
  }, []);

  const enabledSocialLinks = socialLinks.filter(
    (link) => link.enabled && typeof link.url === 'string' && link.url.trim() !== '',
  );

  const quickLinkKeys: Array<'link1' | 'link2' | 'link3' | 'link4' | 'link5'> = [
    'link1',
    'link2',
    'link3',
    'link4',
    'link5',
  ];
  const quickLinkItems = quickLinkKeys
    .map((key) => footerAreas.quickLinks?.[key])
    .filter((link): link is FooterLink => !!link && !!link.label && !!link.url);

  const bottomLinkKeys: Array<'link1' | 'link2' | 'link3'> = ['link1', 'link2', 'link3'];
  const bottomLinkItems = bottomLinkKeys
    .map((key) => footerAreas.bottom?.links?.[key])
    .filter((link): link is FooterLink => !!link && !!link.label && !!link.url);

  useEffect(() => {
    setTempAreas(JSON.parse(JSON.stringify(footerAreas)));
  }, [footerAreas]);

  const startEditing = (section: string) => {
    setEditingSection(section);
    setTempAreas(JSON.parse(JSON.stringify(footerAreas)));
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setTempAreas(JSON.parse(JSON.stringify(footerAreas)));
  };

  const saveChanges = async () => {
    if (!editingSection) return;
    
    try {
      setSaving(true);
      const pageRef = doc(db, 'pages', 'footer');
      const snap = await getDoc(pageRef);
      const existingData = snap.exists() ? snap.data() : {};
      
      await setDoc(pageRef, {
        ...existingData,
        title: 'footer',
        slug: 'footer',
        areas: tempAreas,
        updatedAt: Timestamp.now(),
      }, { merge: true });
      
      setFooterAreas(JSON.parse(JSON.stringify(tempAreas)));
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
        <div className="flex gap-2 absolute top-2 right-2 z-10">
          <button
            onClick={saveChanges}
            disabled={saving}
            className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-1 text-xs"
            title="儲存"
          >
            <CheckIcon className="w-4 h-4" />
            {saving ? '儲存中...' : '儲存'}
          </button>
          <button
            onClick={cancelEditing}
            className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 flex items-center gap-1 text-xs"
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
        className="absolute top-2 right-2 bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 z-10 flex items-center gap-1 text-xs"
        title="編輯"
      >
        <PencilIcon className="w-4 h-4" />
        編輯
      </button>
    );
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2 relative">
            <EditButton section="company" />
            {editingSection === 'company' && isAdmin ? (
              <>
                <input
                  type="text"
                  value={tempAreas.company.name || ''}
                  onChange={(e) => updateArea(['company', 'name'], e.target.value)}
                  className="text-xl font-bold mb-4 w-full border-2 border-blue-500 rounded p-2 text-gray-900"
                  placeholder="iFoodPulse"
                />
                <textarea
                  value={tempAreas.company.description || ''}
                  onChange={(e) => updateArea(['company', 'description'], e.target.value)}
                  className="text-gray-300 mb-6 max-w-md w-full border-2 border-blue-500 rounded p-2 text-gray-900"
                  rows={4}
                  placeholder="Premium food supplier platform for restaurants..."
                />
              </>
            ) : (
              <>
            <div className="mb-4">
              <span className="text-xl font-bold">{footerAreas.company.name || t('iFoodPulse')}</span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              {footerAreas.company.description ||
                t(
                  'Premium food supplier platform for restaurants. Get fresh ingredients, quality meats, and everything you need to run your restaurant efficiently with our yearly membership.',
                )}
            </p>
              </>
            )}
            {enabledSocialLinks.length > 0 && (
            <div className="flex space-x-4">
                {enabledSocialLinks.map((link) => {
                  const Icon = socialIconMap[link.platform] ?? Share2;
                  const url = link.url.trim();
                  return (
                    <a
                      key={link.id}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                      aria-label={link.label || link.platform}
                    >
                      <Icon className="w-5 h-5" />
              </a>
                  );
                })}
            </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="relative">
            {editingSection === 'quickLinks' && isAdmin ? (
              <>
                <input
                  type="text"
                  value={tempAreas.quickLinks.heading || ''}
                  onChange={(e) => updateArea(['quickLinks', 'heading'], e.target.value)}
                  className="text-lg font-semibold mb-4 w-full border-2 border-blue-500 rounded p-2 text-gray-900"
                  placeholder="快速連結"
                />
                <ul className="space-y-2">
                  {quickLinkKeys.map((key) => {
                    const link = tempAreas.quickLinks[key];
                    return (
                      <li key={key} className="space-y-1">
                        <input
                          type="text"
                          value={link?.label || ''}
                          onChange={(e) => updateArea(['quickLinks', key, 'label'], e.target.value)}
                          className="w-full border-2 border-blue-500 rounded p-1 text-gray-900 text-sm"
                          placeholder="連結標籤"
                        />
                        <input
                          type="text"
                          value={link?.url || ''}
                          onChange={(e) => updateArea(['quickLinks', key, 'url'], e.target.value)}
                          className="w-full border-2 border-blue-500 rounded p-1 text-gray-900 text-sm"
                          placeholder="/url"
                        />
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <>
            <h3 className="text-lg font-semibold mb-4">
              {footerAreas.quickLinks.heading || '快速連結'}
            </h3>
            <ul className="space-y-2">
              {quickLinkItems.length === 0 && (
                <li className="text-gray-500 text-sm">尚未設定快速連結</li>
              )}
              {quickLinkItems.map((link, index) => {
                const href = link.url?.trim() || '#';
                return (
                  <li key={`${link.label}-${index}`}>
                    <Link href={href} className="text-gray-300 hover:text-white transition-colors">
                      {link.label}
                </Link>
              </li>
                );
              })}
            </ul>
              </>
            )}
          </div>

          {/* Contact Info */}
          <div className="relative">
            <EditButton section="contact" />
            {editingSection === 'contact' && isAdmin ? (
              <>
                <input
                  type="text"
                  value={tempAreas.contact.title || ''}
                  onChange={(e) => updateArea(['contact', 'title'], e.target.value)}
                  className="text-lg font-semibold mb-4 w-full border-2 border-blue-500 rounded p-2 text-gray-900"
                  placeholder="聯絡資訊"
                />
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary-400" strokeWidth={2} />
                    </div>
                    <input
                      type="text"
                      value={tempAreas.contact.address || ''}
                      onChange={(e) => updateArea(['contact', 'address'], e.target.value)}
                      className="text-gray-300 w-full border-2 border-blue-500 rounded p-1 text-gray-900"
                      placeholder="地址"
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-primary-400" strokeWidth={2} />
                    </div>
                    <input
                      type="text"
                      value={tempAreas.contact.phone || ''}
                      onChange={(e) => updateArea(['contact', 'phone'], e.target.value)}
                      className="text-gray-300 w-full border-2 border-blue-500 rounded p-1 text-gray-900"
                      placeholder="電話"
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary-400" strokeWidth={2} />
                    </div>
                    <input
                      type="text"
                      value={tempAreas.contact.email || ''}
                      onChange={(e) => updateArea(['contact', 'email'], e.target.value)}
                      className="text-gray-300 w-full border-2 border-blue-500 rounded p-1 text-gray-900"
                      placeholder="電子郵件"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
            <h3 className="text-lg font-semibold mb-4">
              {footerAreas.contact.title || t('Contact Info')}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary-400" strokeWidth={2} />
                </div>
                <span className="text-gray-300">
                  {footerAreas.contact.address || '香港九龍彌敦道700'}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary-400" strokeWidth={2} />
                </div>
                <span className="text-gray-300">
                  {footerAreas.contact.phone || '(852) 9890-9890'}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary-400" strokeWidth={2} />
                </div>
                <span className="text-gray-300">
                  {footerAreas.contact.email || 'info@ifoodpulse.com'}
                </span>
              </div>
            </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 relative">
          <EditButton section="bottom" />
          {editingSection === 'bottom' && isAdmin ? (
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <input
                type="text"
                value={tempAreas.bottom.copyright || ''}
                onChange={(e) => updateArea(['bottom', 'copyright'], e.target.value)}
                className="text-gray-400 text-sm w-full md:w-auto border-2 border-blue-500 rounded p-2 text-gray-900"
                placeholder="© 2025 iFoodPulse 保留所有權利。"
              />
              <div className="flex flex-col gap-2 mt-4 md:mt-0">
                {bottomLinkKeys.map((key) => {
                  const link = tempAreas.bottom.links[key];
                  return (
                    <div key={key} className="flex gap-2">
                      <input
                        type="text"
                        value={link?.label || ''}
                        onChange={(e) => updateArea(['bottom', 'links', key, 'label'], e.target.value)}
                        className="border-2 border-blue-500 rounded p-1 text-gray-900 text-sm"
                        placeholder="標籤"
                      />
                      <input
                        type="text"
                        value={link?.url || ''}
                        onChange={(e) => updateArea(['bottom', 'links', key, 'url'], e.target.value)}
                        className="border-2 border-blue-500 rounded p-1 text-gray-900 text-sm"
                        placeholder="/url"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            {footerAreas.bottom.copyright || '© 2025 iFoodPulse 保留所有權利。'}
          </p>
          {bottomLinkItems.length > 0 && (
          <div className="flex space-x-6 mt-4 md:mt-0">
              {bottomLinkItems.map((link, index) => {
                const href = link.url?.trim() || '#';
                return (
                  <Link
                    key={`${link.label}-${index}`}
                    href={href}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
            </Link>
                );
              })}
                </div>
              )}
          </div>
          )}
        </div>
      </div>
    </footer>
  );
} 