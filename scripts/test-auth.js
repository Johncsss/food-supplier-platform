// Simple test to check Firebase authentication
// Run with: node scripts/test-auth.js

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

async function testAuth() {
  console.log('Testing Firebase Authentication...');
  
  // Test 1: Try existing admin account
  console.log('\n1. Testing john@admin.com...');
  try {
    const userCredential = await signInWithEmailAndPassword(auth, 'john@admin.com', 'testtest');
    console.log('✅ john@admin.com login successful');
    console.log('   UID:', userCredential.user.uid);
    console.log('   Email:', userCredential.user.email);
    
    // Check custom claims
    const idTokenResult = await userCredential.user.getIdTokenResult();
    console.log('   Admin claim:', idTokenResult.claims.admin);
    
    await auth.signOut();
  } catch (error) {
    console.log('❌ john@admin.com login failed:', error.message);
  }
  
  // Test 2: Try requested admin account
  console.log('\n2. Testing admin@test.com...');
  try {
    const userCredential = await signInWithEmailAndPassword(auth, 'admin@test.com', 'testtest');
    console.log('✅ admin@test.com login successful');
    console.log('   UID:', userCredential.user.uid);
    console.log('   Email:', userCredential.user.email);
    
    // Check custom claims
    const idTokenResult = await userCredential.user.getIdTokenResult();
    console.log('   Admin claim:', idTokenResult.claims.admin);
    
    await auth.signOut();
  } catch (error) {
    console.log('❌ admin@test.com login failed:', error.message);
  }
  
  console.log('\nDone.');
}

testAuth().catch(console.error);
