import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  FlatList,
  Alert,
  RefreshControl,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useCart } from '../hooks/useCart';
import { Product, Category } from '../../../shared/types';
import { db } from '../../../shared/firebase';
import { collection, getDocs, query, where, orderBy, doc, setDoc } from 'firebase/firestore';
import { categories as defaultCategories } from '../../../shared/products';
import { useAuth } from '../hooks/useAuth';

type CategoryProductsRouteProp = RouteProp<{
  CategoryProducts: {
    category: Category;
  };
}, 'CategoryProducts'>;

const CategoryProductsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<CategoryProductsRouteProp>();
  const { category } = route.params;
  const { addToCart, items, state, updateQuantity } = useCart();
  const { firebaseUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingQuantity, setEditingQuantity] = useState('');
  
  // Get the category of items in the cart
  const cartCategory = state.items.length > 0 ? state.items[0].category : null;

  // Helper function to get subcategories for the current category
  const getSubcategoriesForCategory = (categoryName: string): string[] => {
    const categoryData = categories.find(cat => cat.name === categoryName);
    return categoryData ? categoryData.subcategories : [];
  };

  // Fetch categories from Firestore
  const fetchCategories = async () => {
    try {
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
      
      // Use Firestore categories if available, otherwise fallback to default categories
      const categoriesToUse = fetchedCategories.length > 0 ? fetchedCategories : defaultCategories;
      setCategories(categoriesToUse);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to default categories on error
      setCategories(defaultCategories);
    }
  };

  // Fetch products from Firestore
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsRef = collection(db, 'products');
      const q = query(productsRef, where('category', '==', category.name));
      const snapshot = await getDocs(q);
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
    fetchCategories();
    fetchProducts();
  }, [category.name]);

  // Load current user's favorites once
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!firebaseUser?.uid) {
        setFavoriteIds(new Set());
        return;
      }
      try {
        const favRef = collection(db, 'users', firebaseUser.uid, 'favorites');
        const snap = await getDocs(favRef);
        const ids = new Set<string>(snap.docs.map(d => d.id));
        setFavoriteIds(ids);
      } catch (e) {
        console.log('Failed to load favorites', e);
      }
    };
    fetchFavorites();
  }, [firebaseUser?.uid]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubcategory = !selectedSubcategory || product.subcategory === selectedSubcategory;
    return matchesSearch && matchesSubcategory;
  });

  const getCartQuantity = (productId: string): number => {
    const cartItem = items.find(item => item.productId === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  const openQuantityModal = (product: Product) => {
    const currentQty = getCartQuantity(product.id);
    const initialQty = currentQty > 0 ? currentQty : product.minOrderQuantity || 1;
    setEditingProduct(product);
    setEditingQuantity(String(initialQty));
    setQuantityModalVisible(true);
  };

  const closeQuantityModal = () => {
    setQuantityModalVisible(false);
    setEditingProduct(null);
    setEditingQuantity('');
  };

  const confirmQuantityChange = () => {
    if (!editingProduct) return;
    const parsed = parseInt(editingQuantity, 10);
    const nextQty = isNaN(parsed) ? 0 : parsed;

    if (nextQty <= 0) {
      updateQuantity(editingProduct.id, 0);
    } else {
      updateQuantity(editingProduct.id, nextQty);
    }

    closeQuantityModal();
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  const handleAddFavorite = async (product: Product) => {
    if (!firebaseUser?.uid) {
      Alert.alert('請先登入', '請先登入以加入收藏');
      return;
    }
    if (favoriteIds.has(product.id)) return;
    try {
      const favRef = doc(db, 'users', firebaseUser.uid, 'favorites', product.id);
      await setDoc(favRef, {
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        category: product.category,
        createdAt: new Date(),
      }, { merge: true });
      setFavoriteIds(prev => new Set(prev).add(product.id));
      Alert.alert('成功', '已加入收藏');
    } catch (e) {
      console.log('Failed to add favorite', e);
      Alert.alert('錯誤', '加入收藏失敗');
    }
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const cartQuantity = getCartQuantity(item.id);
    const isDifferentCategory = cartCategory && item.category !== cartCategory;

    const displayImage = item.imageUrl || (item.imageUrls?.[0] ?? '');

    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      >
        <View style={styles.productThumbnailWrapper}>
          {displayImage ? (
            <Image
              source={{ uri: displayImage }}
              style={styles.productThumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.productThumbnail, styles.productThumbnailPlaceholder]}>
              <Ionicons name="image" size={24} color="#9CA3AF" />
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <View style={styles.productFooter}>
            <Text style={styles.productPrice}>HKD$ {item.price} / {item.unit}</Text>
            <View style={styles.cartSection}>
              {cartQuantity > 0 && (
                <>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      const nextQty = Math.max(0, cartQuantity - 1);
                      updateQuantity(item.id, nextQty);
                    }}
                  >
                    <Ionicons name="remove" size={20} color="#111827" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quantityBadge}
                    onPress={(e) => {
                      e.stopPropagation();
                      openQuantityModal(item);
                    }}
                  >
                    <Text style={styles.quantityText}>{cartQuantity}</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={[styles.addButton, isDifferentCategory && styles.addButtonDisabled]}
                onPress={(e) => {
                  e.stopPropagation();
                  if (!isDifferentCategory) {
                    handleAddToCart(item);
                  }
                }}
                disabled={isDifferentCategory}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          {favoriteIds.has(item.id) ? (
            <View style={styles.favoriteStatusPill}>
              <Text style={styles.favoriteStatusText}>已加入收藏</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.favoriteIconButton}
              onPress={(e) => {
                e.stopPropagation();
                handleAddFavorite(item);
              }}
            >
              <Ionicons
                name="heart-outline"
                size={18}
                color="#10B981"
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category.name}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜尋產品..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
      </View>

      {/* Category Restriction Warning */}
      {cartCategory && (
        <View style={styles.warningBanner}>
          <Ionicons name="information-circle" size={20} color="#2563EB" />
          <Text style={styles.warningText}>
            目前購物車包含 {cartCategory} 類別的產品。不同類別的產品不能加入購物車，除非清空購物車中的所有產品。
          </Text>
        </View>
      )}

      {/* Subcategory Filter */}
      {getSubcategoriesForCategory(category.name).length > 0 && (
        <View style={styles.subcategoryContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subcategoryScroll}
          >
            <TouchableOpacity
              style={[
                styles.subcategoryButton,
                !selectedSubcategory && styles.subcategoryButtonActive
              ]}
              onPress={() => setSelectedSubcategory('')}
            >
              <Text style={[
                styles.subcategoryButtonText,
                !selectedSubcategory && styles.subcategoryButtonTextActive
              ]}>
                全部
              </Text>
            </TouchableOpacity>
            {getSubcategoriesForCategory(category.name).map((subcategory) => (
              <TouchableOpacity
                key={subcategory}
                style={[
                  styles.subcategoryButton,
                  selectedSubcategory === subcategory && styles.subcategoryButtonActive
                ]}
                onPress={() => setSelectedSubcategory(subcategory)}
              >
                <Text style={[
                  styles.subcategoryButtonText,
                  selectedSubcategory === subcategory && styles.subcategoryButtonTextActive
                ]}>
                  {subcategory}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.productsList}
        showsVerticalScrollIndicator={false}
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
              <Text style={styles.emptyText}>此類別沒有產品</Text>
            </View>
          ) : null
        }
      />

      {/* Quantity Edit Modal (outside FlatList to avoid focus bug) */}
      <Modal
        visible={quantityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeQuantityModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>修改數量</Text>
            {editingProduct && (
              <Text style={styles.modalProductName}>{editingProduct.name}</Text>
            )}
            <TextInput
              style={styles.modalQuantityInput}
              keyboardType="number-pad"
              value={editingQuantity}
              onChangeText={setEditingQuantity}
              placeholder="輸入數量"
            />
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={closeQuantityModal}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonCancelText]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={confirmQuantityChange}
              >
                <Text style={styles.modalButtonText}>確認</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
  searchContainer: {
    position: 'relative',
    marginHorizontal: 20,
    marginVertical: 15,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    paddingLeft: 40,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
  },
  subcategoryContainer: {
    marginHorizontal: 20,
    marginBottom: 15,
  },
  subcategoryScroll: {
    paddingRight: 20,
  },
  subcategoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  subcategoryButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  subcategoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  subcategoryButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  productsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productThumbnailWrapper: {
    marginRight: 15,
  },
  productThumbnail: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  productThumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  cartSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityBadge: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    minWidth: 24,
    paddingHorizontal: 6,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  quantityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#10B981',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.5,
  },
  removeButton: {
    backgroundColor: '#F3F4F6',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  favoriteIconButton: {
    marginTop: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteStatusPill: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  favoriteStatusText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  modalProductName: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
  },
  modalQuantityInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  modalButtonCancel: {
    backgroundColor: '#E5E7EB',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonCancelText: {
    color: '#111827',
  },
});

export default CategoryProductsScreen; 