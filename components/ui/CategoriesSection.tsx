'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import Link from 'next/link';
import { Category } from '@/shared/types';
import { t } from '@/lib/translate';

interface CategoriesSectionProps {
  categories: (Category & { productCount: number })[];
}

export default function CategoriesSection({ categories }: CategoriesSectionProps) {
  const { firebaseUser, loading } = useAuth();

  // Only show categories section if user is logged in
  if (loading) {
    return null; // Or show a loading state if preferred
  }

  if (!firebaseUser) {
    return null; // Hide categories section for non-logged-in users
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            產品類別
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            為您的餐廳提供所需的一切
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              <div className="h-48 bg-cover bg-center relative" style={{ backgroundImage: `url(${category.imageUrl})` }}>
                <div className="absolute inset-0 bg-black bg-opacity-40 hover:bg-opacity-30 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-xl font-bold z-10 text-center px-4">{category.name}</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{category.description}</p>
                <p className="text-gray-600 text-sm mb-4">{category.productCount} {t('items')}</p>
                <Link href={`/products?category=${encodeURIComponent(category.name)}`} className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center">
                  瀏覽產品
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

