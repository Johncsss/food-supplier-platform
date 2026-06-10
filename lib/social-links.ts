export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'twitter'
  | 'youtube'
  | 'tiktok'
  | 'whatsapp'
  | 'wechat'
  | 'line'
  | 'custom';

export interface SocialLinkConfig {
  id: string;
  platform: SocialPlatform;
  label: string;
  url: string;
  enabled: boolean;
  order: number;
}

export interface SocialPlatformOption {
  value: SocialPlatform;
  label: string;
  placeholder: string;
}

export const SOCIAL_PLATFORM_OPTIONS: SocialPlatformOption[] = [
  { value: 'facebook', label: 'Facebook', placeholder: 'https://www.facebook.com/...' },
  { value: 'instagram', label: 'Instagram', placeholder: 'https://www.instagram.com/...' },
  { value: 'linkedin', label: 'LinkedIn', placeholder: 'https://www.linkedin.com/...' },
  { value: 'twitter', label: 'X (Twitter)', placeholder: 'https://www.twitter.com/...' },
  { value: 'youtube', label: 'YouTube', placeholder: 'https://www.youtube.com/...' },
  { value: 'tiktok', label: 'TikTok', placeholder: 'https://www.tiktok.com/@...' },
  { value: 'whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/...' },
  { value: 'wechat', label: 'WeChat', placeholder: 'https://...' },
  { value: 'line', label: 'LINE', placeholder: 'https://line.me/...' },
  { value: 'custom', label: '自訂', placeholder: 'https://...' },
];

export const DEFAULT_SOCIAL_LINKS: SocialLinkConfig[] = SOCIAL_PLATFORM_OPTIONS.filter(
  (option) => option.value !== 'custom',
).map((option, index) => ({
  id: option.value,
  platform: option.value,
  label: option.label,
  url: '',
  enabled: false,
  order: index,
}));

export function createSocialLink(platform: SocialPlatform = 'custom'): SocialLinkConfig {
  const option = SOCIAL_PLATFORM_OPTIONS.find((opt) => opt.value === platform);
  return {
    id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    platform,
    label: option?.label ?? '自訂',
    url: '',
    enabled: false,
    order: Date.now(),
  };
}

export function getPlatformLabel(platform: SocialPlatform): string {
  return SOCIAL_PLATFORM_OPTIONS.find((option) => option.value === platform)?.label ?? '社交媒體';
}

export function sanitizeSocialLinks(links: SocialLinkConfig[] | unknown): SocialLinkConfig[] {
  if (!Array.isArray(links)) {
    return DEFAULT_SOCIAL_LINKS;
  }

  const sanitized = links
    .map((link, index) => {
      if (!link || typeof link !== 'object') {
        return null;
      }

      const platform =
        typeof (link as any).platform === 'string' && isValidPlatform((link as any).platform)
          ? ((link as any).platform as SocialPlatform)
          : 'custom';

      const labelValue =
        typeof (link as any).label === 'string' && (link as any).label.trim() !== ''
          ? (link as any).label.trim()
          : getPlatformLabel(platform);

      const rawUrl = typeof (link as any).url === 'string' ? (link as any).url.trim() : '';
      const urlValue = ensureHttpsPrefix(rawUrl);

      return {
        id:
          typeof (link as any).id === 'string' && (link as any).id.trim() !== ''
            ? (link as any).id.trim()
            : `link-${index}-${Date.now()}`,
        platform,
        label: labelValue,
        url: urlValue,
        enabled: Boolean((link as any).enabled),
        order:
          typeof (link as any).order === 'number' && Number.isFinite((link as any).order)
            ? (link as any).order
            : index,
      } satisfies SocialLinkConfig;
    })
    .filter((value): value is SocialLinkConfig => value !== null);

  if (sanitized.length === 0) {
    return DEFAULT_SOCIAL_LINKS;
  }

  return sanitized.sort((a, b) => a.order - b.order);
}

export function isValidPlatform(value: string): value is SocialPlatform {
  return SOCIAL_PLATFORM_OPTIONS.some((option) => option.value === value);
}

export function validateSocialLinkUrl(url: string): boolean {
  if (!url) {
    return true;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch (error) {
    return false;
  }
}

export function ensureHttpsPrefix(url: string): string {
  if (!url) {
    return '';
  }

  const trimmed = url.trim();
  if (trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (trimmed.startsWith('http://')) {
    return `https://${trimmed.slice('http://'.length)}`;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  return `https://${trimmed}`;
}


