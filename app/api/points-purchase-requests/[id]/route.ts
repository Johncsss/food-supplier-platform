import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { addPointsToUser } from '@/lib/points-utils';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = params.id;

  try {
    const body = await request.json();
    const action = body?.action;
    const adminEmail = body?.adminEmail || null;
    const adminNote = body?.note || '';

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 },
      );
    }

    const requestRef = adminDb.collection('points_purchase_requests').doc(requestId);
    const requestSnap = await requestRef.get();
    if (!requestSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 },
      );
    }

    const requestData: any = requestSnap.data();
    if (requestData.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Request already processed' },
        { status: 400 },
      );
    }

    let userRef = adminDb.collection('users').doc(requestData.userId);
    let userSnap = await userRef.get();

    if (!userSnap.exists) {
      const altSnapshot = await adminDb
        .collection('users')
        .where('firebaseUid', '==', requestData.userId)
        .limit(1)
        .get();
      if (!altSnapshot.empty) {
        userSnap = altSnapshot.docs[0];
        userRef = altSnapshot.docs[0].ref;
      }
    }
    if (!userSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 },
      );
    }

    const userData: any = userSnap.data();
    const pendingPoints = userData.pendingPoints || 0;
    const requestedPoints = requestData.pointsRequested || 0;

    if (action === 'approve') {
      await addPointsToUser(requestData.userId, requestedPoints, `approval_${Date.now()}`, {
        receiptUrl: requestData.receiptUrl,
        planId: requestData.planId,
      });

      await userRef.update({
        pendingPoints: Math.max(0, pendingPoints - requestedPoints),
        updatedAt: new Date(),
      });

      await requestRef.update({
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: adminEmail,
        adminNote,
      });

      return NextResponse.json({ success: true, status: 'approved' });
    }

    // Reject
    await userRef.update({
      pendingPoints: Math.max(0, pendingPoints - requestedPoints),
      updatedAt: new Date(),
    });

    await requestRef.update({
      status: 'rejected',
      approvedAt: new Date(),
      approvedBy: adminEmail,
      adminNote,
    });

    return NextResponse.json({ success: true, status: 'rejected' });
  } catch (error: any) {
    console.error('Failed to update purchase request:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update request' },
      { status: 500 },
    );
  }
}

