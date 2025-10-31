import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useCart } from '../hooks/useCart';
import { Product } from '../../../shared/types';
import { db } from '../../../shared/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

const { width } = Dimensions.get('window');

type ProductDetailRouteParams = {
  ProductDetail: {
    productId: string;
  };
};

type ProductDetailRouteProp = RouteProp<ProductDetailRouteParams, 'ProductDetail'>;

interface Supplier {
  id: string;
  companyName: string;
  name: string;
}

const ProductDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ProductDetailRouteProp>();
  const { addToCart, state } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const { productId } = route.params;
  
  // Get the category of items in the cart
  const cartCategory = state.items.length > 0 ? state.items[0].category : null;

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch product
      const productRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        const data = productSnap.data();
        const productData: Product = {
          id: productSnap.id,
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
        setProduct(productData);
      } else {
        Alert.alert('錯誤', '找不到產品資料');
        navigation.goBack();
      }
      
      // Fetch suppliers
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const fetchedSuppliers: Supplier[] = snapshot.docs
        .filter((doc) => {
          const data = doc.data();
          return data.role === 'supplier';
        })
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            companyName: data.companyName || data.name || '',
            name: data.name || '',
          };
        });
      setSuppliers(fetchedSuppliers);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('錯誤', '無法載入產品資料');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    addToCart(product);
    Alert.alert(
      '已加入購物車',
      `${product.name} 已成功加入購物車`,
      [{ text: '確定' }]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>載入中...</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>載入產品資料中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>產品詳情</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>找不到產品資料</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>產品詳情</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: product.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'
            }}
            style={styles.productImage}
            resizeMode="cover"
            onError={() => console.log('Failed to load image for product:', product.name)}
          />
        </View>

        {/* Product Information */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>HKD$ {product.price}</Text>
            <Text style={styles.productUnit}>/{product.unit}</Text>
          </View>

          {/* Product Description */}
          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>產品描述</Text>
              <Text style={styles.productDescription}>{product.description}</Text>
            </View>
          )}

          {/* Product Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>產品資訊</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>類別</Text>
              <Text style={styles.detailValue}>{product.category}</Text>
            </View>

            {product.subcategory && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>子類別</Text>
                <Text style={styles.detailValue}>{product.subcategory}</Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>供應商</Text>
              <Text style={styles.detailValue}>
                {product.supplier 
                  ? (suppliers.find(s => s.id === product.supplier)?.companyName || suppliers.find(s => s.companyName === product.supplier)?.companyName || product.supplier)
                  : '-'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>庫存數量</Text>
              <Text style={styles.detailValue}>{product.stockQuantity} {product.unit}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>最小訂購量</Text>
              <Text style={styles.detailValue}>{product.minOrderQuantity} {product.unit}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>狀態</Text>
              <Text style={[
                styles.detailValue,
                { color: product.isAvailable ? '#10B981' : '#EF4444' }
              ]}>
                {product.isAvailable ? '有庫存' : '缺貨'}
              </Text>
            </View>
          </View>
        </View>

        {/* Category Restriction Warning */}
        {cartCategory && product && product.category !== cartCategory && (
          <View style={styles.warningBanner}>
            <Ionicons name="information-circle" size={20} color="#2563EB" />
            <Text style={styles.warningText}>
              目前購物車包含 {cartCategory} 類別的產品。不同類別的產品不能加入購物車，除非清空購物車中的所有產品。
            </Text>
          </View>
        )}

        {/* Add to Cart Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.addToCartButton,
              (!product.isAvailable || (cartCategory && product && product.category !== cartCategory)) && styles.disabledButton
            ]}
            onPress={handleAddToCart}
            disabled={!product.isAvailable || (cartCategory && product && product.category !== cartCategory)}
          >
            <Ionicons name="cart" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.addToCartText}>
              {product.isAvailable && (!cartCategory || product.category === cartCategory) 
                ? '加入購物車' 
                : cartCategory && product && product.category !== cartCategory
                ? '不同類別不能加入' 
                : '暫時缺貨'}
            </Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 34,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
  },
  productUnit: {
    fontSize: 16,
    color: '#666',
    marginLeft: 5,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  productDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 20,
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 30,
  },
  addToCartButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  buttonIcon: {
    marginRight: 8,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    marginLeft: 8,
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
});

export default ProductDetailScreen;
