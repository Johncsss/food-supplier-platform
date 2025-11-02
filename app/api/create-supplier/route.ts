import { NextRequest, NextResponse } from 'next/server';
import admin, { ensureFirebaseAdminInitialized } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    // Ensure Firebase Admin is initialized before using it
    ensureFirebaseAdminInitialized();

    const body = await request.json();
    const { name, companyName, email, password, phone, status, address, category } = body;

    // Validate required fields
    if (!name || !companyName || !email || !password || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate custom supplier ID
    const customSupplierId = `SUPPLIER-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    // Create user in Firebase Auth using Admin SDK
    const userRecord = await admin.auth().createUser({
      email,
      password,
      uid: customSupplierId, // Use custom ID as the UID
    });

    // Create supplier document in Firestore
    const newSupplier = {
      id: customSupplierId,
      firebaseUid: userRecord.uid,
      name,
      companyName,
      email,
      phone,
      status: status || 'active',
      address: address || '',
      category: category || '',
      role: 'supplier',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await admin.firestore().collection('users').doc(customSupplierId).set(newSupplier);

    return NextResponse.json({ 
      success: true, 
      supplier: {
        id: customSupplierId,
        name,
        companyName,
        email,
        phone,
        status: status || 'active',
        address: address || '',
        category: category || '',
      }
    });
  } catch (error: any) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create supplier' },
      { status: 500 }
    );
  }
}
