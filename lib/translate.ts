import { translations } from './translations';

export function t(key: string): string {
  return (translations as Record<string, string>)[key] || key;
} 