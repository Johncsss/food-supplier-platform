const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function checkFirestoreUsers() {
  try {
    console.log('Signing in as admin@test.com to check Firestore users...');
    
    // Sign in first to get the user context
    const userCredential = await signInWithEmailAndPassword(auth, 'admin@test.com', 'testtest');
    const user = userCredential.user;
    
    console.log('✅ Signed in successfully');
    console.log(`User ID: ${user.uid}`);
    
    // Check users collection
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    console.log('\n📋 Users in Firestore:');
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`- ID: ${doc.id}`);
      console.log(`  Email: ${data.email}`);
      console.log(`  Name: ${data.name}`);
      console.log(`  Firebase UID: ${data.firebaseUid}`);
      console.log('');
    });
    
    await auth.signOut();
    console.log('✅ Sign out completed');
    
  } catch (error) {
    console.error('❌ Error checking Firestore users:', error.message);
    console.error('Full error:', error);
  }
}

// Run the script
checkFirestoreUsers().then(() => {
  console.log('\n🎉 Script completed!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
