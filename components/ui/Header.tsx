'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';
import { ShoppingCart, User, Menu, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { t } from '@/lib/translate';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Header() {
  const router = useRouter();
  const { user, firebaseUser, signOut, isSupplier, isAdmin } = useAuth();
  const { state } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isServiceMenuOpen, setIsServiceMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const serviceMenuRef = useRef<HTMLDivElement>(null);
  const mobileServiceMenuRef = useRef<HTMLDivElement>(null);
  const NAV_ITEMS = [
    {
      key: 'membership',
      titles: ['成為會員', '點數方案'],
      href: '/pricing',
      defaultTitle: '成為會員',
    },
    {
      key: 'partners',
      titles: ['合作夥伴'],
      href: '/partners',
      defaultTitle: '合作夥伴',
    },
    {
      key: 'about',
      titles: ['關於我們'],
      href: '/about',
      defaultTitle: '關於我們',
    },
    {
      key: 'faq',
      titles: ['F&Q'],
      href: '/faq',
      defaultTitle: 'F&Q',
    },
    {
      key: 'contact',
      titles: ['聯絡我們'],
      href: '/contact',
      defaultTitle: '聯絡我們',
    },
  ] as const;
  type NavItemConfig = (typeof NAV_ITEMS)[number];
  const createDefaultNav = () =>
    NAV_ITEMS.map((item) => ({
      id: item.key,
      title: item.defaultTitle,
      href: item.href,
    }));
  const [navQuickActions, setNavQuickActions] = useState<
    { id: number | string; title: string; href: string }[]
  >(createDefaultNav());

  // Load logo from Firestore
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'site'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          const url = data.logoUrl || '';
          // Validate URL - only accept Firebase Storage URLs or valid HTTPS URLs
          if (url && url.trim() !== '' && 
              (url.startsWith('https://firebasestorage.googleapis.com/') || 
               (url.startsWith('https://') && !url.includes('unsplash.com')))) {
            setLogoUrl(url);
          }
        }
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    };
    loadLogo();
  }, []);

  useEffect(() => {
    const quickActionsRef = doc(db, 'admin', 'quickActions');
    const unsubscribe = onSnapshot(
      quickActionsRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setNavQuickActions(createDefaultNav());
          return;
        }

        const data = snapshot.data() as {
          actions?: Array<{ id?: number | string; title?: string; enabled?: boolean }>;
        };
        const actions = Array.isArray(data.actions) ? data.actions : [];

        const nextNav = NAV_ITEMS.map((item) => {
          const match = actions.find(
            (action) => action?.title && (item.titles as readonly string[]).includes(String(action.title)),
          );

          if (!match) {
            return {
              id: item.key,
              title: item.defaultTitle,
              href: item.href,
            };
          }

          if (match.enabled === false) {
            return null;
          }

          const displayTitle =
            typeof match.title === 'string' && match.title.trim().length > 0
              ? match.title
              : item.defaultTitle;

          return {
            id: match.id ?? item.key,
            title: displayTitle,
            href: item.href,
          };
        }).filter(
          (value): value is {
            id: number | string;
            title: string;
            href: (typeof NAV_ITEMS)[number]['href'];
          } => value !== null
        );

        setNavQuickActions(nextNav);
      },
      (error) => {
        console.error('Error loading quick actions:', error);
        setNavQuickActions(createDefaultNav());
      },
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Close dropdown when clicking outside (desktop only)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only handle desktop service menu, not mobile
      if (serviceMenuRef.current && !serviceMenuRef.current.contains(event.target as Node)) {
        // Don't close if clicking inside mobile menu
        if (mobileServiceMenuRef.current && mobileServiceMenuRef.current.contains(event.target as Node)) {
          return;
        }
        setIsServiceMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset service menu when main menu closes
  useEffect(() => {
    if (!isMenuOpen) {
      setIsServiceMenuOpen(false);
    }
  }, [isMenuOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('已成功登出');
    } catch (error) {
      toast.error('登出時發生錯誤');
    }
  };

  const handleServiceLinkClick = (href: string) => {
    setIsMenuOpen(false);
    setIsServiceMenuOpen(false);
    router.push(href);
  };

  // isAdmin and isSupplier provided by AuthProvider

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-32">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            {logoUrl && (
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="h-20 object-contain"
                onError={(e) => {
                  // If logo fails to load, hide it
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  setLogoUrl('');
                }}
              />
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {firebaseUser && (
              <Link href="/products" className="text-gray-700 hover:text-primary-600 transition-colors">
                新鮮食材
              </Link>
            )}
            <Link href="/about" className="text-gray-700 hover:text-primary-600 transition-colors">
              關於我們
            </Link>
            <div className="relative" ref={serviceMenuRef}>
              <button
                onClick={() => setIsServiceMenuOpen(!isServiceMenuOpen)}
                className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <span>服務範圍</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {isServiceMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <Link href="/services/restaurant-construction" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    商業工程
                  </Link>
                  <Link href="/services/restaurant-furniture" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    傢具訂製
                  </Link>
                  <Link href="/services/kitchen-equipment" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    廚房設備
                  </Link>
                  <Link href="/services/promotion" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    廣告宣傳
                  </Link>
                  <Link href="/services/dishes-tableware" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    餐碟餐具
                  </Link>
                  <Link href="/services/restaurant-maintenance" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    商業維修
                  </Link>
                  <Link href="/services/restaurant-systems" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    系統保安
                  </Link>
                </div>
              )}
            </div>
            <Link href="/pricing" className="text-gray-700 hover:text-primary-600 transition-colors">
              成為會員
            </Link>
            <Link href="/partners" className="text-gray-700 hover:text-primary-600 transition-colors">
              合作夥伴
            </Link>
            <Link href="/faq" className="text-gray-700 hover:text-primary-600 transition-colors">
              F&Q
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-primary-600 transition-colors">
              聯絡我們
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {firebaseUser ? (
              <>
                <Link href="/cart" className="relative p-2 text-gray-700 hover:text-primary-600 transition-colors">
                  <ShoppingCart className="w-6 h-6" />
                  {state.totalItems > 0 && (
                    <span
                      className="absolute -top-1 -right-1 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                      style={{ backgroundColor: '#0B8628' }}
                    >
                      {state.totalItems}
                    </span>
                  )}
                </Link>
                
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 p-2 text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    <User className="w-6 h-6" />
                    <span>{user?.name || t('User')}</span>
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <Link href={isSupplier ? '/supplier' : '/dashboard'} className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                        {isSupplier ? '供應商面板' : '儀表板'}
                      </Link>
                      {!isAdmin && !isSupplier && (
                        <>
                          <Link href="/orders" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                            我的訂單
                          </Link>
                          <Link href="/dashboard/points" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                            會員點數
                          </Link>
                          <Link href="/dashboard/favorites" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                            收藏產品
                          </Link>
                          <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                            帳戶資料
                          </Link>
                        </>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        {t('Sign Out')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="btn-outline">
                  {t('Sign In')}
                </Link>
                <Link href="/partners/apply" className="bg-[#0B8628] hover:bg-[#0a6f21] text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">
                  {t('Get Started')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-primary-600 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              {firebaseUser && (
                <Link href="/products" className="text-gray-700 hover:text-primary-600 transition-colors">
                  新鮮食材
                </Link>
              )}
              <Link href="/about" className="text-gray-700 hover:text-primary-600 transition-colors">
                關於我們
              </Link>
              <div className="flex flex-col" ref={mobileServiceMenuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsServiceMenuOpen(!isServiceMenuOpen);
                  }}
                  className="flex items-center justify-between w-full text-left text-gray-700 hover:text-primary-600 transition-colors py-2"
                  type="button"
                >
                  <span>服務範圍</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isServiceMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isServiceMenuOpen && (
                  <div className="ml-4 mt-2 space-y-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServiceLinkClick('/services/restaurant-construction');
                      }}
                      className="block w-full text-left py-2 px-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded transition-colors cursor-pointer"
                      type="button"
                    >
                      商業工程
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServiceLinkClick('/services/restaurant-furniture');
                      }}
                      className="block w-full text-left py-2 px-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded transition-colors cursor-pointer"
                      type="button"
                    >
                      傢具訂製
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServiceLinkClick('/services/kitchen-equipment');
                      }}
                      className="block w-full text-left py-2 px-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded transition-colors cursor-pointer"
                      type="button"
                    >
                      廚房設備
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServiceLinkClick('/services/promotion');
                      }}
                      className="block w-full text-left py-2 px-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded transition-colors cursor-pointer"
                      type="button"
                    >
                      廣告宣傳
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServiceLinkClick('/services/dishes-tableware');
                      }}
                      className="block w-full text-left py-2 px-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded transition-colors cursor-pointer"
                      type="button"
                    >
                      餐碟餐具
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServiceLinkClick('/services/restaurant-maintenance');
                      }}
                      className="block w-full text-left py-2 px-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded transition-colors cursor-pointer"
                      type="button"
                    >
                      商業維修
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServiceLinkClick('/services/restaurant-systems');
                      }}
                      className="block w-full text-left py-2 px-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded transition-colors cursor-pointer"
                      type="button"
                    >
                      系統保安
                    </button>
                  </div>
                )}
              </div>
              <Link href="/pricing" className="text-gray-700 hover:text-primary-600 transition-colors">
                成為會員
              </Link>
              <Link href="/partners" className="text-gray-700 hover:text-primary-600 transition-colors">
                合作夥伴
              </Link>
              <Link href="/faq" className="text-gray-700 hover:text-primary-600 transition-colors">
                F&Q
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-primary-600 transition-colors">
                聯絡我們
              </Link>
              
              {firebaseUser ? (
                <>
                  <Link href="/cart" className="text-gray-700 hover:text-primary-600 transition-colors">
                    {t('訂貨')}
                  </Link>
                  <Link href={isSupplier ? '/supplier' : '/dashboard'} className="text-gray-700 hover:text-primary-600 transition-colors">
                    {isSupplier ? '供應商面板' : t('Dashboard')}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-left text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    {t('Sign Out')}
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 pt-4">
                  <Link href="/login" className="btn-outline text-center">
                    {t('Sign In')}
                  </Link>
                  <Link href="/partners/apply" className="bg-[#0B8628] hover:bg-[#0a6f21] text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-center">
                    {t('Get Started')}
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
} 