import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

// NOTE: This is a pages-router API route, added to ensure /api/purchase-points
// works reliably in local and mobile environments, even if app-route handlers
// are not picked up.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return handlePost(req, res);
  }

  if (req.method === 'GET') {
    return handleGet(req, res);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, pointsToPurchase, paymentAmount, receiptUrl, planId } = req.body || {};

    console.log('Purchase points request (pages API):', {
      userId,
      pointsToPurchase,
      paymentAmount,
      receiptUrl,
      planId,
    });

    if (!userId || !pointsToPurchase || !paymentAmount || !receiptUrl) {
      return res.status(400).json({
        error: 'Missing required fields: userId, pointsToPurchase, paymentAmount, receiptUrl',
      });
    }

    if (pointsToPurchase <= 0 || paymentAmount <= 0) {
      return res.status(400).json({
        error: 'Points and payment amount must be positive',
      });
    }

    // Verify 1 HKD = 1 point ratio
    if (paymentAmount !== pointsToPurchase) {
      return res.status(400).json({
        error: 'Payment amount must equal points to purchase (1 HKD = 1 point)',
      });
    }

    // Get current user data - try multiple approaches to find the user
    let userRef = adminDb.collection('users').doc(userId);
    let userDoc = await userRef.get();

    console.log('[pages API] Looking for user with ID:', userId);
    console.log('[pages API] Direct lookup result:', userDoc.exists ? 'found' : 'not found');

    // If not found, search by firebaseUid field (for users with custom IDs)
    if (!userDoc.exists) {
      console.log('[pages API] Searching by firebaseUid field...');
      const querySnapshot = await adminDb
        .collection('users')
        .where('firebaseUid', '==', userId)
        .limit(1)
        .get();

      console.log('[pages API] Query result count:', querySnapshot.docs.length);

      if (!querySnapshot.empty) {
        userRef = adminDb.collection('users').doc(querySnapshot.docs[0].id);
        userDoc = querySnapshot.docs[0];
      }
    }

    // Demo mode if user document cannot be found at all
    if (!userDoc.exists) {
      console.log('[pages API] User not found after all attempts - demo mode');

      const demoTransaction = {
        userId,
        pointsPurchased: pointsToPurchase,
        amount: pointsToPurchase,
        paymentAmount,
        receiptUrl,
        planId: planId || null,
        previousBalance: 0,
        newBalance: pointsToPurchase,
        transactionDate: new Date(),
        purchaseDate: new Date(),
        status: 'completed',
        type: 'purchase',
        description: `購買 ${pointsToPurchase} 點數`,
        demo: true,
      };

      return res.status(200).json({
        success: true,
        message: `Demo: Successfully purchased ${pointsToPurchase} points`,
        newBalance: pointsToPurchase,
        transaction: demoTransaction,
        demo: true,
      });
    }

    const userData = userDoc.data() || {};
    const currentPending = (userData as any).pendingPoints || 0;

    const requestsRef = adminDb.collection('points_purchase_requests');
    const newRequest = {
      userId,
      pointsRequested: pointsToPurchase,
      paymentAmount,
      receiptUrl,
      planId: planId || null,
      status: 'pending',
      createdAt: new Date(),
      approvedAt: null,
      approvedBy: null,
      userEmail: (userData as any).email || '',
      restaurantName: (userData as any).restaurantName || '',
    };

    await requestsRef.add(newRequest);

    await userRef.update({
      pendingPoints: currentPending + pointsToPurchase,
      updatedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Purchase request submitted for ${pointsToPurchase} points`,
      pending: true,
    });
  } catch (error: any) {
    console.error('[pages API] Error purchasing points:', error);
    return res.status(500).json({
      error: 'Failed to purchase points',
      details: error?.message || 'Unknown error',
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userId = (req.query.userId as string) || '';

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    // Get user's current points balance - try multiple approaches to find the user
    let userRef = adminDb.collection('users').doc(userId);
    let userDoc = await userRef.get();

    if (!userDoc.exists) {
      const querySnapshot = await adminDb
        .collection('users')
        .where('firebaseUid', '==', userId)
        .limit(1)
        .get();

      if (!querySnapshot.empty) {
        userDoc = querySnapshot.docs[0];
      }
    }

    if (!userDoc.exists) {
      // Graceful demo/fallback behavior for missing users:
      // return zero balances instead of a hard 404 so mobile apps
      // can still show a valid points state.
      console.log('[pages API] handleGet: user not found, returning demo zero balance');

      return res.status(200).json({
        userId,
        memberPoints: 0,
        pendingPoints: 0,
        lastUpdated: null,
        demo: true,
      });
    }

    const userData = userDoc.data() || {};

    return res.status(200).json({
      userId,
      memberPoints: (userData as any).memberPoints || 0,
      pendingPoints: (userData as any).pendingPoints || 0,
      lastUpdated: (userData as any).updatedAt || null,
    });
  } catch (error: any) {
    console.error('[pages API] Error fetching points balance:', error);
    return res.status(500).json({
      error: 'Failed to fetch points balance',
      details: error?.message || 'Unknown error',
    });
  }
}


