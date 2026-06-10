import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { sanitizeSocialLinks } from '@/lib/social-links';

export async function GET() {
  try {
    const snapshot = await adminDb.doc('admin/socialLinks').get();
    if (!snapshot.exists) {
      return NextResponse.json({ links: [] });
    }

    const data = snapshot.data() as any;
    const links = sanitizeSocialLinks(data?.links);

    return NextResponse.json({ links });
  } catch (error) {
    console.error('Error fetching social links:', error);
    return NextResponse.json({ error: 'Failed to fetch social links' }, { status: 500 });
  }
}


