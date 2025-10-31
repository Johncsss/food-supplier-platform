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

async function testAuthFlow() {
  try {
    console.log('🔍 Testing authentication flow...');
    
    // Test with the user we created earlier
    const testEmail = 'testorder@test.com';
    const testPassword = 'test123';
    
    console.log('Signing in...');
    const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
    const user = userCredential.user;
    
    console.log('✅ Signed in successfully:');
    console.log(`   Email: ${user.email}`);
    console.log(`   UID: ${user.uid}`);
    console.log(`   Display Name: ${user.displayName || 'None'}`);
    
    console.log('\n🔍 Testing order query (same as dashboard)...');
    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );
    
    const querySnapshot = await getDocs(ordersQuery);
    console.log(`Found ${querySnapshot.docs.length} orders for user ${user.uid}`);
    
    if (querySnapshot.docs.length > 0) {
      querySnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. Order ID: ${doc.id}`);
        console.log(`   Status: ${data.status}`);
        console.log(`   Total: ${data.totalAmount}`);
        console.log(`   Items: ${data.items?.length || 0}`);
        console.log(`   Source: ${data.source || 'unknown'}`);
        console.log(`   Created: ${data.createdAt?.toDate?.() || 'unknown'}`);
        console.log('');
      });
    } else {
      console.log('❌ No orders found for this user!');
      
      // Check if there are any orders with similar user IDs
      console.log('\n🔍 Checking for orders with different user IDs...');
      const allOrdersRef = collection(db, 'orders');
      const allOrdersSnapshot = await getDocs(allOrdersRef);
      
      console.log(`Total orders in database: ${allOrdersSnapshot.docs.length}`);
      allOrdersSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. Order ${doc.id}: userId="${data.userId}", email="${data.userEmail}"`);
      });
    }
    
    console.log('\n🔍 Testing user document lookup...');
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('✅ User document found:');
      console.log(`   Document ID: ${userDoc.id}`);
      console.log(`   Firebase UID: ${userData.firebaseUid}`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Points: ${userData.memberPoints || 0}`);
    } else {
      console.log('❌ No user document found!');
    }
    
    await auth.signOut();
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testAuthFlow();
