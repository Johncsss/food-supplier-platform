// Check what products exist in the diamond database
// Prerequisites:
// 1) Place Firebase service account JSON at project root as `serviceAccountKey.json`
// 2) Run: node scripts/check-diamond-products.js

const admin = require('firebase-admin');

let serviceAccount;
try {
  serviceAccount = require('../serviceAccountKey.json');
} catch (e) {
  console.error('Missing serviceAccountKey.json in project root.');
  console.error('Download it from Firebase Console > Project Settings > Service Accounts.');
  process.exit(1);
}

// Initialize Firebase Admin for diamond database
const diamondApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'foodbooking-3ccec',
  databaseId: 'diamond'
}, 'diamond');

const diamondDb = admin.firestore(diamondApp);

async function checkDiamondProducts() {
  try {
    console.log('Checking products in "diamond" database...\n');

    const diamondProductsRef = diamondDb.collection('products');
    const snapshot = await diamondProductsRef.get();
    
    if (snapshot.empty) {
      console.log('❌ No products found in "diamond" database.');
      console.log('The database is empty or the collection does not exist.');
    } else {
      console.log(`✅ Found ${snapshot.size} products in "diamond" database.`);
      console.log('\nFirst few products:');
      
      let count = 0;
      snapshot.forEach((doc) => {
        if (count < 5) {
          const data = doc.data();
          console.log(`- ${doc.id}: ${data.name} (${data.category}) - $${data.price}`);
        }
        count++;
      });
      
      if (snapshot.size > 5) {
        console.log(`... and ${snapshot.size - 5} more products`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking diamond database:', error);
    process.exit(1);
  }
}

checkDiamondProducts().then(() => {
  console.log('\n✅ Check complete!');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
