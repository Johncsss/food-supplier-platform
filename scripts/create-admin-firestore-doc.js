const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

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

async function createAdminFirestoreDoc() {
  try {
    console.log('Signing in as admin@test.com to create Firestore document...');
    
    // Sign in first to get the user context
    const userCredential = await signInWithEmailAndPassword(auth, 'admin@test.com', 'testtest');
    const user = userCredential.user;
    
    console.log('✅ Signed in successfully');
    console.log(`User ID: ${user.uid}`);
    
    // Create user document in Firestore with the Firebase UID as document ID
    const userData = {
      id: user.uid,
      firebaseUid: user.uid,
      email: 'admin@test.com',
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
    
    // Try to create the document with the Firebase UID as the document ID
    await setDoc(doc(db, 'users', user.uid), userData);
    console.log('✅ Admin user document created in Firestore');
    
    await auth.signOut();
    console.log('✅ Sign out completed');
    
  } catch (error) {
    console.error('❌ Error creating admin Firestore document:', error.message);
    console.error('Full error:', error);
  }
}

// Run the script
createAdminFirestoreDoc().then(() => {
  console.log('\n🎉 Script completed!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
