'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/AuthProvider';

export default function WhatsAppFloatButton() {
  const pathname = usePathname();
  const { firebaseUser, loading } = useAuth();
  const [whatsappNumber, setWhatsappNumber] = useState<string>('85298636938');

  useEffect(() => {
    const fetchWhatsAppNumber = async () => {
      try {
        const snap = await getDoc(doc(db, 'admin', 'contactSettings'));
        if (snap.exists()) {
          const data = snap.data() as any;
          if (data.whatsappNumber) {
            setWhatsappNumber(data.whatsappNumber);
          }
        }
      } catch (error) {
        console.error('Error fetching WhatsApp number:', error);
        // Keep default value
      }
    };

    fetchWhatsAppNumber();
  }, []);

  // Hide WhatsApp button on admin or supplier pages
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/supplier')) {
    return null;
  }

  // Hide WhatsApp button if user is logged in (only show for non-logged in users)
  if (!loading && firebaseUser) {
    return null;
  }

  // Don't show anything while loading
  if (loading) {
    return null;
  }

  const handleClick = () => {
    // Ensure the number has country code (if it's just 8 digits, assume Hong Kong +852)
    let numberToUse = whatsappNumber;
    if (/^\d{8}$/.test(whatsappNumber)) {
      // If it's just 8 digits, add Hong Kong country code
      numberToUse = `852${whatsappNumber}`;
    }
    
    const message = encodeURIComponent('您好，我想查詢。');
    const whatsappUrl = `https://wa.me/${numberToUse}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
      aria-label="聯絡我們 WhatsApp"
      title="聯絡我們"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="absolute right-full mr-3 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        聯絡我們
      </span>
    </button>
  );
}

