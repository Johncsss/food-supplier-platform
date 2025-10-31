'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { t } from '@/lib/translate';

export default function UnauthorizedHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'unauthorized') {
      toast.error(t('You do not have administrator privileges to access that page.'));
    }
  }, [searchParams]);

  return null;
}

