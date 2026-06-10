import { NextRequest, NextResponse } from 'next/server';
import admin, { adminDb, ensureFirebaseAdminInitialized } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    ensureFirebaseAdminInitialized();

    const body = await request.json();
    const { email, password, name, permissions } = body;

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and name are required' },
        { status: 400 },
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 },
      );
    }

    // Create Firebase Auth user using Admin SDK
    let userRecord;
    try {
      userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: name,
      });
    } catch (authError: any) {
      if (authError.code === 'auth/email-already-exists') {
        return NextResponse.json(
          { success: false, error: '此電子郵件已被使用' },
          { status: 400 },
        );
      }
      throw authError;
    }

    const firebaseUid = userRecord.uid;

    // Set custom admin claim
    await admin.auth().setCustomUserClaims(firebaseUid, { admin: true });

    // Create user document in Firestore
    const adminUser = {
      id: firebaseUid,
      firebaseUid,
      email: email,
      name: name,
      restaurantName: 'Admin',
      role: 'admin',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
      },
      membershipStatus: 'active',
      membershipExpiry: null,
      permissions: permissions || {
        dashboard: true,
        orders: false,
        products: false,
        members: false,
        suppliers: false,
        salesTeam: false,
        pointsApprovals: false,
        inventory: false,
        settings: false,
        content: false,
        system: false,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await adminDb.collection('users').doc(firebaseUid).set(adminUser);

    return NextResponse.json({
      success: true,
      admin: {
        id: firebaseUid,
        name: name,
        email: email,
        firebaseUid,
      },
    });
  } catch (error: any) {
    console.error('[POST /api/admin/create-admin-user] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create admin user' },
      { status: 500 },
    );
  }
}

