import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json(
        { message: 'Team ID is required' },
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

    if (firebaseUid) {
      // Delete Firebase Auth user
      try {
        await admin.auth().deleteUser(firebaseUid);
      } catch (authError) {
        console.error('Error deleting Firebase Auth user:', authError);
        // Continue even if auth user deletion fails
      }

      // Delete user document from users collection
      const usersQuery = await db.collection('users')
        .where('firebaseUid', '==', firebaseUid)
        .limit(1)
        .get();

      if (!usersQuery.empty) {
        await usersQuery.docs[0].ref.delete();
      }
    }

    // Delete sales team document
    await db.collection('salesTeams').doc(teamId).delete();

    return NextResponse.json({
      success: true,
      message: 'Sales team deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting sales team:', error);
    
    return NextResponse.json(
      { message: error.message || 'Failed to delete sales team' },
      { status: 500 }
    );
  }
}
