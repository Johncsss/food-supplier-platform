import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminFieldValue } from '@/lib/firebaseAdmin';

// Ensure Node.js runtime for Firebase Admin
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const {
      orderId,
      message,
      userId,
      userEmail,
      restaurantName,
      supplierId: supplierIdInput,
      supplierCompanyName: supplierCompanyNameInput,
    } = await request.json();

    // Validate required fields
    if (!orderId || !message || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Try to fetch the order, but don't fail the request if not found
    let orderData: any = {};
    try {
      const orderRef = adminDb.collection('orders').doc(String(orderId));
      const orderSnap = await orderRef.get();
      if (orderSnap.exists) {
        orderData = orderSnap.data() || {};
      }
    } catch (e) {
      // Non-fatal: allow complaint creation to proceed even if order lookup fails
      orderData = {};
    }

    const derivedSupplierId =
      supplierIdInput ||
      orderData.supplierId ||
      orderData.supplier ||
      orderData.supplierUid ||
      orderData.items?.find((item: any) => item?.supplierId)?.supplierId ||
      orderData.items?.find((item: any) => item?.supplier)?.supplier ||
      '';

    if (!derivedSupplierId) {
      return NextResponse.json(
        { error: 'Unable to determine supplier information for this order' },
        { status: 400 }
      );
    }

    const derivedSupplierCompanyName =
      supplierCompanyNameInput ||
      orderData.supplierCompanyName ||
      orderData.supplierName ||
      orderData.supplier ||
      orderData.items?.find((item: any) => item?.supplierCompanyName)?.supplierCompanyName ||
      derivedSupplierId;

    // Create complaint document
    const complaintData = {
      orderId,
      userId,
      userEmail: userEmail || '',
      restaurantName: restaurantName || '',
      supplierId: derivedSupplierId,
      supplierCompanyName: derivedSupplierCompanyName || '',
      message,
      status: 'pending',
      createdAt: adminFieldValue.serverTimestamp(),
      updatedAt: adminFieldValue.serverTimestamp()
    };

    const complaintRef = await adminDb.collection('complaints').add(complaintData);

    return NextResponse.json({
      success: true,
      complaintId: complaintRef.id,
      message: 'Message submitted successfully'
    });

  } catch (error) {
    console.error('Error creating complaint:', error);
    return NextResponse.json(
      { error: 'Failed to create complaint', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
