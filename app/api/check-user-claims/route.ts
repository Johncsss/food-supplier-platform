import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Get custom claims
    const customClaims = userRecord.customClaims || {};
    
    return NextResponse.json({
      success: true,
      uid: userRecord.uid,
      email: userRecord.email,
      customClaims: customClaims,
      displayName: userRecord.displayName,
    });
  } catch (error: any) {
    console.error('Error checking user claims:', error);
    
    return NextResponse.json(
      { message: error.message || 'Failed to check user claims' },
      { status: 500 }
    );
  }
}
