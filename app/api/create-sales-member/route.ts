import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, position, commissionRate, password, salesTeamId } = body;

    // Validate required fields
    if (!name || !email || !phone || !position || commissionRate === undefined || !password) {
      return NextResponse.json(
        { message: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });

    // Set custom claims for sales member role
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'salesMember',
      salesTeamId: salesTeamId,
      name: name,
    });

    const db = admin.firestore();

    // Create sales member document in Firestore
    const salesMemberRef = db.collection('salesMembers');
    const docRef = await salesMemberRef.add({
      firebaseUid: userRecord.uid,
      name,
      email,
      phone,
      position,
      commissionRate,
      salesTeamId: salesTeamId || null,
      totalSales: 0,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      joinedDate: new Date().toISOString().split('T')[0],
    });

    // Create user document in users collection
    await db.collection('users').add({
      firebaseUid: userRecord.uid,
      email,
      name,
      role: 'salesMember',
      salesTeamId: salesTeamId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update the sales team's member count if salesTeamId is provided
    if (salesTeamId) {
      try {
        const teamQuery = await db.collection('salesTeams')
          .where('firebaseUid', '==', salesTeamId)
          .limit(1)
          .get();
        
        if (!teamQuery.empty) {
          const teamDoc = teamQuery.docs[0];
          const currentCount = teamDoc.data().memberCount || 0;
          await teamDoc.ref.update({
            memberCount: currentCount + 1
          });
        }
      } catch (countError) {
        console.error('Error updating member count:', countError);
        // Don't fail the whole operation if count update fails
      }
    }

    return NextResponse.json({
      success: true,
      memberId: docRef.id,
      userId: userRecord.uid,
      message: 'Sales member created successfully',
    });
  } catch (error: any) {
    console.error('Error creating sales member:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { message: '此電子郵件已被使用' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: error.message || 'Failed to create sales member' },
      { status: 500 }
    );
  }
}
