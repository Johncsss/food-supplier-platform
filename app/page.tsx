import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import UnauthorizedHandler from '@/components/UnauthorizedHandler';
import CategoriesSection from '@/components/ui/CategoriesSection';
import { Check, Star, Truck, Shield, Clock, Users } from 'lucide-react';
import { t } from '@/lib/translate';
import { categories as defaultCategories } from '@/shared/products';
import { Category } from '@/shared/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';

async function getHomepageCmsData() {
  try {
    const pageDoc = await getDoc(doc(db, 'pages', 'homepage'));
    if (pageDoc.exists()) {
      return pageDoc.data().areas || null;
    }
    return null;
  } catch (error) {
    console.error('Error fetching homepage CMS data:', error);
    return null;
  }
}

async function getCategoriesWithCounts() {
  try {
    // Fetch all products to count items per category
    const productsRef = collection(db, 'products');
    const productsSnapshot = await getDocs(productsRef);
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      category: doc.data().category || '',
    }));

    // Fetch categories from Firestore
    const categoriesRef = collection(db, 'categories');
    const categoriesSnapshot = await getDocs(query(categoriesRef, orderBy('name')));
    const fetchedCategories: Category[] = categoriesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        description: data.description || '',
        imageUrl: data.imageUrl || '',
        subcategories: data.subcategories || [],
      };
    });

    // Use Firestore categories if available, otherwise use defaults
    const categoriesToUse = fetchedCategories.length > 0 ? fetchedCategories : defaultCategories;

    // Count products per category
    const categoryCounts = products.reduce((acc, product) => {
      if (product.category) {
        acc[product.category] = (acc[product.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Return categories with product counts
    return categoriesToUse.map(category => ({
      ...category,
      productCount: categoryCounts[category.name] || 0,
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return default categories with 0 counts on error
    return defaultCategories.map(cat => ({ ...cat, productCount: 0 }));
  }
}

export default async function Home() {
  const categoriesWithCounts = await getCategoriesWithCounts();
  const cmsData = await getHomepageCmsData();
  const heroData = cmsData?.hero || {};
  // Validate banner URL - only accept Firebase Storage URLs or valid HTTPS URLs
  const rawBannerUrl = heroData.bannerImageUrl || '';
  let bannerImageUrl = '';
  if (rawBannerUrl && rawBannerUrl.trim() !== '') {
    // Check if it's a valid Firebase Storage URL or a valid HTTPS URL
    if (rawBannerUrl.startsWith('https://firebasestorage.googleapis.com/')) {
      bannerImageUrl = rawBannerUrl;
    } else if (rawBannerUrl.startsWith('https://') && 
               !rawBannerUrl.includes('unsplash.com') &&
               !rawBannerUrl.match(/^photo-\d+-[a-f0-9]+$/)) {
      // Valid HTTPS URL that's not unsplash and not a photo ID
      bannerImageUrl = rawBannerUrl;
    } else {
      // Invalid URL - log for debugging
      console.warn('Invalid banner URL detected:', rawBannerUrl);
      bannerImageUrl = '';
    }
  }
  const heroTitle = heroData.title || t('Premium Food Supply for');
  const heroTitleSpan = heroData.titleSpan || t('Restaurants');
  const heroDescription = heroData.description || t('Get fresh ingredients, quality meats, and everything you need to run your restaurant efficiently with our yearly membership program.');
  const button1Text = heroData.button1Text || t('Start Your Membership');
  const button1Link = heroData.button1Link || '/register';
  const button2Text = heroData.button2Text || t('Browse Products');
  const button2Link = heroData.button2Link || '/products';
  
  return (
    <div className="min-h-screen bg-gray-50">
      <UnauthorizedHandler />
      <Header />
      
      {/* Hero Banner Image Section */}
      {bannerImageUrl && bannerImageUrl.trim() !== '' && (
        <section className="w-full bg-gray-100">
          <div className="w-full overflow-hidden">
            <img 
              src={bannerImageUrl} 
              alt="Hero banner" 
              className="w-full h-auto object-cover"
              style={{ maxHeight: '600px', width: '100%', display: 'block' }}
              onError={(e) => {
                console.error('Failed to load hero banner image. URL:', bannerImageUrl);
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                // Hide the entire section if image fails to load
                const section = target.closest('section');
                if (section) {
                  section.style.display = 'none';
                }
              }}
              onLoad={() => {
                console.log('Hero banner image loaded successfully:', bannerImageUrl);
              }}
            />
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section 
        className={`${bannerImageUrl ? 'bg-white' : 'bg-gradient-to-br from-primary-600 to-primary-800'} ${bannerImageUrl ? 'text-gray-900' : 'text-white'} py-24`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className={`text-4xl md:text-6xl font-bold mb-6 ${bannerImageUrl ? 'text-gray-900' : 'text-white'}`}>
              {heroTitleSpan && heroTitle.includes(heroTitleSpan) ? (
                <>
                  {heroTitle.split(heroTitleSpan)[0]}
                  <span className={bannerImageUrl ? 'text-primary-600' : 'text-secondary-300'}>{heroTitleSpan}</span>
                  {heroTitle.split(heroTitleSpan)[1]}
                </>
              ) : (
                <>
                  {heroTitle}
                  {heroTitleSpan && <span className={bannerImageUrl ? 'text-primary-600' : 'text-secondary-300'}> {heroTitleSpan}</span>}
                </>
              )}
            </h1>
            <p className={`text-xl md:text-2xl mb-8 max-w-3xl mx-auto ${bannerImageUrl ? 'text-gray-600' : 'text-primary-100'}`}>
              {heroDescription}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={button1Link} className={`${bannerImageUrl ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'btn-secondary'} text-lg px-8 py-4 rounded-lg transition-colors`}>
                {button1Text}
              </Link>
              <Link href={button2Link} className={`${bannerImageUrl ? 'border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white' : 'btn-outline border-white text-white hover:bg-white hover:text-primary-600'} text-lg px-8 py-4 rounded-lg transition-colors`}>
                {button2Text}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('Why Choose FoodSupplier Pro?')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('We provide everything your restaurant needs with premium quality and reliable service.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Truck className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{t('Fast Delivery')}</h3>
              <p className="text-gray-600">
                {t('Get your orders delivered within 24-48 hours to your restaurant doorstep.')}
              </p>
            </div>

            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{t('Quality Guaranteed')}</h3>
              <p className="text-gray-600">
                {t('All products are carefully selected and meet the highest quality standards.')}
              </p>
            </div>

            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{t('24/7 Support')}</h3>
              <p className="text-gray-600">
                {t('Our customer support team is available around the clock to help you.')}
              </p>
            </div>

            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{t('Restaurant Network')}</h3>
              <p className="text-gray-600">
                {t('Join our network of successful restaurants and get exclusive benefits.')}
              </p>
            </div>

            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{t('Premium Products')}</h3>
              <p className="text-gray-600">
                {t('Access to premium ingredients and specialty products for your menu.')}
              </p>
            </div>

            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{t('Easy Ordering')}</h3>
              <p className="text-gray-600">
                {t('Simple online ordering system with order tracking and management.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section - Only visible to logged-in users */}
      <CategoriesSection categories={categoriesWithCounts} />

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('What Our Members Say')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('Join thousands of satisfied restaurants across the country.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: t('Sarah Johnson'),
                restaurant: t('The Garden Bistro'),
                text: t('FoodSupplier Pro has transformed our restaurant operations. The quality and reliability are unmatched.'),
              },
              {
                name: t('Michael Chen'),
                restaurant: t('Golden Dragon'),
                text: t('Excellent service and premium products. Our customers love the quality of ingredients we use.'),
              },
              {
                name: t('Emily Rodriguez'),
                restaurant: t('Café Luna'),
                text: t('The membership program is worth every penny. We save time and money while getting better products.'),
              },
            ].map((testimonial, index) => (
              <div key={index} className="card p-8">
                <p className="text-gray-600 mb-6 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-gray-500 text-sm">{testimonial.restaurant}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('Ready to Transform Your Restaurant?')}
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            {t('Join our membership program today and start enjoying premium food supply services.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-secondary text-lg px-8 py-4">
              {t('Start Free Trial')}
            </Link>
            <Link href="/pricing" className="btn-outline text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-primary-600">
              {t('View Pricing')}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 