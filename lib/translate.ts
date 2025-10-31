import { translations } from './translations';

export function t(key: string): string {
  return translations[key] || key;
} 