import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// Force dynamic rendering since we use request.url
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');

    if (!supplierId) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching complaints for supplier ID:', supplierId);

    // Query complaints for this supplier using Admin SDK
    const complaintsSnapshot = await adminDb
      .collection('complaints')
      .where('supplierId', '==', supplierId)
      .get();

    const complaints = complaintsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date()
      };
    });

    // Sort by newest first
    complaints.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    console.log(`Found ${complaints.length} complaints for supplier`);

    return NextResponse.json({
      success: true,
      complaints
    });

  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json(
      { error: 'Failed to fetch complaints', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
