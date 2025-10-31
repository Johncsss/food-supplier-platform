// Sets admin custom claim for admin@test.com user
// Prerequisites:
// 1) Place Firebase service account JSON at project root as `serviceAccountKey.json`
// 2) Run: node scripts/set-admin-claim.js

const admin = require('firebase-admin');

let serviceAccount;
try {
  serviceAccount = require('../serviceAccountKey.json');
} catch (e) {
  console.error('Missing serviceAccountKey.json in project root.');
  console.error('Download it from Firebase Console > Project Settings > Service Accounts.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'foodbooking-3ccec',
  // IMPORTANT: Use "(default)" database for this project, NOT "diamond" database
  databaseId: '(default)'
});

async function setAdminClaim() {
  const email = 'admin@test.com';
  const uid = 'kMOVDljmF8a1N8WVwQYYjfBMmNd2';

  try {
    console.log(`Setting admin claim for ${email} (UID: ${uid})...`);

    // Try to get user by UID first
    let userRecord;
    try {
      userRecord = await admin.auth().getUser(uid);
      console.log(`Found user by UID: ${userRecord.email}`);
    } catch (err) {
      // If UID not found, try by email
      try {
        userRecord = await admin.auth().getUserByEmail(email);
        console.log(`Found user by email: ${userRecord.email} (UID: ${userRecord.uid})`);
      } catch (emailErr) {
        console.error(`User ${email} not found. Please create the user first.`);
        process.exit(1);
      }
    }

    // Set custom admin claim
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    console.log('✅ Custom admin claim set: { admin: true }');

    // Also ensure role field in Firestore
    const db = admin.firestore();
    const userRef = db.collection('users').doc(userRecord.uid);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      await userRef.update({
        role: 'admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Firestore user document updated with role: admin');
    } else {
      console.log('⚠️  No Firestore document found for this user.');
    }

    console.log('\n✅ Admin claim successfully set!');
    console.log('   Email:', userRecord.email);
    console.log('   UID:', userRecord.uid);
    console.log('\n⚠️  IMPORTANT: User must sign out and sign back in for the claim to take effect!');
  } catch (error) {
    console.error('Failed to set admin claim:', error);
    process.exit(1);
  }
}

setAdminClaim().then(() => process.exit(0));

