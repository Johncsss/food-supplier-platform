import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { SERVICE_PAGE_DEFAULTS } from '@/lib/servicePageDefaults';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } },
) {
  // Handle both Next.js 14 (synchronous params) and Next.js 15+ (async params)
  const resolvedParams = await Promise.resolve(params);
  const { slug } = resolvedParams;
  try {
    const defaults = SERVICE_PAGE_DEFAULTS[slug] || {};
    const ref = adminDb.doc(`pages/${slug}`);
    const snap = await ref.get();
    
    if (!snap.exists) {
      // Return defaults if no CMS data exists
      return NextResponse.json({
        success: true,
        page: {
          title: slug,
          slug: slug,
          content: '',
          areas: defaults,
          updatedAt: null,
        },
      });
    }
    
    const data = snap.data() as any;
    const cmsAreas = data?.areas || {};
    
    // Validation: Check for wrong data (e.g., furniture data in kitchen-equipment)
    if (slug === 'kitchen-equipment' && cmsAreas.categories?.title === '傢具類別') {
      // CMS has wrong data, use defaults only
      console.warn(`WARNING: CMS data for ${slug} contains wrong category title. Using defaults only.`);
      return NextResponse.json({
        success: true,
        page: {
          title: data?.title || slug,
          slug: data?.slug || slug,
          content: data?.content || '',
          areas: defaults,
          updatedAt: data?.updatedAt?.toMillis ? data.updatedAt.toMillis() : data?.updatedAt || null,
        },
      });
    }
    
    // Merge defaults with CMS data (shallow merge like website pages do)
    const mergedAreas = { ...defaults, ...cmsAreas };
    
    // Final validation after merge
    if (slug === 'kitchen-equipment' && mergedAreas.categories?.title === '傢具類別') {
      console.warn(`WARNING: After merge, ${slug} still has wrong category title. Using defaults only.`);
      return NextResponse.json({
        success: true,
        page: {
          title: data?.title || slug,
          slug: data?.slug || slug,
          content: data?.content || '',
          areas: defaults,
          updatedAt: data?.updatedAt?.toMillis ? data.updatedAt.toMillis() : data?.updatedAt || null,
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      page: {
        title: data?.title || slug,
        slug: data?.slug || slug,
        content: data?.content || '',
        areas: mergedAreas,
        updatedAt: data?.updatedAt?.toMillis ? data.updatedAt.toMillis() : data?.updatedAt || null,
      },
    });
  } catch (error: any) {
    console.error(`Failed to fetch page ${slug}:`, error);
    // Return defaults on error to ensure content always displays
    const defaults = SERVICE_PAGE_DEFAULTS[slug] || {};
    return NextResponse.json({
      success: true,
      page: {
        title: slug,
        slug: slug,
        content: '',
        areas: defaults,
        updatedAt: null,
      },
    });
  }
}


