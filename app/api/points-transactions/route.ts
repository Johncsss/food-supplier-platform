import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limitParam = parseInt(searchParams.get('limit') || '20');

    console.log('Fetching transactions for userId:', userId);

    if (!userId) {
      console.log('No userId provided');
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Check if Firebase Admin is properly initialized
    if (!adminDb) {
      console.log('Firebase Admin not initialized');
      return NextResponse.json({
        success: true,
        transactions: [],
        count: 0,
        demo: true,
        error: 'Firebase Admin not initialized'
      });
    }

    console.log('Firebase Admin initialized, querying transactions...');
    
    // Query point transactions for the user using Admin SDK
    // First get all transactions for the user, then sort in memory to avoid index requirement
    const transactionsRef = adminDb.collection('point_transactions');
    const querySnapshot = await transactionsRef
      .where('userId', '==', userId)
      .limit(limitParam * 2) // Get more than needed to account for sorting
      .get();

    console.log('Query completed, snapshot size:', querySnapshot.docs.length);
    
    const transactions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort transactions by transactionDate in descending order (newest first)
    transactions.sort((a, b) => {
      const dateA = a.transactionDate?.toDate?.() || new Date(a.transactionDate) || new Date(a.purchaseDate) || new Date(0);
      const dateB = b.transactionDate?.toDate?.() || new Date(b.transactionDate) || new Date(b.purchaseDate) || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    // Limit the results
    const limitedTransactions = transactions.slice(0, limitParam);

    console.log('Returning', limitedTransactions.length, 'transactions');

    return NextResponse.json({
      success: true,
      transactions: limitedTransactions,
      count: limitedTransactions.length
    });

  } catch (error: any) {
    console.error('Error fetching points transactions:', error);
    
    // Always return success with empty transactions to prevent UI breaking
    return NextResponse.json({
      success: true,
      transactions: [],
      count: 0,
      demo: true,
      error: error.message
    });
  }
}