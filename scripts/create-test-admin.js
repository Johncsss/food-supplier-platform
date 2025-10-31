// Creates/updates an admin user with credentials: admin@test.com / testtest
// Prerequisites:
// 1) Place Firebase service account JSON at project root as `serviceAccountKey.json`
// 2) Run: node scripts/create-test-admin.js

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
});

async function createOrUpdateAdmin() {
  const email = 'admin@test.com';
  const password = 'testtest';

  try {
    console.log('Ensuring admin user exists...');

    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log(`Found user: ${userRecord.email} (UID: ${userRecord.uid})`);
      // Keep password in sync with requested value
      await admin.auth().updateUser(userRecord.uid, { password });
      console.log('Password updated.');
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        userRecord = await admin.auth().createUser({
          email,
          password,
          displayName: 'Test Admin',
        });
        console.log(`Created user: ${userRecord.email} (UID: ${userRecord.uid})`);
      } else {
        throw err;
      }
    }

    // Set custom admin claim
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    console.log('Custom claims set: { admin: true }');

    // Ensure Firestore user document exists (helps web UI load profile fields)
    const db = admin.firestore();
    const userRef = db.collection('users').doc(userRecord.uid);
    const now = admin.firestore.FieldValue.serverTimestamp();
    await userRef.set(
      {
        id: userRecord.uid,
        firebaseUid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName || 'Test Admin',
        restaurantName: 'Admin',
        phone: '',
        address: { street: '', city: '', state: '', zipCode: '' },
        membershipStatus: 'active',
        membershipExpiry: null,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
    console.log('Firestore user document ensured.');

    console.log('\n✅ Admin account ready:');
    console.log(`   Email: ${email}`);
    console.log('   Password: testtest');
    console.log('\nNote: Sign out and sign back in for claims to take effect.');
  } catch (error) {
    console.error('Failed to create/update admin:', error);
    process.exit(1);
  }
}

createOrUpdateAdmin().then(() => process.exit(0));

