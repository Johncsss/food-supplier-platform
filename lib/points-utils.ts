import { adminDb, adminFieldValue } from '@/lib/firebaseAdmin';

/**
 * Adds points to a user account (used by webhooks)
 * @param userId - The user ID
 * @param pointsAmount - The amount of points to add
 * @param transactionId - The transaction/payment ID for tracking
 */
export async function addPointsToUser(userId: string, pointsAmount: number, transactionId: string) {
  // Find user document using Admin SDK
  let userDocId = userId;
  let userDoc;
  
  // First, try to get user by Firebase UID as document ID
  userDoc = await adminDb.collection('users').doc(userId).get();
  
  // If not found, search by firebaseUid field (for users with custom IDs)
  if (!userDoc.exists) {
    const usersSnapshot = await adminDb.collection('users')
      .where('firebaseUid', '==', userId)
      .limit(1)
      .get();
    
    if (!usersSnapshot.empty) {
      userDoc = usersSnapshot.docs[0];
      userDocId = usersSnapshot.docs[0].id;
    }
  }

  if (!userDoc.exists) {
    throw new Error(`User ${userId} not found`);
  }

  // Use Admin SDK to perform atomic update
  await adminDb.runTransaction(async (t) => {
    const uRef = adminDb.collection('users').doc(userDocId);
    const uSnap = await t.get(uRef);
    const currentPoints = (uSnap.data()?.memberPoints || 0) as number;
    const newBalance = currentPoints + pointsAmount;

    t.update(uRef, {
      memberPoints: adminFieldValue.increment(pointsAmount),
      updatedAt: new Date(),
    });

    const txRef = adminDb.collection('point_transactions').doc(`${userId}_${Date.now()}`);
    t.set(txRef, {
      userId,
      pointsPurchased: pointsAmount,
      amount: pointsAmount,
      paymentAmount: pointsAmount,
      previousBalance: currentPoints,
      newBalance,
      transactionDate: new Date(),
      purchaseDate: new Date(),
      status: 'completed',
      type: 'purchase',
      description: `購買 ${pointsAmount} 點數`,
      transactionId,
    });
  });
}

