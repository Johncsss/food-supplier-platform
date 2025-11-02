import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { supplierId } = body;

    if (!supplierId) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      );
    }

    const db = admin.firestore();

    // Get the supplier user document
    const supplierDoc = await db.collection('users').doc(supplierId).get();
    
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

    // Get Firebase Auth UID (prefer firebaseUid field, fallback to supplierId)
    const firebaseUid = supplierData?.firebaseUid || supplierId;

    // Find all products from this supplier
    const productsQuery = await db.collection('products')
      .where('supplier', '==', supplierId)
      .get();

    const productCount = productsQuery.docs.length;

    // Delete all products from this supplier using batch
    if (productsQuery.docs.length > 0) {
      const batch = db.batch();
      productsQuery.docs.forEach((productDoc) => {
        batch.delete(productDoc.ref);
      });
      await batch.commit();
    }

    // Delete Firebase Auth user
    try {
      await admin.auth().deleteUser(firebaseUid);
    } catch (authError: any) {
      // If user not found in auth, that's okay - continue
      // This might happen if the user was already deleted or never created in Auth
      if (authError.code !== 'auth/user-not-found') {
        console.error('Error deleting Firebase Auth user:', authError);
        // Continue with Firestore deletion even if Auth deletion fails
      }
    }

    // Delete supplier user document from Firestore
    await db.collection('users').doc(supplierId).delete();

    return NextResponse.json({
      success: true,
      message: 'Supplier and associated products deleted successfully',
      deletedProducts: productCount
    });
  } catch (error: any) {
    console.error('Error deleting supplier:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete supplier' },
      { status: 500 }
    );
  }
}

