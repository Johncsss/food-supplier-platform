const admin = require('firebase-admin');

// Default categories data
const categories = [
  {
    id: '1',
    name: '蔬菜/淨菜加工類',
    description: '新鮮蔬菜及淨菜加工產品',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
    subcategories: ['葉菜類', '根莖類', '淨菜加工']
  },
  {
    id: '2',
    name: '糧油乾貨類',
    description: '各種糧油和乾貨產品',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
    subcategories: ['米麵', '食用油', '調味料', '乾貨']
  },
  {
    id: '3',
    name: '進口凍肉類',
    description: '優質進口冷凍肉類',
    imageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1fdc82f?w=400',
    subcategories: ['牛肉', '豬肉', '雞肉', '羊肉']
  },
  {
    id: '4',
    name: '進口海產類',
    description: '新鮮進口海產',
    imageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400',
    subcategories: ['魚類', '蝦類', '貝類', '蟹類']
  },
  {
    id: '5',
    name: '半加工及預製食品類',
    description: '半加工和預製食品',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    subcategories: ['半成品', '預製菜', '調理包']
  },
  {
    id: '6',
    name: '烘焙甜品類',
    description: '烘焙產品和甜品',
    imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
    subcategories: ['麵包', '蛋糕', '甜點', '餅乾']
  },
  {
    id: '7',
    name: '飲品材料類',
    description: '各種飲品和材料',
    imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400',
    subcategories: ['茶葉', '咖啡', '果汁', '調味品']
  },
  {
    id: '8',
    name: '清潔用品類',
    description: '清潔和衛生用品',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc0?w=400',
    subcategories: ['清潔劑', '消毒用品', '紙製品']
  },
  {
    id: '9',
    name: '酒精類',
    description: '各種酒精飲品',
    imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400',
    subcategories: ['啤酒', '紅酒', '白酒', '烈酒']
  }
];

// Initialize Firebase Admin SDK
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function initializeCategories() {
  try {
    console.log('Initializing categories in Firestore...');
    
    // Check if categories already exist
    const categoriesSnapshot = await db.collection('categories').get();
    
    if (categoriesSnapshot.empty) {
      console.log('No categories found in Firestore. Adding default categories...');
      
      // Add each category to Firestore
      for (const category of categories) {
        const { id, ...categoryData } = category;
        await db.collection('categories').add({
          ...categoryData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Added category: ${category.name}`);
      }
      
      console.log('✅ Successfully initialized all categories in Firestore!');
    } else {
      console.log(`Found ${categoriesSnapshot.size} existing categories in Firestore. Skipping initialization.`);
      
      // List existing categories
      categoriesSnapshot.forEach(doc => {
        console.log(`- ${doc.data().name}`);
      });
    }
  } catch (error) {
    console.error('❌ Error initializing categories:', error);
  } finally {
    process.exit(0);
  }
}

initializeCategories();
