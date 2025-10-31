const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

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

async function testOrderRetrieval() {
  try {
    console.log('Testing order retrieval...');
    
    // Sign in as the test user we created earlier
    const userCredential = await signInWithEmailAndPassword(auth, 'testorder@test.com', 'test123');
    const user = userCredential.user;
    
    console.log('✅ Signed in as:', user.email, '(UID:', user.uid, ')');
    
    // Check all orders in Firestore (should include the API-created order)
    console.log('\n📋 All orders in Firestore:');
    const allOrdersRef = collection(db, 'orders');
    const allOrdersSnapshot = await getDocs(allOrdersRef);
    
    console.log(`Found ${allOrdersSnapshot.docs.length} total orders:`);
    allOrdersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      console.log(`- Order ID: ${doc.id}`);
      console.log(`  User ID: ${data.userId}`);
      console.log(`  Email: ${data.userEmail || 'N/A'}`);
      console.log(`  Status: ${data.status}`);
      console.log(`  Total: ${data.totalAmount}`);
      console.log(`  Items: ${data.items?.length || 0}`);
      console.log(`  Source: ${data.source || 'unknown'}`);
      console.log(`  Created: ${data.createdAt?.toDate?.() || 'N/A'}`);
      console.log('');
    });
    
    // Check orders for this specific user
    console.log('\n🔍 Orders for current user:');
    const userOrdersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );
    
    const userOrdersSnapshot = await getDocs(userOrdersQuery);
    console.log(`Found ${userOrdersSnapshot.docs.length} orders for user ${user.uid}:`);
    userOrdersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      console.log(`- Order ID: ${doc.id}`);
      console.log(`  Status: ${data.status}`);
      console.log(`  Total: ${data.totalAmount}`);
      console.log(`  Items: ${data.items?.length || 0}`);
      console.log(`  Source: ${data.source || 'unknown'}`);
      console.log(`  Created: ${data.createdAt?.toDate?.() || 'N/A'}`);
      console.log('');
    });
    
    // Check if there are any orders with the test user ID we used in the API call
    console.log('\n🔍 Orders for test-user-id (from API call):');
    const testUserOrdersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', 'test-user-id')
    );
    
    const testUserOrdersSnapshot = await getDocs(testUserOrdersQuery);
    console.log(`Found ${testUserOrdersSnapshot.docs.length} orders for test-user-id:`);
    testUserOrdersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      console.log(`- Order ID: ${doc.id}`);
      console.log(`  Status: ${data.status}`);
      console.log(`  Total: ${data.totalAmount}`);
      console.log(`  Items: ${data.items?.length || 0}`);
      console.log(`  Source: ${data.source || 'unknown'}`);
      console.log(`  Created: ${data.createdAt?.toDate?.() || 'N/A'}`);
      console.log('');
    });
    
    await auth.signOut();
    console.log('✅ Sign out completed');
    
  } catch (error) {
    console.error('❌ Error testing order retrieval:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testOrderRetrieval();
