// Copy products collection from "(default)" database to "diamond" database
// Prerequisites:
// 1) Place Firebase service account JSON at project root as `serviceAccountKey.json`
// 2) Run: node scripts/copy-products-to-diamond.js

const admin = require('firebase-admin');

let serviceAccount;
try {
  serviceAccount = require('../serviceAccountKey.json');
} catch (e) {
  console.error('Missing serviceAccountKey.json in project root.');
  console.error('Download it from Firebase Console > Project Settings > Service Accounts.');
  process.exit(1);
}

// Initialize Firebase Admin for default database
const defaultApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'foodbooking-3ccec',
  databaseId: '(default)'
}, 'default');

// Initialize Firebase Admin for diamond database
const diamondApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'foodbooking-3ccec',
  databaseId: 'diamond'
}, 'diamond');

const defaultDb = admin.firestore(defaultApp);
const diamondDb = admin.firestore(diamondApp);

async function copyProductsToDiamond() {
  try {
    console.log('Starting copy from "(default)" database to "diamond" database...\n');

    // Read all products from default database
    const defaultProductsRef = defaultDb.collection('products');
    const snapshot = await defaultProductsRef.get();
    
    if (snapshot.empty) {
      console.log('❌ No products found in "(default)" database.');
      console.log('Please make sure products exist in the default database first.');
      process.exit(1);
    }

    console.log(`Found ${snapshot.size} products in "(default)" database.`);
    console.log('Copying to "diamond" database...\n');

    const diamondProductsRef = diamondDb.collection('products');

    let copiedCount = 0;
    const batch = diamondDb.batch();

    snapshot.forEach((doc) => {
      const productData = doc.data();
      const newDocRef = diamondProductsRef.doc(doc.id); // Use same document ID
      batch.set(newDocRef, productData);
      copiedCount++;

      if (copiedCount % 100 === 0) {
        console.log(`Prepared ${copiedCount} products...`);
      }
    });

    // Commit the batch
    await batch.commit();
    
    console.log(`\n✅ Successfully copied ${copiedCount} products!`);
    console.log('\nProducts are now available in:');
    console.log('  - "(default)" database (original)');
    console.log('  - "diamond" database (copy)');
    
  } catch (error) {
    console.error('❌ Error copying products:', error);
    process.exit(1);
  }
}

copyProductsToDiamond().then(() => {
  console.log('\n✅ Copy complete!');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

