import { NextRequest, NextResponse } from 'next/server';
import admin, { ensureFirebaseAdminInitialized } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    // Ensure Firebase Admin is initialized
    ensureFirebaseAdminInitialized();

    const body = await request.json();
    const { supplierId, name, companyName, email, phone, status, address, category, logo } = body;

    // Validate required fields
    if (!supplierId || !name || !companyName || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields (supplierId, name, companyName, email, phone)' },
        { status: 400 }
      );
    }

    const db = admin.firestore();

    // Get the supplier document
    const supplierRef = db.collection('users').doc(supplierId);
    const supplierDoc = await supplierRef.get();
    
    if (!supplierDoc.exists) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    const supplierData = supplierDoc.data();
    
    // Verify this is a supplier
    if (supplierData?.role !== 'supplier') {
      return NextResponse.json(
        { error: 'User is not a supplier' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      name,
      companyName,
      email,
      phone,
      status: status || 'active',
      address: address || '',
      category: category || '',
      logo: logo || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Update supplier document in Firestore
    await supplierRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Supplier updated successfully',
      supplier: {
        id: supplierId,
        ...updateData,
      }
    });
  } catch (error: any) {
    console.error('Error updating supplier:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update supplier' },
      { status: 500 }
    );
  }
}

