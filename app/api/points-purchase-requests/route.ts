import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await adminDb.collection('points_purchase_requests').get();

    const requests = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt,
        approvedAt: data.approvedAt?.toMillis ? data.approvedAt.toMillis() : data.approvedAt,
      };
    });

    const pending = requests
      .filter((request: any) => request.status === 'pending')
      .sort((a: any, b: any) => {
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();
        return bDate - aDate;
      });

    const history = requests
      .filter((request: any) => request.status !== 'pending')
      .sort((a: any, b: any) => {
        const aDate = new Date(a.approvedAt || a.createdAt || 0).getTime();
        const bDate = new Date(b.approvedAt || b.createdAt || 0).getTime();
        return bDate - aDate;
      });

    return NextResponse.json({
      success: true,
      pending,
      history,
      meta: {
        pendingCount: pending.length,
        totalCount: requests.length,
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch points purchase requests:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch requests' },
      { status: 500 },
    );
  }
}

