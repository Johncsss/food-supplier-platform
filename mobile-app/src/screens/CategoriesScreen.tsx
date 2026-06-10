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
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { db } from '../../../shared/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Category } from '../../../shared/types';
import { categories as defaultCategories } from '../../../shared/products';

const { width } = Dimensions.get('window');
const cardWidth = width - 32; // Full width minus padding (1 row per category)

interface CategoryWithCount extends Category {
  productCount: number;
}

const CategoriesScreen = () => {
  const navigation = useNavigation();
  const { firebaseUser, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  // Check authentication every time screen is focused - show alert and redirect to login if not authenticated
  useFocusEffect(
    React.useCallback(() => {
      if (!authLoading && !firebaseUser) {
        // Show alert immediately when screen is focused
        Alert.alert(
          '需要登入',
          '此功能需要登入後才能使用，是否前往登入？',
          [
            { 
              text: '取消', 
              style: 'cancel', 
              onPress: () => (navigation as any).navigate('Home') 
            },
            {
              text: '前往登入',
              onPress: () => (navigation as any).navigate('Login'),
            },
          ]
        );
        // Navigate back to home immediately
        (navigation as any).navigate('Home');
      }
    }, [firebaseUser, authLoading, navigation])
  );

  // Don't fetch data if not authenticated
  useEffect(() => {
    if (!firebaseUser || authLoading) {
      return;
    }

    fetchCategories();
  }, [firebaseUser, authLoading]);

  // Fetch categories and their product counts from Firestore
  const fetchCategories = async () => {
    if (!firebaseUser) {
      return; // Don't fetch if not authenticated
    }
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
          minimumSpending: data.minimumSpending || undefined,
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

  // Show loading or redirect if not authenticated
  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={{ marginTop: 10, color: '#666' }}>載入中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!firebaseUser) {
    // This should not be reached due to navigation redirect, but show empty screen as fallback
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, color: '#666', textAlign: 'center' }}>
            請先登入以查看產品類別
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCategoryPress = (category: CategoryWithCount) => {
    navigation.navigate('CategoryProducts' as never, { category } as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <Text style={styles.title}>產品類別</Text>
        <Text style={styles.subtitle}>選擇您需要的產品類別</Text>
        <TouchableOpacity
          style={styles.favoritesButton}
          onPress={() => (navigation as any).navigate('Favorites')}
          activeOpacity={0.8}
        >
          <View style={styles.favoritesIcon}>
            <Ionicons name="heart-outline" size={20} color="#2563EB" />
          </View>
          <View style={styles.favoritesTextContainer}>
            <Text style={styles.favoritesLabel}>收藏產品</Text>
            <Text style={styles.favoritesDescription}>快速查看已收藏的產品</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>
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
              {category.imageUrl ? (
                <Image
                  source={{ uri: category.imageUrl }}
                  style={styles.categoryImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.categoryImagePlaceholder}>
                  <Ionicons name="image-outline" size={40} color="#9CA3AF" />
                </View>
              )}
              <View style={styles.categoryContent}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.itemCount}>{category.productCount} 個產品</Text>
                {category.minimumSpending && category.minimumSpending > 0 && (
                  <Text style={styles.minimumSpending}>最低消費: HKD$ {category.minimumSpending}</Text>
                )}
              </View>
              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={20} color="#10B981" />
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
    gap: 12,
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
  favoritesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3.84,
    elevation: 3,
  },
  favoritesIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  favoritesTextContainer: {
    flex: 1,
  },
  favoritesLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  favoritesDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  categoriesGrid: {
    padding: 16,
  },
  categoryCard: {
    width: cardWidth,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  categoryImage: {
    width: 100,
    height: 100,
    backgroundColor: '#f3f4f6',
  },
  categoryImagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryContent: {
    flex: 1,
    padding: 16,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  minimumSpending: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '600',
    marginBottom: 8,
  },
  arrowContainer: {
    paddingRight: 16,
    justifyContent: 'center',
  },
});

export default CategoriesScreen;