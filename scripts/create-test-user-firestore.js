const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection, query, where, getDocs } = require('firebase/firestore');

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
const db = getFirestore(app);

async function createTestUserInFirestore() {
  const testEmail = 'test@test.com';
  
  try {
    console.log('Creating test user in Firestore...');
    
    // Check if user already exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', testEmail));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      console.log('✅ Test user already exists in Firestore');
      const existingUser = querySnapshot.docs[0].data();
      console.log('User ID:', querySnapshot.docs[0].id);
      console.log('User data:', JSON.stringify(existingUser, null, 2));
      return;
    }
    
    // Create new test user
    const customUserId = `USER-TEST-0001-0001`;
    const userData = {
      id: customUserId,
      firebaseUid: customUserId, // For compatibility
      email: testEmail,
      name: 'Test User',
      restaurantName: 'Test Restaurant',
      phone: '+1234567890',
      address: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345'
      },
      membershipStatus: 'active',
      membershipExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await setDoc(doc(db, 'users', customUserId), userData);
    
    console.log('✅ Test user created successfully in Firestore!');
    console.log('User ID:', customUserId);
    console.log('Email:', testEmail);
    console.log('Password: test123 (set in Firebase Auth if needed)');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    console.error('Full error:', error);
  }
}

// Run the script
createTestUserInFirestore().then(() => {
  console.log('\n🎉 Script completed!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
