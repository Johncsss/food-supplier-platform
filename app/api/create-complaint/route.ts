import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { orderId, message, userId, userEmail, restaurantName, supplierId, supplierCompanyName } = await request.json();

    // Validate required fields
    if (!orderId || !message || !userId || !supplierId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the order exists
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Create complaint document
    const complaintData = {
      orderId,
      userId,
      userEmail: userEmail || '',
      restaurantName: restaurantName || '',
      supplierId,
      supplierCompanyName: supplierCompanyName || '',
      message,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const complaintRef = await addDoc(collection(db, 'complaints'), complaintData);

    return NextResponse.json({
      success: true,
      complaintId: complaintRef.id,
      message: 'Complaint submitted successfully'
    });

  } catch (error) {
    console.error('Error creating complaint:', error);
    return NextResponse.json(
      { error: 'Failed to create complaint', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
