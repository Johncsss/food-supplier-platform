import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { adminDb, adminFieldValue } from '@/lib/firebaseAdmin';
import { addPointsToUser } from '@/lib/points-utils';

// Force dynamic rendering since we use request.url
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId, pointsToPurchase, paymentAmount } = await request.json();

    console.log('Purchase points request:', { userId, pointsToPurchase, paymentAmount });

    if (!userId || !pointsToPurchase || !paymentAmount) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, pointsToPurchase, paymentAmount' },
        { status: 400 }
      );
    }

    if (pointsToPurchase <= 0 || paymentAmount <= 0) {
      return NextResponse.json(
        { error: 'Points and payment amount must be positive' },
        { status: 400 }
      );
    }

    // Verify 1 HKD = 1 point ratio
    if (paymentAmount !== pointsToPurchase) {
      return NextResponse.json(
        { error: 'Payment amount must equal points to purchase (1 HKD = 1 point)' },
        { status: 400 }
      );
    }

    // Get current user data - try multiple approaches to find the user
    let userRef;
    let userDoc;
    
    console.log('Looking for user with ID:', userId);
    
    // First, try to get user by Firebase UID as document ID
    userRef = doc(db, 'users', userId);
    userDoc = await getDoc(userRef);
    
    console.log('Direct lookup result:', userDoc.exists() ? 'found' : 'not found');
    
    // If not found, search by firebaseUid field (for users with custom IDs)
    if (!userDoc.exists()) {
      console.log('Searching by firebaseUid field...');
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('firebaseUid', '==', userId));
      const querySnapshot = await getDocs(q);
      
      console.log('Query result count:', querySnapshot.docs.length);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        console.log('Found user with custom ID:', querySnapshot.docs[0].id);
        userRef = doc(db, 'users', querySnapshot.docs[0].id);
        userDoc = querySnapshot.docs[0];
      }
    }

    if (!userDoc.exists()) {
      console.log('User not found after all attempts');
      console.log('In demo mode - proceeding with points purchase anyway');
      
      // For demo mode, we'll just return success without actually updating Firestore
      // since we can't create the user document due to security rules
      const demoTransaction = {
        userId,
        pointsPurchased: pointsToPurchase,
        amount: pointsToPurchase, // Add amount field for consistency
        paymentAmount,
        previousBalance: 0,
        newBalance: pointsToPurchase,
        transactionDate: new Date(),
        purchaseDate: new Date(), // Keep for backward compatibility
        status: 'completed',
        type: 'purchase',
        description: `購買 ${pointsToPurchase} 點數`,
        demo: true
      };
      
      return NextResponse.json({
        success: true,
        message: `Demo: Successfully purchased ${pointsToPurchase} points`,
        newBalance: pointsToPurchase,
        transaction: demoTransaction,
        demo: true
      });
    }

    const userData = userDoc.data();
    const currentPoints = userData.memberPoints || 0;

    // Use the shared function to add points
    await addPointsToUser(userId, pointsToPurchase, `manual_${Date.now()}`);

    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${pointsToPurchase} points`,
      newBalance: currentPoints + pointsToPurchase
    });

  } catch (error: any) {
    console.error('Error purchasing points:', error);
    return NextResponse.json(
      { error: 'Failed to purchase points', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Get user's current points balance - try multiple approaches to find the user
    let userRef;
    let userDoc;
    
    // First, try to get user by Firebase UID as document ID
    userRef = doc(db, 'users', userId);
    userDoc = await getDoc(userRef);
    
    // If not found, search by firebaseUid field (for users with custom IDs)
    if (!userDoc.exists()) {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('firebaseUid', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        userDoc = querySnapshot.docs[0];
      }
    }

    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    return NextResponse.json({
      userId,
      memberPoints: userData.memberPoints || 0,
      lastUpdated: userData.updatedAt
    });

  } catch (error: any) {
    console.error('Error fetching points balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch points balance', details: error.message },
      { status: 500 }
    );
  }
}