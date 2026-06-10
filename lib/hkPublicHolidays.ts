'use client';

import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const fallbackPublicHolidays: Record<number, string[]> = {
  2024: [
    '2024-01-01',
    '2024-02-10',
    '2024-02-11',
    '2024-02-12',
    '2024-02-13',
    '2024-03-29',
    '2024-03-30',
    '2024-04-01',
    '2024-04-04',
    '2024-05-01',
    '2024-05-15',
    '2024-06-10',
    '2024-07-01',
    '2024-09-18',
    '2024-10-01',
    '2024-10-11',
    '2024-12-25',
    '2024-12-26',
  ],
  2025: [
    '2025-01-01',
    '2025-01-28',
    '2025-01-29',
    '2025-01-30',
    '2025-01-31',
    '2025-03-29',
    '2025-03-31',
    '2025-04-04',
    '2025-04-18',
    '2025-05-01',
    '2025-05-06',
    '2025-06-02',
    '2025-07-01',
    '2025-09-08',
    '2025-10-01',
    '2025-10-07',
    '2025-12-25',
    '2025-12-26',
  ],
  2026: [
    '2026-01-01',
    '2026-02-17',
    '2026-02-18',
    '2026-02-19',
    '2026-02-20',
    '2026-04-03',
    '2026-04-04',
    '2026-04-06',
    '2026-04-10',
    '2026-05-01',
    '2026-05-20',
    '2026-06-19',
    '2026-07-01',
    '2026-09-25',
    '2026-10-01',
    '2026-10-30',
    '2026-12-25',
    '2026-12-26',
  ],
};

const publicHolidayCache = new Map<number, Set<string>>();

export const getFallbackHongKongPublicHolidays = (year: number): string[] => {
  return fallbackPublicHolidays[year] || [];
};

export const fetchHongKongPublicHolidays = async (year: number): Promise<Set<string>> => {
  if (publicHolidayCache.has(year)) {
    return new Set(publicHolidayCache.get(year));
  }

  let dates: string[] = [];

  try {
    const ref = doc(db, 'publicHolidays', year.toString());
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as any;
      if (Array.isArray(data?.dates)) {
        dates = data.dates;
      }
    }
  } catch (error) {
    console.error('Failed to fetch public holidays from Firestore:', error);
  }

  if (dates.length === 0) {
    dates = getFallbackHongKongPublicHolidays(year);
  }

  const result = new Set(dates);
  publicHolidayCache.set(year, result);
  return new Set(result);
};

export const getCachedHongKongPublicHolidays = (year: number): Set<string> | undefined => {
  const cached = publicHolidayCache.get(year);
  return cached ? new Set(cached) : undefined;
};

