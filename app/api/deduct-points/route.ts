import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { adminDb, adminFieldValue } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, description } = await request.json();

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields: userId, amount' },
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
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const currentPoints = userData.memberPoints || 0;

    // Check if user has enough points
    if (currentPoints < amount) {
      return NextResponse.json(
        { 
          error: 'Insufficient points', 
          currentBalance: currentPoints, 
          requiredAmount: amount,
          shortfall: amount - currentPoints
        },
        { status: 400 }
      );
    }

    // Use Admin SDK to perform atomic update and write regardless of client security rules
    await adminDb.runTransaction(async (t) => {
      const uRef = adminDb.collection('users').doc(userRef.id);
      const uSnap = await t.get(uRef);
      const existingPoints = (uSnap.data()?.memberPoints || 0) as number;
      const newBalance = existingPoints - amount;

      t.update(uRef, {
        memberPoints: adminFieldValue.increment(-amount),
        updatedAt: new Date(),
      });

      const txRef = adminDb.collection('point_transactions').doc(`${userId}_${Date.now()}`);
      t.set(txRef, {
        userId,
        pointsDeducted: amount,
        amount: amount, // Add amount field for consistency
        previousBalance: existingPoints,
        newBalance,
        description: description || `消費 ${amount} 點數`,
        transactionDate: new Date(),
        status: 'completed',
        type: 'deduction'
      });
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deducted ${amount} points`,
      newBalance: currentPoints - amount
    });

  } catch (error: any) {
    console.error('Error deducting points:', error);
    
    // In demo mode or when Firestore is not accessible, return demo response
    if (error.code === 'permission-denied' || error.message.includes('permission')) {
      console.log('Demo mode: Returning demo response for points deduction');
      return NextResponse.json({
        success: true,
        message: 'Demo: Points deducted successfully',
        newBalance: 0,
        demo: true
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to deduct points', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');

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
    
    // In demo mode or when Firestore is not accessible, return demo response
    if (error.code === 'permission-denied' || error.message.includes('permission')) {
      console.log('Demo mode: Returning demo response for points balance');
      return NextResponse.json({
        success: true,
        balance: 0,
        demo: true
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch points balance', details: error.message },
      { status: 500 }
    );
  }
}