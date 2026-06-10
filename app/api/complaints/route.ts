import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminFieldValue } from '@/lib/firebaseAdmin';

// Force dynamic rendering since we use request.url
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    // Enrich complaints with restaurant phone from users collection
    const enriched = await Promise.all(
      complaints.map(async (c: any) => {
        let phone: string | undefined;
        try {
          if (c.userId) {
            const userDoc = await adminDb.collection('users').doc(String(c.userId)).get();
            if (userDoc.exists) {
              phone = (userDoc.data() as any)?.phone || undefined;
            }
          }
          if (!phone && c.userEmail) {
            const snapshot = await adminDb
              .collection('users')
              .where('email', '==', c.userEmail)
              .limit(1)
              .get();
            if (!snapshot.empty) {
              phone = (snapshot.docs[0].data() as any)?.phone || undefined;
            }
          }
        } catch (e) {
          // Non-fatal; just return without phone
        }
        return { ...c, restaurantPhone: phone || '' };
      })
    );

    return NextResponse.json({
      success: true,
      complaints: enriched
    });

  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json(
      { error: 'Failed to fetch complaints', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { complaintId, status } = await request.json();

    if (!complaintId || !status) {
      return NextResponse.json(
        { error: 'complaintId and status are required' },
        { status: 400 }
      );
    }

    const allowedStatuses = ['pending', 'processed'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Ensure complaint exists
    const ref = adminDb.collection('complaints').doc(String(complaintId));
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      );
    }

    await ref.update({
      status,
      updatedAt: adminFieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating complaint status:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}
