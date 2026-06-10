import { NextRequest, NextResponse } from 'next/server';
import admin, { adminDb, ensureFirebaseAdminInitialized } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    ensureFirebaseAdminInitialized();

    const body = await request.json();
    const {
      companyNameEn,
      companyNameZh,
      companyAddressEn,
      companyAddressZh,
      shopNameEn,
      shopNameZh,
      shopAddressEn,
      shopAddressZh,
      contactName,
      contactTitle,
      contactPhone,
      contactFax,
      contactEmail,
      accountingName,
      accountingTitle,
      accountingPhone,
      accountingFax,
      accountingEmail,
      businessRegNumber,
      businessNature,
      propertyStatus,
      password,
      membershipStatus,
      staffName,
      businessRegistrationFileUrl,
    } = body;

    // Validate required fields
    const requiredFields = [
      'companyNameEn',
      'companyAddressEn',
      'shopNameEn',
      'shopAddressEn',
      'contactName',
      'contactTitle',
      'contactPhone',
      'contactEmail',
      'businessRegNumber',
      'businessNature',
      'propertyStatus',
      'password',
      'staffName',
    ];

    const missingFields = requiredFields.filter((field) => !body[field] || !body[field].trim());
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
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
    if (!emailRegex.test(contactEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 },
      );
    }

    // Generate custom user ID
    const customUserId = `USER-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    // Create Firebase Auth user using Admin SDK
    let userRecord;
    try {
      userRecord = await admin.auth().createUser({
        email: contactEmail,
        password: password,
        displayName: contactName,
        uid: customUserId, // Use custom ID as the UID
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

    // Create user document in Firestore
    const newMember = {
      id: customUserId,
      firebaseUid,
      name: contactName,
      restaurantName: shopNameEn || shopNameZh,
      email: contactEmail,
      phone: contactPhone,
      membershipStatus: membershipStatus || 'active',
      address: shopAddressEn || shopAddressZh,
      companyInfo: {
        nameEn: companyNameEn,
        nameZh: companyNameZh || '',
        addressEn: companyAddressEn,
        addressZh: companyAddressZh || '',
      },
      shopInfo: {
        nameEn: shopNameEn,
        nameZh: shopNameZh || '',
        addressEn: shopAddressEn,
        addressZh: shopAddressZh || '',
      },
      contactInfo: {
        name: contactName,
        title: contactTitle,
        phone: contactPhone,
        fax: contactFax || '',
        email: contactEmail,
      },
      accountingContact: {
        name: accountingName || '',
        title: accountingTitle || '',
        phone: accountingPhone || '',
        fax: accountingFax || '',
        email: accountingEmail || '',
      },
      businessInfo: {
        registrationNumber: businessRegNumber,
        nature: businessNature,
        propertyStatus: propertyStatus,
      },
      staffName: staffName || '',
      businessRegistrationFileUrl: businessRegistrationFileUrl || '',
      totalOrders: 0,
      totalSpent: 0,
      membershipExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await adminDb.collection('users').doc(customUserId).set(newMember);

    return NextResponse.json({
      success: true,
      member: {
        id: customUserId,
        name: contactName,
        restaurantName: shopNameEn || shopNameZh,
        email: contactEmail,
        phone: contactPhone,
        membershipStatus: membershipStatus || 'active',
        joinDate: new Date().toISOString().split('T')[0],
        address: shopAddressEn || shopAddressZh,
        totalOrders: 0,
        totalSpent: 0,
        firebaseUid,
        companyInfo: newMember.companyInfo,
        shopInfo: newMember.shopInfo,
        contactInfo: newMember.contactInfo,
        accountingContact: newMember.accountingContact,
        businessInfo: newMember.businessInfo,
        staffName: staffName || '',
      },
    });
  } catch (error: any) {
    console.error('[POST /api/admin/members] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create member' },
      { status: 500 },
    );
  }
}

