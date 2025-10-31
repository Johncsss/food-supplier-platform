const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

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

async function checkExistingAdmin() {
  console.log('Checking if john@admin.com exists and has admin privileges...');
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, 'john@admin.com', 'testtest');
    console.log('✅ john@admin.com login successful');
    console.log('   UID:', userCredential.user.uid);
    console.log('   Email:', userCredential.user.email);
    
    // Check custom claims
    const idTokenResult = await userCredential.user.getIdTokenResult();
    console.log('   Admin claim:', idTokenResult.claims.admin);
    
    if (idTokenResult.claims.admin) {
      console.log('✅ This account HAS admin privileges!');
      console.log('   You can use john@admin.com / testtest to access /admin');
    } else {
      console.log('❌ This account does NOT have admin privileges');
    }
    
    await auth.signOut();
  } catch (error) {
    console.log('❌ john@admin.com login failed:', error.message);
    console.log('   This account does not exist or has wrong password');
  }
}

checkExistingAdmin().catch(console.error);
