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
import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';

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
  const { addToCart, state, getItemQuantity, updateQuantity } = useCart();
  const { firebaseUser } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);

  const { productId } = route.params;
  
  // Get the category of items in the cart
  const cartCategory = state.items.length > 0 ? state.items[0].category : null;
  const cartQuantity = product ? getItemQuantity(product.id) : 0;

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
      
      // Check favorite status
      if (firebaseUser?.uid) {
        try {
          const favDoc = await getDoc(doc(db, 'users', firebaseUser.uid, 'favorites', productId));
          setIsFavorited(favDoc.exists());
        } catch {}
      }
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
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (!product) return;
    
    if (newQuantity <= 0) {
      updateQuantity(product.id, 0);
      return;
    }

    if (newQuantity < product.minOrderQuantity) {
      updateQuantity(product.id, 0);
      return;
    }

    updateQuantity(product.id, newQuantity);
  };

  const handleAddFavorite = async () => {
    if (!product) return;
    if (!firebaseUser?.uid) {
      Alert.alert('請先登入', '請先登入以加入收藏');
      return;
    }
    if (isFavorited) return;
    try {
      await setDoc(doc(db, 'users', firebaseUser.uid, 'favorites', product.id), {
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        category: product.category,
        createdAt: new Date(),
      }, { merge: true });
      setIsFavorited(true);
      Alert.alert('成功', '已加入收藏');
    } catch (e) {
      console.log('Failed to add favorite', e);
      Alert.alert('錯誤', '加入收藏失敗');
    }
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
        <TouchableOpacity onPress={handleAddFavorite} disabled={isFavorited} style={styles.favHeaderBtn}>
          <Ionicons name="heart-outline" size={22} color={isFavorited ? '#9CA3AF' : '#10B981'} />
        </TouchableOpacity>
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

        {/* Add to Cart / Quantity Controls */}
        <View style={styles.buttonContainer}>
          {cartQuantity > 0 ? (
            <View style={styles.quantityContainer}>
              <View style={styles.quantityRow}>
                <Text style={styles.quantityLabel}>數量</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    onPress={() => handleQuantityChange(cartQuantity - 1)}
                    style={[styles.quantityButton, cartQuantity <= 0 && styles.quantityButtonDisabled]}
                    disabled={cartQuantity <= 0}
                  >
                    <Ionicons name="remove" size={20} color={cartQuantity <= 0 ? "#9CA3AF" : "#333"} />
                  </TouchableOpacity>
                  <Text style={[styles.quantityValue, { marginHorizontal: 15 }]}>{cartQuantity}</Text>
                  <TouchableOpacity
                    onPress={() => handleQuantityChange(cartQuantity + 1)}
                    style={styles.quantityButton}
                  >
                    <Ionicons name="add" size={20} color="#333" />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={styles.viewCartButton}
                onPress={() => (navigation as any).navigate('MainTabs', { screen: 'Cart' })}
              >
                <Ionicons name="cart" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.viewCartText}>查看購物車</Text>
              </TouchableOpacity>
            </View>
          ) : (
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
          )}
          {/* Favorite Button - directly below Add to Cart */}
          {isFavorited ? (
            <View style={[styles.favoriteButton, styles.favoriteButtonDisabled]}>
              <Ionicons name="heart-outline" size={18} color="#9CA3AF" style={styles.buttonIcon} />
              <Text style={[styles.favoriteText, { color: '#9CA3AF' }]}>已加入收藏</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={handleAddFavorite}
              disabled={isFavorited}
            >
              <Ionicons name="heart-outline" size={18} color="#10B981" style={styles.buttonIcon} />
              <Text style={styles.favoriteText}>加入收藏</Text>
            </TouchableOpacity>
          )}
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
  favHeaderBtn: {
    padding: 5,
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
  favoriteButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  favoriteButtonDisabled: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  favoriteText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  quantityContainer: {
    width: '100%',
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  quantityLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: '#F9FAFB',
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  viewCartButton: {
    backgroundColor: '#6B7280',
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
  viewCartText: {
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
