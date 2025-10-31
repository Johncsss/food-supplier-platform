// Syncs products from shared/products.ts to Firestore
// Run this once to populate the products collection
// Prerequisites:
// 1) Place Firebase service account JSON at project root as `serviceAccountKey.json`
// 2) Run: node scripts/sync-products-to-firestore.js

const admin = require('firebase-admin');
const path = require('path');

// Import products from shared folder
const { products } = require('../shared/products.ts');

let serviceAccount;
try {
  serviceAccount = require('../serviceAccountKey.json');
} catch (e) {
  console.error('Missing serviceAccountKey.json in project root.');
  console.error('Download it from Firebase Console > Project Settings > Service Accounts.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'foodbooking-3ccec',
  // IMPORTANT: Use "(default)" database for this project, NOT "diamond" database
  databaseId: '(default)'
});

const db = admin.firestore();

async function syncProducts() {
  try {
    console.log(`Syncing ${products.length} products to Firestore...`);
    
    const batch = db.batch();
    let count = 0;

    for (const product of products) {
      // Create product document with auto-generated ID
      const productRef = db.collection('products').doc();
      
      const productData = {
        name: product.name,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory,
        price: product.price,
        unit: product.unit,
        minOrderQuantity: product.minOrderQuantity,
        stockQuantity: product.stockQuantity,
        imageUrl: product.imageUrl,
        isAvailable: product.isAvailable,
        supplier: product.supplier,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      batch.set(productRef, productData);
      count++;

      // Firestore batch limit is 500 operations
      if (count % 500 === 0) {
        await batch.commit();
        console.log(`Synced ${count} products...`);
      }
    }

    // Commit any remaining operations
    if (count % 500 !== 0) {
      await batch.commit();
    }

    console.log(`\n✅ Successfully synced ${count} products to Firestore!`);
    console.log('\nProducts are now available in:');
    console.log('  - Web admin panel at /admin/products');
    console.log('  - Mobile app product screens');
    
  } catch (error) {
    console.error('Error syncing products:', error);
    process.exit(1);
  }
}

syncProducts().then(() => process.exit(0));

