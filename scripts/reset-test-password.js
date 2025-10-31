const admin = require('firebase-admin');

// You'll need to download the service account key from Firebase Console
// Place it in the project root as 'serviceAccountKey.json'
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'foodbooking-3ccec'
});

async function resetTestUserPassword() {
  const testEmail = 'test@test.com';
  const newPassword = 'test123';
  
  try {
    console.log('Resetting test user password...');
    
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(testEmail);
    console.log(`✅ Found user: ${userRecord.email} (UID: ${userRecord.uid})`);
    
    // Update the password
    await admin.auth().updateUser(userRecord.uid, {
      password: newPassword
    });
    
    console.log('✅ Password updated successfully!');
    console.log('\n📝 Test Account Credentials:');
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${newPassword}`);
    
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log('❌ User not found. Creating new test user...');
      
      // Create new user
      const userRecord = await admin.auth().createUser({
        email: testEmail,
        password: newPassword,
        displayName: 'Test User'
      });
      
      console.log('✅ Test user created successfully!');
      console.log(`User ID: ${userRecord.uid}`);
      console.log('\n📝 Test Account Credentials:');
      console.log(`Email: ${testEmail}`);
      console.log(`Password: ${newPassword}`);
      
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

// Run the script
resetTestUserPassword().then(() => {
  console.log('\n🎉 Script completed!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
