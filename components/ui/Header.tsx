'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';
import { ShoppingCart, User, Menu, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { t } from '@/lib/translate';

export default function Header() {
  const { user, firebaseUser, signOut } = useAuth();
  const { state } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isServiceMenuOpen, setIsServiceMenuOpen] = useState(false);
  const serviceMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (serviceMenuRef.current && !serviceMenuRef.current.contains(event.target as Node)) {
        setIsServiceMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('已成功登出');
    } catch (error) {
      toast.error('登出時發生錯誤');
    }
  };

  const handleServiceLinkClick = () => {
    setIsMenuOpen(false);
    setIsServiceMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="text-xl font-bold text-gray-900">{t('FoodSupplier Pro')}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/products" className="text-gray-700 hover:text-primary-600 transition-colors">
              新鮮食材
            </Link>
            
            {/* Service Scope Dropdown */}
            <div className="relative" ref={serviceMenuRef}>
              <button
                onClick={() => setIsServiceMenuOpen(!isServiceMenuOpen)}
                className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <span>服務範圍</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {isServiceMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <Link href="/services/restaurant-construction" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    餐廳工程
                  </Link>
                  <Link href="/services/restaurant-furniture" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    餐廳傢具
                  </Link>
                  <Link href="/services/kitchen-equipment" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    廚房設備
                  </Link>
                  <Link href="/services/promotion" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    宣傳
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
            <Link href="/about" className="text-gray-700 hover:text-primary-600 transition-colors">
              關於我們
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-primary-600 transition-colors">
              {t('Contact')}
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {firebaseUser ? (
              <>
                <Link href="/cart" className="relative p-2 text-gray-700 hover:text-primary-600 transition-colors">
                  <ShoppingCart className="w-6 h-6" />
                  {state.totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
                      <Link href="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                        {t('Dashboard')}
                      </Link>
                      <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                        {t('Profile')}
                      </Link>
                      <Link href="/orders" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                        {t('Orders')}
                      </Link>
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
                <Link href="/register" className="btn-primary">
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
              <Link href="/products" className="text-gray-700 hover:text-primary-600 transition-colors">
                新鮮食材
              </Link>
              
              {/* Service Scope Mobile Menu */}
              <div className="flex flex-col">
                <button
                  onClick={() => setIsServiceMenuOpen(!isServiceMenuOpen)}
                  className="flex items-center justify-between text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <span>服務範圍</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isServiceMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isServiceMenuOpen && (
                  <div className="ml-4 mt-2 space-y-2">
                    <Link href="/services/restaurant-construction" onClick={handleServiceLinkClick} className="block text-gray-600 hover:text-primary-600 transition-colors">
                      餐廳工程
                    </Link>
                    <Link href="/services/restaurant-furniture" onClick={handleServiceLinkClick} className="block text-gray-600 hover:text-primary-600 transition-colors">
                      餐廳傢具
                    </Link>
                    <Link href="/services/kitchen-equipment" onClick={handleServiceLinkClick} className="block text-gray-600 hover:text-primary-600 transition-colors">
                      廚房設備
                    </Link>
                    <Link href="/services/promotion" onClick={handleServiceLinkClick} className="block text-gray-600 hover:text-primary-600 transition-colors">
                      宣傳
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
              <Link href="/about" className="text-gray-700 hover:text-primary-600 transition-colors">
                關於我們
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-primary-600 transition-colors">
                {t('Contact')}
              </Link>
              
              {firebaseUser ? (
                <>
                  <Link href="/cart" className="text-gray-700 hover:text-primary-600 transition-colors">
                    {t('訂貨')}
                  </Link>
                  <Link href="/dashboard" className="text-gray-700 hover:text-primary-600 transition-colors">
                    {t('Dashboard')}
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
                  <Link href="/register" className="btn-primary text-center">
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