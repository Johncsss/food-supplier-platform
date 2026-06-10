import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import UnauthorizedHandler from '@/components/UnauthorizedHandler';
import CategoriesSection from '@/components/ui/CategoriesSection';
import EditableHeroBanner from '@/components/ui/EditableHeroBanner';
import EditableHeroSection from '@/components/ui/EditableHeroSection';
import EditableFeaturesSection from '@/components/ui/EditableFeaturesSection';
import EditableTestimonialsSection from '@/components/ui/EditableTestimonialsSection';
import EditableCTASection from '@/components/ui/EditableCTASection';
import { t } from '@/lib/translate';
import { categories as defaultCategories } from '@/shared/products';
import { Category } from '@/shared/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { adminDb } from '@/lib/firebaseAdmin';

async function getHomepageCmsData() {
  try {
    // Use Admin SDK on the server so reads work for anonymous visitors
    const snap = await adminDb.doc('pages/homepage').get();
    if (snap.exists) {
      const data = snap.data() as any;
      return data?.areas || null;
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
  let heroDescription = heroData.description || t('Get fresh ingredients, quality meats, and everything you need to run your restaurant efficiently with our yearly membership program.');
  // Temporary migration: normalize older wordings to the latest copy
  if (heroDescription === '透過我們的年度會員計劃，獲得新鮮食材、優質肉類以及經營餐廳所需的一切。' ||
      heroDescription === '透過我們的優質服務，獲得新鮮食材、優質肉類以及經營餐廳所需的一切。') {
    heroDescription = '透過iFoodPulse，獲得新鮮食材、優質肉類以及經營餐廳所需的一切。';
  }
  const button1Text = heroData.button1Text || t('Start Your Membership');
  const button1Link = heroData.button1Link || '/partners/apply';
  const button2Text = heroData.button2Text || t('Browse Products');
  const button2Link = heroData.button2Link || '/products';
  
  return (
    <div className="min-h-screen bg-gray-50">
      <UnauthorizedHandler />
      <Header />
      
      {/* Hero Banner Image Section */}
      <EditableHeroBanner initialBannerUrl={bannerImageUrl} />

      {/* Hero Section */}
      <EditableHeroSection 
        initialData={{
          title: heroTitle,
          titleSpan: heroTitleSpan,
          description: heroDescription,
          button1Text,
          button1Link,
          bannerImageUrl,
        }}
      />

      {/* Features Section */}
      <EditableFeaturesSection 
        initialData={cmsData?.features ? {
          title: cmsData.features.title,
          description: cmsData.features.description,
          blocks: cmsData.features.block1 ? [
            cmsData.features.block1,
            cmsData.features.block2,
            cmsData.features.block3,
            cmsData.features.block4,
            cmsData.features.block5,
            cmsData.features.block6,
          ].filter(Boolean) : undefined,
        } : undefined}
      />

      {/* Categories Section - Only visible to logged-in users */}
      <CategoriesSection categories={categoriesWithCounts} />

      {/* Testimonials Section */}
      <EditableTestimonialsSection 
        initialData={cmsData?.testimonials ? {
          title: cmsData.testimonials.title,
          description: cmsData.testimonials.description,
          items: cmsData.testimonials.item1 ? [
            cmsData.testimonials.item1,
            cmsData.testimonials.item2,
            cmsData.testimonials.item3,
          ].filter(Boolean) : undefined,
        } : undefined}
      />

      {/* CTA Section */}
      <EditableCTASection 
        initialData={cmsData?.cta ? {
          title: cmsData.cta.title,
          description: cmsData.cta.description,
        } : undefined}
      />

      <Footer />
    </div>
  );
} 