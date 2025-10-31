import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl
} from 'react-native';
import { useCart } from '../hooks/useCart';
import { Product } from '../../../shared/types';
import { db } from '../../../shared/firebase';
import { collection, getDocs } from 'firebase/firestore';

const ProductsScreen: React.FC = () => {
  const { addToCart, totalItems } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch products from Firestore
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsRef = collection(db, 'products');
      const snapshot = await getDocs(productsRef);
      const fetchedProducts: Product[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          category: data.category || '',
          subcategory: data.subcategory || '',
          price: data.price || 0,
          unit: data.unit || '',
          minOrderQuantity: data.minOrderQuantity || 1,
          stockQuantity: data.stockQuantity || 0,
          imageUrl: data.imageUrl || '',
          isAvailable: data.isAvailable ?? true,
          supplier: data.supplier || '',
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        };
      });
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('錯誤', '無法載入產品資料');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    // Show success feedback
    Alert.alert(
      '已加入購物車',
      `${product.name} 已成功加入購物車`,
      [{ text: '確定' }]
    );
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>HKD$ {item.price} / {item.unit}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={(e) => {
            e.stopPropagation();
            handleAddToCart(item);
          }}
        >
          <Text style={styles.addButtonText}>加入購物車</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <Text style={styles.title}>產品</Text>
        {totalItems > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{totalItems}</Text>
          </View>
        )}
      </View>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.productList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#10B981']}
            tintColor="#10B981"
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>沒有產品資料</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  cartBadge: {
    backgroundColor: '#10B981',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  productList: {
    padding: 20,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productInfo: {
    padding: 15,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default ProductsScreen; 