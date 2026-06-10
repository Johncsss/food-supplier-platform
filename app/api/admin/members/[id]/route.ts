import { NextRequest, NextResponse } from 'next/server';
import admin, { adminDb } from '@/lib/firebaseAdmin';
import type { firestore } from 'firebase-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const memberId = params.id;

  try {
    const body = await request.json();

    // Find the user document by id or firebaseUid
    let userRef = adminDb.collection('users').doc(memberId);
    let userSnap = await userRef.get();

    if (!userSnap.exists) {
      const altSnapshot = await adminDb
        .collection('users')
        .where('id', '==', memberId)
        .limit(1)
        .get();

      if (!altSnapshot.empty) {
        userSnap = altSnapshot.docs[0];
        userRef = altSnapshot.docs[0].ref;
      }
    }

    if (!userSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 },
      );
    }

    const updateData: Record<string, unknown> = {};

    // Update basic fields
    if (body.name) updateData.name = body.name;
    if (body.restaurantName) updateData.restaurantName = body.restaurantName;
    if (body.email) updateData.email = body.email;
    if (body.phone) updateData.phone = body.phone;
    if (body.address) updateData.address = body.address;
    if (body.membershipStatus) updateData.membershipStatus = body.membershipStatus;
    if (body.staffName !== undefined) updateData.staffName = body.staffName;
    if (body.businessRegistrationFileUrl !== undefined) updateData.businessRegistrationFileUrl = body.businessRegistrationFileUrl;

    // Update nested objects
    if (body.companyInfo) updateData.companyInfo = body.companyInfo;
    if (body.shopInfo) updateData.shopInfo = body.shopInfo;
    if (body.contactInfo) updateData.contactInfo = body.contactInfo;
    if (body.accountingContact) updateData.accountingContact = body.accountingContact;
    if (body.businessInfo) updateData.businessInfo = body.businessInfo;

    // Update password if provided
    if (body.password) {
      const userData = userSnap.data() || {};
      const firebaseUid = userData.firebaseUid || userData.firebaseUserId || memberId;
      
      try {
        await admin.auth().updateUser(firebaseUid, {
          password: body.password,
        });
      } catch (authError: any) {
        console.error('Error updating password:', authError);
        return NextResponse.json(
          { success: false, error: 'Failed to update password: ' + authError.message },
          { status: 500 },
        );
      }
    }

    if (!Object.keys(updateData).length && !body.password) {
      return NextResponse.json(
        { success: false, error: 'No valid fields provided' },
        { status: 400 },
      );
    }

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await userRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PATCH /api/admin/members/[id]] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update member' },
      { status: 500 },
    );
  }
}

const deleteQueryBatch = async (
  query: firestore.Query<firestore.DocumentData>,
  batchSize = 500,
) => {
  const snapshot = await query.limit(batchSize).get();
  if (snapshot.empty) {
    return;
  }

  const batch = adminDb.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  if (snapshot.size >= batchSize) {
    await deleteQueryBatch(query, batchSize);
  }
};

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const memberId = params.id;

  if (!memberId) {
    return NextResponse.json(
      { success: false, error: 'Member ID is required' },
      { status: 400 },
    );
  }

  try {
    let userRef = adminDb.collection('users').doc(memberId);
    let userSnap = await userRef.get();

    if (!userSnap.exists) {
      const altSnapshot = await adminDb
        .collection('users')
        .where('id', '==', memberId)
        .limit(1)
        .get();

      if (!altSnapshot.empty) {
        userSnap = altSnapshot.docs[0];
        userRef = altSnapshot.docs[0].ref;
      }
    }

    if (!userSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 },
      );
    }

    const userData = userSnap.data() || {};
    const firestoreUserId = userSnap.id;
    const firebaseUid =
      userData.firebaseUid || userData.firebaseUserId || firestoreUserId;

    const identifiers = Array.from(
      new Set(
        [firestoreUserId, firebaseUid].filter(
          (value): value is string =>
            typeof value === 'string' && value.trim().length > 0,
        ),
      ),
    );

    await deleteQueryBatch(userRef.collection('favorites'));

    for (const identifier of identifiers) {
      await deleteQueryBatch(
        adminDb.collection('points_purchase_requests').where('userId', '==', identifier),
      );
      await deleteQueryBatch(
        adminDb.collection('point_transactions').where('userId', '==', identifier),
      );
    }

    try {
      if (firebaseUid) {
        await admin.auth().deleteUser(firebaseUid);
      }
    } catch (authError: any) {
      if (authError?.code !== 'auth/user-not-found') {
        console.error(
          '[DELETE /api/admin/members/[id]] Failed to delete Firebase Auth user:',
          authError,
        );
      }
    }

    await userRef.delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE /api/admin/members/[id]] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete member' },
      { status: 500 },
    );
  }
}

