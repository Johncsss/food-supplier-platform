const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword, signOut } = require('firebase/auth');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDeJS7QqvPpKsAAKSOeUFP_0poNGGrWswg",
  authDomain: "foodbooking-3ccec.firebaseapp.com",
  projectId: "foodbooking-3ccec",
  storageBucket: "foodbooking-3ccec.firebasestorage.app",
  messagingSenderId: "1079191792865",
  appId: "1:1079191792865:web:8ab4fd90d3121e764c1ba0",
  measurementId: "G-N9NKY9YQ38"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createOrUpdateAdminUser() {
  const adminEmail = 'admin@test.com';
  const adminPassword = 'testtest';
  
  try {
    console.log('Creating/updating admin user account...');
    
    // Try to create the user account
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const user = userCredential.user;
      
      console.log('✅ Admin user created successfully!');
      console.log(`User ID: ${user.uid}`);
      console.log(`Email: ${user.email}`);
      
      // Create user document in Firestore
      const customUserId = `USER-ADMIN-0001-0001`;
      const userData = {
        id: customUserId,
        firebaseUid: user.uid,
        email: adminEmail,
        name: 'Test Admin',
        restaurantName: 'Admin',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: ''
        },
        membershipStatus: 'active',
        membershipExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(doc(db, 'users', customUserId), userData);
      console.log('✅ Admin user document created in Firestore');
      
    } catch (createError) {
      if (createError.code === 'auth/email-already-in-use') {
        console.log('⚠️  Admin user already exists. Updating password...');
        
        // Sign in with current password to update it
        try {
          // Try to sign in first
          await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
          console.log('✅ Password is already set to testtest');
        } catch (signInError) {
          console.log('❌ Could not sign in with current password. You may need to reset the password manually in Firebase Console.');
          console.log('Error:', signInError.message);
        }
      } else {
        throw createError;
      }
    }
    
    await signOut(auth);
    console.log('✅ Admin user setup completed!');
    console.log('\n📝 Admin Account Credentials:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('\n⚠️  Note: Admin custom claims need to be set via Firebase Admin SDK');
    console.log('   The account will be created but won\'t have admin privileges until');
    console.log('   you set the custom claim { admin: true }');
    
  } catch (error) {
    console.error('❌ Error creating/updating admin user:', error.message);
    console.error('Full error:', error);
  }
}

// Run the script
createOrUpdateAdminUser().then(() => {
  console.log('\n🎉 Script completed!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
