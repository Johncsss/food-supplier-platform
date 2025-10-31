import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { db } from '../../../shared/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Category } from '../../../shared/types';
import { categories as defaultCategories } from '../../../shared/products';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 columns with margins

interface CategoryWithCount extends Category {
  productCount: number;
}

const CategoriesScreen = () => {
  const navigation = useNavigation();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories and their product counts from Firestore
  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      // Fetch categories from Firestore (same as website admin)
      const categoriesRef = collection(db, 'categories');
      const categoriesSnapshot = await getDocs(query(categoriesRef, orderBy('name')));
      const fetchedCategories: Category[] = categoriesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          imageUrl: data.imageUrl || '',
          subcategories: data.subcategories || [],
        };
      });
      
      // Get product counts for each category
      const productsRef = collection(db, 'products');
      const productsSnapshot = await getDocs(productsRef);
      
      const categoryMap = new Map<string, number>();
      productsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const categoryName = data.category;
        if (categoryName) {
          categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1);
        }
      });

      // Use Firestore categories if available, otherwise fallback to default categories
      const categoriesToUse = fetchedCategories.length > 0 ? fetchedCategories : defaultCategories;
      
      // Add product counts to categories
      const categoriesWithCount: CategoryWithCount[] = categoriesToUse.map(category => ({
        ...category,
        productCount: categoryMap.get(category.name) || 0
      }));

      setCategories(categoriesWithCount);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to default categories on error
      const categoriesWithCount: CategoryWithCount[] = defaultCategories.map(category => ({
        ...category,
        productCount: 0
      }));
      setCategories(categoriesWithCount);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case '蔬菜/淨菜加工類':
        return 'leaf-outline';
      case '糧油乾貨類':
        return 'basket-outline';
      case '進口凍肉類':
        return 'restaurant-outline';
      case '進口海產類':
        return 'fish-outline';
      case '半加工及預製食品類':
        return 'cube-outline';
      case '烘焙甜品類':
        return 'bread-outline';
      case '飲品材料類':
        return 'cafe-outline';
      case '清潔用品類':
        return 'sparkles-outline';
      case '酒精類':
        return 'wine-outline';
      default:
        return 'grid-outline';
    }
  };

  const handleCategoryPress = (category: CategoryWithCount) => {
    navigation.navigate('CategoryProducts' as never, { category } as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <Text style={styles.title}>產品類別</Text>
        <Text style={styles.subtitle}>選擇您需要的產品類別</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.categoriesGrid}>
          {categories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={getCategoryIcon(category.name) as any}
                  size={32}
                  color="#10B981"
                />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.itemCount}>{category.productCount} 個產品</Text>
              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={16} color="#10B981" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  categoriesGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: cardWidth,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#ecfdf5',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  arrowContainer: {
    alignItems: 'flex-end',
  },
});

export default CategoriesScreen;