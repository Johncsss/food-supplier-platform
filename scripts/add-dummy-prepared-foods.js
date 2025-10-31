const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com/`,
  });
}

const db = admin.firestore();

async function addDummyProducts() {
  try {
    const productsRef = db.collection('products');
    const now = admin.firestore.FieldValue.serverTimestamp();

    const items = [
      { name: '預製紅燒牛腩', subcategory: '預製菜', price: 220, unit: '份', stockQuantity: 40 },
      { name: '半成品宮保雞丁', subcategory: '半成品', price: 180, unit: '份', stockQuantity: 60 },
      { name: '調理包-番茄牛肉麵', subcategory: '調理包', price: 95, unit: '包', stockQuantity: 120 },
      { name: '預製糖醋里脊', subcategory: '預製菜', price: 185, unit: '份', stockQuantity: 55 },
      { name: '半成品金沙南瓜', subcategory: '半成品', price: 130, unit: '份', stockQuantity: 70 },
      { name: '調理包-咖哩雞', subcategory: '調理包', price: 88, unit: '包', stockQuantity: 140 },
      { name: '預製魚香肉絲', subcategory: '預製菜', price: 175, unit: '份', stockQuantity: 65 },
      { name: '半成品黑椒牛柳', subcategory: '半成品', price: 210, unit: '份', stockQuantity: 45 },
    ];

    for (const item of items) {
      await productsRef.add({
        name: item.name,
        description: `${item.name}，加熱即食，方便快捷`,
        category: '半加工及預製食品類',
        subcategory: item.subcategory,
        price: item.price,
        unit: item.unit,
        minOrderQuantity: 1,
        stockQuantity: item.stockQuantity,
        imageUrl: '',
        isAvailable: true,
        supplier: '測試供應商',
        createdAt: now,
        updatedAt: now,
      });
      console.log(`✅ Added: ${item.name}`);
    }

    console.log('\n🎉 Added 8 dummy products to 半加工及預製食品類');
  } catch (err) {
    console.error('❌ Error adding dummy products:', err);
    process.exitCode = 1;
  }
}

addDummyProducts().then(() => process.exit(0));


