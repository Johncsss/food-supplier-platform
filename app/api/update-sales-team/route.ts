import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('@/../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com/`
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId, teamName, teamLeader, phone, email, status, newPassword } = body;

    // Validate required fields
    if (!teamId || !teamName || !teamLeader || !phone || !email) {
      return NextResponse.json(
        { message: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    const db = admin.firestore();

    // Get the sales team document to find the Firebase UID
    const salesTeamDoc = await db.collection('salesTeams').doc(teamId).get();
    
    if (!salesTeamDoc.exists) {
      return NextResponse.json(
        { message: 'Sales team not found' },
        { status: 404 }
      );
    }

    const salesTeamData = salesTeamDoc.data();
    const firebaseUid = salesTeamData?.firebaseUid;

    if (!firebaseUid) {
      return NextResponse.json(
        { message: 'Sales team Firebase UID not found' },
        { status: 400 }
      );
    }

    // Update Firebase Auth user if password is being changed
    if (newPassword && newPassword.length >= 6) {
      try {
        await admin.auth().updateUser(firebaseUid, {
          password: newPassword,
          displayName: teamLeader,
        });
      } catch (authError: any) {
        console.error('Error updating Firebase Auth user:', authError);
        return NextResponse.json(
          { message: 'Failed to update user password: ' + authError.message },
          { status: 500 }
        );
      }
    } else if (newPassword && newPassword.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Update custom claims
    await admin.auth().setCustomUserClaims(firebaseUid, {
      role: 'salesTeam',
      teamName: teamName,
    });

    // Update sales team document in Firestore
    await db.collection('salesTeams').doc(teamId).update({
      teamName,
      teamLeader,
      phone,
      email,
      status: status || 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update user document in users collection
    const usersQuery = await db.collection('users')
      .where('firebaseUid', '==', firebaseUid)
      .limit(1)
      .get();

    if (!usersQuery.empty) {
      const userDoc = usersQuery.docs[0];
      await userDoc.ref.update({
        name: teamLeader,
        role: 'salesTeam',
        teamName,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Sales team updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating sales team:', error);
    
    return NextResponse.json(
      { message: error.message || 'Failed to update sales team' },
      { status: 500 }
    );
  }
}
