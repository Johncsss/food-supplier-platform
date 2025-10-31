import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true';
    const userId = searchParams.get('userId');

    console.log('Count endpoint called with:', { isAdmin, userId });

    if (!isAdmin && !userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    const ordersRef = collection(db, 'orders');
    let q;

    if (isAdmin) {
      // For admin, get all orders
      q = query(ordersRef);
    } else {
      // For user, get their orders only
      q = query(ordersRef, where('userId', '==', userId));
    }

    console.log('Executing Firestore query...');
    const querySnapshot = await getDocs(q);
    console.log('Query completed, documents found:', querySnapshot.size);
    
    // Count orders by status
    const counts = {
      total: 0,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      counts.total++;
      const status = data.status || 'pending';
      if (counts.hasOwnProperty(status)) {
        counts[status as keyof typeof counts]++;
      }
    });

    console.log('Counts calculated:', counts);

    return NextResponse.json({
      success: true,
      counts
    });

  } catch (error) {
    console.error('Error fetching order counts:', error);
    return NextResponse.json({ 
      success: false, 
      error: `Failed to fetch order counts: ${error}` 
    }, { status: 500 });
  }
} 