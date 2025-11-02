import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamName, teamLeader, phone, email, password, status } = body;

    // Validate required fields
    if (!teamName || !teamLeader || !phone || !email || !password) {
      return NextResponse.json(
        { message: 'All fields are required' },
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
      displayName: teamLeader,
    });

    // Set custom claims for sales team role
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'salesTeam',
      teamName: teamName,
    });

    // Create sales team document in Firestore using Admin SDK
    const db = admin.firestore();
    const salesTeamRef = db.collection('salesTeams');
    const docRef = await salesTeamRef.add({
      firebaseUid: userRecord.uid,
      teamName,
      teamLeader,
      phone,
      email,
      memberCount: 0,
      status: status || 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      totalSales: 0,
    });

    // Create user document in users collection using Admin SDK
    const usersRef = db.collection('users');
    await usersRef.add({
      firebaseUid: userRecord.uid,
      email,
      name: teamLeader,
      role: 'salesTeam',
      teamName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      teamId: docRef.id,
      userId: userRecord.uid,
      message: 'Sales team created successfully',
    });
  } catch (error: any) {
    console.error('Error creating sales team:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { message: '此電子郵件已被使用' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: error.message || 'Failed to create sales team' },
      { status: 500 }
    );
  }
}

